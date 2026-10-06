// models/Application.js
// Represents a candidate's application to a specific job.

const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    resume: {
      type: String, // path/URL to the resume used for this application
      default: '',
    },
    AI_score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // Breakdown of the AI score components for transparency
    scoreBreakdown: {
      skillMatch: { type: Number, default: 0 },
      experienceMatch: { type: Number, default: 0 },
      educationMatch: { type: Number, default: 0 },
      certificationMatch: { type: Number, default: 0 },
      keywordSimilarity: { type: Number, default: 0 },
    },
    shortlisted: {
      type: Boolean,
      default: false,
    },
    interviewStatus: {
      type: String,
      enum: ['not_scheduled', 'scheduled', 'completed', 'cancelled'],
      default: 'not_scheduled',
    },
    applicationStatus: {
      type: String,
      enum: [
        'applied',
        'under_review',
        'shortlisted',
        'interview',
        'rejected',
        'selected',
      ],
      default: 'applied',
    },
  },
  { timestamps: true }
);

// A candidate should not be able to apply to the same job twice
applicationSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });
// Speed up sorting applicants of a job by AI score (used for ranking)
applicationSchema.index({ jobId: 1, AI_score: -1 });

module.exports = mongoose.model('Application', applicationSchema);
