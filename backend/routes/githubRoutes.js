// routes/githubRoutes.js
const express = require('express');
const { body } = require('express-validator');
const { verifyGithub, getGithubVerification } = require('../controllers/githubController');
const { protect } = require('../middleware/authMiddleware');
const requireVerified = require('../middleware/requireVerified');
const validate = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(protect);

router.post(
  '/verify',
  requireVerified,
  [body('githubUrl').isURL().withMessage('githubUrl must be a valid URL')],
  validate,
  verifyGithub
);

router.get('/:candidateId', getGithubVerification);

module.exports = router;
