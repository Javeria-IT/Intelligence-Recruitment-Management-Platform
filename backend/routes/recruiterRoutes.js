// routes/recruiterRoutes.js
const express = require('express');
const {
  shortlistCandidate,
  updateApplicationStatus,
  sendNotificationToCandidate,
  getRecruiterDashboard,
  getMyScheduledInterviews,
} = require('../controllers/recruiterController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect, authorize('recruiter', 'admin'));


router.post('/shortlist/:applicationId', shortlistCandidate);

router.put('/applications/:applicationId/status', updateApplicationStatus);

router.post('/notify/:candidateId', sendNotificationToCandidate);

router.get('/dashboard', getRecruiterDashboard);

router.get('/interviews', getMyScheduledInterviews);

module.exports = router;
