// backend/routes/routeGroups/authenticationRoutes.js
//
// Issue #2402 — feature-grouped route registration.
//
// All authentication-related endpoints (the "Authentication" feature
// group) live here. Each entry is a plain route descriptor consumed by
// `setupApiRoutes` in `../apiRoutes.js`:
//
//   {
//     method,         // 'GET' | 'POST' | 'PUT' | 'DELETE'
//     path,           // exact path string, e.g. '/api/login'
//     handler,        // async (req, res) => void
//     tier,           // 'default' | 'memory' | 'critical'
//     requiresAuth,   // boolean
//   }
//
// Keeping this as data (not control flow) means new routes can be added
// without touching `setupApiRoutes`, and `applySecurityHeaders` /
// `wrapHandler` see one uniform shape per route.
import {
  handleGuestLogin,
  handleSignup,
  handleLogin,
  handleLogout,
  handleDeactivateAccount,
  handleSession,
} from '../../handlers/authHandlers.js';
import { API_ROUTES } from '../routeConstants.js';

export const authenticationRoutes = [
  {
    name: 'Authentication',
    routes: [
      {
        method: 'POST',
        path: API_ROUTES.GUEST,
        handler: handleGuestLogin,
        tier: 'default',
        requiresAuth: false,
      },
      {
        method: 'GET',
        path: API_ROUTES.SESSION,
        handler: handleSession,
        tier: 'default',
        requiresAuth: false,
      },
      {
        method: 'POST',
        path: API_ROUTES.SIGNUP,
        handler: handleSignup,
        tier: 'default',
        requiresAuth: false,
      },
      {
        method: 'POST',
        path: API_ROUTES.LOGIN,
        handler: handleLogin,
        tier: 'default',
        requiresAuth: false,
      },
      {
        method: 'POST',
        path: API_ROUTES.DEACTIVATE_ACCOUNT,
        handler: handleDeactivateAccount,
        tier: 'critical',
        requiresAuth: true,
      },
      {
        method: 'POST',
        path: API_ROUTES.LOGOUT,
        handler: handleLogout,
        tier: 'default',
        requiresAuth: true,
      },
    ],
  },
];

export default authenticationRoutes;
