const jwt = require('jsonwebtoken');
require('dotenv').config();
const jwtSecret = process.env.JWT_SECRET;

const checkLogin = (req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    // 헤더에서 토큰 추출 (수정된 부분)
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN" 형식

    if (!token) {
        // 토큰이 없으면 401 에러 응답
        return res.status(401).json({ message: '인증 토큰이 필요합니다.' });
    }

    try {
        const decoded = jwt.verify(token, jwtSecret); // 토큰 해석
        req.user = decoded; // decoded 객체 전체를 req.user에 할당 (id 포함)
        next();
    } catch (error) {
        return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    }
};

module.exports = checkLogin;
