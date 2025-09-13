const mongoose = require('mongoose');

const loginSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, '이름을 입력해주세요'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, '이메일을 입력해주세요'],
            unique: true, // 이메일은 유일해야 함
            lowercase: true, // 이메일을 소문자로 저장
            match: [/^\S+@\S+\.\S+$/, '올바른 이메일 주소를 입력해주세요'],
        },
        password: {
            type: String,
            required: [true, '비밀번호를 입력해주세요'],
            minlength: [6, '비밀번호는 최소 6자 이상이어야 합니다'],
        },
    },
    {
        timestamps: true, // 데이터베이스에 추가 혹은 수정 시간 자동으로 기록
    }
);

module.exports = mongoose.model('login', loginSchema);
