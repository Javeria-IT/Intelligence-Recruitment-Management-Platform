// middleware/certificateUploadMiddleware.js
// Configures Multer to accept only PDF/image certificates for the Fraud
// Detection module, storing them separately from resumes. Mirrors the
// validation approach used by uploadMiddleware.js for consistency.

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/AppError');

const uploadDir = path.join(__dirname, '..', 'uploads', 'certificates');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${req.user ? req.user._id : 'anon'}-${Date.now()}`;
    const ext = path.extname(file.originalname);
    cb(null, `cert-${uniqueSuffix}${ext}`);
  },
});

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only PDF, PNG, JPG, or WEBP certificate files are allowed', 400), false);
  }
};

const maxSizeMB = parseInt(process.env.MAX_CERTIFICATE_UPLOAD_MB, 10) || 8;

const uploadCertificate = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSizeMB * 1024 * 1024 },
});

module.exports = uploadCertificate;
