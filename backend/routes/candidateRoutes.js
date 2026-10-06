// routes/candidateRoutes.js
const express = require('express');
const { body } = require('express-validator');
const {
  getMyProfile,
  updateMyProfile,
  uploadResume,
  removeResume,
  browseJobs,
  applyToJob,
  getMyApplications,
  getMyInterviews,
} = require('../controllers/candidateController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');
const validate = require('../middleware/validateMiddleware');

const router = express.Router();

// All candidate routes require authentication + the 'candidate' role
router.use(protect, authorize('candidate'));


router.get('/profile', getMyProfile);

router.put('/profile', updateMyProfile);

router.post('/uploadResume', upload.single('resume'), uploadResume);

router.delete("/resume", removeResume);

router.get('/jobs', browseJobs);

router.post('/apply/:jobId', applyToJob);

router.get('/applications', getMyApplications);

router.get('/interviews', getMyInterviews);

module.exports = router;
