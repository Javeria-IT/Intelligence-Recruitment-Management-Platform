// controllers/otpController.js
// HTTP layer for OTP verification, mounted under /api/auth (send-otp,
// verify-otp, resend-otp, otp-status) alongside the existing
// register/login endpoints, per the project's existing route structure.

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { success } = require('../utils/apiResponse');
const otpService = require('../services/otpService');
const { PURPOSES } = require('../models/OtpVerification');

// @desc    Send a fresh OTP to the logged-in user's email
// @route   POST /api/auth/send-otp
// @access  Private
const sendOtp = catchAsync(async (req, res, next) => {
  const purpose = req.body.purpose || 'registration';
  if (!PURPOSES.includes(purpose)) {
    return next(new AppError(`purpose must be one of: ${PURPOSES.join(', ')}`, 400));
  }

  if (purpose === 'registration' && req.user.isVerified) {
    return next(new AppError('This account is already verified', 400));
  }

  const result = await otpService.sendOtp(req.user, purpose);
  return success(res, 200, result.message, {
    expiresInMinutes: result.expiresInMinutes,
    ...(result.devMode ? { devMode: true, note: 'SMTP not configured — check the server console for the code.' } : {}),
  });
});

// @desc    Verify a submitted OTP
// @route   POST /api/auth/verify-otp
// @access  Private
const verifyOtp = catchAsync(async (req, res, next) => {
  const { otp, purpose = 'registration' } = req.body;

  if (!otp) return next(new AppError('otp is required', 400));
  if (!PURPOSES.includes(purpose)) {
    return next(new AppError(`purpose must be one of: ${PURPOSES.join(', ')}`, 400));
  }

  await otpService.verifyOtp(req.user, purpose, otp);

  return success(res, 200, 'Verification successful', {
    user: req.user,
  });
});

// @desc    Resend an OTP (rate-limited)
// @route   POST /api/auth/resend-otp
// @access  Private
const resendOtp = catchAsync(async (req, res, next) => {
  const purpose = req.body.purpose || 'registration';
  if (!PURPOSES.includes(purpose)) {
    return next(new AppError(`purpose must be one of: ${PURPOSES.join(', ')}`, 400));
  }

  if (purpose === 'registration' && req.user.isVerified) {
    return next(new AppError('This account is already verified', 400));
  }

  const result = await otpService.resendOtp(req.user, purpose);
  return success(res, 200, result.message, {
    expiresInMinutes: result.expiresInMinutes,
    ...(result.devMode ? { devMode: true, note: 'SMTP not configured — check the server console for the code.' } : {}),
  });
});

// @desc    Check OTP/verification status for the logged-in user
// @route   GET /api/auth/otp-status
// @access  Private
const otpStatus = catchAsync(async (req, res, next) => {
  const purpose = req.query.purpose || 'registration';
  const status = await otpService.getOtpStatus(req.user, purpose);
  return success(res, 200, 'OTP status fetched', status);
});

module.exports = { sendOtp, verifyOtp, resendOtp, otpStatus };
