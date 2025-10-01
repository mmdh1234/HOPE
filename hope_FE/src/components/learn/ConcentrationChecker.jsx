import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { FaceMesh } from '@mediapipe/face_mesh';
import axios from 'axios';

// --- 스타일 정의 ---
const CheckerWrapper = styled.div`
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 200px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    padding: 1rem;
    z-index: 1000;
`;

const Video = styled.video`
    width: 100%;
    border-radius: 8px;
    transform: scaleX(-1); // 거울 모드
`;

const StatusIndicator = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1rem;
    padding: 0.5rem;
    border-radius: 8px;
    background-color: ${({ isConcentrating }) =>
        isConcentrating ? '#e6f7ff' : '#fff1f0'};
    color: ${({ isConcentrating }) =>
        isConcentrating ? '#1890ff' : '#f5222d'};
    font-weight: bold;
`;

// ====== 유틸리티 및 GMM 로직 ======
const IDX = {
    L_EYE_EAR: [33, 160, 158, 133, 153, 144],
    R_EYE_EAR: [263, 387, 385, 362, 380, 373],
    EYE_L_CORNERS: [33, 133],
    EYE_R_CORNERS: [263, 362],
    L_IRIS: [474, 475, 476, 477],
    R_IRIS: [469, 470, 471, 472],
    L_EYE_V: [160, 144],
    R_EYE_V: [387, 373],
    MOUTH_MAR: [13, 14, 61, 291],
};
const EMA = (prev, cur, a) => (1 - a) * prev + a * cur;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const eyeEAR = (lm, idx) => {
    const [p1, p2, p3, p4, p5, p6] = idx.map((i) => lm[i]);
    const w = dist(p1, p4) + 1e-6;
    const v1 = dist(p2, p6),
        v2 = dist(p3, p5);
    return (v1 + v2) / (2 * w);
};
const irisCenter = (lm, ids) => {
    let sx = 0,
        sy = 0;
    ids.forEach((i) => {
        sx += lm[i].x;
        sy += lm[i].y;
    });
    return { x: sx / ids.length, y: sy / ids.length };
};
const gazeHV = (lm, cornerIdx, vertIdx, irisIdx) => {
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
};
const extract7 = (lm) => {
    const head_pitch = lm[199].y - lm[10].y;
    const ear_l = eyeEAR(lm, IDX.L_EYE_EAR);
    const ear_r = eyeEAR(lm, IDX.R_EYE_EAR);
    const [gL_h, gL_v] = gazeHV(lm, IDX.EYE_L_CORNERS, IDX.L_EYE_V, IDX.L_IRIS);
    const [gR_h, gR_v] = gazeHV(lm, IDX.EYE_R_CORNERS, IDX.R_EYE_V, IDX.R_IRIS);
    const arr = [ear_l, ear_r, head_pitch, gL_h, gR_h, gL_v, gR_v];
    return arr.every(Number.isFinite) ? arr : null;
};
const sub = (a, b) => a.map((val, i) => val - b[i]);
const transpose = (a) => a[0].map((_, i) => a.map((row) => row[i]));
const inverse = (M) => {
    const m = M.length;
    const n = M[0].length;
    if (m !== n) throw new Error('Matrix must be square to be inverted.');
    const E = M.map((row) => row.slice());
    const I = new Array(m)
        .fill(0)
        .map((_, i) => new Array(m).fill(0).map((_, j) => (i === j ? 1 : 0)));
    for (let i = 0; i < m; i++) {
        let maxRow = i;
        for (let k = i + 1; k < m; k++) {
            if (Math.abs(E[k][i]) > Math.abs(E[maxRow][i])) {
                maxRow = k;
            }
        }
        [E[i], E[maxRow]] = [E[maxRow], E[i]];
        [I[i], I[maxRow]] = [I[maxRow], I[i]];
        const pivot = E[i][i];
        if (Math.abs(pivot) < 1e-12) return null;
        for (let j = i; j < m; j++) E[i][j] /= pivot;
        for (let j = 0; j < m; j++) I[i][j] /= pivot;
        for (let k = 0; k < m; k++) {
            if (k !== i) {
                const factor = E[k][i];
                for (let j = i; j < m; j++) E[k][j] -= factor * E[i][j];
                for (let j = 0; j < m; j++) I[k][j] -= factor * I[i][j];
            }
        }
    }
    return I;
};
const determinant = (M) => {
    const m = M.length;
    const n = M[0].length;
    if (m !== n) return null;
    if (m === 1) return M[0][0];
    const temp = M.map((row) => row.slice());
    let det = 1;
    for (let i = 0; i < m; i++) {
        let pivotRow = i;
        while (pivotRow < m && Math.abs(temp[pivotRow][i]) < 1e-12) {
            pivotRow++;
        }
        if (pivotRow === m) return 0;
        if (pivotRow !== i) {
            [temp[i], temp[pivotRow]] = [temp[pivotRow], temp[i]];
            det *= -1;
        }
        const pivot = temp[i][i];
        det *= pivot;
        for (let j = i; j < m; j++) {
            temp[i][j] /= pivot;
        }
        for (let k = i + 1; k < m; k++) {
            const factor = temp[k][i];
            for (let j = i; j < m; j++) {
                temp[k][j] -= factor * temp[i][j];
            }
        }
    }
    return det;
};
const mmul = (A, B) => {
    const rowsA = A.length,
        colsA = A[0].length,
        rowsB = B.length,
        colsB = B[0].length;
    if (colsA !== rowsB) throw new Error('Matrices cannot be multiplied');
    const C = new Array(rowsA).fill(0).map(() => new Array(colsB).fill(0));
    for (let i = 0; i < rowsA; i++) {
        for (let j = 0; j < colsB; j++) {
            for (let k = 0; k < colsA; k++) {
                C[i][j] += A[i][k] * B[k][j];
            }
        }
    }
    return C;
};
const gmmScoreSamples = (gmm, x) => {
    if (!gmm || !gmm.means || !gmm.covariances || !gmm.weights) {
        return -Infinity;
    }
    const numComponents = gmm.means.length;
    const logLikelihoods = [];
    const EPS = 1e-6;
    for (let i = 0; i < numComponents; i++) {
        const mean = gmm.means[i];
        let covArray = gmm.covariances[i];
        const weight = gmm.weights[i];
        let cov = covArray.map((row) =>
            row.map((val) =>
                typeof val === 'number' && isFinite(val) ? val : EPS
            )
        );
        for (let j = 0; j < cov.length; j++) {
            cov[j][j] += EPS;
        }
        try {
            const det = determinant(cov);
            if (!isFinite(det) || Math.abs(det) < 1e-12) {
                logLikelihoods.push(-Infinity);
                continue;
            }
            const invCov = inverse(cov);
            if (!invCov) {
                logLikelihoods.push(-Infinity);
                continue;
            }
            const diff = sub(x, mean);
            const mahalanobis = mmul(
                [diff],
                mmul(invCov, transpose([diff]))
            )[0][0];
            const dim = x.length;
            const logProb =
                -0.5 *
                (dim * Math.log(2 * Math.PI) + Math.log(det) + mahalanobis);
            logLikelihoods.push(logProb + Math.log(weight));
        } catch (e) {
            console.error('GMM score 계산 중 오류:', e.message);
            logLikelihoods.push(-Infinity);
            continue;
        }
    }
    const maxLogLikelihood = Math.max(...logLikelihoods);
    if (!isFinite(maxLogLikelihood)) {
        return -Infinity;
    }
    const logSumExp =
        maxLogLikelihood +
        Math.log(
            logLikelihoods.reduce((sum, val) => {
                const term = Math.exp(val - maxLogLikelihood);
                return isFinite(term) ? sum + term : sum;
            }, 0)
        );
    return logSumExp;
};

// ====== 파라미터 ======
const EYE_AR_THRESH = 0.2;
const BLINK_MAX_SEC = 0.5;
const EYE_CLOSED_SEC = 3.0;
const DISTRACTED_MIN_SEC = 2.0;

// --- 컴포넌트 구현 ---
const ConcentrationChecker = () => {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const requestRef = useRef();
    const [status, setStatus] = useState('모델 로드 중...');
    const [isConcentrating, setIsConcentrating] = useState(false);
    const [faceMesh, setFaceMesh] = useState(null);
    const [gmmModel, setGmmModel] = useState(null);
    const eyesClosedStartRef = useRef(null);
    const prevStatusTextRef = useRef('이탈');
    const prevIsConcentratingRef = useRef(false);
    const distractedStartRef = useRef(null);

    const onResults = useCallback(
        (results) => {
            const lm = results.multiFaceLandmarks?.[0];
            const hasFace = !!lm;

            let currentStatus = '얼굴을 보여주세요';
            let currentIsConcentrating = false;

            if (hasFace) {
                const gmmFeat = extract7(lm);
                if (gmmFeat && gmmModel) {
                    const earL = gmmFeat[0];
                    const earR = gmmFeat[1];
                    const bothEyesClosed =
                        earL < EYE_AR_THRESH && earR < EYE_AR_THRESH;
                    const now = performance.now();
                    let isBlink = false;
                    let isDrowsy = false;

                    if (bothEyesClosed) {
                        if (eyesClosedStartRef.current === null) {
                            eyesClosedStartRef.current = now;
                        }
                        const closedDur =
                            (now - eyesClosedStartRef.current) / 1000;
                        isDrowsy = closedDur >= EYE_CLOSED_SEC;
                        isBlink = closedDur < BLINK_MAX_SEC;
                    } else {
                        if (eyesClosedStartRef.current !== null) {
                            const closedDur =
                                (now - eyesClosedStartRef.current) / 1000;
                            isBlink = closedDur < BLINK_MAX_SEC;
                        }
                        eyesClosedStartRef.current = null;
                    }

                    let gmmDecisionFocus = false;
                    if (!bothEyesClosed && gmmModel.scaler) {
                        const xScaled = gmmFeat.map(
                            (val, i) =>
                                (val - gmmModel.scaler.mean[i]) /
                                gmmModel.scaler.std[i]
                        );
                        let posScore = gmmModel.gmm_pos
                            ? gmmScoreSamples(gmmModel.gmm_pos, xScaled) +
                              gmmModel.log_prior_pos
                            : -Infinity;
                        let negScore = gmmModel.gmm_neg
                            ? gmmScoreSamples(gmmModel.gmm_neg, xScaled) +
                              gmmModel.log_prior_neg
                            : -Infinity;

                        if (posScore === -Infinity && negScore === -Infinity) {
                            gmmDecisionFocus = false;
                        } else if (gmmModel.gmm_pos && gmmModel.gmm_neg) {
                            gmmDecisionFocus = posScore >= negScore;
                        } else if (gmmModel.gmm_pos) {
                            gmmDecisionFocus =
                                gmmModel.oneclass_thresh &&
                                posScore >= gmmModel.oneclass_thresh;
                        }
                    }

                    if (isDrowsy) {
                        currentStatus = '졸음 감지!';
                        currentIsConcentrating = false;
                        distractedStartRef.current = null; // 졸음 상태일 때 이탈 타이머는 리셋
                    } else if (gmmDecisionFocus) {
                        currentStatus = '집중 중';
                        currentIsConcentrating = true;
                        distractedStartRef.current = null; // 집중 상태가 되면 이탈 타이머를 리셋
                    } else {
                        // GMM이 이탈로 판단했을 때
                        if (distractedStartRef.current === null) {
                            // 이탈 상태가 방금 시작되었다면 현재 시간 기록
                            distractedStartRef.current = now;
                        }

                        const distractedDur =
                            (now - distractedStartRef.current) / 1000;

                        if (distractedDur >= DISTRACTED_MIN_SEC) {
                            // 이탈 상태가 2초 이상 유지되었다면 상태 변경
                            currentStatus = '이탈';
                            currentIsConcentrating = false;
                        } else {
                            // 2초가 안 되었다면 이전 상태를 잠시 유지 (깜빡임 방지)
                            currentStatus = prevStatusTextRef.current;
                            currentIsConcentrating =
                                prevIsConcentratingRef.current;
                        }
                    }

                    if (isBlink) {
                        currentStatus = prevStatusTextRef.current;
                        currentIsConcentrating = prevIsConcentratingRef.current;
                    } else {
                        prevStatusTextRef.current = currentStatus;
                        prevIsConcentratingRef.current = currentIsConcentrating;
                    }
                }
            }
            setStatus(currentStatus);
            setIsConcentrating(currentIsConcentrating);
        },
        [gmmModel]
    );

    useEffect(() => {
        const loadAndInit = async () => {
            try {
                const userId = sessionStorage.getItem('userId');
                const token = sessionStorage.getItem('token');
                if (!token) {
                    setStatus('로그인 토큰 없음');
                    return;
                }
                setStatus('모델 데이터 로딩 중...');
                const response = await axios.get(
                    `/model/user_models/${userId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setGmmModel(response.data);
                setStatus('얼굴 인식 모델 로딩 중...');
            } catch (error) {
                console.error('모델 로드 실패:', error);
                setStatus('모델 로드 오류');
                return;
            }

            const faceMeshInstance = new FaceMesh({
                locateFile: (file) =>
                    `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
            });
            faceMeshInstance.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5,
            });
            setFaceMesh(faceMeshInstance);
        };
        loadAndInit();
    }, []);

    useEffect(() => {
        if (faceMesh) {
            faceMesh.onResults(onResults);
        }
    }, [faceMesh, onResults]);

    useEffect(() => {
        if (!faceMesh || !gmmModel) return;

        setStatus('카메라 켜는 중...');
        const video = videoRef.current;

        const startWebcamAndLoop = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                });
                streamRef.current = stream;
                video.srcObject = stream;

                const predictLoop = async () => {
                    if (video.readyState >= 3) {
                        await faceMesh.send({ image: video });
                    }
                    requestRef.current = requestAnimationFrame(predictLoop);
                };

                video.onloadedmetadata = () => {
                    video.play().catch((err) => {
                        if (err.name !== 'AbortError')
                            console.error('비디오 재생 오류:', err);
                    });
                    predictLoop();
                };
            } catch (err) {
                console.error('웹캠 접근 실패:', err);
                setStatus('카메라 오류');
            }
        };

        startWebcamAndLoop();

        return () => {
            cancelAnimationFrame(requestRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, [faceMesh, gmmModel]);

    return (
        <CheckerWrapper>
            <Video ref={videoRef} autoPlay playsInline muted />
            <StatusIndicator isConcentrating={isConcentrating}>
                {status}
            </StatusIndicator>
        </CheckerWrapper>
    );
};

export default ConcentrationChecker;
