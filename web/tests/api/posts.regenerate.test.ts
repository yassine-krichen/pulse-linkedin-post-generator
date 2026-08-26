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
  fullText:
    'Regenerating this post pushed me to rethink how I frame the JWT refresh race condition story for a technical audience. The original draft buried the interesting part under too much setup, so this version leads with the actual failure: two concurrent requests reading the same stale token record before either write committed, both issuing a new refresh token from the same starting point. That collision only showed up once real users hit the system during a peak traffic window, which is exactly the scenario our sequential test suite never exercised. The fix was a unique constraint on the token version column plus a retry loop on conflict, but the real fix was adding concurrent load tests before every release so this class of bug gets caught long before production users ever see it. #Systems',
  imageStrategy: 'No image needed — copy stands alone',
  hashtags: ['#Systems'],
  topicCategory: 'Systems',
});

// Short, and contains a banned phrase from quality-check.ts's BANNED_PHRASES
// list ('no days off') — deliberately trips lintPost so the humanizer pass
// actually runs.
const DIRTY_REGENERATED_STANDARD_POST_JSON = JSON.stringify({
  title: 'Dirty regenerated title',
  hook: 'A short hook.',
  body: 'I ground through this project with no days off, but it was worth it.',
  takeaway: 'Grind pays off.',
  cta: 'Thoughts?',
  fullText:
    'A short hook. I ground through this project with no days off, but it was worth it. Grind pays off. Thoughts? #Systems',
  imageStrategy: 'No image needed — copy stands alone',
  hashtags: ['#Systems'],
  topicCategory: 'Systems',
});

const HUMANIZED_STANDARD_POST_JSON = JSON.stringify({
  hook: 'A revised hook.',
  body: 'A revised body with no clichés.',
  takeaway: 'A revised takeaway.',
  cta: 'What do you think?',
  fullText: 'HUMANIZED_FULLTEXT_MARKER — a revised, clean post. #Systems',
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
    const body: Post & { qualityCheck: { issuesFound: string[]; wasRevised: boolean } } = await res.json();

    expect(res.status).toBe(200);
    expect(body.title).toBe('Regenerated title');
    expect(body.hashtags).toEqual(['#Systems']);
    expect(body.qualityCheck).toEqual({ issuesFound: [], wasRevised: false });
    // Generate only — no 2nd call for the humanizer.
    expect(mockGenerate).toHaveBeenCalledTimes(1);

    const stored = await db.posts.findById(post.id);
    expect(stored?.title).toBe('Regenerated title');
  });

  it('runs the humanizer pass and reports issuesFound/wasRevised when the regenerated draft trips a quality check rule', async () => {
    const post = buildPost();
    await db.posts.create(post);
    createdIds.push(post.id);

    mockGenerate
      .mockResolvedValueOnce(DIRTY_REGENERATED_STANDARD_POST_JSON)
      .mockResolvedValueOnce(HUMANIZED_STANDARD_POST_JSON);

    const req = new NextRequest(`http://localhost/api/posts/${post.id}/regenerate`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await regeneratePost(req, { params: Promise.resolve({ id: post.id }) });
    const body: Post & { qualityCheck: { issuesFound: string[]; wasRevised: boolean } } = await res.json();

    expect(res.status).toBe(200);
    expect(body.qualityCheck.wasRevised).toBe(true);
    expect(body.qualityCheck.issuesFound.length).toBeGreaterThan(0);
    expect(body.qualityCheck.issuesFound.some((issue) => issue.includes('no days off'))).toBe(true);
    // The humanized content replaced the dirty draft's content.
    expect((body.content as { fullText: string }).fullText).toContain('HUMANIZED_FULLTEXT_MARKER');
    // Generate + humanize — the 2nd call proves the humanizer actually ran,
    // not just that qualityCheck reports issues.
    expect(mockGenerate).toHaveBeenCalledTimes(2);

    const stored = await db.posts.findById(post.id);
    expect((stored?.content as { fullText: string }).fullText).toContain('HUMANIZED_FULLTEXT_MARKER');
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
