import { describe, expect, it } from 'vitest';
import { createPostFromGeneration } from '@/lib/posts';

function buildGenerated() {
  return {
    title: 'My internal title',
    content: { hook: 'h', body: 'b', takeaway: 't', cta: 'c', fullText: 'h b t c' },
    imageStrategy: 'No image needed — copy stands alone',
    hashtags: ['#Testing', '#Systems'],
    topicCategory: 'Systems',
  };
}

describe('createPostFromGeneration', () => {
  it('builds a Post carrying over every field from the generation params', () => {
    const generated = buildGenerated();

    const post = createPostFromGeneration({
      rawInput: 'I migrated a JSON store to Postgres.',
      format: 'standard',
      contentType: 'learned',
      generated,
      status: 'draft',
      source: 'user',
    });

    expect(post.rawInput).toBe('I migrated a JSON store to Postgres.');
    expect(post.format).toBe('standard');
    expect(post.contentType).toBe('learned');
    expect(post.title).toBe(generated.title);
    expect(post.content).toEqual(generated.content);
    expect(post.imageStrategy).toBe(generated.imageStrategy);
    expect(post.hashtags).toEqual(generated.hashtags);
    expect(post.status).toBe('draft');
    expect(post.source).toBe('user');
    expect(post.topicCategory).toBe(generated.topicCategory);
    expect(post.scheduledDate).toBeUndefined();
  });

  it('assigns a non-empty id and equal createdAt/updatedAt ISO timestamps', () => {
    const post = createPostFromGeneration({
      rawInput: 'input',
      format: 'standard',
      contentType: 'built',
      generated: buildGenerated(),
      status: 'draft',
      source: 'user',
    });

    expect(post.id).toBeTruthy();
    expect(post.createdAt).toBe(post.updatedAt);
    expect(new Date(post.createdAt).toString()).not.toBe('Invalid Date');
  });

  it('assigns distinct ids across separate calls so posts never collide', () => {
    const params = {
      rawInput: 'input',
      format: 'standard' as const,
      contentType: 'built' as const,
      generated: buildGenerated(),
      status: 'draft' as const,
      source: 'user' as const,
    };

    const first = createPostFromGeneration(params);
    const second = createPostFromGeneration(params);

    expect(first.id).not.toBe(second.id);
  });

  it('carries an explicit scheduledDate through when provided', () => {
    const post = createPostFromGeneration({
      rawInput: 'input',
      format: 'standard',
      contentType: 'opinion',
      generated: buildGenerated(),
      status: 'ready',
      source: 'trending',
      scheduledDate: '2026-09-01T00:00:00.000Z',
    });

    expect(post.scheduledDate).toBe('2026-09-01T00:00:00.000Z');
  });

  it('omits scheduledDate when not provided', () => {
    const post = createPostFromGeneration({
      rawInput: 'input',
      format: 'standard',
      contentType: 'opinion',
      generated: buildGenerated(),
      status: 'ready',
      source: 'trending',
    });

    expect(post.scheduledDate).toBeUndefined();
  });
});
