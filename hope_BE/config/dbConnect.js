const mongoose = require('mongoose');
require('dotenv').config();

const dbConnect = async () => {
    try {
        const connect = await mongoose.connect(process.env.DB_CONNECT);
        console.log(`MongoDB ${connect.connection.name}에 연결되었습니다.`);
    } catch (error) {
        console.error('MongoDB 연결 실패:', error);
    }
};

module.exports = dbConnect;
