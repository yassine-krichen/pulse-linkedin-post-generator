import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET as getTrending, POST as postTrending } from '@/app/api/trending/route';
import { generate } from '@/lib/llm';
import { db } from '@/lib/db';
import { Post, TrendingTopic } from '@/types';

// `findTrendingTopics` and `generatePost` funnel through `generate()` — mock
// it so these tests are deterministic and network-free.
vi.mock('@/lib/llm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/llm')>();
  return { ...actual, generate: vi.fn() };
});

const mockGenerate = vi.mocked(generate);

const TOPICS_JSON = JSON.stringify({
  topics: [
    {
      title: 'Why most teams get LLM inference batching wrong',
      summary: 'A common misconception about batching strategy.',
      relevance: 'Directly affects cost and latency for teams shipping LLM features.',
    },
  ],
});

const STANDARD_POST_JSON = JSON.stringify({
  title: 'Trending post title',
  hook: 'A surprising hook about inference batching.',
  body: 'The body of the post.',
  takeaway: 'The takeaway.',
  cta: 'What has your experience been?',
  fullText: 'A surprising hook about inference batching.\n\nThe body of the post.\n\nThe takeaway.\n\nWhat has your experience been?',
  imageStrategy: 'No image needed — copy stands alone',
  hashtags: ['#MLOps'],
  topicCategory: 'ML/AI',
});

describe('GET /api/trending', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns trending topics and a research prompt', async () => {
    mockGenerate.mockResolvedValueOnce(TOPICS_JSON);

    const res = await getTrending();
    const body: { topics: TrendingTopic[]; researchPrompt: string } = await res.json();

    expect(res.status).toBe(200);
    expect(body.topics).toHaveLength(1);
    expect(body.topics[0].title).toBe('Why most teams get LLM inference batching wrong');
    expect(typeof body.researchPrompt).toBe('string');
  });

  it('returns a structured 500 error instead of crashing when the LLM call fails', async () => {
    mockGenerate.mockRejectedValueOnce(new Error('bridge unavailable'));

    const res = await getTrending();
    const body: { error: string } = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('bridge unavailable');
  });
});

describe('POST /api/trending', () => {
  const createdIds: string[] = [];

  afterEach(async () => {
    vi.clearAllMocks();
    while (createdIds.length) await db.posts.delete(createdIds.pop() as string);
  });

  it('creates and returns a ready post generated from the given topic', async () => {
    mockGenerate.mockResolvedValueOnce(STANDARD_POST_JSON);

    const req = new NextRequest('http://localhost/api/trending', {
      method: 'POST',
      body: JSON.stringify({
        topic: {
          title: 'Why most teams get LLM inference batching wrong',
          summary: 'A common misconception about batching strategy.',
          relevance: 'Directly affects cost and latency.',
        },
      }),
    });
    const res = await postTrending(req);
    const body: Post = await res.json();

    expect(res.status).toBe(200);
    expect(body.title).toBe('Trending post title');
    expect(body.status).toBe('ready');
    expect(body.source).toBe('trending');
    createdIds.push(body.id);

    const stored = await db.posts.findById(body.id);
    expect(stored?.source).toBe('trending');
  });

  it('returns a 400 without calling the LLM when neither topic nor researchPaste is provided', async () => {
    const req = new NextRequest('http://localhost/api/trending', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await postTrending(req);
    const body: { error: string } = await res.json();

    expect(res.status).toBe(400);
    expect(typeof body.error).toBe('string');
    expect(mockGenerate).not.toHaveBeenCalled();
  });
});
