// services/fraudDetectionService.js
// Orchestrates the Fraud Detection module: gathers candidate data from
// the existing User/CandidateProfile/Application models plus the
// standalone Certificate collection, runs it through the AI sub-checks
// (ai/*.js), and persists a single up-to-date FraudCheck document per
// candidate.

const User = require('../models/User');
const CandidateProfile = require('../models/CandidateProfile');
const Application = require('../models/Application');
const FraudCheck = require('../models/FraudCheck');
const Certificate = require('../models/Certificate');
const AppError = require('../utils/AppError');

const { analyzeTimeline, buildExperienceChecks } = require('../ai/timelineAnalyzer');
const { verifyGithubProfile } = require('../ai/githubVerifier');
const { checkConsistency } = require('../ai/consistencyChecker');
const { computeFraudAnalysis } = require('../ai/fraudScoringEngine');
const certificateService = require('./certificateService');

/**
 * Loads the candidate's user + profile, throwing a clean 404 AppError if
 * either is missing.
 */
async function loadCandidateContext(candidateId) {
  const user = await User.findById(candidateId);
  if (!user || user.role !== 'candidate') {
    throw new AppError('Candidate not found', 404);
  }

  const profile = await CandidateProfile.findOne({ userId: candidateId });
  if (!profile) {
    throw new AppError('Candidate has no profile yet — nothing to verify', 404);
  }

  return { user, profile };
}

/**
 * Verifies a single newly-uploaded certificate file and stores it in the
 * standalone `certificates` collection (delegates to certificateService,
 * the single source of truth also used by POST /api/certificates).
 */
async function verifyAndStoreCertificate(candidateId, file) {
  const certificate = await certificateService.uploadAndVerifyCertificate(candidateId, file);
  const profile = await CandidateProfile.findOne({ userId: candidateId });
  return { profile, certificate };
}

/**
 * Verifies (or re-verifies) the candidate's GitHub profile URL, stores it
 * on the profile, and returns the raw githubCheck result.
 */
async function verifyAndStoreGithub(candidateId, githubUrl) {
  const { profile } = await loadCandidateContext(candidateId);

  if (githubUrl) {
    profile.githubUrl = githubUrl;
  }

  if (!profile.githubUrl) {
    throw new AppError('No GitHub profile URL has been provided for this candidate', 400);
  }

  const githubCheck = await verifyGithubProfile(profile.githubUrl, profile.skills || []);

  // Persist the latest result on the profile so GET /api/github/:candidateId
  // can answer instantly without requiring a full fraud check to have run.
  profile.githubVerification = githubCheck;
  await profile.save();

  return { profile, githubCheck };
}

/**
 * Runs (or re-runs) the timeline/experience overlap analysis only.
 */
async function analyzeExperienceOnly(candidateId) {
  const { profile } = await loadCandidateContext(candidateId);
  const experienceChecks = buildExperienceChecks(profile.experience || []);
  const timelineCheck = analyzeTimeline(profile.experience || []);
  return { experienceChecks, timelineCheck };
}

/**
 * Runs the FULL fraud analysis pipeline for a candidate:
 * certificates + experience/timeline + GitHub + resume consistency,
 * combines them via the explainable scoring engine, and upserts the
 * candidate's FraudCheck document.
 */
