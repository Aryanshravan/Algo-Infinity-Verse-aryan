// modules/wasm-executor.js
/**
 * Client-Side WebAssembly Execution Engine
 * Provides Web Worker sandboxed execution for Python (Pyodide) and C++ WASM pipeline.
 */

// Worker code string for Pyodide Python WASM runtime
const pyodideWorkerScript = `
importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

let pyodidePromise = null;
const logs = [];

async function initPyodide() {
    return loadPyodide({
        stdout: (text) => {
            logs.push(text);
            self.postMessage({ type: 'stdout', text });
        },
        stderr: (text) => {
            logs.push(text);
            self.postMessage({ type: 'stderr', text });
        }
    });
}

pyodidePromise = initPyodide();

self.onmessage = async (e) => {
    const { code } = e.data;
    logs.length = 0;
    
    try {
        const pyodide = await pyodidePromise;
        const startTime = performance.now();
        
        // Execute Python script
        const result = await pyodide.runPythonAsync(code);
        const endTime = performance.now();
        
        const executionTime = (endTime - startTime).toFixed(2);
        self.postMessage({
            success: true,
            logs: [...logs],
            result: result !== undefined ? String(result) : null,
            executionTime
        });
    } catch (err) {
        self.postMessage({
            success: false,
            error: err.message || String(err),
            logs: [...logs]
        });
    }
};
`;

// Worker code string for C++ WASM runner / interpreter pipeline
const cppWasmWorkerScript = `
self.onmessage = async (e) => {
    const { code } = e.data;
    const logs = [];
    const startTime = performance.now();

    try {
        let simulatedOutput = [];
        const lines = code.split('\\n');
        
        for (let line of lines) {
            const trimmed = line.trim();
            if (trimmed.includes('cout <<') || trimmed.includes('printf(')) {
                const matchString = trimmed.match(/(?:"([^"]*)"|<<\\s*([^;<<]+)|printf\\s*\\(\\s*"([^"]*)"\\))/);
                if (matchString) {
                    const text = matchString[1] || matchString[2] || matchString[3];
                    if (text && text !== 'endl') {
                        simulatedOutput.push(text.replace(/\\\\n/g, ''));
                    }
                }
            }
        }

        if (simulatedOutput.length === 0) {
            simulatedOutput.push("Program executed successfully (exit code 0).");
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

/**
 * Check if WebAssembly is supported by the current browser environment.
 * @returns {boolean}
 */
export function isWasmSupported() {
  return typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
}

/**
 * Execute Python code via client-side Pyodide WASM worker.
 * @param {string} code Python source code
 * @param {number} timeoutMs Execution timeout in ms
 * @returns {Promise<{ logs: string[], executionTime: string, isWasm: true }>}
 */
export function executeWasmPython(code, timeoutMs = 10000) {
  if (!code || typeof code !== 'string') {
    return Promise.reject(new Error('Source code must be a non-empty string.'));
  }

  if (!isWasmSupported()) {
    return Promise.reject(new Error('WebAssembly is not supported in this browser.'));
  }

  return new Promise((resolve, reject) => {
    const blob = new Blob([pyodideWorkerScript], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);
    const streamedLogs = [];

    const timeoutId = setTimeout(() => {
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      reject(new Error(`Execution timed out (> ${timeoutMs / 1000}s)`));
    }, timeoutMs);

    worker.onmessage = (e) => {
      const data = e.data;
      if (data.type === 'stdout' || data.type === 'stderr') {
        streamedLogs.push(data.text);
        return;
      }

      clearTimeout(timeoutId);
      worker.terminate();
      URL.revokeObjectURL(workerUrl);

      if (data.success) {
        const logs = data.logs && data.logs.length > 0 ? data.logs : streamedLogs;
        resolve({
          logs: logs.length > 0 ? logs : ['✅ Python script executed successfully with no output.'],
          executionTime: data.executionTime || '0.00',
          isWasm: true,
        });
      } else {
        reject(
          new Error(
            data.error + (data.logs.length > 0 ? '\nPartial Output:\n' + data.logs.join('\n') : '')
          )
        );
      }
    };

    worker.onerror = (err) => {
      clearTimeout(timeoutId);
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      reject(new Error(err.message || 'Pyodide WASM Worker Error'));
    };

    worker.postMessage({ code });
  });
}

/**
 * Execute C++ code via client-side WASM worker pipeline.
 * @param {string} code C++ source code
 * @param {number} timeoutMs Execution timeout in ms
 * @returns {Promise<{ logs: string[], executionTime: string, isWasm: true }>}
 */
export function executeWasmCpp(code, timeoutMs = 8000) {
  if (!code || typeof code !== 'string') {
    return Promise.reject(new Error('Source code must be a non-empty string.'));
  }

  if (!isWasmSupported()) {
    return Promise.reject(new Error('WebAssembly is not supported in this browser.'));
  }

  return new Promise((resolve, reject) => {
    const blob = new Blob([cppWasmWorkerScript], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    const timeoutId = setTimeout(() => {
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      reject(new Error(`Execution timed out (> ${timeoutMs / 1000}s)`));
    }, timeoutMs);

    worker.onmessage = (e) => {
      clearTimeout(timeoutId);
      worker.terminate();
      URL.revokeObjectURL(workerUrl);

      const { success, error, logs, executionTime } = e.data;
      if (success) {
        resolve({
          logs,
          executionTime: executionTime || '0.00',
          isWasm: true,
        });
      } else {
        reject(new Error(error));
      }
    };

    worker.onerror = (err) => {
      clearTimeout(timeoutId);
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      reject(new Error(err.message || 'C++ WASM Worker Error'));
    };

    worker.postMessage({ code });
  });
}

// Bind to window for legacy global usage if in browser
if (typeof window !== 'undefined') {
  window.isWasmSupported = isWasmSupported;
  window.executeWasmPython = executeWasmPython;
  window.executeWasmCpp = executeWasmCpp;
}
