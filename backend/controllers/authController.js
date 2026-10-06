// controllers/authController.js
// Handles registration, login, and fetching the logged-in user's profile.

const User = require('../models/User');
const CandidateProfile = require('../models/CandidateProfile');
const generateToken = require('../utils/generateToken');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { success } = require('../utils/apiResponse');
const otpService = require('../services/otpService');

const LOGIN_2FA_ENABLED = process.env.OTP_LOGIN_2FA_ENABLED === 'true';

// @desc    Register a new user (candidate, recruiter, or admin)
// @route   POST /api/auth/register
// @access  Public
const register = catchAsync(async (req, res, next) => {
  const { fullName, email, password, role, phone,// Company Information
    companyName,
    companyWebsite,
    industry,
    companyLocation,
    companyDescription,

    // Recruiter Information
    jobTitle,
    department,
    yearsOfExperience,
    linkedinProfile,} = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('A user with this email already exists', 409));
  }

  // Prevent public self-registration as admin
  const safeRole = role === 'admin' ? 'candidate' : role;

  const user = await User.create({
    fullName,
    email,
    password,
    role: safeRole || 'candidate',
    phone,
    isVerified: false, // mandatory OTP verification for new accounts
  });

  // If the user registers as a candidate, auto-create an empty profile
  if (user.role === 'candidate') {
    await CandidateProfile.create({ userId: user._id });
  }

  const token = generateToken(user._id, user.role);

  // Fire off the registration OTP. Email delivery issues should never
  // block account creation — the user can always request a resend — so
  // failures here are logged rather than surfaced as a registration error.
  let otpDispatch = { devMode: false };
  try {
    otpDispatch = await otpService.sendOtp(user, 'registration');
  } catch (err) {
    console.error('[register] Failed to send verification OTP:', err.message);
  }

  return success(res, 201, 'User registered successfully. Please verify your email to continue.', {
    user,
    token,
    requiresOtpVerification: true,
    otp: { expiresInMinutes: otpDispatch.expiresInMinutes, devMode: otpDispatch.devMode },
  });
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return next(new AppError('Invalid email or password', 401));
  }

  if (!user.isActive) {
    return next(new AppError('This account has been deactivated', 403));
  }

  const token = generateToken(user._id, user.role);

  // Case 1: registration OTP was never completed — send them back through
  // verification. We don't block issuing a token (so the OTP endpoints,
  // which are auth-protected, remain reachable), but the frontend must
  // route unverified users to /verify-otp instead of the dashboard.
  if (!user.isVerified) {
    const status = await otpService.getOtpStatus(user, 'registration');
    if (!status.hasActiveOtp) {
      await otpService.sendOtp(user, 'registration').catch((err) =>
        console.error('[login] Failed to send verification OTP:', err.message)
      );
    }
    return success(res, 200, 'Please verify your email to continue', {
      user,
      token,
      requiresOtpVerification: true,
      otpPurpose: 'registration',
    });
  }

  // Case 2: optional login 2FA, off by default (OTP_LOGIN_2FA_ENABLED=true to enable).
  if (LOGIN_2FA_ENABLED) {
    await otpService.sendOtp(user, 'login').catch((err) =>
      console.error('[login] Failed to send login OTP:', err.message)
    );
    return success(res, 200, 'Enter the verification code sent to your email to finish signing in', {
      user,
      token,
      requiresOtpVerification: true,
      otpPurpose: 'login',
    });
  }

  return success(res, 200, 'Login successful', {
    user,
    token,
    requiresOtpVerification: false,
  });
});

// @desc    Get currently logged-in user's profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  return success(res, 200, 'Profile fetched successfully', { user });
});

// @desc    Update the logged-in user's basic account info (any role)
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = catchAsync(async (req, res, next) => {
  const { fullName, phone } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) return next(new AppError('User not found', 404));

  if (fullName !== undefined) user.fullName = fullName;
  if (phone !== undefined) user.phone = phone;

  await user.save();

  return success(res, 200, 'Profile updated successfully', { user });
});

// @desc    Upload/replace the logged-in user's profile photo (any role)
// @route   POST /api/auth/avatar
// @access  Private
const uploadAvatar = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload an image file', 400));
  }

  const user = await User.findById(req.user._id);
  if (!user) return next(new AppError('User not found', 404));

  user.profileImage = `/uploads/avatars/${req.file.filename}`;
  await user.save();

  return success(res, 200, 'Profile photo updated successfully', { user });
});

module.exports = { register, login, getProfile, updateProfile, uploadAvatar };
