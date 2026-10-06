// services/rankingService.js
// Bridges the pure `ai/aiRanking.js` scoring functions with the database:
// fetches the job + candidate profile, computes the score, and persists
// it onto the Application document.

const Job = require('../models/Job');
const CandidateProfile = require('../models/CandidateProfile');
const Application = require('../models/Application');
const { calculateAIScore } = require('../ai/aiRanking');

/**
 * Computes and stores the AI score for a single application.
 * @param {string} applicationId
 * @returns {Promise<Object>} the updated application
 */
async function scoreApplication(applicationId) {
  const application = await Application.findById(applicationId);
  if (!application) throw new Error('Application not found');

  const job = await Job.findById(application.jobId);
  const candidateProfile = await CandidateProfile.findOne({
    userId: application.candidateId,
  });

  if (!job || !candidateProfile) {
    throw new Error('Related job or candidate profile not found');
  }

  const { totalScore, breakdown } = calculateAIScore(
    {
      requiredSkills: job.requiredSkills,
      experience: job.experience,
      description: job.description,
    },
    {
      skills: candidateProfile.skills,
      yearsOfExperience: candidateProfile.parsedResume?.yearsOfExperience || 0,
      education: [
        ...candidateProfile.education.map((e) => e.degree || ''),
        ...(candidateProfile.parsedResume?.extractedEducation || []),
      ],
      certifications: candidateProfile.parsedResume?.certifications || [],
      resumeRawText: candidateProfile.parsedResume?.rawText || '',
    }
  );

  application.AI_score = totalScore;
  application.scoreBreakdown = breakdown;
  await application.save();

  // Keep the candidate profile's overall AI_score roughly in sync too
  candidateProfile.AI_score = totalScore;
  await candidateProfile.save();

  return application;
}

/**
 * Ranks (scores + sorts) all applications for a given job.
 * @param {string} jobId
 * @returns {Promise<Array>} applications sorted by AI_score descending
 */
async function rankApplicationsForJob(jobId) {
  const applications = await Application.find({ jobId });

  for (const app of applications) {
    await scoreApplication(app._id);
  }

  return Application.find({ jobId })
    .sort({ AI_score: -1 })
    .populate('candidateId', 'fullName email phone profileImage')
    .populate('jobId', 'title company');
}

module.exports = { scoreApplication, rankApplicationsForJob };
