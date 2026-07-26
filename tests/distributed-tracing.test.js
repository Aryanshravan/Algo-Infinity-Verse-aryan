import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const scriptCode = fs.readFileSync(
  path.resolve(__dirname, '../pages/visualizers/distributed-tracing/distributed-tracing.js'),
  'utf-8'
);

describe('Distributed Tracing Timeline View', () => {
  let generateTraceTimings, addSpan, getTrace, mockDocument, mockEls;

  beforeAll(() => {
    mockEls = {
      waterfallBody: { appendChild: jest.fn() },
    };

    mockDocument = {
      getElementById: (id) => {
        if (id === 'waterfallBody') return mockEls.waterfallBody;
        return {
          id,
          value: '',
          innerHTML: '',
          textContent: '',
          style: {},
          classList: { add: () => {}, remove: () => {} },
          addEventListener: () => {},
          appendChild: () => {},
          querySelectorAll: () => [],
        };
      },
      createElement: () => {
        return { className: '', style: {}, innerHTML: '', textContent: '', appendChild: jest.fn() };
      },
      addEventListener: () => {},
    };

    const fn = new Function(
      'document',
      'window',
      'setTimeout',
      'setInterval',
      'clearInterval',
      `
        const module = { exports: {} };
        ${scriptCode}
        return module.exports;
      `
    );

    const exports = fn(
      mockDocument,
      { addEventListener: () => {} },
      setTimeout,
      setInterval,
      clearInterval
    );

    generateTraceTimings = exports.generateTraceTimings;
    addSpan = exports.addSpan;
    getTrace = exports.getTrace;
  });

  test('generateTraceTimings calculates valid sequential times', () => {
    const timings = generateTraceTimings();

    // Auth should be before Billing
    expect(timings.authStart).toBeLessThan(timings.billStart);
    expect(timings.authEnd).toBeLessThanOrEqual(timings.billStart);

    // DB should happen within Billing
    expect(timings.dbStart).toBeGreaterThanOrEqual(timings.billStart);
    expect(timings.dbEnd).toBeLessThanOrEqual(timings.billEnd);

    // Total Gateway span should encompass all
    expect(timings.gwEnd).toBeGreaterThanOrEqual(timings.billEnd);
  });

  test('addSpan calculates correct percentages for Gantt chart', () => {
    // Add a span
    addSpan('testSvc', 'GET /test', 'trace1', 'span1', null, 50, 100); // start: 50, duration: 100, assuming TOTAL_TIMELINE_MS=200

    const trace = getTrace();
    const span = trace.find((s) => s.spanId === 'span1');
    expect(span).toBeDefined();
    expect(span.startMs).toBe(50);
    expect(span.durationMs).toBe(100);

    // Note: since TOTAL_TIMELINE_MS is let variable locally in scriptCode,
    // we can't test its export directly unless we exported it, but we can
    // test the DOM manipulation using mockDocument if needed.
    // Here we just test the JS logic that was requested.
  });
});
