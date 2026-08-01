# Component API Documentation

This directory documents the public API of shared utilities and modules used across the Algo Infinity Verse platform.

---

## DOM Sanitizer — `modules/domSanitizer.js`

Centralized XSS prevention utility.

```js
import { escapeHtml, safeRender, sanitizeHTML } from '/modules/domSanitizer.js';
```

### `escapeHtml(unsafe: string): string`
Escapes `&`, `<`, `>`, `"`, `'` to their HTML entity equivalents. Returns empty string for `null`/`undefined`.

### `safeRender(element: HTMLElement, content: string, asHTML?: boolean): void`
Renders content into an element. If `asHTML` is `false` (default), uses `textContent`. If `true`, runs `sanitizeHTML` before assigning to `innerHTML`.

### `sanitizeHTML(htmlStr: string): string`
Parses HTML with `DOMParser`, removes blacklisted tags (`script`, `iframe`, `object`, `embed`, `style`, `link`, `meta`, `svg`, `math`), strips event handler attributes (`on*`) and `javascript:` URIs. Falls back to regex-based sanitization where `DOMParser` is unavailable.

**Browser global**: `window.DOMSanitizer`

---

## Toast Notification — `modules/toast.js`

Non-blocking notification system.

```js
// Available globally via window.Toast
Toast.show(message, type?, duration?);
Toast.success(message, duration?);
Toast.error(message, duration?);
Toast.warning(message, duration?);
Toast.info(message, duration?);
```

**Parameters:**
- `message: string` — the notification text (HTML-escaped internally)
- `type: 'info' | 'success' | 'error' | 'warning'` — defaults to `'info'`
- `duration: number` — auto-dismiss timeout in ms, defaults to `3000`

**Behavior:** Only one toast is visible at a time. Previous toasts are dismissed before a new one is shown.

---

## Error Boundary — `modules/error-boundary.js`

Global and localized error capture with fallback UI.

```js
// Available globally via window.ErrorBoundary
ErrorBoundary.run(fn, containerId);
```

### `ErrorBoundary.run(fn: Function, containerId: string): any`
Wraps a function (sync or async) in a try-catch. If it throws, renders a localized fallback UI inside the element identified by `containerId`.

**Global listeners:** Automatic `window.onerror` and `window.onunhandledrejection` handlers that log errors to the server and show a full-page fallback overlay.

---

## Virtualized Grid — `modules/virtualizedGrid.js`

Windowed rendering for large lists of problem cards.

```js
import { VirtualizedGrid } from '/modules/virtualizedGrid.js';

const grid = new VirtualizedGrid({
  container: document.getElementById('grid'),
  items: problemArray,
  renderItem: (item, absoluteIndex, localIndex) => `<div class="problem-card">...</div>`,
  minItemWidth: 350,        // px, default 350
  gap: 32,                   // px, default 32
  itemHeight: 280,           // estimated px, default 280
  overscanRows: 4,           // rows to render above/below viewport, default 4
});

grid.updateItems(newItems); // replace the item list

grid.destroy(); // clean up event listeners and ResizeObserver
```

**Features:** Keyboard navigation (arrow keys), `ResizeObserver` for responsive column recalculation, scroll-linked rendering with `requestAnimationFrame`, configurable overscan.

---

## Cache Manager — `modules/cacheManager.js`

IndexedDB-backed HTTP response cache with stale-while-revalidate.

```js
// Available globally via window.apiCache
const data = await apiCache.fetchWithCache(url, options?, ttlMs?, type?);
```

### `fetchWithCache(url, options?, ttlMs?, type?): Promise<any>`
Returns cached data if fresh. If cache is stale (>50% of TTL elapsed), triggers a background refresh. Returns cached data during refresh. After `maxConsecutiveFailures` (default 3) failed refreshes, invalidates the cache entry to prevent serving indefinitely stale data.

### `set(url, data, type?, ttlMs?): Promise<void>`
Manually store a value with a TTL (default 3600000ms / 1 hour).

### `get(url): Promise<{data, type, expiresAt, updatedAt}|null>`
Retrieve a cached value. Returns `null` if expired or missing.

### `invalidate(url): Promise<void>`
Remove a cached entry.

---

## Pagination — `modules/pagination.js`

Reusable client-side pagination for DOM element lists.

```js
import { initPagination } from '/modules/pagination.js';

initPagination({
  items: document.querySelectorAll('.topic-card'),
  itemsPerPage: 10,
  paginationContainer: document.getElementById('pagination'),
  onPageChange: (currentPage, totalPages) => { /* ... */ }
});
```

Automatically hides controls when there is only one page. Includes previous/next buttons and numbered page buttons.

---

## Toast — `modules/toast.js`

See above. Also available as global singleton: `window.Toast`.

---

## Hash Router — `modules/hash-router.js`

Hash-based client-side routing for the SPA shell.

```js
import { initHashRouter } from '/modules/hash-router.js';

initHashRouter();
```

Listens for `hashchange` events. On `#home`, hides quiz and assistant elements via `data-route-hidden` attribute.

---

## Quiz Scoring — `modules/quizScoring.js`

Pure functions for quiz score calculation (DOM-free for testability).

```js
import { shuffle, countCorrect, calculatePercentage, calculateXp, updateQuizRecord } from '/modules/quizScoring.js';
```

