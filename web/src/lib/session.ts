import { createHmac, scryptSync, timingSafeEqual } from 'crypto';

// Single-user app: the session cookie is signed with a key derived from
// APP_PASSWORD itself, so no separate SESSION_SECRET env var is needed.
// Payload is just an expiry timestamp — there's nothing else to store.
//
// The signing key is derived via scrypt (not the raw password) so that a
// leaked cookie can't be offline-brute-forced back into the real password
// at HMAC speed — scrypt is deliberately slow. The salt is fixed/public;
// it only domain-separates this derivation, it isn't a secret itself.

export const SESSION_COOKIE_NAME = 'pulse_session';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const KDF_SALT = 'linkedin-post-generator:session-key:v1';

let cachedKey: { forSecret: string; key: Buffer } | null = null;

function deriveKey(secret: string): Buffer {
  if (cachedKey?.forSecret !== secret) {
    cachedKey = { forSecret: secret, key: scryptSync(secret, KDF_SALT, 32) };
  }
  return cachedKey.key;
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', deriveKey(secret)).update(payload).digest('hex');
}

export interface SessionCookie {
  name: string;
  value: string;
  options: {
    httpOnly: true;
    sameSite: 'lax';
    secure: boolean;
    path: '/';
    maxAge: number;
  };
}

/**
 * Builds a signed session cookie for a successful login.
 * Throws if APP_PASSWORD is unset — callers must check for that first.
 */
export function createSessionCookie(): SessionCookie {
  const secret = process.env.APP_PASSWORD;
  if (!secret) {
    throw new Error('APP_PASSWORD is not configured');
  }

  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = String(expiresAt);
  const signature = sign(payload, secret);
  const value = `${payload}.${signature}`;

  return {
    name: SESSION_COOKIE_NAME,
    value,
    options: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_TTL_MS / 1000,
    },
  };
}

/**
 * Verifies a session cookie value against APP_PASSWORD. Returns false for
 * any missing, malformed, forged, or expired cookie.
 */
export function verifySessionCookie(value: string | undefined): boolean {
  const secret = process.env.APP_PASSWORD;
  if (!secret || !value) return false;

  const dotIndex = value.lastIndexOf('.');
  if (dotIndex === -1) return false;

  const payload = value.slice(0, dotIndex);
  const signature = value.slice(dotIndex + 1);

  const expected = sign(payload, secret);
  const expectedBuf = Buffer.from(expected, 'hex');
  const actualBuf = Buffer.from(signature, 'hex');
  if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
    return false;
  }

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) return false;

  return true;
}
