// middleware/uploadMiddleware.js
// Configures Multer to accept only PDF/DOCX resumes, store them locally
// inside uploads/resumes, and enforce a max file size.

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/AppError');

const uploadDir = path.join(
  __dirname,
  '..',
  process.env.RESUME_UPLOAD_PATH || 'uploads/resumes'
);

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // e.g. 64f1a2...-1699999999999-resume.pdf
    const uniqueSuffix = `${req.user ? req.user._id : 'anon'}-${Date.now()}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only PDF and DOCX resume files are allowed', 400), false);
  }
};

const maxSizeMB = parseInt(process.env.MAX_FILE_UPLOAD_MB, 10) || 5;

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSizeMB * 1024 * 1024 },
});

module.exports = upload;
