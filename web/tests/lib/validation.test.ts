import { describe, expect, it } from 'vitest';
import {
  pipelineRequestSchema,
  postUpdateSchema,
  settingsUpdateSchema,
  trendingRequestSchema,
} from '@/lib/validation';

describe('pipelineRequestSchema', () => {
  it('trims whitespace and accepts input at the minimum length', () => {
    const result = pipelineRequestSchema.safeParse({ input: `  ${'a'.repeat(10)}  ` });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.input).toBe('a'.repeat(10));
  });

  it('rejects input shorter than 10 characters', () => {
    const result = pipelineRequestSchema.safeParse({ input: 'too short' });
    expect(result.success).toBe(false);
  });

  it('accepts a body with only repoUrl', () => {
    const result = pipelineRequestSchema.safeParse({ repoUrl: 'https://github.com/owner/repo' });
    expect(result.success).toBe(true);
  });

  it('rejects a body with neither input nor repoUrl', () => {
    const result = pipelineRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('accepts a body with both input and repoUrl', () => {
    const result = pipelineRequestSchema.safeParse({
      input: 'a'.repeat(10),
      repoUrl: 'https://github.com/owner/repo',
    });
    expect(result.success).toBe(true);
  });
});

describe('postUpdateSchema', () => {
  it('accepts a partial update with only status', () => {
    const result = postUpdateSchema.safeParse({ status: 'posted' });
    expect(result.success).toBe(true);
  });

  it('rejects fields outside the writable whitelist', () => {
    const result = postUpdateSchema.safeParse({ status: 'posted', adminFlag: true });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid status value', () => {
    const result = postUpdateSchema.safeParse({ status: 'archived' });
    expect(result.success).toBe(false);
  });

  it('allows clearing scheduledDate by passing null', () => {
    const result = postUpdateSchema.safeParse({ scheduledDate: null });
    expect(result.success).toBe(true);
  });

  it('accepts a format/content pair whose content shape matches the format', () => {
    const result = postUpdateSchema.safeParse({
      format: 'standard',
      content: { hook: 'h', body: 'b', takeaway: 't', cta: 'c', fullText: 'h b t c' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects a format/content pair with a content shape from a different format, with the issue on "content"', () => {
    const result = postUpdateSchema.safeParse({
      format: 'standard',
      content: {
        slides: [{ slideNumber: 1, title: 't', points: ['p'], layoutNotes: 'n', imageStrategy: 's' }],
        fullText: 'full text',
      },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join('.') === 'content')).toBe(true);
    }
  });

  it('skips the format/content cross-check when only notes is provided', () => {
    const result = postUpdateSchema.safeParse({ notes: 'just a note update' });
    expect(result.success).toBe(true);
  });

  it('skips the format/content cross-check when format is provided without content', () => {
    const result = postUpdateSchema.safeParse({ format: 'carousel' });
    expect(result.success).toBe(true);
  });
});

describe('settingsUpdateSchema', () => {
  it('rejects a weekly target outside the 1-14 range', () => {
    expect(settingsUpdateSchema.safeParse({ weeklyTarget: 0 }).success).toBe(false);
    expect(settingsUpdateSchema.safeParse({ weeklyTarget: 15 }).success).toBe(false);
  });

  it('accepts a valid weekly target', () => {
    expect(settingsUpdateSchema.safeParse({ weeklyTarget: 3 }).success).toBe(true);
  });
});

describe('trendingRequestSchema', () => {
  it('rejects a body with neither topic nor researchPaste', () => {
    const result = trendingRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('accepts a body with only researchPaste', () => {
    const result = trendingRequestSchema.safeParse({ researchPaste: '[{"title":"x"}]' });
    expect(result.success).toBe(true);
  });
});
