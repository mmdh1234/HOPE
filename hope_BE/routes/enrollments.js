const express = require('express');
const controller = require('../services/enrollments.service');

const router = express.Router();

// 사용자 강좌 등록
router.post('/', controller.enrollToCourse);

// 사용자 강좌 조회
router.get('/', controller.getEnrollmentByUserAndCourse);

// 특정 사용자 수강 강좌 목록
router.get('/user/:userId/courses', controller.listUserCourses);

module.exports = router;


