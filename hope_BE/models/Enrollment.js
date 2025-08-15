const mongoose = require('mongoose');

const { Schema } = mongoose;

const EnrollmentSchema = new Schema(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'login', required: true, index: true },
		courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
		enrolledAt: { type: Date, default: Date.now },
	},
	{ timestamps: true }
);

EnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', EnrollmentSchema);


