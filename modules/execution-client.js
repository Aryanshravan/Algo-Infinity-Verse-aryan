/**
 * modules/execution-client.js
 * Unified execution client that orchestrates code execution across:
 * - Browser-native sandboxes for JavaScript (Worker) and Python (Pyodide WASM)
 * - Server-side proxy for C++/Java via Judge0 CE
 *
 * Provides a consistent result shape regardless of execution backend.
 */

import { executeSandboxedCode } from './code-executor.js';
import { executeWasmPython, executeWasmCpp } from './wasm-executor.js';
import { buildHarness, parseTestResults } from './problem-templates.js';

// ─── Constants ───

const BROWSER_EXECUTABLE_LANGUAGES = ['javascript', 'js', 'python', 'py'];
const SERVER_EXECUTABLE_LANGUAGES = ['cpp', 'c++', 'java', 'c', 'swift'];
const DEFAULT_TIMEOUT_MS = 8000;

// ─── Public API ───

/**
 * Execute code for a problem and return structured test results.
 * Automatically selects the best execution backend based on language.
 *
 * @param {object} params
 * @param {string} params.code - User's solution code
 * @param {string} params.lang - Language key (javascript, python, cpp, java, etc.)
 * @param {object} params.problem - Problem object with testCases, functionName, etc.
 * @param {number} [params.timeoutMs=8000] - Execution timeout in milliseconds
 * @param {AbortSignal} [params.signal] - Optional AbortSignal for cancellation
 * @returns {Promise<{allPassed: boolean, testResults: Array, rawOutput: string, metrics?: object}>}
 */
export async function executeProblem({
  code,
  lang,
  problem,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  signal,
}) {
  if (!code || !code.trim()) {
    return {
      allPassed: false,
      testResults: [],
      rawOutput: 'No code to execute.',
    };
  }

  if (!problem || !problem.testCases || problem.testCases.length === 0) {
    return {
      allPassed: false,
      testResults: [],
      rawOutput: 'This problem has no automated test cases.',
    };
  }

  const normalLang = lang?.toLowerCase() || 'javascript';
  const testCount = problem.testCases.length;

  let harnessCode;
  try {
    harnessCode = buildHarness(code, normalLang, problem);
  } catch (buildErr) {
    return {
      allPassed: false,
      testResults: Array.from({ length: testCount }, () => ({
        ran: true,
        passed: false,
        error: 'Failed to build test harness: ' + buildErr.message,
      })),
      rawOutput: 'Failed to build test harness: ' + buildErr.message,
    };
  }

  try {
    let result;
    if (BROWSER_EXECUTABLE_LANGUAGES.includes(normalLang)) {
      result = await executeInBrowser(harnessCode, normalLang, testCount, timeoutMs, signal);
    } else if (SERVER_EXECUTABLE_LANGUAGES.includes(normalLang)) {
      try {
        result = await executeOnServer(
          { harnessCode, originalCode: code, lang: normalLang, problemId: problem.id },
          testCount,
          signal
        );
      } catch (serverErr) {
        if (normalLang === 'cpp' || normalLang === 'c++' || normalLang === 'c') {
          console.warn('Server execution failed, falling back to in-browser WASM:', serverErr);
          result = await executeInBrowser(harnessCode, normalLang, testCount, timeoutMs, signal);
        } else {
          throw serverErr;
        }
      }
    } else {
      return {
        allPassed: false,
        testResults: [],
        rawOutput: `Unsupported language: ${lang}. Supported languages: javascript, python, java, cpp, c, swift.`,
      };
    }
    result.harnessCode = harnessCode;
    return result;
  } catch (err) {
    if (err.name === 'AbortError') {
      return {
        allPassed: false,
        testResults: Array.from({ length: testCount }, () => ({
          ran: true,
          passed: false,
          error: 'Execution cancelled',
        })),
        rawOutput: 'Execution was cancelled.',
      };
    }
    return {
      allPassed: false,
      testResults: Array.from({ length: testCount }, () => ({
        ran: true,
        passed: false,
        error: err.message,
      })),
      rawOutput: err.message,
    };
  }
}

/**
 * Execute code in a browser-native sandbox (JS Worker or Pyodide WASM).
 * @private
 */
async function executeInBrowser(harnessCode, lang, testCount, timeoutMs, signal) {
  let result;

  if (lang === 'javascript' || lang === 'js') {
    result = await withCancellation(
      executeSandboxedCode(harnessCode, timeoutMs).then((logs) => ({
        stdout: logs.join('\n'),
        metrics: { executionTime: logs.executionTime },
      })),
      signal,
      timeoutMs
    );
  } else if (lang === 'python' || lang === 'py') {
    result = await withCancellation(
      executeWasmPython(harnessCode, timeoutMs).then((res) => ({
        stdout: (res.logs || []).join('\n'),
        metrics: { executionTime: res.executionTime },
      })),
      signal,
      timeoutMs
    );
  } else if (lang === 'cpp' || lang === 'c++' || lang === 'c') {
    result = await withCancellation(
      executeWasmCpp(harnessCode, timeoutMs).then((res) => ({
        stdout: (res.logs || []).join('\n'),
        metrics: { executionTime: res.executionTime },
      })),
      signal,
      timeoutMs
    );
  } else {
    throw new Error(`Browser execution not supported for ${lang}`);
  }

  return parseResult(result, testCount);
}

/**
 * Execute code on the server via the Judge0 proxy API.
 * @private
 */
