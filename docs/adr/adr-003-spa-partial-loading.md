# ADR-003: SPA with Partial Loading via HTML Partials

**Status:** Accepted

**Date:** 2026-06-14

## Context

The platform has 70+ feature pages (topics, quizzes, visualizers, contests, etc.) and needs to deliver them efficiently. Options included:
- Classic multi-page application (MPA) — full page reloads on every navigation
- Heavy SPA framework (React, Vue, Svelte) with client-side routing
- Hybrid: vanilla SPA that loads HTML partials into a shell page

## Decision

We chose a vanilla JavaScript SPA pattern where `index.html` acts as the application shell and loads content via HTML partials:

- **`index.html`**: the main entry point containing the navigation shell, theme setup, PWA manifest, loading animation, and a content container
- **`loadPartial()`**: a global function that fetches HTML fragments from `/partials/` and injects them into the shell
- **70+ page directories** under `pages/`: each contains a `page-name.html` partial and optionally `page-name.css` / `page-name.js` for page-specific assets
- **Hash-based routing** (`hash-router.js`): the `hashchange` event drives page switching, with guard logic for authenticated routes
- **Partial templates** (`partials/`): reusable HTML fragments for navbar, footer, modals (auth, quiz, XP store), and other shared UI components
- **Lazy loading**: partials and their associated JS modules are loaded on demand, not at initial page load

## Consequences

**Positive:**
- No build step required — HTML, CSS, and JS are served as-is (except esbuild for bundling)
- Familiar mental model: each page is just an HTML file with its own CSS and JS
- Fast initial load — only the shell is rendered, content is fetched on demand
- Each page partial is independently cacheable by the browser and service worker
- Low barrier to entry for contributors — no framework knowledge required beyond vanilla JS
- `loadPartial` supports lazy loading of associated scripts and styles

**Negative:**
- No framework-level state management — all state is managed via global variables, `window` exports, and `localStorage`
- No built-in code splitting beyond manual partial organization
- Hash-based routing has SEO implications (though the project uses prerendered server content where needed)
- JavaScript must be enabled for navigation (the shell does provide server-rendered fallbacks)
