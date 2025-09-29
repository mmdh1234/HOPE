# HOPE/hope_Model/export_model_to_json.py
import joblib
import json
import numpy as np

# joblib 파일 경로
MODEL_PATH = './gmm_focus_model_user.joblib'
# 출력할 JSON 파일 경로
OUTPUT_PATH = './gmm_focus_model_user.json'

try:
    # joblib 파일 불러오기
    model_data = joblib.load(MODEL_PATH)
    
    # 모델에서 필요한 파라미터 추출
    # Python 모델의 구조에 맞춰 안전하게 데이터를 가져옵니다.
    scaler = model_data.get('scaler')
    gmm_pos = model_data.get('gmm_pos')
    gmm_neg = model_data.get('gmm_neg')
    
    gmm_model_json = {
        "scaler": {
            "mean": scaler.mean_.tolist(),
            "std": scaler.scale_.tolist()
        } if scaler is not None else None,
        "gmm_pos": {
            "means": gmm_pos.means_.tolist(),
            "covariances": gmm_pos.covariances_.tolist(),
            "weights": gmm_pos.weights_.tolist()
        } if gmm_pos is not None else None,
        "gmm_neg": {
            "means": gmm_neg.means_.tolist(),
            "covariances": gmm_neg.covariances_.tolist(),
            "weights": gmm_neg.weights_.tolist()
        } if gmm_neg is not None else None,
        "log_prior_pos": model_data.get('log_prior_pos'),
        "log_prior_neg": model_data.get('log_prior_neg'),
        "oneclass_thresh": model_data.get('oneclass_thresh'),
    }

    # 파라미터를 JSON 파일로 저장
    with open(OUTPUT_PATH, 'w') as f:
        json.dump(gmm_model_json, f, indent=4)
    
    print(f"모델 파라미터를 {OUTPUT_PATH}에 성공적으로 저장했습니다.")

except FileNotFoundError:
    print(f"Error: {MODEL_PATH} 파일을 찾을 수 없습니다. 모델을 먼저 학습시키거나 경로를 확인해주세요.")
except Exception as e:
    print(f"모델을 변환하는 중 오류가 발생했습니다: {e}")