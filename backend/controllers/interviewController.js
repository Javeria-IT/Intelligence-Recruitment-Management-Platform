// controllers/interviewController.js
// Interview scheduling, AI-generated questions, and feedback/scoring.

const Interview = require('../models/Interview');
const Application = require('../models/Application');
const Job = require('../models/Job');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { success } = require('../utils/apiResponse');
const { generateQuestionsFromSkills } = require('../ai/questionGenerator');
const { notifyInterviewScheduled } = require('../services/notificationService');

// @desc    Schedule an interview for an application (auto-generates AI questions)
// @route   POST /api/interview/schedule
// @access  Private (recruiter)
const scheduleInterview = catchAsync(async (req, res, next) => {
  const { applicationId, date, meetingLink, interviewer } = req.body;

  const application = await Application.findById(applicationId).populate('jobId');
  if (!application) return next(new AppError('Application not found', 404));

  const job = application.jobId;
  if (job.recruiterId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to schedule this interview', 403));
  }

  const AIQuestions = generateQuestionsFromSkills(job.requiredSkills, 1);

  const interview = await Interview.create({
    applicationId,
    date,
    meetingLink,
    interviewer,
    AIQuestions,
  });

  application.interviewStatus = 'scheduled';
  application.applicationStatus = 'interview';
  await application.save();

  await notifyInterviewScheduled(application.candidateId, job.title, date);

  return success(res, 201, 'Interview scheduled successfully', { interview });
});

// @desc    Get interview details
// @route   GET /api/interview/:id
// @access  Private
const getInterview = catchAsync(async (req, res, next) => {
  const interview = await Interview.findById(req.params.id).populate({
    path: 'applicationId',
    populate: [{ path: 'candidateId', select: 'fullName email' }, { path: 'jobId', select: 'title company' }],
  });

  if (!interview) return next(new AppError('Interview not found', 404));

  return success(res, 200, 'Interview fetched successfully', { interview });
});

// @desc    Submit candidate answers to AI-generated questions
// @route   PUT /api/interview/:id/answers
// @access  Private (candidate)
const submitAnswers = catchAsync(async (req, res, next) => {
  const { answers } = req.body; // [{ skillTag, candidateAnswer }]

  const interview = await Interview.findById(req.params.id);
  if (!interview) return next(new AppError('Interview not found', 404));

  answers.forEach(({ index, candidateAnswer }) => {
    if (interview.AIQuestions[index]) {
      interview.AIQuestions[index].candidateAnswer = candidateAnswer;
    }
  });

  await interview.save();

  return success(res, 200, 'Answers submitted successfully', { interview });
});

// @desc    Recruiter scores an interview and leaves feedback
// @route   PUT /api/interview/:id/feedback
// @access  Private (recruiter)
const submitFeedback = catchAsync(async (req, res, next) => {
  const { score, feedback, questionScores } = req.body; // questionScores: [{ index, answerScore }]

  const interview = await Interview.findById(req.params.id);
  if (!interview) return next(new AppError('Interview not found', 404));

  if (questionScores) {
    questionScores.forEach(({ index, answerScore }) => {
      if (interview.AIQuestions[index]) {
        interview.AIQuestions[index].answerScore = answerScore;
      }
    });
  }

  interview.score = score;
  interview.feedback = feedback;
  interview.status = 'completed';
  await interview.save();

  await Application.findByIdAndUpdate(interview.applicationId, {
    interviewStatus: 'completed',
  });

  return success(res, 200, 'Interview feedback submitted successfully', { interview });
});

module.exports = { scheduleInterview, getInterview, submitAnswers, submitFeedback };
