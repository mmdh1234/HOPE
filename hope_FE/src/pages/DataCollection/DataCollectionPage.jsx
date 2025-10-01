import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import * as S from './DataCollectionPage.style.jsx';
// ====== Guide & Target Utils ======
const MARGIN = 0.05;
function createTargets(startX, startY, endX, endY, cols, rows) {
    const xs = Array.from(
        { length: cols },
        (_, i) => startX + (endX - startX) * (i / (cols - 1 || 1))
    );
    const ys = Array.from(
        { length: rows },
        (_, j) => startY + (endY - startY) * (j / (rows - 1 || 1))
    );
    const pts = [];
    ys.forEach((y) => xs.forEach((x) => pts.push([x, y])));
    return pts;
}
function snakeOrder(pts, cols, rows) {
    const out = [];
    for (let r = 0; r < rows; r++) {
        const row = pts.slice(r * cols, r * cols + cols);
        out.push(...(r % 2 === 0 ? row : row.slice().reverse()));
    }
    return out;
}
// 2x2 그리드
const TARGETS_CENTER = snakeOrder(
    createTargets(MARGIN, MARGIN, 1 - MARGIN, 1 - MARGIN, 2, 2),
    2,
    2
);
const EMA = (prev, cur, a = 0.1) => (1 - a) * prev + a * cur;
// ====== MP 인덱스 ======
const IDX = {
    L_EYE_EAR: [33, 160, 158, 133, 153, 144],
    R_EYE_EAR: [263, 387, 385, 362, 380, 373],
    EYE_L_CORNERS: [33, 133],
    EYE_R_CORNERS: [263, 362],
    L_IRIS: [474, 475, 476, 477],
    R_IRIS: [469, 470, 471, 472],
    L_EYE_V: [160, 144],
    R_EYE_V: [387, 373],
};
// ====== 유틸 ======
function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}
function eyeEAR(lm, idx) {
    const [p1, p2, p3, p4, p5, p6] = idx.map((i) => lm[i]);
    const w = dist(p1, p4) + 1e-6;
    const v1 = dist(p2, p6),
        v2 = dist(p3, p5);
    return (v1 + v2) / (2 * w);
}
function irisCenter(lm, ids) {
    let sx = 0,
        sy = 0;
    ids.forEach((i) => {
        sx += lm[i].x;
        sy += lm[i].y;
    });
    return { x: sx / ids.length, y: sy / ids.length };
}
function gazeHV(lm, cornerIdx, vertIdx, irisIdx) {
    const c1 = lm[cornerIdx[0]],
        c2 = lm[cornerIdx[1]];
    const eye_cx = (c1.x + c2.x) * 0.5,
        eye_w = Math.abs(c2.x - c1.x) + 1e-6;
    const vUp = lm[vertIdx[0]],
        vDn = lm[vertIdx[1]];
    const eye_cy = (vUp.y + vDn.y) * 0.5,
        eye_h = Math.abs(vDn.y - vUp.y) + 1e-6;
    const ic = irisCenter(lm, irisIdx);
    return [(ic.x - eye_cx) / eye_w, (ic.y - eye_cy) / eye_h];
}
function extract7(lm) {
    const head_pitch = lm[199].y - lm[10].y;
    const ear_l = eyeEAR(lm, IDX.L_EYE_EAR);
    const ear_r = eyeEAR(lm, IDX.R_EYE_EAR);
    const [gL_h, gL_v] = gazeHV(lm, IDX.EYE_L_CORNERS, IDX.L_EYE_V, IDX.L_IRIS);
    const [gR_h, gR_v] = gazeHV(lm, IDX.EYE_R_CORNERS, IDX.R_EYE_V, IDX.R_IRIS);
    const arr = [ear_l, ear_r, head_pitch, gL_h, gR_h, gL_v, gR_v];
    return arr.every(Number.isFinite) ? arr : null;
}
export default function DataCollectionPage() {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const faceMeshRef = useRef(null);
    // 캘리브레이션 상태 컨테이너
    const calibRef = useRef({
        running: false,
        phase: 'idle',
        phaseUntil: 0,
        targets: [],
        idx: 0,
        holdMs: 1000,
        msg: "수집을 시작하려면 '수집 시작' 버튼을 누르세요.",
        msgUntil: 0,
        lastGuideX: 0,
        lastGuideY: 0,
        initialFaceH: 0,
        currentGuidePos: null,
        timerArmed: false,
        targetStartAt: 0,
        finished: false,
        finishShowUntil: 0,
    });
    const [phase, setPhase] = useState('idle');
    const [disabled, setDisabled] = useState(false);
    const [logs, setLogs] = useState([]);
    // 카메라 선택 상태
    const [cameras, setCameras] = useState([]);
    const [selectedCamId, setSelectedCamId] = useState(
        localStorage.getItem('preferredCamId') || ''
    );
    const pushLog = useCallback(
        (m) =>
            setLogs((p) => [...p, `[${new Date().toLocaleTimeString()}] ${m}`]),
        []
    );
    // 장치 나열
    const listCameras = useCallback(async () => {
        try {
            const tmp = await navigator.mediaDevices.getUserMedia({
                video: true,
            });
            tmp.getTracks().forEach((t) => t.stop());
        } catch (e) {
            console.warn('카메라 권한 없음:', e);
        }
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cams = devices
            .filter((d) => d.kind === 'videoinput')
            .map((d) => ({ deviceId: d.deviceId, label: d.label || '카메라' }));
        setCameras(cams);
        if (
            cams.length > 0 &&
            !cams.some((c) => c.deviceId === selectedCamId)
        ) {
            setSelectedCamId(cams[0].deviceId);
        }
    }, [selectedCamId]);
    // 수집 버퍼
    const featsRef = useRef([]);
    const labelsRef = useRef([]);
    const lastPushAtRef = useRef(0);

    //  스트림 관리
    const streamRef = useRef(null);
    const rafRef = useRef(null);
    const stopStream = useCallback(() => {
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
            videoRef.current.srcObject = null;
        }
    }, []);
    // FaceMesh 초기화
    const initFaceMesh = useCallback(async () => {
        let FaceMesh;
        try {
            const fm = await import('@mediapipe/face_mesh');
            FaceMesh = fm.FaceMesh;
        } catch {
            FaceMesh = window.FaceMesh;
        }
        const faceMesh = new FaceMesh({
            locateFile: (f) =>
                `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
        });
        faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.6,
            minTrackingConfidence: 0.6,
        });
        faceMesh.onResults((results) => {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            if (!canvas || !video) return;
            const ctx = canvas.getContext('2d');
            canvas.width = video.videoWidth || 1920;
            canvas.height = video.videoHeight || 1080;
            // 미러 + 배경
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(
                results.image,
                -canvas.width,
                0,
                canvas.width,
                canvas.height
            );
            ctx.restore();
            const lm = results.multiFaceLandmarks?.[0];
            const hasFace = !!lm;
            const now = performance.now() / 1000;
            const C = calibRef.current;
            // === 특징 추출 & 샘플 누적 ===
            if (lm) {
                const f = extract7(lm);
                if (f) {
                    const p = calibRef.current.phase;
                    const activePhases = [
                        'center_gaze',
                        'left_gaze',
                        'right_gaze',
                        'head_vertical',
                        'head_rotation',
                        'head_translation',
                        'forward_backward',
                    ];
                    if (activePhases.includes(p)) {
                        const t = performance.now();
                        if (t - lastPushAtRef.current >= 33) {
                            featsRef.current.push(f);
                            labelsRef.current.push(1);
                            lastPushAtRef.current = t;
                        }
                    }
                }
            }
            // 얼굴 치수/중심
            let faceH = 0,
                faceCX = canvas.width / 2,
                faceCY = canvas.height / 2;
            if (hasFace) {
                const top = lm[10],
                    bottom = lm[152];
                faceH = Math.hypot(
                    (bottom.y - top.y) * canvas.height,
                    (bottom.x - top.x) * canvas.width
                );
                faceCX = (lm[10].x + lm[152].x) * 0.5 * canvas.width;
                faceCY = (lm[10].y + lm[152].y) * 0.5 * canvas.height;
                if (C.running && !C.initialFaceH) C.initialFaceH = faceH;
            }
            // 가이드 원 반지름
            const guideR = Math.max(
                12,
                Math.round(
                    (C.initialFaceH || faceH || canvas.height * 0.25) * 0.55
                )
            );
            // --- 가이드 그리기 로직 ---
            const drawGuideCircle = (x, y, r) => {
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#00FFFF';
                ctx.stroke();
            };
            // 기본: 시작 전에는 중앙 가이드
            if (!C.running) {
                drawGuideCircle(canvas.width / 2, canvas.height / 2, guideR);
            }
            // 단계별 가이드
            if (C.running) {
                // 메시지 표시 중?
                const showingMsg = C.msg && now < C.msgUntil;
                // center/left/right 시 타겟 점
                if (
                    !showingMsg &&
                    ['center_gaze', 'left_gaze', 'right_gaze'].includes(C.phase)
                ) {
                    const target = C.targets[C.idx];
                    if (target) {
                        const tx = Math.round(target[0] * canvas.width);
                        const ty = Math.round(target[1] * canvas.height);
                        // 타겟 점
                        ctx.beginPath();
                        ctx.arc(tx, ty, 20, 0, Math.PI * 2);
                        ctx.fillStyle = '#ff0000';
                        ctx.fill();
                        // 고정시간 지나면 다음 타겟
                        if (hasFace) {
                            if (!C.timerArmed) {
                                C.targetStartAt = now;
                                C.timerArmed = true;
                            }
                            if (now - C.targetStartAt > C.holdMs / 1000) {
                                C.idx = Math.min(C.idx + 1, C.targets.length);
                                C.targetStartAt = now;
                            }
                        } else {
                            C.timerArmed = false;
                        }
                    }
                    // 고정 가이드 원 (위치 안내)
                    const gx =
                        C.phase === 'center_gaze'
                            ? canvas.width / 2
                            : C.phase === 'left_gaze'
                            ? canvas.width * 0.2
                            : /* right */ canvas.width * 0.8;
                    const gy = canvas.height / 2;
                    drawGuideCircle(gx, gy, guideR);
                }
                // head_vertical: y만 사인파
                if (C.phase === 'head_vertical') {
                    const t = C.phaseUntil - 5.0;
                    const progress = now - t;
                    const moveY =
                        Math.sin((progress * 2 * Math.PI) / 5.0 - Math.PI / 2) *
                            (canvas.height * 0.25) +
                        canvas.height / 2;
                    C.lastGuideY = EMA(
                        C.lastGuideY || canvas.height / 2,
                        moveY,
                        0.1
                    );
                    drawGuideCircle(canvas.width / 2, C.lastGuideY, guideR);
                }
                // head_rotation: x만 사인파
                if (C.phase === 'head_rotation') {
                    const t = C.phaseUntil - 5.0;
                    const progress = now - t;
                    const moveX =
                        Math.sin((progress * 2 * Math.PI) / 5.0 - Math.PI / 2) *
                            (canvas.width * 0.25) +
                        canvas.width / 2;
                    C.lastGuideX = EMA(
                        C.lastGuideX || canvas.width / 2,
                        moveX,
                        0.1
                    );
                    drawGuideCircle(C.lastGuideX, canvas.height / 2, guideR);
                }
                // head_translation: 좌우 왕복
                if (C.phase === 'head_translation') {
                    const t = C.phaseUntil - 5.0;
                    const progress = now - t;
                    const moveX =
                        Math.sin((progress * 2 * Math.PI) / 5.0 - Math.PI / 2) *
                            (canvas.width * 0.25) +
                        canvas.width / 2;
                    C.lastGuideX = EMA(
                        C.lastGuideX || canvas.width / 2,
                        moveX,
                        0.1
                    );
                    drawGuideCircle(C.lastGuideX, canvas.height / 2, guideR);
                }

                // forward_backward: 앞뒤 움직임 (원의 크기 변경)
                if (C.phase === 'forward_backward') {
                    const t = C.phaseUntil - 5.0;
                    const progress = now - t;
                    // 코사인 함수를 이용해 0.75 ~ 1.25 사이를 반복하는 스케일 팩터 생성
                    const scaleFactor =
                        Math.cos((progress * 2 * Math.PI) / 5.0) * 0.25 + 1;
                    const guideSize = (C.initialFaceH || faceH) * scaleFactor;
                    const dynamicGuideR = Math.round(guideSize / 2);
                    drawGuideCircle(
                        canvas.width / 2,
                        canvas.height / 2,
                        dynamicGuideR
                    );
                }
            }
            // 진행 텍스트 & 메시지
            ctx.fillStyle = '#000';
            ctx.font = '16px sans-serif';
            ctx.fillText(
                `Phase: ${phase} Samples: ${featsRef.current.length}`,
                12,
                24
            );
            if (
                calibRef.current.msg &&
                performance.now() / 1000 < calibRef.current.msgUntil
            ) {
                ctx.font = '30px sans-serif';
                const m = calibRef.current.msg;
                const tw = ctx.measureText(m).width;
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                const padX = 14,
                    padY = 5;
                const x = (canvas.width - tw) / 2 - padX;
                const y = canvas.height / 2 - 20;
                ctx.fillRect(x, y - 29, tw + padX * 2, 44);
                ctx.fillStyle = '#fff';
                ctx.fillText(m, x + padX, y);
            }
            if (!hasFace) {
                const C = calibRef.current;
                C.msg = '얼굴이 감지되지 않습니다. 카메라를 봐주세요.';
                calibRef.current.msgUntil = 0;
            }
        });
        faceMeshRef.current = faceMesh;
    }, []);
    // 메시지 보여주기
    const showMsg = useCallback(async (text, sec = 2.0) => {
        const C = calibRef.current;
        C.msg = text;
        C.msgUntil = performance.now() / 1000 + sec;
        await new Promise((r) => setTimeout(r, sec * 1000));
    }, []);
    // 타겟 단계(중앙/좌/우)
    const runTargetPhase = useCallback(async (name, guideX) => {
        const C = calibRef.current;
        C.phase = name;
        setPhase(name); // 상태 배지 갱신
        C.targets = TARGETS_CENTER;
        C.idx = 0;
        C.timerArmed = false;
        C.currentGuidePos = [guideX, 0.5];
        const per = C.holdMs;
        const total = per * C.targets.length + 200;
        await new Promise((r) => setTimeout(r, total));
    }, []);
    // 5초 타이머 기반 단계(상하/회전/이동)
    const runTimedPhase = useCallback(async (name, seconds = 5.0) => {
        const C = calibRef.current;
        C.phase = name;
        setPhase(name); // 상태 배지 갱신
        C.phaseUntil = performance.now() / 1000 + seconds;
        if (name === 'head_vertical') C.lastGuideY = 0;
        if (name !== 'head_vertical') C.lastGuideX = 0;
        await new Promise((r) => setTimeout(r, seconds * 1000));
    }, []);
    // startStream: 선택된 deviceId로 열기 + rAF 루프
    const startStream = useCallback(async () => {
        stopStream();
        const constraints = selectedCamId
            ? {
                  audio: false,
                  video: {
                      deviceId: { exact: selectedCamId },
                      width: { ideal: 1920 },
                      height: { ideal: 1080 },
                  },
              }
            : {
                  audio: false,
                  video: {
                      facingMode: 'user',
                      width: { ideal: 1920 },
                      height: { ideal: 1080 },
                  },
              };
        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (err) {
            console.warn(
                '선택 카메라 실패, 기본으로 재시도:',
                err?.name || err
            );
            stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false,
            });
        }
        streamRef.current = stream;
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            try {
                await videoRef.current.play();
            } catch (err) {
                // AbortError는 정상적인 중단이므로 무시하고, 다른 에러만 콘솔에 표시합니다.
                if (err.name !== 'AbortError') {
                    console.error('비디오 재생 오류:', err);
                }
            }
        }

        const loop = async () => {
            if (!faceMeshRef.current || !videoRef.current) return;
            await faceMeshRef.current.send({ image: videoRef.current });
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
    }, [selectedCamId, stopStream]);

    useEffect(() => {
        (async () => {
            await listCameras();
            await initFaceMesh();
            await startStream();
        })();

        return () => {
            stopStream();
            if (faceMeshRef.current?.close) {
                try {
                    faceMeshRef.current.close();
                } catch {}
                faceMeshRef.current = null;
            }
        };
    }, []);
    // 파이프라인 시작
    const startPipeline = useCallback(async () => {
        const token = sessionStorage.getItem('token');
        if (!token) return alert('로그인이 필요합니다.');
        setDisabled(true);
        featsRef.current = [];
        labelsRef.current = [];
        lastPushAtRef.current = 0;
        pushLog('캘리브레이션을 시작합니다.');
        const C = calibRef.current;
        C.running = true;
        C.phase = 'intro';
        setPhase('intro');
        C.msg = '얼굴을 중앙에 두고 화면의 점을 따라보세요.';
        C.msgUntil = performance.now() / 1000 + 2.0;
        C.initialFaceH = 0;
        C.idx = 0;
        C.targets = [];
        C.timerArmed = false;
        await new Promise((r) => setTimeout(r, 2000));
        try {
            // center
            await runTargetPhase('center_gaze', 0.5);
            await showMsg('얼굴을 화면 왼쪽으로 이동하세요.', 2.0);
            await runTargetPhase('left_gaze', 0.2);
            await showMsg('얼굴을 화면 오른쪽으로 이동하세요.', 2.0);
            await runTargetPhase('right_gaze', 0.8);
            await showMsg(
                '시선은 정면, 고개만 위아래로 천천히 움직여주세요.',
                2.0
            );
            await runTimedPhase('head_vertical', 5.0);
            await showMsg('시선은 정면, 고개만 좌우로 천천히 회전하세요.', 2.0);
            await runTimedPhase('head_rotation', 5.0);
            await showMsg(
                '시선은 정면, 얼굴만 좌우 어깨 쪽으로 천천히 이동하세요.',
                2.0
            );
            await runTimedPhase('head_translation', 5.0);
            await showMsg(
                '시선은 정면, 얼굴을 뒤앞으로 천천히 움직여주세요.',
                2.0
            );
            await runTimedPhase('forward_backward', 5.0);

            stopStream();

            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }

            pushLog('업로드 중입니다...');
            C.running = false;
            C.finished = true;
            C.msg = '캘리브레이션 완료! 업로드합니다.';
            C.msgUntil = performance.now() / 1000 + 1.5;

            // 샘플 최소 체크
            if (featsRef.current.length < 30) {
                pushLog(
                    `샘플 부족: ${featsRef.current.length}개 (최소 30개 필요)`
                );
                setPhase('error');
                setDisabled(false);
                return;
            }

            // 업로드
            setPhase('finalizing');
            const payload = {
                features: featsRef.current,
                labels: labelsRef.current,
                feature_schema_id: 'v3_iris_7_features',
                feat_names: [
                    'ear_l',
                    'ear_r',
                    'pitch',
                    'gL_h',
                    'gR_h',
                    'gL_v',
                    'gR_v',
                ],
            };
            const res = await axios.post('/model/userdata/save', payload, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 0,
            });

            if (res?.data?.ok) {
                pushLog('개인 모델 학습 완료. 메인으로 이동합니다.');
                setPhase('done');
                navigate('/main');
            } else {
                pushLog('서버 응답이 비정상입니다.');
                setPhase('error');
                setDisabled(false);
            }
        } catch (e) {
            console.error(e);
            const status = e?.response?.status;
            const data = e?.response?.data;
            console.error('Upload error detail', {
                url: '/model/userdata/save',
                status,
                data,
                message: e?.message,
            });
            pushLog(
                `업로드/학습 오류: ` +
                    `${status ?? ''} ` +
                    `${
                        (data && (data.message || data.error)) ||
                        e?.message ||
                        '(상세없음)'
                    }`
            );
            setPhase('error');
            setDisabled(false);
        }
    }, [navigate, pushLog, runTargetPhase, runTimedPhase, showMsg]);
    const phaseLabel =
        {
            idle: '대기 중',
            center_gaze: '중앙(시선 타겟)',
            left_gaze: '좌(시선 타겟)',
            right_gaze: '우(시선 타겟)',
            head_vertical: '고개 상하',
            head_rotation: '고개 좌우 회전',
            head_translation: '얼굴 좌우 이동',
            forward_backward: '얼굴 앞뒤 이동',
            finalizing: '업로드 중',
            done: '완료',
            error: '오류',
        }[phase] || phase;
    return (
        <S.PageWrapper>
            <S.MainContainer>
                <S.VideoContainer>
                    <S.CameraControl>
                        <S.CameraLabel>카메라 선택</S.CameraLabel>
                        <S.CameraSelect
                            value={selectedCamId}
                            onChange={async (e) => {
                                const id = e.target.value;
                                setSelectedCamId(id);
                                localStorage.setItem('preferredCamId', id);
                                try {
                                    await startStream();
                                } catch (err) {
                                    console.error('카메라 전환 실패:', err);
                                }
                            }}
                        >
                            {cameras.map((c, i) => (
                                <option
                                    key={c.deviceId || i}
                                    value={c.deviceId}
                                >
                                    {c.label || `카메라 ${i + 1}`}
                                </option>
                            ))}
                        </S.CameraSelect>
                        <S.RefreshButton
                            type="button"
                            onClick={listCameras}
                            title="장치 목록 새로고침"
                        >
                            새로고침
                        </S.RefreshButton>
                    </S.CameraControl>
                    <S.VideoWrapper>
                        <S.StyledVideo
                            ref={videoRef}
                            playsInline
                            muted
                            autoPlay
                        />
                        <S.StyledCanvas ref={canvasRef} />
                        <S.StatusBadge>{`상태: ${phaseLabel}`}</S.StatusBadge>
                    </S.VideoWrapper>
                </S.VideoContainer>
                <S.InfoPanel>
                    <S.InfoText>
                        사용자 데이터를 수집합니다. 완료되면 홈화면으로
                        이동합니다.
                    </S.InfoText>
                    <S.StartButton onClick={startPipeline} disabled={disabled}>
                        {phase === 'finalizing'
                            ? '업로드 중…'
                            : disabled
                            ? '수집 중…'
                            : '수집 시작'}
                    </S.StartButton>
                    <S.LogSection>
                        <S.LogTitle>진행 로그</S.LogTitle>
                        <S.LogBox>
                            {logs.length === 0 ? (
                                <S.EmptyLogMessage>
                                    아직 로그가 없습니다.
                                </S.EmptyLogMessage>
                            ) : (
                                logs.map((l, i) => (
                                    <S.LogMessage key={i}>{l}</S.LogMessage>
                                ))
                            )}
                        </S.LogBox>
                    </S.LogSection>
                    <S.BulletList>
                        <S.ListItem>
                            최소 샘플 30개 이상을 수집합니다. (현재:{' '}
                            {featsRef.current.length})
                        </S.ListItem>
                        <S.ListItem>
                            카메라 권한을 허용해 주세요. (HTTPS 또는 localhost)
                        </S.ListItem>
                    </S.BulletList>
                </S.InfoPanel>
            </S.MainContainer>
        </S.PageWrapper>
    );
}
