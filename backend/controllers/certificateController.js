// controllers/certificateController.js
// HTTP layer for the standalone /api/certificates resource.

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { success } = require('../utils/apiResponse');
const certificateService = require('../services/certificateService');
const Job = require('../models/Job');
const Application = require('../models/Application');

async function assertCanViewCandidate(req, candidateId) {
  if (req.user.role === 'admin') return;
  if (req.user._id.toString() === candidateId) return; // candidate viewing their own
  if (req.user.role === 'recruiter') {
    const ownsApplication = await Application.exists({
      candidateId,
      jobId: { $in: await Job.find({ recruiterId: req.user._id }).distinct('_id') },
    });
    if (ownsApplication) return;
  }
  throw new AppError("You are not authorized to view this candidate's certificates", 403);
}

// @desc    Upload a certificate for OCR extraction + verification
// @route   POST /api/certificates
// @access  Private (candidate)
const createCertificate = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'candidate') {
    return next(new AppError('Only candidates can upload certificates', 403));
  }
  if (!req.file) {
    return next(new AppError('Please upload a certificate file (PDF, PNG, JPG, or WEBP)', 400));
  }

  const certificate = await certificateService.uploadAndVerifyCertificate(req.user._id, req.file);

  return success(res, 201, 'Certificate uploaded and processed', { certificate });
});

// @desc    List certificates — candidate's own, or (for recruiters/admins) via ?candidateId=
// @route   GET /api/certificates
// @access  Private
const getCertificates = catchAsync(async (req, res, next) => {
  const candidateId = req.user.role === 'candidate' ? req.user._id.toString() : req.query.candidateId;

  if (!candidateId) {
    return next(new AppError('candidateId query parameter is required', 400));
  }

  await assertCanViewCandidate(req, candidateId);

  const certificates = await certificateService.listCertificatesForCandidate(candidateId);
  return success(res, 200, 'Certificates fetched', { certificates });
});

// @desc    Re-run verification for an existing certificate
// @route   POST /api/certificates/:id/verify
// @access  Private (owning candidate or admin)
const verifyCertificateById = catchAsync(async (req, res, next) => {
  const certificate = await certificateService.reverifyCertificate(req.params.id, req.user);
  return success(res, 200, 'Certificate re-verified', { certificate });
});

module.exports = { createCertificate, getCertificates, verifyCertificateById };
