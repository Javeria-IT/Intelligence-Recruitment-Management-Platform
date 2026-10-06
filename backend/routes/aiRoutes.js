// routes/aiRoutes.js
const express = require('express');
const { parseResume, rankCandidates } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(protect);


router.post('/parseResume', upload.single('resume'), parseResume);

router.post('/rankCandidates', authorize('recruiter', 'admin'), rankCandidates);

module.exports = router;
