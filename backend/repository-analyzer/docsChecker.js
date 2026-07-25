/**
 * Documentation Coverage Checker
 *
 * Analyzes a repository's documentation coverage by detecting:
 *   - README.md / README.rst
 *   - CONTRIBUTING.md
 *   - LICENSE file
 *   - CODE_OF_CONDUCT.md
 *   - CHANGELOG.md / CHANGELOG
 *   - Documentation directory (docs/, wiki/)
 *
 * Returns a documentation score and detailed breakdown.
 */

import { matchesAny } from './utils.js';

// ── Essential documentation files ───────────────────────────────────────────
const README_PATTERNS = [/^README\.md$/i, /^README\.rst$/i, /^README\.txt$/i, /^README$/i];
const CONTRIBUTING_PATTERNS = [/^CONTRIBUTING\.md$/i, /^CONTRIBUTING\.rst$/i, /^CONTRIBUTING$/i, /^CONTRIBUTING\.txt$/i];
const CONTRIBUTING_PATH_PATTERNS = [
  /^\.github\/CONTRIBUTING\.md$/i,
  /^\.github\/CONTRIBUTING\.rst$/i,
  /^\.github\/CONTRIBUTING\.txt$/i,
  /^\.github\/CONTRIBUTING$/i,
];
const LICENSE_PATTERNS = [/^LICENSE$/i, /^LICENSE\.md$/i, /^LICENSE\.txt$/i, /^LICENCE$/i, /^COPYING$/i, /^COPYING\.md$/i];
const CODE_OF_CONDUCT_PATTERNS = [/^CODE_OF_CONDUCT\.md$/i, /^CODE_OF_CONDUCT$/i];
const CODE_OF_CONDUCT_PATH_PATTERNS = [/^\.github\/CODE_OF_CONDUCT\.md$/i, /^\.github\/CODE_OF_CONDUCT$/i];
const CHANGELOG_PATTERNS = [/^CHANGELOG\.md$/i, /^CHANGELOG$/i, /^CHANGELOG\.txt$/i, /^HISTORY\.md$/i, /^HISTORY\.txt$/i];
const DOCS_DIR_PATTERNS = /^docs\//;

/**
 * Analyze documentation coverage given a list of file paths present in the repo.
 *
 * @param {string[]} filePaths – file paths (relative to repo root) to analyze.
 * @returns {{ score: number, hasReadme: boolean, hasContributing: boolean, hasLicense: boolean, hasCodeOfConduct: boolean, hasChangelog: boolean, hasDocsDir: boolean, details: string[] }}
 */
export function analyzeDocs(filePaths) {
  try {
    if (!Array.isArray(filePaths) || filePaths.length === 0) {
      return {
        score: 0,
        hasReadme: false,
        hasContributing: false,
        hasLicense: false,
        hasCodeOfConduct: false,
        hasChangelog: false,
        hasDocsDir: false,
        details: ['No files found to analyze.'],
      };
    }

    const details = [];
    let hasReadme = false;
    let hasContributing = false;
    let hasLicense = false;
    let hasCodeOfConduct = false;
    let hasChangelog = false;
    let hasDocsDir = false;

    for (const fp of filePaths) {
      const segments = fp.split('/');
      const baseName = segments[segments.length - 1];

      if (!hasReadme && matchesAny(baseName, README_PATTERNS)) {
        hasReadme = true;
        details.push(`README detected: ${fp}`);
      }
      if (!hasContributing && (matchesAny(baseName, CONTRIBUTING_PATTERNS) || matchesAny(fp, CONTRIBUTING_PATH_PATTERNS))) {
        hasContributing = true;
        details.push(`Contributing guide detected: ${fp}`);
      }
      if (!hasLicense && matchesAny(baseName, LICENSE_PATTERNS)) {
        hasLicense = true;
        details.push(`License file detected: ${fp}`);
      }
      if (!hasCodeOfConduct && (matchesAny(baseName, CODE_OF_CONDUCT_PATTERNS) || matchesAny(fp, CODE_OF_CONDUCT_PATH_PATTERNS))) {
        hasCodeOfConduct = true;
        details.push(`Code of Conduct detected: ${fp}`);
      }
      if (!hasChangelog && matchesAny(baseName, CHANGELOG_PATTERNS)) {
        hasChangelog = true;
        details.push(`Changelog detected: ${fp}`);
      }
      if (!hasDocsDir && DOCS_DIR_PATTERNS.test(fp)) {
        hasDocsDir = true;
        details.push(`Documentation directory detected: ${fp}`);
      }
    }

    // Score: 0–100 based on how many documentation items are present
    const docFlags = [hasReadme, hasContributing, hasLicense, hasCodeOfConduct, hasChangelog, hasDocsDir];
    const present = docFlags.filter(Boolean).length;
    // 6 categories, each worth ~16.67 points, normalized to 100
    const weightPerCategory = 100 / 6;
    const score = Math.round(present * weightPerCategory);

    if (details.length === 0) {
      details.push('No documentation files detected.');
    }

    return { score, hasReadme, hasContributing, hasLicense, hasCodeOfConduct, hasChangelog, hasDocsDir, details };
  } catch (err) {
    console.error('[DocsChecker] Error:', err.message);
    return {
      score: 0,
      hasReadme: false,
      hasContributing: false,
      hasLicense: false,
      hasCodeOfConduct: false,
      hasChangelog: false,
      hasDocsDir: false,
      details: [`Error analyzing documentation coverage: ${err.message}`],
    };
  }
}
