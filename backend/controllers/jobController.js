// controllers/jobController.js
// Job CRUD operations. Creation/update/delete are restricted to
// recruiters (enforced by roleMiddleware in the routes file), while
// listing jobs is open to any authenticated user.

const Job = require('../models/Job');
const Application = require('../models/Application');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { success } = require('../utils/apiResponse');
const { rankApplicationsForJob } = require('../services/rankingService');

// @desc    Create a new job posting
// @route   POST /api/jobs
// @access  Private (recruiter)
const createJob = catchAsync(async (req, res, next) => {
  const {
    title,
    company,
    location,
    description,
    requiredSkills,
    experience,
    salary,
    deadline,
  } = req.body;

  const job = await Job.create({
    recruiterId: req.user._id,
    title,
    company,
    location,
    description,
    requiredSkills,
    experience,
    salary,
    deadline,
  });

  return success(res, 201, 'Job created successfully', { job });
});

// @desc    Get all jobs (recruiters see their own; supports basic search)
// @route   GET /api/jobs
// @access  Private
const getJobs = catchAsync(async (req, res, next) => {
  const { mine, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (mine === 'true' && req.user.role === 'recruiter') {
    filter.recruiterId = req.user._id;
  } else {
    filter.isActive = true;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [jobs, total] = await Promise.all([
    Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Job.countDocuments(filter),
  ]);

  return success(res, 200, 'Jobs fetched successfully', {
    jobs,
    pagination: { total, page: Number(page), limit: Number(limit) },
  });
});

// @desc    Get a single job by id
// @route   GET /api/jobs/:id
// @access  Private
const getJobById = catchAsync(async (req, res, next) => {
  const job = await Job.findById(req.params.id);
  if (!job) return next(new AppError('Job not found', 404));

  return success(res, 200, 'Job fetched successfully', { job });
});

// @desc    Update a job posting
// @route   PUT /api/jobs/:id
// @access  Private (recruiter - owner only)
const updateJob = catchAsync(async (req, res, next) => {
  const job = await Job.findById(req.params.id);
  if (!job) return next(new AppError('Job not found', 404));

  if (job.recruiterId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this job', 403));
  }

  const allowedFields = [
    'title',
    'company',
    'location',
    'description',
    'requiredSkills',
    'experience',
    'salary',
    'deadline',
    'isActive',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) job[field] = req.body[field];
  });

  await job.save();

  return success(res, 200, 'Job updated successfully', { job });
});

// @desc    Delete a job posting
// @route   DELETE /api/jobs/:id
// @access  Private (recruiter - owner only)
const deleteJob = catchAsync(async (req, res, next) => {
  const job = await Job.findById(req.params.id);
  if (!job) return next(new AppError('Job not found', 404));

  if (job.recruiterId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to delete this job', 403));
  }

  await job.deleteOne();
  await Application.deleteMany({ jobId: job._id });

  return success(res, 200, 'Job deleted successfully', null);
});

// @desc    View all applicants for a job, ranked by AI score (descending)
// @route   GET /api/jobs/:id/applicants
// @access  Private (recruiter - owner only)
const getJobApplicants = catchAsync(async (req, res, next) => {
  const job = await Job.findById(req.params.id);
  if (!job) return next(new AppError('Job not found', 404));

  if (job.recruiterId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to view these applicants', 403));
  }

  // Re-computes AI scores and returns applicants sorted best-first
  const applications = await rankApplicationsForJob(job._id);

  return success(res, 200, 'Applicants fetched and ranked successfully', {
    job: { id: job._id, title: job.title },
    applicants: applications,
  });
});

module.exports = {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  getJobApplicants,
};
