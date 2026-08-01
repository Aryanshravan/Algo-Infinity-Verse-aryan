// backend/routes/routeGroups/refactoringDojoRoutesGroup.js
//
// Issue #2402 — feature-grouped route registration.
//
// `refactoringDojoRoutes.js` exports the handler `handleRefactoringDojoSubmit`
// directly (it also houses the analyzer + scoring logic). This group file
// re-uses that handler without re-implementing it, isolating the *route
// registration* concern from the *business logic* concern.
import { handleRefactoringDojoSubmit } from '../refactoringDojoRoutes.js';

export const refactoringDojoRoutesGroup = [
  {
    name: 'RefactoringDojo',
    routes: [
      {
        method: 'POST',
        path: '/api/refactoring-dojo/submit',
        handler: handleRefactoringDojoSubmit,
        tier: 'default',
        requiresAuth: true,
      },
    ],
  },
];

export default refactoringDojoRoutesGroup;
