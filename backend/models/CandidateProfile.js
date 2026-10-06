// models/CandidateProfile.js
// Extended profile information for users with role = 'candidate'.

const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema(
  {
    degree: { type: String, trim: true },
    institution: { type: String, trim: true },
    fieldOfStudy: { type: String, trim: true },
    startYear: { type: Number },
    endYear: { type: Number },
  },
  { _id: false }
);

const experienceSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    company: { type: String, trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
    isCurrent: { type: Boolean, default: false },
    description: { type: String, trim: true },
  },
  { _id: false }
);

// A certificate uploaded by the candidate for verification now lives in
// its own top-level collection — see models/Certificate.js — so it can
// be referenced/queried independently (and matches the platform's
// `certificates` collection). This embedded schema has been removed;
// CandidateProfile no longer stores certificates directly.

const candidateProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    // --- Fraud Detection & Verification additions (additive only) ---
    githubUrl: {
      type: String,
      trim: true,
      default: '',
    },
    // Snapshot of the most recent GitHub verification result, so
    // GET /api/github/:candidateId can answer instantly without needing
    // a full fraud check to have been run first. Refreshed every time
    // verifyAndStoreGithub() runs (see services/fraudDetectionService.js).
    githubVerification: {
      profileUrl: { type: String, default: '' },
      username: { type: String, default: '' },
      exists: { type: Boolean, default: null },
      profileName: { type: String, default: '' },
      publicRepos: { type: Number, default: 0 },
      followers: { type: Number, default: 0 },
      accountCreatedAt: { type: Date },
      topLanguages: { type: [String], default: [] },
      recentActivity: { type: Boolean, default: false },
      supportingEvidence: { type: [String], default: [] },
      claimsRequiringReview: { type: [String], default: [] },
      status: { type: String, default: '' },
      checkedAt: { type: Date },
    },
    education: {
      type: [educationSchema],
      default: [],
    },
    experience: {
      type: [experienceSchema],
      default: [],
    },
    resumeURL: {
      type: String,
      default: '',
    },
    // Raw + structured data extracted by the AI resume parsing service
    parsedResume: {
      rawText: { type: String, default: '' },
      extractedSkills: { type: [String], default: [] },
      extractedEducation: { type: [String], default: [] },
      extractedExperience: { type: [String], default: [] },
      certifications: { type: [String], default: [] },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
    AI_score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CandidateProfile', candidateProfileSchema);
