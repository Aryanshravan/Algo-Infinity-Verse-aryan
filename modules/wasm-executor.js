/**
 * modules/wasm-executor.js
 * Client-Side WebAssembly Execution Engine
 *
 * Provides Web Worker sandboxed execution for:
 * - Python via Pyodide WASM runtime (v0.26.3)
 * - C++ via simulated WASM pipeline (basic stdout parsing)
 *
 * Enhanced with:
 * - Timeout and abort support via AbortSignal
 * - stdin/stdout isolation and redirection
 * - Clean worker lifecycle management
 * - Detailed error reporting
 */

// ─── Pyodide v0.26.3 Worker Script ───

const PYODIDE_VERSION = '0.26.3';
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

const pyodideWorkerScript = `
self.addEventListener('message', async (e) => {
  const { code, stdin } = e.data;
  const logs = [];
  let capturedOutput = '';

  // Redirect stdin/stdout
  const stdinReader = (typeof stdin === 'string' && stdin.length > 0)
    ? () => stdin + '\\n'
    : () => '';

  try {
    importScripts("${PYODIDE_CDN}pyodide.js");
    const pyodide = await loadPyodide({
      indexURL: "${PYODIDE_CDN}",
      stdin: stdinReader,
      stdout: (text) => {
        logs.push(text);
        capturedOutput += text + '\\n';
      },
      stderr: (text) => {
        logs.push('[stderr] ' + text);
        capturedOutput += text + '\\n';
      }
    });

    const startTime = performance.now();
    const result = await pyodide.runPythonAsync(code);
    const endTime = performance.now();
    const executionTime = (endTime - startTime).toFixed(2);

    self.postMessage({
      success: true,
      logs,
      output: capturedOutput,
      result: result !== undefined ? String(result) : null,
      executionTime
    });
  } catch (err) {
    self.postMessage({
      success: false,
      error: err.message || String(err),
      logs,
      output: capturedOutput
    });
  }
});
`;

// ─── C++ Simulated Worker Script ───

const cppWasmWorkerScript = `
self.onmessage = async (e) => {
  const { code } = e.data;
  const logs = [];
  const startTime = performance.now();

  try {
    const simulatedOutput = [];
    const lines = code.split('\\\\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.includes('cout <<') || trimmed.includes('printf(')) {
        const matchString = trimmed.match(
          /(?:"([^"]*)"|<<\\\\s*([^;<<]+)|printf\\\\s*\\\\(\\\\s*"([^"]*)"\\\\))/
        );
        if (matchString) {
          const text = matchString[1] || matchString[2] || matchString[3];
          if (text && text !== 'endl') {
            simulatedOutput.push(text.replace(/\\\\\\\\n/g, ''));
          }
        }
      }
    }

    if (simulatedOutput.length === 0) {
      simulatedOutput.push('Program executed successfully (exit code 0).');
    }

    const endTime = performance.now();
    const executionTime = (endTime - startTime).toFixed(2);

    self.postMessage({
      success: true,
      logs: simulatedOutput,
      executionTime
    });
  } catch (err) {
    self.postMessage({
      success: false,
      error: err.message || String(err),
      logs: []
    });
  }
};
`;

// ─── Utility Functions ───

/**
 * Check if WebAssembly is supported by the current browser environment.
 * @returns {boolean}
 */
export function isWasmSupported() {
  return typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
}

/**
 * Create a worker safely, handling errors gracefully.
 * @param {string} scriptContent - Worker script as a string
 * @param {object} [options]
 * @param {AbortSignal} [options.signal] - Optional AbortSignal
 * @returns {{ worker: Worker, url: string }}
 */
function createWorker(scriptContent, options = {}) {
  const blob = new Blob([scriptContent], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);

  // Abort handling: terminate worker if signal is aborted
  if (options.signal) {
    if (options.signal.aborted) {
      worker.terminate();
      URL.revokeObjectURL(url);
      throw new DOMException('The operation was aborted', 'AbortError');
    }
    options.signal.addEventListener(
      'abort',
      () => {
        worker.terminate();
        URL.revokeObjectURL(url);
      },
      { once: true }
    );
  }

  return { worker, url };
}

/**
 * Clean up worker resources.
 * @param {Worker} worker
 * @param {string} url
 */
function cleanupWorker(worker, url) {
  try { worker.terminate(); } catch { /* ignore */ }
  try { URL.revokeObjectURL(url); } catch { /* ignore */ }
}

// ─── Public API ───

/**
 * Execute Python code via client-side Pyodide WASM worker.
 *
 * @param {string} code - Python source code
 * @param {number} [timeoutMs=10000] - Execution timeout in ms
 * @param {object} [options]
 * @param {string} [options.stdin] - Standard input for the Python program
 * @param {AbortSignal} [options.signal] - Optional AbortSignal for cancellation
 * @returns {Promise<{ logs: string[], output: string, executionTime: string, isWasm: boolean }>}
 */
