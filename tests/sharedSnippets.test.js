import {
  createSharedSnippet,
  getSharedSnippet,
  sharedSnippetUrl,
  __resetSharedSnippetMemoryForTests,
} from '../backend/controllers/sharedSnippets.js';

describe('Shared DSA Insight store', () => {
  beforeEach(() => {
    __resetSharedSnippetMemoryForTests();
  });

  it('creates a snippet with an 8-char url-safe id and a 7-day expiry', async () => {
    const snippet = await createSharedSnippet({
      language: 'javascript',
      title: 'Two Sum — O(n) hash map',
      code: 'function solve(input) { return input; }',
    });

    expect(snippet.id).toMatch(/^[a-z0-9]{8}$/);
    expect(snippet.language).toBe('javascript');
    expect(snippet.title).toBe('Two Sum — O(n) hash map');
    expect(snippet.createdAt).toBeGreaterThan(0);
    expect(snippet.expiresAt - snippet.createdAt).toBe(7 * 24 * 60 * 60 * 1000);
    expect(sharedSnippetUrl(snippet.id)).toBe(`/shared/${snippet.id}`);
  });

  it('round-trips a snippet through getSharedSnippet', async () => {
    const created = await createSharedSnippet({
      language: 'python',
      title: 'Binary search',
      code: 'def solve(input):\n    return input',
    });

    const fetched = await getSharedSnippet(created.id);
    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(created.id);
    expect(fetched.code).toContain('def solve');
    expect(fetched.title).toBe('Binary search');
  });

  it('returns null for unknown ids and invalid id shapes', async () => {
    expect(await getSharedSnippet('does-not-exist-123')).toBeNull();
    expect(await getSharedSnippet('')).toBeNull();
    expect(await getSharedSnippet(null)).toBeNull();
    expect(await getSharedSnippet('a/b')).toBeNull();
    expect(await getSharedSnippet('!!')).toBeNull();
  });

  it('rejects empty code', async () => {
    await expect(
      createSharedSnippet({ language: 'javascript', title: '', code: '   ' })
    ).rejects.toThrow(/empty/i);
  });

  it('returns null once a snippet expires', async () => {
    const snippet = await createSharedSnippet(
      { language: 'cpp', title: 'Expiring', code: 'int main(){return 0;}' },
      1
    );

    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(await getSharedSnippet(snippet.id)).toBeNull();
  });

  it('truncates language and title to safe bounds', async () => {
    const snippet = await createSharedSnippet({
      language: 'x'.repeat(100),
      title: 'y'.repeat(300),
      code: 'code()',
    });

    expect(snippet.language.length).toBeLessThanOrEqual(40);
    expect(snippet.title.length).toBeLessThanOrEqual(120);
  });

  it('generates unique ids across creations', async () => {
    const seen = new Set();
    for (let i = 0; i < 20; i++) {
      const snippet = await createSharedSnippet({
        language: 'javascript',
        title: `Snippet ${i}`,
        code: `function f${i}(){}`,
      });
      seen.add(snippet.id);
    }
    expect(seen.size).toBe(20);
  });
});
