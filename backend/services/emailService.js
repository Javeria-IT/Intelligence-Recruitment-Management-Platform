// services/emailService.js
// Thin wrapper around nodemailer. If SMTP credentials aren't configured
// (e.g. local development), OTP emails are logged to the server console
// instead of failing the request — this keeps the OTP flow fully
// testable without requiring a real mail provider, while production
// deployments just need to set the SMTP_* env vars.

const nodemailer = require('nodemailer');

let transporter = null;
let loggedMissingConfig = false;

function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter() {
  if (!isSmtpConfigured()) return null;
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

/**
 * Sends an email, or logs it to the console in development when SMTP
 * isn't configured. Never throws for a missing SMTP config — callers
 * (e.g. OTP send) should still succeed so local development isn't blocked,
 * but DOES throw on a genuine SMTP failure so the caller can surface it.
 */
async function sendEmail({ to, subject, text, html }) {
  const t = getTransporter();

  if (!t) {
    if (!loggedMissingConfig) {
      console.warn(
        '[emailService] SMTP_HOST/SMTP_USER/SMTP_PASS not set — emails will be logged to the console instead of sent. Configure them in .env for production.'
      );
      loggedMissingConfig = true;
    }
    console.log(`\n[DEV EMAIL] To: ${to}\nSubject: ${subject}\n${text}\n`);
    return { devMode: true };
  }

  const info = await t.sendMail({
    from: process.env.SMTP_FROM || `"Intelligent Recruitment Platform" <no-reply@irm.local>`,
    to,
    subject,
    text,
    html,
  });

  return { devMode: false, messageId: info.messageId };
}

async function sendOtpEmail(toEmail, { otp, purpose, expiryMinutes }) {
  const purposeLabel = {
    registration: 'verify your account',
    login: 'confirm this login',
    password_reset: 'reset your password',
  }[purpose] || 'verify your request';

  const subject = 'Your Intelligent Recruitment Platform verification code';
  const text = `Your OTP to ${purposeLabel} is: ${otp}\n\nThis code expires in ${expiryMinutes} minutes. If you did not request this, you can safely ignore this email.`;
  const html = `
    <p>Your OTP to ${purposeLabel} is:</p>
    <p style="font-size:28px;font-weight:700;letter-spacing:4px;">${otp}</p>
    <p>This code expires in <strong>${expiryMinutes} minutes</strong>.</p>
    <p style="color:#6b7280;font-size:12px;">If you did not request this, you can safely ignore this email.</p>
  `;

  return sendEmail({ to: toEmail, subject, text, html });
}

module.exports = { sendEmail, sendOtpEmail, isSmtpConfigured };
