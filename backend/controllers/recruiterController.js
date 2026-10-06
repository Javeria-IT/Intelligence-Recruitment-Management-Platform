// controllers/recruiterController.js
// Recruiter-specific actions: shortlisting candidates, sending
// notifications, and the recruiter analytics dashboard.

const Application = require('../models/Application');
const Job = require('../models/Job');
const Interview = require('../models/Interview');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { success } = require('../utils/apiResponse');
const {
  notifyShortlisted,
  notifyRejected,
  notifySelected,
  createNotification,
} = require('../services/notificationService');

// @desc    Shortlist (or un-shortlist) a candidate's application
// @route   POST /api/recruiter/shortlist/:applicationId
// @access  Private (recruiter)
const shortlistCandidate = catchAsync(async (req, res, next) => {
  const { applicationId } = req.params;
  const { shortlisted = true } = req.body;

  const application = await Application.findById(applicationId).populate('jobId');
  if (!application) return next(new AppError('Application not found', 404));

  const job = application.jobId;
  if (job.recruiterId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to modify this application', 403));
  }

  application.shortlisted = shortlisted;
  application.applicationStatus = shortlisted ? 'shortlisted' : 'under_review';
  await application.save();

  if (shortlisted) {
    await notifyShortlisted(application.candidateId, job.title);
  }

  return success(res, 200, 'Application updated successfully', { application });
});

// @desc    Update an application's final status (rejected/selected/under_review)
// @route   PUT /api/recruiter/applications/:applicationId/status
// @access  Private (recruiter)
const updateApplicationStatus = catchAsync(async (req, res, next) => {
  const { applicationId } = req.params;
  const { status } = req.body;

  const validStatuses = ['applied', 'under_review', 'shortlisted', 'interview', 'rejected', 'selected'];
  if (!validStatuses.includes(status)) {
    return next(new AppError('Invalid application status', 400));
  }

  const application = await Application.findById(applicationId).populate('jobId');
  if (!application) return next(new AppError('Application not found', 404));

  const job = application.jobId;
  if (job.recruiterId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to modify this application', 403));
  }

  application.applicationStatus = status;
  await application.save();

  if (status === 'rejected') await notifyRejected(application.candidateId, job.title);
  if (status === 'selected') await notifySelected(application.candidateId, job.title);

  return success(res, 200, 'Application status updated', { application });
});

// @desc    Send a custom notification to a candidate
// @route   POST /api/recruiter/notify/:candidateId
// @access  Private (recruiter)
const sendNotificationToCandidate = catchAsync(async (req, res, next) => {
  const { candidateId } = req.params;
  const { title, message } = req.body;

  const notification = await createNotification({
    userId: candidateId,
    title,
    message,
    type: 'general',
  });

  return success(res, 201, 'Notification sent successfully', { notification });
});

// @desc    Recruiter dashboard analytics
// @route   GET /api/recruiter/dashboard
// @access  Private (recruiter)
const getRecruiterDashboard = catchAsync(async (req, res, next) => {
  const recruiterId = req.user._id;

  const jobs = await Job.find({ recruiterId }).select('_id');
  const jobIds = jobs.map((j) => j._id);

  const [
    totalJobs,
    totalCandidates,
    shortlistedCount,
    interviewsCount,
    hiredCount,
  ] = await Promise.all([
    Job.countDocuments({ recruiterId }),
    Application.countDocuments({ jobId: { $in: jobIds } }),
    Application.countDocuments({ jobId: { $in: jobIds }, shortlisted: true }),
    Interview.countDocuments({
      applicationId: {
        $in: await Application.find({ jobId: { $in: jobIds } }).distinct('_id'),
      },
    }),
    Application.countDocuments({ jobId: { $in: jobIds }, applicationStatus: 'selected' }),
  ]);

  return success(res, 200, 'Recruiter dashboard data fetched', {
    totalJobs,
    totalCandidates,
    shortlisted: shortlistedCount,
    interviews: interviewsCount,
    hired: hiredCount,
  });
});

// @desc    List all interviews scheduled across the logged-in recruiter's jobs
// @route   GET /api/recruiter/interviews
// @access  Private (recruiter)
const getMyScheduledInterviews = catchAsync(async (req, res, next) => {
  const jobIds = await Job.find({ recruiterId: req.user._id }).distinct('_id');
  const applicationIds = await Application.find({ jobId: { $in: jobIds } }).distinct('_id');

  const interviews = await Interview.find({ applicationId: { $in: applicationIds } })
    .populate({
      path: 'applicationId',
      select: 'candidateId jobId applicationStatus',
      populate: [
        { path: 'candidateId', select: 'fullName email profileImage' },
        { path: 'jobId', select: 'title company' },
      ],
    })
    .sort({ date: -1 });

  return success(res, 200, 'Interviews fetched successfully', { interviews });
});

module.exports = {
  shortlistCandidate,
  updateApplicationStatus,
  sendNotificationToCandidate,
  getRecruiterDashboard,
  getMyScheduledInterviews,
};