| Function | Signature | Returns |
|----------|-----------|---------|
| `shuffle` | `(array: any[]) => any[]` | Fisher-Yates shuffled copy |
| `countCorrect` | `(questions, selectedIndices) => number` | Count of correct answers |
| `calculatePercentage` | `(score: number, total: number) => number` | Percentage (0-100), 0 if total <= 0 |
| `calculateXp` | `(score: number) => number` | `score * 10`, minimum 0 |
| `updateQuizRecord` | `(record, attempt) => object` | Updated `{bestScore, attempts, totalXP}` |

---

## Modal Manager — `modules/modal-manager.js`

Automatic modal accessibility and focus management.

```js
import { initModalManager } from '/modules/modal-manager.js';

initModalManager();
```

Uses a `MutationObserver` on `document.body` to detect modal elements (identified by class, id, or `role="dialog"`/`aria-modal="true"` attributes). Automatically:

- Sets `role="dialog"` and `aria-modal="true"` if absent
- Links `aria-labelledby` to the modal's heading element
- Traps focus inside the open modal (Tab/Shift+Tab cycling)
- Restores focus to the previously focused element on close
- Prevents background scroll via `body.modal-open` class
- Dismisses on `Escape` key and overlay click
- Handles modal stacking (only restores scroll when all modals are closed)

---

## XP Store — `modules/xpStore.js`

Gamified item shop with inventory management.

```js
import {
  initStoreModal, openStoreModal, closeStoreModal,
  purchaseItem, getStoreItem, getOwnedCount,
  useHintToken, activateXPBooster, applyBooster,
  getHintTokenCount, getXPBoosterCount,
} from '/modules/xpStore.js';
```

| Function | Signature | Purpose |
|----------|-----------|---------|
| `purchaseItem` | `(userProgress, itemKey) => { success, message, item? }` | Deducts XP, grants item |
| `getStoreItem` | `(itemKey) => object\|null` | Returns item definition |
| `getOwnedCount` | `(userProgress, itemKey) => number` | Current owned quantity |
| `useHintToken` | `(userProgress) => boolean` | Consumes one hint token |
| `activateXPBooster` | `(userProgress) => boolean` | Activates a 3-problem 2x XP booster |
| `applyBooster` | `(userProgress, baseXP) => number` | Returns `baseXP * 2` if booster active |

**Store items:** Streak Freeze (500 XP), Hint Token (200 XP), Avatar Pack (1000 XP), XP Booster (2000 XP), Exclusive Badge (5000 XP).

---

## Spaced Repetition — `modules/spaced-repetition.js`

SM-2 algorithm integration for review scheduling.

```js
// Globals (attached to window)
scheduleNextRevision(topicId);
handleQuizCompletionForRevision(topicId, scorePercentage);
rateRecallDifficulty(quality); // 0-5 scale, on window
```

`rateRecallDifficulty` sends the rating to `/api/spaced-repetition/:problemId` via PUT. On network failure, falls back to client-side SM-2 computation. Handles both authenticated and guest progress persistence.

---

## Authentication — `auth.js` / `auth-gate.js`

Client-side session management and auth-gate click interception.

```js
// Globals on window.algoAuth
algoAuth.authenticated // boolean
algoAuth.user          // { id, name, email } | null

// Key functions
getSession()        // fetches /api/session
loginRedirect()     // guards #dashboard and #profile
guardPrivateHash()  // redirects unauthenticated users
```

**Auth gate** (`auth-gate.js`): a click interceptor that checks `window.algoAuth.authenticated` before allowing access to protected UI elements (topic cards, problem cards, quiz cards, etc.). Shows a modal with login/signup/guest options when triggered.

---

## Storage — `utils/storage.js`

IndexedDB wrapper for offline data persistence.

```js
// Available globally via window.StorageDB
await StorageDB.get(storeName, key);
await StorageDB.set(storeName, key, value);
await StorageDB.remove(storeName, key);
await StorageDB.getAll(storeName);
await StorageDB.clear(storeName);
await StorageDB.migrateFromLocalStorage();
```

**Stores:** `user_data`, `playground_code`, `preferences`, `sync_queue`, `problems`, `progress`, `visualizers`, `bookmarks`, `syncQueue`.

---

## Env Validator — `utils/envValidator.js`

Startup environment validation for the server.

```js
import { validateEnv } from '../utils/envValidator.js';

validateEnv(); // throws / exits if SESSION_SECRET is missing
```

---

## CSRF Verify — `utils/csrf-verify.js`

Double-submit cookie CSRF verification middleware.

```js
import { verifyCsrfToken } from '../utils/csrf-verify.js';
// Used as Express middleware on non-GET routes
```

---

## Additional Modules

| Module | Location | Purpose |
|--------|----------|---------|
| `navbar.js` | `modules/navbar.js` | Dynamic navigation bar rendering |
| `hero.js` | `modules/hero.js` | Hero section animation and content |
| `profile.js` | `modules/profile.js` | User profile page logic |
| `dashboard.js` | `modules/dashboard.js` | Dashboard widgets and stats |
| `theme.js` | `modules/theme.js` | Dark/light theme toggle with localStorage persistence |
| `search.js` | `modules/search.js` | Client-side search across topics and problems |
| `bookmark*.js` | `modules/bookmark*.js` | Bookmark collections, filters, stats, UI (5 modules) |
| `keyboard-shortcuts.js` | `modules/keyboard-shortcuts.js` | Global keyboard shortcut bindings |
| `code-executor.js` | `modules/code-executor.js` | Code execution client for the playground |
| `offlineStore.js` | `modules/offlineStore.js` | Offline-first data synchronization |
| `pwa-storage.js` | `modules/pwa-storage.js` | PWA storage estimation and management |
