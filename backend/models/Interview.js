// models/Interview.js
// Interview scheduling, AI-generated questions, and feedback/scoring.

const mongoose = require('mongoose');

const aiQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    skillTag: { type: String, default: '' },
    candidateAnswer: { type: String, default: '' },
    answerScore: { type: Number, default: null, min: 0, max: 10 },
  },
  { _id: false }
);

const interviewSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
    },
    date: {
      type: Date,
      required: [true, 'Interview date is required'],
    },
    meetingLink: {
      type: String,
      default: '',
    },
    interviewer: {
      type: String, // name or ref id of the recruiter/interviewer
      default: '',
    },
    AIQuestions: {
      type: [aiQuestionSchema],
      default: [],
    },
    score: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    feedback: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Interview', interviewSchema);
