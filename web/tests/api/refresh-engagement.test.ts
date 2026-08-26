import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST as refreshEngagement } from '@/app/api/posts/[id]/refresh-engagement/route';
import { fetchEngagement } from '@/lib/linkedin-engagement';
import { db } from '@/lib/db';
import { Post } from '@/types';

// `fetchEngagement` scrapes a real LinkedIn page over the network — mock it
// so this test exercises the real route + DB write without a live HTTP call
// (that contract is covered separately in tests/lib/linkedin-engagement.test.ts).
vi.mock('@/lib/linkedin-engagement', () => ({ fetchEngagement: vi.fn() }));

const mockFetchEngagement = vi.mocked(fetchEngagement);

function buildPost(overrides: Partial<Post> = {}): Post {
  const now = new Date().toISOString();
  return {
    id: `refresh-engagement-test-${crypto.randomUUID()}`,
    rawInput: 'I migrated a JSON store to Postgres and hit a race condition.',
    format: 'standard',
    contentType: 'learned',
    title: 'Original title',
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

describe('POST /api/posts/:id/refresh-engagement', () => {
  const createdIds: string[] = [];

  afterEach(async () => {
    vi.clearAllMocks();
    while (createdIds.length) await db.posts.delete(createdIds.pop() as string);
  });

  it('persists likes and comments and returns refreshed: true when fetchEngagement finds data', async () => {
    const post = buildPost({ postUrl: 'https://www.linkedin.com/posts/example-activity-123' });
    await db.posts.create(post);
    createdIds.push(post.id);

    mockFetchEngagement.mockResolvedValueOnce({ likes: 42, comments: 7 });

    const req = new NextRequest(`http://localhost/api/posts/${post.id}/refresh-engagement`, {
      method: 'POST',
    });
    const res = await refreshEngagement(req, { params: Promise.resolve({ id: post.id }) });
    const body: { post: Post; refreshed: boolean } = await res.json();

    expect(res.status).toBe(200);
    expect(body.refreshed).toBe(true);
    expect(body.post.likes).toBe(42);
    expect(body.post.comments).toBe(7);

    const stored = await db.posts.findById(post.id);
    expect(stored?.likes).toBe(42);
    expect(stored?.comments).toBe(7);
  });

  it('returns a 400 without calling fetchEngagement when the post has no postUrl', async () => {
    const post = buildPost({ postUrl: null });
    await db.posts.create(post);
    createdIds.push(post.id);

    const req = new NextRequest(`http://localhost/api/posts/${post.id}/refresh-engagement`, {
      method: 'POST',
    });
    const res = await refreshEngagement(req, { params: Promise.resolve({ id: post.id }) });
    const body: { error: string } = await res.json();

    expect(res.status).toBe(400);
    expect(typeof body.error).toBe('string');
    expect(mockFetchEngagement).not.toHaveBeenCalled();
  });

  it('returns 200 with refreshed: false and leaves the post unchanged when fetchEngagement finds nothing', async () => {
    const post = buildPost({ postUrl: 'https://www.linkedin.com/posts/example-activity-456' });
    await db.posts.create(post);
    createdIds.push(post.id);
    // `create` doesn't persist likes/comments (see fromPost in @/lib/db) —
    // set a baseline via `update` so we can assert it's untouched afterward.
    await db.posts.update(post.id, { likes: 5, comments: 2 });

    mockFetchEngagement.mockResolvedValueOnce(null);

    const req = new NextRequest(`http://localhost/api/posts/${post.id}/refresh-engagement`, {
      method: 'POST',
    });
    const res = await refreshEngagement(req, { params: Promise.resolve({ id: post.id }) });
    const body: { post: Post; refreshed: boolean } = await res.json();

    expect(res.status).toBe(200);
    expect(body.refreshed).toBe(false);

    const stored = await db.posts.findById(post.id);
    expect(stored?.likes).toBe(5);
    expect(stored?.comments).toBe(2);
  });

  it('returns a 404 instead of crashing when the post does not exist', async () => {
    const req = new NextRequest('http://localhost/api/posts/does-not-exist/refresh-engagement', {
      method: 'POST',
    });
    const res = await refreshEngagement(req, { params: Promise.resolve({ id: 'does-not-exist' }) });
    const body: { error: string } = await res.json();

    expect(res.status).toBe(404);
    expect(typeof body.error).toBe('string');
    expect(mockFetchEngagement).not.toHaveBeenCalled();
  });
});
