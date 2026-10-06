// server.js
// Application entry point: sets up Express, security middleware,
// database connection, routes, and error handling.
// API documentation/testing is provided via the Postman collection in
// the postman/ folder rather than Swagger.
const dns = require('dns');
const path = require('path');

dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const mongoose = require('mongoose');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const jobRoutes = require('./routes/jobRoutes');
const recruiterRoutes = require('./routes/recruiterRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./routes/aiRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const fraudRoutes = require('./routes/fraudRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const githubRoutes = require('./routes/githubRoutes');
const resumeVerificationRoutes = require('./routes/resumeVerificationRoutes');

// Connect to MongoDB
connectDB();

const app = express();

// ---------- Security & core middleware ----------
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

// sets various secure HTTP headers
app.use(
  cors({
   origin: 'http://localhost:8080',
  credentials: true
  })
);
app.use(compression()); // gzip responses
app.use(express.json({ limit: '10kb' })); // body parser, limits payload size
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize()); // strips $ and . from req.body/query/params to prevent NoSQL injection

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting to prevent brute-force / abuse
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Serve uploaded resumes statically (e.g. for recruiters to view/download)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---------- Health check ----------
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is healthy', timestamp: new Date() });
});

// ---------- API routes ----------
app.use('/api/auth', authRoutes);
app.use('/api/candidate', candidateRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/fraud', fraudRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/resume', resumeVerificationRoutes);

// ---------- 404 + global error handler ----------
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`Import the Postman collection (postman/RecruitAI.postman_collection.json) to explore the API.`);
});

// Gracefully handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
