// utils/catchAsync.js
// Wraps async controller functions so rejected promises are forwarded
// to Express's error-handling middleware instead of crashing the server.

const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
