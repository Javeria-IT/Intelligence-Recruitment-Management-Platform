// middleware/roleMiddleware.js
// Restricts route access to specific roles. Usage: authorize('admin', 'recruiter')
// Must be used AFTER the `protect` middleware, since it relies on req.user.

const AppError = require('../utils/AppError');

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authorized, please log in', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Role '${req.user.role}' is not permitted to access this resource`,
          403
        )
      );
    }

    next();
  };
};

module.exports = { authorize };
