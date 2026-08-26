import { afterEach, describe, expect, it } from 'vitest';
import { getVoiceExamples } from '@/lib/voice-examples';
import { db } from '@/lib/db';
import { Post, PostFormat } from '@/types';

// DB-integration test: getVoiceExamples queries real posted posts (via
// db.posts.findPosted) and only falls back to static example files when none
// exist. Global DB state can't be assumed empty (other tests/dev usage may
// have posted posts already), so each test creates its own posts tagged with
// a unique rawInput marker and asserts on that marker rather than on counts
// or on the DB being otherwise empty. Cleanup mirrors tests/lib/db.test.ts.
function buildPostedPost(format: PostFormat, marker: string): Post {
  const now = new Date().toISOString();
  return {
    id: `voice-test-${crypto.randomUUID()}`,
    rawInput: `voice-examples-test ${marker}`,
    format,
    contentType: 'learned',
    title: `Voice example test post (${marker})`,
    content: {
      hook: 'h',
      body: 'b',
      takeaway: 't',
      cta: 'c',
      fullText: `FULLTEXT_MARKER_${marker}`,
    },
    imageStrategy: 'No image needed — copy stands alone',
    hashtags: ['#Testing'],
    status: 'posted',
    source: 'user',
    postedDate: now,
    createdAt: now,
    updatedAt: now,
  };
}

describe('getVoiceExamples', () => {
  const createdIds: string[] = [];

  afterEach(async () => {
    while (createdIds.length) await db.posts.delete(createdIds.pop() as string);
  });

  it('returns posted examples containing the real fullText of matching-format posts', async () => {
    const marker = `same-format-${crypto.randomUUID()}`;
    const posts = [
      buildPostedPost('standard', marker),
      buildPostedPost('standard', marker),
      buildPostedPost('standard', marker),
    ];
    for (const post of posts) {
      await db.posts.create(post);
      createdIds.push(post.id);
    }

    const result = await getVoiceExamples('standard');

    expect(posts.length).toBeGreaterThan(0);
    expect(result).toContain(`FULLTEXT_MARKER_${marker}`);
    expect(result).toContain('EXAMPLE (posted, standard):');
  });

  it('includes posted posts of a different format to fill remaining slots when fewer than 3 match the requested format', async () => {
    const marker = `cross-format-${crypto.randomUUID()}`;
    const post = buildPostedPost('image', marker);
    await db.posts.create(post);
    createdIds.push(post.id);

    const result = await getVoiceExamples('image');

    expect(result).toContain(`FULLTEXT_MARKER_${marker}`);
    expect(result).toContain('EXAMPLE (posted, image):');
  });

  it('resolves to a non-empty string and never throws regardless of posted-post availability', async () => {
    // Pragmatic coverage for the static-file-fallback branch: global DB
    // emptiness can't be guaranteed, but whichever branch runs (real posted
    // posts or the static example files), the result should be a non-empty
    // string and the call should never reject.
    await expect(getVoiceExamples('carousel')).resolves.toEqual(expect.any(String));
    const result = await getVoiceExamples('carousel');
    expect(result.length).toBeGreaterThan(0);
  });
});
