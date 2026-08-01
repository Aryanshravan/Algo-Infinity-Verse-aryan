# ADR-005: Dual Deployment — Vercel Serverless + Long-Lived Node

**Status:** Accepted

**Date:** 2026-06-14

## Context

The platform needs to support two deployment models depending on feature requirements:
1. A simple, zero-ops deployment that serves the static site and HTTP API
2. A full-featured deployment with WebSocket (Socket.IO) and background job processing (BullMQ)

Options considered:
- Vercel-only (no WebSocket or background jobs)
- Long-lived Node host-only (requires managing infrastructure)
- Dual deployment with an architectural split

## Decision

We support two deployment targets with a shared codebase:

### Option A — Vercel (Serverless)

- Static pages and **all HTTP `/api/*` routes** work via Vercel serverless functions
- Dedicated API functions in `api/` handle exact paths (login, signup, session, etc.)
- `api/[...path].js` is a catch-all that delegates remaining `/api/*` requests to `server.js`'s exported `requestHandler`
- **Not supported**: Socket.IO realtime (WebSocket), BullMQ background worker
- Environment variables are set in the Vercel project dashboard

### Option B — Long-Lived Node Host

- `server.js` runs as a persistent process serving all routes, WebSocket connections, and background jobs
- Requires a platform that supports persistent Node processes (Render, Railway, Fly.io, VPS)
- Redis must be reachable for the BullMQ audit worker; without it, the app falls back to in-process audit handling
- `NODE_ENV=production` is set to ensure `Secure` cookie flag is applied correctly

### Architecture Split

The codebase is structured so that `server.js` exports both a `requestHandler` (for serverless) and can be run directly as a process:

```js
// server.js
export const requestHandler = app; // for Vercel catch-all
if (process.env.VERCEL !== '1') {
  app.listen(PORT, HOST, () => { /* ... */ });
}
```

## Consequences

**Positive:**
- Single codebase supports both deployment models
- Vercel deployment is trivial (connect repo, set env vars, deploy)
- Feature parity on HTTP API across both targets
- Socket.IO and BullMQ are only active when running as a persistent process
- The catch-all serverless function (`api/[...path].js`) avoids duplicating route definitions

**Negative:**
- Vercel deployment is a subset of full-featured deployment
- Some code paths check `process.env.VERCEL` to branch behavior, adding complexity
- Serverless cold starts affect API response times on Vercel
- File-based JSON storage is read-only on Vercel — requires an alternative persistence layer
- Session revocation in-memory Map is lost between serverless invocations
