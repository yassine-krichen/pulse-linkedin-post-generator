import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { config, proxy } from '@/proxy';
import { SESSION_COOKIE_NAME, createSessionCookie } from '@/lib/session';

// `proxy` reads APP_PASSWORD/NODE_ENV from process.env on every call (not
// cached at module load), so plain vi.stubEnv/vi.unstubAllEnvs is enough.

function buildRequest(path: string, sessionCookieValue?: string): NextRequest {
  const headers =
    sessionCookieValue === undefined
      ? undefined
      : { cookie: `${SESSION_COOKIE_NAME}=${sessionCookieValue}` };
  return new NextRequest(`http://localhost${path}`, { headers });
}

describe('proxy', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('when APP_PASSWORD is unset', () => {
    it('passes a page request through outside production', () => {
      vi.stubEnv('APP_PASSWORD', '');
      vi.stubEnv('NODE_ENV', 'development');

      const res = proxy(buildRequest('/planner'));

      expect(res.headers.get('x-middleware-next')).toBe('1');
    });

    it('passes an API request through outside production', () => {
      vi.stubEnv('APP_PASSWORD', '');
      vi.stubEnv('NODE_ENV', 'development');

      const res = proxy(buildRequest('/api/posts'));

      expect(res.headers.get('x-middleware-next')).toBe('1');
    });

    it('blocks a page request in production instead of failing open', () => {
      vi.stubEnv('APP_PASSWORD', '');
      vi.stubEnv('NODE_ENV', 'production');

      const res = proxy(buildRequest('/planner'));

      expect(res.status).toBe(500);
      expect(res.headers.get('x-middleware-next')).toBeNull();
    });

    it('blocks an API request in production with a JSON error instead of failing open', async () => {
      vi.stubEnv('APP_PASSWORD', '');
      vi.stubEnv('NODE_ENV', 'production');

      const res = proxy(buildRequest('/api/posts'));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(typeof body.error).toBe('string');
    });
  });

  describe('when APP_PASSWORD is set', () => {
    it('redirects an unauthenticated page request to /login preserving the original path and query', () => {
      vi.stubEnv('APP_PASSWORD', 'the-password');

      const res = proxy(buildRequest('/planner?tab=drafts'));

      expect(res.status).toBe(307);
      const location = new URL(res.headers.get('location') ?? '');
      expect(location.pathname).toBe('/login');
      expect(location.searchParams.get('next')).toBe('/planner?tab=drafts');
    });

    it('returns 401 JSON for an unauthenticated API request instead of redirecting', async () => {
      vi.stubEnv('APP_PASSWORD', 'the-password');

      const res = proxy(buildRequest('/api/posts'));
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(typeof body.error).toBe('string');
    });

    it('redirects a page request carrying an invalid session cookie, same as no cookie', () => {
      vi.stubEnv('APP_PASSWORD', 'the-password');

      const res = proxy(buildRequest('/planner', 'garbage.notasignature'));

      expect(res.status).toBe(307);
    });

    it('passes a page request through with a valid session cookie', () => {
      vi.stubEnv('APP_PASSWORD', 'the-password');
      const cookie = createSessionCookie();

      const res = proxy(buildRequest('/planner', cookie.value));

      expect(res.headers.get('x-middleware-next')).toBe('1');
    });

    it('passes an API request through with a valid session cookie', () => {
      vi.stubEnv('APP_PASSWORD', 'the-password');
      const cookie = createSessionCookie();

      const res = proxy(buildRequest('/api/posts', cookie.value));

      expect(res.headers.get('x-middleware-next')).toBe('1');
    });
  });

  // /login, /api/login, /stats, /api/public-stats, and /api/demo are
  // excluded from ever running the `proxy` function at all, via the
  // exported route matcher below — Next.js's routing layer consults this
  // config before invoking `proxy`, so calling `proxy()` directly with
  // those paths would not reflect real behavior (there is no in-function
  // special case for them). Full behavioral coverage of "these paths are
  // never gated" would need a running dev/prod server and is out of scope
  // for a unit test; this asserts the matcher pattern itself hasn't
  // regressed to stop excluding them.
  it('excludes /login, /api/login, /stats, /api/public-stats, and /api/demo from the route matcher', () => {
    expect(config.matcher).toEqual([
      '/((?!login$|api/login$|stats$|api/public-stats$|api/demo$|_next/static|_next/image|favicon.ico).*)',
    ]);
  });
});
