import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST as pipeline } from '@/app/api/pipeline/route';
import { generate } from '@/lib/llm';
import { db } from '@/lib/db';
import { Post } from '@/types';

// `evaluate`, `classify`, and `generatePost` all funnel through `generate()`.
// Mocking it here keeps these tests deterministic and network-free while
// still exercising the real pipeline route, schema validation, and DB write.
vi.mock('@/lib/llm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/llm')>();
  return { ...actual, generate: vi.fn() };
});

const mockGenerate = vi.mocked(generate);

const EVALUATION_JSON = JSON.stringify({
  worthy: true,
  reason: 'Specific and technically interesting.',
  classifiedAs: 'learned',
});

const CLASSIFICATION_JSON = JSON.stringify({
  format: 'standard',
  reason: 'Single clear insight.',
});

const STANDARD_POST_JSON = JSON.stringify({
  title: 'Pipeline test title',
  hook: 'A surprising hook.',
  body: 'The body of the post.',
  takeaway: 'The takeaway.',
  cta: 'Thoughts?',
  fullText: 'A surprising hook.\n\nThe body of the post.\n\nThe takeaway.\n\nThoughts?',
  imageStrategy: 'No image needed — copy stands alone',
  hashtags: ['#Systems', '#Testing'],
  topicCategory: 'Systems',
});

describe('POST /api/pipeline', () => {
  const createdIds: string[] = [];

  afterEach(async () => {
    vi.clearAllMocks();
    while (createdIds.length) await db.posts.delete(createdIds.pop() as string);
  });

  it('creates and returns a post when the input is worth posting', async () => {
    mockGenerate
      .mockResolvedValueOnce(EVALUATION_JSON)
      .mockResolvedValueOnce(CLASSIFICATION_JSON)
      .mockResolvedValueOnce(STANDARD_POST_JSON);

    const req = new NextRequest('http://localhost/api/pipeline', {
      method: 'POST',
      body: JSON.stringify({ input: 'I migrated a JSON store to Postgres and hit a race condition.' }),
    });
    const res = await pipeline(req);
    const body: { evaluation: unknown; classification: unknown; post: Post } = await res.json();

    expect(res.status).toBe(200);
    expect(body.post.title).toBe('Pipeline test title');
    expect(body.post.status).toBe('draft');
    createdIds.push(body.post.id);

    const stored = await db.posts.findById(body.post.id);
    expect(stored?.title).toBe('Pipeline test title');
  });

  it('returns a 400 with a clean error when the input is missing', async () => {
    const req = new NextRequest('http://localhost/api/pipeline', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await pipeline(req);
    const body: { error: string } = await res.json();

    expect(res.status).toBe(400);
    expect(typeof body.error).toBe('string');
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('returns a structured 500 error instead of crashing when the LLM call fails', async () => {
    mockGenerate.mockRejectedValueOnce(new Error('bridge unavailable'));

    const req = new NextRequest('http://localhost/api/pipeline', {
      method: 'POST',
      body: JSON.stringify({ input: 'I migrated a JSON store to Postgres and hit a race condition.' }),
    });
    const res = await pipeline(req);
    const body: { error: string } = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('bridge unavailable');
  });
});
