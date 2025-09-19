const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');
const modelController = require('../controllers/modelController');
const checkLogin = require('../middlewares/checkLogin'); // 로그인 확인 미들웨어

// 사용자 데이터 수집 (user_data.py 실행)
router.post('/userdata', checkLogin, dataController.collect);

// 사용자 모델 학습 (user_model.py 실행)
router.post('/usermodel', checkLogin, modelController.train);

module.exports = router;
