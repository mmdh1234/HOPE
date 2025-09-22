import joblib, json, numpy as np
from sklearn.mixture import GaussianMixture
from sklearn.utils.validation import check_is_fitted
import sys
import io 
from dotenv import load_dotenv
import os
from pymongo import MongoClient


def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)

# 0) 인자 확인
if len(sys.argv) <= 1:
    eprint("Error: No userId provided.")
    sys.exit(1)
userId = sys.argv[1]

# 1) 전역 모델 불러오기 및 기본 스키마 검증
try:
    global_bundle = joblib.load("gmm_focus_global_model.joblib")
except FileNotFoundError:
    eprint("오류: 'gmm_focus_global_model.joblib' 파일을 찾을 수 없습니다.")
    sys.exit(1)
except Exception as e:
    eprint(f"오류: 전역 모델 로드 중 예외 - {e}")
    sys.exit(1)

# 기본 기대값
expected_dim = 7
expected_schema_id = "v3_iris_7_features"

if global_bundle.get('feature_dim') != expected_dim:
    eprint(f"오류: 전역 모델 차원 불일치: {global_bundle.get('feature_dim')} vs {expected_dim}")
    sys.exit(1)
if global_bundle.get('feature_schema_id') != expected_schema_id:
    eprint(f"오류: 전역 모델 스키마 불일치: {global_bundle.get('feature_schema_id')} vs {expected_schema_id}")
# 필요한 전역 변수들
scaler = global_bundle.get('scaler')
gmm_pos_global = global_bundle.get('gmm_pos')
gmm_neg_global = global_bundle.get('gmm_neg')
if scaler is None or gmm_pos_global is None:
    eprint("오류: 전역 모델에 필요한 항목(scaler 또는 gmm_pos)이 없습니다.")
    sys.exit(1)

# 2) DB 연결 및 사용자 모델 / 사용자 데이터 로드
load_dotenv()
mongo_uri = os.getenv("DB_CONNECT")
if not mongo_uri:
    eprint("오류: 환경변수 DB_CONNECT가 설정되어 있지 않습니다.")
    sys.exit(1)

client = None
try:
    client = MongoClient(mongo_uri)
    db = client['Signup']

    # 2-1) 사용자 맞춤(개인) 모델 가져오기 (있다면 그것을 파인튜닝 베이스로 사용)
    user_models_col = db['user_models']
    existing_model_doc = user_models_col.find_one({'userId': userId})

    bundle_to_finetune = None
    if existing_model_doc and existing_model_doc.get('modelData'):
        try:
            model_bytes = existing_model_doc['modelData']
            buffer = io.BytesIO(model_bytes)
            buffer.seek(0)
            bundle_to_finetune = joblib.load(buffer)
            print(f"기존 사용자 맞춤 모델을 불러왔습니다. (UserId: {userId})")
        except Exception as e:
            eprint(f"경고: 기존 개인 모델 로드 실패 - {e}; 전역 모델로 대체하여 진행합니다.")
            bundle_to_finetune = global_bundle.copy()
    else:
        bundle_to_finetune = global_bundle.copy()
        print("기존 개인 모델이 없어 전역 모델을 파인튜닝 베이스로 사용합니다.")

    # 2-2) 사용자 데이터 로드: user_data를 저장한 컬렉션명이 환경마다 다를 수 있으니 몇 가지 후보를 시도
    user_data = None
    for colname in ('user_data', 'userdata', 'users', 'user_records'):
        col = db[colname]
        doc = col.find_one({'userId': userId})
        if doc:
            user_data = doc
            print(f"사용자 데이터 로드: 컬렉션 '{colname}'에서 가져왔습니다.")
            break

    if not user_data:
        raise FileNotFoundError(f"사용자 ID '{userId}'에 대한 데이터가 DB에서 발견되지 않았습니다. 먼저 user_data.py로 데이터를 저장하세요.")

    # 2-3) 사용자 데이터 스키마 검증
    if user_data.get('feature_schema_id') != expected_schema_id:
        raise ValueError("사용자 데이터 스키마가 전역 모델과 일치하지 않습니다. 데이터를 다시 수집하세요.")

    # 특성/라벨 추출
    Xu = np.array(user_data.get("features", []), dtype=float)
    yu = np.array(user_data.get("labels", []), dtype=int)

    if Xu.size == 0 or yu.size == 0:
        raise ValueError("사용자 데이터에 features 또는 labels가 비어 있습니다.")

    # 스케일링: 기존 번들(개인 또는 전역)의 scaler 사용
    if 'scaler' in bundle_to_finetune and bundle_to_finetune['scaler'] is not None:
        scaler = bundle_to_finetune['scaler']
    Xu_scaled = scaler.transform(Xu)

