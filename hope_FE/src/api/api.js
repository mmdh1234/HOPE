// import axios from 'axios';

// // API 클라이언트 생성
// const apiClient = axios.create({
//   baseURL: '/api', // 백엔드 API 서버의 기본 URL
// });

// // API 요청 인터셉터 (요청 보내기 전 자동 실행)
// apiClient.interceptors.request.use(
//   (config) => {
//     // 로컬 스토리지에서 토큰 가져오기
//     const token = localStorage.getItem('token');
//     if (token) {
//       // 토큰이 있으면 Authorization 헤더에 추가
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // --- 퀴즈 API 함수들 ---

// // 퀴즈 목록 조회
// export const getQuizzes = () => apiClient.get('/quizzes');

// // 파일 업로드로 퀴즈 생성
// export const createQuiz = (formData) => {
//   return apiClient.post('/quizzes', formData, {
//     headers: {
//       'Content-Type': 'multipart/form-data',
//     },
//   });
// };

// // 특정 퀴즈 문제 조회
// export const getQuizById = (quizId) => apiClient.get(`/quizzes/${quizId}`);

// // 퀴즈 답안 제출
// export const submitQuizAnswers = (quizId, data) => {
//   return apiClient.post(`/quizzes/${quizId}/submit`, data);
// };

// // 새 문제 생성 (재학습)
// export const regenerateQuiz = (quizId) => {
//   return apiClient.post(`/quizzes/${quizId}/regenerate`);
// };

// export default apiClient;

// src/api/api.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
});

// API 요청을 보내기 전, 헤더에 자동으로 토큰을 추가하는 설정
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // 로그인 시 저장한 토큰을 가져옴
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 퀴즈 API 함수들
export const getQuizzes = () => apiClient.get('/quizzes');
export const createQuiz = (formData) => apiClient.post('/quizzes', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getQuizById = (quizId) => apiClient.get(`/quizzes/${quizId}`);
export const submitQuizAnswers = (quizId, data) => apiClient.post(`/quizzes/${quizId}/submit`, data);
export const regenerateQuiz = (quizId) => apiClient.post(`/quizzes/${quizId}/regenerate`);