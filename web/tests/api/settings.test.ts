import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it } from 'vitest';
import { GET as getSettings, PATCH as patchSettings } from '@/app/api/settings/route';
import { db } from '@/lib/db';
import { Settings } from '@/types';

describe('GET /api/settings', () => {
  it('returns the current settings', async () => {
    const res = await getSettings();
    const body: Settings = await res.json();

    expect(res.status).toBe(200);
    expect(typeof body.weeklyTarget).toBe('number');
  });
});

describe('PATCH /api/settings', () => {
  afterEach(async () => {
    // Settings is a single global row — restore the default so other tests
    // (and the db.settings suite in tests/lib/db.test.ts) see a clean slate.
    await db.settings.update({ weeklyTarget: 1 });
  });

  it('updates weeklyTarget and returns the persisted value', async () => {
    const req = new NextRequest('http://localhost/api/settings', {
      method: 'PATCH',
      body: JSON.stringify({ weeklyTarget: 5 }),
    });
    const res = await patchSettings(req);
    const body: Settings = await res.json();

    expect(res.status).toBe(200);
    expect(body.weeklyTarget).toBe(5);
    expect(await db.settings.get()).toEqual({ weeklyTarget: 5 });
  });

  it('rejects a weeklyTarget below the allowed minimum with a 400', async () => {
    const req = new NextRequest('http://localhost/api/settings', {
      method: 'PATCH',
      body: JSON.stringify({ weeklyTarget: 0 }),
    });
    const res = await patchSettings(req);
    const body: { error: string } = await res.json();

    expect(res.status).toBe(400);
    expect(typeof body.error).toBe('string');
  });

  it('rejects a body containing a non-whitelisted field with a 400', async () => {
    const req = new NextRequest('http://localhost/api/settings', {
      method: 'PATCH',
      body: JSON.stringify({ weeklyTarget: 3, hacked: true }),
    });
    const res = await patchSettings(req);

    expect(res.status).toBe(400);
  });
});
