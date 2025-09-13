// const jwt = require('jsonwebtoken');
// require('dotenv').config();
// const jwtSecret = process.env.JWT_SECRET;

// const checkLogin = (req, res, next) => {
//     res.setHeader('Cache_Control', 'no-cache, no-store, must-revalidate');

//     module.exports = checkLogin;

//     const token = req.cookies.token;
//     if (!token) {
//         return res.redirect('/'); // 토큰이 없으면 로그인 페이지로 이동
//     }

//     try {
//         const decoded = jwt.verify(token, jwtSecret); // 토큰 해석
//         req.user = decoded.username;
//         next();
//     } catch (error) {
//         return res.status(401).json({ message: '로그인이 필요합니다.' });
//     }
// };


const jwt = require('jsonwebtoken');
require('dotenv').config();
const jwtSecret = process.env.JWT_SECRET;

const checkLogin = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: '로그인이 필요합니다. (토큰 없음)' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = { id: decoded.id };
        next();
    } catch (error) {
        return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    }
};

module.exports = checkLogin;