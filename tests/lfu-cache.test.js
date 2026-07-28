import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scriptCode = fs.readFileSync(
  path.resolve(__dirname, '../pages/visualizers/lfu-cache/lfu-cache.js'),
  'utf-8'
);

describe('LFU Cache Simulator', () => {
  let mockDocument;
  let visualizer;

  beforeEach(() => {
    mockDocument = {
      getElementById: (_id) => ({
        value: '1',
        innerHTML: '',
        innerText: '',
        style: {},
        classList: { add: jest.fn(), remove: jest.fn() },
        appendChild: jest.fn(),
        querySelector: () => ({ innerText: '' }),
        getBoundingClientRect: () => ({ top: 0, height: 100 }),
        remove: jest.fn(),
        addEventListener: jest.fn(),
      }),
      createElement: () => ({
        className: '',
        innerHTML: '',
        style: {},
        classList: { add: jest.fn(), remove: jest.fn() },
        appendChild: jest.fn(),
        querySelector: () => ({ innerText: '' }),
        getBoundingClientRect: () => ({ top: 0, height: 100 }),
        remove: jest.fn(),
      }),
      addEventListener: jest.fn(),
    };

    global.window = { addEventListener: jest.fn() };

    const fn = new Function(
      'document',
      'window',
      'setTimeout',
      'clearTimeout',
      `
        ${scriptCode}
        return LFUVisualizer;
      `
    );

    const LFUVisualizer = fn(mockDocument, global.window, setTimeout, clearTimeout);

    // Mock UI functions that might be missing or rely on DOM too heavily
    LFUVisualizer.prototype.highlightCode = jest.fn();
    LFUVisualizer.prototype.updateMath = jest.fn();
    LFUVisualizer.prototype.updateStatus = jest.fn();

    visualizer = new LFUVisualizer();
    visualizer.capacity = 2; // small capacity to force eviction easily
  });

  test('Evicts LRU tie-breaker correctly', () => {
    // Put 1
    const p1 = visualizer.putAlgo(1, 100);
    while (!p1.next().done) {
      /* continue generator */
    }
    expect(visualizer.keyMap.has(1)).toBe(true);
    expect(visualizer.keyMap.get(1).timestamp).toBe(1);

    // Put 2
    const p2 = visualizer.putAlgo(2, 200);
    while (!p2.next().done) {
      /* continue generator */
    }
    expect(visualizer.keyMap.has(2)).toBe(true);
    expect(visualizer.keyMap.get(2).timestamp).toBe(2);

    // Both freq = 1, but 1 is older (t=1 vs t=2)

    // Put 3 -> Evicts 1
    const p3 = visualizer.putAlgo(3, 300);
    while (!p3.next().done) {
      /* continue generator */
    }

    expect(visualizer.keyMap.has(1)).toBe(false); // evicted
    expect(visualizer.keyMap.has(2)).toBe(true);
    expect(visualizer.keyMap.has(3)).toBe(true);
    expect(visualizer.keyMap.get(3).timestamp).toBe(3);
  });

  test('Get updates timestamp (LRU)', () => {
    // Put 1
    let p = visualizer.putAlgo(1, 100);
    while (!p.next().done) {
      /* continue generator */
    }

    // Put 2
    p = visualizer.putAlgo(2, 200);
    while (!p.next().done) {
      /* continue generator */
    }

    // Get 1 -> Promotes to freq 2, and updates timestamp to 3
    let g = visualizer.getAlgo(1, false);
    while (!g.next().done) {
      /* continue generator */
    }
    expect(visualizer.keyMap.get(1).timestamp).toBe(3);
    expect(visualizer.keyMap.get(1).freq).toBe(2);
  });
});
