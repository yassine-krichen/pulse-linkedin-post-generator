import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST as hookVariants } from '@/app/api/posts/[id]/hook-variants/route';
import { generateHookVariants } from '@/lib/prompts/generate';
import { db } from '@/lib/db';
import { CarouselContent, Post, StandardPostContent } from '@/types';

// `generateHookVariants` funnels through `generate()` — mock it directly (the
// route only ever calls this one function from the module) so this test is
// deterministic and network-free while exercising the real route + DB read.
// Prompt construction itself is covered separately in
// tests/lib/prompts/generate.test.ts.
vi.mock('@/lib/prompts/generate', () => ({ generateHookVariants: vi.fn() }));

const mockGenerateHookVariants = vi.mocked(generateHookVariants);

function buildStandardPost(overrides: Partial<Post> = {}): Post {
  const now = new Date().toISOString();
  const content: StandardPostContent = { hook: 'h', body: 'b', takeaway: 't', cta: 'c', fullText: 'h b t c' };
  return {
    id: `hook-variants-test-${crypto.randomUUID()}`,
    rawInput: 'I migrated a JSON store to Postgres and hit a race condition.',
    format: 'standard',
    contentType: 'learned',
    title: 'Original title',
    content,
    imageStrategy: 'No image needed — copy stands alone',
    hashtags: ['#Testing'],
    status: 'draft',
    source: 'user',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function buildCarouselPost(overrides: Partial<Post> = {}): Post {
  const now = new Date().toISOString();
  const content: CarouselContent = {
    slides: [{ slideNumber: 1, title: 'Slide 1', points: ['a'], layoutNotes: 'n', imageStrategy: 'Text only' }],
    fullText: 'slide 1',
  };
  return {
    id: `hook-variants-test-${crypto.randomUUID()}`,
    rawInput: 'I built a carousel about something.',
    format: 'carousel',
    contentType: 'built',
    title: 'Carousel title',
    content,
    imageStrategy: 'Overall carousel visual strategy summary',
    hashtags: ['#Testing'],
    status: 'draft',
    source: 'user',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function hookVariantsRequest(id: string): NextRequest {
  return new NextRequest(`http://localhost/api/posts/${id}/hook-variants`, { method: 'POST' });
}

describe('POST /api/posts/:id/hook-variants', () => {
  const createdIds: string[] = [];

  afterEach(async () => {
    vi.clearAllMocks();
    while (createdIds.length) await db.posts.delete(createdIds.pop() as string);
  });

  it('returns exactly 2 hooks for an existing standard-format post', async () => {
    const post = buildStandardPost();
    await db.posts.create(post);
    createdIds.push(post.id);
    mockGenerateHookVariants.mockResolvedValueOnce(['Alternative hook one.', 'Alternative hook two.']);

    const res = await hookVariants(hookVariantsRequest(post.id), { params: Promise.resolve({ id: post.id }) });
    const body: { hooks: string[] } = await res.json();

    expect(res.status).toBe(200);
    expect(body.hooks).toHaveLength(2);
    expect(body.hooks).toEqual(['Alternative hook one.', 'Alternative hook two.']);
  });

  it('returns a 404 without calling generateHookVariants when the post does not exist', async () => {
    const res = await hookVariants(hookVariantsRequest('does-not-exist'), {
      params: Promise.resolve({ id: 'does-not-exist' }),
    });
    const body: { error: string } = await res.json();

    expect(res.status).toBe(404);
    expect(typeof body.error).toBe('string');
    expect(mockGenerateHookVariants).not.toHaveBeenCalled();
  });

  it('returns a 400 without calling generateHookVariants when the post format is not standard', async () => {
    const post = buildCarouselPost();
    await db.posts.create(post);
    createdIds.push(post.id);

    const res = await hookVariants(hookVariantsRequest(post.id), { params: Promise.resolve({ id: post.id }) });
    const body: { error: string } = await res.json();

    expect(res.status).toBe(400);
    expect(typeof body.error).toBe('string');
    expect(mockGenerateHookVariants).not.toHaveBeenCalled();
  });

  // `checkRateLimit` keeps its bucket in a module-scoped Map keyed by the
  // literal string 'hook-variants', shared across every test in this file
  // that imports the route statically above. Reset modules and dynamically
  // re-import both the route and the mocked generate module so this test
  // gets its own isolated bucket rather than inheriting call counts from
  // the tests above — same pattern as tests/api/login.test.ts.
  it('rejects the 11th request within the rate-limit window with 429', async () => {
    const post = buildStandardPost();
    await db.posts.create(post);
    createdIds.push(post.id);

    vi.resetModules();
    const { POST: freshHookVariants } = await import('@/app/api/posts/[id]/hook-variants/route');
    const { generateHookVariants: freshGenerateHookVariants } = await import('@/lib/prompts/generate');
    vi.mocked(freshGenerateHookVariants).mockResolvedValue(['Alt one.', 'Alt two.']);

    for (let attempt = 0; attempt < 10; attempt++) {
      const res = await freshHookVariants(hookVariantsRequest(post.id), {
        params: Promise.resolve({ id: post.id }),
      });
      expect(res.status).toBe(200);
    }

    const res = await freshHookVariants(hookVariantsRequest(post.id), {
      params: Promise.resolve({ id: post.id }),
    });
    const body: { error: string } = await res.json();

    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBeTruthy();
    expect(body.error).toBeTruthy();
  });
});
