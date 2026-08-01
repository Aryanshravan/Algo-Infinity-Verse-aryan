# ADR-001: HMAC-Signed JWT Authentication

**Status:** Accepted

**Date:** 2026-06-14

## Context

The platform requires a secure authentication system that supports session management, token rotation, and rate-limited login/signup. The system must work in both serverless (Vercel) and long-lived Node environments without depending on third-party identity providers.

Options considered:
- OAuth 2.0 with Google/GitHub
- Supabase Auth (previously used)
- Firebase Authentication (previously used)
- Custom HMAC-signed JWT with PBKDF2 password hashing

## Decision

We implemented a custom authentication system using:

- **HMAC-SHA256 signed JWTs** for access and refresh tokens, with the secret derived from `SESSION_SECRET`
- **PBKDF2** with 210,000 iterations for password hashing, using a `PASSWORD_PEPPER` for additional entropy
- **Access/refresh token pattern**: short-lived access tokens (15 min) in HttpOnly cookies (`aiv_session`) and long-lived refresh tokens (7 days) in a separate HttpOnly cookie (`aiv_refresh`)
- **Token family rotation**: refresh tokens carry a `familyId` and `nonce` — when a refresh occurs, the old nonce is invalidated and a new one issued, preventing refresh token reuse
- **In-memory or Redis-backed revocation**: `revokeTokenFamily` and `revokeAllUserSessions` work with either an in-memory `Map` or Redis, depending on availability
- **CSRF protection**: double-submit cookie pattern with a signed `csrfSecret` cookie and `x-csrf-token` header, plus Origin/Referer header validation
- **Rate limiting**: per-endpoint in-memory rate limiters for login (5 attempts / 15 min window), signup, password change, and account deletion

## Consequences

**Positive:**
- Zero dependency on third-party auth providers — the platform is self-contained
- Full control over token structure, expiry, and revocation semantics
- Works identically in serverless (Vercel) and persistent Node environments
- `redisAvailable` flag allows graceful fallback when Redis is not configured
- Password hashing parameters are validated at runtime to prevent misconfiguration
- Rate limiting uses `getClientIdentifier` with trusted proxy support to avoid collapsing all users into one bucket

**Negative:**
- No built-in social login (Google, GitHub OAuth) — must be implemented separately if needed
- No built-in password reset flow with email verification beyond what is implemented
- Session revocation is best-effort without Redis (in-memory Map is lost on server restart)
- Rate limiters are per-process — horizontal scaling requires Redis for unified rate limiting
