// models/OtpVerification.js
// One-time-password records used for mandatory email verification on
// registration/login. OTPs are never stored in plain text — only a
// salted hash — and every request is auditable (attempts, expiry,
// purpose, verification timestamp).

const mongoose = require('mongoose');

const PURPOSES = ['registration', 'login', 'password_reset'];

const otpVerificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: PURPOSES,
      required: true,
    },

    // Never store the raw OTP — only a SHA-256+pepper hash (see utils/otp.js).
    otpHash: {
      type: String,
      required: true,
      select: false,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },

    // Basic per-record resend throttling (in addition to the IP-based
    // express-rate-limit middleware on the routes themselves).
    resendCount: {
      type: Number,
      default: 0,
    },
    lastSentAt: {
      type: Date,
      default: Date.now,
    },

    verified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
    },

    // Set once consumed/expired/superseded so we never re-check a stale record.
    consumedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// A user can have multiple historical OTP records (one per send), but we
// almost always query "the latest active one for this purpose".
otpVerificationSchema.index({ userId: 1, purpose: 1, createdAt: -1 });

otpVerificationSchema.methods.isExpired = function () {
  return this.expiresAt.getTime() < Date.now();
};

otpVerificationSchema.methods.isMaxAttemptsReached = function () {
  return this.attempts >= this.maxAttempts;
};

module.exports = mongoose.model('OtpVerification', otpVerificationSchema);
module.exports.PURPOSES = PURPOSES;
