# Code Style Guide

Consistent code style improves readability and reduces review friction. This guide documents the conventions used across the Algo Infinity Verse codebase.

---

## General

- **Indentation**: 2 spaces (not tabs). Configured in `.prettierrc` (`tabWidth: 2`).
- **Semicolons**: Required. Configured in `.prettierrc` (`semi: true`).
- **Quotes**: Single quotes for JS strings. Configured in `.prettierrc` (`singleQuote: true`).
- **Trailing commas**: ES5 style (trailing commas where valid in ES5: objects, arrays). Configured in `.prettierrc` (`trailingComma: "es5"`).
- **Print width**: 100 characters. Configured in `.prettierrc` (`printWidth: 100`).
- **Formatting**: Use Prettier for consistent formatting. Run `npx prettier --check .` before committing. Husky pre-commit hooks run `lint-staged` automatically.

---

## JavaScript

### Module System

- Use **ES modules** (`import`/`export`) for all new code
- The project uses `"type": "module"` in `package.json`
- Legacy code may use global `window.*` exports — these should be migrated to ES modules over time

```js
// Good: ES module
import { escapeHtml } from '/modules/domSanitizer.js';
export function renderProfile(user) { /* ... */ }

// Acceptable for backward compat (modules/ pattern):
export { myFunction };
window.myFunction = myFunction;
```

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Variables / properties | `camelCase` | `userProgress`, `isAuthenticated` |
| Functions / methods | `camelCase` | `getSession()`, `renderStoreUI()` |
| Classes | `PascalCase` | `CacheManager`, `VirtualizedGrid` |
| Constants (module-level) | `UPPER_SNAKE_CASE` or `camelCase` | `XP_PER_CORRECT_ANSWER`, `STORE_ITEMS` |
| File names (modules) | `kebab-case` | `modal-manager.js`, `spaced-repetition.js` |
| File names (pages) | `kebab-case` | `topic-detail.html` |
| Private methods | `_camelCase` prefix | `_pendingPurchase`, `_signupSweeper` |
| Boolean variables | `is*`, `has*`, `should*` prefix | `isVisible`, `hasMigrated`, `shouldRefresh` |
| Event handlers | `handle*` prefix | `handleScroll`, `handleModalOpen` |
| IDs / data attributes | `kebab-case` | `id="xp-store-modal"`, `data-item="streakFreeze"` |
| CSS classes | `kebab-case` | `.error-boundary-overlay`, `.btn-primary` |
| CSS custom properties | `--kebab-case` | `--primary`, `--dark-bg` |

### Variable Declarations

```js
// Prefer const by default
const MAX_ITEMS = 50;
const user = getUser(id);

// Use let for reassignment
let currentPage = 1;
currentPage += 1;

// Avoid var entirely
```

### Functions

```js
// Arrow functions for short callbacks and module exports
const getActiveBoosterCount = (progress) => {
  if (!progress.inventory?.xpBoostersTimer) return 0;
  return progress.inventory.xpBoostersTimer.problemsRemaining;
};

// Named function declarations for top-level definitions
function calculatePercentage(score, total) {
  if (!total || total <= 0) return 0;
  return Math.round((score / total) * 100);
}

// Async functions with explicit try/catch
async function fetchUserData(userId) {
  try {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) throw new Error('Network error');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    throw error;
  }
}
```

### Destructuring

```js
// Object destructuring
const { name, email, xp } = userProgress;
const { bestScore, attempts } = updateQuizRecord(record, attempt);

// Array destructuring
const [first, second] = items;
const [prevBtn, ...pageBtns] = paginationButtons;

// Default values
const { streakFreezes = 0, hintTokens = 0 } = userProgress.inventory || {};
```

### Optional Chaining & Nullish Coalescing

```js
// Optional chaining
const boosterCount = userProgress.inventory?.xpBoosters || 0;
const timer = userProgress.inventory?.xpBoostersTimer?.problemsRemaining;

// Nullish coalescing
const count = userProgress.inventory?.hintTokens ?? 0;
const name = user?.name ?? 'Guest';
```

### Async / Await

```js
// Prefer async/await over .then() chains
async function refreshSession() {
  try {
    const response = await fetch('/api/session', { credentials: 'include' });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
```

### Error Handling

```js
// Throw with descriptive messages
throw new Error('SESSION_SECRET is required. Set it in the environment.');

// Catch with specific error handling
try {
  const data = await riskyOperation();
} catch (error) {
  if (error.name === 'AbortError') return;
  console.error('Operation failed:', error);
  showErrorFallback(error);
}
```

### Imports

```js
// Group imports: 1) built-in, 2) external, 3) internal
import crypto from 'crypto';
import express from 'express';
import { getCsrfToken } from '../controllers/apiController.js';
import { escapeHtml } from '/modules/domSanitizer.js';
```

