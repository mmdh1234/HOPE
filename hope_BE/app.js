
require('dotenv').config();

console.log('GEMINI_API_KEY 로딩 확인:', process.env.GEMINI_API_KEY ? '성공' : '실패');
console.log('DB_CONNECT 로딩 확인:', process.env.DB_CONNECT ? '성공' : '실패');

const express = require('express');
const dbConnect = require('./config/dbConnect');
const path = require('path');
const checkLogin = require('./middlewares/checkLogin');
const errorhandler = require('./middlewares/errorhandler');
const quizRoutes = require('./routes/quizRoutes');
const loginRoutes = require('./routes/loginRoutes');
const modelRoutes = require('./routes/modelRoutes');
const { protect } = require('./middlewares/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('./public'));
// 업로드된 파일 정적 제공
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

dbConnect();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 공개 강좌/수강 API (인증 미적용)
app.use('/api/courses', require('./routes/courses'));
app.use('/api/enrollments', require('./routes/enrollments'));

app.use(
    '/api',
    (req, res, next) => {
        if (
            req.path === '/login' ||
            req.path === '/signup' ||
            req.path === '/logout'
        ) {
            return next();
        }
        protect(req, res, next);
    },
    require('./routes/loginRoutes')
);

app.use('/api/quizzes', protect, quizRoutes);
app.use('/model', protect, modelRoutes);

app.use(errorhandler);

app.listen(PORT, () => {
    console.log(`${PORT}번 포트에서 서버 실행 중`);
});
