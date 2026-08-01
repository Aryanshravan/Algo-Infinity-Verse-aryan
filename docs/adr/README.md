# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the Algo Infinity Verse project. ADRs document key design choices, their context, and the trade-offs considered.

## Index

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-001](./adr-001-jwt-authentication.md) | HMAC-Signed JWT Authentication | Accepted |
| [ADR-002](./adr-002-file-based-storage.md) | File-Based JSON Storage with Atomic Writes | Accepted |
| [ADR-003](./adr-003-spa-partial-loading.md) | SPA with Partial Loading via HTML Partials | Accepted |
| [ADR-004](./adr-004-shared-es-modules.md) | Shared ES Module Architecture | Accepted |
| [ADR-005](./adr-005-dual-deployment.md) | Dual Deployment: Vercel Serverless + Long-Lived Node | Accepted |

## What is an ADR?

An Architecture Decision Record is a short document capturing:

- **Context** — the forces and circumstances that led to the decision
- **Decision** — the choice that was made
- **Status** — proposed, accepted, deprecated, or superseded
- **Consequences** — the trade-offs, both positive and negative

## Creating a New ADR

1. Create a copy of the template below
2. Fill in the sections with the decision details
3. Place it in this directory with a sequential number and descriptive name
4. Add it to the index above

### Template

```markdown
# ADR-NNN: Title

**Status:** Proposed | Accepted | Deprecated | Superseded

**Date:** YYYY-MM-DD

## Context

What is the issue motivating this decision? What forces are at play?

## Decision

What is the change that was made?

## Consequences

What trade-offs were accepted? What is now easier or harder?
```
