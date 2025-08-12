const asyncHandler = require('express-async-handler');
const Login = require('../models/loginModel');
const bcrypt = require('bcrypt');
require('dotenv').config();
const jwt = require('jsonwebtoken');
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

const logout = (req, res) => {
    //res.clearCookie('token');
    res.status(200).json({ message: '로그아웃 성공' });
};

module.exports = { loginUser, registerUser, logout };
