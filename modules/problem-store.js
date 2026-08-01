/**
 * modules/problem-store.js
 * Thin wrapper around the global `window.practiceProblems` data.
 * Provides lookup helpers, filtering, and type-safe access to problem metadata.
 *
 * Single source of truth — re-exports data from data/practice-problems.js
 * without duplication.
 */

/**
 * Get the practice problems array from the global store.
 * @returns {Array<object>} Array of problem objects
 * @throws {Error} If practiceProblems is not loaded yet
 */
function getProblemsInternal() {
  const data = window.practiceProblems;
  if (!Array.isArray(data) || data.length === 0) {
    // Try the secondary location used in some pages
    const fallback = window.__practiceProblems;
    if (Array.isArray(fallback) && fallback.length > 0) {
      return fallback;
    }
    return [];
  }
  return data;
}

/**
 * Get a problem by its ID.
 * @param {number|string} id - Problem ID (number or string)
 * @returns {object|undefined} The problem object, or undefined if not found
 */
export function getProblem(id) {
  const problems = getProblemsInternal();
  const numericId = Number(id);
  return problems.find((p) => Number(p.id) === numericId);
}

/**
 * Get all practice problems.
 * @returns {Array<object>}
 */
export function getAllProblems() {
  return getProblemsInternal();
}

/**
 * Get problems filtered by category.
 * @param {string} category - Problem category key (e.g. 'arrays', 'trees', 'dp')
 * @returns {Array<object>}
 */
export function getProblemsByCategory(category) {
  return getProblemsInternal().filter((p) => p.category === category);
}

/**
 * Get problems filtered by difficulty.
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @returns {Array<object>}
 */
export function getProblemsByDifficulty(difficulty) {
  return getProblemsInternal().filter(
    (p) => p.difficulty.toLowerCase() === difficulty.toLowerCase()
  );
}

/**
 * Get problems matching a search query (searches title, tags, and description).
 * @param {string} query - Search string
 * @returns {Array<object>}
 */
export function searchProblems(query) {
  const q = query.toLowerCase().trim();
  if (!q) return getProblemsInternal();

  return getProblemsInternal().filter((p) => {
    return (
      p.title.toLowerCase().includes(q) ||
      (p.tags || []).some((t) => t.toLowerCase().includes(q)) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    );
  });
}

/**
 * Get all unique categories present in the problem set.
 * @returns {Array<string>}
 */
export function getCategories() {
  const cats = new Set(getProblemsInternal().map((p) => p.category).filter(Boolean));
  return [...cats];
}

/**
 * Get all unique difficulties.
 * @returns {Array<string>}
 */
export function getDifficulties() {
  return ['easy', 'medium', 'hard'];
}

/**
 * Get the total count of problems.
 * @returns {number}
 */
export function getProblemCount() {
  return getProblemsInternal().length;
}

/**
 * Check if problem data is loaded.
 * @returns {boolean}
 */
export function isDataLoaded() {
  return (
    (Array.isArray(window.practiceProblems) && window.practiceProblems.length > 0) ||
    (Array.isArray(window.__practiceProblems) && window.__practiceProblems.length > 0)
  );
}

/**
 * Determine if a problem uses a class-based API (e.g. LRUCache) vs function-based.
 * @param {object} problem - Problem object
 * @returns {boolean}
 */
export function isClassProblem(problem) {
  if (!problem?.functionName) return false;
  return /^[A-Z]/.test(problem.functionName);
}

/**
 * Get the preferred language for a user, falling back to a default.
 * @returns {string}
 */
export function getPreferredLanguage() {
  try {
    return localStorage.getItem('preferredLanguage') || 'javascript';
  } catch {
    return 'javascript';
  }
}

/**
 * Set the preferred language for a user.
 * @param {string} lang - Language key (javascript, python, java, cpp, etc.)
 */
export function setPreferredLanguage(lang) {
  try {
    localStorage.setItem('preferredLanguage', lang);
  } catch {
    // localStorage may be unavailable
  }
}

/**
 * Get drafted code for a problem+language combo.
 * @param {number|string} problemId
 * @param {string} lang
 * @returns {string|null}
 */
export function getDraft(problemId, lang) {
  try {
    return localStorage.getItem(`editorDraft_${problemId}_${lang}`);
  } catch {
    return null;
  }
}

/**
 * Save drafted code for a problem+language combo.
 * @param {number|string} problemId
 * @param {string} lang
 * @param {string} code
 */
export function saveDraft(problemId, lang, code) {
  try {
    localStorage.setItem(`editorDraft_${problemId}_${lang}`, code);
  } catch {
    // localStorage may be full or unavailable
  }
}

/**
 * Clear drafted code for a problem+language combo.
 * @param {number|string} problemId
 * @param {string} lang
 */
export function clearDraft(problemId, lang) {
  try {
    localStorage.removeItem(`editorDraft_${problemId}_${lang}`);
  } catch {
    // noop
  }
}

/**
 * Migrate drafts from the old single-language key format to the new key format.
 * @param {number|string} problemId
 * @param {string} lang
 * @returns {string|null} The migrated code, or null if no legacy draft existed
 */
export function migrateLegacyDraft(problemId, lang) {
  try {
    const oldKey = `editorDraft_${problemId}`;
    const code = localStorage.getItem(oldKey);
    if (code !== null) {
      const newKey = `editorDraft_${problemId}_${lang}`;
      if (localStorage.getItem(newKey) === null) {
        localStorage.setItem(newKey, code);
      }
      localStorage.removeItem(oldKey);
      // Also clean up legacy signature key
      localStorage.removeItem(`editorDraft_sig_${problemId}`);
      return code;
    }
  } catch {
    // noop
  }
  return null;
}

/**
 * Wait for problem data to be available, with a timeout.
 * Useful when the data script might load async.
 * @param {number} timeoutMs - Maximum time to wait (default 5000ms)
 * @returns {Promise<Array<object>>}
 */
export function waitForData(timeoutMs = 5000) {
  if (isDataLoaded()) {
    return Promise.resolve(getProblemsInternal());
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      observer.disconnect();
      reject(new Error('Practice problem data not loaded within timeout'));
    }, timeoutMs);

    const observer = new MutationObserver(() => {
      if (isDataLoaded()) {
        clearTimeout(timeout);
        observer.disconnect();
        resolve(getProblemsInternal());
      }
    });

    observer.observe(document.head, { childList: true, subtree: true });
  });
}
