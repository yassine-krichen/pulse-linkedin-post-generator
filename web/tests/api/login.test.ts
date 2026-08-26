import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { verifySessionCookie, SESSION_COOKIE_NAME } from '@/lib/session';
import type { POST as PostType } from '@/app/api/login/route';

// `checkRateLimit` keeps its bucket in a module-scoped Map, keyed by the
// literal string 'login'. If the route module were imported once at the
// top of this file, every test would share (and drain) the same bucket,
// making tests order-dependent. Reset modules and re-import the route
// fresh in each test so every test gets its own isolated rate-limit bucket
// — same pattern as tests/lib/llm.generate.test.ts.
async function importLoginPost(): Promise<typeof PostType> {
  const mod = await import('@/app/api/login/route');
  return mod.POST;
}

function loginRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/login', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('sets a verifiable session cookie and returns success for the correct password', async () => {
    vi.stubEnv('APP_PASSWORD', 'the-correct-password');
    const POST = await importLoginPost();

    const res = await POST(loginRequest({ password: 'the-correct-password' }));
    const body: { success: boolean } = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true });

    const setCookie = res.cookies.get(SESSION_COOKIE_NAME)?.value;
    expect(setCookie).toBeTruthy();
    expect(verifySessionCookie(setCookie)).toBe(true);
  });

  it('returns a generic 401 without setting a cookie for a wrong password', async () => {
    vi.stubEnv('APP_PASSWORD', 'the-correct-password');
    const POST = await importLoginPost();

    const res = await POST(loginRequest({ password: 'totally-wrong' }));
    const body: { error: string } = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Invalid password');
    expect(res.cookies.get(SESSION_COOKIE_NAME)).toBeUndefined();
  });

  it('returns the same generic 401 without crashing when APP_PASSWORD is not configured', async () => {
    vi.stubEnv('APP_PASSWORD', '');
    const POST = await importLoginPost();

    const res = await POST(loginRequest({ password: 'anything' }));
    const body: { error: string } = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Invalid password');
    expect(res.cookies.get(SESSION_COOKIE_NAME)).toBeUndefined();
  });

  it('returns 400 for a missing password field', async () => {
    vi.stubEnv('APP_PASSWORD', 'the-correct-password');
    const POST = await importLoginPost();

    const res = await POST(loginRequest({}));

    expect(res.status).toBe(400);
  });

  it('returns 400 for an empty password string', async () => {
    vi.stubEnv('APP_PASSWORD', 'the-correct-password');
    const POST = await importLoginPost();

    const res = await POST(loginRequest({ password: '' }));

    expect(res.status).toBe(400);
  });

  it('returns 400 for a malformed JSON body instead of crashing', async () => {
    vi.stubEnv('APP_PASSWORD', 'the-correct-password');
    const POST = await importLoginPost();

    const req = new NextRequest('http://localhost/api/login', {
      method: 'POST',
      body: '{not valid json',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('rejects the 6th attempt within the rate-limit window with 429', async () => {
    vi.stubEnv('APP_PASSWORD', 'the-correct-password');
    const POST = await importLoginPost();

    for (let attempt = 0; attempt < 5; attempt++) {
      const res = await POST(loginRequest({ password: 'wrong-on-purpose' }));
      expect(res.status).toBe(401);
    }

    const res = await POST(loginRequest({ password: 'wrong-on-purpose' }));
    const body: { error: string } = await res.json();

    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBeTruthy();
    expect(body.error).toBeTruthy();
  });
});
