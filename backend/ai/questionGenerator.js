// ai/questionGenerator.js
// Generates interview questions based on a job's required skills.
// This is template-driven so it works offline; it can later be swapped
// for a call to an LLM for more dynamic/contextual questions.

const QUESTION_TEMPLATES = [
  (skill) => `Can you explain your practical experience working with ${skill}?`,
  (skill) => `Describe a challenging problem you solved using ${skill}.`,
  (skill) => `What are the best practices you follow when working with ${skill}?`,
  (skill) => `How would you explain ${skill} to a junior developer?`,
  (skill) => `What are some common pitfalls when using ${skill}, and how do you avoid them?`,
];

const GENERAL_QUESTIONS = [
  'Tell us about a project you are most proud of and your role in it.',
  'How do you approach debugging a production issue under time pressure?',
  'Describe a time you disagreed with a teammate on a technical decision. How did you resolve it?',
];

/**
 * Generates a list of AI interview questions for the given skills.
 * @param {string[]} requiredSkills - job's required skills
 * @param {number} countPerSkill - how many questions to generate per skill (default 1)
 */
function generateQuestionsFromSkills(requiredSkills = [], countPerSkill = 1) {
  const questions = [];

  requiredSkills.forEach((skill) => {
    for (let i = 0; i < countPerSkill; i++) {
      const template = QUESTION_TEMPLATES[
        (i + skill.length) % QUESTION_TEMPLATES.length
      ];
      questions.push({
        question: template(skill),
        skillTag: skill,
        candidateAnswer: '',
        answerScore: null,
      });
    }
  });

  // Add a couple of general behavioral questions for well-rounded coverage
  GENERAL_QUESTIONS.slice(0, 2).forEach((q) => {
    questions.push({
      question: q,
      skillTag: 'general',
      candidateAnswer: '',
      answerScore: null,
    });
  });

  return questions;
}

module.exports = { generateQuestionsFromSkills };