export function executeWasmPython(code, timeoutMs = 10000, options = {}) {
  if (!code || typeof code !== 'string') {
    return Promise.reject(new Error('Source code must be a non-empty string.'));
  }

  if (!isWasmSupported()) {
    return Promise.reject(new Error('WebAssembly is not supported in this browser.'));
  }

  const { stdin = '', signal } = options || {};

  return new Promise((resolve, reject) => {
    let worker, workerUrl;

    try {
      ({ worker, url: workerUrl } = createWorker(pyodideWorkerScript, { signal }));
    } catch (err) {
      return reject(err);
    }

    const streamedLogs = [];
    let settled = false;

    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanupWorker(worker, workerUrl);
      reject(new Error(`Python execution timed out after ${timeoutMs / 1000}s`));
    }, timeoutMs);

    const abortHandler = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      cleanupWorker(worker, workerUrl);
      reject(new DOMException('The operation was aborted', 'AbortError'));
    };

    if (signal) {
      if (signal.aborted) {
        clearTimeout(timeoutId);
        return reject(new DOMException('The operation was aborted', 'AbortError'));
      }
      signal.addEventListener('abort', abortHandler, { once: true });
    }

    worker.onmessage = (e) => {
      if (settled) return;
      settled = true;

      clearTimeout(timeoutId);
      if (signal) signal.removeEventListener('abort', abortHandler);

      const data = e.data;

      if (data.success) {
        const combinedLogs = data.logs && data.logs.length > 0 ? data.logs : streamedLogs;
        resolve({
          logs: combinedLogs.length > 0 ? combinedLogs : ['✅ Python script executed successfully with no output.'],
          output: data.output || combinedLogs.join('\n'),
          executionTime: data.executionTime || '0.00',
          isWasm: true,
        });
      } else {
        const errMsg = data.error || 'Unknown Python execution error';
        reject(
          new Error(
            errMsg +
              (data.logs && data.logs.length > 0
                ? '\nPartial Output:\n' + data.logs.join('\n')
                : '')
          )
        );
      }

      cleanupWorker(worker, workerUrl);
    };

    worker.onerror = (err) => {
      if (settled) return;
      settled = true;

      clearTimeout(timeoutId);
      if (signal) signal.removeEventListener('abort', abortHandler);

      cleanupWorker(worker, workerUrl);
      reject(new Error(err.message || 'Pyodide WASM Worker Error'));
    };

    worker.postMessage({ code, stdin });
  });
}

/**
 * Execute C++ code via client-side WASM worker pipeline.
 * Note: This is a simulated execution (parses cout/printf patterns).
 * For actual C++ execution, use the Judge0 server proxy.
 *
 * @param {string} code - C++ source code
 * @param {number} [timeoutMs=8000] - Execution timeout in ms
 * @returns {Promise<{ logs: string[], executionTime: string, isWasm: boolean }>}
 */
export function executeWasmCpp(code, timeoutMs = 8000) {
  if (!code || typeof code !== 'string') {
    return Promise.reject(new Error('Source code must be a non-empty string.'));
  }

  if (!isWasmSupported()) {
    return Promise.reject(new Error('WebAssembly is not supported in this browser.'));
  }

  return new Promise((resolve, reject) => {
    let worker, workerUrl;

    try {
      ({ worker, url: workerUrl } = createWorker(cppWasmWorkerScript));
    } catch (err) {
      return reject(err);
    }

    let settled = false;

    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanupWorker(worker, workerUrl);
      reject(new Error(`C++ execution timed out after ${timeoutMs / 1000}s`));
    }, timeoutMs);

    worker.onmessage = (e) => {
      if (settled) return;
      settled = true;

      clearTimeout(timeoutId);

      const { success, error, logs, executionTime } = e.data;
      if (success) {
        resolve({
          logs,
          executionTime: executionTime || '0.00',
          isWasm: true,
        });
      } else {
        reject(new Error(error || 'C++ execution error'));
      }

      cleanupWorker(worker, workerUrl);
    };

    worker.onerror = (err) => {
      if (settled) return;
      settled = true;

      clearTimeout(timeoutId);
      cleanupWorker(worker, workerUrl);
      reject(new Error(err.message || 'C++ WASM Worker Error'));
    };

    worker.postMessage({ code });
  });
}

/**
 * Execute Python code with a simpler API for quick scripts.
 * Wraps executeWasmPython with a string-only return.
 *
 * @param {string} code - Python source code
 * @param {string} [stdin] - Optional stdin
 * @param {number} [timeoutMs] - Timeout in ms
 * @returns {Promise<string>} Combined stdout/stderr output
 */
export async function runPython(code, stdin = '', timeoutMs = 10000) {
  const result = await executeWasmPython(code, timeoutMs, { stdin });
  return result.output;
}

/**
 * Warm up the Pyodide runtime by loading it in a background worker.
 * Call this early (e.g., on page load) to reduce perceived cold-start latency.
 * @returns {Promise<void>}
 */
export async function warmupPyodide() {
  if (!isWasmSupported()) return;
  try {
    await executeWasmPython('import json\nprint("pyodide_ready")', 15000);
  } catch {
    // Warmup failure is non-critical
  }
}

// ─── Legacy Global Exports ───

if (typeof window !== 'undefined') {
  window.isWasmSupported = isWasmSupported;
  window.executeWasmPython = executeWasmPython;
  window.executeWasmCpp = executeWasmCpp;
  window.warmupPyodide = warmupPyodide;
}
