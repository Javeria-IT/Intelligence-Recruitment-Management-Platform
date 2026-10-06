// middleware/errorMiddleware.js
// Centralized error handler. Converts known Mongoose/JWT errors into
// clean, consistent AppError-style responses.

const AppError = require('../utils/AppError');

// Handle invalid MongoDB ObjectId (CastError)
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// Handle duplicate key errors (e.g. unique email)
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue || {})[0];
  const value = err.keyValue ? err.keyValue[field] : '';
  const message = `Duplicate value for field '${field}': '${value}'. Please use another value.`;
  return new AppError(message, 409);
};

// Handle Mongoose validation errors
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token, please log in again', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired, please log in again', 401);

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = { ...err, message: err.message, stack: err.stack };
  error.statusCode = err.statusCode || 500;
  error.status = err.status || 'error';

  if (err.name === 'CastError') error = handleCastErrorDB(err);
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
  if (err.name === 'MulterError') error = new AppError(err.message, 400);

  // Log full error server-side for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('ERROR 💥', err);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

// Handle unmatched routes (404)
const notFound = (req, res, next) => {
  const error = new AppError(`Route not found: ${req.originalUrl}`, 404);
  next(error);
};

module.exports = { errorHandler, notFound };
