const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');
const testController = require('../controllers/testController');
const checkLogin = require('../middlewares/checkLogin');

// 브라우저에서 수집한 데이터 저장 + 학습
router.post('/userdata/save', dataController.saveFromWeb);

// 모델 테스트
router.post('/test/start', testController.startTest);
router.post('/test/stop', testController.stopTest);

module.exports = router;
