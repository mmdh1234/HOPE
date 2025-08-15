const mongoose = require('mongoose');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { GridFSBucket } = require('mongodb');

async function createCourse(req, res, next) {
	try {
		const { title, category, description, difficulty } = req.body;
		if (!title || !category) {
			return res.status(400).json({ message: 'title, category는 필수입니다.' });
		}
		const allowedDifficulties = ['beginner', 'intermediate', 'advanced'];
		if (difficulty && !allowedDifficulties.includes(difficulty)) {
			return res.status(400).json({ message: 'difficulty는 beginner, intermediate, advanced 중 하나여야 합니다.' });
		}
		if (!req.file) {
			return res.status(400).json({ message: 'PDF 파일이 필요합니다.' });
		}

		// GridFS 직접 업로드 (메모리 버퍼 사용)
		const db = mongoose.connection.db;
		const bucket = new (require('mongodb').GridFSBucket)(db, { bucketName: 'pdfs' });
		const path = require('path');
		const ext = path.extname(req.file.originalname).toLowerCase();
		const base = path.basename(req.file.originalname, ext);
		const filename = `${base}-${Date.now()}${ext}`;
		const uploadStream = bucket.openUploadStream(filename, { contentType: 'application/pdf', metadata: { type: 'course-pdf' }, chunkSizeBytes: 1024 * 1024 });
		uploadStream.end(req.file.buffer);
		await new Promise((resolve, reject) => { uploadStream.on('finish', resolve); uploadStream.on('error', reject); });

		const pdfFileId = new mongoose.Types.ObjectId(uploadStream.id);

		const course = await Course.create({
			title,
			category,
			description: description || '',
			difficulty: difficulty || undefined,
			pdfFileId,
			totalPages: 1,
		});

		res.status(201).json(course);
	} catch (err) {
		next(err);
	}
}

async function listCourses(req, res, next) {
	try {
		const { q, category, difficulty, sort = 'createdAt', order = 'desc', limit = 20, skip = 0 } = req.query;
		const filter = {};
		if (category) filter.category = category;
		if (difficulty) filter.difficulty = difficulty;
		if (q) filter.$text = { $search: q };

		const sortSpec = { [sort]: order === 'asc' ? 1 : -1 };
		const [items, total] = await Promise.all([
			Course.find(filter).sort(sortSpec).skip(Number(skip)).limit(Number(limit)),
			Course.countDocuments(filter),
		]);

		res.json({ items, total });
	} catch (err) {
		next(err);
	}
}

async function getCourseById(req, res, next) {
	try {
		const { courseId } = req.params;
		if (!mongoose.isValidObjectId(courseId)) return res.status(400).json({ message: 'Invalid courseId' });
		const course = await Course.findById(courseId);
		if (!course) return res.status(404).json({ message: 'Course not found' });
		res.json(course);
	} catch (err) {
		next(err);
	}
}

// 코스 개요: 제목, 설명, 난이도, PDF 페이지 수
async function getCourseOverview(req, res, next) {
    try {
        const { courseId } = req.params;
        if (!mongoose.isValidObjectId(courseId)) return res.status(400).json({ message: 'Invalid courseId' });

        const course = await Course.findById(courseId).lean();
        if (!course) return res.status(404).json({ message: 'Course not found' });

        // 단순 구조: 코스의 totalPages 사용
        const totalPdfPages = Number(course.totalPages || 0);

        // 기본 응답
        const response = {
            title: course.title,
            description: course.description || '',
            difficulty: course.difficulty || null,
            totalPdfPages,
        };

        res.json(response);
    } catch (err) {
        next(err);
    }
}

async function updateCourse(req, res, next) {
	try {
		const { courseId } = req.params;
		if (!mongoose.isValidObjectId(courseId)) return res.status(400).json({ message: 'Invalid courseId' });
		const updated = await Course.findByIdAndUpdate(courseId, req.body, { new: true });
		if (!updated) return res.status(404).json({ message: 'Course not found' });
		res.json(updated);
	} catch (err) {
		next(err);
	}
}

async function deleteCourse(req, res, next) {
	try {
		const { courseId } = req.params;
		if (!mongoose.isValidObjectId(courseId)) return res.status(400).json({ message: 'Invalid courseId' });
		const deleted = await Course.findByIdAndDelete(courseId);
		if (!deleted) return res.status(404).json({ message: 'Course not found' });
		res.json({ ok: true });
	} catch (err) {
		next(err);
	}
}

// GridFS에서 코스 PDF 스트리밍
async function streamCoursePdf(req, res, next) {
	try {
		const { courseId } = req.params;
		if (!mongoose.isValidObjectId(courseId)) return res.status(400).json({ message: 'Invalid courseId' });
		const course = await Course.findById(courseId).lean();
		if (!course || !course.pdfFileId) return res.status(404).json({ message: 'PDF not found' });

		const db = mongoose.connection.db;
		const bucket = new GridFSBucket(db, { bucketName: 'pdfs' });
		res.set('Content-Type', 'application/pdf');
		const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(course.pdfFileId));
		downloadStream.on('error', () => res.status(404).end());
		downloadStream.pipe(res);
	} catch (err) {
		next(err);
	}
}

module.exports = {
	createCourse,
	listCourses,
	getCourseById,
	getCourseOverview,
	streamCoursePdf,
	updateCourse,
	deleteCourse,
};


