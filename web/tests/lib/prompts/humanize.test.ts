import { afterEach, describe, expect, it, vi } from 'vitest';
import { humanizeStandardPost } from '@/lib/prompts/humanize';
import { generate } from '@/lib/llm';
import { ProfileContext } from '@/lib/profile';
import { StandardPostContent } from '@/types';

// `humanizeStandardPost` funnels through `generate()` — mock it so this test
// is deterministic and network-free while still exercising the real prompt
// construction (same pattern as tests/api/pipeline.test.ts).
vi.mock('@/lib/llm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/llm')>();
  return { ...actual, generate: vi.fn() };
});

const mockGenerate = vi.mocked(generate);

const CTX: ProfileContext = {
  profile: 'profile',
  linkedinProfile: 'linkedin profile',
  combined: 'USER PROFILE:\nprofile',
};

const ORIGINAL_CONTENT: StandardPostContent = {
  hook: 'original hook',
  body: 'original body',
  takeaway: 'original takeaway',
  cta: 'original cta',
  fullText: 'original hook original body original takeaway original cta',
};

const REVISED_CONTENT_JSON = JSON.stringify({
  hook: 'revised hook',
  body: 'revised body',
  takeaway: 'revised takeaway',
  cta: 'revised cta',
  fullText: 'revised hook revised body revised takeaway revised cta #Engineering',
});

describe('humanizeStandardPost', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns the revised StandardPostContent parsed from the LLM response', async () => {
    mockGenerate.mockResolvedValueOnce(REVISED_CONTENT_JSON);

    const result = await humanizeStandardPost(ORIGINAL_CONTENT, ['Too short (50 words).'], CTX);

    expect(result).toEqual({
      hook: 'revised hook',
      body: 'revised body',
      takeaway: 'revised takeaway',
      cta: 'revised cta',
      fullText: 'revised hook revised body revised takeaway revised cta #Engineering',
    });
  });

  it('sends a prompt including every flagged issue and the original post content', async () => {
    mockGenerate.mockResolvedValueOnce(REVISED_CONTENT_JSON);
    const issues = [
      'Too short (50 words) — aim for 150-300 words.',
      'Contains banned/cliché phrase: "game-changer".',
    ];

    await humanizeStandardPost(ORIGINAL_CONTENT, issues, CTX);

    expect(mockGenerate).toHaveBeenCalledTimes(1);
    const [, prompt] = mockGenerate.mock.calls[0] as [string, string];
    for (const issue of issues) {
      expect(prompt).toContain(issue);
    }
    expect(prompt).toContain(ORIGINAL_CONTENT.hook);
    expect(prompt).toContain(ORIGINAL_CONTENT.fullText);
  });
});
