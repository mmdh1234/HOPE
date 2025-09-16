// routes/quizRoutes.js
const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
// upload와 fixFileNameEncoding을 모두 불러옵니다.
const { upload, fixFileNameEncoding } = require('../middlewares/fileUpload');

// [수정] upload.single('file') 바로 다음에 fixFileNameEncoding 추가
router.post('/', upload.single('file'), fixFileNameEncoding, quizController.createQuiz);

router.get('/', quizController.getQuizzes);
router.get('/:quizId', quizController.getQuizById);
router.post('/:quizId/submit', quizController.submitQuiz);
router.post('/:quizId/regenerate', quizController.regenerateQuiz);

module.exports = router;