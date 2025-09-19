import os
import time
import cv2
import joblib
import numpy as np
import mediapipe as mp
from PIL import ImageFont, ImageDraw, Image
import sys 
from pymongo import MongoClient
import io

# 1. 사용자 ID 받기
if len(sys.argv) < 2:
    print("Error: No userId provided.")
    sys.exit(1)

userId = sys.argv[1]

# 2. MongoDB 연결
mongo_uri = os.getenv("DB_CONNECT") 
client = MongoClient(mongo_uri)
db = client['Signup']
collection = db['user_models']

# 3. 사용자 모델 로드
model_doc = collection.find_one({'userId': userId})
if not model_doc:
    print(f"Error: 사용자 {userId} 모델 없음")
    sys.exit(1)

buffer = io.BytesIO(model_doc['modelData'])
bundle = joblib.load(buffer)

scaler = bundle['scaler']
gmm_pos = bundle.get('gmm_pos', None)
gmm_neg = bundle.get('gmm_neg', None)
log_prior_pos = bundle.get('log_prior_pos', 0.0)
log_prior_neg = bundle.get('log_prior_neg', 0.0)
oneclass_thresh = bundle.get('oneclass_thresh', None)
    

# ===================== Mediapipe 인덱스 =====================
IDX = {
    'LEFT_CHEEK': 432,
    'RIGHT_CHEEK': 203,
    'L_EYE_EAR': [33, 160, 158, 133, 153, 144],
    'R_EYE_EAR': [263, 387, 385, 362, 380, 373],
    'MOUTH_MAR': [13, 14, 61, 291],

    'EYE_L_CORNERS': [33, 133],
    'EYE_R_CORNERS': [263, 362],
    'L_IRIS': [474, 475, 476, 477],
    'R_IRIS': [469, 470, 471, 472],
    'L_EYE_V': [160, 144],
    'R_EYE_V': [387, 373],
}

# ===================== 유틸 함수 =====================
def dist(a, b):
    if hasattr(a, 'x') and hasattr(b, 'x'):
        return np.hypot(a.x - b.x, a.y - b.y)
    return 0.0

def eye_ear(lm, idx):
    pts = [lm[i] for i in idx]
    p1, p4 = pts[0], pts[3]
    p2, p6 = pts[1], pts[5]
    p3, p5 = pts[2], pts[4]
    w = dist(p1, p4) + 1e-6
    v1 = dist(p2, p6)
    v2 = dist(p3, p5)
    return (v1 + v2) / (2 * w)

def mouth_mar(lm, idx):
    pts = [lm[i] for i in idx]
    p1, p2 = pts[0], pts[1]
    p3, p4 = pts[2], pts[3]
    vertical = dist(p1, p2) + 1e-6
    horizontal = dist(p3, p4) + 1e-6
    return vertical / horizontal

def iris_center(lm, idx_iris):
    pts = [lm[i] for i in idx_iris]
    cx = sum(p.x for p in pts) / len(pts)
    cy = sum(p.y for p in pts) / len(pts)
    return cx, cy

def gaze_offset_hv(lm, corner_idx, vert_idx, iris_idx):
    c1, c2 = lm[corner_idx[0]], lm[corner_idx[1]]
    eye_cx = (c1.x + c2.x) * 0.5
    eye_w  = abs(c2.x - c1.x) + 1e-6
    v_up, v_dn = lm[vert_idx[0]], lm[vert_idx[1]]
    eye_cy = (v_up.y + v_dn.y) * 0.5
    eye_h  = abs(v_dn.y - v_up.y) + 1e-6
    ix, iy = iris_center(lm, iris_idx)
    return (ix - eye_cx) / eye_w, (iy - eye_cy) / eye_h

# MAR을 제외한 눈/얼굴/시선 특징만 추출합니다.
def extract_gmm_features(lm):
    if not lm:
        return None

    head_pitch = lm[199].y - lm[10].y
    ear_l = eye_ear(lm, IDX['L_EYE_EAR'])
    ear_r = eye_ear(lm, IDX['R_EYE_EAR'])
    gL_h, gL_v = gaze_offset_hv(lm, IDX['EYE_L_CORNERS'], IDX['L_EYE_V'], IDX['L_IRIS'])
    gR_h, gR_v = gaze_offset_hv(lm, IDX['EYE_R_CORNERS'], IDX['R_EYE_V'], IDX['R_IRIS'])

    # GMM에 사용할 7가지 특징 
    return [ear_l, ear_r, head_pitch, gL_h, gR_h, gL_v, gR_v]

# 하품 감지 용도
def extract_mar(lm):
    if not lm:
        return None
    return mouth_mar(lm, IDX['MOUTH_MAR'])

