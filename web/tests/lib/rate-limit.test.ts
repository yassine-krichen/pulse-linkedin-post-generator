import { describe, expect, it } from 'vitest';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

function requestWithHeaders(headers: Record<string, string>): Request {
  return new Request('http://localhost/api/demo', { headers });
}

describe('getClientIp', () => {
  it('returns the single x-forwarded-for entry when there is no proxy chain', () => {
    const req = requestWithHeaders({ 'x-forwarded-for': '1.2.3.4' });

    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('returns the LAST x-forwarded-for entry, not a caller-spoofed leading one', () => {
    // '203.0.113.1' is attacker-supplied; '10.0.0.5' is what the trusted
    // Render reverse proxy actually appended. Taking the first entry here
    // (the old, buggy behavior) would return the spoofed value instead —
    // this is the regression test for that fix.
    const req = requestWithHeaders({ 'x-forwarded-for': '203.0.113.1, 10.0.0.5' });

    expect(getClientIp(req)).toBe('10.0.0.5');
  });

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const req = requestWithHeaders({ 'x-real-ip': '5.6.7.8' });

    expect(getClientIp(req)).toBe('5.6.7.8');
  });

  it('returns "unknown" when neither header is present', () => {
    const req = requestWithHeaders({});

    expect(getClientIp(req)).toBe('unknown');
  });
});

describe('checkRateLimit', () => {
  it('allows requests up to the limit and rejects the next one with a positive retryAfterSeconds', () => {
    const key = `rate-limit-test:${crypto.randomUUID()}`;

    expect(checkRateLimit(key, 2, 60_000)).toEqual({ allowed: true, retryAfterSeconds: 0 });
    expect(checkRateLimit(key, 2, 60_000)).toEqual({ allowed: true, retryAfterSeconds: 0 });

    const result = checkRateLimit(key, 2, 60_000);

    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });
});
