const asyncHandler = require('express-async-handler');
const Login = require('../models/loginModel');
const bcrypt = require('bcrypt');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const BlacklistedToken = require('../models/blacklist');
const jwtSecret = process.env.JWT_SECRET;

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;
    if (!name || !email || !password || !confirmPassword) {
        return res.status(400).json({ message: '모든 항목을 입력해주세요.' });
    }
    if (!email.includes('@')) {
        return res
            .status(400)
            .json({ message: '유효한 이메일을 입력해주세요.' });
    }

    if (password !== confirmPassword) {
        return res
            .status(400)
            .json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    if (password.length < 6) {
        return res.status(400).json({
            message: '비밀번호는 6자리 이상이어야 합니다.',
        });
    }

    const existingUser = await Login.findOne({ email });
    if (existingUser) {
        return res.status(400).json({
            message: '이미 존재하는 사용자입니다. 다른 이메일을 사용해주세요.',
        });
    }

    // registerUser 안에 넣어서 어떤 에러인지 로그 찍기
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await Login.create({ name, email, password: hashedPassword });
        res.status(201).json({ message: '회원가입 성공' });
    } catch (error) {
        console.error('회원가입 에러:', error);
        res.status(500).json({ message: '서버 에러', error: error.message });
    }
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res
            .status(400)
            .json({ message: '이메일과 비밀번호를 입력해주세요.' });
    }

    const user = await Login.findOne({ email });
    if (!user) {
        return res.status(401).json({ message: '일치하는 사용자가 없습니다.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res
            .status(401)
            .json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: '1h' });

    res.status(200).json({
        message: '로그인 성공',
        token,
        user: {
            id: user._id,
            email: user.email,
            username: user.name,
        },
    });
});

const logout = asyncHandler(async (req, res) => {
    try {
        // 1) 토큰을 Authorization 헤더에서 읽기
        let token = null;
        const authHeader = req.headers.authorization || '';
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }

        // 2) 또는 body에 token이 있으면 (sendBeacon 보낼때 body로 보낼 경우)
        if (!token && req.body && req.body.token) {
            token = req.body.token;
        }

        if (!token) {
            // 토큰이 없어도 클라이언트 측에서 토큰 제거해주면 사용자는 로그아웃됨
            return res
                .status(200)
                .json({ message: '로그아웃 성공(토큰 없음)' });
        }

        // 토큰 디코드해서 만료시간 추출(옵션)
        let expiresAt = null;
        try {
            const decoded = jwt.decode(token);
            if (decoded && decoded.exp) {
                expiresAt = new Date(decoded.exp * 1000);
            }
        } catch (e) {
            // decode 실패해도 블랙리스트에 넣는 것으로 처리
        }

        // 블랙리스트에 추가 (중복 가능성 대비 try/catch)
        await BlacklistedToken.create({ token, expiresAt }).catch((err) => {
            // 중복(이미 블랙리스트)에러는 무시
            if (err.code !== 11000)
                console.error('Blacklisting token error:', err);
        });

        return res.status(200).json({ message: '로그아웃 성공' });
    } catch (error) {
        console.error('logout error', error);
        return res.status(500).json({ message: '서버 에러' });
    }
});

module.exports = { loginUser, registerUser, logout };
