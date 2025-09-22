import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import { startModel, stopModel } from '../../api/api'; // API 함수 임포트

// --- 스타일 정의 (기존과 동일) ---
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

// --- 컴포넌트 구현 (디버깅 코드 추가) ---
const ConcentrationChecker = () => {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const requestRef = useRef();
    const [status, setStatus] = useState('모델 로드 중...');
    const [isConcentrating, setIsConcentrating] = useState(true);
    const [faceLandmarker, setFaceLandmarker] = useState(null);

    // 컴포넌트 마운트/언마운트 시 API 호출 (디버깅 코드 추가)
    useEffect(() => {
        const handleModelStart = async () => {
            console.log(
                '▶️ [Component] ConcentrationChecker가 마운트되어 모델 시작을 시도합니다.'
            );
            try {
                const response = await startModel();
                console.log(
                    '✅ [Component] 모델 시작 API 호출 성공!',
                    response.data
                );
            } catch (error) {
                console.error('❌ [Component] 모델 시작 API 호출 실패:', error);
                setStatus('모델 시작 오류');
            }
        };

        handleModelStart();

        // 컴포넌트가 언마운트될 때 실행될 클린업 함수
        return () => {
            const handleModelStop = async () => {
                console.log(
                    '⏹️ [Component] ConcentrationChecker가 언마운트되어 모델 중지를 시도합니다.'
                );
                try {
                    const response = await stopModel();
                    console.log(
                        '✅ [Component] 모델 중지 API 호출 성공!',
                        response.data
                    );
                } catch (error) {
                    console.error(
                        '❌ [Component] 모델 중지 API 호출 실패:',
                        error
                    );
                }
            };
            handleModelStop();
        };
    }, []); // 빈 배열: 마운트 시 한 번만 실행

    // MediaPipe 모델 로드 로직 (기존과 동일)
    useEffect(() => {
        const createFaceLandmarker = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
                );
                const landmarker = await FaceLandmarker.createFromOptions(
                    vision,
                    {
                        baseOptions: {
                            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                            delegate: 'GPU',
                        },
                        runningMode: 'VIDEO',
                        numFaces: 1,
                    }
                );
                setFaceLandmarker(landmarker);
                setStatus('카메라 켜는 중...');
            } catch (error) {
                console.error('모델 로드 실패:', error);
                setStatus('모델 로드 오류');
            }
        };
        createFaceLandmarker();
    }, []);

    // 웹캠 켜기 및 예측 로직 (기존과 동일)
    useEffect(() => {
        if (!faceLandmarker) return;

        let lastVideoTime = -1;
        const predictWebcam = () => {
            const video = videoRef.current;
            if (video && video.currentTime !== lastVideoTime) {
                lastVideoTime = video.currentTime;
                const results = faceLandmarker.detectForVideo(
                    video,
                    performance.now()
                );
                if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                    const nose = results.faceLandmarks[0][4];
                    if (
                        nose.x < 0.2 ||
                        nose.x > 0.8 ||
                        nose.y < 0.2 ||
                        nose.y > 0.8
                    ) {
                        setStatus('집중 필요');
                        setIsConcentrating(false);
                    } else {
                        setStatus('집중 중');
                        setIsConcentrating(true);
                    }
                } else {
                    setStatus('얼굴을 보여주세요');
                    setIsConcentrating(false);
                }
            }
            requestRef.current = requestAnimationFrame(predictWebcam);
        };

        const enableWebcam = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.addEventListener(
                        'loadeddata',
                        predictWebcam
                    );
                }
            } catch (err) {
                console.error('웹캠 접근 실패:', err);
                setStatus('카메라 오류');
            }
        };

        enableWebcam();

        return () => {
            cancelAnimationFrame(requestRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, [faceLandmarker]);

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
