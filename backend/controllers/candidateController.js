// controllers/candidateController.js
// Candidate-facing features: profile management, resume upload, job
// browsing, applying to jobs, and tracking application status.

const fs = require("fs");
const path = require('path');
const CandidateProfile = require('../models/CandidateProfile');
const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');
const Interview = require('../models/Interview');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { success } = require('../utils/apiResponse');
const { parseResumeFile } = require('../ai/resumeParser');
const { scoreApplication } = require('../services/rankingService');
const { notifyNewApplication } = require('../services/notificationService');

// @desc    Get logged-in candidate's profile
// @route   GET /api/candidate/profile
// @access  Private (candidate)



const getMyProfile = catchAsync(async (req, res, next) => {
  const profile = await CandidateProfile.findOne({ userId: req.user._id }).populate(
    'userId',
    'fullName email phone profileImage'
  );

  if (!profile) return next(new AppError('Candidate profile not found', 404));

  return success(res, 200, 'Candidate profile fetched', { profile });
});

// @desc    Update logged-in candidate's profile
// @route   PUT /api/candidate/profile
// @access  Private (candidate)
const updateMyProfile = catchAsync(async (req, res, next) => {
  const { skills, education, experience, fullName, phone } = req.body;

  // Update basic user info if provided
  if (fullName || phone) {
    await User.findByIdAndUpdate(req.user._id, {
      ...(fullName && { fullName }),
      ...(phone && { phone }),
    });
  }

  let profile = await CandidateProfile.findOne({ userId: req.user._id });
  if (!profile) {
    profile = await CandidateProfile.create({ userId: req.user._id });
  }

  if (skills) profile.skills = skills;
  if (education) profile.education = education;
  if (experience) profile.experience = experience;

  await profile.save();

  return success(res, 200, 'Profile updated successfully', { profile });
});

// @desc    Upload/replace candidate resume (PDF/DOCX), parse it with AI
// @route   POST /api/candidate/uploadResume
// @access  Private (candidate)
const uploadResume = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload a resume file (PDF or DOCX)', 400));
  }

  const resumeURL = `/uploads/resumes/${req.file.filename}`;
  const absolutePath = path.join(__dirname, '..', 'uploads/resumes', req.file.filename);

  let profile = await CandidateProfile.findOne({ userId: req.user._id });
  if (!profile) {
    profile = await CandidateProfile.create({ userId: req.user._id });
  }

  profile.resumeURL = resumeURL;

  // Run AI parsing service on the uploaded resume
  try {
    const parsed = await parseResumeFile(absolutePath);
    profile.parsedResume = {
      rawText: parsed.rawText,
      extractedSkills: parsed.extractedSkills,
      extractedEducation: parsed.extractedEducation,
      extractedExperience: parsed.extractedExperience,
      certifications: parsed.certifications,
      email: parsed.email,
      phone: parsed.phone,
    };
    // Merge AI-detected skills into the candidate's skill list (deduped)
    profile.skills = [...new Set([...profile.skills, ...parsed.extractedSkills])];
  } catch (parseErr) {
    // Resume upload should still succeed even if parsing fails
    console.error('Resume parsing failed:', parseErr.message);
  }

  await profile.save();

  return success(res, 200, 'Resume uploaded and parsed successfully', { profile });
});

// @desc    Remove logged-in candidate's resume
// @route   DELETE /api/candidate/resume
// @access  Private (candidate)
const removeResume = catchAsync(async (req, res, next) => {
  const profile = await CandidateProfile.findOne({
    userId: req.user._id,
  });

  if (!profile) {
    return next(new AppError("Candidate profile not found", 404));
  }

  // Delete physical resume file from uploads/resumes
  if (profile.resumeURL) {
    const relativePath = profile.resumeURL.replace(/^\/+/, "");
    const filePath = path.join(__dirname, "..", relativePath);

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error("Failed to delete resume file:", error.message);
    }
  }

  // Remove resume information from database
  profile.resumeURL = "";

  // Also clear parsed resume information
  profile.parsedResume = undefined;

  await profile.save();

  return success(res, 200, "Resume removed successfully", {
    profile,
  });
});

// @desc    Browse all active job postings (with basic filtering)
// @route   GET /api/candidate/jobs
// @access  Private (candidate)
const browseJobs = catchAsync(async (req, res, next) => {
  const { search, location, skill, page = 1, limit = 10 } = req.query;

  const filter = { isActive: true };
  if (location) filter.location = { $regex: location, $options: 'i' };
  if (skill) filter.requiredSkills = { $regex: skill, $options: 'i' };
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
    ];
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

// @desc    Apply to a job
// @route   POST /api/candidate/apply/:jobId
// @access  Private (candidate)
const applyToJob = catchAsync(async (req, res, next) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId);
  if (!job || !job.isActive) {
    return next(new AppError('Job not found or no longer active', 404));
  }

  const existing = await Application.findOne({ candidateId: req.user._id, jobId });
  if (existing) {
    return next(new AppError('You have already applied to this job', 409));
  }

  const profile = await CandidateProfile.findOne({ userId: req.user._id });
  if (!profile || !profile.resumeURL) {
    return next(
      new AppError('Please upload your resume before applying to jobs', 400)
    );
  }

  const application = await Application.create({
    candidateId: req.user._id,
    jobId,
    resume: profile.resumeURL,
  });

  // Compute AI match score immediately upon application
  await scoreApplication(application._id);

  // Notify the recruiter who owns the job
  await notifyNewApplication(job.recruiterId, req.user.fullName, job.title);

  const populatedApplication = await Application.findById(application._id).populate(
    'jobId',
    'title company'
  );

  return success(res, 201, 'Application submitted successfully', {
    application: populatedApplication,
  });
});

// @desc    View all applications submitted by the logged-in candidate
// @route   GET /api/candidate/applications
// @access  Private (candidate)
const getMyApplications = catchAsync(async (req, res, next) => {
  const applications = await Application.find({ candidateId: req.user._id })
    .populate('jobId', 'title company location salary deadline')
    .sort({ createdAt: -1 });

  return success(res, 200, 'Applications fetched successfully', { applications });
});

// @desc    List all interviews scheduled for the logged-in candidate's applications
// @route   GET /api/candidate/interviews
// @access  Private (candidate)
const getMyInterviews = catchAsync(async (req, res, next) => {
  const applicationIds = await Application.find({ candidateId: req.user._id }).distinct('_id');

  const interviews = await Interview.find({ applicationId: { $in: applicationIds } })
    .populate({
      path: 'applicationId',
      select: 'jobId applicationStatus',
      populate: { path: 'jobId', select: 'title company location' },
    })
    .sort({ date: -1 });

  return success(res, 200, 'Interviews fetched successfully', { interviews });
});


module.exports = {
  getMyProfile,
  updateMyProfile,
  uploadResume,
  removeResume,
  browseJobs,
  applyToJob,
  getMyApplications,
  getMyInterviews,
};