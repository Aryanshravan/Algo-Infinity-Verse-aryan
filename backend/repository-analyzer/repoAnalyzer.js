/**
 * Repository Analyzer — Orchestrator
 *
 * Coordinates all analysis checks for a repository:
 *   1. CI/CD pipeline analysis
 *   2. Code quality (linting, formatting, TypeScript)
 *   3. Security (SAST, dependency scanning, security docs)
 *   4. Documentation coverage (README, CONTRIBUTING, LICENSE, etc.)
 *
 * Computes a comprehensive Health Score as a weighted average.
 */

import { analyzeWorkflow } from './cicdValidator.js';
import { analyzeCodeQuality } from './codeQualityChecker.js';
import { analyzeSecurity } from './securityChecker.js';
import { analyzeDocs } from './docsChecker.js';

// ── Weight configuration ────────────────────────────────────────────────────
// These weights determine how much each category contributes to overall health.
// Weights must sum to 100.
const WEIGHTS = {
  CI_CD: 35,
  CODE_QUALITY: 25,
  SECURITY: 20,
  DOCUMENTATION: 20,
};

/**
 * Run all analysis checks for a repository given its VCS provider instance.
 *
 * @param {import('../vcs/VCSProvider.js').VCSProvider} provider - An instantiated VCS provider.
 * @returns {Promise<{
 *   overallScore: number,
 *   ciCd: { score: number, hasDependencies: boolean, hasTests: boolean, details: string[] },
 *   codeQuality: { score: number, hasLinter: boolean, hasFormatter: boolean, hasTypeScript: boolean, hasPreCommitHooks: boolean, details: string[] },
 *   security: { score: number, hasSast: boolean, hasDependencyScan: boolean, hasSecurityDocs: boolean, details: string[] },
 *   documentation: { score: number, hasReadme: boolean, hasContributing: boolean, hasLicense: boolean, hasCodeOfConduct: boolean, hasChangelog: boolean, hasDocsDir: boolean, details: string[] },
 *   recommendations: string[]
 * }>}
 */
