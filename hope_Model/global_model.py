import os
import glob
import json
import numpy as np
from sklearn.mixture import GaussianMixture
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix
import joblib

# 0) 스키마/피처 이름 정의 (추론/수집과 동일해야 함)
EXPECTED_SCHEMA_ID = "v3_iris_7_features"

CANONICAL_FEATURE_NAMES = [
    'EAR_L','EAR_R','HEAD_PITCH',
    'GL_H','GR_H','GL_V','GR_V'
]
EXPECTED_DIM = 7

# 수집 JSON에서 들어올 수 있는 다양한 별칭을 정규화 표기로 매핑
ALIASES = {
    'ear_l': 'EAR_L', 'ear_r': 'EAR_R', 'mar': 'MAR',
    'cheek': 'CHEEK_DIST', 'cheek_dist': 'CHEEK_DIST',
    'face_h': 'FACE_HEIGHT', 'face_height': 'FACE_HEIGHT',
    'pitch': 'HEAD_PITCH', 'head_pitch': 'HEAD_PITCH',
    'gl_h': 'GL_H', 'gL_h': 'GL_H', 'GL_h': 'GL_H', 'GL_H': 'GL_H',
    'gr_h': 'GR_H', 'gR_h': 'GR_H', 'GR_h': 'GR_H', 'GR_H': 'GR_H',
    'gl_v': 'GL_V', 'gL_v': 'GL_V', 'GL_v': 'GL_V', 'GL_V': 'GL_V',
    'gr_v': 'GR_V', 'gR_v': 'GR_V', 'GR_v': 'GR_V', 'GR_V': 'GR_V',
}

def canonicalize_and_reorder(X, feat_names_in):
    """
    feat_names_in(원본 순서)을 CANONICAL_FEATURE_NAMES 순서로 재정렬한 X를 반환.
    이름은 ALIASES로 정규화.
    """
    # 1) 입력 이름 정규화
    normed = []
    for name in feat_names_in:
        key = name if name in ALIASES else name.lower()
        if key not in ALIASES:
            raise ValueError(f"알 수 없는 feature 이름: '{name}'. ALIASES를 갱신하세요.")
        normed.append(ALIASES[key])

    # 2) 정규화 결과 -> 인덱스 매핑
    name_to_idx = {n: i for i, n in enumerate(normed)}

    # 3) CANONICAL 순서대로 인덱스 뽑기
    try:
        reorder_idx = [name_to_idx[cn] for cn in CANONICAL_FEATURE_NAMES]
    except KeyError as e:
        raise ValueError(f"필수 피처가 누락되었습니다: {e.args[0]} (입력 feat_names 확인)")

    X_reordered = X[:, reorder_idx]
    return X_reordered, normed, reorder_idx

# 1) 여러 파일에서 데이터 로드 & 누적
DATA_FOLDER = "Global"
FILE_GLOB = "*.json"

all_X = []
all_y = []
file_stats = []

json_paths = sorted(glob.glob(os.path.join(DATA_FOLDER, FILE_GLOB)))
if not json_paths:
    raise FileNotFoundError(f"'{DATA_FOLDER}/{FILE_GLOB}' 패턴에 맞는 파일이 없습니다.")

skipped = 0
for p in json_paths:
    try:
        with open(p, 'r', encoding='utf-8') as f:
            data = json.load(f)

        X = np.array(data.get('features', []), dtype=float)
        y = np.array(data.get('labels', []), dtype=int)

        if X.size == 0 or y.size == 0 or len(X) != len(y):
            print(f"[건너뜀] {os.path.basename(p)}: features/labels 비어있거나 길이 불일치")
            skipped += 1
            continue

        schema_id = data.get('feature_schema_id')
        feat_names_in = data.get('feat_names')

        # 스키마 검증
        if schema_id is None:
            print(f"[경고] {os.path.basename(p)}: feature_schema_id 없음 (수집 코드 최신화 권장)")
        elif schema_id != EXPECTED_SCHEMA_ID:
            print(f"[건너뜀] {os.path.basename(p)}: 스키마 불일치 (data='{schema_id}', expected='{EXPECTED_SCHEMA_ID}')")
            skipped += 1
            continue

        # 차원 검증
        if X.shape[1] != EXPECTED_DIM:
            print(f"[건너뜀] {os.path.basename(p)}: 기대 차원 {EXPECTED_DIM}가 아님 (현재 {X.shape[1]})")
            skipped += 1
            continue

        if not feat_names_in:
            print(f"[건너뜀] {os.path.basename(p)}: 'feat_names' 없음 (수집 코드에서 feat_names 저장 필요)")
            skipped += 1
            continue

        X_std, _, _ = canonicalize_and_reorder(X, feat_names_in)

        all_X.append(X_std)
        all_y.append(y)

        file_stats.append((
            os.path.basename(p),
            len(X_std),
            int(np.sum(y == 1)),
            int(np.sum(y == 0)),
        ))
    except Exception as e:
        print(f"[건너뜀] {os.path.basename(p)} 처리 중 오류: {e}")
        skipped += 1

if not all_X:
    raise RuntimeError("모든 파일이 스킵되어 학습할 데이터가 없습니다.")

X = np.vstack(all_X)
y = np.concatenate(all_y)

print("====== 글로벌 데이터 요약 ======")
for fname, n, n_pos, n_neg in file_stats:
    print(f"{fname:>30s} | n={n:4d} | pos={n_pos:4d} | neg={n_neg:4d}")
