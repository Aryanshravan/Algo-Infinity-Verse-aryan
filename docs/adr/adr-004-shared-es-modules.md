# ADR-004: Shared ES Module Architecture

**Status:** Accepted

**Date:** 2026-06-14

## Context

The platform's frontend has grown to include 120+ JavaScript files managing auth, quizzes, bookmarks, search, gamification, spaced repetition, code execution, and dozens of other features. Without a module system, these files would pollute the global namespace and create brittle dependency chains via script loading order.

Options considered:
- Global script tags with namespace objects (the legacy approach)
- ES modules with `import`/`export` and `type="module"` on script tags
- Bundler-based approach (webpack, Rollup, esbuild)
- AMD / CommonJS for the browser

## Decision

We use **ES modules (ESM)** as the standard module format for all frontend code, loaded via `<script type="module">` and using `import`/`export` syntax. Key conventions:

- **`modules/` directory**: 120 shared ES modules, each responsible for a single feature or utility area
- **Sidecar pattern**: many modules expose exports *and* attach themselves to `window` for backwards compatibility with legacy class="script"-loaded code (e.g., `window.DOMSanitizer`, `window.Toast`, `window.ErrorBoundary`)
- **No bundler for dev**: modules are loaded directly by the browser during development; `esbuild` is used for production bundling
- **Server-side ESM**: the backend (`server.js`, `backend/`) uses ESM exclusively (`"type": "module"` in package.json)
- **Legacy compatibility**: modules that need to work with non-module scripts attach their API to `window` using a consistent pattern at the bottom of the file

## Consequences

**Positive:**
- Clear dependency graph — each module explicitly declares its imports
- No global namespace pollution for internal module APIs
- Tree-shakeable when bundled with esbuild
- Native browser support means no bundler is required during development
- Server and client share the same module syntax, reducing cognitive overhead
- The sidecar pattern (`export { ... }; window.Foo = Foo;`) provides a migration path from legacy script-loaded code

**Negative:**
- Older browsers require a build step for module scripts
- The sidecar pattern perpetuates global state — new code should use imports only
- Some modules have implicit dependencies on globals (e.g., `window.userProgress`, `window.showNotification`) that are not declared as imports
- Circular dependencies are possible and must be managed carefully
- `type="module"` scripts are deferred by default, which changes the execution timing vs. classic scripts
