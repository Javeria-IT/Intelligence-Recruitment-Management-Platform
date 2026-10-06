// routes/authRoutes.js
const express = require('express');
const { body } = require('express-validator');
const { register, login, getProfile, updateProfile, uploadAvatar } = require('../controllers/authController');
const { sendOtp, verifyOtp, resendOtp, otpStatus } = require('../controllers/otpController');
const { protect } = require('../middleware/authMiddleware');
const { otpSendLimiter, otpVerifyLimiter } = require('../middleware/otpRateLimiter');
const validate = require('../middleware/validateMiddleware');
const uploadAvatarMiddleware = require('../middleware/avatarUploadMiddleware');

const router = express.Router();


router.post(
  '/register',
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['candidate', 'recruiter', 'admin']),
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

router.get('/profile', protect, getProfile);

// Works for any authenticated role (candidate, recruiter, or admin) — this
// is the generic account-info update that recruiterRoutes.js doesn't have
// its own copy of.
router.put(
  '/profile',
  protect,
  [
    body('fullName').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
    body('phone').optional().trim(),
  ],
  validate,
  updateProfile
);

router.post('/avatar', protect, uploadAvatarMiddleware.single('avatar'), uploadAvatar);

// ---------- OTP verification ----------
router.post(
  '/send-otp',
  protect,
  otpSendLimiter,
  [body('purpose').optional().isIn(['registration', 'login', 'password_reset'])],
  validate,
  sendOtp
);

router.post(
  '/verify-otp',
  protect,
  otpVerifyLimiter,
  [
    body('otp').trim().notEmpty().withMessage('OTP is required'),
    body('purpose').optional().isIn(['registration', 'login', 'password_reset']),
  ],
  validate,
  verifyOtp
);

router.post(
  '/resend-otp',
  protect,
  otpSendLimiter,
  [body('purpose').optional().isIn(['registration', 'login', 'password_reset'])],
  validate,
  resendOtp
);

router.get('/otp-status', protect, otpStatus);

module.exports = router;
