import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const scriptCode = fs.readFileSync(
  path.resolve(__dirname, '../pages/mongodb-academy/script.js'),
  'utf-8'
);

describe('MongoDB $graphLookup Simulation (Issue #3025)', () => {
  let processGraphLookupStage;

  beforeAll(() => {
    const mockModule = { exports: {} };
    const mockDocument = {
      getElementById: () => ({
        value: '',
        innerHTML: '',
        style: {},
        classList: { add: () => {}, remove: () => {} },
        addEventListener: () => {},
      }),
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: () => ({ classList: { add: () => {} }, appendChild: () => {} }),
      body: { appendChild: () => {}, style: {} },
      addEventListener: () => {},
    };

    const fn = new Function(
      'module',
      'exports',
      'document',
      'window',
      'requestAnimationFrame',
      'location',
      'localStorage',
      scriptCode +
        '; if (typeof processGraphLookupStage !== "undefined") { module.exports.processGraphLookupStage = processGraphLookupStage; }'
    );
    fn(
      mockModule,
      mockModule.exports,
      mockDocument,
      {
        addEventListener: () => {},
        scrollY: 0,
        scrollTo: () => {},
        matchMedia: () => ({ matches: false }),
      },
      () => {},
      { pathname: '/', search: '', hash: '' },
      { getItem: () => null, setItem: () => {} }
    );
    processGraphLookupStage = mockModule.exports.processGraphLookupStage;

    if (!processGraphLookupStage) {
      throw new Error('Could not extract processGraphLookupStage from script.js');
    }
  });

  test('BFS traversal works for management chain', () => {
    const data = [{ name: 'Alice' }];
    const mockDB = {
      employees: [
        { _id: 'e1', name: 'Alice', reportsTo: null },
        { _id: 'e2', name: 'Bob', reportsTo: 'Alice' },
        { _id: 'e3', name: 'Carol', reportsTo: 'Bob' },
      ],
    };

    const expr = {
      from: 'employees',
      startWith: '$name',
      connectFromField: 'name',
      connectToField: 'reportsTo',
      as: 'chain',
      maxDepth: 5,
      depthField: 'level',
    };

    const result = processGraphLookupStage(expr, data, mockDB);
    expect(result[0].chain).toHaveLength(2); // Bob, Carol

    const bob = result[0].chain.find((e) => e.name === 'Bob');
    const carol = result[0].chain.find((e) => e.name === 'Carol');

    expect(bob.level).toBe(0);
    expect(carol.level).toBe(1);
  });

  test('Cycle detection prevents infinite loops', () => {
    const data = [{ name: 'A' }];
    const mockDB = {
      friends: [
        { _id: '1', name: 'A', friendOf: 'C' },
        { _id: '2', name: 'B', friendOf: 'A' },
        { _id: '3', name: 'C', friendOf: 'B' },
      ],
    };

    const expr = {
      from: 'friends',
      startWith: '$name',
      connectFromField: 'name',
      connectToField: 'friendOf',
      as: 'network',
      maxDepth: 10,
    };

    const result = processGraphLookupStage(expr, data, mockDB);
    // Should resolve without infinite looping
    expect(result[0].network).toHaveLength(3); // B, C, and A again (since C is friend of A)
  });
});
