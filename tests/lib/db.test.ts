import { afterEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { Post } from '@/types';

function buildPost(overrides: Partial<Post> = {}): Post {
  const now = new Date().toISOString();
  return {
    id: `test-${crypto.randomUUID()}`,
    rawInput: 'I migrated the JSON file store to Prisma + SQLite.',
    format: 'standard',
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

    const readyPosts = await db.posts.findByStatus('ready');
    expect(readyPosts.map((p) => p.id)).toContain(ready.id);
    expect(readyPosts.map((p) => p.id)).not.toContain(draft.id);
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
