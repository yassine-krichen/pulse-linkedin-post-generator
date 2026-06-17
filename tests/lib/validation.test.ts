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
