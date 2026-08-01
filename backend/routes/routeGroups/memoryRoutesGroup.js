// backend/routes/routeGroups/memoryRoutesGroup.js
//
// Issue #2402 — feature-grouped route registration.
//
// Memory routes include the special-cased `DELETE /api/memory/:topic` path
// that needs URL-decoding, length, and character-class validation before
// handing the request to the handler. Because that validation cannot be
// expressed in the plain `{ method, path, handler }` shape used by the
// other feature groups, the central dispatcher in `../apiRoutes.js` first
// walks the declarative `routes` array (for exact-match paths) and then,
// if nothing matched, walks the `matchers` array (for path-pattern routes).
//
// `matchers[i].match(req, res, pathname)` returns `true` if it handled the
// request (ran a handler or sent an error), or `false` to keep walking.
import {
  handleMemoryLog,
  handleMemoryDue,
  handleMemoryAll,
  handleMemoryDelete,
  handleMemoryStats,
  handleMemoryReset,
} from '../../handlers/memoryHandlers.js';

const MAX_TOPIC_LENGTH = 100;

function sendError(res, statusCode, message, code = null) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  const response = { error: message };
  if (code) response.code = code;
  res.end(JSON.stringify(response));
}

export const memoryRoutesGroup = [
  {
    name: 'Memory',
    routes: [
      {
        method: 'POST',
        path: API_ROUTES.MEMORY_LOG,
        handler: handleMemoryLog,
        tier: 'memory',
        requiresAuth: true,
      },
      {
        method: 'GET',
        path: API_ROUTES.MEMORY_DUE,
        handler: handleMemoryDue,
        tier: 'memory',
        requiresAuth: true,
      },
      {
        method: 'GET',
        path: API_ROUTES.MEMORY_ALL,
        handler: handleMemoryAll,
        tier: 'memory',
        requiresAuth: true,
      },
      {
        method: 'GET',
        path: API_ROUTES.MEMORY_STATS,
        handler: handleMemoryStats,
        tier: 'memory',
        requiresAuth: true,
      },
      {
        method: 'POST',
        path: API_ROUTES.MEMORY_RESET,
        handler: handleMemoryReset,
        tier: 'critical',
        requiresAuth: true,
      },
    ],
    // Path-pattern routes. The dispatcher tries each `match()` callback
    // only after every exact-match entry in `routes` has missed.
    matchers: [
      {
        // DELETE /api/memory/:topic  — URL-decode + validate the topic
        // segment before delegating to the handler. The validation logic
        // (length cap + character class + URIError surfacing) is the same
        // as the inline version that previously lived in `setupApiRoutes`.
        match(req, res, pathname, { wrapHandler }) {
          if (!pathname.startsWith(API_ROUTES.MEMORY_PREFIX) || req.method !== 'DELETE') {
            return false;
          }
          const rawTopic = pathname.replace(API_ROUTES.MEMORY_PREFIX, '');
          if (!rawTopic || rawTopic.length === 0) {
            return false;
          }
          try {
            const decodedTopic = decodeURIComponent(rawTopic);
            const trimmedTopic = decodedTopic.trim();

            if (trimmedTopic.length > MAX_TOPIC_LENGTH) {
              sendError(
                res,
                400,
                `Topic exceeds maximum length of ${MAX_TOPIC_LENGTH} characters.`,
                'TOPIC_TOO_LONG'
              );
              return true;
            }

            if (!/^[a-zA-Z0-9\s\-_.]+$/.test(trimmedTopic)) {
              sendError(
                res,
                400,
                'Topic contains unsupported characters. Only letters, numbers, spaces, hyphens, underscores, and periods are allowed.',
                'INVALID_TOPIC'
              );
              return true;
            }

            req.params = req.params || {};
            req.params.topic = trimmedTopic;
            wrapHandler(handleMemoryDelete, 'critical', true)(req, res);
            return true;
          } catch (error) {
            if (error instanceof URIError) {
              sendError(
                res,
                400,
                'Invalid URL-encoded route parameter. Please provide a valid topic identifier.',
                'INVALID_TOPIC_ENCODING'
              );
              return true;
            }
            throw error;
          }
        },
      },
    ],
  },
];

export default memoryRoutesGroup;
