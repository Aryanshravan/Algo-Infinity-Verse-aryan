# Contribution Guide

This guide covers the practical workflow for contributing to Algo Infinity Verse. For code style conventions, see [`style-guide.md`](./style-guide.md). For environment setup, see [`setup.md`](./setup.md).

---

## Quick Start

```bash
git clone https://github.com/<your-org>/Algo-Infinity-Verse.git
cd Algo-Infinity-Verse
npm install
cp .env.example .env   # fill in SESSION_SECRET and PASSWORD_PEPPER at minimum
npm run dev
```

The app starts at `http://localhost:3000`.

---

## Project Structure

```
├── index.html              # SPA shell (main entry point)
├── script.js               # Client-side app logic (~6k lines)
├── styles.css              # Global styles (~11k lines)
├── server.js               # Node.js/Express server (~3k lines)
├── modules/                # 120 shared ES modules
├── pages/                  # 71 feature page directories
├── partials/               # 25 HTML partial templates
├── components/             # UI components
├── backend/                # Server-side: routes, controllers, services, handlers
│   ├── routes/             # Express routers
│   ├── controllers/        # Request controllers
│   ├── services/           # Business logic (13 services)
│   ├── handlers/           # Request handlers (6 handlers)
│   └── config/             # Constants, security config, password blacklist
├── utils/                  # Shared utilities (11 modules)
├── api/                    # Vercel serverless functions
├── data/                   # JSON data stores
├── tests/                  # Jest unit tests (90+)
├── docs/                   # Documentation
└── styles/                 # Modular CSS files
```

---

## Workflow

### 1. Find an Issue

Issues are manually assigned by maintainers. Comment on an open issue expressing interest and wait for assignment. A contributor can be assigned a maximum of **5 issues at a time**.

### 2. Create a Branch

```bash
git checkout -b fix/issue-123-short-description
```

Branch naming convention: `<type>/<issue-number>-<short-description>`

Types: `feat/`, `fix/`, `refactor/`, `chore/`, `docs/`, `test/`, `a11y/`

### 3. Make Changes

- Follow the **[Code Style Guide](./style-guide.md)**
- Write or update **tests** for your changes
- Keep changes focused on the issue scope

### 4. Run Tests

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e
```

### 5. Commit

```bash
git add <files>
git commit -m "type(scope): brief description"
```

The project uses Husky pre-commit hooks with `lint-staged` — linting runs automatically on staged files.

### 6. Submit a Pull Request

1. Push your branch: `git push origin <branch-name>`
2. Open a PR against `main` with a clear description
3. Reference the issue: `Fixes #123`
4. Use the PR template (includes type checkboxes and checklist)

---

## PR Checklist

Before submitting, verify:

- [ ] Code compiles/lints without errors (`npm test` passes)
- [ ] No console errors in the browser
- [ ] New features include tests
- [ ] Documentation updated if public API changed
- [ ] Changes are scoped to a single issue
- [ ] PR description references the issue number

---

## Code Review Guidelines

Reviewers will check for:

### Security
- [ ] No `innerHTML` with unsanitized user content — use `domSanitizer.js`
- [ ] No inline `onclick` / `on*` event handlers in template strings
- [ ] Auth-gated routes use `guardPrivateHash()` or `loginRedirect()`
- [ ] No secrets/credentials committed

### Performance
- [ ] No synchronous DOM reads inside loops
- [ ] Virtualized grid usage for large lists (problem cards, search results)
- [ ] Lazy loading for off-screen content
- [ ] CacheManager for repeated API calls

### Accessibility
- [ ] All interactive elements are keyboard accessible
- [ ] Modals have `role="dialog"` and `aria-modal="true"`
- [ ] Focus is trapped inside open modals
- [ ] Color contrast meets WCAG 2.1 AA standards
- [ ] Skip link is present and functional

### Testing
- [ ] New logic has unit tests under `tests/`
- [ ] E2E tests for critical user flows under `tests/e2e/`
- [ ] Edge cases handled (empty state, error state, loading state)

---

## Adding a New Page

1. Create `pages/<page-name>/` with `<page-name>.html` (partial)
2. Add `<page-name>.css` and/or `<page-name>.js` if needed
3. Register the route in `hash-router.js` if hash-based
4. Add the navigation link in `partials/navbar.html`
5. Add E2E smoke test in `tests/e2e/navigation.spec.js`

## Adding a New Module

1. Create `modules/<module-name>.js` as an ES module
2. Export your functions/classes with `export`
3. For backwards compat with legacy scripts, attach to `window`:
   ```js
   export { myFunction };
   window.myFunction = myFunction;
   ```
4. Import where needed: `import { myFunction } from '/modules/<module-name>.js'`
5. Add unit tests in `tests/<module-name>.test.js`

## Adding a New API Endpoint

1. Define the route in `backend/routes/` or directly in `server.js`
2. Create a controller in `backend/controllers/` if logic is non-trivial
3. Move business logic to `backend/services/` for testability
4. Add rate limiting in `backend/utils/rateLimiter.js`
5. Add the Vercel serverless function in `api/` if needed for serverless deployment
6. Add tests in `tests/<endpoint>.test.js`

---

## Reporting Bugs

1. Use the **Bug Report** issue template
2. Include reproduction steps, expected vs actual behavior
3. Add screenshots or console logs
4. Note the browser and OS version

---

## Screenshots

<!--
Screenshots should be placed in the `screenshots/` directory.
When adding visual features, include screenshots in your PR description.
Refer to them as: ![Description](../screenshots/example.png)
-->

Screenshots are stored in `screenshots/`. When submitting a PR with visual changes:

1. Capture a screenshot of the changed UI
2. Save it to `screenshots/` with a descriptive filename

---

## Questions?

Open a discussion or ask in the issue comments. Maintainers and community members will respond.
