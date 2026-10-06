// models/FraudCheck.js
// Stores the results of the AI Candidate Fraud Detection & Verification
// module. One document per candidate (kept up to date on re-checks) so a
// recruiter always sees the latest verification snapshot. This model does
// not duplicate candidate data — it references the existing User /
// CandidateProfile / Application documents instead.

const mongoose = require('mongoose');

const RISK_LEVELS = ['Low Risk', 'Needs Review', 'Suspicious', 'High Risk'];
const VERIFICATION_STATUSES = [
  'Verified',
  'Passed',
  'Needs Review',
  'Unable to Verify',
  'Contradiction Found',
  'Suspicious',
];

// --- Sub-schemas -----------------------------------------------------

const certificateCheckSchema = new mongoose.Schema(
  {
    certificateId: { type: mongoose.Schema.Types.ObjectId }, // references CandidateProfile.certificates._id
    certificateTitle: { type: String, default: '' },
    issuingOrganization: { type: String, default: '' },
    status: {
      type: String,
      enum: VERIFICATION_STATUSES,
      default: 'Needs Review',
    },
    evidence: { type: [String], default: [] },
    verificationSource: { type: String, default: '' },
  },
  { _id: false }
);

const experienceCheckSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    company: { type: String, default: '' },
    startDate: { type: Date },
    endDate: { type: Date },
    durationMonths: { type: Number, default: 0 },
    flags: { type: [String], default: [] },
    status: {
      type: String,
      enum: VERIFICATION_STATUSES,
      default: 'Passed',
    },
  },
  { _id: false }
);

const timelineOverlapSchema = new mongoose.Schema(
  {
    companyA: { type: String, default: '' },
    companyB: { type: String, default: '' },
    overlapStartDate: { type: Date },
    overlapEndDate: { type: Date },
    overlapMonths: { type: Number, default: 0 },
    possibleReasons: {
      type: [String],
      default: ['Part-time work', 'Freelance work', 'Internship', 'Contract work', 'Multiple jobs'],
    },
  },
  { _id: false }
);

const timelineCheckSchema = new mongoose.Schema(
  {
    hasOverlap: { type: Boolean, default: false },
    overlaps: { type: [timelineOverlapSchema], default: [] },
    overlappingJobsCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: VERIFICATION_STATUSES,
      default: 'Passed',
    },
    note: { type: String, default: '' },
  },
  { _id: false }
);

const githubCheckSchema = new mongoose.Schema(
  {
    profileUrl: { type: String, default: '' },
    username: { type: String, default: '' },
    exists: { type: Boolean, default: false },
    profileName: { type: String, default: '' },
    publicRepos: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    accountCreatedAt: { type: Date },
    topLanguages: { type: [String], default: [] },
    recentActivity: { type: Boolean, default: false },
    supportingEvidence: { type: [String], default: [] },
    claimsRequiringReview: { type: [String], default: [] },
    status: {
      type: String,
      enum: VERIFICATION_STATUSES,
      default: 'Unable to Verify',
    },
    checkedAt: { type: Date },
  },
  { _id: false }
);

const consistencyIssueSchema = new mongoose.Schema(
  {
    field: { type: String, default: '' },
    issue: { type: String, default: '' },
    evidence: { type: String, default: '' },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
  },
  { _id: false }
);

const recruiterActionSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: [
        'reviewed',
        'verification_requested',
        'marked_reviewed',
        'flag_ignored',
        'candidate_rejected',
      ],
      required: true,
    },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, default: '' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

// --- Main schema -------------------------------------------------------

const fraudCheckSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // This project does not have a standalone Resume model — resume data
    // lives on CandidateProfile — so resumeId references that document.
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CandidateProfile',
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
    },

    certificateChecks: { type: [certificateCheckSchema], default: [] },
    experienceChecks: { type: [experienceCheckSchema], default: [] },
    timelineChecks: { type: timelineCheckSchema, default: () => ({}) },
    githubCheck: { type: githubCheckSchema, default: () => ({}) },
    consistencyChecks: { type: [consistencyIssueSchema], default: [] },

    fraudRiskScore: { type: Number, min: 0, max: 100, default: 0 },
    riskLevel: { type: String, enum: RISK_LEVELS, default: 'Low Risk' },
    verificationStatus: {
      type: String,
      enum: VERIFICATION_STATUSES,
      default: 'Needs Review',
    },

    // Explainable scoring breakdown so the AI score is never a "black box"
    scoreBreakdown: {
      certificateVerification: { type: Number, default: 0 },
      experienceConsistency: { type: Number, default: 0 },
      timelineConsistency: { type: Number, default: 0 },
      githubEvidence: { type: Number, default: 0 },
      resumeProfileConsistency: { type: Number, default: 0 },
    },

    flags: { type: [String], default: [] },
    evidence: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },

    recruiterReview: {
      status: {
        type: String,
        enum: ['pending', 'in_review', 'verification_requested', 'reviewed', 'flag_ignored', 'rejected'],
        default: 'pending',
      },
      actions: { type: [recruiterActionSchema], default: [] },
    },

    checkedAt: { type: Date, default: Date.now },
  },
  { timestamps: true } // adds createdAt / updatedAt
);

// --- Spec-terminology aliases (virtuals, read-only, non-duplicating) ---
// The originally-shipped fraud module used fraudRiskScore/verificationStatus/
// recruiterReview.actions; a later spec asked for riskScore/status/
// reviewedBy/reviewerNotes. Rather than renaming the underlying fields
// (which would break the existing frontend and any saved data), these
// virtuals expose the same data under both vocabularies.
fraudCheckSchema.virtual('riskScore').get(function () {
  return this.fraudRiskScore;
});

fraudCheckSchema.virtual('status').get(function () {
  return this.verificationStatus;
});

fraudCheckSchema.virtual('reviewedBy').get(function () {
  const actions = this.recruiterReview?.actions || [];
  return actions.length ? actions[actions.length - 1].performedBy : undefined;
});

fraudCheckSchema.virtual('reviewerNotes').get(function () {
  const actions = this.recruiterReview?.actions || [];
  return actions.length ? actions[actions.length - 1].note : undefined;
});

fraudCheckSchema.set('toJSON', { virtuals: true });
fraudCheckSchema.set('toObject', { virtuals: true });

fraudCheckSchema.index({ candidateId: 1 }, { unique: true });

module.exports = mongoose.model('FraudCheck', fraudCheckSchema);
module.exports.RISK_LEVELS = RISK_LEVELS;
module.exports.VERIFICATION_STATUSES = VERIFICATION_STATUSES;
