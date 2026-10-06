// services/otpService.js
// Business logic for OTP generation, delivery, verification, and resend,
// shared by the auth controller (registration/login) and the dedicated
// OTP endpoints. Keeps all OTP security rules (expiry, attempts, hashing)
// in one place.

const OtpVerification = require('../models/OtpVerification');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { generateOtp, hashOtp, verifyOtpHash } = require('../utils/otp');
const { sendOtpEmail } = require('./emailService');

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 10;
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS, 10) || 5;
const OTP_RESEND_COOLDOWN_SECONDS = parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS, 10) || 60;

/**
 * Creates a new OTP record for a user + purpose and emails it. Any
 * previous, still-active OTP for the same user+purpose is invalidated
 * first so only the newest code is ever valid.
 */
async function issueOtp(user, purpose) {
  await OtpVerification.updateMany(
    { userId: user._id, purpose, consumedAt: { $exists: false }, verified: false },
    { $set: { consumedAt: new Date() } }
  );

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  const record = await OtpVerification.create({
    userId: user._id,
    purpose,
    otpHash: hashOtp(otp),
    expiresAt,
    maxAttempts: OTP_MAX_ATTEMPTS,
    lastSentAt: new Date(),
  });

  const emailResult = await sendOtpEmail(user.email, {
    otp,
    purpose,
    expiryMinutes: OTP_EXPIRY_MINUTES,
  });

  return { record, emailResult };
}

/**
 * Sends a fresh OTP for a user + purpose. Used both right after
 * registration and by the explicit "send OTP" endpoint.
 */
async function sendOtp(user, purpose = 'registration') {
  const { emailResult } = await issueOtp(user, purpose);
  return {
    message: `A verification code has been sent to ${user.email}`,
    expiresInMinutes: OTP_EXPIRY_MINUTES,
    devMode: emailResult.devMode,
  };
}

/**
 * Resends an OTP, enforcing a short per-record cooldown in addition to
 * the IP-based rate limiter on the route itself.
 */
async function resendOtp(user, purpose = 'registration') {
  const latest = await OtpVerification.findOne({ userId: user._id, purpose }).sort({ createdAt: -1 });

  if (latest) {
    const secondsSinceLastSend = (Date.now() - latest.lastSentAt.getTime()) / 1000;
    if (secondsSinceLastSend < OTP_RESEND_COOLDOWN_SECONDS) {
      const waitSeconds = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLastSend);
      throw new AppError(`Please wait ${waitSeconds}s before requesting another code`, 429);
    }
  }

  const { emailResult } = await issueOtp(user, purpose);
  return {
    message: `A new verification code has been sent to ${user.email}`,
    expiresInMinutes: OTP_EXPIRY_MINUTES,
    devMode: emailResult.devMode,
  };
}

/**
 * Verifies a submitted OTP for a user + purpose. Throws a clear,
 * specific AppError for every failure mode (no active code, expired,
 * too many attempts, wrong code) so the frontend can show a precise
 * message — never a generic failure.
 */
async function verifyOtp(user, purpose, submittedOtp) {
  const record = await OtpVerification.findOne({
    userId: user._id,
    purpose,
    verified: false,
    consumedAt: { $exists: false },
  })
    .sort({ createdAt: -1 })
    .select('+otpHash');

  if (!record) {
    throw new AppError('No active verification code found. Please request a new one.', 400);
  }

  if (record.isExpired()) {
    record.consumedAt = new Date();
    await record.save();
    throw new AppError('This verification code has expired. Please request a new one.', 400);
  }

  if (record.isMaxAttemptsReached()) {
    record.consumedAt = new Date();
    await record.save();
    throw new AppError('Too many incorrect attempts. Please request a new verification code.', 429);
  }

  const isMatch = verifyOtpHash(submittedOtp, record.otpHash);

  if (!isMatch) {
    record.attempts += 1;
    await record.save();
    const remaining = record.maxAttempts - record.attempts;
    throw new AppError(
      remaining > 0
        ? `Incorrect code. ${remaining} attempt(s) remaining.`
        : 'Incorrect code. No attempts remaining — please request a new verification code.',
      400
    );
  }

  record.verified = true;
  record.verifiedAt = new Date();
  record.consumedAt = new Date();
  await record.save();

  if (purpose === 'registration' || purpose === 'login') {
    user.isVerified = true;
    user.verifiedAt = new Date();
    await user.save();
  }

  return { verifiedAt: record.verifiedAt };
}

/**
 * Read-only status check — used by the frontend OTP screen to know
 * whether a code is still outstanding, expired, or already verified,
 * without consuming an attempt.
 */
async function getOtpStatus(user, purpose) {
  const record = await OtpVerification.findOne({ userId: user._id, purpose }).sort({ createdAt: -1 });

  if (!record) {
    return { hasActiveOtp: false, isVerified: Boolean(user.isVerified) };
  }

  return {
    hasActiveOtp: !record.verified && !record.consumedAt && !record.isExpired(),
    isExpired: record.isExpired(),
    attemptsRemaining: Math.max(0, record.maxAttempts - record.attempts),
    isVerified: Boolean(user.isVerified),
    expiresAt: record.expiresAt,
  };
}

module.exports = {
  sendOtp,
  resendOtp,
  verifyOtp,
  getOtpStatus,
  OTP_EXPIRY_MINUTES,
  OTP_MAX_ATTEMPTS,
};