async function executeOnServer({ harnessCode, originalCode, lang, problemId }, testCount, signal) {
  const url = '/api/execute/problem';

  const fetchOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      problemId,
      language: lang,
      sourceCode: harnessCode,
      originalCode,
    }),
  };

  // Pass the abort signal to fetch so HTTP request is actually cancelled
  if (signal) {
    fetchOptions.signal = signal;
  }

  const response = await withCancellation(
    fetch(url, fetchOptions),
    signal,
    30000 // Server execution gets a longer timeout
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorBody.error || `Server execution failed (${response.status})`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || 'Server execution failed');
  }

  return parseResult(
    {
      stdout: result.data?.output || '',
      stderr: result.data?.stderr || '',
      metrics: {
        memory: result.data?.memory,
        cpuTime: result.data?.cpuTime,
        status: result.data?.status,
      },
    },
    testCount
  );
}

/**
 * Parse raw execution output into structured test results.
 * @private
 */
function parseResult(execResult, testCount) {
  const parsed = parseTestResults(execResult.stdout || '', testCount);
  return {
    ...parsed,
    metrics: execResult.metrics || {},
  };
}

/**
 * Wrap a promise with an AbortSignal and/or timeout.
 * @private
 */
function withCancellation(promise, signal, timeoutMs) {
  if (!signal && !timeoutMs) return promise;

  return new Promise((resolve, reject) => {
    const cleanups = [];

    // Handle AbortSignal
    if (signal) {
      const onAbort = () => {
        reject(new DOMException('The operation was aborted', 'AbortError'));
      };
      if (signal.aborted) {
        reject(new DOMException('The operation was aborted', 'AbortError'));
        return;
      }
      signal.addEventListener('abort', onAbort);
      cleanups.push(() => signal.removeEventListener('abort', onAbort));
    }

    promise.then(resolve, reject).finally(() => {
      cleanups.forEach((fn) => fn());
    });
  });
}

// ─── Utility ───

/**
 * Check if a language can be executed in-browser.
 * @param {string} lang
 * @returns {boolean}
 */
export function isBrowserExecutable(lang) {
  return BROWSER_EXECUTABLE_LANGUAGES.includes(lang?.toLowerCase());
}

/**
 * Check if a language requires server execution.
 * @param {string} lang
 * @returns {boolean}
 */
export function requiresServerExecution(lang) {
  return SERVER_EXECUTABLE_LANGUAGES.includes(lang?.toLowerCase());
}

/**
 * Get supported languages for the global editor.
 * @returns {Array<{value: string, label: string, browser: boolean}>}
 */
export function getSupportedLanguages() {
  return [
    { value: 'javascript', label: 'JavaScript', browser: true },
    { value: 'python', label: 'Python', browser: true },
  ];
}

// ─── Draft persistence ───

const DRAFT_PREFIX = 'editorDraft_';

/**
 * Save a code draft to localStorage.
 * @param {number|string} problemId
 * @param {string} lang
 * @param {string} code
 */
export function saveDraft(problemId, lang, code) {
  try {
    const key = `${DRAFT_PREFIX}${problemId}_${lang}`;
    if (code) {
      localStorage.setItem(key, code);
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    // localStorage may be full or unavailable
  }
}

/**
 * Load a code draft from localStorage.
 * @param {number|string} problemId
 * @param {string} lang
 * @returns {string|null}
 */
export function loadDraft(problemId, lang) {
  try {
    return localStorage.getItem(`${DRAFT_PREFIX}${problemId}_${lang}`);
  } catch {
    return null;
  }
}

/**
 * Clear a code draft from localStorage.
 * @param {number|string} problemId
 * @param {string} lang
 */
export function clearDraft(problemId, lang) {
  try {
    localStorage.removeItem(`${DRAFT_PREFIX}${problemId}_${lang}`);
  } catch {
    // noop
  }
}

/**
 * Persist an execution record to the server-side history store.
 * Fire-and-forget — failures are logged but never propagated so they
 * never block the UI after a code run.
 *
 * @param {object} params
 * @param {string} params.sourceCode - Full code that was executed (with harness)
 * @param {string} [params.originalCode] - User's original (unwrapped) code
 * @param {string} params.language - Language key
 * @param {string} [params.stdout] - Captured stdout
 * @param {string} [params.stderr] - Captured stderr
 * @param {number} [params.exitCode] - Process exit code
 * @param {string|number} [params.cpuTime] - CPU time or execution time
 * @param {number} [params.memory] - Memory usage in KB
 * @param {string|null} [params.error] - Error message if execution failed
 * @param {string|number|null} [params.problemId] - Problem identifier
 */
export function saveExecution({
  sourceCode,
  originalCode,
  language,
  stdout,
  stderr,
  exitCode,
  cpuTime,
  memory,
  error,
  problemId,
}) {
  fetch('/api/executions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      sourceCode,
      originalCode: originalCode || '',
      language,
      stdin: '',
      stdout: stdout || '',
      stderr: stderr || '',
      exitCode: typeof exitCode === 'number' ? exitCode : 0,
      cpuTime: cpuTime !== undefined ? String(cpuTime) : '',
      memory: memory !== undefined ? Number(memory) : 0,
      error: error || null,
      problemId: problemId !== undefined && problemId !== null ? String(problemId) : null,
    }),
  }).catch((err) => {
    console.warn('Failed to save execution:', err.message);
  });
}
