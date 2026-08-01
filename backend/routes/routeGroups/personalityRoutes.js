// backend/routes/routeGroups/personalityRoutes.js
//
// Issue #2402 — feature-grouped route registration.
import { handleUserPersonality } from '../../handlers/personalityHandlers.js';
import { API_ROUTES } from '../routeConstants.js';

export const personalityRoutes = [
  {
    name: 'Personality',
    routes: [
      {
        method: 'GET',
        path: API_ROUTES.PERSONALITY,
        handler: handleUserPersonality,
        tier: 'default',
        requiresAuth: true,
      },
    ],
  },
];

export default personalityRoutes;
