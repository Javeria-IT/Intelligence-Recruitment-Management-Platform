// ai/fraudScoringEngine.js
// Combines the results of every verification sub-check into a single,
// explainable Fraud Risk Score (0-100). Every point of the score can be
// traced back to a specific sub-check via `scoreBreakdown`, and every
// flag has an accompanying evidence string — the score is never an
// unexplained black box.

const WEIGHTS = {
  certificateVerification: 0.25,
  experienceConsistency: 0.20,
  timelineConsistency: 0.20,
  githubEvidence: 0.15,
  resumeProfileConsistency: 0.20,
};

function riskLevelFromScore(score) {
  if (score <= 20) return 'Low Risk';
  if (score <= 50) return 'Needs Review';
  if (score <= 75) return 'Suspicious';
  return 'High Risk';
}

/**
 * Converts a certificate verification result set into a 0-100 risk
 * contribution (higher = riskier).
 */
function scoreCertificates(certificateChecks = []) {
  if (certificateChecks.length === 0) {
    // No certificates uploaded is neutral, not risky — nothing to flag.
    return { risk: 0, flags: [], evidence: [] };
  }

  const flags = [];
  const evidence = [];
  let riskSum = 0;

  certificateChecks.forEach((c) => {
    switch (c.status) {
      case 'Verified':
        riskSum += 0;
        break;
      case 'Needs Review':
        riskSum += 40;
        flags.push(`Certificate "${c.certificateTitle || 'Untitled'}" needs review`);
        break;
      case 'Unable to Verify':
        riskSum += 25; // Explicitly lower than "needs review" — absence of an API is not fraud
        flags.push(`Certificate "${c.certificateTitle || 'Untitled'}" could not be verified`);
        break;
      case 'Contradiction Found':
        riskSum += 90;
        flags.push(`Certificate "${c.certificateTitle || 'Untitled'}" contains contradictory information`);
        break;
      default:
        riskSum += 20;
    }
    (c.evidence || []).forEach((e) => evidence.push(e));
  });

  return { risk: Math.min(100, Math.round(riskSum / certificateChecks.length)), flags, evidence };
}

function scoreExperience(experienceChecks = []) {
  if (experienceChecks.length === 0) return { risk: 0, flags: [], evidence: [] };

  const flagged = experienceChecks.filter((e) => e.flags && e.flags.length > 0);
  const flags = flagged.map((e) => `Experience entry "${e.title || 'Untitled role'}" at "${e.company || 'Unknown'}" flagged: ${e.flags.join('; ')}`);
  const risk = Math.min(100, Math.round((flagged.length / experienceChecks.length) * 100));

  return { risk, flags, evidence: flags };
}

function scoreTimeline(timelineCheck = {}) {
  if (!timelineCheck.hasOverlap) return { risk: 0, flags: [], evidence: [] };

  const flags = ['Experience Timeline Conflict'];
  const evidence = (timelineCheck.overlaps || []).map(
    (o) => `Overlap of ${o.overlapMonths} month(s) between "${o.companyA}" and "${o.companyB}". Possible reasons: ${o.possibleReasons.join(', ')}.`
  );

  // More/longer overlaps push risk up, but cap moderately since overlap
  // is often legitimate — this should prompt review, not condemnation.
  const totalOverlapMonths = (timelineCheck.overlaps || []).reduce((s, o) => s + o.overlapMonths, 0);
  const risk = Math.min(70, 30 + totalOverlapMonths * 2);

  return { risk, flags, evidence };
}

function scoreGithub(githubCheck = {}) {
  const evidence = [
    ...(githubCheck.supportingEvidence || []),
    ...(githubCheck.claimsRequiringReview || []),
  ];

  switch (githubCheck.status) {
    case 'Verified':
      return { risk: 0, flags: [], evidence };
    case 'Passed':
      return { risk: 10, flags: [], evidence };
    case 'Needs Review':
      return { risk: 35, flags: ['GitHub evidence needs review'], evidence };
    case 'Contradiction Found':
      return { risk: 85, flags: ['GitHub profile does not exist or contradicts resume claims'], evidence };
    case 'Unable to Verify':
    default:
      return { risk: 15, flags: [], evidence }; // Unable to verify is treated gently, not as fraud
  }
}