print("--------------------------------")
print(f"총 샘플: {len(X)}, 양성(집중=1): {np.sum(y==1)}, 음성(이탈=0): {np.sum(y==0)}")
print(f"최종 학습 순서: {CANONICAL_FEATURE_NAMES}")
if skipped:
    print(f"(참고) 스킵된 파일: {skipped}개")


# 2) 스케일링
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 3) 클래스별 GMM 학습 (BIC로 n_components 자동 선택)
def fit_gmm_bic(X_class, comp_range=(1, 6), covariance_type='full', random_state=0):
    best_gmm, best_bic = None, np.inf
    best_k = None
    for k in range(comp_range[0], comp_range[1] + 1):
        try:
            gmm = GaussianMixture(
                n_components=k,
                covariance_type=covariance_type,
                reg_covar=1e-6,
                random_state=random_state,
                n_init=3,
                max_iter=500
            )
            gmm.fit(X_class)
            bic = gmm.bic(X_class)
            if bic < best_bic:
                best_bic, best_gmm, best_k = bic, gmm, k
        except Exception as e:
            print(f"GMM(k={k}) 학습 중 오류: {e}")
    return best_gmm, best_k, best_bic

X_pos = X_scaled[y == 1]
X_neg = X_scaled[y == 0]

gmm_pos = gmm_neg = None
k_pos = k_neg = None
bic_pos = bic_neg = None

if len(X_pos) >= 5:
    gmm_pos, k_pos, bic_pos = fit_gmm_bic(X_pos, comp_range=(1, 6))
    print(f"[POS] 최적 구성요소 수: {k_pos}, BIC: {bic_pos:.1f}")
else:
    print("[POS] 데이터가 너무 적어 GMM을 학습하지 못했습니다.")

if len(X_neg) >= 5:
    gmm_neg, k_neg, bic_neg = fit_gmm_bic(X_neg, comp_range=(1, 6))
    print(f"[NEG] 최적 구성요소 수: {k_neg}, BIC: {bic_neg:.1f}")
else:
    print("[NEG] 데이터가 너무 적어 GMM을 학습하지 못했습니다.")

if gmm_pos is None and gmm_neg is None:
    raise RuntimeError("양/음성 GMM을 모두 학습하지 못했습니다. 수집 데이터를 늘려주세요.")


# 4) 사전확률(클래스 prior) 포함 점수
prior_pos = (len(X_pos) + 1e-6) / (len(X_scaled) + 1e-6*2)
prior_neg = (len(X_neg) + 1e-6) / (len(X_scaled) + 1e-6*2)
log_prior_pos = np.log(prior_pos)
log_prior_neg = np.log(prior_neg)

def decision_scores(Xs):
    pos_scores = np.full(len(Xs), -np.inf)
    neg_scores = np.full(len(Xs), -np.inf)
    if gmm_pos is not None:
        pos_scores = gmm_pos.score_samples(Xs) + log_prior_pos
    if gmm_neg is not None:
        neg_scores = gmm_neg.score_samples(Xs) + log_prior_neg
    return pos_scores, neg_scores

pos_scores, neg_scores = decision_scores(X_scaled)
y_pred = (pos_scores >= neg_scores).astype(int)


# 5) 훈련 성능 리포트
acc = accuracy_score(y, y_pred)
prec, rec, f1, _ = precision_recall_fscore_support(y, y_pred, average='binary', zero_division=0)
cm = confusion_matrix(y, y_pred)
print("\n=== Train Performance (same data) ===")
print(f"Accuracy : {acc:.3f}")
print(f"Precision: {prec:.3f}   Recall: {rec:.3f}   F1: {f1:.3f}")
print("Confusion Matrix [ [TN, FP], [FN, TP] ]")
print(cm)


# 5.5) POS-Only 대비: 경험적 5% 임계치
oneclass_thresh_emp = None
if gmm_pos is not None and gmm_neg is None:
    oneclass_thresh_emp = np.percentile(pos_scores[y == 1], 5.0)
    print(f"[One-Class] 경험적 POS score 5% 임계치: {oneclass_thresh_emp:.3f}")


# 6) 모델 저장 (스키마/피처 메타 포함)
bundle = {
    'scaler': scaler,
    'gmm_pos': gmm_pos,
    'gmm_neg': gmm_neg,
    'log_prior_pos': log_prior_pos,
    'log_prior_neg': log_prior_neg,
    'feature_dim': X.shape[1],
    'feature_names': CANONICAL_FEATURE_NAMES,
    'feature_schema_id': EXPECTED_SCHEMA_ID,
    'k_pos': k_pos,
    'k_neg': k_neg,
    'bic_pos': float(bic_pos) if bic_pos is not None else None,
    'bic_neg': float(bic_neg) if bic_neg is not None else None,
    'prior_pos': float(prior_pos),
    'prior_neg': float(prior_neg),
    'oneclass_thresh_emp': float(oneclass_thresh_emp) if oneclass_thresh_emp is not None else None,
    'training_summary': {
        'files_used': [fs[0] for fs in file_stats],
        'per_file_counts': [{'file': fs[0], 'n': fs[1], 'pos': fs[2], 'neg': fs[3]} for fs in file_stats],
        'skipped_files': skipped,
        'total_samples': int(len(X)),
        'total_pos': int(np.sum(y == 1)),
        'total_neg': int(np.sum(y == 0)),
        'train_metrics': {'acc': float(acc), 'prec': float(prec), 'rec': float(rec), 'f1': float(f1)}
    }
}
joblib.dump(bundle, "gmm_focus_global_model.joblib")
print("\n모델이 'gmm_focus_global_model.joblib' 로 저장되었습니다.")