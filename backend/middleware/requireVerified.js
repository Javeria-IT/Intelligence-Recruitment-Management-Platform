// middleware/requireVerified.js
// Gates a route behind email/OTP verification. Applied to the new
// verification-sensitive endpoints introduced with the OTP module
// (candidates submitting certificates/GitHub data for fraud checks).
//
// Deliberately NOT retrofitted onto every pre-existing route — accounts
// created before this module shipped default to isVerified: true (see
// models/User.js), so existing sessions are unaffected. Only newly
// registered, still-unverified accounts are blocked here.

const AppError = require('../utils/AppError');

const requireVerified = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Not authorized', 401));
  }
  if (!req.user.isVerified) {
    return next(
      new AppError('Please verify your email address before continuing. Check your inbox for a verification code.', 403)
    );
  }
  next();
};

module.exports = requireVerified;
