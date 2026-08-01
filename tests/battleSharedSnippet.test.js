import { jest } from '@jest/globals';

const mockSet = jest.fn(async () => {});

// Mock the shared snippet store so we control what a sharedId resolves to.
const mockGetSharedSnippet = jest.fn();

// Mock Firebase — battles.js resolves problems from firestore (catalog path)
// and stores battle documents. The sharedId path only needs the user lookup.
jest.unstable_mockModule('../firebase.js', () => ({
  initializeFirebase: () => ({
    collection: (name) => {
      if (name === 'users') {
        return {
          where: () => ({
            limit: () => ({
              get: async () => ({
                empty: false,
                docs: [{ id: 'opponent-1' }],
              }),
            }),
          }),
        };
      }
      if (name === 'battles') {
        return {
          doc: () => ({ id: 'battle-test-123', set: mockSet }),
        };
      }
      throw new Error(`Unexpected collection: ${name}`);
    },
  }),
  COLLECTIONS: { USERS: 'users', BATTLES: 'battles' },
}));

// Mock session verification — return a fixed user for every request.
jest.unstable_mockModule('../backend/utils/sessionToken.js', () => ({
  SESSION_COOKIE: 'aiv_session',
  verifySessionToken: async () => ({ sub: 'player-1' }),
  parseCookies: () => ({}),
}));

jest.unstable_mockModule('../backend/controllers/sharedSnippets.js', () => ({
  getSharedSnippet: mockGetSharedSnippet,
}));

const { default: battlesHandler } = await import('../battles.js');

function jsonResponse() {
  const res = {
    statusCode: 200,
    body: null,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

function req(method, url, body) {
  return {
    method,
    url,
    body,
    headers: { cookie: 'aiv_session=fake' },
  };
}

describe('createBattle with sharedId (Share a DSA Insight → Challenge a Friend)', () => {
  beforeEach(() => {
    mockSet.mockClear();
    mockGetSharedSnippet.mockReset();
  });

  it('creates a battle using the shared snippet as the problem', async () => {
    mockGetSharedSnippet.mockResolvedValue({
      id: 'abc12345',
      language: 'python',
      title: 'Two Sum hash map',
      code: 'def solve(nums, target):\n    return nums',
    });

    const res = jsonResponse();
    await battlesHandler(
      req('POST', '/api/battles', {
        opponentEmail: 'friend@example.com',
        difficulty: 'Medium',
        sharedId: 'abc12345',
      }),
      res
    );

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ battleId: 'battle-test-123' });

    expect(mockGetSharedSnippet).toHaveBeenCalledWith('abc12345');

    const data = mockSet.mock.calls[0][0];
    expect(data.problemType).toBe('shared');
    expect(data.sharedId).toBe('abc12345');
    expect(data.problemCode).toBe('def solve(nums, target):\n    return nums');
    expect(data.problemLanguage).toBe('python');
    expect(data.problemTitle).toBe('Two Sum hash map');
    expect(data.status).toBe('pending');
    expect(data.player1).toBe('player-1');
    expect(data.player2).toBe('opponent-1');
  });

  it('rejects a battle when the shared snippet is missing or expired', async () => {
    mockGetSharedSnippet.mockResolvedValue(null);

    const res = jsonResponse();
    await battlesHandler(
      req('POST', '/api/battles', {
        opponentEmail: 'friend@example.com',
        difficulty: 'Easy',
        sharedId: 'zzzz9999',
      }),
      res
    );

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/not found or has expired/i);
    expect(mockSet).not.toHaveBeenCalled();
  });

  it('requires an opponent email', async () => {
    const res = jsonResponse();
    await battlesHandler(
      req('POST', '/api/battles', { difficulty: 'Hard', sharedId: 'abc12345' }),
      res
    );

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/opponentEmail is required/i);
    expect(mockGetSharedSnippet).not.toHaveBeenCalled();
  });

  it('validates the difficulty field', async () => {
    const res = jsonResponse();
    await battlesHandler(
      req('POST', '/api/battles', {
        opponentEmail: 'friend@example.com',
        difficulty: 'Impossible',
        sharedId: 'abc12345',
      }),
      res
    );

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/difficulty must be/i);
  });
});
