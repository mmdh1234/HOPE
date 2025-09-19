import joblib, json, numpy as np
from sklearn.mixture import GaussianMixture
from sklearn.utils.validation import check_is_fitted
import sys
import io 
from dotenv import load_dotenv
import os
from pymongo import MongoClient


# 1) 전역 모델 불러오기 및 스키마 검증
try:
    global_bundle = joblib.load("gmm_focus_global_model.joblib")
    scaler = global_bundle['scaler']
    gmm_pos_global = global_bundle['gmm_pos']
    gmm_neg = global_bundle['gmm_neg']
    
    # 7개 특징에 맞게 차원 및 스키마 검증
    expected_dim = 7
    expected_schema_id = "v3_iris_7_features"
    if global_bundle.get('feature_dim') != expected_dim:
        raise ValueError(f"전역 모델 차원 불일치: {global_bundle.get('feature_dim')} vs {expected_dim}")
    if global_bundle.get('feature_schema_id') != expected_schema_id:
        raise ValueError(f"전역 모델 스키마 불일치: {global_bundle.get('feature_schema_id')} vs {expected_schema_id}")

except FileNotFoundError:
    print("오류: 'gmm_focus_global_model.joblib' 파일을 찾을 수 없습니다.", file=sys.stderr)
    sys.exit(1)
except ValueError as e:
    print(f"오류: 전역 모델 로드 실패 - {e}", file=sys.stderr)
    sys.exit(1)

# 사용자 ID를 명령줄 인자로 받음
if len(sys.argv) > 1:
    userId = sys.argv[1]
else:
    print("Error: No userId provided.", file=sys.stderr)
    sys.exit(1)

# 2) 사용자 데이터 로드: 파일에서 읽지 않고 MongoDB에서 불러오기
try:
    load_dotenv()  # .env 파일 로드

    mongo_uri = os.getenv("DB_CONNECT")
    client = MongoClient(mongo_uri)
    db = client['Signup']
    collection = db['user_data']
    
    user_data = collection.find_one({'userId': userId})
    
    if not user_data:
        raise FileNotFoundError(f"사용자 ID '{userId}'에 대한 데이터를 찾을 수 없습니다.")
    
    if user_data.get('feature_schema_id') != expected_schema_id:
        raise ValueError("사용자 데이터 스키마가 전역 모델과 일치하지 않습니다. 데이터를 다시 수집하세요.")

    Xu = np.array(user_data["features"], dtype=float)
    yu = np.array(user_data["labels"], dtype=int)
    Xu_scaled = scaler.transform(Xu)
    
except Exception as e:
    print(f"오류: MongoDB에서 사용자 데이터 로드 실패 - {e}", file=sys.stderr)
    sys.exit(1)
finally:
    client.close()

# 3) POS 데이터만 추출
Xu_pos = Xu_scaled[yu == 1]
if len(Xu_pos) < 5:
    raise ValueError(f"POS 샘플이 너무 적습니다 (n={len(Xu_pos)}). 더 수집하세요.")

# 4) 사용자 GMM 모델 초기화 및 재학습 (파인튜닝)
# 글로벌 GMM의 n_components와 POS 샘플 수 중 더 작은 값으로 설정
n_comp_user = min(gmm_pos_global.n_components, len(Xu_pos))
if n_comp_user < 1:
    n_comp_user = 1

gmm_pos_user = GaussianMixture(
    n_components=n_comp_user,
    covariance_type=gmm_pos_global.covariance_type,
    reg_covar=1e-5,
    max_iter=20,
    n_init=1,
    random_state=0,
    init_params="random",
    means_init=gmm_pos_global.means_[:n_comp_user].copy(),
    weights_init=gmm_pos_global.weights_[:n_comp_user].copy(),
    precisions_init=(getattr(gmm_pos_global, "precisions_", None)[:n_comp_user].copy()
                     if hasattr(gmm_pos_global, "precisions_") and gmm_pos_global.precisions_ is not None
                     else None)
)

gmm_pos_user.fit(Xu_pos)
check_is_fitted(gmm_pos_user)

# 5) One-class 임계치 갱신
oneclass_thresh = global_bundle.get('oneclass_thresh_emp')
if gmm_neg is None:
    try:
        synth, _ = gmm_pos_user.sample(400)
        synth_scores = gmm_pos_user.score_samples(synth) + global_bundle['log_prior_pos']
        oneclass_thresh = float(np.percentile(synth_scores, 5.0))
        print(f"[One-Class] 갱신 임계치: {oneclass_thresh:.3f}")
    except Exception as e:
        print(f"[One-Class] 임계치 갱신 실패: {e}")

# 6) 사용자 맞춤 모델 저장: MongoDB Atlas에 저장
try:
    mongo_uri = os.getenv("DB_CONNECT")  
    client = MongoClient(mongo_uri)
    db = client['Signup'] 
    collection = db['user_models']  # 모델 저장 컬렉션

    # 모델 번들 생성
    user_bundle = global_bundle.copy()
    user_bundle['gmm_pos'] = gmm_pos_user
    user_bundle['oneclass_thresh_emp'] = oneclass_thresh

    # 모델을 메모리 버퍼에 덤프 (이진 데이터)
    buffer = io.BytesIO()
    joblib.dump(user_bundle, buffer)
    model_data = buffer.getvalue()
    
    # MongoDB에 저장 (기존 모델이 있으면 덮어쓰기)
    result = collection.update_one(
        {'userId': userId},
        {'$set': {'modelData': model_data}},
        upsert=True
    )

    print(f"\n사용자 맞춤 GMM이 MongoDB에 저장 완료. (UserId: {userId})")
    print(json.dumps({"status":"ok","userId": userId, "model_saved": True}), flush=True)
    
except Exception as e:
    print(f"오류: MongoDB에 모델 저장 실패 - {e}", file=sys.stderr)
    sys.exit(1)
finally:
    client.close()