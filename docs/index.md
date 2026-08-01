# Documentation Hub

Welcome to the Algo Infinity Verse documentation hub. This is the single source of truth for contributors, maintainers, and users of the platform.

---

## Architecture & Design Decisions

| Document | Description |
|----------|-------------|
| [ADR Index](./adr/README.md) | Architecture Decision Records index with template for new entries |
| [ADR-001: JWT Authentication](./adr/adr-001-jwt-authentication.md) | HMAC-signed JWT auth with access/refresh token rotation |
| [ADR-002: File-Based Storage](./adr/adr-002-file-based-storage.md) | JSON file persistence with atomic writes and file locking |
| [ADR-003: SPA with Partial Loading](./adr/adr-003-spa-partial-loading.md) | Vanilla SPA using HTML partials loaded into index.html |
| [ADR-004: Shared ES Modules](./adr/adr-004-shared-es-modules.md) | 120+ ES modules with sidecar window exports for backward compat |
| [ADR-005: Dual Deployment](./adr/adr-005-dual-deployment.md) | Vercel serverless + long-lived Node host deployment models |

---

## Component API Docs

| Document | Description |
|----------|-------------|
| [Component API Reference](./components/README.md) | Public API docs for all shared utilities and modules |

Covered modules: DOM Sanitizer, Toast Notifications, Error Boundary, Virtualized Grid, Cache Manager, Pagination, Modal Manager, Quiz Scoring, XP Store, Spaced Repetition, Authentication, Storage, and more.

---

## Guides

| Document | Description |
|----------|-------------|
| [Environment Setup](./setup.md) | Local dev setup, JWT auth configuration, deployment, troubleshooting |
| [Contribution Guide](./contributing.md) | Workflow for contributing: branching, PRs, testing, screenshots |
| [Code Style Guide](./style-guide.md) | Coding conventions: JS, CSS, HTML, naming, file organization, linting |

---

## Existing Docs

| Document | Description |
|----------|-------------|
| [Bookmark Collections](./bookmark-collections.md) | Smart bookmark collections feature documentation |
| [Rendering & Sanitization](./rendering-guidelines.md) | XSS prevention and DOM sanitization security guidelines |

---

## Quick Links

- [README](/README.md) — Project overview
- [CONTRIBUTING](/CONTRIBUTING.md) — Contribution rules and issue assignment
- [DEPLOYMENT](/DEPLOYMENT.md) — Deployment options summary
- [SECURITY](/SECURITY.md) — Security policy and vulnerability reporting
- [AGENTS](/AGENTS.md) — Agent skills setup for AI-assisted development
