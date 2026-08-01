// backend/routes/apiRoutes.js
//
// Issue #2402 — central route registry is now a *data* dispatcher.
//
// Prior to this refactor, every route was wired in a 110-line
// `setupApiRoutes()` chain of inline `if (pathname === ...) return wrapHandler(...)`
// blocks. New routes required touching the dispatcher, and the file
// grew linearly with feature count. The registry now lives in
// per-feature group modules under `./routeGroups/`, each exporting a
// `{ name, routes, matchers? }` description. `setupApiRoutes` walks
// those descriptions in a single pass:
//
//   1. For every group, walk every exact-match route in `routes[]`. The
//      first `(method, path)` hit dispatches the (already-wrapped) handler.
//   2. If no exact-match hit, walk every group's optional `matchers[]`
//      in registration order. The first matcher that returns `true` ends
//      the lookup.
//   3. Otherwise return `null` so the caller (`backend/server.js`) can
//      emit a 404.
//
// The cross-cutting infrastructure (`applySecurityHeaders`,
// `checkRateLimit`, `sanitizeInput`, `sendError`, `wrapHandler`) stays
// here because it is *machinery* shared by every group, not a route
// definition. Group files describe WHAT to register; this file knows
// HOW to register it.
import { authenticationRoutes } from './routeGroups/authenticationRoutes.js';
import { resumeRoutes } from './routeGroups/resumeRoutes.js';
import { feedbackRoutes } from './routeGroups/feedbackRoutes.js';
import { interviewRoutes } from './routeGroups/interviewRoutes.js';
import { memoryRoutesGroup } from './routeGroups/memoryRoutesGroup.js';
import { personalityRoutes } from './routeGroups/personalityRoutes.js';
import { refactoringDojoRoutesGroup } from './routeGroups/refactoringDojoRoutesGroup.js';
import { API_ROUTES } from './routeConstants.js';

// Single source of truth for the registration order. Order matters only
// for `matchers[]` (a path-pattern route can shadow another path-pattern
// route if registered first); exact-match routes are order-independent
// because their `path` is unique.
const ROUTE_GROUPS = [
  ...authenticationRoutes,
  ...resumeRoutes,
  ...feedbackRoutes,
  ...interviewRoutes,
  ...memoryRoutesGroup,
  ...personalityRoutes,
  ...refactoringDojoRoutesGroup,
];

const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMITS = {
  default: { maxRequests: 60, tier: 'default' },
  memory: { maxRequests: 30, tier: 'memory' },
  critical: { maxRequests: 10, tier: 'critical' },
};

const rateLimiter = new Map();

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

function applySecurityHeaders(res) {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

function checkRateLimit(req, res, tier = 'default') {
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';
  const key = `${ip}:${tier}`;
  const now = Date.now();
  const config = RATE_LIMITS[tier] || RATE_LIMITS.default;
  const windowMs = RATE_LIMIT_WINDOW;

  if (!rateLimiter.has(key)) {
    rateLimiter.set(key, { count: 1, firstRequest: now, tier: config.tier });
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', config.maxRequests - 1);
    res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());
    return true;
  }

  const data = rateLimiter.get(key);
  if (now - data.firstRequest > windowMs) {
    data.count = 1;
    data.firstRequest = now;
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', config.maxRequests - 1);
    res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());
    return true;
  }

  if (data.count >= config.maxRequests) {
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', 0);
    res.setHeader('X-RateLimit-Reset', new Date(data.firstRequest + windowMs).toISOString());
    res.setHeader('Retry-After', Math.ceil((data.firstRequest + windowMs - now) / 1000));
    return false;
  }

  data.count++;
  res.setHeader('X-RateLimit-Limit', config.maxRequests);
  res.setHeader('X-RateLimit-Remaining', config.maxRequests - data.count);
  res.setHeader('X-RateLimit-Reset', new Date(data.firstRequest + windowMs).toISOString());
  return true;
}

function sanitizeInput(value) {
  if (typeof value === 'string') {
    return value.trim().replace(/[<>]/g, '').slice(0, 5000);
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeInput(item));
  }
  if (value && typeof value === 'object') {
    const sanitized = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeInput(val);
    }
    return sanitized;
  }
  return value;
}

function sanitizeBody(req) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeInput(req.body);
  }
}

function addSecurityLogging(req, action, details = {}) {
  const timestamp = new Date().toISOString();
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  console.log(`[SECURITY] ${timestamp} | ${action} | IP: ${ip} | UA: ${userAgent}`, details);
}

