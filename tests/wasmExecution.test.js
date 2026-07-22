import fs from 'fs';
import path from 'path';
import { isWasmSupported, executeWasmPython, executeWasmCpp } from '../modules/wasm-executor.js';

describe('Client-Side WebAssembly Execution Engine Unit Tests', () => {
  const wasmModulePath = path.join(process.cwd(), 'modules/wasm-executor.js');
  const playgroundJsPath = path.join(process.cwd(), 'Playground/playground.js');
  const playgroundHtmlPath = path.join(process.cwd(), 'Playground/playground.html');
  const swJsPath = path.join(process.cwd(), 'sw.js');

  test('WASM module file exists', () => {
    expect(fs.existsSync(wasmModulePath)).toBe(true);
  });

  test('isWasmSupported returns boolean', () => {
    expect(typeof isWasmSupported()).toBe('boolean');
  });

  test('executeWasmPython rejects empty input', async () => {
    await expect(executeWasmPython('')).rejects.toThrow('Source code must be a non-empty string.');
    await expect(executeWasmPython(null)).rejects.toThrow(
      'Source code must be a non-empty string.'
    );
  });

  test('executeWasmCpp rejects empty input', async () => {
    await expect(executeWasmCpp('')).rejects.toThrow('Source code must be a non-empty string.');
    await expect(executeWasmCpp(null)).rejects.toThrow('Source code must be a non-empty string.');
  });

  test('playground.js imports wasm-executor and integrates WASM runners', () => {
    const jsContent = fs.readFileSync(playgroundJsPath, 'utf8');
    expect(jsContent).toContain("from '../modules/wasm-executor.js'");
    expect(jsContent).toContain('executeWasmPython');
    expect(jsContent).toContain('executeWasmCpp');
    expect(jsContent).toContain('isWasmSupported');
    expect(jsContent).toContain('⚡ Initializing Pyodide WASM Engine...');
    expect(jsContent).toContain('⚡ Initializing C++ WASM Engine...');
  });

  test('playground.html includes WASM status badge', () => {
    const htmlContent = fs.readFileSync(playgroundHtmlPath, 'utf8');
    expect(htmlContent).toContain('id="wasmStatusBadge"');
    expect(htmlContent).toContain('WASM Engine Ready');
  });

  test('sw.js includes WASM caching strategy', () => {
    const swContent = fs.readFileSync(swJsPath, 'utf8');
    expect(swContent).toContain('/modules/wasm-executor.js');
    expect(swContent).toContain('cdn.jsdelivr.net');
    expect(swContent).toContain('algo-wasm-v1');
  });
});
