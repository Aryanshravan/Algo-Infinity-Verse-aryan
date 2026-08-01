# ADR-002: File-Based JSON Storage with Atomic Writes

**Status:** Accepted

**Date:** 2026-06-14

## Context

The platform needs persistent storage for user data, problems, quiz results, and other application state. The requirements include:
- Simple setup with no external database dependency for basic operation
- Atomic writes to prevent data corruption
- Support for concurrent read/write access
- Compatibility with serverless (Vercel) and long-lived Node environments
- Low operational overhead

Options considered:
- PostgreSQL / MySQL (heavy for the current scale)
- Firebase Firestore (dependency on external service)
- SQLite (via `better-sqlite3` — used for specific features)
- File-based JSON with atomic write patterns
- Redis (used for specific features like queues and session revocation)

## Decision

We use file-based JSON storage as the primary persistence layer, with the following guarantees:

- **Atomic writes**: data is first written to a temporary file, then renamed into place (`fs.rename`). This prevents partial writes from corrupting data if the process crashes mid-write.
- **File locking**: `proper-lockfile` provides advisory file locking to prevent concurrent write corruption.
- **In-memory caching**: a user store with dirty-flag tracking and timestamp-based cache invalidation reduces disk reads.
- **Write queues**: writes are batched and queued to avoid overwhelming the filesystem under heavy load.
- **JSON Array Store**: a dedicated store for append-only list data (e.g., audit logs) that manages file growth via chunked storage.

Additionally:
- **SQLite** (`better-sqlite3`) is used for structured data that benefits from queryability (e.g., the revision scheduler)
- **Redis** is used for ephemeral data: BullMQ job queues, leaderboard state, session revocation, and rate limiting across multiple instances

## Consequences

**Positive:**
- Zero infrastructure: no database server to install, configure, or maintain
- Data is plain JSON — debuggable, backup-able with simple file copy, and human-readable
- Works on Vercel (read-only filesystem) when combined with Supabase Postgres for writes
- Atomic write pattern prevents the most common form of data corruption
- File locking prevents concurrent write corruption from multiple requests

**Negative:**
- No query language — all data access is O(n) scan unless cached
- Not suitable for relational data or complex queries
- Write throughput is limited by filesystem I/O
- Data size is bounded by available memory (entire store is loaded into RAM)
- File locking adds overhead and can cause contention under high concurrency
- On Vercel serverless, the filesystem is read-only — requires a separate persistence layer
