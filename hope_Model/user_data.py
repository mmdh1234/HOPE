import cv2
import mediapipe as mp
import numpy as np
import time
import json
import os
import sys
from PIL import ImageFont, ImageDraw, Image

# ===================== 상수/유틸 =====================

# 사용자 ID를 명령줄 인자로 받음
if len(sys.argv) > 1:
    userId = sys.argv[1]
else:
    # 에러 메시지를 표준 에러(stderr)로 출력하고 종료
    print("Error: No userId provided.", file=sys.stderr)
    sys.exit(1)


IDX = {
    'LEFT_CHEEK': 432,
    'RIGHT_CHEEK': 203,
    'L_EYE_EAR': [33, 160, 158, 133, 153, 144],
    'R_EYE_EAR': [263, 387, 385, 362, 380, 373],
    'MOUTH_MAR': [13, 14, 61, 291],

    'EYE_L_CORNERS': [33, 133],
    'EYE_R_CORNERS': [263, 362],
    'L_IRIS': [474, 475, 476, 477],   # 왼쪽 홍채
    'R_IRIS': [469, 470, 471, 472],   # 오른쪽 홍채
    'L_EYE_V': [160, 144],  # 왼쪽 위/아래 눈꺼풀
    'R_EYE_V': [387, 373],  # 오른쪽 위/아래 눈꺼풀
}

M = 0.05

def create_targets(start_x, start_y, end_x, end_y, cols, rows):
    targets = []
    x_coords = np.linspace(start_x, end_x, cols)
    y_coords = np.linspace(start_y, end_y, rows)
    for y in y_coords:
        for x in x_coords:
            targets.append([x, y])
    return targets

def snake_order(pts, cols, rows):
    ordered = []
    for r in range(rows):
        row_slice = pts[r * cols: r * cols + cols]
        if r % 2 == 0:
            ordered.extend(row_slice)
        else:
            ordered.extend(row_slice[::-1])
    return ordered

TARGETS_3x3_CENTER = snake_order(create_targets(M, M, 1-M, 1-M, 2, 2), 2, 2)

def dist(a, b):
    if hasattr(a, 'x') and hasattr(b, 'x'):
        return np.hypot(a.x - b.x, a.y - b.y)
    return 0

def mean_pt(pts):
    s_x = sum(p.x for p in pts)
    s_y = sum(p.y for p in pts)
    return {'x': s_x / len(pts), 'y': s_y / len(pts)}

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

def extract_features_7d(lm):
    if not lm:
        return None
    
    head_pitch = lm[199].y - lm[10].y
    ear_l = eye_ear(lm, IDX['L_EYE_EAR'])
    ear_r = eye_ear(lm, IDX['R_EYE_EAR'])
    gL_h, gL_v = gaze_offset_hv(lm, IDX['EYE_L_CORNERS'], IDX['L_EYE_V'], IDX['L_IRIS'])
    gR_h, gR_v = gaze_offset_hv(lm, IDX['EYE_R_CORNERS'], IDX['R_EYE_V'], IDX['R_IRIS'])
    
    # 7개 특징
    return [ear_l, ear_r, head_pitch, gL_h, gR_h, gL_v, gR_v]

def is_valid_feature(feat):
    return isinstance(feat, (list, tuple, np.ndarray)) and len(feat) == 7 and np.all(np.isfinite(feat))


def ema(prev, cur, alpha=0.2):
    return (1 - alpha) * prev + alpha * cur

def iris_center(lm, idx_iris):
    pts = [lm[i] for i in idx_iris]
    cx = sum(p.x for p in pts) / len(pts)
    cy = sum(p.y for p in pts) / len(pts)
    return cx, cy

def gaze_offset_hv(lm, corner_idx, vert_idx, iris_idx):
    # 수평: (iris_x - 눈 중앙 x) / 눈 너비
    c1, c2 = lm[corner_idx[0]], lm[corner_idx[1]]
    eye_cx = (c1.x + c2.x) * 0.5
    eye_w  = abs(c2.x - c1.x) + 1e-6

    # 수직: (iris_y - 눈 중앙 y) / 눈 높이
    v_up, v_dn = lm[vert_idx[0]], lm[vert_idx[1]]
    eye_cy = (v_up.y + v_dn.y) * 0.5
    eye_h  = abs(v_dn.y - v_up.y) + 1e-6

    ix, iy = iris_center(lm, iris_idx)
    return (ix - eye_cx) / eye_w, (iy - eye_cy) / eye_h


