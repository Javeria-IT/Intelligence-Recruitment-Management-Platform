// ai/resumeParser.js
// Lightweight, dependency-friendly resume parsing "AI service".
//
// In production this could be swapped for a call to an LLM (e.g. Claude)
// or a dedicated NLP microservice. Here we implement a deterministic,
// rule/keyword based extractor so the platform works fully offline and
// the behavior is easy to test. The public interface (parseResumeFile)
// is what the rest of the app depends on, so the implementation can be
// upgraded later without touching controllers.

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// A reference skill dictionary used to detect skills mentioned in free text.
// Extend this list as needed for your domain.
const SKILL_KEYWORDS = [
  'javascript', 'typescript', 'node.js', 'nodejs', 'express', 'express.js',
  'react', 'react.js', 'redux', 'next.js', 'vue', 'angular',
  'mongodb', 'mongoose', 'mysql', 'postgresql', 'sql', 'nosql', 'redis',
  'python', 'django', 'flask', 'fastapi', 'java', 'spring boot', 'spring',
  'c++', 'c#', '.net', 'php', 'laravel', 'ruby', 'ruby on rails',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'ci/cd', 'jenkins',
  'git', 'github', 'gitlab', 'rest api', 'graphql', 'microservices',
  'html', 'css', 'tailwind', 'bootstrap', 'sass',
  'machine learning', 'deep learning', 'nlp', 'data science', 'pandas',
  'numpy', 'tensorflow', 'pytorch', 'scikit-learn',
  'agile', 'scrum', 'jira', 'figma', 'ui/ux',
  'jest', 'mocha', 'chai', 'cypress', 'selenium', 'testing',
];

const CERTIFICATION_KEYWORDS = [
  'aws certified', 'pmp', 'scrum master', 'csm', 'azure certified',
  'google certified', 'oracle certified', 'ccna', 'comptia',
  'certified', 'certification',
];

const EDUCATION_KEYWORDS = [
  'bachelor', 'b.sc', 'bsc', 'b.tech', 'btech', 'master', 'm.sc', 'msc',
  'm.tech', 'mtech', 'mba', 'phd', 'doctorate', 'associate degree',
  'high school diploma', 'university', 'college',
];

const EXPERIENCE_LINE_REGEX =
  /(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*experience/i;

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX = /(\+?\d{1,3}[\s.-]?)?(\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}/;

/**
 * Extracts raw text from a PDF or DOCX file on disk.
 * @param {string} filePath absolute path to the resume file
 * @returns {Promise<string>} extracted plain text
 */
async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf') {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text || '';
  }

  if (ext === '.docx' || ext === '.doc') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || '';
  }

  throw new Error('Unsupported file type for resume parsing');
}

/**
 * Finds all keywords from a reference list that appear in the given text.
 */
function findMatchingKeywords(text, keywordList) {
  const lowerText = text.toLowerCase();
  return keywordList.filter((keyword) => lowerText.includes(keyword));
}

/**
 * Extracts years of experience mentioned in the resume text, if any.
 */
function extractYearsOfExperience(text) {
  const match = text.match(EXPERIENCE_LINE_REGEX);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Extracts education-related lines/phrases from the resume text.
 */
function extractEducationLines(text) {
  const lines = text.split(/\n|\.\s/).map((l) => l.trim()).filter(Boolean);
  const matches = lines.filter((line) =>
    EDUCATION_KEYWORDS.some((kw) => line.toLowerCase().includes(kw))
  );
  // De-duplicate and cap the length for storage cleanliness
  return [...new Set(matches)].slice(0, 10);
}

/**
 * Extracts experience-related lines/phrases from the resume text.
 */
function extractExperienceLines(text) {
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const experienceHeaderIndex = lines.findIndex((l) =>
    /experience/i.test(l) && l.length < 40
  );

  let relevant = lines;
  if (experienceHeaderIndex !== -1) {
    relevant = lines.slice(experienceHeaderIndex + 1, experienceHeaderIndex + 15);
  }

  return relevant.filter((l) => l.length > 3).slice(0, 10);
}

/**
 * Main entry point: parses a resume file and returns structured data.
 * @param {string} filePath absolute path to the uploaded resume
 */
async function parseResumeFile(filePath) {
  const rawText = await extractText(filePath);

  const extractedSkills = findMatchingKeywords(rawText, SKILL_KEYWORDS);
  const certifications = findMatchingKeywords(rawText, CERTIFICATION_KEYWORDS);
  const extractedEducation = extractEducationLines(rawText);
  const extractedExperience = extractExperienceLines(rawText);
  const yearsOfExperience = extractYearsOfExperience(rawText);

  const emailMatch = rawText.match(EMAIL_REGEX);
  const phoneMatch = rawText.match(PHONE_REGEX);

  return {
    rawText: rawText.slice(0, 20000), // guard against extremely large storage
    extractedSkills,
    extractedEducation,
    extractedExperience,
    certifications,
    yearsOfExperience,
    email: emailMatch ? emailMatch[0] : '',
    phone: phoneMatch ? phoneMatch[0].trim() : '',
  };
}

module.exports = {
  parseResumeFile,
  extractText,
  SKILL_KEYWORDS,
};
