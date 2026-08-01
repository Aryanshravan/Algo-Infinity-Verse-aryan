import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pstCode = fs.readFileSync(
  path.resolve(
    __dirname,
    '../pages/visualizers/persistent-segment-tree-visualizer/persistent-segment-tree-visualizer.js'
  ),
  'utf-8'
);

// Minimal DOM stubs needed to run the PST module
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
  getElementById: (id) => {
    if (id === 'treeCanvas' || id === 'pstHeroCanvas') return mockCanvas;
    return {
      value: '200',
      addEventListener: () => {},
      innerHTML: '',
      className: '',
      classList: { add: () => {}, remove: () => {} },
      style: {},
      innerText: '',
      textContent: '',
      prepend: () => {},
      appendChild: () => {},
    };
  },
  querySelectorAll: () => [],
};

function loadModule() {
  const mockModule = { exports: {} };
  const fn = new Function(
    'module',
    'exports',
    'document',
    'window',
    'requestAnimationFrame',
    pstCode
  );
  fn(mockModule, mockModule.exports, mockDocument, { addEventListener: () => {} }, () => {});
  return mockModule.exports;
}

describe('Persistent Segment Tree - GC Memory Leak Fix (Issue #3014)', () => {
  let mod;

  beforeEach(() => {
    mod = loadModule();
    mod.resetVis();
  });

  test('PSTNode registers in versionNewNodes instead of a global accumulator', () => {
    const { PSTNode, getVersionNewNodes } = mod;
    const node = new PSTNode(0, 7, 42, 0);
    const vnn = getVersionNewNodes();
    expect(vnn[0]).toBeDefined();
    expect(vnn[0].has(node.id)).toBe(true);
  });

  test('buildEmpty creates full tree and all node IDs appear in versionNewNodes[0]', () => {
    const { buildEmpty, getVersionNewNodes, N } = mod;
    const root = buildEmpty(0, N - 1, 0, Array(N).fill(0));
    const vnn = getVersionNewNodes();
    expect(vnn[0]).toBeDefined();
    // Full binary tree of N leaves has 2*N - 1 nodes
    expect(vnn[0].size).toBe(2 * N - 1);
    expect(vnn[0].has(root.id)).toBe(true);
  });

  test('update creates exactly log2(N)+1 new nodes for a point update', () => {
    const { buildEmpty, update, getVersionNewNodes, N } = mod;
    const root = buildEmpty(0, N - 1, 0, Array(N).fill(0));
    const newRoot = update(root, 0, N - 1, 3, 5, 1, 'standard');
    const vnn = getVersionNewNodes();
    expect(vnn[1]).toBeDefined();
    // PST point update creates depth+1 new nodes = log2(N)+1 = 4 for N=8
    const expectedNewNodes = Math.floor(Math.log2(N)) + 1;
    expect(vnn[1].size).toBe(expectedNewNodes);
    expect(vnn[1].has(newRoot.id)).toBe(true);
    // Old root must NOT be in new version registry
    expect(vnn[1].has(root.id)).toBe(false);
  });

  test('layoutTree traverses only reachable nodes and populates nodeLayout', () => {
    const { buildEmpty, layoutTree, getNodeLayout, N } = mod;
    const root = buildEmpty(0, N - 1, 0, Array(N).fill(0));
    layoutTree([root]);
    const layout = getNodeLayout();
    // Full tree of N=8 has 15 nodes
    expect(Object.keys(layout).length).toBe(2 * N - 1);
    expect(layout[root.id]).toBeDefined();
    // Root at depth 0: y = 50 + 0*(350/4) = 50
    expect(layout[root.id].y).toBe(50);
  });

  test('layoutTree with multiple version roots deduplicates shared nodes', () => {
    const { buildEmpty, update, layoutTree, getNodeLayout, N } = mod;
    const root0 = buildEmpty(0, N - 1, 0, Array(N).fill(0));
    const root1 = update(root0, 0, N - 1, 2, 7, 1, 'standard');
    layoutTree([root0, root1]);
    const layout = getNodeLayout();
    // 15 initial + 4 new from update = 19 unique nodes (shared subtrees not duplicated)
    expect(Object.keys(layout).length).toBe(2 * N - 1 + Math.floor(Math.log2(N)) + 1);
  });

  test('resetVis clears versionNewNodes so prior nodes become GC-eligible', () => {
    const { buildEmpty, getVersionNewNodes, N, resetVis } = mod;
    buildEmpty(0, N - 1, 0, Array(N).fill(0));
    let vnn = getVersionNewNodes();
    expect(vnn.length).toBeGreaterThan(0);

    resetVis();
    vnn = getVersionNewNodes();
    // After reset, versionNewNodes array should be empty
    expect(vnn.length).toBe(0);
  });

  test('source code does not contain global allNodes.push accumulation', () => {
    // Regression guard: ensure global accumulation was not re-introduced
    expect(pstCode).not.toContain('allNodes.push(this)');
    expect(pstCode).toContain('versionNewNodes');
  });
});
