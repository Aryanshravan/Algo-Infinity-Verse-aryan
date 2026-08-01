// backend/routes/routeGroups/interviewRoutes.js
//
// Issue #2402 — feature-grouped route registration.
import { handleSubmitInterviewExperience } from '../../handlers/interviewHandlers.js';
import { API_ROUTES } from '../routeConstants.js';

export const interviewRoutes = [
  {
    name: 'Interview',
    routes: [
      {
        method: 'POST',
        path: API_ROUTES.INTERVIEW_EXPERIENCES,
        handler: handleSubmitInterviewExperience,
        tier: 'default',
        requiresAuth: true,
      },
    ],
  },
];

export default interviewRoutes;
