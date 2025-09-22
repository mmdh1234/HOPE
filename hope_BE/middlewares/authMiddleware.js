const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const Login = require('../models/loginModel');
const BlacklistedToken = require('../models/blacklist');

const protect = asyncHandler(async (req, res, next) => {
    let token = null;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({ message: '토큰이 필요합니다.' });
    }

    // 블랙리스트 확인
    const black = await BlacklistedToken.findOne({ token });
    if (black) {
        return res.status(401).json({ message: '토큰이 무효화 되었습니다.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        console.log(`🛡️  사용자 인증 성공: ${decoded.id}`);
        req.user = await Login.findById(decoded.id).select('-password');
        next();
    } catch (err) {
        console.error('🛡️  인증 실패:', err);
        return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    }
});

module.exports = { protect };
