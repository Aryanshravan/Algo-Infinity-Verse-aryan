import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const searchEngineCode = fs.readFileSync(
  path.resolve(__dirname, '../utils/searchEngine.js'),
  'utf-8'
);
const scriptContext = { window: {}, module: { exports: {} } };
const DSASearchEngine = new Function(
  'window',
  'module',
  searchEngineCode +
    ';\nreturn window.DSASearchEngine || module.exports.DSASearchEngine || DSASearchEngine;'
)(scriptContext.window, scriptContext.module);

describe('DSASearchEngine', () => {
  let engine;
  const mockProblems = [
    {
      id: 1,
      title: 'Two Sum',
      description:
        'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
      difficulty: 'Easy',
      category: 'Arrays',
      tags: ['Array', 'Hash Table'],
      constraints: ['2 <= nums.length <= 104'],
    },
    {
      id: 2,
      title: 'Add Two Numbers',
      description:
        'You are given two non-empty linked lists representing two non-negative integers.',
      difficulty: 'Medium',
      category: 'Linked Lists',
      tags: ['Linked List', 'Math', 'Recursion'],
      constraints: ['The number of nodes in each linked list is in the range [1, 100].'],
    },
    {
      id: 3,
      title: 'Merge Two Sorted Lists',
      description: 'Merge two sorted linked lists and return it as a sorted list.',
      difficulty: 'Easy',
      category: 'Linked Lists',
      tags: ['Linked List', 'Recursion'],
      constraints: ['The number of nodes in both lists is in the range [0, 50].'],
    },
  ];

  beforeEach(() => {
    // Clear localStorage mock if we had one, but DSASearchEngine handles it via try-catch
    engine = new DSASearchEngine(mockProblems, 'test_index');
  });

  describe('tokenize()', () => {
    it('should tokenize text, removing stop words and non-alphanumeric chars', () => {
      const tokens = engine.tokenize('The quick brown fox jumps over the lazy dog.');
      // 'the' is a stop word, so it should be removed.
      // Expected tokens: quick, brown, fox, jumps, over, lazy, dog
      expect(tokens).toEqual(
        expect.arrayContaining(['quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog'])
      );
      expect(tokens).not.toContain('the');
    });

    it('should return empty array for empty or null text', () => {
      expect(engine.tokenize('')).toEqual([]);
      expect(engine.tokenize(null)).toEqual([]);
    });
  });

  describe('levenshteinDistance()', () => {
    it('should calculate correct distance between strings', () => {
      expect(engine.levenshteinDistance('kitten', 'sitting')).toBe(3);
      expect(engine.levenshteinDistance('flaw', 'lawn')).toBe(2);
      expect(engine.levenshteinDistance('test', 'test')).toBe(0);
    });
  });

  describe('search()', () => {
    it('should return all problems with score 0 for empty query', () => {
      const results = engine.search('');
      expect(results.length).toBe(3);
      expect(results[0].score).toBe(0);
    });

    it('should rank exact title matches highest', () => {
      const results = engine.search('Two Sum');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title).toBe('Two Sum'); // ID 1
    });

    it('should find partial matches and apply fuzzy matching', () => {
      // 'sortd' instead of 'sorted'
      const results = engine.search('sortd list');
      expect(results.length).toBeGreaterThan(0);
      // Merge Two Sorted Lists should match
      const mergeListResult = results.find((r) => r.id === 3);
      expect(mergeListResult).toBeDefined();
      expect(mergeListResult.score).toBeGreaterThan(0);
    });

    it('should properly highlight text', () => {
      const results = engine.search('merge');
      const mergeResult = results.find((r) => r.id === 3);
      expect(mergeResult.highlightedTitle).toContain('<mark class="search-highlight">Merge</mark>');
    });
  });
});