# ===================== 메인 로직 =====================

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5,
)

cap = cv2.VideoCapture(1)

window_name = 'GMM Data Collection'
cv2.namedWindow(window_name, cv2.WND_PROP_FULLSCREEN)
cv2.setWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)

processing_width, processing_height = 1280, 720
screen_width, screen_height = 1920, 1080 

DATA_FOLDER = "UserData"
IMAGE_FOLDER = os.path.join(DATA_FOLDER, "images")
os.makedirs(IMAGE_FOLDER, exist_ok=True)

gmm_calib = {
    'running': False,
    'phase': 'idle',
    'phase_until': 0,
    'targets': [],
    'idx': 0,
    'hold_ms': 1000,
    'started_at': 0,
    'message': "GMM 데이터 수집을 시작하려면 's' 키를 누르세요.",
    'message_end_time': 0,
    'last_guide_x': screen_width / 2,
    'last_guide_y': screen_height / 2, 
    'initial_face_height': 0,
    'current_guide_pos': (0, 0),
    'head_turn_side': 'left',
    'target_start_time': 0,
    'timer_armed': False,
    'neg_collect_secs': 12.0,
}

samples_X = []
samples_Y = [] 
samples_labels = [] 

font_path = "C:/Windows/Fonts/malgunbd.ttf"
try:
    font = ImageFont.truetype(font_path, 30)
except IOError:
    font = ImageFont.load_default()
    print("경고: 맑은 고딕 폰트를 찾을 수 없어 기본 폰트를 사용합니다. 한글이 깨질 수 있습니다.")

def draw_text_on_image(img, text, pos, font_scale, color=(0, 0, 0)):
    img_pil = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(img_pil)
    draw.text(pos, text, font=font, fill=color)
    return cv2.cvtColor(np.array(img_pil), cv2.COLOR_RGB2BGR)

