// controllers/aiController.js
// Exposes the AI resume-parsing and candidate-ranking services directly
// as standalone endpoints (in addition to being used internally by the
// candidate/job controllers).

const path = require('path');
const CandidateProfile = require('../models/CandidateProfile');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { success } = require('../utils/apiResponse');
const { parseResumeFile } = require('../ai/resumeParser');
const { rankApplicationsForJob } = require('../services/rankingService');

// @desc    Parse an uploaded resume file and return structured data
// @route   POST /api/ai/parseResume
// @access  Private (candidate/recruiter/admin)
const parseResume = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload a resume file (PDF or DOCX)', 400));
  }

  const absolutePath = path.join(__dirname, '..', 'uploads/resumes', req.file.filename);
  const parsed = await parseResumeFile(absolutePath);

  // Optionally persist to the requesting candidate's profile
  if (req.user.role === 'candidate') {
    const profile = await CandidateProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        resumeURL: `/uploads/resumes/${req.file.filename}`,
        parsedResume: parsed,
        $addToSet: { skills: { $each: parsed.extractedSkills } },
      },
      { new: true, upsert: true }
    );
    return success(res, 200, 'Resume parsed successfully', { parsed, profile });
  }

  return success(res, 200, 'Resume parsed successfully', { parsed });
});

// @desc    Rank all candidates who applied to a given job by AI score
// @route   POST /api/ai/rankCandidates
// @access  Private (recruiter/admin)
const rankCandidates = catchAsync(async (req, res, next) => {
  const { jobId } = req.body;
  if (!jobId) return next(new AppError('jobId is required', 400));

  const rankedApplications = await rankApplicationsForJob(jobId);

  return success(res, 200, 'Candidates ranked successfully', {
    jobId,
    rankedApplications,
  });
});

module.exports = { parseResume, rankCandidates };
