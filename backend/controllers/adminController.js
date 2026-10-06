// controllers/adminController.js
// Admin-only features: user management, job oversight, and platform-wide
// reporting/analytics.

const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const CandidateProfile = require('../models/CandidateProfile');
const Interview = require('../models/Interview');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { success } = require('../utils/apiResponse');

// @desc    Get all users (supports filtering by role)
// @route   GET /api/admin/users
// @access  Private (admin)
const getAllUsers = catchAsync(async (req, res, next) => {
  const { role, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (role) filter.role = role;

  const skip = (Number(page) - 1) * Number(limit);

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  return success(res, 200, 'Users fetched successfully', {
    users,
    pagination: { total, page: Number(page), limit: Number(limit) },
  });
});

// @desc    Delete/deactivate a user
// @route   DELETE /api/admin/user/:id
// @access  Private (admin)
const deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found', 404));

  if (user.role === 'admin') {
    return next(new AppError('Admin accounts cannot be deleted via this endpoint', 403));
  }

  await user.deleteOne();
  await CandidateProfile.deleteMany({ userId: user._id });

  return success(res, 200, 'User deleted successfully', null);
});

// @desc    Get all jobs across the platform (admin oversight)
// @route   GET /api/admin/jobs
// @access  Private (admin)
const getAllJobsAdmin = catchAsync(async (req, res, next) => {
  const jobs = await Job.find().populate('recruiterId', 'fullName email').sort({ createdAt: -1 });
  return success(res, 200, 'All jobs fetched successfully', { jobs });
});

// @desc    Deactivate/remove a job (admin moderation)
// @route   DELETE /api/admin/jobs/:id
// @access  Private (admin)
const removeJobAdmin = catchAsync(async (req, res, next) => {
  const job = await Job.findById(req.params.id);
  if (!job) return next(new AppError('Job not found', 404));

  await job.deleteOne();
  await Application.deleteMany({ jobId: job._id });

  return success(res, 200, 'Job removed successfully', null);
});

// @desc    Platform-wide reports and analytics for the admin dashboard
// @route   GET /api/admin/reports
// @access  Private (admin)
const getReports = catchAsync(async (req, res, next) => {
  const [
    totalUsers,
    totalRecruiters,
    totalCandidates,
    totalJobs,
    activeJobs,
    totalApplications,
    shortlistedApplications,
    selectedApplications,
    rejectedApplications,
    totalInterviews,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'recruiter' }),
    User.countDocuments({ role: 'candidate' }),
    Job.countDocuments(),
    Job.countDocuments({ isActive: true }),
    Application.countDocuments(),
    Application.countDocuments({ shortlisted: true }),
    Application.countDocuments({ applicationStatus: 'selected' }),
    Application.countDocuments({ applicationStatus: 'rejected' }),
    Interview.countDocuments(),
  ]);

  // Average AI score across all applications (useful analytics signal)
  const avgScoreAgg = await Application.aggregate([
    { $group: { _id: null, avgScore: { $avg: '$AI_score' } } },
  ]);
  const averageAIScore = avgScoreAgg.length ? Math.round(avgScoreAgg[0].avgScore) : 0;

  return success(res, 200, 'Admin reports fetched successfully', {
    users: { total: totalUsers, recruiters: totalRecruiters, candidates: totalCandidates },
    jobs: { total: totalJobs, active: activeJobs },
    applications: {
      total: totalApplications,
      shortlisted: shortlistedApplications,
      selected: selectedApplications,
      rejected: rejectedApplications,
      averageAIScore,
    },
    interviews: { total: totalInterviews },
  });
});

module.exports = { getAllUsers, deleteUser, getAllJobsAdmin, removeJobAdmin, getReports };
