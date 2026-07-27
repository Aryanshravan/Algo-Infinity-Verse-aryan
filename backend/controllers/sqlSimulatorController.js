// backend/controllers/sqlSimulatorController.js
// Issue #2404: standardized response format. All other handlers in the
// backend route through `sendJson(res, status, body, headers)` from
// `utils/helpers.js` so the JSON shape is consistent and security
// middlewares (like `applySecurityHeaders` in apiRoutes.js) get a single
// chokepoint. This controller was the lone holdout still using
// `res.status().json()`. The change keeps the controller's outward status
// codes and payload fields identical: `success`, `error`, `message`,
// `results`, `info`. The `sendJson` helper asserts the same
// `Content-Type: application/json; charset=utf-8` that the rest of the
// API surface emits, and the existing tests have been updated to mock
// the same surface.
import { getDb, initDB } from '../services/sqlSimulatorService.js';
import { sendJson } from '../utils/helpers.js';

/**
 * Verifies a `Database` handle is usable by running a cheap introspection
 * query. Returns `true` on success, `false` on any error.
 *
 * `better-sqlite3` exposes both `Database#prepare(...)` (which throws on
 * invalid SQL) and `Statement#all()` (which throws on I/O errors). We use
 * `PRAGMA schema_version` because:
 *   - it is a single integer lookup, no read of user data needed
 *   - it is cheap (the SQLite engine reads it from the header)
 *   - it does not throw if the schema is empty (unlike `SELECT 1 FROM employees`)
 */
function isDbUsable(db) {
  if (!db || typeof db.prepare !== 'function') {
    return false;
  }
  try {
    const stmt = db.prepare('PRAGMA schema_version;');
    const result = stmt.get();
    return Boolean(result) && typeof result.schema_version === 'number';
  } catch {
    return false;
  }
}

export const resetDatabase = (req, res) => {
  try {
    const oldDb = getDb();
    // Drop the employees table on the OLD handle before initDB swaps it out
    // so we never race a new request that got hold of the previous handle.
    if (oldDb) {
      try {
        oldDb.exec(`DROP TABLE IF EXISTS employees;`);
      } catch (_) {
        /* ignore */
      }
    }
    const fresh = initDB();
    if (!isDbUsable(fresh)) {
      return sendJson(res, 500, {
        success: false,
        error: 'Database initialization did not produce a usable handle.',
      });
    }
    return sendJson(res, 200, {
      success: true,
      message: 'Database reset successfully',
    });
  } catch (error) {
    return sendJson(res, 500, {
      success: false,
      error: error?.message || 'Failed to reset the database.',
    });
  }
};

export const executeQuery = (req, res) => {
  const { query } = req.body;
  if (!query) {
    return sendJson(res, 400, { error: 'SQL query is required' });
  }

  try {
    const db = getDb();
    if (!isDbUsable(db)) {
      return sendJson(res, 503, {
        success: false,
        error: 'Database is not initialized. Please reset and try again.',
      });
    }
    const isSelect =
      query.trim().toUpperCase().startsWith('SELECT') ||
      query.trim().toUpperCase().startsWith('PRAGMA');
    if (isSelect) {
      const stmt = db.prepare(query);
      const results = stmt.all();
      return sendJson(res, 200, { success: true, results });
    } else {
      const stmt = db.prepare(query);
      const info = stmt.run();
      return sendJson(res, 200, { success: true, info });
    }
  } catch (error) {
    return sendJson(res, 400, { error: error.message });
  }
};
