const mongoose = require('mongoose');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { GridFSBucket } = require('mongodb');
const asyncHandler = require('express-async-handler');
const pdfParse = require('pdf-parse');

async function createCourse(req, res, next) {
	try {
		const { title, category, description, difficulty, userId } = req.body;
		if (!title || !category || !userId) {
			return res.status(400).json({ message: 'title, category, userId는 필수입니다.' });
		}
		if (!mongoose.isValidObjectId(userId)) {
			return res.status(400).json({ message: '유효하지 않은 userId입니다.' });
		}
		const allowedDifficulties = ['beginner', 'intermediate', 'advanced'];
		if (difficulty && !allowedDifficulties.includes(difficulty)) {
			return res.status(400).json({ message: 'difficulty는 beginner, intermediate, advanced 중 하나여야 합니다.' });
		}
		if (!req.file) {
			return res.status(400).json({ message: 'PDF 파일이 필요합니다.' });
		}

		// PDF 페이지 수 계산
		let totalPages = 1; // 기본값
		try {
			const pdfData = await pdfParse(req.file.buffer);
			totalPages = pdfData.numpages || 1;
			console.log(`PDF 페이지 수: ${totalPages}`);
		} catch (pdfError) {
			console.warn('PDF 페이지 수 계산 실패, 기본값(1) 사용:', pdfError.message);
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
			totalPages, // 자동 계산된 페이지 수
			createdBy: userId,
			currentPage: 0,
			completionRate: 0,
			lastStudiedAt: null,
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

const deleteCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    // 1. 삭제할 강좌 정보 조회
    const course = await Course.findById(courseId);

    if (!course) {
        res.status(404);
        throw new Error('해당 강좌를 찾을 수 없습니다.');
    }

    // (선택 사항) 현재 로그인한 사용자가 강좌 생성자인지 확인하는 권한 체크 로직
    // if (course.user.toString() !== req.user.id) {
    //     res.status(401);
    //     throw new Error('강좌를 삭제할 권한이 없습니다.');
    // }

    // 2. GridFS에서 PDF 파일 삭제
    // pdfFileId가 존재할 경우에만 실행
    if (course.pdfFileId) {
        const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
            bucketName: 'pdfs',
        });
        // GridFS의 delete 메소드는 존재하지 않는 id에 대해 에러를 던질 수 있으므로 try-catch로 감싸는 것이 더 안전합니다.
        try {
            await bucket.delete(new mongoose.Types.ObjectId(course.pdfFileId));
        } catch (error) {
            console.error(`GridFS 파일 삭제 실패 (fileId: ${course.pdfFileId}):`, error.message);
            // 여기서 에러를 던지지 않고 계속 진행하여 나머지 데이터는 삭제되도록 할 수 있습니다.
        }
    }

    // 3. 이 강좌와 관련된 모든 수강 정보(Enrollments) 삭제
    await Enrollment.deleteMany({ course: courseId });

    // 4. 마지막으로 강좌 데이터 삭제
    await course.deleteOne(); // 최신 Mongoose 문법

    res.status(200).json({ message: '강좌가 성공적으로 삭제되었습니다.' });
});

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

// 내가 만든 강의 목록 조회
async function getMyCourses(req, res, next) {
	try {
		const { userId } = req.params;
		if (!mongoose.isValidObjectId(userId)) {
			return res.status(400).json({ message: '유효하지 않은 userId입니다.' });
		}

		const { sort = 'createdAt', order = 'desc', limit = 20, skip = 0 } = req.query;
		const filter = { createdBy: userId };

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


// 진도율 업데이트 (생성자만 가능)
async function updateMyCourseProgress(req, res, next) {
	try {
		const { courseId } = req.params;
		const { currentPage, userId } = req.body;

		if (!mongoose.isValidObjectId(courseId)) {
			return res.status(400).json({ message: 'Invalid courseId' });
		}

		if (!mongoose.isValidObjectId(userId)) {
			return res.status(400).json({ message: 'Invalid userId' });
		}

		if (typeof currentPage !== 'number' || currentPage < 0) {
			return res.status(400).json({ message: 'currentPage는 0 이상의 숫자여야 합니다.' });
		}

		const course = await Course.findById(courseId);
		if (!course) {
			return res.status(404).json({ message: 'Course not found' });
		}

		// 강의 생성자만 진도율 업데이트 가능
		if (course.createdBy.toString() !== userId) {
			return res.status(403).json({ message: '본인이 만든 강의만 학습할 수 있습니다.' });
		}

		// 진도율 계산 (totalPages 기준)
		const completionRate = course.totalPages > 0 
			? Math.min(100, Math.round((currentPage / course.totalPages) * 100))
			: 0;

		const updatedCourse = await Course.findByIdAndUpdate(
			courseId,
			{
				currentPage: Math.min(currentPage, course.totalPages),
				completionRate,
				lastStudiedAt: new Date(),
			},
			{ new: true }
		);

		res.json({
			courseId: updatedCourse._id,
			title: updatedCourse.title,
			currentPage: updatedCourse.currentPage,
			totalPages: updatedCourse.totalPages,
			completionRate: updatedCourse.completionRate,
			lastStudiedAt: updatedCourse.lastStudiedAt,
		});
	} catch (err) {
		next(err);
	}
}

// 내 강의 진도 조회 (생성자의 진도)
async function getMyCourseProgress(req, res, next) {
	try {
		const { courseId } = req.params;
		const { userId } = req.query;
		
		if (!mongoose.isValidObjectId(courseId)) {
			return res.status(400).json({ message: 'Invalid courseId' });
		}

		if (!mongoose.isValidObjectId(userId)) {
			return res.status(400).json({ message: 'Invalid userId' });
		}

		const course = await Course.findById(courseId);
		if (!course) {
			return res.status(404).json({ message: 'Course not found' });
		}

		// 강의 생성자만 진도 조회 가능
		if (course.createdBy.toString() !== userId) {
			return res.status(403).json({ message: '본인이 만든 강의만 조회할 수 있습니다.' });
		}

		res.json({
			courseId,
			title: course.title,
			currentPage: course.currentPage,
			totalPages: course.totalPages,
			completionRate: course.completionRate,
			lastStudiedAt: course.lastStudiedAt,
			createdAt: course.createdAt,
		});
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
	getMyCourses,
	updateMyCourseProgress,
	getMyCourseProgress,
};


