const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { upload, fixFileNameEncoding } = require('../middlewares/fileUpload');

console.log('✅ quizRoutes.js 로드됨');

// Multer의 숨겨진 에러를 잡아내기 위한 핸들러
const handleUpload = (req, res, next) => {
  console.log('2. Multer 파일 업로드 시작');
  
  upload.single('file')(req, res, (err) => {
    if (err) {
      // 💥 만약 파일 업로드(multer) 중 에러가 발생하면, 여기서 잡아서 출력합니다.
      console.error('💥 Multer에서 심각한 오류 발생:', err);
      return res.status(500).json({
        ok: false,
        message: '파일 업로드 중 오류가 발생했습니다.',
        error: err.message,
      });
    }
    console.log('3. Multer 파일 업로드 성공');
    next();
  });
};

// --- 라우터 설정 ---

// POST /api/quizzes : 퀴즈 생성
router.post(
  '/',
  (req, res, next) => {
    console.log('1. /api/quizzes POST 요청 수신');
    next();
  },
  handleUpload, // 👈 중복을 제거하고, 오류 추적 핸들러를 여기에 적용합니다.
  fixFileNameEncoding,
  quizController.createQuiz
);

// GET /api/quizzes : 모든 퀴즈 조회
router.get('/', quizController.getQuizzes);

// GET /api/quizzes/:quizId : 특정 퀴즈 조회
router.get('/:quizId', quizController.getQuizById);

// POST /api/quizzes/:quizId/submit : 퀴즈 제출
router.post('/:quizId/submit', quizController.submitQuiz);

// POST /api/quizzes/:quizId/regenerate : 퀴즈 재 생성
router.post('/:quizId/regenerate', quizController.regenerateQuiz);

// DELETE /api/quizzes/:quizId : 퀴즈 삭제
router.delete('/:quizId', quizController.deleteQuiz);

module.exports = router;