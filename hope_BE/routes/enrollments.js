const express = require('express');
const controller = require('../services/enrollments.service');

const router = express.Router();

// 사용자 강좌 등록
router.post('/', controller.enrollToCourse);

// 사용자 강좌 조회
router.get('/', controller.getEnrollmentByUserAndCourse);

// 특정 사용자 수강 강좌 목록
router.get('/user/:userId/courses', controller.listUserCourses);

// 사용자별 진도율 업데이트
router.put('/user/:userId/course/:courseId/progress', controller.updateUserCourseProgress);

// 사용자별 진도 조회
router.get('/user/:userId/course/:courseId/progress', controller.getUserCourseProgress);

module.exports = router;


