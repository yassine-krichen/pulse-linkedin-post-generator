import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it } from 'vitest';
import { GET as listPosts } from '@/app/api/posts/route';
import { PATCH as patchPost } from '@/app/api/posts/[id]/route';
import { db } from '@/lib/db';
import { Post } from '@/types';

function buildPost(overrides: Partial<Post> = {}): Post {
  const now = new Date().toISOString();
  return {
    id: `route-test-${crypto.randomUUID()}`,
    rawInput: 'Testing the posts API route against a real database.',
    format: 'standard',
    title: 'Route test post',
    content: { hook: 'h', body: 'b', takeaway: 't', cta: 'c', fullText: 'h b t c' },
    imageStrategy: 'No image needed — copy stands alone',
    hashtags: ['#Testing'],
    status: 'draft',
    source: 'user',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('GET /api/posts', () => {
  const createdIds: string[] = [];

  afterEach(async () => {
    while (createdIds.length) await db.posts.delete(createdIds.pop() as string);
  });

  it('filters by status query param', async () => {
    const ready = buildPost({ status: 'ready' });
    await db.posts.create(ready);
    createdIds.push(ready.id);

    const req = new NextRequest('http://localhost/api/posts?status=ready');
    const res = await listPosts(req);
    const body: Post[] = await res.json();

    expect(res.status).toBe(200);
    expect(body.some((p) => p.id === ready.id)).toBe(true);
    expect(body.every((p) => p.status === 'ready')).toBe(true);
  });

  it('returns 400 for an invalid status value', async () => {
    const req = new NextRequest('http://localhost/api/posts?status=archived');
    const res = await listPosts(req);
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/posts/:id', () => {
  const createdIds: string[] = [];

  afterEach(async () => {
    while (createdIds.length) await db.posts.delete(createdIds.pop() as string);
  });

  it('applies a whitelisted update', async () => {
    const post = buildPost();
    await db.posts.create(post);
    createdIds.push(post.id);

    const req = new NextRequest(`http://localhost/api/posts/${post.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'posted' }),
    });
    const res = await patchPost(req, { params: Promise.resolve({ id: post.id }) });
    const body: Post = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('posted');
  });

  it('rejects a body containing a non-whitelisted field', async () => {
    const post = buildPost();
    await db.posts.create(post);
    createdIds.push(post.id);

    const req = new NextRequest(`http://localhost/api/posts/${post.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'posted', id: 'hijacked' }),
    });
    const res = await patchPost(req, { params: Promise.resolve({ id: post.id }) });

    expect(res.status).toBe(400);
  });

  it('returns 404 when the post does not exist', async () => {
    const req = new NextRequest('http://localhost/api/posts/missing', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'posted' }),
    });
    const res = await patchPost(req, { params: Promise.resolve({ id: 'missing' }) });
    expect(res.status).toBe(404);
  });
});
