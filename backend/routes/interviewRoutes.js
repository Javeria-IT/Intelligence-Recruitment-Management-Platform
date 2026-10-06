// routes/interviewRoutes.js
const express = require('express');
const { body } = require('express-validator');
const {
  scheduleInterview,
  getInterview,
  submitAnswers,
  submitFeedback,
} = require('../controllers/interviewController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const validate = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(protect);


router.post(
  '/schedule',
  authorize('recruiter', 'admin'),
  [
    body('applicationId').notEmpty().withMessage('applicationId is required'),
    body('date').notEmpty().withMessage('Interview date is required'),
  ],
  validate,
  scheduleInterview
);

router.get('/:id', getInterview);

router.put('/:id/answers', authorize('candidate'), submitAnswers);

router.put('/:id/feedback', authorize('recruiter', 'admin'), submitFeedback);

module.exports = router;
