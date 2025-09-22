import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
    VideoContainer,
    VideoElem,
    VideoCanvas,
    StatusBadge,
} from '../../pages/DataCollection/DataCollectionPage.styles'; // 재사용

// MediaPipe 인덱스 및 유틸 함수는 DataCollectionPage.jsx와 동일합니다.
// 여기서는 생략하고, 해당 파일에서 직접 복사하여 사용하셔야 합니다.
// (예시를 위해 필수적인 함수만 재포함합니다.)
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
    let sx = 0, sy = 0;
    ids.forEach((i) => {
        sx += lm[i].x;
        sy += lm[i].y;
    });
    return { x: sx / ids.length, y: sy / ids.length };
}
function gazeHV(lm, cornerIdx, vertIdx, irisIdx) {
    const c1 = lm[cornerIdx[0]], c2 = lm[cornerIdx[1]];
    const eye_cx = (c1.x + c2.x) * 0.5, eye_w = Math.abs(c2.x - c1.x) + 1e-6;
    const vUp = lm[vertIdx[0]], vDn = lm[vertIdx[1]];
    const eye_cy = (vUp.y + vDn.y) * 0.5, eye_h = Math.abs(vDn.y - vUp.y) + 1e-6;
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
// ===================================================================

const ConcentrationChecker = ({ userId }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const faceMeshRef = useRef(null);
    const rafRef = useRef(null);
    const [concentrationScore, setConcentrationScore] = useState(null);
    const [status, setStatus] = useState('모델 로딩 중...');

    // MediaPipe 초기화 및 비디오 스트림 시작
    const initFaceMesh = useCallback(async () => {
        let FaceMesh;
        try {
            const fm = await import('@mediapipe/face_mesh');
            FaceMesh = fm.FaceMesh;
        } catch {
            FaceMesh = window.FaceMesh;
        }

        const faceMesh = new FaceMesh({
            locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
        });
        faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.6,
            minTrackingConfidence: 0.6,
        });

        faceMesh.onResults(async (results) => {
            const lm = results.multiFaceLandmarks?.[0];
            if (!lm) {
                setStatus('얼굴을 감지할 수 없습니다. 카메라를 봐주세요.');
                return;
            }

            const features = extract7(lm);
            if (!features) {
                setStatus('유효한 특징 데이터를 추출할 수 없습니다.');
                return;
            }
            
            // 추출된 특징을 백엔드로 보내 예측 요청
            try {
                const response = await axios.post('/model/predict_concentration', { features });
                setConcentrationScore(response.data.score);
                setStatus('집중도 측정 중...');
            } catch (error) {
                console.error('집중도 예측 오류:', error);
                setStatus('집중도 예측 중 오류 발생');
            }
        });
        faceMeshRef.current = faceMesh;

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
        }

        const loop = async () => {
            if (videoRef.current) {
                await faceMesh.send({ image: videoRef.current });
            }
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
    }, []);

    useEffect(() => {
        const startUp = async () => {
            await initFaceMesh();
            setStatus('집중도 측정 준비 완료.');
        };
        startUp();

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
            if (videoRef.current?.srcObject) {
                videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
            }
            if (faceMeshRef.current?.close) {
                faceMeshRef.current.close();
            }
        };
    }, [initFaceMesh]);

    return (
        <div>
            <h2>실시간 집중도 측정</h2>
            <VideoContainer>
                <VideoElem ref={videoRef} playsInline muted autoPlay />
                <VideoCanvas ref={canvasRef} />
                <StatusBadge>{`상태: ${status}`}</StatusBadge>
            </VideoContainer>
            {concentrationScore !== null && (
                <div style={{ marginTop: '20px', fontSize: '24px' }}>
                    <strong>현재 집중도: {concentrationScore.toFixed(2)}</strong>
                </div>
            )}
        </div>
    );
};

export default ConcentrationChecker;