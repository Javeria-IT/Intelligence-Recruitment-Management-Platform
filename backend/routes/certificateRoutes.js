// routes/certificateRoutes.js
const express = require('express');
const {
  createCertificate,
  getCertificates,
  verifyCertificateById,
} = require('../controllers/certificateController');
const { protect } = require('../middleware/authMiddleware');
const requireVerified = require('../middleware/requireVerified');
const uploadCertificateFile = require('../middleware/certificateUploadMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', requireVerified, uploadCertificateFile.single('certificate'), createCertificate);
router.get('/', getCertificates);
router.post('/:id/verify', verifyCertificateById);

module.exports = router;