function validateSession(req) {
  const session = req.session || {};
  return !!session.userId;
}

function validatePasswordPolicy(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }
  return { valid: true };
}

function sendError(res, statusCode, message, code = null) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  const response = { error: message };
  if (code) response.code = code;
  res.end(JSON.stringify(response));
}

function wrapHandler(handler, tier = 'default', requiresAuth = true) {
  return async (req, res) => {
    try {
      applySecurityHeaders(res);
      sanitizeBody(req);

      if (requiresAuth && !validateSession(req)) {
        addSecurityLogging(req, 'UNAUTHORIZED_ACCESS', { path: req.pathname });
        return sendError(res, 401, 'Unauthorized', 'SESSION_INVALID');
      }

      // Check primary rate limit tier
      if (!checkRateLimit(req, res, tier)) {
        addSecurityLogging(req, 'RATE_LIMIT_EXCEEDED', { tier });
        const config = RATE_LIMITS[tier] || RATE_LIMITS.default;
        return sendError(
          res,
          429,
          `Rate limit exceeded. Maximum ${config.maxRequests} requests per minute.`,
          'RATE_LIMIT_EXCEEDED'
        );
      }

      // Secondary critical limit check (Only applies if the primary tier isn't already 'critical')
      const isCritical = req.pathname?.includes('/reset') || req.pathname?.includes('/delete');
      if (isCritical) {
        if (tier !== 'critical') {
          if (!checkRateLimit(req, res, 'critical')) {
            addSecurityLogging(req, 'CRITICAL_RATE_LIMIT_EXCEEDED', { path: req.pathname });
            const config = RATE_LIMITS.critical;
            return sendError(
              res,
              429,
              `Critical rate limit exceeded. Maximum ${config.maxRequests} requests per minute.`,
              'CRITICAL_RATE_LIMIT_EXCEEDED'
            );
          }
        }
        addSecurityLogging(req, 'CRITICAL_OPERATION', { path: req.pathname, method: req.method });
      }

      if (req.method === 'POST' || req.method === 'PUT') {
        const password = req.body?.password || req.body?.newPassword;
        if (password) {
          const validation = validatePasswordPolicy(password);
          if (!validation.valid) {
            addSecurityLogging(req, 'INVALID_PASSWORD_ATTEMPT', { path: req.pathname });
            return sendError(res, 400, validation.message, 'INVALID_PASSWORD');
          }
        }
      }

      const handlerStart = Date.now();
      await handler(req, res);
      const handlerDuration = Date.now() - handlerStart;

      if (handlerDuration > 1000) {
        addSecurityLogging(req, 'SLOW_HANDLER', { path: req.pathname, duration: handlerDuration });
      }
    } catch (error) {
      console.error('[API] Handler error:', error);
      addSecurityLogging(req, 'HANDLER_ERROR', { path: req.pathname, error: error.message });
      sendError(res, 500, 'Internal server error', 'HANDLER_ERROR');
    }
  };
}

export { applySecurityHeaders, wrapHandler, sendError };

export function setupApiRoutes(req, res, pathname) {
  req.pathname = pathname;

  // Pass 1: exact-match routes. Order-independent (each `path` is unique).
  for (const group of ROUTE_GROUPS) {
    for (const route of group.routes) {
      if (pathname === route.path && req.method === route.method) {
        return wrapHandler(route.handler, route.tier, route.requiresAuth)(req, res);
      }
    }
  }

  // Pass 2: path-pattern matchers. Order-sensitive — the first matcher
  // that returns `true` (handled the request) wins. Memory's `:topic`
  // DELETE route lives here.
  for (const group of ROUTE_GROUPS) {
    if (!group.matchers) continue;
    for (const matcher of group.matchers) {
      const handled = matcher.match(req, res, pathname, { wrapHandler });
      if (handled) return true;
    }
  }

  if (pathname === API_ROUTES.EXPLAIN_CODE && req.method === 'POST') {
    return wrapHandler(
      async (req, res) => {
        const { code, language } = req.body || {};
        const result = await explainCode({ code, language });
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
      },
      'default',
      false
    )(req, res);
  }

  if (pathname === API_ROUTES.CHEAT_SHEET && (req.method === 'POST' || req.method === 'GET')) {
    return wrapHandler(
      async (req, res) => {
        await cheatSheetHandler(req, res);
      },
      'default',
      false
    )(req, res);
  }

  return null;
}
