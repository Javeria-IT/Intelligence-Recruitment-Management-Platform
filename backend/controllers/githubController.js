// controllers/githubController.js
// HTTP layer for the standalone /api/github endpoints. Thin wrappers
// around the same GitHub verification logic used by the fraud module
// (ai/githubVerifier.js + services/fraudDetectionService.js) — no logic
// is duplicated here.

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { success } = require('../utils/apiResponse');
const CandidateProfile = require('../models/CandidateProfile');
const fraudService = require('../services/fraudDetectionService');

// @desc    Connect/verify a candidate's public GitHub profile
// @route   POST /api/github/verify
// @access  Private (candidate — verifies own profile)
const verifyGithub = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'candidate') {
    return next(new AppError('Only candidates can connect a GitHub profile', 403));
  }

  const { githubUrl } = req.body;
  if (!githubUrl) {
    return next(new AppError('githubUrl is required', 400));
  }

  const { githubCheck } = await fraudService.verifyAndStoreGithub(req.user._id, githubUrl);

  return success(res, 200, 'GitHub profile verified', { githubCheck });
});

// @desc    Get the latest GitHub verification snapshot for a candidate
// @route   GET /api/github/:candidateId
// @access  Private (self, recruiter, or admin)
const getGithubVerification = catchAsync(async (req, res, next) => {
  const { candidateId } = req.params;
  const isSelf = req.user._id.toString() === candidateId;

  if (!isSelf && req.user.role === 'candidate') {
    return next(new AppError("You are not authorized to view another candidate's GitHub verification", 403));
  }

  const profile = await CandidateProfile.findOne({ userId: candidateId });
  if (!profile) return next(new AppError('Candidate not found', 404));

  if (!profile.githubUrl) {
    return success(res, 200, 'No GitHub profile on file for this candidate', {
      githubUrl: '',
      githubCheck: null,
    });
  }

  return success(res, 200, 'GitHub verification fetched', {
    githubUrl: profile.githubUrl,
    githubCheck: profile.githubVerification || null,
  });
});

module.exports = { verifyGithub, getGithubVerification };
