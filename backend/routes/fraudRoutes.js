// routes/fraudRoutes.js
// Routes for the AI Candidate Fraud Detection & Verification module.
// Mounted at /api/fraud in server.js. Uses the existing JWT auth
// (protect) + role (authorize) middleware, exactly like every other
// route file in this project.

const express = require('express');
const { body } = require('express-validator');
const {
  runCheck,
  getByCandidate,
  getByApplication,
  uploadCertificate,
  verifyGithub,
  analyzeExperience,
  getReport,
  recordAction,
} = require('../controllers/fraudController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const requireVerified = require('../middleware/requireVerified');
const uploadCertificateFile = require('../middleware/certificateUploadMiddleware');
const validate = require('../middleware/validateMiddleware');

const router = express.Router();

// All fraud routes require a logged-in user.
router.use(protect);

// Recruiter/admin-only: trigger or fetch a full analysis.
router.post('/check/:candidateId', authorize('recruiter', 'admin'), runCheck);
router.get('/application/:applicationId', authorize('recruiter', 'admin'), getByApplication);
router.get('/report/:candidateId', authorize('recruiter', 'admin'), getReport);
router.put(
  '/review/:candidateId',
  authorize('recruiter', 'admin'),
  body('action').notEmpty().withMessage('action is required'),
  validate,
  recordAction
);

// Candidate (own data) or recruiter/admin: read the latest snapshot.
router.get('/candidate/:candidateId', getByCandidate);

// Candidate (own profile) or admin: submit data to be verified.
router.post('/certificate/:candidateId', requireVerified, uploadCertificateFile.single('certificate'), uploadCertificate);
router.post(
  '/github/:candidateId',
  requireVerified,
  body('githubUrl').optional().isURL().withMessage('githubUrl must be a valid URL'),
  validate,
  verifyGithub
);

// Candidate (own data) or recruiter/admin: experience/timeline analysis.
router.post('/experience/:candidateId', analyzeExperience);

module.exports = router;
