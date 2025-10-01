const asyncHandler = require('express-async-handler');
const UserModel = require('../models/userModel');

const getTrainedModel = asyncHandler(async (req, res) => {
    const authenticatedUserId = req.user.id;
    const requestedUserId = req.params.userId;

    if (authenticatedUserId !== requestedUserId) {
        return res.status(403).json({
            message: '접근 권한이 없습니다. 자신의 모델만 조회할 수 있습니다.',
        });
    }

    try {
        // MongoDB에서 userId로 모델 검색
        const userModel = await UserModel.findOne({ userId: requestedUserId });

        if (!userModel) {
            return res.status(404).json({
                message:
                    '사용자의 학습된 모델을 찾을 수 없습니다. 먼저 데이터 수집을 진행해주세요.',
            });
        }

        // 찾은 모델의 modelData 필드를 JSON으로 응답
        res.status(200).json(userModel.modelData);
    } catch (error) {
        console.error('모델 데이터 가져오기 오류:', error);
        res.status(500).json({ message: '서버 오류', error: error.message });
    }
});

module.exports = { getTrainedModel };
