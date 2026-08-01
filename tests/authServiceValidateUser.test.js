// tests/authServiceValidateUser.test.js
//
// Verifies validateUserForToken() guards createAccessToken / createRefreshToken
// against incomplete or malformed user objects (Issue #2412).
// Without this guard, a missing property on `user` would silently land inside
// the JWT payload as `undefined` (stringified as the literal string
// "undefined"), producing tokens with bogus claims.

// auth.service.sign() requires a non-empty SESSION_SECRET.
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret-validate-user-token';

describe('auth.service - validateUserForToken (Issue #2412)', () => {
  let createAccessToken;
  let createRefreshToken;
  let validateUserForToken;

  beforeAll(async () => {
    const mod = await import('../backend/services/auth.service.js');
    createAccessToken = mod.createAccessToken;
    createRefreshToken = mod.createRefreshToken;
    validateUserForToken = mod.validateUserForToken;
  });

  const validUser = { id: 'u1', name: 'Alice', email: 'alice@example.com' };

  describe('validateUserForToken', () => {
    it('returns null for a valid user object', () => {
      expect(validateUserForToken(validUser)).toBeNull();
    });

    it('rejects null / undefined', () => {
      expect(validateUserForToken(null)).toMatch(/valid user object/);
      expect(validateUserForToken(undefined)).toMatch(/valid user object/);
    });

    it('rejects primitives', () => {
      expect(validateUserForToken('u1')).toMatch(/valid user object/);
      expect(validateUserForToken(42)).toMatch(/valid user object/);
      expect(validateUserForToken(true)).toMatch(/valid user object/);
    });

    it('rejects arrays', () => {
      expect(validateUserForToken(['u1', 'Alice', 'a@b.com'])).toMatch(/valid user object/);
    });

    for (const field of ['id', 'name', 'email']) {
      it(`rejects missing ${field}`, () => {
        const partial = { ...validUser };
        delete partial[field];
        expect(validateUserForToken(partial)).toMatch(
          new RegExp(`Missing required field "${field}"`)
        );
      });

      it(`rejects empty-string ${field}`, () => {
        const bad = { ...validUser, [field]: '' };
        expect(validateUserForToken(bad)).toMatch(new RegExp(`"${field}".*non-empty string`));
      });

      it(`rejects whitespace-only ${field}`, () => {
        const bad = { ...validUser, [field]: '    ' };
        expect(validateUserForToken(bad)).toMatch(new RegExp(`"${field}".*non-empty string`));
      });

      it(`rejects non-string ${field}`, () => {
        const bad = { ...validUser, [field]: 123 };
        expect(validateUserForToken(bad)).toMatch(new RegExp(`"${field}".*non-empty string`));
      });

      it(`rejects null ${field}`, () => {
        const partial = { ...validUser, [field]: null };
        expect(validateUserForToken(partial)).toMatch(new RegExp(`"${field}"`));
      });
    }

    it('does not mutate the user object', () => {
      const snapshot = { ...validUser };
      validateUserForToken(validUser);
      expect(validUser).toEqual(snapshot);
    });

    it('allows extra fields (rating, role, avatarUrl) without complaint', () => {
      expect(
        validateUserForToken({ ...validUser, rating: 1200, role: 'admin', avatarUrl: 'x' })
      ).toBeNull();
    });
  });

  describe('createAccessToken', () => {
    it('throws when the user is invalid', async () => {
      await expect(createAccessToken(null)).rejects.toThrow(/valid user object/);
      await expect(createAccessToken({ ...validUser, id: '' })).rejects.toThrow(/"id"/);
      await expect(createAccessToken({ name: 'Alice', email: 'a@b.com' })).rejects.toThrow(/"id"/);
    });

    it('preserves existing behaviour for a valid user', async () => {
      const token = await createAccessToken(validUser);
      expect(typeof token).toBe('string');
      // JWT = header.payload.signature, three dot-separated base64url segments.
      expect(token.split('.').length).toBe(3);

      // Decode the payload and confirm the claims survived round-trip.
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
      expect(payload.sub).toBe('u1');
      expect(payload.name).toBe('Alice');
      expect(payload.email).toBe('alice@example.com');
      expect(payload.type).toBe('access');
      expect(typeof payload.exp).toBe('number');
      expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });
  });

  describe('createRefreshToken', () => {
    it('rejects an invalid user before touching Redis / the in-memory store', async () => {
      await expect(createRefreshToken(null)).rejects.toThrow(/valid user object/);
      await expect(createRefreshToken({ ...validUser, email: '' })).rejects.toThrow(/"email"/);
    });

    it('preserves existing behaviour for a valid user', async () => {
      const token = await createRefreshToken(validUser, 'family-1', 'nonce-1');
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);

      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
      expect(payload.sub).toBe('u1');
      expect(payload.name).toBe('Alice');
      expect(payload.email).toBe('alice@example.com');
      expect(payload.type).toBe('refresh');
      expect(payload.familyId).toBe('family-1');
      expect(payload.nonce).toBe('nonce-1');
    });
  });
});
