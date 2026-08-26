import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SESSION_COOKIE_NAME, createSessionCookie, verifySessionCookie } from '@/lib/session';

// `createSessionCookie`/`verifySessionCookie` read APP_PASSWORD from
// process.env on every call (not cached at module load), so plain
// vi.stubEnv/vi.unstubAllEnvs is enough here — no module reset needed.

describe('createSessionCookie', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('throws when APP_PASSWORD is not configured', () => {
    vi.stubEnv('APP_PASSWORD', '');
    expect(() => createSessionCookie()).toThrow('APP_PASSWORD is not configured');
  });

  it('names the cookie pulse_session', () => {
    vi.stubEnv('APP_PASSWORD', 'correct-horse-battery-staple');
    const cookie = createSessionCookie();
    expect(cookie.name).toBe(SESSION_COOKIE_NAME);
  });
});

describe('verifySessionCookie', () => {
  beforeEach(() => {
    vi.stubEnv('APP_PASSWORD', 'correct-horse-battery-staple');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it('verifies a cookie it just created as valid', () => {
    const cookie = createSessionCookie();
    expect(verifySessionCookie(cookie.value)).toBe(true);
  });

  it('rejects a cookie whose signature has been tampered with', () => {
    const cookie = createSessionCookie();
    const [payload, signature] = cookie.value.split('.');
    const tamperedFirstChar = signature[0] === '0' ? '1' : '0';
    const tampered = `${payload}.${tamperedFirstChar}${signature.slice(1)}`;

    expect(verifySessionCookie(tampered)).toBe(false);
  });

  it('rejects a cookie whose payload has been tampered with', () => {
    const cookie = createSessionCookie();
    const [payload, signature] = cookie.value.split('.');
    const tamperedPayload = String(Number(payload) + 1);

    expect(verifySessionCookie(`${tamperedPayload}.${signature}`)).toBe(false);
  });

  it('rejects a cookie that expired in the past', () => {
    vi.useFakeTimers();
    const cookie = createSessionCookie();

    vi.advanceTimersByTime(31 * 24 * 60 * 60 * 1000); // past the 30-day TTL

    expect(verifySessionCookie(cookie.value)).toBe(false);
  });

  it.each([
    ['undefined', undefined],
    ['empty string', ''],
    ['a string with no signature separator', 'no-dot-here'],
    ['just a dot', '.'],
    ['a payload with an empty signature', '123.'],
    ['random garbage', 'garbage.notreal'],
  ])('returns false without throwing for %s', (_label, value) => {
    expect(() => verifySessionCookie(value)).not.toThrow();
    expect(verifySessionCookie(value)).toBe(false);
  });

  it('rejects a cookie signed with a different APP_PASSWORD', () => {
    const cookie = createSessionCookie();

    vi.stubEnv('APP_PASSWORD', 'a-completely-different-password');

    expect(verifySessionCookie(cookie.value)).toBe(false);
  });

  it('returns false for an otherwise well-formed cookie when APP_PASSWORD is unset', () => {
    const cookie = createSessionCookie();

    vi.stubEnv('APP_PASSWORD', '');

    expect(verifySessionCookie(cookie.value)).toBe(false);
  });
});
