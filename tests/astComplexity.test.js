import { analyzeComplexity } from '../modules/complexity-analyzer.js';

describe('AST Complexity Analyzer - Memoization & Async Generator Support', () => {
  test('correctly identifies memoized DP recursion as O(n) instead of O(2ⁿ)', () => {
    const memoizedFib = `
      function fib(n, memo = {}) {
        if (n <= 1) return n;
        if (memo[n] !== undefined) return memo[n];
        memo[n] = fib(n - 1, memo) + fib(n - 2, memo);
        return memo[n];
      }
    `;
    const res = analyzeComplexity(memoizedFib);
    expect(res.isRecursive).toBe(true);
    expect(res.hasMemoization).toBe(true);
    expect(res.complexity).toBe('O(n)');
  });

  test('parses async generator functions without parse errors', () => {
    const asyncGenCode = `
      async function* pipeline(data) {
        for (const item of data) {
          yield item * 2;
        }
      }
    `;
    const res = analyzeComplexity(asyncGenCode);
    expect(res.hasAsyncGenerators).toBe(true);
    expect(res.complexity).toBe('O(n)');
  });
});
