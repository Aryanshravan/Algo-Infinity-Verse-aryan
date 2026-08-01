// tests/apiRoutesDispatch.test.js
//
// Issue #2402 — the central route registry in
// `backend/routes/apiRoutes.js` is now a thin dispatcher over per-feature
// route-group modules. These tests pin the dispatcher's contract WITHOUT
// importing the real handler modules (several of which have pre-existing
// circular / missing exports on `upstream/main`). We replace the
// `ROUTE_GROUPS` array in-place via `jest.unstable_mockModule` so the
// dispatch logic — exact-match lookup, matcher fallback, `req.pathname`
// stamping, `null` return for no match — is exercised in isolation.

import { jest } from '@jest/globals';

// Helper: build a synthetic route group identical in shape to the real ones
// under `backend/routes/routeGroups/*.js`.
function makeGroup({ name, routes = [], matchers = [] }) {
  return { name, routes, ...(matchers.length ? { matchers } : {}) };
}

// Helper: stand-in handler that records the call and sends a 200 so the
// promise resolves. Mirrors the shape `wrapHandler` expects (async fn taking
// `(req, res)`).
function makeHandler(label) {
  return async (req, res) => {
    req.__handlersCalledWith = req.__handlersCalledWith || [];
    req.__handlersCalledWith.push(label);
    // Mimic what a real handler does — set status + body + end.
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, label, pathname: req.pathname }));
  };
}

// Minimal mock `res` that records the status code and what `wrapHandler`
// wrote. Used by `dispatch()` below to mirror what `setupApiRoutes`
// returns / writes on the wire.
function makeMockRes() {
  return {
    statusCode: undefined,
    _headers: {},
    _bodyChunks: [],
    setHeader(k, v) {
      this._headers[k] = v;
    },
    end(bodyStr) {
      if (bodyStr !== null && bodyStr !== undefined) this._bodyChunks.push(bodyStr);
    },
    get body() {
      return this._bodyChunks.length ? JSON.parse(this._bodyChunks.join('')) : undefined;
    },
  };
}

// Helper: invoke setupApiRoutes with a synthetic req + res. Bypasses the
// actual `wrapHandler` machinery (rate-limit, security headers) by
// stamping a fake session so `requiresAuth: true` routes don't bounce to
// 401. We only care about dispatch decisions here.
async function dispatch(setupApiRoutes, pathname, method = 'GET', body = {}) {
  const req = {
    method,
    body,
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
    // `validateSession(req)` returns `!!session.userId` — pre-stamp so
    // the wrapHandler auth-check passes for `requiresAuth: true` routes.
    session: { userId: 'test-user' },
  };
  const res = makeMockRes();
  // Some real handlers call `res.setHeader('X-RateLimit-...')`. The mock above
  // already supports that. Wait for the (async) handler to settle.
  const ret = setupApiRoutes(req, res, pathname);
  // `wrapHandler` returns an async fn that the dispatcher invokes — so we
  // await the underlying promise if there is one.
  if (ret && typeof ret.then === 'function') {
    await ret;
  }
  return { req, res, ret };
}

