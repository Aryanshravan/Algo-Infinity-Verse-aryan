// backend/routes/routeGroups/resumeRoutes.js
//
// Issue #2402 — feature-grouped route registration.
//
// Resume analyzer endpoint lives in its own group so future resume
// sub-routes (upload-progress, parse-status, etc.) have a clear home.
import { handleAnalyzeResume } from '../../handlers/resumeHandlers.js';
import { API_ROUTES } from '../routeConstants.js';

export const resumeRoutes = [
  {
    name: 'Resume',
    routes: [
      {
        method: 'POST',
        path: API_ROUTES.ANALYZE_RESUME,
        handler: handleAnalyzeResume,
        tier: 'memory',
        requiresAuth: true,
      },
    ],
  },
];

export default resumeRoutes;
