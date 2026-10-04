import { afterEach, describe, expect, it, vi } from 'vitest';
import { evaluate } from '@/lib/prompts/evaluate';
import { generate } from '@/lib/llm';
import { ProfileContext } from '@/lib/profile';

// `evaluate` funnels through `generate()` — mock it so this test is
// deterministic and network-free (same pattern as tests/api/pipeline.test.ts).
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

describe('evaluate', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('includes the recent topics list in the prompt when recentTopics is provided', async () => {
    mockGenerate.mockResolvedValueOnce(
      JSON.stringify({ worthy: true, reason: 'Specific.', classifiedAs: 'learned' }),
    );
    const recentTopics = [
      { title: 'Migrating to Postgres', topicCategory: 'Systems' },
      { title: 'JWT refresh race condition', topicCategory: null },
    ];

    await evaluate('I built an auth system.', CTX, recentTopics);

    expect(mockGenerate).toHaveBeenCalledTimes(1);
    const [, prompt] = mockGenerate.mock.calls[0] as [string, string];
    expect(prompt).toContain('Migrating to Postgres (Systems)');
    expect(prompt).toContain('JWT refresh race condition');
    expect(prompt).toContain('TOPICS ALREADY COVERED');
  });

  it('omits the recent topics section from the prompt when recentTopics is empty', async () => {
    mockGenerate.mockResolvedValueOnce(
      JSON.stringify({ worthy: true, reason: 'Specific.', classifiedAs: 'learned' }),
    );

    await evaluate('I built an auth system.', CTX);

    expect(mockGenerate).toHaveBeenCalledTimes(1);
    const [, prompt] = mockGenerate.mock.calls[0] as [string, string];
    expect(prompt).not.toContain('TOPICS ALREADY COVERED');
  });

  it('round-trips similarTo from the mocked LLM response onto the EvaluationResult', async () => {
    mockGenerate.mockResolvedValueOnce(
      JSON.stringify({
        worthy: true,
        reason: 'Specific but close to a prior post.',
        classifiedAs: 'learned',
        similarTo: 'Migrating to Postgres',
      }),
    );

    const result = await evaluate('I built an auth system.', CTX, [
      { title: 'Migrating to Postgres', topicCategory: 'Systems' },
    ]);

    expect(result.similarTo).toBe('Migrating to Postgres');
    expect(result.worthy).toBe(true);
  });

  it('omits similarTo on the result when the LLM response omits it', async () => {
    mockGenerate.mockResolvedValueOnce(
      JSON.stringify({ worthy: true, reason: 'Specific and novel.', classifiedAs: 'built' }),
    );

    const result = await evaluate('I built an auth system.', CTX);

    expect(result.similarTo).toBeUndefined();
  });
});
