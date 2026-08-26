import { afterEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { Post } from '@/types';

function buildPost(overrides: Partial<Post> = {}): Post {
  const now = new Date().toISOString();
  return {
    id: `test-${crypto.randomUUID()}`,
    rawInput: 'I migrated the JSON file store to Prisma + Postgres.',
    format: 'standard',
    contentType: 'built',
    title: 'DB migration test post',
    content: { hook: 'h', body: 'b', takeaway: 't', cta: 'c', fullText: 'h b t c' },
    imageStrategy: 'No image needed — copy stands alone',
    hashtags: ['#Testing'],
    status: 'draft',
    source: 'user',
    topicCategory: 'Systems',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('db.posts', () => {
  const createdIds: string[] = [];

  afterEach(async () => {
    while (createdIds.length) {
      await db.posts.delete(createdIds.pop() as string);
    }
  });

  it('creates a post and finds it by id', async () => {
    const post = buildPost();
    await db.posts.create(post);
    createdIds.push(post.id);

    const found = await db.posts.findById(post.id);
    expect(found?.title).toBe(post.title);
    expect(found?.content).toEqual(post.content);
    expect(found?.hashtags).toEqual(['#Testing']);
  });

  it('filters posts by status', async () => {
    const draft = buildPost({ status: 'draft' });
    const ready = buildPost({ status: 'ready' });
    await db.posts.create(draft);
    await db.posts.create(ready);
    createdIds.push(draft.id, ready.id);

    const { posts: readyPosts, total } = await db.posts.findByStatus('ready');
    expect(readyPosts.map((p) => p.id)).toContain(ready.id);
    expect(readyPosts.map((p) => p.id)).not.toContain(draft.id);
    expect(total).toBeGreaterThanOrEqual(1);
  });

  it('paginates findAll with limit and offset', async () => {
    const a = buildPost();
    const b = buildPost();
    await db.posts.create(a);
    await db.posts.create(b);
    createdIds.push(a.id, b.id);

    const page = await db.posts.findAll({ limit: 1, offset: 0 });
    expect(page.posts).toHaveLength(1);
    expect(page.total).toBeGreaterThanOrEqual(2);
  });

  it('updates only the provided fields and bumps updatedAt', async () => {
    const post = buildPost();
    await db.posts.create(post);
    createdIds.push(post.id);

    const updated = await db.posts.update(post.id, { status: 'posted' });
    expect(updated?.status).toBe('posted');
    expect(updated?.title).toBe(post.title);
  });

  it('clears scheduledDate when explicitly set to null', async () => {
    const post = buildPost({ scheduledDate: new Date().toISOString() });
    await db.posts.create(post);
    createdIds.push(post.id);

    const cleared = await db.posts.update(post.id, { scheduledDate: null });
    expect(cleared?.scheduledDate).toBeUndefined();
  });

  it('returns null when updating a post that does not exist', async () => {
    const result = await db.posts.update('does-not-exist', { status: 'posted' });
    expect(result).toBeNull();
  });

  it('deletes a post and returns false on a second delete', async () => {
    const post = buildPost();
    await db.posts.create(post);

    expect(await db.posts.delete(post.id)).toBe(true);
    expect(await db.posts.delete(post.id)).toBe(false);
  });
});

describe('db.posts.publicStats', () => {
  const createdIds: string[] = [];

  afterEach(async () => {
    while (createdIds.length) {
      await db.posts.delete(createdIds.pop() as string);
    }
  });

  it('aggregates counts and avgEngagementRate from posted posts only, excluding drafts entirely', async () => {
    // Global DB state can't be assumed empty or quiescent (shared dev
    // database, not an isolated test DB, and other integration test files
    // run concurrently against it — see vitest.integration.config.ts).
    // Comparing a "before" snapshot to an "after" snapshot is itself racy
    // here (a concurrent file's own afterEach cleanup can delete rows
    // between the two calls and make counts go down, not just up), so this
    // asserts absolute floors/ceilings from a single post-fixture snapshot
    // instead — same style as the `toBeGreaterThanOrEqual` assertions
    // elsewhere in this file for shared, non-isolated counts.
    const posted1 = buildPost({ status: 'posted' });
    const posted2 = buildPost({ status: 'posted' });
    const draft = buildPost({ status: 'draft' });
    for (const post of [posted1, posted2, draft]) {
      await db.posts.create(post);
      createdIds.push(post.id);
    }
    // `create` doesn't persist engagement fields (see fromPost in @/lib/db)
    // — set them via `update`, same pattern as refresh-engagement.test.ts.
    await db.posts.update(posted1.id, { impressions: 1000, likes: 50, comments: 10, shares: 5 });
    await db.posts.update(posted2.id, { impressions: 500, likes: 20, comments: 5, shares: 2 });
    // Draft engagement must never be counted. This project is a single-user
    // personal tool — real DB-wide totals (plus whatever small fixtures any
    // concurrently-running test file contributes) will never plausibly
    // reach anywhere near this magnitude, so a total below it proves the
    // draft's numbers didn't leak in.
    const DRAFT_ENGAGEMENT = 50_000_000;
    await db.posts.update(draft.id, {
      impressions: DRAFT_ENGAGEMENT,
      likes: DRAFT_ENGAGEMENT,
      comments: DRAFT_ENGAGEMENT,
      shares: DRAFT_ENGAGEMENT,
    });

    const after = await db.posts.publicStats();

    expect(after.totalPostsGenerated).toBeGreaterThanOrEqual(3);
    expect(after.totalPostsPosted).toBeGreaterThanOrEqual(2);
    expect(after.totalImpressions).toBeGreaterThanOrEqual(1500);
    expect(after.totalLikes).toBeGreaterThanOrEqual(70);
    expect(after.totalComments).toBeGreaterThanOrEqual(15);
    expect(after.totalShares).toBeGreaterThanOrEqual(7);

    // The draft's huge numbers must be excluded — if they'd leaked in, these
    // totals would be in the tens of millions.
    expect(after.totalImpressions).toBeLessThan(DRAFT_ENGAGEMENT);
    expect(after.totalLikes).toBeLessThan(DRAFT_ENGAGEMENT);
    expect(after.totalComments).toBeLessThan(DRAFT_ENGAGEMENT);
    expect(after.totalShares).toBeLessThan(DRAFT_ENGAGEMENT);

    // avgEngagementRate is a pure function of the totals this same call
    // returned — recomputing it independently from those totals catches a
    // wrong formula (swapped numerator/denominator, wrong fields) without
    // depending on exclusive access to the DB.
    const expectedRate =
      ((after.totalLikes + after.totalComments + after.totalShares) / after.totalImpressions) * 100;
    expect(after.avgEngagementRate).toBeCloseTo(expectedRate, 10);

    expect(after).not.toHaveProperty('bestPost');
  });
});

describe('db.settings', () => {
  it('defaults weeklyTarget to 1 when nothing has been saved', async () => {
    expect(await db.settings.get()).toEqual({ weeklyTarget: 1 });
  });

  it('persists an updated weeklyTarget', async () => {
    await db.settings.update({ weeklyTarget: 5 });
    expect(await db.settings.get()).toEqual({ weeklyTarget: 5 });
    await db.settings.update({ weeklyTarget: 1 });
  });
});
