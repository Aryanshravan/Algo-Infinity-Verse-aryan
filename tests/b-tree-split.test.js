import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const scriptCode = fs.readFileSync(
  path.resolve(__dirname, '../pages/visualizers/b-tree-visualizer/b-tree-visualizer.js'),
  'utf-8'
);

describe('B-Tree Bug 3041', () => {
  let BTree;

  beforeAll(() => {
    const mockDocument = {
      getElementById: (id) => ({
        id,
        value: '2',
        innerHTML: '',
        textContent: '',
        style: {},
        classList: { add: () => {}, remove: () => {} },
        addEventListener: () => {},
        appendChild: () => {},
        querySelectorAll: () => [],
      }),
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: () => ({ classList: { add: () => {} }, appendChild: () => {} }),
      createElementNS: () => ({ setAttribute: () => {} }),
      body: { appendChild: () => {}, style: {} },
      addEventListener: () => {},
    };

    const fn = new Function(
      'document',
      'window',
      'setTimeout',
      'setInterval',
      'clearInterval',
      scriptCode + '; return { BTree, BTreeNode };'
    );

    const exports = fn(
      mockDocument,
      { addEventListener: () => {} },
      setTimeout,
      setInterval,
      clearInterval
    );

    BTree = exports.BTree;
  });

  test('Split does not leave duplicate keys in captured steps', () => {
    const tree = new BTree(2);
    const steps = [];
    const cloneTree = (root) => JSON.parse(JSON.stringify(root));
    const captureStep = (message, extras = {}) => {
      steps.push({
        tree: cloneTree(tree.root),
        message,
        promotedKey: extras.promotedKey,
      });
    };

    tree.insert(10, captureStep);
    tree.insert(20, captureStep);
    tree.insert(30, captureStep);
    tree.insert(40, captureStep); // This should cause a root split!

    // Check the split step
    const splitStep = steps.find((s) => s.message.startsWith('Splitting node'));
    expect(splitStep).toBeDefined();

    // In the split step, the promoted key should not be in the child
    // Since it's a root split, the root has [20], and children have [10] and [30]
    expect(splitStep.tree.keys).toEqual([20]);
    expect(splitStep.tree.children[0].keys).toEqual([10]);
    expect(splitStep.tree.children[1].keys).toEqual([30]);
  });
});
