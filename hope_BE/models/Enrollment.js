const mongoose = require('mongoose');

const { Schema } = mongoose;

const EnrollmentSchema = new Schema(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'login', required: true, index: true },
		courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
		enrolledAt: { type: Date, default: Date.now },
		// 진도율 관련 필드들 (사용자별로 다르게 저장됨)
		currentPage: { type: Number, min: 0, default: 0 },
		completionRate: { type: Number, min: 0, max: 100, default: 0 },
		lastStudiedAt: { type: Date, default: null },
	},
	{ timestamps: true }
);

EnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', EnrollmentSchema);


