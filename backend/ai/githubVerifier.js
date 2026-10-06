// ai/githubVerifier.js
// Verifies a candidate-supplied GitHub profile URL using GitHub's public
// REST API (no auth required for basic public data, though an optional
// GITHUB_TOKEN raises the rate limit — see .env.example).
//
// Lack of GitHub activity is NEVER treated as proof of fraud: private
// repositories and non-GitHub professional work are real and common.

const STATUS = {
  VERIFIED: 'Verified',
  PASSED: 'Passed',
  NEEDS_REVIEW: 'Needs Review',
  UNABLE_TO_VERIFY: 'Unable to Verify',
  CONTRADICTION_FOUND: 'Contradiction Found',
};

const GITHUB_API = 'https://api.github.com';

function extractUsername(profileUrl) {
  if (!profileUrl) return null;
  const match = profileUrl.trim().match(/github\.com\/([A-Za-z0-9\-]+)\/?$/i);
  return match ? match[1] : null;
}

function authHeaders() {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'IRM-Fraud-Detection-Module' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return headers;
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { headers: authHeaders(), signal: controller.signal });
    if (res.status === 404) return { notFound: true };
    if (!res.ok) return { error: `GitHub API responded with status ${res.status}` };
    return { data: await res.json() };
  } catch (err) {
    return { error: 'Could not reach GitHub API (network error or rate limit)' };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fetches the candidate's languages across their public, non-fork repos.
 */
async function fetchTopLanguages(username, repos = []) {
  const languageCounts = {};
  // Only sample a handful of repos to stay within rate limits.
  const sample = repos.filter((r) => !r.fork).slice(0, 8);
  for (const repo of sample) {
    if (repo.language) {
      languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
    }
  }
  return Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([lang]) => lang)
    .slice(0, 6);
}

/**
 * Cross-checks resume/profile claims against observed GitHub evidence.
 * Produces human-readable supporting/requires-review notes rather than a
 * pass/fail verdict, since absence of evidence isn't evidence of absence.
 */
function compareClaimsToEvidence(skills = [], topLanguages = [], repos = []) {
  const supportingEvidence = [];
  const claimsRequiringReview = [];

  const langsLower = topLanguages.map((l) => l.toLowerCase());
  const repoTextBlob = repos.map((r) => `${r.name} ${r.description || ''}`).join(' ').toLowerCase();

  skills.forEach((skill) => {
    const skillLower = skill.toLowerCase();
    const isLanguageLike = langsLower.some((l) => l.includes(skillLower) || skillLower.includes(l));
    const mentionedInRepos = repoTextBlob.includes(skillLower);

    if (isLanguageLike || mentionedInRepos) {
      supportingEvidence.push(`Supporting evidence found for "${skill}" in public GitHub activity.`);
    }
  });

  if (supportingEvidence.length === 0 && skills.length > 0) {
    claimsRequiringReview.push(
      'No direct public GitHub evidence was found for the skills listed on the resume. This does not necessarily indicate fraud — private repositories or non-GitHub work may account for this experience.'
    );
  }

  return { supportingEvidence, claimsRequiringReview };
}

/**
 * Full pipeline: profile URL -> GitHub API lookups -> comparison with resume skills.
 */
async function verifyGithubProfile(profileUrl, resumeSkills = []) {
  const username = extractUsername(profileUrl);

  if (!username) {
    return {
      profileUrl: profileUrl || '',
      username: '',
      exists: false,
      status: STATUS.UNABLE_TO_VERIFY,
      supportingEvidence: [],
      claimsRequiringReview: ['The provided URL is not a valid GitHub profile URL.'],
      checkedAt: new Date(),
    };
  }

  const userResult = await fetchJson(`${GITHUB_API}/users/${username}`);

  if (userResult.notFound) {
    return {
      profileUrl,
      username,
      exists: false,
      status: STATUS.CONTRADICTION_FOUND,
      supportingEvidence: [],
      claimsRequiringReview: [`No GitHub account exists for username "${username}".`],
      checkedAt: new Date(),
    };
  }

  if (userResult.error || !userResult.data) {
    return {
      profileUrl,
      username,
      exists: null,
      status: STATUS.UNABLE_TO_VERIFY,
      supportingEvidence: [],
      claimsRequiringReview: [userResult.error || 'GitHub verification could not be completed.'],
      checkedAt: new Date(),
    };
  }

  const user = userResult.data;
  const reposResult = await fetchJson(`${GITHUB_API}/users/${username}/repos?per_page=30&sort=updated`);
  const repos = Array.isArray(reposResult.data) ? reposResult.data : [];

  const topLanguages = await fetchTopLanguages(username, repos);
  const { supportingEvidence, claimsRequiringReview } = compareClaimsToEvidence(resumeSkills, topLanguages, repos);

  const recentActivity = repos.some((r) => {
    const updated = new Date(r.updated_at || r.pushed_at || 0);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return updated > sixMonthsAgo;
  });

  let status = STATUS.VERIFIED;
  if (repos.length === 0) {
    status = STATUS.NEEDS_REVIEW;
    claimsRequiringReview.push('GitHub account exists but has no public repositories. Private work is common and not evidence of fraud.');
  } else if (claimsRequiringReview.length > 0) {
    status = STATUS.NEEDS_REVIEW;
  }

  return {
    profileUrl,
    username,
    exists: true,
    profileName: user.name || '',
    publicRepos: user.public_repos || 0,
    followers: user.followers || 0,
    accountCreatedAt: user.created_at ? new Date(user.created_at) : undefined,
    topLanguages,
    recentActivity,
    supportingEvidence,
    claimsRequiringReview,
    status,
    checkedAt: new Date(),
  };
}

module.exports = { STATUS, extractUsername, verifyGithubProfile };
