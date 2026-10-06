// ai/consistencyChecker.js
// Cross-checks candidate data across resume, profile, education,
// experience, skills, projects, certificates, and GitHub for
// contradictions, producing a clear, evidence-backed explanation for
// every issue found.

/**
 * @param {object} input
 * @param {object} input.user                { fullName }
 * @param {object} input.profile             CandidateProfile document (plain object)
 * @param {object} input.githubCheck         result of verifyGithubProfile
 * @param {Array}  input.certificateResults  array of { extracted, status }
 * @returns {Array<{field, issue, evidence, severity}>}
 */
function checkConsistency({ user, profile, githubCheck, certificateResults = [] }) {
  const issues = [];
  const parsedResume = profile.parsedResume || {};
  const resumeText = (parsedResume.rawText || '').toLowerCase();

  // 1. Name consistency: resume-extracted email/phone vs profile, and
  //    certificate name vs profile name.
  certificateResults.forEach((cert) => {
    const certName = (cert.extracted?.candidateName || '').trim();
    if (certName && user.fullName && certName.toLowerCase() !== user.fullName.toLowerCase()) {
      issues.push({
        field: 'certificate.candidateName',
        issue: 'Certificate name does not match the candidate profile name.',
        evidence: `Certificate shows "${certName}", profile shows "${user.fullName}".`,
        severity: 'high',
      });
    }
  });

  // 2. Education dates vs earliest experience start date
  const educationEndYears = (profile.education || [])
    .map((e) => e.endYear)
    .filter((y) => typeof y === 'number');
  const experienceStarts = (profile.experience || [])
    .map((e) => (e.startDate ? new Date(e.startDate).getFullYear() : null))
    .filter(Boolean);

  if (educationEndYears.length && experienceStarts.length) {
    const latestEducationEnd = Math.max(...educationEndYears);
    const earliestExperienceStart = Math.min(...experienceStarts);
    // Allow a 1-year grace period for internships taken during studies
    if (earliestExperienceStart < latestEducationEnd - 1) {
      issues.push({
        field: 'education.experience.timeline',
        issue: 'Experience start date is inconsistent with education completion date.',
        evidence: `Earliest listed experience begins in ${earliestExperienceStart}, but education records end in ${latestEducationEnd}.`,
        severity: 'medium',
      });
    }
  }

  // 3. Skills claimed but with no supporting experience/project/GitHub evidence
  const skills = profile.skills || [];
  const supportingSkillMentions = new Set();

  (githubCheck?.supportingEvidence || []).forEach((line) => {
    const match = line.match(/"([^"]+)"/);
    if (match) supportingSkillMentions.add(match[1].toLowerCase());
  });

  const experienceBlob = (profile.experience || [])
    .map((e) => `${e.title || ''} ${e.description || ''}`)
    .join(' ')
    .toLowerCase();

  const unsupportedSkills = skills.filter((skill) => {
    const s = skill.toLowerCase();
    const mentionedInExperience = experienceBlob.includes(s);
    const mentionedInResume = resumeText.includes(s);
    const supportedByGithub = supportingSkillMentions.has(s);
    return !mentionedInExperience && !mentionedInResume && !supportedByGithub;
  });

  if (unsupportedSkills.length > 0) {
    issues.push({
      field: 'skills',
      issue: 'Some listed skills have no supporting experience, project, or GitHub evidence.',
      evidence: `Unsupported skill(s): ${unsupportedSkills.slice(0, 8).join(', ')}.`,
      severity: 'low',
    });
  }

  // 4. Duplicate experience entries (same company + overlapping title within a few days)
  const experience = profile.experience || [];
  for (let i = 0; i < experience.length; i += 1) {
    for (let j = i + 1; j < experience.length; j += 1) {
      const a = experience[i];
      const b = experience[j];
      if (
        a.company &&
        b.company &&
        a.company.toLowerCase() === b.company.toLowerCase() &&
        a.title &&
        b.title &&
        a.title.toLowerCase() === b.title.toLowerCase()
      ) {
        issues.push({
          field: 'experience',
          issue: 'Duplicate or conflicting experience entries detected.',
          evidence: `Two entries for the same title ("${a.title}") at the same company ("${a.company}") were found.`,
          severity: 'low',
        });
      }
    }
  }

  // 5. Certificate issuing organization inconsistent with resume claims (e.g. resume
  //    claims a cert from Org A but the uploaded certificate is from Org B with the
  //    same title)
  certificateResults.forEach((cert) => {
    const title = (cert.extracted?.certificateTitle || '').toLowerCase();
    const org = (cert.extracted?.issuingOrganization || '').toLowerCase();
    if (title && org && resumeText.includes(title) && !resumeText.includes(org)) {
      issues.push({
        field: 'certificate.issuingOrganization',
        issue: 'Certificate information is inconsistent with resume/profile claims.',
        evidence: `Resume references "${cert.extracted.certificateTitle}" but does not mention issuer "${cert.extracted.issuingOrganization}" found on the uploaded certificate.`,
        severity: 'low',
      });
    }
  });

  return issues;
}

module.exports = { checkConsistency };
