const express = require('express');
const dbConnect = require('./config/dbConnect');
const checkLogin = require('./middlewares/checkLogin');
const errorhandler = require('./middlewares/errorhandler');
//const cookieParser = require('cookie-parser');
const quizRoutes = require('./routes/quizRoutes')
const loginRoutes = require('./routes/loginRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('./public'));

// app.use(cookieParser());

dbConnect();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.use('/api/quizzes', quizRoutes);

app.use(errorhandler);

app.listen(PORT, () => {
    console.log(`${PORT}번 포트에서 서버 실행 중`);
});
