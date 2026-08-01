import { runUserCode } from '../backend/jsSandboxRunner.js';

describe('jsSandboxRunner - Resource Cleanup & Protection', () => {
  test('rejects empty or overly long source code', async () => {
    const emptyRes = await runUserCode({ language: 'javascript', sourceCode: '' });
    expect(emptyRes.ok).toBe(false);
    expect(emptyRes.error).toContain('Source code must be a non-empty string');

    const hugeCode = 'console.log("hello");'.repeat(3000);
    const hugeRes = await runUserCode({ language: 'javascript', sourceCode: hugeCode });
    expect(hugeRes.ok).toBe(false);
    expect(hugeRes.error).toContain('exceeds maximum length');
  });

  test('rejects more than 20 test cases', async () => {
    const tests = Array(25).fill({ input: '1', expectedOutput: '1' });
    const res = await runUserCode({
      language: 'javascript',
      sourceCode: 'function solve(x){return x;}',
      tests,
    });
    expect(res.ok).toBe(false);
    expect(res.error).toContain('Exceeded maximum allowed test cases');
  });
});
