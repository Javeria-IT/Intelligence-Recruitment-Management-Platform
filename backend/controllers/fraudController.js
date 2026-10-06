// controllers/fraudController.js
// HTTP layer for the AI Candidate Fraud Detection & Verification module.
// Delegates all business logic to services/fraudDetectionService.js and
// returns the project's standard { success, message, data } envelope.

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { success } = require('../utils/apiResponse');
const Application = require('../models/Application');
const Job = require('../models/Job');
const fraudService = require('../services/fraudDetectionService');

// Ensures a recruiter/admin can only act on candidates who applied to
// one of their own job postings (defense-in-depth beyond role checks).
async function assertRecruiterCanAccessCandidate(req, candidateId) {
  if (req.user.role === 'admin') return;
  const ownsApplication = await Application.exists({
    candidateId,
    jobId: { $in: await Job.find({ recruiterId: req.user._id }).distinct('_id') },
  });
  if (!ownsApplication) {
    throw new AppError('You are not authorized to view this candidate\'s verification data', 403);
  }
}

// @desc    Run (or re-run) the full fraud analysis for a candidate
// @route   POST /api/fraud/check/:candidateId
// @access  Private (recruiter, admin)
const runCheck = catchAsync(async (req, res, next) => {
  const { candidateId } = req.params;
  await assertRecruiterCanAccessCandidate(req, candidateId);

  const fraudCheck = await fraudService.runFullFraudCheck(candidateId, {
    applicationId: req.body.applicationId,
  });

  return success(res, 200, 'Fraud analysis completed', { fraudCheck });
});

// @desc    Get the latest fraud check summary for a candidate
// @route   GET /api/fraud/candidate/:candidateId
// @access  Private (recruiter, admin, or the candidate themself)
const getByCandidate = catchAsync(async (req, res, next) => {
  const { candidateId } = req.params;

  const isSelf = req.user._id.toString() === candidateId;
  if (!isSelf) await assertRecruiterCanAccessCandidate(req, candidateId);

  const fraudCheck = await fraudService.getFraudCheckForCandidate(candidateId);
  return success(res, 200, 'Fraud check fetched', { fraudCheck });
});

// @desc    Get (or lazily generate) the fraud check tied to an application
// @route   GET /api/fraud/application/:applicationId
// @access  Private (recruiter, admin)
const getByApplication = catchAsync(async (req, res, next) => {
  const { applicationId } = req.params;

  const application = await Application.findById(applicationId).populate('jobId');
  if (!application) return next(new AppError('Application not found', 404));

  if (
    req.user.role !== 'admin' &&
    application.jobId.recruiterId.toString() !== req.user._id.toString()
  ) {
    return next(new AppError('You are not authorized to view this application\'s verification data', 403));
  }

  const fraudCheck = await fraudService.getFraudCheckForApplication(applicationId);
  return success(res, 200, 'Fraud check fetched', { fraudCheck });
});

// @desc    Upload + OCR-verify a certificate for a candidate
// @route   POST /api/fraud/certificate/:candidateId
// @access  Private (candidate — own profile only)
const uploadCertificate = catchAsync(async (req, res, next) => {
  const { candidateId } = req.params;

  if (req.user._id.toString() !== candidateId && req.user.role !== 'admin') {
    return next(new AppError('You can only upload certificates to your own profile', 403));
  }
  if (!req.file) {
    return next(new AppError('Please upload a certificate file (PDF, PNG, JPG, or WEBP)', 400));
  }

  const { profile, certificate } = await fraudService.verifyAndStoreCertificate(candidateId, req.file);

  return success(res, 201, 'Certificate uploaded and processed', { certificate, profile });
});

// @desc    Set/verify a candidate's GitHub profile
// @route   POST /api/fraud/github/:candidateId
// @access  Private (candidate — own profile only)
const verifyGithub = catchAsync(async (req, res, next) => {
  const { candidateId } = req.params;
  const { githubUrl } = req.body;

  if (req.user._id.toString() !== candidateId && req.user.role !== 'admin') {
    return next(new AppError('You can only update your own GitHub profile', 403));
  }

  const { githubCheck } = await fraudService.verifyAndStoreGithub(candidateId, githubUrl);

  return success(res, 200, 'GitHub profile verified', { githubCheck });
});

// @desc    Run the experience/timeline overlap analysis only
// @route   POST /api/fraud/experience/:candidateId
// @access  Private (recruiter, admin, or the candidate themself)
const analyzeExperience = catchAsync(async (req, res, next) => {
  const { candidateId } = req.params;

  const isSelf = req.user._id.toString() === candidateId;
  if (!isSelf) await assertRecruiterCanAccessCandidate(req, candidateId);

  const result = await fraudService.analyzeExperienceOnly(candidateId);
  return success(res, 200, 'Experience timeline analyzed', result);
});

// @desc    Get the full detailed verification report for a candidate
// @route   GET /api/fraud/report/:candidateId
// @access  Private (recruiter, admin)
const getReport = catchAsync(async (req, res, next) => {
  const { candidateId } = req.params;
  await assertRecruiterCanAccessCandidate(req, candidateId);

  const fraudCheck = await fraudService.getFraudCheckForCandidate(candidateId);
  return success(res, 200, 'Detailed verification report fetched', { report: fraudCheck });
});

// @desc    Record a recruiter action against a candidate's fraud check
// @route   PUT /api/fraud/review/:candidateId
// @access  Private (recruiter, admin)
const recordAction = catchAsync(async (req, res, next) => {
  const { candidateId } = req.params;
  const { action, note } = req.body;

  const validActions = [
    'reviewed',
    'verification_requested',
    'marked_reviewed',
    'flag_ignored',
    'candidate_rejected',
  ];
  if (!validActions.includes(action)) {
    return next(new AppError(`Invalid action. Must be one of: ${validActions.join(', ')}`, 400));
  }

  await assertRecruiterCanAccessCandidate(req, candidateId);

  const fraudCheck = await fraudService.recordRecruiterAction(candidateId, {
    action,
    performedBy: req.user._id,
    note,
  });

  // "candidate_rejected" here only records the recruiter's fraud-review
  // decision; it does NOT itself change Application.applicationStatus —
  // that remains a deliberate recruiter action via the existing
  // /api/recruiter/applications/:id/status endpoint, per the requirement
  // that candidates are never auto-rejected from an AI score alone.
  return success(res, 200, 'Recruiter action recorded', { fraudCheck });
});

module.exports = {
  runCheck,
  getByCandidate,
  getByApplication,
  uploadCertificate,
  verifyGithub,
  analyzeExperience,
  getReport,
  recordAction,
};
