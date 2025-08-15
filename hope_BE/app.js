const express = require('express');
const dbConnect = require('./config/dbConnect');
const path = require('path');
const checkLogin = require('./middlewares/checkLogin');
const errorhandler = require('./middlewares/errorhandler');
//const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('./public'));
// 업로드된 파일 정적 제공
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//app.use(cookieParser());

dbConnect();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 공개 강좌/수강 API (인증 미적용)
app.use('/api/courses', require('./routes/courses'));
app.use('/api/enrollments', require('./routes/enrollments'));

app.use(
    '/api',
    (req, res, next) => {
        if (req.path === '/login' || req.path === '/signup') {
            return next();
        }
        checkLogin(req, res, next);
    },
    require('./routes/loginRoutes')
);

app.use(errorhandler);

app.listen(PORT, () => {
    console.log(`${PORT}번 포트에서 서버 실행 중`);
});
