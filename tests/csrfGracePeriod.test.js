import crypto from 'crypto';
import { verifyCsrfToken, recordRotatedSecret } from '../utils/csrf-verify.js';

describe('CSRF Verification Grace Period (#2961)', () => {
  test('accepts valid CSRF token header matching cookie secret', () => {
    const secret = 'test-csrf-secret-123';
    const token = crypto
      .createHmac('sha256', process.env.CSRF_SALT || 'infinity-verse-secure-salt')
      .update(secret)
      .digest('hex');

    const req = {
      headers: {
        cookie: `csrfSecret=${secret}`,
        'x-csrf-token': token,
      },
    };

    expect(verifyCsrfToken(req)).toBe(true);
  });

  test('accepts recently rotated CSRF secret within grace period window', () => {
    const oldSecret = 'old-secret-456';
    const oldToken = crypto
      .createHmac('sha256', process.env.CSRF_SALT || 'infinity-verse-secure-salt')
      .update(oldSecret)
      .digest('hex');

    recordRotatedSecret(oldSecret);

    const req = {
      headers: {
        cookie: 'csrfSecret=new-secret-789',
        'x-csrf-token': oldToken,
      },
    };

    expect(verifyCsrfToken(req)).toBe(true);
  });
});
