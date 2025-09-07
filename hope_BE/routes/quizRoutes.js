const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const upload = require('../middlewares/fileUpload');

router.post('/', upload.single('file'), quizController.createQuiz);
router.get('/', quizController.getQuizzes);
router.get('/:quizId', quizController.getQuizById);
router.post('/:quizId/submit', quizController.submitQuiz);
router.post('/:quizId/regenerate', quizController.regenerateQuiz);

module.exports = router;