/**
 * backend/lib/judge0-client.js
 * Thin wrapper around the Judge0 CE public API for compiling and running
 * C++, Java, C, and other compiled-language submissions.
 *
 * Judge0 CE public endpoint: https://ce.judge0.com
 * No API key required (rate-limited to ~50 requests/day per IP on free tier).
 *
 * For production use with higher volume, self-host Judge0 or use Piston instead.
 */

const JUDGE0_BASE = 'https://ce.judge0.com';
const DEFAULT_TIMEOUT_MS = 15000;
const POLL_INTERVAL_MS = 600;
const MAX_POLL_ATTEMPTS = 25; // ~15 seconds total polling

// Language IDs from Judge0 CE API
// See https://ce.judge0.com/#languages for full list
const LANGUAGE_IDS = {
  cpp: 54,
  'c++': 54,
  c: 50,
  java: 62,
  python: 71,
  javascript: 63,
  typescript: 74,
  go: 60,
  rust: 73,
  ruby: 72,
  swift: 83,
  dart: 98,
  haskell: 89,
  kotlin: 78,
};

// Compiler options for each language
const COMPILER_OPTIONS = {
  54: '-std=c++17 -O2',           // C++
  50: '-std=c11 -O2',            // C
  62: '-Xlint:all',              // Java
};

/**
 * Submit code to Judge0 CE and wait for the result.
 *
 * @param {object} params
 * @param {string} params.source_code - Complete source code to compile and run
 * @param {number} params.language_id - Judge0 language ID (see LANGUAGE_IDS)
 * @param {string} [params.stdin=''] - Standard input for the program
 * @param {number} [params.timeoutMs=15000] - Maximum total time to wait (including polling)
 * @returns {Promise<{stdout: string, stderr: string, compile_output: string, status: object, time: string, memory: number}>}
 */
export async function judge0Execute({ source_code, language_id, stdin = '', timeoutMs = DEFAULT_TIMEOUT_MS }) {
  if (!source_code || typeof source_code !== 'string') {
    throw new Error('source_code is required and must be a string');
  }
  if (!language_id || !LANGUAGE_IDS[Object.keys(LANGUAGE_IDS).find(k => LANGUAGE_IDS[k] === language_id)]) {
    // Allow passing language_id directly — verify it's a known ID
    const validIds = Object.values(LANGUAGE_IDS);
    if (!validIds.includes(language_id)) {
      throw new Error(`Invalid language_id: ${language_id}. Must be one of: ${validIds.join(', ')}`);
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Step 1: Submit code
    const submitRes = await fetch(`${JUDGE0_BASE}/submissions?base64_encoded=false&wait=false`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_code,
        language_id,
        stdin: stdin || '',
        compiler_options: COMPILER_OPTIONS[language_id] || undefined,
        cpu_time_limit: 5,
        memory_limit: 256000, // 256 MB in kilobytes
      }),
      signal: controller.signal,
    });

    if (!submitRes.ok) {
      const errText = await submitRes.text().catch(() => 'Unknown error');
      throw new Error(`Judge0 submission failed (${submitRes.status}): ${errText.slice(0, 500)}`);
    }

    // Guard against non-JSON responses (e.g., HTML error pages)
    const contentType = submitRes.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const bodyPreview = await submitRes.text().catch(() => '');
      throw new Error(`Judge0 returned non-JSON response (${submitRes.status}): ${bodyPreview.slice(0, 200)}`);
    }

    let submissionData;
    try {
      submissionData = await submitRes.json();
    } catch (parseErr) {
      throw new Error(`Judge0 returned invalid JSON: ${parseErr.message}`);
    }

    const token = submissionData.token;
    if (!token) {
      throw new Error('No submission token received from Judge0');
    }
    if (!token) {
      throw new Error('No submission token received from Judge0');
    }

    // Step 2: Poll for results
    const result = await pollForResult(token, controller.signal);

    // Step 3: Normalize result
    return {
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      compile_output: result.compile_output || '',
      status: {
        id: result.status?.id || 0,
        description: result.status?.description || 'Unknown',
      },
      time: result.time || null,
      memory: result.memory || null,
      exitCode: result.status?.id === 3 ? 0 : 1,
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Judge0 execution timed out');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Poll Judge0 for submission result with exponential backoff.
 * @private
 */
async function pollForResult(token, signal) {
  const fields = 'stdout,stderr,compile_output,status,time,memory,exit_code';

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    // Exponential backoff: start at 600ms, max ~1500ms
    const delay = Math.min(POLL_INTERVAL_MS + attempt * 50, 1500);
    await new Promise((r) => setTimeout(r, delay));

    if (signal?.aborted) {
      throw new DOMException('The operation was aborted', 'AbortError');
    }

    const resultRes = await fetch(
      `${JUDGE0_BASE}/submissions/${encodeURIComponent(token)}?base64_encoded=false&fields=${fields}`,
      { signal }
    );

    if (!resultRes.ok) {
      const errText = await resultRes.text().catch(() => 'Unknown error');
      throw new Error(`Judge0 poll error (${resultRes.status}): ${errText}`);
    }

    const result = await resultRes.json();

    // Judge0 status.id:
    // 1 = In Queue, 2 = Processing, 3 = Accepted, 4+ = Error/Completed
    if (result.status && result.status.id > 2) {
      return result;
    }
  }

  throw new Error('Judge0 execution timed out after polling limit');
}

/**
 * Map our language names to Judge0 language IDs.
 * @param {string} language - Language name (e.g., 'cpp', 'java', 'python')
 * @returns {number|null} Judge0 language ID or null if unsupported
 */
export function getLanguageId(language) {
  return LANGUAGE_IDS[language?.toLowerCase()] || null;
}

/**
 * Check if a language requires Judge0 (compiled languages).
 * @param {string} language
 * @returns {boolean}
 */
export function requiresJudge0(language) {
  const id = getLanguageId(language);
  if (!id) return false;
  // JS and Python can run in-browser; everything else needs Judge0
  return ![63, 71].includes(id); // javascript: 63, python: 71
}

/**
 * Get all languages supported by Judge0 with their IDs.
 * @returns {Array<{name: string, id: number}>}
 */
export function getSupportedLanguages() {
  return Object.entries(LANGUAGE_IDS).map(([name, id]) => ({ name, id }));
}
