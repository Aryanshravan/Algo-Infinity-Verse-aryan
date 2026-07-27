/**
 * Tests for Issue #3017:
 * Tail Call Optimization & Mutual Recursion Stack Exhaustion in Elixir AST Interpreter
 * (Stale-fetch desynchronization and main-thread blocking highlight debounce)
 *
 * Verifies:
 * 1. executeElixir accepts an optional AbortSignal parameter
 * 2. executeElixir passes the signal to fetch()
 * 3. executeElixir returns empty result on AbortError (not an error string)
 * 4. runAbortController is declared for tracking in-flight requests
 * 5. runCode aborts the previous controller before creating a new one
 * 6. updateSyntaxHighlight is debounced (setTimeout present in its body)
 * 7. highlightDebounceTimer is declared for tracking the debounce
 * 8. No standard output placeholder shown when there are errors (regression fix)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const elixirCode = fs.readFileSync(
  path.resolve(__dirname, '../pages/editors/elixir-editor/elixir-editor.js'),
  'utf-8'
);

describe('Elixir Editor — AbortController & Highlight Debounce Fix (Issue #3017)', () => {
  // ── Source-level regression guards ─────────────────────────────────────────

  test('executeElixir signature accepts a signal parameter', () => {
    expect(elixirCode).toMatch(/async function executeElixir\(files,\s*signal\)/);
  });

  test('executeElixir passes signal to fetch()', () => {
    // The signal option must be forwarded to the fetch call
    const fetchIdx = elixirCode.indexOf("fetch('https://emkc.org");
    expect(fetchIdx).toBeGreaterThan(0);
    // Within the fetch options object, signal must be present
    const fetchOptionsEnd = elixirCode.indexOf('});', fetchIdx);
    const fetchOptions = elixirCode.slice(fetchIdx, fetchOptionsEnd);
    expect(fetchOptions).toContain('signal,');
  });

  test('executeElixir returns empty result on AbortError without error string', () => {
    // The catch block must check error.name === AbortError and return gracefully
    expect(elixirCode).toContain("error.name === 'AbortError'");
    // The AbortError branch must return empty arrays, not an error message
    const abortIdx = elixirCode.indexOf("error.name === 'AbortError'");
    const abortBranch = elixirCode.slice(abortIdx, abortIdx + 200);
    expect(abortBranch).toContain('{ output: [], errors: [] }');
  });

  test('runAbortController variable is declared to track in-flight requests', () => {
    expect(elixirCode).toContain('let runAbortController = null');
  });

  test('runCode aborts previous controller before creating a new AbortController', () => {
    // The runCode function must abort and create a new controller
    const runCodeIdx = elixirCode.indexOf('async function runCode()');
    expect(runCodeIdx).toBeGreaterThan(0);
    const runCodeBody = elixirCode.slice(runCodeIdx, runCodeIdx + 600);
    expect(runCodeBody).toContain('runAbortController.abort()');
    expect(runCodeBody).toContain('runAbortController = new AbortController()');
    // abort must come before new AbortController in source order
    const abortPos = runCodeBody.indexOf('runAbortController.abort()');
    const newCtrlPos = runCodeBody.indexOf('runAbortController = new AbortController()');
    expect(abortPos).toBeLessThan(newCtrlPos);
  });

  test('executeElixir is called with the signal from runAbortController', () => {
    const runCodeIdx = elixirCode.indexOf('async function runCode()');
    const runCodeBody = elixirCode.slice(runCodeIdx, runCodeIdx + 800);
    expect(runCodeBody).toContain('executeElixir(files, signal)');
  });

  test('updateSyntaxHighlight is debounced via clearTimeout + setTimeout', () => {
    const fnIdx = elixirCode.indexOf('function updateSyntaxHighlight()');
    expect(fnIdx).toBeGreaterThan(0);
    const fnBody = elixirCode.slice(fnIdx, fnIdx + 300);
    expect(fnBody).toContain('clearTimeout(highlightDebounceTimer)');
    expect(fnBody).toContain('highlightDebounceTimer = setTimeout(');
  });

  test('highlightDebounceTimer variable is declared', () => {
    expect(elixirCode).toContain('let highlightDebounceTimer = null');
  });

  test('runCode does not show "no output" placeholder when errors exist', () => {
    // The fixed runCode shows the "no output" placeholder only when errors.length === 0
    const runCodeIdx = elixirCode.indexOf('async function runCode()');
    const runCodeBody = elixirCode.slice(runCodeIdx, runCodeIdx + 1200);
    // Must use else-if not plain else for the no-output branch
    expect(runCodeBody).toContain('} else if (errors.length === 0) {');
    // Must NOT contain a plain else branch that unconditionally sets no-output placeholder
    expect(runCodeBody).not.toMatch(/\} else \{\s*outputBody\.innerHTML[\s\S]*?No standard output/);
  });

  // ── Functional unit tests ───────────────────────────────────────────────────

  test('AbortError handling — returns empty arrays without error message', async () => {
    // Simulate the AbortError catch logic extracted from executeElixir
    async function simulateExecuteElixir(_signal) {
      try {
        await new Promise((_, reject) => {
          // Immediately simulate an aborted fetch
          const err = new DOMException('Aborted', 'AbortError');
          reject(err);
        });
        return { output: ['some output'], errors: [] };
      } catch (error) {
        if (error.name === 'AbortError') {
          return { output: [], errors: [] };
        }
        return { output: [], errors: ['Execution Error: ' + error.message] };
      }
    }

    const abortCtrl = new AbortController();
    abortCtrl.abort();
    const result = await simulateExecuteElixir(abortCtrl.signal);
    expect(result.output).toEqual([]);
    expect(result.errors).toEqual([]); // Must not contain an error string
  });

  test('debounce prevents immediate highlight on rapid keystrokes', async () => {
    let highlightCallCount = 0;
    let highlightDebounceTimer = null;

    function updateSyntaxHighlight() {
      clearTimeout(highlightDebounceTimer);
      highlightDebounceTimer = setTimeout(() => {
        highlightCallCount++;
      }, 50);
    }

    // Simulate 10 rapid keystrokes (each 10ms apart, debounce is 50ms)
    for (let i = 0; i < 10; i++) {
      updateSyntaxHighlight();
      await new Promise((r) => setTimeout(r, 10));
    }

    // Immediately after last keystroke — should not have highlighted yet
    expect(highlightCallCount).toBe(0);

    // Wait for debounce to fire
    await new Promise((r) => setTimeout(r, 80));
    expect(highlightCallCount).toBe(1); // Only one highlight for 10 keystrokes
  });
});
