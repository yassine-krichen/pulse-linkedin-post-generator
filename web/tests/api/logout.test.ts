import { describe, expect, it } from 'vitest';
import { POST as logout } from '@/app/api/logout/route';
import { SESSION_COOKIE_NAME } from '@/lib/session';

describe('POST /api/logout', () => {
  it('clears the session cookie by expiring it', async () => {
    const res = await logout();
    const body: { success: boolean } = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true });

    const cleared = res.cookies.get(SESSION_COOKIE_NAME);
    expect(cleared).toBeDefined();
    expect(cleared?.value).toBe('');
    expect(new Date(cleared?.expires ?? Date.now()).getTime()).toBeLessThan(Date.now());
  });
});
