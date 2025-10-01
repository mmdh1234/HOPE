const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');
const checkLogin = require('../middlewares/checkLogin');
const modelController = require('../controllers/modelController');

// 브라우저에서 수집한 데이터 저장 + 학습
router.post('/userdata/save', dataController.saveFromWeb);

// 학습된 사용자 모델 조회
router.get('/user_models/:userId', checkLogin, modelController.getTrainedModel);

module.exports = router;
