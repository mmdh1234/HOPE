import axios from 'axios';

// 1. API 클라이언트 생성 (한 번만)
const apiClient = axios.create({
  baseURL: '/api', // 백엔드 API 서버의 기본 URL
});

// 2. API 요청 인터셉터 (요청 보내기 전 자동 실행)
apiClient.interceptors.request.use(
  (config) => {
    // 로컬 스토리지에서 토큰 가져오기
    const token = localStorage.getItem('token');
    if (token) {
      // 토큰이 있으면 Authorization 헤더에 추가
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- 퀴즈 API 함수들 ---
export const getQuizzes = () => apiClient.get('/quizzes');
export const createQuiz = (formData) =>
  apiClient.post('/quizzes', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const getQuizById = (quizId) => apiClient.get(`/quizzes/${quizId}`);
export const submitQuizAnswers = (quizId, data) =>
  apiClient.post(`/quizzes/${quizId}/submit`, data);
export const regenerateQuiz = (quizId) =>
  apiClient.post(`/quizzes/${quizId}/regenerate`);

// --- 강좌 API 함수들 ---
export const getMyCourses = () => {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    // userId가 없으면 Promise.reject를 반환하여 에러 처리
    return Promise.reject(new Error('사용자 ID를 찾을 수 없습니다.'));
  }
  return apiClient.get(`/courses/users/${userId}/courses`);
};

export const getCourses = () => apiClient.get('/courses');

export const deleteCourse = (courseId) => {
  return apiClient.delete(`/courses/${courseId}`);
};
/**
 * 강좌를 삭제하는 API 함수
 * @param {string} courseId 삭제할 강좌의 ID
 * @returns {Promise<any>}
 */

// '내 강좌'의 진도율을 가져오는 함수
export const getMyCourseProgress = (courseId) => {
  return apiClient.get(`/courses/${courseId}/my-progress`);
};

// '내 강좌'의 진도율을 업데이트하는 함수
export const updateMyCourseProgress = (courseId, { currentPage, totalPages }) => {
  // 👇 1. 로컬 스토리지에서 현재 로그인한 사용자의 ID를 가져옵니다.
  const userId = localStorage.getItem('userId');

  // 👇 2. API 요청 본문에 totalPages 대신 백엔드가 요구하는 userId를 담아서 보냅니다.
  //    이제 백엔드의 규칙과 정확히 일치하게 됩니다.
  return apiClient.patch(`/courses/${courseId}/my-progress`, { currentPage, userId });
};