### JSDoc Annotations

```js
/**
 * Validates the user object before token generation.
 * @param {object} user - The user to validate
 * @param {string} user.id - User ID
 * @param {string} user.name - Display name
 * @param {string} user.email - Email address
 * @returns {string|null} Error message or null if valid
 */
export function validateUserForToken(user) { /* ... */ }
```

---

## CSS

### Naming Convention

Use descriptive class names with `kebab-case`. Avoid abbreviations where possible.

```css
/* Good */
.problem-card { }
.error-boundary-overlay { }
.btn-primary { }
.pagination-controls { }

/* Avoid */
.pc { }
.err-bnd { }
.prim-btn { }
```

### CSS Custom Properties

Define design tokens in `:root` using `--kebab-case` naming:

```css
:root {
  --primary: #7c3aed;
  --primary-rgb: 124, 58, 237;
  --dark-bg: #0a0a1a;
  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.1);
}
```

### Organization

- **`styles.css`**: global styles, CSS variables, utility classes, animations, dark theme overrides
- **`styles/design-tokens.css`**: design tokens and shared layout helpers
- **`styles/copy-code.css`**: copy button styles (extracted for maintenance)
- **`styles/eli5-toggle.css`**: ELI5 content toggle styles
- **Page-specific CSS**: in `pages/<page-name>/<page-name>.css`

### Dark Theme

The dark theme is controlled via the `data-theme` attribute on `<html>`:

```css
[data-theme="dark"] {
  --bg: #0a0a1a;
  --surface: #1a1a3e;
  --text: #ffffff;
}

[data-theme="light"] {
  --bg: #ffffff;
  --surface: #f4f4f5;
  --text: #18181b;
}
```

### Responsive Design

Use CSS `clamp()` and relative units for fluid typography and spacing:

```css
font-size: clamp(0.875rem, 1.5vw, 1.125rem);
padding: clamp(1rem, 2vw, 2rem);
```

Media queries for breakpoints:
- 768px (tablet)
- 1024px (desktop)
- 1280px (wide)

---

## HTML

### Partials

HTML partials in `partials/` contain reusable fragments loaded by `loadPartial()`. Each partial should be a complete, valid HTML fragment (not a full document):

```html
<!-- partials/navbar.html -->
<nav id="main-nav" class="navbar" role="navigation" aria-label="Main navigation">
  <div class="nav-inner">
    <a href="#home" class="nav-logo">Algo Infinity Verse</a>
    <!-- ... -->
  </div>
</nav>
```

### Accessibility

```html
<!-- Provide ARIA labels where visual labels are absent -->
<button aria-label="Close modal" id="modal-close">
  <i class="fas fa-times"></i>
</button>

<!-- Use semantic HTML -->
<nav role="navigation" aria-label="Main">
<main id="main-content">
<section aria-labelledby="section-title">

<!-- Skip link must be the first focusable element -->
<a href="#main-content" class="skip-link">Skip to main content</a>
```

---

## Git

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(auth): add password reset flow
fix(quiz): correct XP calculation on retry
refactor(bookmark): extract collection storage into separate module
docs(adr): add ADR for JWT authentication
test(virtualized-grid): add keyboard navigation tests
a11y(modal): add focus trapping for modal dialogs
```

### Branch Naming

```
feat/<issue-number>-<description>
fix/<issue-number>-<description>
refactor/<issue-number>-<description>
docs/<description>
test/<description>
a11y/<issue-number>-<description>
chore/<description>
```

---

## File Organization

### Module File Structure

```js
// 1. Imports (grouped: built-in, external, internal)
import crypto from 'crypto';
import securityConfig from '../config/security.js';

// 2. Constants
export const XP_PER_CORRECT_ANSWER = 10;

// 3. Pure functions
export function calculatePercentage(score, total) { /* ... */ }

// 4. Class definitions
export class CacheManager {
  constructor() { /* ... */ }
  async get(url) { /* ... */ }
}

// 5. Side effects (instantiation, global attachment)
export const apiCache = new CacheManager();
window.apiCache = apiCache;
```

### Server Route File Structure

```js
// 1. Imports
import express from 'express';
import { getCsrfToken } from '../controllers/apiController.js';

// 2. Router creation
const router = express.Router();

// 3. Route definitions (grouped by resource)
router.get('/csrf-token', getCsrfToken);
router.post('/log-error', logError);

// 4. Sub-router mounts
router.use('/sql', sqlSimulatorRouter);

// 5. Export
export default router;
```

---

## Linting

The project uses ESLint with `eslint:recommended` rules:

```json
{
  "rules": {
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
    "no-undef": "error"
  }
}
```

Run linting:
```bash
npx eslint .
```

Prettier formatting:
```bash
npx prettier --check .
npx prettier --write .   # auto-fix
```

Both run automatically via Husky pre-commit hooks.