export async function analyzeRepository(provider) {
  const recommendations = [];
  const warnings = [];

  // ── 1. Fetch CI/CD workflows (existing) ──────────────────────────────────
  let workflows = [];
  try {
    workflows = await provider.getNormalizedWorkflows();
  } catch (err) {
    console.error('[RepoAnalyzer] Failed to fetch CI/CD workflows:', err.message);
    warnings.push(`Could not fetch CI/CD workflows: ${err.message}`);
  }

  let bestScore = -1;
  let overallDeps = false;
  let overallTests = false;

  for (const wf of workflows) {
    const result = analyzeWorkflow(wf.commands);
    if (result.score > bestScore) bestScore = result.score;
    if (result.hasDependencies) overallDeps = true;
    if (result.hasTests) overallTests = true;
  }

  const ciCdScore = bestScore > 0 ? bestScore : 0;

  const ciCd = {
    score: ciCdScore,
    hasDependencies: overallDeps,
    hasTests: overallTests,
  };
  // Build CI/CD details
  const ciCdDetails = [];
  if (workflows.length > 0) {
    ciCdDetails.push(`Found ${workflows.length} CI/CD workflow(s)`);
    if (overallDeps) ciCdDetails.push('Dependencies are installed in CI');
    if (overallTests) ciCdDetails.push('Automated tests are run in CI');
    if (!overallDeps) ciCdDetails.push('No dependency installation detected');
    if (!overallTests) ciCdDetails.push('No test execution detected');
  } else {
    ciCdDetails.push('No CI/CD configuration found');
  }
  ciCd.details = ciCdDetails;

  // ── CI/CD recommendations ──────────────────────────────────────────────────
  if (ciCdScore === 0) {
    recommendations.push(
      'Set up a CI/CD pipeline (e.g., GitHub Actions, GitLab CI) to automate testing and deployment.'
    );
  } else if (ciCdScore === 20) {
    recommendations.push('CI/CD workflows exist but contain no functional jobs or steps.');
  } else if (ciCdScore === 50) {
    recommendations.push("Add explicit testing commands (e.g., 'npm test') to your CI/CD workflow.");
  } else if (!overallTests) {
    recommendations.push('Ensure tests are run in your CI/CD pipeline.');
  }

  // ── 2. Fetch repository file listing for other checks ─────────────────────
  let filePaths = [];
  try {
    filePaths = await provider.getRepoFilePaths({ includeContent: false });
  } catch (err) {
    console.error('[RepoAnalyzer] Failed to fetch file listing:', err.message);
    warnings.push(`Could not fetch repository file listing: ${err.message}`);
  }

  // ── 3. Collect all CI commands for cross-checking ─────────────────────────
  const allCiCommands = [];
  for (const wf of workflows) {
    if (Array.isArray(wf.commands)) {
      for (const cmd of wf.commands) {
        if (cmd !== 'HAS_JOBS') allCiCommands.push(cmd);
      }
    }
  }

  // ── 4. Code Quality Analysis ──────────────────────────────────────────────
  const codeQuality = analyzeCodeQuality(filePaths);

  if (codeQuality.score < 100) {
    const missingQuality = [];
    if (!codeQuality.hasLinter) missingQuality.push('linter configuration');
    if (!codeQuality.hasFormatter) missingQuality.push('formatter configuration');
    if (!codeQuality.hasPreCommitHooks) missingQuality.push('pre-commit hooks');
    if (missingQuality.length > 0) {
      recommendations.push(
        `Improve code quality by adding: ${missingQuality.join(', ')}.`
      );
    }
  }

  // ── 5. Security Analysis ──────────────────────────────────────────────────
  const security = analyzeSecurity(filePaths, allCiCommands);

  if (security.score < 100) {
    const missingSecurity = [];
    if (!security.hasSast) missingSecurity.push('SAST/static analysis scanning');
    if (!security.hasDependencyScan) missingSecurity.push('dependency vulnerability scanning');
    if (!security.hasSecurityDocs) missingSecurity.push('SECURITY.md documentation');
    if (missingSecurity.length > 0) {
      recommendations.push(
        `Enhance security posture by adding: ${missingSecurity.join(', ')}.`
      );
    }
  }

  // ── 6. Documentation Analysis ─────────────────────────────────────────────
  const documentation = analyzeDocs(filePaths);

  if (documentation.score < 100) {
    const missingDocs = [];
    if (!documentation.hasReadme) missingDocs.push('README');
    if (!documentation.hasContributing) missingDocs.push('CONTRIBUTING guide');
    if (!documentation.hasLicense) missingDocs.push('LICENSE file');
    if (!documentation.hasCodeOfConduct) missingDocs.push('CODE_OF_CONDUCT');
    if (!documentation.hasChangelog) missingDocs.push('CHANGELOG');
    if (missingDocs.length > 0) {
      recommendations.push(
        `Improve documentation coverage by adding: ${missingDocs.join(', ')}.`
      );
    }
  }

  // ── 7. Compute overall health score (weighted) ────────────────────────────
  // Each category contributes its own score (0–100) multiplied by its weight.
  // Normalize the weighted sum by dividing by total weight.
  const totalWeight = WEIGHTS.CI_CD + WEIGHTS.CODE_QUALITY + WEIGHTS.SECURITY + WEIGHTS.DOCUMENTATION;

  const overallScore = Math.round(
    (ciCd.score * WEIGHTS.CI_CD +
      codeQuality.score * WEIGHTS.CODE_QUALITY +
      security.score * WEIGHTS.SECURITY +
      documentation.score * WEIGHTS.DOCUMENTATION) /
      totalWeight
  );

  if (overallScore >= 90) {
    recommendations.push(
      'Excellent! Your repository demonstrates strong health across all dimensions.'
    );
  } else if (overallScore >= 70) {
    recommendations.push(
      'Good foundation! Review the suggestions above to further improve your repository health.'
    );
  }

  // ── 8. Check for API rate-limit issues and add actionable guidance ───────
  for (const w of warnings) {
    if (/403|429|rate\s*limit|too many requests/i.test(w)) {
      recommendations.push(
        'GitHub API rate limit may have been reached. ' +
        'Configure a GITHUB_TOKEN environment variable on the server ' +
        'to increase the limit from 60 to 5,000 requests per hour.'
      );
      break; // Only add this recommendation once
    }
  }

  return { overallScore, ciCd, codeQuality, security, documentation, recommendations, warnings };
}
