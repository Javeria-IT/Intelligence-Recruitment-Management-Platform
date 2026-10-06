// middleware/otpRateLimiter.js
// Stricter, dedicated rate limits for OTP send/resend endpoints, layered
// on top of the app-wide limiter in server.js. Keyed by IP + the
// authenticated user id so one user can't be locked out by another
// user's traffic from a shared IP (e.g. office NAT), while still
// stopping a single account from being hammered.

const rateLimit = require('express-rate-limit');

const keyGenerator = (req) => `${req.ip}:${req.user ? req.user._id : 'anon'}`;

// Applies to POST /send-otp and /resend-otp
const otpSendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: parseInt(process.env.OTP_SEND_RATE_LIMIT, 10) || 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: {
    success: false,
    message: 'Too many verification code requests. Please wait a few minutes and try again.',
  },
});

// Slightly more generous for the verify step itself, since users mistype.
const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: parseInt(process.env.OTP_VERIFY_RATE_LIMIT, 10) || 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: {
    success: false,
    message: 'Too many verification attempts. Please wait a few minutes and try again.',
  },
});

module.exports = { otpSendLimiter, otpVerifyLimiter };
