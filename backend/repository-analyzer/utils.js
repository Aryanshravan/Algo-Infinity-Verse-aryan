/**
 * Repository Analyzer — Shared Utilities
 */

/**
 * Check if a file name or path matches any pattern in the list.
 * @param {string} input - The string to test (e.g., file name or path).
 * @param {RegExp[]} patterns - Array of RegExp patterns to test against.
 * @returns {boolean}
 */
export function matchesAny(input, patterns) {
  if (!input || !Array.isArray(patterns)) return false;
  for (const pat of patterns) {
    if (pat.test(input)) return true;
  }
  return false;
}
