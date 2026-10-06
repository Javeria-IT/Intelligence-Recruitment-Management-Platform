// middleware/avatarUploadMiddleware.js
// Configures Multer to accept only image files for profile photos, store
// them locally inside uploads/avatars, and enforce a max file size.

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/AppError');

const uploadDir = path.join(__dirname, '..', 'uploads/avatars');

// Ensure the upload directory exists
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
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only JPG, PNG, WEBP, or GIF images are allowed', 400), false);
  }
};

const maxSizeMB = parseInt(process.env.MAX_AVATAR_UPLOAD_MB, 10) || 2;

const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSizeMB * 1024 * 1024 },
});

module.exports = uploadAvatar;