while cap.isOpened():
    success, image = cap.read()
    if not success:
        print("카메라를 읽을 수 없습니다. 프로그램을 종료합니다.")
        break

    image_processed = cv2.resize(image, (processing_width, processing_height))
    image_processed = cv2.flip(image_processed, 1)
    
    current_time = time.time()
    
    results = face_mesh.process(cv2.cvtColor(image_processed, cv2.COLOR_BGR2RGB))
    
    final_image = cv2.resize(image_processed, (screen_width, screen_height))
    
    has_face = results.multi_face_landmarks
    landmarks = results.multi_face_landmarks[0].landmark if has_face else None

    # 그리기 로직
    if has_face:
        face_center_x = int((landmarks[10].x + landmarks[152].x) / 2 * screen_width)
        face_center_y = int((landmarks[10].y + landmarks[152].y) / 2 * screen_height)
        face_height_current = dist(landmarks[10], landmarks[152]) * screen_height
        
        if gmm_calib['running'] and gmm_calib['initial_face_height'] == 0:
            gmm_calib['initial_face_height'] = face_height_current

        if gmm_calib['initial_face_height'] > 0:
            guide_radius = int(gmm_calib['initial_face_height'] * 1.1 / 2)
            
            if not gmm_calib['running']:
                cv2.circle(final_image, (int(screen_width/2), int(screen_height/2)), guide_radius, (0, 255, 255), 2)
            elif gmm_calib['phase'] in ['center_gaze', 'left_gaze', 'right_gaze', 'message_before_left_gaze', 'message_before_right_gaze', 'message_before_head_vertical',
                'message_before_head_rotation', 'message_before_forward_backward', 'message_before_head_translation']: 
                cv2.circle(final_image, gmm_calib['current_guide_pos'], guide_radius, (0, 255, 255), 2)
            elif gmm_calib['phase'] == 'head_vertical': 
                progress_time = current_time - (gmm_calib['phase_until'] - 5.0)
                move_y = (np.sin(progress_time * 2 * np.pi / 5.0 - np.pi / 2) * (screen_height * 0.25) + screen_height / 2)
                guide_pos = (int(screen_width / 2), int(ema(gmm_calib['last_guide_y'], move_y, 0.1)))
                gmm_calib['last_guide_y'] = guide_pos[1]
                cv2.circle(final_image, guide_pos, guide_radius, (0, 255, 255), 2)
            elif gmm_calib['phase'] == 'head_rotation':
                progress_time = current_time - (gmm_calib['phase_until'] - 5.0)
                move_x = (np.sin(progress_time * 2 * np.pi / 5.0 - np.pi / 2) * (screen_width * 0.25) + screen_width / 2)
                guide_pos = (int(ema(gmm_calib['last_guide_x'], move_x, 0.1)), int(screen_height / 2))
                gmm_calib['last_guide_x'] = guide_pos[0]
                cv2.circle(final_image, guide_pos, guide_radius, (0, 255, 255), 2)
            elif gmm_calib['phase'] == 'forward_backward':
                scale_factor = (np.cos((current_time - (gmm_calib['phase_until'] - 5.0)) * 2 * np.pi / 5.0) * 0.25 + 1)
                guide_size = gmm_calib['initial_face_height'] * scale_factor
                guide_radius = int(guide_size / 2)
                cv2.circle(final_image, (int(screen_width / 2), int(screen_height / 2)), guide_radius, (0, 255, 255), 2)
        
        if landmarks:
            cv2.circle(final_image, (face_center_x, face_center_y), int(face_height_current / 2), (255, 255, 255), 2)
            
    # 캘리브레이션 단계별 로직
    if gmm_calib['running']:
        is_message_visible = gmm_calib['message'] and current_time < gmm_calib['message_end_time']

        # 얼굴이 안 보이면 타이머 해제
        if not has_face:
            gmm_calib['timer_armed'] = False

        # 얼굴이 보이고 메시지 끝난 후 + 아직 무장 안 되었을 때 → 타이머 새로 세팅
        if gmm_calib['phase'] in ['center_gaze', 'left_gaze', 'right_gaze'] \
            and not is_message_visible and has_face and not gmm_calib.get('timer_armed', False):
            gmm_calib['target_start_time'] = current_time
            gmm_calib['timer_armed'] = True

        if has_face and not is_message_visible:
            gmm_features = extract_features_7d(landmarks)
            if gmm_calib['message'] == "얼굴이 감지되지 않습니다. 카메라를 봐주세요.":
                gmm_calib['message'] = ""
            if is_valid_feature(gmm_features):
                pos_phases = {
            'center_gaze','left_gaze','right_gaze',
            'head_vertical','head_rotation', 'head_translation'
            }
                label = 1 if gmm_calib['phase'] in pos_phases else 0

                samples_X.append(gmm_features)
                samples_labels.append(label)
                if current_time - gmm_calib.get('last_image_save', 0) > 0.5:
                    gmm_calib['last_image_save'] = current_time
                    # img_path = os.path.join(IMAGE_FOLDER, f"calib_frame_{len(samples_Y)}.png")
                    # cv2.imwrite(img_path, final_image)
                    # samples_Y.append(img_path)
        
        if not is_message_visible and gmm_calib['phase'] in ['center_gaze', 'left_gaze', 'right_gaze']:
            if has_face and gmm_calib['idx'] < len(gmm_calib['targets']):
                if current_time - gmm_calib['target_start_time'] > gmm_calib['hold_ms'] / 1000:
                    gmm_calib['idx'] += 1
                    gmm_calib['target_start_time'] = current_time 
                
                if gmm_calib['idx'] < len(gmm_calib['targets']):
                    target = gmm_calib['targets'][gmm_calib['idx']]
                    tx, ty = int(target[0] * screen_width), int(target[1] * screen_height)
                    cv2.circle(final_image, (tx, ty), 20, (0, 0, 225), -1)

        # 단계 전환 로직
        if gmm_calib['phase'] == 'intro' and current_time > gmm_calib['message_end_time']:
            gmm_calib['message'] = "얼굴을 중앙에 두고 화면의 점을 따라보세요."
            gmm_calib['message_end_time'] = current_time + 2.0
            gmm_calib['phase'] = 'center_gaze'
            gmm_calib['idx'] = 0
            gmm_calib['targets'] = TARGETS_3x3_CENTER
            gmm_calib['current_guide_pos'] = (int(screen_width / 2), int(screen_height / 2))
            gmm_calib['timer_armed'] = False  

        elif gmm_calib['phase'] == 'center_gaze' and not is_message_visible and has_face:
            if gmm_calib['idx'] >= len(gmm_calib['targets']):
                gmm_calib['message'] = "얼굴을 화면 왼쪽으로 이동하세요."
                gmm_calib['message_end_time'] = current_time + 2.0
                gmm_calib['phase'] = 'message_before_left_gaze'
                gmm_calib['timer_armed'] = False
                gmm_calib['current_guide_pos'] = (int(screen_width * 0.2), int(screen_height / 2))
        
        elif gmm_calib['phase'] == 'message_before_left_gaze' and current_time > gmm_calib['message_end_time']:
            gmm_calib['phase'] = 'left_gaze'
            gmm_calib['idx'] = 0
            gmm_calib['targets'] = TARGETS_3x3_CENTER
            gmm_calib['current_guide_pos'] = (int(screen_width * 0.2), int(screen_height / 2))
            gmm_calib['timer_armed'] = False  


        elif gmm_calib['phase'] == 'left_gaze' and not is_message_visible and has_face:
            if gmm_calib['idx'] >= len(gmm_calib['targets']):
                gmm_calib['message'] = "얼굴을 화면 오른쪽으로 이동하세요."
                gmm_calib['message_end_time'] = current_time + 2.0
                gmm_calib['phase'] = 'message_before_right_gaze'
                gmm_calib['timer_armed'] = False
                gmm_calib['current_guide_pos'] = (int(screen_width * 0.8), int(screen_height / 2))

        elif gmm_calib['phase'] == 'message_before_right_gaze' and current_time > gmm_calib['message_end_time']:
            gmm_calib['phase'] = 'right_gaze'
            gmm_calib['idx'] = 0
            gmm_calib['targets'] = TARGETS_3x3_CENTER
            gmm_calib['current_guide_pos'] = (int(screen_width * 0.8), int(screen_height / 2))
            gmm_calib['timer_armed'] = False

        elif gmm_calib['phase'] == 'right_gaze' and not is_message_visible and has_face:
            if gmm_calib['idx'] >= len(gmm_calib['targets']):
                gmm_calib['message'] = "시선은 화면, 고개만 위아래로 천천히 움직여주세요."
                gmm_calib['message_end_time'] = current_time + 2.0
                gmm_calib['phase'] = 'message_before_head_vertical'
                gmm_calib['current_guide_pos'] = (int(screen_width / 2), int(screen_height / 2))
        
        elif gmm_calib['phase'] == 'message_before_head_vertical' and current_time > gmm_calib['message_end_time']: 
            gmm_calib['phase'] = 'head_vertical'
            gmm_calib['phase_until'] = current_time + 5.0
            gmm_calib['last_guide_y'] = screen_height / 2
            gmm_calib['current_guide_pos'] = (int(screen_width / 2), int(screen_height / 2))

        elif gmm_calib['phase'] == 'head_vertical' and not is_message_visible and has_face:
            if current_time > gmm_calib['phase_until']:
                gmm_calib['message'] = "시선은 화면, 고개만 좌우로 천천히 회전하세요."
                gmm_calib['message_end_time'] = current_time + 2.0
                gmm_calib['phase'] = 'message_before_head_rotation'
                gmm_calib['current_guide_pos'] = (int(screen_width / 2), int(screen_height / 2))

        elif gmm_calib['phase'] == 'message_before_head_rotation' and current_time > gmm_calib['message_end_time']:
            gmm_calib['phase'] = 'head_rotation'
            gmm_calib['phase_until'] = current_time + 5.0
            gmm_calib['last_guide_x'] = screen_width / 2
            gmm_calib['current_guide_pos'] = (int(screen_width / 2), int(screen_height / 2))

    
        elif gmm_calib['phase'] == 'head_rotation' and not is_message_visible and has_face:
            if current_time > gmm_calib['phase_until']:
                gmm_calib['message'] = "시선은 화면, 얼굴만 좌우 어깨 쪽으로 천천히 이동하세요."
                gmm_calib['message_end_time'] = current_time + 2.0
                gmm_calib['phase'] = 'message_before_head_translation'
                gmm_calib['current_guide_pos'] = (int(screen_width / 2), int(screen_height / 2))

        elif gmm_calib['phase'] == 'message_before_head_translation' and current_time > gmm_calib['message_end_time']:
            gmm_calib['phase'] = 'head_translation'
            gmm_calib['phase_until'] = current_time + 5.0
            gmm_calib['last_guide_x'] = screen_width / 2
            gmm_calib['current_guide_pos'] = (int(screen_width / 2), int(screen_height / 2))

        elif gmm_calib['phase'] == 'head_translation':
            # 5초 동안 좌우 왕복 (고개 고정 + 얼굴만 이동)
            progress_time = current_time - (gmm_calib['phase_until'] - 5.0)
            move_x = (np.sin(progress_time * 2 * np.pi / 5.0 - np.pi / 2) * (screen_width * 0.25) + screen_width / 2)
            guide_pos = (int(ema(gmm_calib['last_guide_x'], move_x, 0.1)), int(screen_height / 2))
            gmm_calib['last_guide_x'] = guide_pos[0]
            cv2.circle(final_image, guide_pos, guide_radius, (0, 255, 255), 2)

            if current_time > gmm_calib['phase_until']:
                # 최종 종료
                gmm_calib['running'] = False
                gmm_calib['message'] = "캘리브레이션/이탈 수집 완료! 데이터를 저장합니다."
                gmm_calib['message_end_time'] = current_time + 3.0
        
            
    else:
        if not has_face:
            gmm_calib['message'] = "얼굴이 감지되지 않습니다. 카메라를 봐주세요."
            gmm_calib['message_end_time'] = current_time + 1000
        elif gmm_calib['phase'] != 'idle':
            gmm_calib['message'] = "캘리브레이션 완료! 데이터를 저장합니다."
            gmm_calib['message_end_time'] = 0

    if gmm_calib['message']:
        final_image = draw_text_on_image(final_image, gmm_calib['message'], pos=(int(screen_width/2 - 200), int(screen_height/2)), font_scale=1.5)
    elif gmm_calib['running'] and not gmm_calib['message']:
        final_image = draw_text_on_image(final_image, f"샘플 수: {len(samples_X)}", (10, 60), font_scale=1.0)
    
    cv2.imshow(window_name, final_image)

    key = cv2.waitKey(1) & 0xFF
    if key == ord('s') and gmm_calib['phase'] == 'idle':
        gmm_calib['running'] = True
        gmm_calib['phase'] = 'intro'
        gmm_calib['message_end_time'] = current_time + 2.0
        gmm_calib['current_guide_pos'] = (int(screen_width / 2), int(screen_height / 2)) 
        gmm_calib['initial_face_height'] = 0
        gmm_calib['idx'] = 0
        gmm_calib['targets'] = []
        gmm_calib['timer_armed'] = False
        samples_X.clear(); samples_labels.clear(); samples_Y.clear()
    if key == ord('q'):
        break

