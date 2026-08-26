import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateHookVariants } from '@/lib/prompts/generate';
import { generate } from '@/lib/llm';
import { ProfileContext } from '@/lib/profile';
import { Post, StandardPostContent } from '@/types';

// `generateHookVariants` funnels through `generate()` — mock it so this test
// is deterministic and network-free while still exercising the real prompt
// construction (same pattern as tests/lib/prompts/evaluate.test.ts).
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

const HOOK_VARIANTS_JSON = JSON.stringify({
  hooks: ['Alternative hook one.', 'Alternative hook two.'],
});

function buildStandardPost(
  overrides: Partial<StandardPostContent> = {},
): Pick<Post, 'rawInput' | 'content'> {
  const content: StandardPostContent = {
    hook: 'The current hook — this is what alternatives should contrast against.',
    body: 'The body.',
    takeaway: 'The takeaway.',
    cta: 'The cta.',
    fullText: 'full text',
    ...overrides,
  };
  return {
    rawInput: 'I migrated a JSON store to Postgres and hit a race condition.',
    content,
  };
}

describe('generateHookVariants', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns exactly 2 hook strings parsed from the LLM response', async () => {
    mockGenerate.mockResolvedValueOnce(HOOK_VARIANTS_JSON);
    const post = buildStandardPost();

    const result = await generateHookVariants(post, CTX);

    expect(result).toHaveLength(2);
    expect(result).toEqual(['Alternative hook one.', 'Alternative hook two.']);
  });

  it('sends a prompt including the post rawInput and the current hook for contrast', async () => {
    mockGenerate.mockResolvedValueOnce(HOOK_VARIANTS_JSON);
    const post = buildStandardPost();

    await generateHookVariants(post, CTX);

    expect(mockGenerate).toHaveBeenCalledTimes(1);
    const [, prompt] = mockGenerate.mock.calls[0] as [string, string];
    expect(prompt).toContain(post.rawInput);
    expect(prompt).toContain((post.content as StandardPostContent).hook);
    expect(prompt).toContain('CURRENT HOOK');
  });
});
