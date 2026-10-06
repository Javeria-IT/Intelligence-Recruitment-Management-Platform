// routes/resumeVerificationRoutes.js
// Mounted at /api/resume. Named distinctly from any future general
// "resume" resource routes to avoid collisions with existing resume
// upload/parsing functionality (which lives on candidateController).
const express = require('express');
const { runConsistencyCheck } = require('../controllers/resumeVerificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.post('/consistency-check', runConsistencyCheck);

module.exports = router;
