import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const scriptCode = fs.readFileSync(
  path.resolve(
    __dirname,
    '../pages/visualizers/consistent-hashing-simulator/consistent-hashing-simulator.js'
  ),
  'utf-8'
);

describe('Consistent Hashing Simulator Variance Chart', () => {
  let mockDocument;
  let mockEls;
  let moduleExports;

  beforeEach(() => {
    mockEls = {
      'add-node-btn': { addEventListener: jest.fn(), click: jest.fn() },
      'remove-node-btn': { addEventListener: jest.fn(), click: jest.fn() },
      'route-key-btn': { addEventListener: jest.fn(), click: jest.fn() },
      'key-input': { value: '' },
      'logs-area': { appendChild: jest.fn() },
      'ring-container': { appendChild: jest.fn() },
      'stat-nodes': { textContent: '' },
      'stat-keys': { textContent: '' },
      'variance-chart': { innerHTML: '', appendChild: jest.fn() },
      'variance-stats': { textContent: '' },
    };

    mockDocument = {
      addEventListener: jest.fn((event) => {
        if (event === 'DOMContentLoaded') {
          // Store it so we can call it if needed, or we just rely on script execution
        }
      }),
      getElementById: (id) => mockEls[id],
      createElement: () => ({
        style: {},
        appendChild: jest.fn(),
        classList: { add: jest.fn(), remove: jest.fn() },
      }),
    };

    const fn = new Function(
      'document',
      'window',
      'setTimeout',
      'alert',
      `
        const module = { exports: {} };
        ${scriptCode}
        return module.exports;
      `
    );

    moduleExports = fn(mockDocument, {}, setTimeout, jest.fn());
  });

  test('findTargetNode finds correct node on the ring', () => {
    const nodes = [
      { id: 1, angle: 100 },
      { id: 2, angle: 200 },
      { id: 3, angle: 300 },
    ];

    expect(moduleExports.findTargetNode(50, nodes).id).toBe(1);
    expect(moduleExports.findTargetNode(150, nodes).id).toBe(2);
    expect(moduleExports.findTargetNode(250, nodes).id).toBe(3);

    // Wraparound
    expect(moduleExports.findTargetNode(350, nodes).id).toBe(1);
  });
});
