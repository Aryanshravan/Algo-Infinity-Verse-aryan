import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const lctCode = fs.readFileSync(
  path.resolve(__dirname, '../pages/visualizers/link-cut-tree/link-cut-tree.js'),
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
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    font: '',
    textAlign: '',
    textBaseline: '',
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
    if (id === 'forestCanvas' || id === 'splayCanvas') return mockCanvas;
    return {
      value: '8',
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
  const fn = new Function('module', 'exports', 'document', 'window', 'lctCode', lctCode);
  fn(mockModule, mockModule.exports, mockDocument, { addEventListener: () => {} });
  return mockModule.exports;
}

describe('Link-Cut Tree Algorithm Unit Tests', () => {
  let mod;

  beforeEach(() => {
    mod = loadModule();
  });

  test('LCTNode initializes properly', () => {
    const { LCTNode } = mod;
    const node = new LCTNode(5, 42);
    expect(node.id).toBe(5);
    expect(node.val).toBe(42);
    expect(node.sum).toBe(42);
    expect(node.parent).toBeNull();
    expect(node.left).toBeNull();
    expect(node.right).toBeNull();
    expect(node.reversed).toBe(false);
  });

  test('LinkCutTree initializes V nodes with correct defaults', () => {
    const { LinkCutTree } = mod;
    const tree = new LinkCutTree(8);
    expect(tree.nodes.length).toBe(9); // 1-indexed
    expect(tree.nodes[1].id).toBe(1);
    expect(tree.nodes[8].id).toBe(8);
    expect(tree.adj.length).toBe(9);
    expect(tree.adj[1]).toEqual([]);
  });

  test('Basic Link, Cut, and FindRoot operations', () => {
    const { LinkCutTree } = mod;
    const tree = new LinkCutTree(5);

    // Initial state: all in separate components
    expect(tree.findRoot(tree.nodes[1]).id).toBe(1);
    expect(tree.findRoot(tree.nodes[2]).id).toBe(2);

    // Link 1 -> 2
    let linked = tree.link(tree.nodes[1], tree.nodes[2]);
    expect(linked).toBe(true);
    expect(tree.findRoot(tree.nodes[1]).id).toBe(2);

    // Link 2 -> 3
    linked = tree.link(tree.nodes[2], tree.nodes[3]);
    expect(linked).toBe(true);
    expect(tree.findRoot(tree.nodes[1]).id).toBe(3);

    // Try linking 1 -> 3 (causes cycle, should return false)
    linked = tree.link(tree.nodes[1], tree.nodes[3]);
    expect(linked).toBe(false);

    // Cut 2
    let cut = tree.cut(tree.nodes[2]);
    expect(cut).toBe(true);

    // 1 is in its own component {1}; 2 and 3 are in {2, 3} rooted at 2
    expect(tree.findRoot(tree.nodes[1]).id).toBe(1);
    expect(tree.findRoot(tree.nodes[3]).id).toBe(2);
  });

  test('Path Query returns correct sum along represent tree paths', () => {
    const { LinkCutTree } = mod;
    const tree = new LinkCutTree(6);

    // Link path: 1 - 2 - 3 - 4
    tree.link(tree.nodes[1], tree.nodes[2]);
    tree.link(tree.nodes[2], tree.nodes[3]);
    tree.link(tree.nodes[3], tree.nodes[4]);

    // Nodes default values are equal to their ID.
    // Path 1 to 4 should sum: 1 + 2 + 3 + 4 = 10
    let sum = tree.queryPath(tree.nodes[1], tree.nodes[4]);
    expect(sum).toBe(10);

    // Path 2 to 3 should sum: 2 + 3 = 5
    sum = tree.queryPath(tree.nodes[2], tree.nodes[3]);
    expect(sum).toBe(5);

    // Disconnected query: 1 to 5 (should return null)
    sum = tree.queryPath(tree.nodes[1], tree.nodes[5]);
    expect(sum).toBeNull();
  });
});
