import { afterEach, describe, expect, it } from 'vitest';
import { GET as getPublicStats } from '@/app/api/public-stats/route';
import { db } from '@/lib/db';
import { Post } from '@/types';

function buildPost(overrides: Partial<Post> = {}): Post {
  const now = new Date().toISOString();
  return {
    id: `public-stats-test-${crypto.randomUUID()}`,
    rawInput: 'SECRET_RAW_INPUT_MARKER — must never reach the public, unauthenticated stats route.',
    format: 'standard',
    contentType: 'built',
    title: 'SECRET_POST_TITLE_MARKER',
    content: { hook: 'h', body: 'b', takeaway: 't', cta: 'c', fullText: 'h b t c' },
    imageStrategy: 'No image needed — copy stands alone',
    hashtags: ['#Testing'],
    status: 'posted',
    source: 'user',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('GET /api/public-stats', () => {
  const createdIds: string[] = [];

  afterEach(async () => {
    while (createdIds.length) await db.posts.delete(createdIds.pop() as string);
  });

  it('returns 200 with every field shaped as a number', async () => {
    const res = await getPublicStats();
    const body: Record<string, unknown> = await res.json();

    expect(res.status).toBe(200);
    expect(typeof body.totalPostsGenerated).toBe('number');
    expect(typeof body.totalPostsPosted).toBe('number');
    expect(typeof body.totalImpressions).toBe('number');
    expect(typeof body.totalLikes).toBe('number');
    expect(typeof body.totalComments).toBe('number');
    expect(typeof body.totalShares).toBe('number');
    expect(typeof body.avgEngagementRate).toBe('number');
  });

  // This is the load-bearing privacy test: the route has no auth gate (it's
  // deliberately excluded in src/proxy.ts for the public /stats page), so the
  // response must never carry bestPost, post titles, or rawInput — a shape
  // check alone wouldn't catch a regression that adds one of these fields
  // back in, so this asserts the exact key set and greps the raw JSON for
  // leaked content.
  it('never leaks bestPost, post titles, or rawInput even when a high-engagement posted post exists', async () => {
    const post = buildPost({ status: 'posted' });
    await db.posts.create(post);
    createdIds.push(post.id);
    // `create` doesn't persist engagement fields (see fromPost in @/lib/db).
    await db.posts.update(post.id, { impressions: 100_000, likes: 5000, comments: 500, shares: 200 });

    const res = await getPublicStats();
    const body: Record<string, unknown> = await res.json();
    const raw = JSON.stringify(body);

    expect(body).not.toHaveProperty('bestPost');
    expect(body).not.toHaveProperty('title');
    expect(body).not.toHaveProperty('rawInput');
    expect(raw).not.toContain('SECRET_POST_TITLE_MARKER');
    expect(raw).not.toContain('SECRET_RAW_INPUT_MARKER');
    expect(Object.keys(body).sort()).toEqual(
      [
        'totalPostsGenerated',
        'totalPostsPosted',
        'totalImpressions',
        'totalLikes',
        'totalComments',
        'totalShares',
        'avgEngagementRate',
      ].sort(),
    );
  });
});
