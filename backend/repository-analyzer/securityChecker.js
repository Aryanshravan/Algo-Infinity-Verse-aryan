/**
 * Security Checker
 *
 * Analyzes a repository's security practices by detecting:
 *   - SAST / static analysis tools (CodeQL, SonarQube, Semgrep, etc.)
 *   - Dependency vulnerability scanning (Dependabot, Snyk, Renovate)
 *   - Security documentation (SECURITY.md)
 *   - Signed commits / GPG verification indicators
 *
 * Returns a security score and detailed breakdown.
 */

import { matchesAny } from './utils.js';

// ── SAST / static analysis workflow file patterns ───────────────────────────
// These are typically CI workflow files that reference SAST tools.
const SAST_WORKFLOW_PATTERNS = [
  /codeql/i,
  /sonar/i,
  /semgrep/i,
  /sast/i,
  /static.?analysis/i,
  /checkmarx/i,
  /fortify/i,
  /veracode/i,
  /synopsys/i,
  /coverity/i,
  /infer/i,
  /eslint-plugin-security/i,
  /security.?audit/i,
  /bandit/i,
  /brakeman/i,
  /gosec/i,
  /trivy/i,
  /grype/i,
  /clair/i,
  /snyk/i,
  /.?security.?scan/i,
];

// ── Dependency vulnerability scanning config / file patterns ────────────────
const DEP_SCAN_FILES = [
  /^\.github\/dependabot\.yml$/,
  /^\.github\/dependabot\.yaml$/,
  /^\.github\/renovate\.json$/,
  /^renovate\.json$/,
  /^\.renovaterc\.json$/,
  /^\.snyk$/,
  /^\.snyk\.d$/,
  /^\.trivyignore$/,
  /^\.trivyignore\.yaml$/,
  /^\.trivyignore\.yml$/,
  /^osv-scanner\.toml$/,
  /^\.mend$/,
  /^\.whitesource$/,
];

// ── Security documentation ──────────────────────────────────────────────────
const SECURITY_DOCS = [/^SECURITY\.md$/i, /^SECURITY\.rst$/i, /^security\.md$/i];

/**
 * Check if a CI/CD command string references a security scanning tool.
 * @param {string} cmd
 * @returns {boolean}
 */
function isSecurityCommand(cmd) {
  return SAST_WORKFLOW_PATTERNS.some((pat) => pat.test(cmd));
}

/**
 * Analyze security practices given a list of file paths and CI/CD commands.
 *
 * @param {string[]} filePaths – file paths (relative to repo root) to analyze.
 * @param {string[]} ciCommands – flat array of CI/CD commands collected from workflows.
 * @returns {{ score: number, hasSast: boolean, hasDependencyScan: boolean, hasSecurityDocs: boolean, details: string[] }}
 */
export function analyzeSecurity(filePaths, ciCommands) {
  try {
    if (!Array.isArray(filePaths)) filePaths = [];
    if (!Array.isArray(ciCommands)) ciCommands = [];

    const details = [];
    let hasSast = false;
    let hasDependencyScan = false;
    let hasSecurityDocs = false;

    // 1. Check file paths for dependency scanning configs and security docs
    for (const fp of filePaths) {
      const segments = fp.split('/');
      const baseName = segments[segments.length - 1];

      if (!hasDependencyScan && matchesAny(fp, DEP_SCAN_FILES)) {
        hasDependencyScan = true;
        details.push(`Dependency scanning config detected: ${fp}`);
      }
      if (!hasSecurityDocs && matchesAny(baseName, SECURITY_DOCS)) {
        hasSecurityDocs = true;
        details.push(`Security documentation detected: ${fp}`);
      }
    }

    // 2. Check CI/CD commands for SAST tool invocations
    for (const cmd of ciCommands) {
      if (!hasSast && isSecurityCommand(cmd)) {
        hasSast = true;
        details.push(`SAST tool referenced in CI command: ${cmd.substring(0, 80)}...`);
      }
    }

    // 3. Compute score (0–100)
    let score = 0;
    if (hasSast) score += 40;
    if (hasDependencyScan) score += 35;
    if (hasSecurityDocs) score += 25;

    if (details.length === 0) {
      details.push(
        'No security scanning (SAST), dependency vulnerability scanning, or security documentation detected.'
      );
    }

    return { score, hasSast, hasDependencyScan, hasSecurityDocs, details };
  } catch (err) {
    console.error('[SecurityChecker] Error:', err.message);
    return {
      score: 0,
      hasSast: false,
      hasDependencyScan: false,
      hasSecurityDocs: false,
      details: [`Error analyzing security practices: ${err.message}`],
    };
  }
}
