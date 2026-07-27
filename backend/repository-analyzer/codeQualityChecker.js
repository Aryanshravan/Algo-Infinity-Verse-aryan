/**
 * Code Quality Checker
 *
 * Analyzes a repository's code quality practices by detecting:
 *   - Linter configuration (ESLint, TSLint, Stylelint)
 *   - Formatter configuration (Prettier, EditorConfig)
 *   - TypeScript configuration (tsconfig.json)
 *   - Husky / lint-staged (pre-commit hooks)
 *
 * Returns a quality score and detailed breakdown.
 */

import { matchesAny } from './utils.js';

// ── Linter configuration file patterns ──────────────────────────────────────
const LINTER_FILES = [
  /^\.eslintrc(?:\.(?:js|json|yaml|yml|cjs))?$/,
  /^\.eslintrc$/,
  /^eslint\.config\.(?:js|mjs|cjs|json)$/,
  /^\.tslint(?:\.(?:js|json|yaml|yml))?$/,
  /^\.stylelintrc(?:\.(?:js|json|yaml|yml))?$/,
  /^stylelint\.config\.(?:js|mjs|cjs)$/,
  /^\.jshintrc$/,
  /^\.jscsrc$/,
  /^biome\.json$/,
  /^\.markdownlint(?:\.(?:js|json|yaml|yml))?$/,
  /^\.rubocop\.yml$/,
  /^\.php_cs(?:\.dist)?$/,
  /^pylintrc$/,
  /^\.pylintrc$/,
  /^ruff\.toml$/,
  /^\.golangci\.(?:yml|yaml|toml)$/,
  /^clang-tidy/,
];

// ── Formatter configuration file patterns ───────────────────────────────────
const FORMATTER_FILES = [
  /^\.prettierrc(?:\.(?:js|json|yaml|yml|toml))?$/,
  /^\.prettierrc$/,
  /^prettier\.config\.(?:js|mjs|cjs|json)$/,
  /^\.editorconfig$/,
  /^\.rustfmt\.toml$/,
  /^goimports/,
  /^\.clang-format$/,
  /^\.ktlint/,
  /^swiftformat/,
];

// ── TypeScript indicator ────────────────────────────────────────────────────
const TS_CONFIG_FILES = [/^tsconfig\.json$/];

// ── Pre-commit / lint-staged ────────────────────────────────────────────────
const PRE_COMMIT_FILES = [/^\.husky/, /^\.lint-stagedrc/, /^lint-staged\.config\./];

/**
 * Analyze code quality practices given a list of file paths present in the repo.
 *
 * @param {string[]} filePaths – file paths (relative to repo root) to analyze.
 * @returns {{ score: number, hasLinter: boolean, hasFormatter: boolean, hasTypeScript: boolean, hasPreCommitHooks: boolean, details: string[] }}
 */
export function analyzeCodeQuality(filePaths) {
  try {
    if (!Array.isArray(filePaths) || filePaths.length === 0) {
      return {
        score: 0,
        hasLinter: false,
        hasFormatter: false,
        hasTypeScript: false,
        hasPreCommitHooks: false,
        details: ['No files found to analyze.'],
      };
    }

    const details = [];
    let hasLinter = false;
    let hasFormatter = false;
    let hasTypeScript = false;
    let hasPreCommitHooks = false;

    for (const fp of filePaths) {
      // Extract the base file name (last segment after /)
      const segments = fp.split('/');
      const baseName = segments[segments.length - 1];

      if (!hasLinter && matchesAny(baseName, LINTER_FILES)) {
        hasLinter = true;
        details.push(`Linter config detected: ${fp}`);
      }
      if (!hasFormatter && matchesAny(baseName, FORMATTER_FILES)) {
        hasFormatter = true;
        details.push(`Formatter config detected: ${fp}`);
      }
      if (!hasTypeScript && matchesAny(baseName, TS_CONFIG_FILES)) {
        hasTypeScript = true;
        details.push(`TypeScript config detected: ${fp}`);
      }
      if (!hasPreCommitHooks && matchesAny(baseName, PRE_COMMIT_FILES)) {
        hasPreCommitHooks = true;
        details.push(`Pre-commit hooks detected: ${fp}`);
      }
    }

    // Score: 0–100 based on detected practices
    let score = 0;
    const present = [hasLinter, hasFormatter, hasTypeScript, hasPreCommitHooks].filter(Boolean)
      .length;
    // Each of the 4 categories contributes up to 25 points
    for (const flag of [hasLinter, hasFormatter, hasTypeScript, hasPreCommitHooks]) {
      if (flag) score += 25;
    }

    if (details.length === 0) {
      details.push('No code quality configurations detected.');
    }

    return { score, hasLinter, hasFormatter, hasTypeScript, hasPreCommitHooks, details };
  } catch (err) {
    console.error('[CodeQualityChecker] Error:', err.message);
    return {
      score: 0,
      hasLinter: false,
      hasFormatter: false,
      hasTypeScript: false,
      hasPreCommitHooks: false,
      details: [`Error analyzing code quality: ${err.message}`],
    };
  }
}
