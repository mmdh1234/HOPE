const mongoose = require('mongoose');

const { Schema } = mongoose;

const CourseSchema = new Schema(
	{
		title: { type: String, required: true, index: true },
		subtitle: { type: String },
		description: { type: String },
		category: { type: String, enum: ['컴퓨터 기초', '인터넷', '코딩', '알고리즘', 'SW 활용', '웹 개발'], index: true },
		difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], index: true },
		studentCount: { type: Number, default: 0 },
		pdfFileId: { type: Schema.Types.ObjectId, required: true },
		totalPages: { type: Number, min: 1, default: 1 },
		// 강의 생성자 (유일한 수강생)
		createdBy: { type: Schema.Types.ObjectId, ref: 'login', required: true, index: true },
		// 생성자의 진도율 (단일 사용자이므로 Course에 직접 저장)
		currentPage: { type: Number, min: 0, default: 0 },
		completionRate: { type: Number, min: 0, max: 100, default: 0 },
		lastStudiedAt: { type: Date, default: null },
	},
	{ timestamps: true }
);

CourseSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Course', CourseSchema);


