const mongoose = require('mongoose');

const questionSetSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    questions: [
      {
        questionText: { type: String, required: true },
        options: [{ type: String, required: true }],
        correctAnswer: { type: String, required: true },
      },
    ],
    score: {
      type: Number,
      default: null,
    },
    timeTaken: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const QuestionSet = mongoose.model('QuestionSet', questionSetSchema);

module.exports = QuestionSet;