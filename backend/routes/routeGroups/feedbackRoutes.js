// backend/routes/routeGroups/feedbackRoutes.js
//
// Issue #2402 — feature-grouped route registration.
import { handleSubmitFeedback } from '../../handlers/feedbackHandlers.js';
import { API_ROUTES } from '../routeConstants.js';

export const feedbackRoutes = [
  {
    name: 'Feedback',
    routes: [
      {
        method: 'POST',
        path: API_ROUTES.FEEDBACK,
        handler: handleSubmitFeedback,
        tier: 'default',
        requiresAuth: true,
      },
    ],
  },
];

export default feedbackRoutes;
