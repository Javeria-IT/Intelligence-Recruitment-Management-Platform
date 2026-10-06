// ai/timelineAnalyzer.js
// Analyzes a candidate's work experience entries for date overlaps.
// Overlapping employment is flagged for recruiter review but is never
// automatically treated as fraud, since it can be legitimate (part-time,
// freelance, internship, contract, or multiple jobs).

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30.44;

const POSSIBLE_REASONS = [
  'Part-time work',
  'Freelance work',
  'Internship',
  'Contract work',
  'Multiple jobs',
];

/**
 * Normalizes an experience entry's end date. "isCurrent" entries end today.
 */
function resolveEndDate(entry) {
  if (entry.isCurrent) return new Date();
  return entry.endDate ? new Date(entry.endDate) : null;
}

/**
 * Builds a per-entry check (duration, sanity flags) without judging overlaps.
 */
function buildExperienceChecks(experience = []) {
  return experience
    .filter((e) => e.startDate)
    .map((e) => {
      const start = new Date(e.startDate);
      const end = resolveEndDate(e);
      const flags = [];

      if (end && end < start) {
        flags.push('End date is before start date');
      }
      if (start > new Date()) {
        flags.push('Start date is in the future');
      }

      const durationMonths = end
        ? Math.max(0, Math.round((end - start) / MS_PER_MONTH))
        : null;

      return {
        title: e.title || '',
        company: e.company || '',
        startDate: start,
        endDate: end,
        durationMonths: durationMonths || 0,
        flags,
        status: flags.length ? 'Needs Review' : 'Passed',
      };
    });
}

/**
 * Detects overlapping employment periods across all experience entries.
 * Returns { hasOverlap, overlaps, overlappingJobsCount, status, note }.
 */
function analyzeTimeline(experience = []) {
  const entries = experience
    .filter((e) => e.startDate)
    .map((e) => ({
      title: e.title || '',
      company: e.company || 'Unknown Company',
      start: new Date(e.startDate),
      end: resolveEndDate(e),
    }))
    .filter((e) => e.end && !Number.isNaN(e.start.getTime()) && !Number.isNaN(e.end.getTime()));

  const overlaps = [];
  const overlappingCompanies = new Set();

  for (let i = 0; i < entries.length; i += 1) {
    for (let j = i + 1; j < entries.length; j += 1) {
      const a = entries[i];
      const b = entries[j];

      const overlapStart = a.start > b.start ? a.start : b.start;
      const overlapEnd = a.end < b.end ? a.end : b.end;

      if (overlapStart < overlapEnd) {
        const overlapMonths = Math.round((overlapEnd - overlapStart) / MS_PER_MONTH);
        // Ignore trivial (<1 month) overlaps — likely rounding/transition noise
        if (overlapMonths >= 1) {
          overlaps.push({
            companyA: a.company,
            companyB: b.company,
            overlapStartDate: overlapStart,
            overlapEndDate: overlapEnd,
            overlapMonths,
            possibleReasons: POSSIBLE_REASONS,
          });
          overlappingCompanies.add(a.company);
          overlappingCompanies.add(b.company);
        }
      }
    }
  }

  return {
    hasOverlap: overlaps.length > 0,
    overlaps,
    overlappingJobsCount: overlappingCompanies.size,
    status: overlaps.length > 0 ? 'Needs Review' : 'Passed',
    note: overlaps.length > 0
      ? 'Experience Timeline Conflict detected. Overlapping employment can be legitimate (part-time, freelance, internship, contract, or multiple jobs) — manual recruiter review is recommended.'
      : 'No overlapping employment periods detected.',
  };
}

module.exports = { analyzeTimeline, buildExperienceChecks, POSSIBLE_REASONS };
