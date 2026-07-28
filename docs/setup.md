# Environment Setup Guide

Guide for setting up the Algo Infinity Verse development environment, deploying to production, and configuring external services.

---

## Prerequisites

- **Node.js** >= 18 (LTS recommended). The project uses `"type": "module"` (ESM).
- **npm** >= 9
- **Redis** (optional) — needed for BullMQ background job queues and cross-instance session revocation

---

## Local Development

### 1. Clone & Install

```bash
git clone https://github.com/<your-org>/Algo-Infinity-Verse.git
cd Algo-Infinity-Verse
npm install
```

### 2. Environment Variables

Copy the example env file and fill in the required values:

```bash
cp .env.example .env
```

**Required variables:**

| Variable | Description |
|----------|-------------|
| `SESSION_SECRET` | HMAC secret for JWT signing. Generate with: `openssl rand -base64 48` |
| `PASSWORD_PEPPER` | Extra entropy for PBKDF2 password hashing. Generate with: `openssl rand -base64 32` |

**Optional but recommended:**

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `HOST` | `127.0.0.1` | Server host |
| `CSRF_SALT` | (hardcoded fallback) | Salt for CSRF token signing — set a unique value in production |
| `TRUSTED_PROXIES` | empty | Comma-separated reverse proxy IPs for correct rate limiting |
| `GEMINI_API_KEY` | — | Google Gemini API key for AI hint features |

### 3. Start the Server

```bash
npm start
# or
npm run dev
```

The app is available at `http://localhost:3000`.

### 4. Verify

- Open `http://localhost:3000` — you should see the SPA shell with loading animation
- Open DevTools Console — no uncaught errors should appear
- Check the server terminal — should show the startup banner with port number

---

## Authentication (JWT)

The platform uses **HMAC-SHA256 signed JWT** authentication with the following flow:

1. **Signup**: `POST /api/signup` — validates name, email, password; hashes password with PBKDF2 (210k iterations + pepper); returns access + refresh tokens as HttpOnly cookies
2. **Login**: `POST /api/login` — validates credentials against stored hash; rate limited to 5 attempts per 15 min window per IP; returns tokens as cookies
3. **Session**: `GET /api/session` — reads the `aiv_session` cookie, verifies the JWT, returns user info
4. **Refresh**: `POST /api/refresh` — uses the `aiv_refresh` cookie to issue a new access token; implements token family rotation (old refresh tokens are invalidated)
5. **Logout**: `POST /api/logout` — clears cookies, revokes the refresh token family
6. **Guest**: `POST /api/guest` — creates an ephemeral guest session

### Cookie Configuration

| Cookie | Type | Max Age | HttpOnly | SameSite | Secure |
|--------|------|---------|----------|----------|--------|
| `aiv_session` | Access token | 15 min | Yes | Lax | In production |
| `aiv_refresh` | Refresh token | 7 days | Yes | Lax | In production |

`Secure` flag is applied when `NODE_ENV=production` or the `x-forwarded-proto: https` header is present.

### Password Policy

- Minimum 8 characters, maximum 64 characters
- Must include: uppercase letter, lowercase letter, digit
- PBKDF2 with 210,000 iterations, SHA-256 digest
- Application-level pepper (PASSWORD_PEPPER) prepended before hashing

### CSRF Protection

Double-submit cookie pattern:
- Non-GET requests require a `x-csrf-token` header matching the `csrfSecret` cookie value
- Origin/Referer header validation as an additional check
- CSRF token verification middleware on all state-changing routes

---

## Storage

### Primary: File-Based JSON

User data, problems, quiz results, and application state are stored in JSON files in the project root directory. The system uses:

- **Atomic writes**: temp file + `fs.rename` to prevent corruption
- **File locking**: via `proper-lockfile` for concurrent write safety
- **In-memory cache**: with dirty-flag tracking and timestamp-based invalidation

### Secondary: SQLite

Used via `better-sqlite3` for structured data that benefits from queryability (e.g., revision scheduler data).

