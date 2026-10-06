// routes/jobRoutes.js
const express = require('express');
const { body } = require('express-validator');
const {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  getJobApplicants,
} = require('../controllers/jobController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const validate = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(protect);


router.post(
  '/',
  authorize('recruiter'),
  [
    body('title').trim().notEmpty().withMessage('Job title is required'),
    body('company').trim().notEmpty().withMessage('Company is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
  ],
  validate,
  createJob
);
router.get('/', getJobs);

router.get('/:id', getJobById);
router.put('/:id', authorize('recruiter', 'admin'), updateJob);
router.delete('/:id', authorize('recruiter', 'admin'), deleteJob);

router.get('/:id/applicants', authorize('recruiter', 'admin'), getJobApplicants);

module.exports = router;
