const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const dbconnect = require('./config/dbConnect');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get('/api/login', (req, res) => {
    res.json({ message: '백엔드에서 보냄' });
});

app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
