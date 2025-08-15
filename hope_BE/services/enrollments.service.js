const mongoose = require('mongoose');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

function calculateCompletionPercentage(totalPages, lastViewedPage) {
	if (!totalPages || totalPages <= 0) return 0;
	const clamped = Math.max(0, Math.min(lastViewedPage || 0, totalPages));
	return Math.min(100, Math.round((clamped / totalPages) * 100));
}

async function enrollToCourse(req, res, next) {
	try {
		const { userId, courseId } = req.body;
		if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(courseId)) {
			return res.status(400).json({ message: 'Invalid userId or courseId' });
		}
		const course = await Course.findById(courseId).select('_id');
		if (!course) return res.status(404).json({ message: 'Course not found' });

		const enrollment = await Enrollment.create({ userId, courseId });
		Course.findByIdAndUpdate(courseId, { $inc: { studentCount: 1 } }).catch(() => {});
		res.status(201).json(enrollment);
	} catch (err) {
		if (err && err.code === 11000) {
			return res.status(409).json({ message: 'Already enrolled' });
		}
		next(err);
	}
}

async function getEnrollmentByUserAndCourse(req, res, next) {
	try {
		const { userId, courseId } = req.query;
		if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(courseId)) {
			return res.status(400).json({ message: 'Invalid userId or courseId' });
		}
		const enrollment = await Enrollment.findOne({ userId, courseId });
		if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });
		res.json(enrollment);
	} catch (err) {
		next(err);
	}
}

module.exports = {
	enrollToCourse,
	getEnrollmentByUserAndCourse,
};

// 사용자의 수강 강좌 목록(코스 정보 포함) 조회
async function listUserCourses(req, res, next) {
	try {
		const { userId } = req.params;
		if (!mongoose.isValidObjectId(userId)) {
			return res.status(400).json({ message: 'Invalid userId' });
		}
		const items = await Enrollment.aggregate([
			{ $match: { userId: new mongoose.Types.ObjectId(userId) } },
			{ $lookup: { from: 'courses', localField: 'courseId', foreignField: '_id', as: 'course' } },
			{ $unwind: '$course' },
			{
				$project: {
					_id: 0,
					enrollmentId: '$_id',
					enrolledAt: 1,
					courseId: '$course._id',
					title: '$course.title',
					category: '$course.category',
					difficulty: '$course.difficulty',
					totalPages: '$course.totalPages',
					createdAt: '$course.createdAt',
					updatedAt: '$course.updatedAt',
				},
			},
			{ $sort: { enrolledAt: -1 } },
		]);
		res.json({ items });
	} catch (err) {
		next(err);
	}
}

module.exports.listUserCourses = listUserCourses;


