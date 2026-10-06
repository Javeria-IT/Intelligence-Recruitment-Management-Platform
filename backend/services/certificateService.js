// services/certificateService.js
// Single source of truth for certificate upload + verification, used by
// both the standalone /api/certificates endpoints and the existing
// /api/fraud/certificate/:candidateId endpoint, so the logic exists in
// exactly one place.

const path = require('path');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { verifyCertificateFile, STATUS } = require('../ai/certificateVerifier');

// Certificate.verificationStatus uses "Needs Manual Review" (per the
// verification-terminology spec); ai/certificateVerifier speaks the
// original module's "Needs Review". Map between the two at this boundary
// only, so neither module needs to know about the other's vocabulary.
function mapAiStatusToCertificateStatus(aiStatus) {
  if (aiStatus === STATUS.NEEDS_REVIEW) return 'Needs Manual Review';
  return aiStatus; // Verified / Unable to Verify / Contradiction Found pass through unchanged
}

/**
 * Looks for existing certificates on file for this candidate that share
 * a credential ID or a normalized (title + issuer) fingerprint —
 * flagged for recruiter awareness, never auto-rejected.
 */
async function findDuplicate(candidateId, extracted) {
  const orConditions = [];

  if (extracted.certificateId) {
    orConditions.push({ 'extracted.certificateId': extracted.certificateId });
  }
  if (extracted.certificateName || extracted.certificateTitle) {
    const name = (extracted.certificateName || extracted.certificateTitle).trim().toLowerCase();
    if (name) {
      orConditions.push({
        $expr: {
          $eq: [{ $toLower: { $trim: { input: '$extracted.certificateTitle' } } }, name],
        },
      });
    }
  }

  if (orConditions.length === 0) return null;

  return Certificate.findOne({ candidateId, $or: orConditions }).sort({ createdAt: 1 });
}

/**
 * Uploads + OCR-verifies a certificate file and stores it in the
 * standalone `certificates` collection.
 */
async function uploadAndVerifyCertificate(candidateId, file) {
  const user = await User.findById(candidateId);
  if (!user || user.role !== 'candidate') {
    throw new AppError('Candidate not found', 404);
  }

  const absolutePath = path.join(__dirname, '..', 'uploads', 'certificates', file.filename);
  const result = await verifyCertificateFile(absolutePath, { fullName: user.fullName });

  const extracted = {
    candidateName: result.extracted.candidateName || '',
    certificateName: result.extracted.certificateTitle || '',
    certificateTitle: result.extracted.certificateTitle || '',
    issuingOrganization: result.extracted.issuingOrganization || '',
    certificateId: result.extracted.certificateId || '',
    issueDate: result.extracted.issueDate || '',
    expiryDate: result.extracted.expiryDate || '',
    credentialUrl: result.extracted.verificationUrl || '',
    verificationUrl: result.extracted.verificationUrl || '',
    rawText: result.extracted.rawText || '',
  };

  const duplicate = await findDuplicate(candidateId, extracted);

  const evidence = [...result.evidence];
  let status = mapAiStatusToCertificateStatus(result.status);

  if (duplicate) {
    evidence.push(
      `This certificate appears to duplicate a certificate uploaded on ${duplicate.createdAt.toDateString()}. This may be a legitimate re-upload — flagged for recruiter awareness, not treated as fraud.`
    );
  }

  const certificate = await Certificate.create({
    candidateId,
    fileUrl: `/uploads/certificates/${file.filename}`,
    originalFileName: file.originalname,
    extracted,
    verificationStatus: status,
    evidence,
    isDuplicate: Boolean(duplicate),
    duplicateOf: duplicate ? duplicate._id : undefined,
    verifiedAt: result.verifiedAt,
  });

  return certificate;
}

async function listCertificatesForCandidate(candidateId) {
  return Certificate.find({ candidateId }).sort({ createdAt: -1 });
}

/**
 * Re-runs verification for an existing certificate (e.g. to re-check a
 * verification URL that may now be reachable).
 */
async function reverifyCertificate(certificateId, requestingUser) {
  const certificate = await Certificate.findById(certificateId);
  if (!certificate) throw new AppError('Certificate not found', 404);

  if (
    requestingUser.role === 'candidate' &&
    certificate.candidateId.toString() !== requestingUser._id.toString()
  ) {
    throw new AppError('You can only verify your own certificates', 403);
  }

  const user = await User.findById(certificate.candidateId);
  const absolutePath = path.join(
    __dirname,
    '..',
    'uploads',
    'certificates',
    path.basename(certificate.fileUrl)
  );

  const result = await verifyCertificateFile(absolutePath, { fullName: user.fullName });

  certificate.verificationStatus = mapAiStatusToCertificateStatus(result.status);
  certificate.evidence = result.evidence;
  certificate.verifiedAt = result.verifiedAt;
  await certificate.save();

  return certificate;
}

module.exports = {
  uploadAndVerifyCertificate,
  listCertificatesForCandidate,
  reverifyCertificate,
  mapAiStatusToCertificateStatus,
};