function scoreConsistency(consistencyChecks = []) {
  if (consistencyChecks.length === 0) return { risk: 0, flags: [], evidence: [] };

  const severityWeight = { low: 15, medium: 35, high: 70 };
  const flags = consistencyChecks.map((c) => c.issue);
  const evidence = consistencyChecks.map((c) => c.evidence);
  const risk = Math.min(
    100,
    Math.round(
      consistencyChecks.reduce((sum, c) => sum + (severityWeight[c.severity] || 25), 0) /
        consistencyChecks.length
    )
  );

  return { risk, flags, evidence };
}

/**
 * Combines all sub-check results into the final explainable fraud analysis.
 */
function computeFraudAnalysis({
  certificateChecks = [],
  experienceChecks = [],
  timelineCheck = {},
  githubCheck = {},
  consistencyChecks = [],
}) {
  const cert = scoreCertificates(certificateChecks);
  const exp = scoreExperience(experienceChecks);
  const timeline = scoreTimeline(timelineCheck);
  const github = scoreGithub(githubCheck);
  const consistency = scoreConsistency(consistencyChecks);

  const scoreBreakdown = {
    certificateVerification: cert.risk,
    experienceConsistency: exp.risk,
    timelineConsistency: timeline.risk,
    githubEvidence: github.risk,
    resumeProfileConsistency: consistency.risk,
  };

  const fraudRiskScore = Math.round(
    scoreBreakdown.certificateVerification * WEIGHTS.certificateVerification +
      scoreBreakdown.experienceConsistency * WEIGHTS.experienceConsistency +
      scoreBreakdown.timelineConsistency * WEIGHTS.timelineConsistency +
      scoreBreakdown.githubEvidence * WEIGHTS.githubEvidence +
      scoreBreakdown.resumeProfileConsistency * WEIGHTS.resumeProfileConsistency
  );

  const riskLevel = riskLevelFromScore(fraudRiskScore);

  const flags = [...cert.flags, ...exp.flags, ...timeline.flags, ...github.flags, ...consistency.flags];
  const evidence = [...cert.evidence, ...exp.evidence, ...timeline.evidence, ...github.evidence, ...consistency.evidence].filter(Boolean);

  // Verification status is derived, never automatically "Fake"
  let verificationStatus = 'Passed';
  const anyContradiction =
    certificateChecks.some((c) => c.status === 'Contradiction Found') ||
    githubCheck.status === 'Contradiction Found';
  const anyUnableToVerify = certificateChecks.some((c) => c.status === 'Unable to Verify') || githubCheck.status === 'Unable to Verify';

  if (anyContradiction) verificationStatus = 'Contradiction Found';
  else if (riskLevel === 'Suspicious' || riskLevel === 'High Risk') verificationStatus = 'Suspicious';
  else if (flags.length > 0) verificationStatus = 'Needs Review';
  else if (anyUnableToVerify) verificationStatus = 'Unable to Verify';
  else if (flags.length === 0 && fraudRiskScore <= 20) verificationStatus = 'Verified';

  const recommendations = [];
  if (riskLevel === 'High Risk') {
    recommendations.push('Recruiter review strongly recommended before proceeding with this candidate.');
  } else if (riskLevel === 'Suspicious') {
    recommendations.push('Recruiter review required — multiple flags detected.');
  } else if (riskLevel === 'Needs Review') {
    recommendations.push('Light recruiter review suggested — minor inconsistencies found.');
  } else {
    recommendations.push('No significant issues detected. Standard review process can continue.');
  }
  if (timelineCheck.hasOverlap) {
    recommendations.push('Ask the candidate to clarify overlapping employment periods (e.g. freelance/contract work).');
  }
  if (anyUnableToVerify) {
    recommendations.push('Some items could not be verified automatically due to lack of an available verification source — this is not evidence of fraud and may require manual confirmation.');
  }

  return {
    fraudRiskScore,
    riskLevel,
    verificationStatus,
    scoreBreakdown,
    flags: [...new Set(flags)],
    evidence: [...new Set(evidence)],
    recommendations,
  };
}

module.exports = { computeFraudAnalysis, riskLevelFromScore, WEIGHTS };
