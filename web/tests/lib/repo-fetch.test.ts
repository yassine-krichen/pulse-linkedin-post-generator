import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchRepoSummary } from '@/lib/repo-fetch';

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

const METADATA = {
  description: 'A tool that generates LinkedIn posts from raw engineering notes.',
  language: 'TypeScript',
  stargazers_count: 42,
  topics: ['linkedin', 'ai'],
};

function readmeResponse(markdown: string): Response {
  return jsonResponse({
    content: Buffer.from(markdown, 'utf-8').toString('base64'),
    encoding: 'base64',
  });
}

const COMMITS = [
  { commit: { message: 'Add pipeline route\n\nLonger body text.' } },
  { commit: { message: 'Fix quality-check em dash threshold' } },
];

describe('fetchRepoSummary', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws a clear error for a non-GitHub URL before calling fetch', async () => {
    await expect(fetchRepoSummary('https://gitlab.com/owner/repo')).rejects.toThrow(
      "doesn't look like a GitHub repo URL",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws a clear error when the repo metadata request 404s', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, false, 404));

    await expect(fetchRepoSummary('https://github.com/owner/repo')).rejects.toThrow(
      'Repo not found or private',
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns a summary containing the description, decoded README, and commit subjects when all three succeed', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(METADATA))
      .mockResolvedValueOnce(readmeResponse('## Overview\nThis project automates LinkedIn posting.'))
      .mockResolvedValueOnce(jsonResponse(COMMITS));

    const summary = await fetchRepoSummary('https://github.com/owner/repo');

    expect(summary).toContain('A tool that generates LinkedIn posts from raw engineering notes.');
    expect(summary).toContain('## Overview\nThis project automates LinkedIn posting.');
    expect(summary).toContain('Add pipeline route');
    expect(summary).toContain('Fix quality-check em dash threshold');
    expect(summary).toContain('Stars: 42');
  });

  it('degrades gracefully and still succeeds when the README request 404s', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(METADATA))
      .mockResolvedValueOnce(jsonResponse({}, false, 404))
      .mockResolvedValueOnce(jsonResponse(COMMITS));

    const summary = await fetchRepoSummary('https://github.com/owner/repo');

    expect(summary).toContain('A tool that generates LinkedIn posts from raw engineering notes.');
    expect(summary).not.toContain('README excerpt');
    expect(summary).toContain('Add pipeline route');
  });
});