describe('setupApiRoutes dispatcher (Issue #2402)', () => {
  let setupApiRoutes;

  beforeAll(async () => {
    // Replace the broken real handlers/route-groups with synthetic ones so
    // the dispatcher can be imported without touching the upstream-broken
    // `memoryHandlers.js` self-import. The mock is module-scoped so the
    // dispatcher under test sees exactly the inputs we provide.
    const fakeGroups = [
      makeGroup({
        name: 'Authentication',
        routes: [
          {
            method: 'POST',
            path: '/api/login',
            handler: makeHandler('login'),
            tier: 'default',
            requiresAuth: false,
          },
          {
            method: 'POST',
            path: '/api/logout',
            handler: makeHandler('logout'),
            tier: 'default',
            requiresAuth: true,
          },
        ],
      }),
      makeGroup({
        name: 'Memory',
        routes: [
          {
            method: 'POST',
            path: '/api/memory/log',
            handler: makeHandler('memoryLog'),
            tier: 'memory',
            requiresAuth: true,
          },
        ],
        matchers: [
          {
            match(req, res, pathname, { wrapHandler }) {
              if (!pathname.startsWith('/api/memory/') || req.method !== 'DELETE') return false;
              const rawTopic = pathname.replace('/api/memory/', '');
              if (!rawTopic) return false;
              req.params = { topic: decodeURIComponent(rawTopic) };
              wrapHandler(makeHandler('memoryDelete'), 'critical', true)(req, res);
              return true;
            },
          },
        ],
      }),
      makeGroup({
        name: 'RefactoringDojo',
        routes: [
          {
            method: 'POST',
            path: '/api/refactoring-dojo/submit',
            handler: makeHandler('dojo'),
            tier: 'default',
            requiresAuth: true,
          },
        ],
      }),
    ];

    jest.unstable_mockModule('../backend/routes/routeGroups/authenticationRoutes.js', () => ({
      authenticationRoutes: fakeGroups.filter((g) => g.name === 'Authentication'),
    }));
    jest.unstable_mockModule('../backend/routes/routeGroups/resumeRoutes.js', () => ({
      resumeRoutes: [],
    }));
    jest.unstable_mockModule('../backend/routes/routeGroups/feedbackRoutes.js', () => ({
      feedbackRoutes: [],
    }));
    jest.unstable_mockModule('../backend/routes/routeGroups/interviewRoutes.js', () => ({
      interviewRoutes: [],
    }));
    jest.unstable_mockModule('../backend/routes/routeGroups/memoryRoutesGroup.js', () => ({
      memoryRoutesGroup: fakeGroups.filter((g) => g.name === 'Memory'),
    }));
    jest.unstable_mockModule('../backend/routes/routeGroups/personalityRoutes.js', () => ({
      personalityRoutes: [],
    }));
    jest.unstable_mockModule('../backend/routes/routeGroups/refactoringDojoRoutesGroup.js', () => ({
      refactoringDojoRoutesGroup: fakeGroups.filter((g) => g.name === 'RefactoringDojo'),
    }));

    const mod = await import('../backend/routes/apiRoutes.js');
    setupApiRoutes = mod.setupApiRoutes;
  });

  afterAll(() => {
    jest.resetModules();
    jest.dontMock('../backend/routes/routeGroups/authenticationRoutes.js');
    jest.dontMock('../backend/routes/routeGroups/resumeRoutes.js');
    jest.dontMock('../backend/routes/routeGroups/feedbackRoutes.js');
    jest.dontMock('../backend/routes/routeGroups/interviewRoutes.js');
    jest.dontMock('../backend/routes/routeGroups/memoryRoutesGroup.js');
    jest.dontMock('../backend/routes/routeGroups/personalityRoutes.js');
    jest.dontMock('../backend/routes/routeGroups/refactoringDojoRoutesGroup.js');
  });

  it('returns null when no route matches', async () => {
    const { ret } = await dispatch(setupApiRoutes, '/api/nope', 'POST');
    expect(ret).toBeNull();
  });

  it('returns non-null when an exact-match route hits', async () => {
    const { ret, res } = await dispatch(setupApiRoutes, '/api/login', 'POST');
    expect(ret).not.toBeNull();
    expect(res.body.label).toBe('login');
  });

  it('stamps req.pathname with the input pathname before dispatch', async () => {
    // Handler references `req.pathname` — only set because dispatcher stamps it.
    const { res } = await dispatch(setupApiRoutes, '/api/login', 'POST');
    expect(res.body.pathname).toBe('/api/login');
  });

  it('honors HTTP method on exact matches (POST /api/login hits, GET /api/login misses)', async () => {
    const postRet = await dispatch(setupApiRoutes, '/api/login', 'POST');
    expect(postRet.ret).not.toBeNull();
    const getRet = await dispatch(setupApiRoutes, '/api/login', 'GET');
    expect(getRet.ret).toBeNull();
  });

  it('walks all groups — Memory group route is reachable even after Authentication', async () => {
    const { ret, res } = await dispatch(setupApiRoutes, '/api/memory/log', 'POST');
    expect(ret).not.toBeNull();
    expect(res.body.label).toBe('memoryLog');
  });

  it('falls back to path-pattern matchers when no exact match hits', async () => {
    const { ret, res } = await dispatch(setupApiRoutes, '/api/memory/linked-lists', 'DELETE');
    expect(ret).not.toBeNull();
    expect(ret).toBe(true);
    expect(res.body.label).toBe('memoryDelete');
  });

  it('the path-pattern matcher sets req.params.topic from the URL segment', async () => {
    const { req } = await dispatch(setupApiRoutes, '/api/memory/graph-theory', 'DELETE');
    expect(req.params.topic).toBe('graph-theory');
  });

  it('the path-pattern matcher URL-decodes its parameter', async () => {
    const { req } = await dispatch(setupApiRoutes, '/api/memory/hello%20world', 'DELETE');
    expect(req.params.topic).toBe('hello world');
  });

  it('the matcher does NOT match when the HTTP method is wrong (GET /api/memory/x)', async () => {
    const { ret } = await dispatch(setupApiRoutes, '/api/memory/x', 'GET');
    expect(ret).toBeNull();
  });

  it('the matcher does NOT match when the topic segment is empty', async () => {
    // /api/memory/  → empty topic. Matcher explicitly returns false so the
    // dispatcher falls through to the no-match null return.
    const { ret } = await dispatch(setupApiRoutes, '/api/memory/', 'DELETE');
    expect(ret).toBeNull();
  });

  it('skips groups that declare no matchers', async () => {
    // RefactoringDojo has only one exact-match route and no matchers property.
    // A path that looks like its prefix but is not its exact path must miss.
    const { ret } = await dispatch(setupApiRoutes, '/api/refactoring-dojo/other', 'POST');
    expect(ret).toBeNull();
  });

  it('the last group in registration order is reachable', async () => {
    const { ret, res } = await dispatch(setupApiRoutes, '/api/refactoring-dojo/submit', 'POST');
    expect(ret).not.toBeNull();
    expect(res.body.label).toBe('dojo');
  });
});
