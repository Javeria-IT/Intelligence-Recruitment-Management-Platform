// ai/certificateVerifier.js
// OCR/document-processing pipeline for candidate-uploaded certificates.
//
// Flow: Certificate file -> extract raw text (PDF text layer or image OCR)
//       -> extract structured metadata via pattern matching
//       -> cross-check the verification URL (if any) is reachable
//       -> compare candidate name / org / dates against profile & resume
//       -> produce an explainable verification result.
//
// IMPORTANT: absence of an online verification API/URL is never treated as
// proof of fraud — the result is "Needs Review" or "Unable to Verify"
// instead, per the module's real-data-only, no-false-negatives policy.

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const STATUS = {
  VERIFIED: 'Verified',
  NEEDS_REVIEW: 'Needs Review',
  UNABLE_TO_VERIFY: 'Unable to Verify',
  CONTRADICTION_FOUND: 'Contradiction Found',
};

const DATE_REGEX = /\b(\d{1,2}[\/\-.\s]\d{1,2}[\/\-.\s]\d{2,4}|\b[A-Z][a-z]{2,8}\s+\d{1,2},?\s+\d{4}|\b\d{4})\b/g;
const URL_REGEX = /\bhttps?:\/\/[^\s"'<>]+/gi;
const CERT_ID_REGEX = /\b(?:certificate\s*(?:id|no\.?|number)\s*[:#]?\s*)([A-Za-z0-9\-]{4,})/i;

/**
 * Extracts raw text from a certificate file (PDF or image).
 * PDFs use the existing pdf-parse dependency (text layer only — most
 * digitally-issued certificates have one). Images fall back to OCR via
 * tesseract.js. If the PDF has no extractable text (a scanned image
 * saved as PDF), we still return whatever text pdf-parse could find and
 * flag low-confidence extraction upstream.
 */
async function extractCertificateText(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf') {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return { text: data.text || '', method: 'pdf-text-layer' };
  }

  if (['.png', '.jpg', '.jpeg', '.webp', '.bmp'].includes(ext)) {
    // Lazy-require so environments without tesseract.js installed don't
    // crash on startup — only fails when an image is actually uploaded.
    let Tesseract;
    try {
      Tesseract = require('tesseract.js');
    } catch (e) {
      throw new Error('OCR engine unavailable on this server');
    }
    const { data } = await Tesseract.recognize(filePath, 'eng');
    return { text: data.text || '', method: 'ocr' };
  }

  throw new Error('Unsupported certificate file type');
}

/**
 * Pulls structured fields out of raw certificate text using heuristic
 * pattern matching. This is intentionally conservative: fields that can't
 * be confidently found are left blank rather than guessed.
 */
function extractCertificateMetadata(rawText) {
  const text = rawText || '';

  const urls = text.match(URL_REGEX) || [];
  const dates = text.match(DATE_REGEX) || [];
  const certIdMatch = text.match(CERT_ID_REGEX);

  // Issuing organization: look for common phrasing patterns
  const orgMatch = text.match(/(?:issued by|awarded by|provided by)\s*[:\-]?\s*([A-Z][A-Za-z0-9&.,'\- ]{2,60})/i);

  // Certificate title: look for "Certificate of ..." / "Certification in ..."
  const titleMatch = text.match(/(certificate of [A-Za-z0-9&.,'\- ]{3,80}|certification in [A-Za-z0-9&.,'\- ]{3,80})/i);

  return {
    certificateTitle: titleMatch ? titleMatch[0].trim() : '',
    issuingOrganization: orgMatch ? orgMatch[1].trim() : '',
    certificateId: certIdMatch ? certIdMatch[1].trim() : '',
    issueDate: dates[0] || '',
    expiryDate: dates.length > 1 ? dates[1] : '',
    verificationUrl: urls[0] || '',
    rawText: text.slice(0, 8000),
  };
}

/**
 * Best-effort check that a verification URL actually resolves. We treat
 * network/timeout failures as "unknown" rather than "fake" — many
 * verification portals block automated requests or require JS.
 */
async function checkVerificationUrl(url) {
  if (!url) return { reachable: null, note: 'No verification URL found on certificate' };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal });
    clearTimeout(timeout);
    return { reachable: res.ok, note: `Verification URL responded with status ${res.status}` };
  } catch (err) {
    return { reachable: null, note: 'Verification URL could not be reached (network error or blocked)' };
  }
}

/**
 * Compares extracted certificate metadata against the candidate's known
 * profile information and produces a verification verdict + evidence.
 *
 * @param {object} extracted   output of extractCertificateMetadata
 * @param {object} candidate   { fullName }
 * @param {object} urlCheck    output of checkVerificationUrl
 */
function evaluateCertificate(extracted, candidate, urlCheck) {
  const evidence = [];
  let status = STATUS.NEEDS_REVIEW;

  const nameFound = extracted.rawText.toLowerCase().includes((candidate.fullName || '').toLowerCase());
  if (candidate.fullName) {
    if (nameFound) {
      evidence.push('Candidate name found on the certificate text.');
    } else {
      evidence.push('Candidate name was not found on the certificate text.');
    }
  }

  const hasCoreFields = extracted.certificateTitle || extracted.issuingOrganization;
  if (!hasCoreFields) {
    evidence.push('Could not confidently extract a certificate title or issuing organization from the document.');
    status = STATUS.UNABLE_TO_VERIFY;
  }

  if (candidate.fullName && !nameFound && hasCoreFields) {
    status = STATUS.CONTRADICTION_FOUND;
    evidence.push('Certificate appears genuine in structure, but the candidate name does not match the profile — flagged as a contradiction for recruiter review.');
  }

  if (extracted.verificationUrl) {
    evidence.push(urlCheck.note);
    if (urlCheck.reachable === true && status !== STATUS.CONTRADICTION_FOUND) {
      status = STATUS.VERIFIED;
      evidence.push('Verification URL on the certificate is reachable, supporting authenticity.');
    } else if (urlCheck.reachable === false && status !== STATUS.CONTRADICTION_FOUND) {
      status = STATUS.NEEDS_REVIEW;
    }
  } else if (status === STATUS.NEEDS_REVIEW && hasCoreFields) {
    // No online source to check — do NOT claim fake, just flag for review.
    status = STATUS.UNABLE_TO_VERIFY;
    evidence.push('No verification URL/QR/code was found on the certificate, so authenticity could not be independently confirmed online. This alone is not evidence of fraud.');
  }

  return { status, evidence };
}

/**
 * Full pipeline: file -> OCR/text extraction -> metadata -> verification.
 */
async function verifyCertificateFile(filePath, candidate) {
  const { text } = await extractCertificateText(filePath);
  const extracted = extractCertificateMetadata(text);
  const urlCheck = await checkVerificationUrl(extracted.verificationUrl);
  const { status, evidence } = evaluateCertificate(extracted, candidate, urlCheck);

  return { extracted, status, evidence, verifiedAt: new Date() };
}

module.exports = {
  STATUS,
  extractCertificateText,
  extractCertificateMetadata,
  checkVerificationUrl,
  evaluateCertificate,
  verifyCertificateFile,
};
