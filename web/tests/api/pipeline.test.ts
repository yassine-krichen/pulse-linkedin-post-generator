import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST as pipeline } from '@/app/api/pipeline/route';
import { generate } from '@/lib/llm';
import { fetchRepoSummary } from '@/lib/repo-fetch';
import { db } from '@/lib/db';
import { Post } from '@/types';

// `evaluate`, `classify`, and `generatePost` all funnel through `generate()`.
// Mocking it here keeps these tests deterministic and network-free while
// still exercising the real pipeline route, schema validation, and DB write.
vi.mock('@/lib/llm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/llm')>();
  return { ...actual, generate: vi.fn() };
});

// The route calls `fetchRepoSummary` directly for the repoUrl path — mock it
// so repoUrl tests don't hit the real GitHub API (that contract is covered
// separately in tests/lib/repo-fetch.test.ts).
vi.mock('@/lib/repo-fetch', () => ({ fetchRepoSummary: vi.fn() }));

const mockGenerate = vi.mocked(generate);
const mockFetchRepoSummary = vi.mocked(fetchRepoSummary);

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
  fullText:
    'We migrated our JSON file store to Postgres last month and the process taught us more than expected. The initial migration script looked simple on paper, but concurrent writes during the cutover window exposed a subtle race condition in how we handled JWT refresh tokens. Two requests would arrive within milliseconds of each other, both reading the same stale token record before either write committed, and both would attempt to issue a new refresh token from the same starting point. Under low traffic this never surfaced, but once real users hit it during a peak hour the duplicate token issue caused a spike in failed logins. We fixed it with a unique constraint on the token version column and a retry loop that re-reads on conflict. The bigger lesson was that our test suite never simulated real concurrency, only sequential requests. Load testing with real concurrent traffic patterns now runs before every release. #Systems #Testing',
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

  it('fetches the repo summary and uses it as pipeline input when only repoUrl is provided', async () => {
    mockFetchRepoSummary.mockResolvedValueOnce('Repo: owner/repo\nDescription: A test repo.');
    mockGenerate
      .mockResolvedValueOnce(EVALUATION_JSON)
      .mockResolvedValueOnce(CLASSIFICATION_JSON)
      .mockResolvedValueOnce(STANDARD_POST_JSON);

    const req = new NextRequest('http://localhost/api/pipeline', {
      method: 'POST',
      body: JSON.stringify({ repoUrl: 'https://github.com/owner/repo' }),
    });
    const res = await pipeline(req);
    const body: { post: Post } = await res.json();

    expect(res.status).toBe(200);
    expect(mockFetchRepoSummary).toHaveBeenCalledWith('https://github.com/owner/repo');
    createdIds.push(body.post.id);

    const stored = await db.posts.findById(body.post.id);
    expect(stored?.rawInput).toBe('Repo: owner/repo\nDescription: A test repo.');
  });

  it('returns a 400 with a clean error and skips the LLM entirely when fetchRepoSummary throws', async () => {
    mockFetchRepoSummary.mockRejectedValueOnce(new Error('Repo not found or private'));

    const req = new NextRequest('http://localhost/api/pipeline', {
      method: 'POST',
      body: JSON.stringify({ repoUrl: 'https://github.com/owner/private-repo' }),
    });
    const res = await pipeline(req);
    const body: { error: string } = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Repo not found or private');
    expect(mockGenerate).not.toHaveBeenCalled();
  });
});