output_data = {
    'features': samples_X,
    'labels': samples_labels,
    'feature_schema_id': 'v3_iris_7_features',
    'feat_names': ['ear_l','ear_r','pitch','gL_h','gR_h','gL_v','gR_v'],
    'userId': userId 
}

# MongoDB에 저장
from pymongo import MongoClient
from dotenv import load_dotenv
import os, sys, json, time

load_dotenv()  # .env 파일 로드

DB_CONNECT = os.environ.get("DB_CONNECT") 

def save_to_mongodb(data):
    # MongoDB Atlas 연결
    client = MongoClient(DB_CONNECT)
    db = client['Signup'] 
    collection = db['user_data']

    try:
        # 기존 데이터 삭제 후 저장
        collection.delete_many({'userId': data['userId']})
        collection.insert_one(data)
        
        print(f"\n데이터가 MongoDB에 성공적으로 저장되었습니다. (UserId: {data['userId']})")
        print(json.dumps({
            "status": "ok",
            "userId": data['userId'],
            "db": {"db":"Signup","collection":"user_features"},
            "createdAt": time.time()
        }), flush=True)

    except Exception as e:
        print(f"\nMongoDB 저장 중 오류 발생: {e}", file=sys.stderr)
        print(json.dumps({"status":"error","error": str(e)}), flush=True)
        sys.exit(1)
    finally:
        client.close()



cap.release()
cv2.destroyAllWindows()
face_mesh.close()