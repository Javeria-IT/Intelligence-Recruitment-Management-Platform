// utils/otp.js
// Secure OTP generation and hashing helpers.
//
// OTPs are short-lived, single-use codes — a fast, deterministic hash
// (SHA-256 with a server-side pepper) is appropriate here (unlike
// passwords, which need bcrypt's slow, salted hashing to resist offline
// cracking of a long-lived secret). The OTP's own short expiry window
// and attempt limit are what protect it, not hash cost.

const crypto = require('crypto');

const OTP_LENGTH = parseInt(process.env.OTP_LENGTH, 10) || 6;
const PEPPER = process.env.OTP_HASH_SECRET || process.env.JWT_SECRET || 'irm-otp-pepper';

/**
 * Generates a cryptographically secure numeric OTP, e.g. "482913".
 * Uses crypto.randomInt so codes are unpredictable and uniformly
 * distributed (Math.random() is not safe for security tokens).
 */
function generateOtp(length = OTP_LENGTH) {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(crypto.randomInt(min, max + 1));
}

/**
 * Hashes an OTP for storage. Never store the raw code.
 */
function hashOtp(otp) {
  return crypto.createHmac('sha256', PEPPER).update(String(otp)).digest('hex');
}

/**
 * Constant-time comparison between a submitted OTP and the stored hash,
 * to avoid leaking timing information about how much of the hash matched.
 */
function verifyOtpHash(otp, storedHash) {
  const candidateHash = hashOtp(otp);
  const a = Buffer.from(candidateHash, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = { generateOtp, hashOtp, verifyOtpHash, OTP_LENGTH };
