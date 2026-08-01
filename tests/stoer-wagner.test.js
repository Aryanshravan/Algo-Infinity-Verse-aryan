import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const swCode = fs.readFileSync(
  path.resolve(__dirname, '../pages/visualizers/stoer-wagner/stoer-wagner.js'),
  'utf-8'
);

// Mock DOM elements
const mockCanvas = {
  getContext: () => ({
    clearRect: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    fillText: () => {},
    setLineDash: () => {},
  }),
  width: 800,
  height: 400,
  clientWidth: 800,
  clientHeight: 400,
  parentElement: { clientWidth: 800, clientHeight: 400 },
  addEventListener: () => {},
};

const mockDocument = {
  addEventListener: () => {},
  getElementById: (id) => {
    if (id === 'swCanvas') return mockCanvas;
    return {
      value: 'simple',
      addEventListener: () => {},
      innerHTML: '',
      className: '',
      classList: { add: () => {}, remove: () => {} },
      style: {},
      innerText: '',
      textContent: '',
      appendChild: () => {},
      options: { length: 0 },
      selectedIndex: 0,
    };
  },
  querySelectorAll: () => [],
};

function loadModule() {
  const mockModule = { exports: {} };
  const fn = new Function('module', 'exports', 'document', 'window', 'swCode', swCode);
  fn(mockModule, mockModule.exports, mockDocument, { addEventListener: () => {} });
  return mockModule.exports;
}

describe('Stoer-Wagner Algorithm Unit Tests', () => {
  let mod;

  beforeEach(() => {
    mod = loadModule();
  });

  test('Graph methods modify adjacency correctly', () => {
    const { Graph } = mod;
    const g = new Graph();

    const n1 = g.addNode(10, 10);
    const n2 = g.addNode(20, 20);

    expect(g.nodes.length).toBe(2);
    expect(n1.id).toBe(1);
    expect(n2.id).toBe(2);

    g.addEdge(1, 2, 5);
    expect(g.edges.length).toBe(1);
    expect(g.getWeight(1, 2)).toBe(5);

    g.addEdge(1, 2, 8); // Update weight
    expect(g.getWeight(1, 2)).toBe(8);

    g.removeEdge(1, 2);
    expect(g.getWeight(1, 2)).toBe(0);
  });

  test('Stoer-Wagner solver finds the global minimum cut correctly', () => {
    const { Graph, StoerWagnerSolver } = mod;
    const g = new Graph();

    const n1 = g.addNode(100, 100);
    const n2 = g.addNode(200, 100);
    const n3 = g.addNode(200, 200);
    const n4 = g.addNode(100, 200);

    // K4 graph with custom weights
    g.addEdge(n1.id, n2.id, 2);
    g.addEdge(n2.id, n3.id, 3);
    g.addEdge(n3.id, n4.id, 2);
    g.addEdge(n4.id, n1.id, 3);
    g.addEdge(n1.id, n3.id, 1);
    g.addEdge(n2.id, n4.id, 1);

    const solver = new StoerWagnerSolver(g);
    solver.solve();

    expect(solver.solved).toBe(true);
    expect(solver.minCutWeight).toBe(6);
    expect(solver.bestPartition).toBeDefined();
  });
});
