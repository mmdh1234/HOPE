const express = require('express');
const multer = require('multer');
const path = require('path');
require('dotenv').config();
const controller = require('../services/courses.service');

const router = express.Router();

// 메모리 스토리지 사용 후 서비스에서 GridFS로 저장
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.pdf') return cb(new Error('PDF 파일만 업로드할 수 있습니다.'));
    cb(null, true);
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } });

// 강좌 생성 (PDF 업로드 + title, category, description)
router.post('/', upload.single('pdf'), controller.createCourse);

// 강좌 검색
router.get('/', controller.listCourses);

// 강좌 상세 조회
router.get('/:courseId', controller.getCourseById);

// 강좌 PDF 스트리밍
router.get('/:courseId/pdf', controller.streamCoursePdf);

// 강좌 개요 조회 (제목, 설명, 난이도, 총 PDF 페이지, 선택: userId로 진도율 포함)
router.get('/:courseId/overview', controller.getCourseOverview);

// 강좌 수정
router.put('/:courseId', controller.updateCourse);

// 강좌 삭제
router.delete('/:courseId', controller.deleteCourse);

module.exports = router;