def is_valid_feature(feat, dim):
    return isinstance(feat, (list, tuple, np.ndarray)) and len(feat) == dim and np.all(np.isfinite(feat))

def draw_text_on_image(img, text, pos, font):
    img_pil = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(img_pil)
    draw.text(pos, text, font=font, fill=(0,0,0))
    return cv2.cvtColor(np.array(img_pil), cv2.COLOR_RGB2BGR)

# ===================== 모델 로드 =====================
try:
    mongo_uri = os.getenv("DB_CONNECT")  
    client = MongoClient(mongo_uri)
    db = client['Signup'] 
    collection = db['user_models']
    
    model_doc = collection.find_one({'userId': userId})
    if not model_doc:
        raise FileNotFoundError(f"사용자 ID '{userId}'에 대한 모델을 찾을 수 없습니다.")

    # MongoDB에서 불러온 이진 데이터를 joblib.load로 역직렬화
    buffer = io.BytesIO(model_doc['modelData'])
    bundle = joblib.load(buffer)

except Exception as e:
    print(f"오류: MongoDB에서 모델 로드 실패 - {e}", file=sys.stderr)
    sys.exit(1)
finally:
    client.close()

scaler = bundle['scaler']
gmm_pos = bundle.get('gmm_pos', None)
gmm_neg = bundle.get('gmm_neg', None)
log_prior_pos = bundle.get('log_prior_pos', 0.0)
log_prior_neg = bundle.get('log_prior_neg', 0.0)
oneclass_thresh = bundle.get('oneclass_thresh', None)

feat_dim = 7

# ===================== 파라미터 =====================
EYE_AR_THRESH = 0.20
EMA_ALPHA = 0.4

# H_ON,  H_OFF  = 0.2, 0.15  
# V_ON,  V_OFF  = 0.35, 0.25   
H_ON,  H_OFF  = 0.3, 0.15
V_ON,  V_OFF  = 0.45, 0.25

BASE_ALPHA = 0.01
base_h, base_v = None, None
have_baseline = False

EYE_CLOSED_SEC = 3.0
BLINK_MAX_SEC  = 0.5

g_h_ema, g_v_ema = None, None
gaze_offscreen = False
eyes_closed_start = None
is_blink = False
gmm_decision_focus = False

warmup_frames = 120
frame_idx = 0

# ===================== Mediapipe & 화면 =====================
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5,
)

cap = cv2.VideoCapture(1)
processing_width, processing_height = 1280, 720
screen_width, screen_height = 1920, 1080

font_path = "C:/Windows/Fonts/malgunbd.ttf"
try:
    font = ImageFont.truetype(font_path, 30)
except:
    font = ImageFont.load_default()

# ===================== 메인 루프 =====================
prev_status_text = "이탈"
prev_border_color = (0, 0, 255)