async function runFullFraudCheck(candidateId, { applicationId } = {}) {
  const { user, profile } = await loadCandidateContext(candidateId);

  // 1. Certificates — use already-stored verification results from the
  //    standalone `certificates` collection rather than re-running OCR
  //    on every check.
  const certificateDocs = await certificateService.listCertificatesForCandidate(candidateId);
  const certificateChecks = certificateDocs.map((c) => ({
    certificateId: c._id,
    certificateTitle: c.extracted?.certificateTitle || c.extracted?.certificateName || '',
    issuingOrganization: c.extracted?.issuingOrganization || '',
    // FraudCheck's own enum keeps the original wording ("Needs Review");
    // map the certificate's "Needs Manual Review" back for aggregation.
    status: c.verificationStatus === 'Needs Manual Review' ? 'Needs Review' : c.verificationStatus,
    evidence: c.evidence,
    verificationSource: c.extracted?.credentialUrl || c.extracted?.verificationUrl || '',
  }));

  // 2. Experience + timeline
  const experienceChecks = buildExperienceChecks(profile.experience || []);
  const timelineCheck = analyzeTimeline(profile.experience || []);

  // 3. GitHub — re-verify live if a URL is on file; otherwise mark unavailable
  let githubCheck = {
    profileUrl: '',
    exists: false,
    status: 'Unable to Verify',
    supportingEvidence: [],
    claimsRequiringReview: ['Candidate has not provided a GitHub profile URL.'],
    checkedAt: new Date(),
  };
  if (profile.githubUrl) {
    try {
      githubCheck = await verifyGithubProfile(profile.githubUrl, profile.skills || []);
      profile.githubVerification = githubCheck;
      await profile.save();
    } catch (e) {
      githubCheck.claimsRequiringReview = ['GitHub verification failed due to a temporary error.'];
    }
  }

  // 4. Resume/profile consistency
  const consistencyChecks = checkConsistency({
    user,
    profile: profile.toObject(),
    githubCheck,
    certificateResults: certificateDocs.map((c) => ({ extracted: c.extracted, status: c.verificationStatus })),
  });

  // 5. Combine into explainable score
  const analysis = computeFraudAnalysis({
    certificateChecks,
    experienceChecks,
    timelineCheck,
    githubCheck,
    consistencyChecks,
  });

  const update = {
    candidateId,
    resumeId: profile._id,
    ...(applicationId ? { applicationId } : {}),
    certificateChecks,
    experienceChecks,
    timelineChecks: timelineCheck,
    githubCheck,
    consistencyChecks,
    fraudRiskScore: analysis.fraudRiskScore,
    riskLevel: analysis.riskLevel,
    verificationStatus: analysis.verificationStatus,
    scoreBreakdown: analysis.scoreBreakdown,
    flags: analysis.flags,
    evidence: analysis.evidence,
    recommendations: analysis.recommendations,
    checkedAt: new Date(),
  };

  const fraudCheck = await FraudCheck.findOneAndUpdate(
    { candidateId },
    update,
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return fraudCheck;
}

async function getFraudCheckForCandidate(candidateId) {
  const fraudCheck = await FraudCheck.findOne({ candidateId }).populate(
    'candidateId',
    'fullName email profileImage'
  );
  if (!fraudCheck) {
    throw new AppError('No fraud check has been run for this candidate yet', 404);
  }
  return fraudCheck;
}

async function getFraudCheckForApplication(applicationId) {
  const application = await Application.findById(applicationId);
  if (!application) throw new AppError('Application not found', 404);

  let fraudCheck = await FraudCheck.findOne({ candidateId: application.candidateId }).populate(
    'candidateId',
    'fullName email profileImage'
  );

  if (!fraudCheck) {
    // Auto-run on first request so recruiters always see real data,
    // never a placeholder.
    fraudCheck = await runFullFraudCheck(application.candidateId, { applicationId });
  }

  return fraudCheck;
}

async function recordRecruiterAction(candidateId, { action, performedBy, note }) {
  const fraudCheck = await FraudCheck.findOne({ candidateId });
  if (!fraudCheck) throw new AppError('No fraud check found for this candidate', 404);

  const statusMap = {
    reviewed: 'in_review',
    verification_requested: 'verification_requested',
    marked_reviewed: 'reviewed',
    flag_ignored: 'flag_ignored',
    candidate_rejected: 'rejected',
  };

  fraudCheck.recruiterReview.actions.push({ action, performedBy, note, at: new Date() });
  fraudCheck.recruiterReview.status = statusMap[action] || fraudCheck.recruiterReview.status;
  await fraudCheck.save();

  return fraudCheck;
}

module.exports = {
  loadCandidateContext,
  verifyAndStoreCertificate,
  verifyAndStoreGithub,
  analyzeExperienceOnly,
  runFullFraudCheck,
  getFraudCheckForCandidate,
  getFraudCheckForApplication,
  recordRecruiterAction,
};
