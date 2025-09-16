const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = 'uploads/';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// 1. multer 설정: 서버에는 안전한 이름으로 저장
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 한글, 특수문자, 띄어쓰기와 상관없이 고유한 이름으로 저장
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, 'file-' + uniqueSuffix + extension);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  // 파일 형식 필터는 그대로 유지
});

// 2. 한글 파일명 깨짐을 해결하는 미들웨어 추가
const fixFileNameEncoding = (req, res, next) => {
  // multer가 파일을 처리한 후, req.file 객체가 존재하면 실행
  if (req.file) {
    // latin1으로 잘못 인코딩된 파일 이름을 utf8로 재해석하여 깨진 한글을 복원
    req.file.originalname = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
  }
  next();
};

// 두 개의 미들웨어를 함께 export
module.exports = { upload, fixFileNameEncoding };