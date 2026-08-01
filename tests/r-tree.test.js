import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rtCode = fs.readFileSync(
  path.resolve(__dirname, '../pages/visualizers/r-tree/r-tree.js'),
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
    strokeRect: () => {},
    fillRect: () => {},
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
    if (id === 'rtCanvas') return mockCanvas;
    return {
      value: '3',
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
  const fn = new Function('module', 'exports', 'document', 'window', 'rtCode', rtCode);
  fn(mockModule, mockModule.exports, mockDocument, { addEventListener: () => {} });
  return mockModule.exports;
}

describe('R-Tree Spatial Index Unit Tests', () => {
  let mod;

  beforeEach(() => {
    mod = loadModule();
  });

  test('MBR operations compute correctly', () => {
    const { mbrArea, mbrUnion, mbrOverlaps } = mod;

    const m1 = { minX: 10, minY: 10, maxX: 30, maxY: 30 };
    const m2 = { minX: 20, minY: 20, maxX: 40, maxY: 40 };

    expect(mbrArea(m1)).toBe(400); // 20 * 20
    expect(mbrUnion(m1, m2)).toEqual({ minX: 10, minY: 10, maxX: 40, maxY: 40 });
    expect(mbrOverlaps(m1, m2)).toBe(true);

    const m3 = { minX: 50, minY: 50, maxX: 60, maxY: 60 };
    expect(mbrOverlaps(m1, m3)).toBe(false);
  });

  test('RTreeNode initializes properly', () => {
    const { RTreeNode } = mod;
    const node = new RTreeNode(true);
    expect(node.isLeaf).toBe(true);
    expect(node.children).toEqual([]);
    expect(node.parent).toBeNull();
  });

  test('R-Tree basic insertion, quadratic split, and depth query', () => {
    const { RTree } = mod;
    const tree = new RTree(3); // M = 3

    // Insert 4 rectangles (must trigger split since M=3)
    tree.insert({ id: 1, x: 10, y: 10, w: 20, h: 20 });
    tree.insert({ id: 2, x: 15, y: 15, w: 20, h: 20 });
    tree.insert({ id: 3, x: 100, y: 100, w: 20, h: 20 });
    tree.insert({ id: 4, x: 105, y: 105, w: 20, h: 20 });

    // Verify split happened and height of tree is 2 (root node has 2 children)
    const levels = tree.getNodesByDepth();
    expect(levels.length).toBe(2);
    expect(tree.root.isLeaf).toBe(false);
    expect(tree.root.children.length).toBe(2); // Two children representing split nodes
  });
});
