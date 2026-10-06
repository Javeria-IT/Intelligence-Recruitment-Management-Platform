// models/Certificate.js
// Standalone `certificates` collection. Previously certificates were
// embedded on CandidateProfile; they are now a first-class, independently
// queryable/referenceable collection (per the updated spec), and
// FraudCheck.certificateChecks references documents here by id instead
// of duplicating their content.

const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    fileUrl: { type: String, required: true },
    originalFileName: { type: String, default: '' },
    uploadedAt: { type: Date, default: Date.now },

    // Fields extracted via OCR/document processing
    extracted: {
      candidateName: { type: String, default: '' },
      certificateName: { type: String, default: '' }, // "Certificate name" per spec wording
      certificateTitle: { type: String, default: '' }, // kept for backward compatibility
      issuingOrganization: { type: String, default: '' },
      certificateId: { type: String, default: '' }, // credential ID
      issueDate: { type: String, default: '' },
      expiryDate: { type: String, default: '' },
      credentialUrl: { type: String, default: '' },
      verificationUrl: { type: String, default: '' }, // alias kept for backward compatibility
      rawText: { type: String, default: '' },
    },

    verificationStatus: {
      type: String,
      enum: ['Verified', 'Needs Manual Review', 'Unable to Verify', 'Contradiction Found'],
      default: 'Needs Manual Review',
    },
    evidence: { type: [String], default: [] },
    isDuplicate: { type: Boolean, default: false },
    duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Certificate' },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

certificateSchema.index({ candidateId: 1, createdAt: -1 });

module.exports = mongoose.model('Certificate', certificateSchema);
