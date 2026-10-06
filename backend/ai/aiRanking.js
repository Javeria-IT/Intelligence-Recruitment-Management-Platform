// ai/aiRanking.js
// Computes an AI match score (0-100) for a candidate against a job posting.
//
// Weighting (as specified):
//   Skill Match            = 40%
//   Experience Match       = 25%
//   Education Match        = 15%
//   Certifications         = 10%
//   Keyword Similarity     = 10%

const WEIGHTS = {
  skillMatch: 0.4,
  experienceMatch: 0.25,
  educationMatch: 0.15,
  certificationMatch: 0.1,
  keywordSimilarity: 0.1,
};

const normalize = (str = '') => str.toString().trim().toLowerCase();

/**
 * Skill Match (40%)
 * Percentage of the job's required skills that the candidate possesses.
 */
function calculateSkillMatch(requiredSkills = [], candidateSkills = []) {
  if (!requiredSkills.length) return 100; // nothing required -> full marks
  const normalizedCandidateSkills = candidateSkills.map(normalize);
  const matched = requiredSkills.filter((skill) =>
    normalizedCandidateSkills.includes(normalize(skill))
  );
  return Math.round((matched.length / requiredSkills.length) * 100);
}

/**
 * Experience Match (25%)
 * Compares candidate's years of experience against the job's requirement.
 * jobExperience is a free-form string like "2-4 years"; we parse the
 * minimum number of years required.
 */
function calculateExperienceMatch(jobExperienceStr = '', candidateYears = 0) {
  const match = jobExperienceStr.match(/(\d+)/);
  const requiredYears = match ? parseInt(match[1], 10) : 0;

  if (requiredYears === 0) return 100; // no explicit requirement
  if (!candidateYears) return 20; // some baseline credit even if unknown

  if (candidateYears >= requiredYears) return 100;
  // Partial credit proportional to how close they are to the requirement
  const ratio = candidateYears / requiredYears;
  return Math.round(Math.min(ratio, 1) * 100);
}

/**
 * Education Match (15%)
 * Simple heuristic: full marks if candidate has any recognized degree,
 * partial credit otherwise.
 */
function calculateEducationMatch(candidateEducation = []) {
  if (!candidateEducation.length) return 0;

  const higherDegreeKeywords = ['master', 'm.sc', 'msc', 'm.tech', 'mtech', 'mba', 'phd'];
  const hasHigherDegree = candidateEducation.some((edu) =>
    higherDegreeKeywords.some((kw) => normalize(edu).includes(kw))
  );

  return hasHigherDegree ? 100 : 75; // has some degree, but not advanced
}

/**
 * Certifications (10%)
 * Awards points based on number of relevant certifications found.
 */
function calculateCertificationMatch(certifications = []) {
  if (!certifications.length) return 0;
  return Math.min(100, certifications.length * 50); // 2+ certs = full marks
}

/**
 * Keyword Similarity (10%)
 * Basic bag-of-words overlap between job description and resume raw text.
 */
function calculateKeywordSimilarity(jobDescription = '', resumeRawText = '') {
  const tokenize = (text) =>
    normalize(text)
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 3); // ignore very short/common words

  const jobTokens = new Set(tokenize(jobDescription));
  const resumeTokens = new Set(tokenize(resumeRawText));

  if (jobTokens.size === 0) return 100;

  let overlap = 0;
  jobTokens.forEach((token) => {
    if (resumeTokens.has(token)) overlap += 1;
  });

  return Math.round((overlap / jobTokens.size) * 100);
}

/**
 * Master function: combines all sub-scores using the specified weights
 * and returns both the total score and the breakdown for transparency.
 *
 * @param {Object} job - { requiredSkills, experience, description }
 * @param {Object} candidate - {
 *   skills, yearsOfExperience, education, certifications, resumeRawText
 * }
 */
function calculateAIScore(job, candidate) {
  const skillMatch = calculateSkillMatch(job.requiredSkills, candidate.skills);
  const experienceMatch = calculateExperienceMatch(
    job.experience,
    candidate.yearsOfExperience
  );
  const educationMatch = calculateEducationMatch(candidate.education);
  const certificationMatch = calculateCertificationMatch(candidate.certifications);
  const keywordSimilarity = calculateKeywordSimilarity(
    job.description,
    candidate.resumeRawText
  );

  const totalScore =
    skillMatch * WEIGHTS.skillMatch +
    experienceMatch * WEIGHTS.experienceMatch +
    educationMatch * WEIGHTS.educationMatch +
    certificationMatch * WEIGHTS.certificationMatch +
    keywordSimilarity * WEIGHTS.keywordSimilarity;

  return {
    totalScore: Math.round(totalScore),
    breakdown: {
      skillMatch,
      experienceMatch,
      educationMatch,
      certificationMatch,
      keywordSimilarity,
    },
  };
}

module.exports = {
  calculateAIScore,
  calculateSkillMatch,
  calculateExperienceMatch,
  calculateEducationMatch,
  calculateCertificationMatch,
  calculateKeywordSimilarity,
  WEIGHTS,
};
