const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    sourceFileUrl: {
      type: String,
      required: true,
    },
    latestScore: {
      type: Number,
      default: null,
    },
    latestTimeTaken: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;