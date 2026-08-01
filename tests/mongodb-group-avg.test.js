import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const scriptCode = fs.readFileSync(
  path.resolve(__dirname, '../pages/mongodb-academy/script.js'),
  'utf-8'
);

describe('MongoDB $group Average Fix (Issue #3023)', () => {
  let processGroupStage;

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
        '; if (typeof processGroupStage !== "undefined") { module.exports.processGroupStage = processGroupStage; }'
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
    processGroupStage = mockModule.exports.processGroupStage;

    if (!processGroupStage) {
      throw new Error('Could not extract processGroupStage from script.js');
    }
  });

  test('processGroupStage computes averages correctly for multiple $avg fields without sharing a counter', () => {
    const data = [
      { category: 'A', price: 10, rating: 4 },
      { category: 'A', price: 20, rating: 5 },
      { category: 'B', price: 30, rating: 3 },
    ];

    const groupExpr = {
      _id: '$category',
      meanCost: { $avg: '$price' },
      avgRating: { $avg: '$rating' },
    };

    const result = processGroupStage(groupExpr, data);

    const groupA = result.find((g) => g._id === 'A');
    expect(groupA).toBeDefined();
    expect(groupA.meanCost).toBe(15);
    expect(groupA.avgRating).toBe(4.5);

    const groupB = result.find((g) => g._id === 'B');
    expect(groupB.meanCost).toBe(30);
    expect(groupB.avgRating).toBe(3);
  });

  test('processGroupStage correctly calculates minimum and maximum even when starting at 0 or initialized', () => {
    const data = [
      { category: 'A', val: 5 },
      { category: 'A', val: -2 },
      { category: 'A', val: 10 },
    ];

    const groupExpr = {
      _id: '$category',
      minVal: { $min: '$val' },
      maxVal: { $max: '$val' },
    };

    const result = processGroupStage(groupExpr, data);

    const groupA = result.find((g) => g._id === 'A');
    expect(groupA.minVal).toBe(-2);
    expect(groupA.maxVal).toBe(10);
  });
});
