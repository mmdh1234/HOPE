// HOPE/hope_BE/controllers/modelController.js
const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');

const getTrainedModel = asyncHandler(async (req, res) => {
    // 보안 검증: 로그인한 사용자와 요청된 사용자 ID가 일치하는지 확인
    const authenticatedUserId = req.user.id;
    const requestedUserId = req.params.userId;

    if (authenticatedUserId !== requestedUserId) {
        return res.status(403).json({
            message: '접근 권한이 없습니다. 자신의 모델만 조회할 수 있습니다.',
        });
    }

    try {
        // .json 파일 경로 설정
        const modelJsonPath = path.join(__dirname, '..', '..', 'hope_Model', 'gmm_focus_model_user.json');
        
        // 파일이 존재하는지 확인
        if (!fs.existsSync(modelJsonPath)) {
            return res.status(404).json({ message: '모델 파일을 찾을 수 없습니다. Python 스크립트를 먼저 실행해주세요.' });
        }

        // JSON 파일을 읽어서 객체로 파싱
        const modelData = JSON.parse(fs.readFileSync(modelJsonPath, 'utf8'));

        // JSON 객체로 응답 전송
        res.status(200).json(modelData);

    } catch (error) {
        console.error('모델 데이터 가져오기 오류:', error);
        res.status(500).json({ message: '서버 오류', error: error.message });
    }
});

module.exports = { getTrainedModel };