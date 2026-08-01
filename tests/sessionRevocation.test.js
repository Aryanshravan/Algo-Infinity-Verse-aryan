process.env.SESSION_SECRET = 'test-secret-revocation';
import {
  createAccessToken,
  verifyAccessToken,
  revokeAllUserSessions,
} from '../backend/services/auth.service.js';

describe('Instant Access Token Revocation (#2893)', () => {
  test('invalidates access token immediately when revokeAllUserSessions is called', async () => {
    const user = {
      id: 'user-revocation-test-1',
      name: 'Security Tester',
      email: 'test@example.com',
    };
    const token = await createAccessToken(user);

    expect(await verifyAccessToken(token)).toBeTruthy();

    await revokeAllUserSessions(user.id);

    expect(await verifyAccessToken(token)).toBeNull();
  });
});
