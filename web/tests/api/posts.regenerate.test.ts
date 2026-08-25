import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST as regeneratePost } from '@/app/api/posts/[id]/regenerate/route';
import { generate } from '@/lib/llm';
import { db } from '@/lib/db';
import { Post } from '@/types';

// `generatePost` funnels through `generate()` — mock it so these tests are
// deterministic and network-free while exercising the real route + DB write.
vi.mock('@/lib/llm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/llm')>();
  return { ...actual, generate: vi.fn() };
});

const mockGenerate = vi.mocked(generate);

function buildPost(overrides: Partial<Post> = {}): Post {
  const now = new Date().toISOString();
  return {
    id: `regen-test-${crypto.randomUUID()}`,
    rawInput: 'I migrated a JSON store to Postgres and hit a race condition.',
    format: 'standard',
    contentType: 'learned',
    title: 'Original title',
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

const REGENERATED_STANDARD_POST_JSON = JSON.stringify({
  title: 'Regenerated title',
  hook: 'A new hook.',
  body: 'A new body.',
  takeaway: 'A new takeaway.',
  cta: 'What do you think?',
  fullText: 'A new hook.\n\nA new body.\n\nA new takeaway.\n\nWhat do you think?',
  imageStrategy: 'No image needed — copy stands alone',
  hashtags: ['#Systems'],
  topicCategory: 'Systems',
});

describe('POST /api/posts/:id/regenerate', () => {
  const createdIds: string[] = [];

  afterEach(async () => {
    vi.clearAllMocks();
    while (createdIds.length) await db.posts.delete(createdIds.pop() as string);
  });

  it('regenerates content for an existing post and persists the update', async () => {
    const post = buildPost();
    await db.posts.create(post);
    createdIds.push(post.id);

    mockGenerate.mockResolvedValueOnce(REGENERATED_STANDARD_POST_JSON);

    const req = new NextRequest(`http://localhost/api/posts/${post.id}/regenerate`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await regeneratePost(req, { params: Promise.resolve({ id: post.id }) });
    const body: Post = await res.json();

    expect(res.status).toBe(200);
    expect(body.title).toBe('Regenerated title');
    expect(body.hashtags).toEqual(['#Systems']);

    const stored = await db.posts.findById(post.id);
    expect(stored?.title).toBe('Regenerated title');
  });

  it('returns a 404 instead of crashing when the post does not exist', async () => {
    const req = new NextRequest('http://localhost/api/posts/does-not-exist/regenerate', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await regeneratePost(req, { params: Promise.resolve({ id: 'does-not-exist' }) });
    const body: { error: string } = await res.json();

    expect(res.status).toBe(404);
    expect(typeof body.error).toBe('string');
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('returns a structured 500 error instead of crashing when the LLM call fails', async () => {
    const post = buildPost();
    await db.posts.create(post);
    createdIds.push(post.id);

    mockGenerate.mockRejectedValueOnce(new Error('freellmapi broke'));

    const req = new NextRequest(`http://localhost/api/posts/${post.id}/regenerate`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await regeneratePost(req, { params: Promise.resolve({ id: post.id }) });
    const body: { error: string } = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('freellmapi broke');

    const stored = await db.posts.findById(post.id);
    expect(stored?.title).toBe('Original title');
  });
});