### Optional: Redis

Used for:
- BullMQ background job queue (bulk audit processing)
- Cross-instance session revocation
- Leaderboard state

Redis is optional — the app falls back gracefully:

```js
// redisAvailable boolean controls fallback behavior
if (redisAvailable && redisClient) {
  await redisClient.set(`refresh:${familyId}`, nonce, 'EX', ...);
} else {
  activeRefreshFamilies.set(familyId, { currentNonce: nonce });
}
```

### Optional: Firebase Firestore

If configured, Firestore can be used for data persistence on Vercel (where the filesystem is read-only). Firebase auth has been replaced by JWT — only Firestore is used if configured.

---

## Testing

### Unit Tests

Uses Jest with `--experimental-vm-modules` for ESM support:

```bash
npm test
```

Test files live in `tests/` and match `*.test.js`. Key test areas:

- Authentication flow (`auth.test.js`, `tokenRefresh.test.js`, `sessionRevocation.test.js`)
- Security (`csrfGracePeriod.test.js`, `securityAccessControl.test.js`)
- Services (`authService*.test.js`, `plagiarism.test.js`, `leaderboard*.test.js`)
- Modules (`quizScoring.test.js`, `bookmarkCollections.test.js`, `cacheManager.test.js`)
- Visualizers (20+ visualizer test files)
- Editors (Prolog, Groovy, Elixir, VB.NET)

### E2E Tests

Uses Playwright:

```bash
npm run test:e2e         # headless
npm run test:e2e:ui      # with Playwright UI
```

E2E specs are in `tests/e2e/` and cover: auth, navigation, quiz, caching, CSP, error boundary, parser engine, recommendations, skip link, and facts.

---

## Deployment

### Option A: Vercel (Serverless)

Best for: static site + HTTP API only (no WebSocket, no background jobs).

1. Push your repo to GitHub
2. Import in Vercel dashboard
3. Set environment variables in Vercel project settings (required: `SESSION_SECRET`, `PASSWORD_PEPPER`)
4. Deploy — zero configuration needed (uses `vercel.json` in the repo)

Limitations:
- Socket.IO realtime (study rooms, live chat) does **not** work
- BullMQ audit worker does **not** run
- File-based JSON storage is read-only — data persistence requires Firestore or another external service

### Option B: Long-Lived Node Host

Best for: full features including WebSocket and background jobs.

Supported platforms: Render, Railway, Fly.io, any VPS.

```bash
npm install
npm start
```

Set environment variables on the host:
- `SESSION_SECRET`, `PASSWORD_PEPPER` (required)
- `REDIS_URL` (for BullMQ worker and cross-instance session revocation)
- `NODE_ENV=production` (ensures `Secure` cookie flag)
- `TRUSTED_PROXIES` if behind a reverse proxy

---

## External Services (Optional)

| Service | Env Variable | Purpose |
|---------|-------------|---------|
| Gemini AI | `GEMINI_API_KEY` | AI-powered hints and explanations |
| Redis | `REDIS_URL` | BullMQ job queue, session revocation, leaderboard |
| Firebase | `FIREBASE_*` | Firestore persistence on Vercel (auth replaced by JWT) |

None of these are required for basic local development. The app runs fully with just `SESSION_SECRET` and `PASSWORD_PEPPER`.

---

## Troubleshooting

### "SESSION_SECRET is required"

Set the `SESSION_SECRET` environment variable in your `.env` file.

### "PBKDF2_ITERATIONS is below the minimum security threshold"

The security config requires at least 100,000 iterations. Check `backend/config/security.js` — the default is 210,000.

### Port already in use

Change the port in `.env`: `PORT=3001`

### Tests fail with ESM import errors

Ensure you're using Node.js >= 18. The project uses `--experimental-vm-modules` for Jest.

### Vercel deploy fails on API routes

Check that environment variables are set in the Vercel project dashboard. The catch-all `api/[...path].js` expects `SESSION_SECRET` to be available as a serverless function environment variable.