except Exception as e:
    eprint(f"오류: 모델/데이터 로드 실패 - {e}")
    if client:
        client.close()
    sys.exit(1)

# 3) POS 샘플 추출 및 최소 샘플 체크
try:
    Xu_pos = Xu_scaled[yu == 1]
    if len(Xu_pos) < 5:
        raise ValueError(f"POS 샘플이 너무 적습니다 (n={len(Xu_pos)}). 더 수집하세요.")
except Exception as e:
    eprint(f"오류: POS 샘플 처리 실패 - {e}")
    if client:
        client.close()
    sys.exit(1)

# 4) 사용자 GMM 초기화 및 파인튜닝
try:
    # gmm_pos_global은 전역 GMM (초기값 얻기 위해)
    base_gmm_pos = bundle_to_finetune.get('gmm_pos', gmm_pos_global)
    n_comp_user = min(gmm_pos_global.n_components, max(1, len(Xu_pos)))
    # 준비된 초기값(있으면 사용)
    means_init = getattr(base_gmm_pos, 'means_', None)
    weights_init = getattr(gmm_pos_global, 'weights_', None)
    precisions_init = getattr(gmm_pos_global, 'precisions_', None)

    gmm_pos_user = GaussianMixture(
        n_components=n_comp_user,
        covariance_type=gmm_pos_global.covariance_type,
        reg_covar=1e-5,
        max_iter=50,
        n_init=1,
        random_state=0,
        init_params="random" if means_init is None else "kmeans",
        # only pass *_init if they exist and match required shapes
        means_init=(means_init[:n_comp_user].copy() if means_init is not None else None),
        weights_init=(weights_init[:n_comp_user].copy() if weights_init is not None else None),
        precisions_init=(precisions_init[:n_comp_user].copy() if precisions_init is not None else None)
    )

    gmm_pos_user.fit(Xu_pos)
    check_is_fitted(gmm_pos_user)
    print("사용자 GMM 파인튜닝 완료.")
except Exception as e:
    eprint(f"오류: 사용자 GMM 파인튜닝 실패 - {e}")
    if client:
        client.close()
    sys.exit(1)

# 5) One-class 임계치 갱신
oneclass_thresh = bundle_to_finetune.get('oneclass_thresh_emp', None)
try:
    # gmm_neg은 global 혹은 bundle_to_finetune에 있을 수 있음
    gmm_neg = bundle_to_finetune.get('gmm_neg', gmm_neg_global)
    if gmm_neg is None:
        synth, _ = gmm_pos_user.sample(400)
        log_prior_pos = bundle_to_finetune.get('log_prior_pos', global_bundle.get('log_prior_pos', 0.0))
        synth_scores = gmm_pos_user.score_samples(synth) + float(log_prior_pos)
        oneclass_thresh = float(np.percentile(synth_scores, 5.0))
        print(f"[One-Class] 새 임계치 계산: {oneclass_thresh:.3f}")
    else:
        print("[One-Class] 기존 gmm_neg 존재 — 임계치 갱신은 건너뜁니다.")
except Exception as e:
    eprint(f"[One-Class] 임계치 갱신 중 오류: {e}")

# 6) 사용자 번들(모델) 저장: 기존 개인 모델이 있으면 덮어쓰기
try:
    # 저장할 번들을 'bundle_to_finetune' 기반으로 업데이트하여 기존 메타데이터 보존
    user_bundle = bundle_to_finetune.copy()
    user_bundle['gmm_pos'] = gmm_pos_user
    user_bundle['oneclass_thresh_emp'] = oneclass_thresh

    # 직렬화
    buffer = io.BytesIO()
    joblib.dump(user_bundle, buffer)
    buffer.seek(0)
    model_data = buffer.getvalue()

    # DB 저장
    collection = db['user_models']
    result = collection.update_one(
        {'userId': userId},
        {'$set': {'modelData': model_data}},
        upsert=True
    )
    print(f"\n사용자 맞춤 GMM이 MongoDB에 저장 완료. (UserId: {userId})")
    print(json.dumps({"status":"ok","userId": userId, "model_saved": True}), flush=True)

except Exception as e:
    eprint(f"오류: MongoDB에 모델 저장 실패 - {e}")
    sys.exit(1)
finally:
    if client:
        client.close()