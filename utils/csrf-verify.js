import crypto from 'crypto';

// Cache recently rotated secrets for a short grace window (60s) to handle parallel in-flight async requests
const recentRotatedSecrets = new Map();

export function recordRotatedSecret(oldSecret) {
  if (!oldSecret) return;
  recentRotatedSecrets.set(oldSecret, Date.now() + 60000);
}

// Clean up expired entries every minute
const sweeper = setInterval(() => {
  const now = Date.now();
  for (const [secret, expiresAt] of recentRotatedSecrets.entries()) {
    if (now > expiresAt) {
      recentRotatedSecrets.delete(secret);
    }
  }
}, 60000);
if (sweeper.unref) sweeper.unref();

function generateExpectedToken(secret) {
  return crypto
    .createHmac('sha256', process.env.CSRF_SALT || 'infinity-verse-secure-salt')
    .update(secret)
    .digest('hex');
}

function compareTokens(token, expectedToken) {
  const tokenBuffer = Buffer.from(token);
  const expectedBuffer = Buffer.from(expectedToken);
  if (tokenBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(tokenBuffer, expectedBuffer);
}

/**
 * Validates a CSRF token using the Double-Submit Cookie pattern.
 * Compares the token from the request header against the signed secret in the HttpOnly cookie.
 */
export function verifyCsrfToken(req) {
  try {
    const cookies = req.headers?.cookie || '';
    const match = cookies.match(/csrfSecret=([^;]+)/);
    const secret = match ? match[1] : null;

    const token = req.headers?.['x-csrf-token'] || req.body?.csrfToken;

    if (!token) {
      return false;
    }

    if (secret) {
      const expectedToken = generateExpectedToken(secret);
      if (compareTokens(token, expectedToken)) {
        return true;
      }
    }

    // Check grace-period map for recently rotated secrets during concurrent requests
    for (const [oldSecret, expiresAt] of recentRotatedSecrets.entries()) {
      if (Date.now() <= expiresAt) {
        const expectedOldToken = generateExpectedToken(oldSecret);
        if (compareTokens(token, expectedOldToken)) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error('CSRF Verification Error:', error);
    return false;
  }
}
