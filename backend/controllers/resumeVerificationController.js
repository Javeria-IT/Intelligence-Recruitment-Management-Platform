// controllers/resumeVerificationController.js
// HTTP layer for POST /api/resume/consistency-check — an ad-hoc,
// read-mostly check that compares parsed resume data against the
// candidate's profile, certificates, and GitHub evidence. Reuses
// ai/consistencyChecker.js (the same logic the full fraud pipeline
// runs) rather than re-implementing it.

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { success } = require('../utils/apiResponse');
const CandidateProfile = require('../models/CandidateProfile');
const User = require('../models/User');
const FraudCheck = require('../models/FraudCheck');
const certificateService = require('../services/certificateService');
const { checkConsistency } = require('../ai/consistencyChecker');

// @desc    Run a resume-vs-profile consistency check
// @route   POST /api/resume/consistency-check
// @access  Private (candidate checks own; recruiter/admin may pass candidateId)
const runConsistencyCheck = catchAsync(async (req, res, next) => {
  const candidateId = req.user.role === 'candidate' ? req.user._id.toString() : req.body.candidateId;

  if (!candidateId) {
    return next(new AppError('candidateId is required', 400));
  }
  if (req.user.role === 'candidate' && candidateId !== req.user._id.toString()) {
    return next(new AppError('You can only check your own resume consistency', 403));
  }

  const user = await User.findById(candidateId);
  const profile = await CandidateProfile.findOne({ userId: candidateId });
  if (!user || !profile) {
    return next(new AppError('Candidate profile not found', 404));
  }

  const certificateDocs = await certificateService.listCertificatesForCandidate(candidateId);

  const consistencyChecks = checkConsistency({
    user,
    profile: profile.toObject(),
    githubCheck: profile.githubVerification || {},
    certificateResults: certificateDocs.map((c) => ({ extracted: c.extracted, status: c.verificationStatus })),
  });

  // Keep the aggregate FraudCheck (if one exists) in sync with this
  // ad-hoc result, so the recruiter dashboard doesn't show stale data.
  await FraudCheck.updateOne(
    { candidateId },
    { $set: { consistencyChecks, checkedAt: new Date() } }
  );

  return success(res, 200, 'Resume consistency check complete', {
    consistent: consistencyChecks.length === 0,
    issues: consistencyChecks,
  });
});

module.exports = { runConsistencyCheck };
