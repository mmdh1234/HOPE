const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');
const modelController = require('../controllers/modelController');
const testController = require('../controllers/testController');
const checkLogin = require('../middlewares/checkLogin');

// 사용자 데이터 수집 (user_data.py 실행)
router.post('/userdata', checkLogin, dataController.collect);

// 사용자 모델 학습 (user_model.py 실행)
router.post('/usermodel', checkLogin, modelController.train);

// 모델 테스트 (test.py 실행)
router.post('/test/start', checkLogin, testController.startTest);
router.post('/test/stop', checkLogin, testController.stopTest);

module.exports = router;