while cap.isOpened():
    ok, frame = cap.read()
    if not ok:
        print("카메라를 읽을 수 없습니다.")
        break

    frame_idx += 1

    img = cv2.resize(frame, (processing_width, processing_height))
    img = cv2.flip(img, 1)
    final_image = cv2.resize(img, (screen_width, screen_height))

    res = face_mesh.process(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))

    status_text = "이탈"
    border_color = (0, 0, 255)

    is_drowsy = False
    is_yawning = False
    is_blink = False

    if res.multi_face_landmarks:
        lm = res.multi_face_landmarks[0].landmark
        gmm_feat = extract_gmm_features(lm)
        mar = extract_mar(lm)

        if is_valid_feature(gmm_feat, feat_dim) and mar is not None:
            ear_l, ear_r = gmm_feat[0], gmm_feat[1]

            # --- 졸음/깜박임(시간 기반) ---
            now = time.time()
            both_eyes_closed = (ear_l < EYE_AR_THRESH and ear_r < EYE_AR_THRESH)

            if both_eyes_closed:
                if eyes_closed_start is None:
                    eyes_closed_start = now
                closed_dur = now - eyes_closed_start
                is_drowsy = (closed_dur >= EYE_CLOSED_SEC)
                is_blink  = (closed_dur < BLINK_MAX_SEC)
            else:
                if eyes_closed_start is not None:
                    closed_dur = now - eyes_closed_start
                    is_blink = (closed_dur < BLINK_MAX_SEC)
                eyes_closed_start = None

            
            # --- 시선 이탈(눈이 열려 있을 때만 계산) ---
            if not both_eyes_closed:
                gL_h, gR_h, gL_v, gR_v = gmm_feat[3], gmm_feat[4], gmm_feat[5], gmm_feat[6]
                g_h = (abs(gL_h) + abs(gR_h)) * 0.5
                g_v = (abs(gL_v) + abs(gR_v)) * 0.5

                g_h = np.clip(g_h, 0.0, 1.5)
                g_v = np.clip(g_v, 0.0, 1.5)

                # GMM 분류
                gmm_decision_focus = False
                x = np.asarray(gmm_feat, dtype=float).reshape(1, -1)

                if x.shape[1] == feat_dim:
                    x_scaled = scaler.transform(x)
                    pos_score = -np.inf
                    neg_score = -np.inf
                    if gmm_pos is not None:
                        pos_score = gmm_pos.score_samples(x_scaled)[0] + log_prior_pos
                    if gmm_neg is not None:
                        neg_score = gmm_neg.score_samples(x_scaled)[0] + log_prior_neg
                    if gmm_pos is not None and gmm_neg is not None:
                        gmm_decision_focus = (pos_score >= neg_score)
                    elif gmm_pos is not None and gmm_neg is None:
                        gmm_decision_focus = (pos_score >= oneclass_thresh) if (oneclass_thresh is not None) else False

                # 베이스라인 업데이트 
                if base_h is None or base_v is None:
                    base_h, base_v = g_h, g_v
                    have_baseline = True
                elif (gmm_decision_focus and (not gaze_offscreen) and (not both_eyes_closed)):
                    base_h = (1-BASE_ALPHA)*base_h + BASE_ALPHA*g_h
                    base_v = (1-BASE_ALPHA)*base_v + BASE_ALPHA*g_v

                #  편차 → EMA → 히스테리시스 
                if have_baseline:
                    dev_h = abs(g_h - base_h)
                    dev_v = abs(g_v - base_v)
                else:
                    dev_h, dev_v = g_h, g_v

                if g_h_ema is None:
                    g_h_ema, g_v_ema = dev_h, dev_v
                else:
                    g_h_ema = (1-EMA_ALPHA)*g_h_ema + EMA_ALPHA*dev_h
                    g_v_ema = (1-EMA_ALPHA)*g_v_ema + EMA_ALPHA*dev_v

                if not gaze_offscreen:
                    if (g_h_ema > H_ON) or (g_v_ema > V_ON):
                        gaze_offscreen = True
                else:
                    if (g_h_ema < H_OFF) and (g_v_ema < V_OFF):
                        gaze_offscreen = False

                if frame_idx < warmup_frames:
                    gaze_offscreen = False

            # --- 최종 상태 우선순위 ---
            if is_drowsy:
                status_text = "졸음 감지!"
                border_color = (0, 0, 255)
            # elif is_yawning:
            #     status_text = "하품 감지!"
            #     border_color = (0, 255, 255) # 노랑
            elif gmm_decision_focus:
                status_text = "집중 중"
                border_color = (0, 255, 0)
            elif gaze_offscreen:
                status_text = "이탈(시선)"
                border_color = (255, 0, 255) # 보라
            else:
                status_text = "이탈"
                border_color = (0, 0, 255)

            if is_blink:
                status_text  = prev_status_text
                border_color = prev_border_color
            else:
                prev_status_text  = status_text
                prev_border_color = border_color
        else:
            status_text = "얼굴 감지 실패"
            border_color = (128, 128, 128)

    cv2.rectangle(final_image, (0, 0), (screen_width, screen_height), border_color, 20)
    final_image = draw_text_on_image(final_image, status_text, (50, 50), font)


    cv2.imshow("GMM Focus Detection", final_image)

    key = cv2.waitKey(1) & 0xFF

    step = 0.02
    if key == ord('a'):
        H_ON = max(0.0, H_ON - step)
    elif key == ord('s'):
        H_ON = H_ON + step
    elif key == ord('d'):
        H_OFF = max(0.0, H_OFF - step)
    elif key == ord('f'):
        H_OFF = H_OFF + step
    elif key == ord('z'):
        V_ON = max(0.0, V_ON - step)
    elif key == ord('x'):
        V_ON = V_ON + step
    elif key == ord('c'):
        V_OFF = max(0.0, V_OFF - step)
    elif key == ord('v'):
        V_OFF = V_OFF + step
    elif key == ord('b'):
        base_h, base_v = None, None
        have_baseline = False
        g_h_ema, g_v_ema = None, None

    min_gap = 0.005
    H_ON  = max(H_ON,  H_OFF + min_gap)
    V_ON  = max(V_ON,  V_OFF + min_gap)
    H_OFF = min(H_OFF, H_ON  - min_gap)
    V_OFF = min(V_OFF, V_ON  - min_gap)

    if key == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
face_mesh.close()