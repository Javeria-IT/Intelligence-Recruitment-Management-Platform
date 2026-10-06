// middleware/authMiddleware.js
// Verifies the JWT from the Authorization header and attaches the
// authenticated user (minus password) to req.user.

const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const User = require('../models/User');

const protect = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Not authorized, no token provided', 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return next(new AppError('Not authorized, token invalid or expired', 401));
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new AppError('The user belonging to this token no longer exists', 401));
  }

  if (!user.isActive) {
    return next(new AppError('This account has been deactivated', 403));
  }

  req.user = user;
  next();
});

module.exports = { protect };
