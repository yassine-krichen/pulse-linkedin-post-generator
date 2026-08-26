import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchEngagement } from '@/lib/linkedin-engagement';

function htmlResponse(html: string, ok = true, status = 200): Response {
  return {
    ok,
    status,
    text: () => Promise.resolve(html),
  } as Response;
}

function redirectResponse(location: string): Response {
  return {
    ok: false,
    status: 302,
    headers: { get: (name: string) => (name.toLowerCase() === 'location' ? location : null) },
    text: () => Promise.resolve(''),
  } as unknown as Response;
}

describe('fetchEngagement', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns null without calling fetch for a non-LinkedIn URL', async () => {
    const result = await fetchEngagement('https://example.com/post/123');

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns null without calling fetch for a linkedin.com lookalike domain', async () => {
    const result = await fetchEngagement('https://linkedin.com.evil.com/posts/123');

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns null without calling fetch for a non-https LinkedIn URL', async () => {
    const result = await fetchEngagement('http://www.linkedin.com/posts/123');

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns likes and comments parsed from data-num-reactions/data-num-comments attributes', async () => {
    fetchMock.mockResolvedValueOnce(
      htmlResponse('<div data-num-reactions="42" data-num-comments="7"></div>'),
    );

    const result = await fetchEngagement('https://www.linkedin.com/posts/example-activity-123');

    expect(result).toEqual({ likes: 42, comments: 7 });
  });

  it('returns null when the response is not ok', async () => {
    fetchMock.mockResolvedValueOnce(htmlResponse('', false, 404));

    const result = await fetchEngagement('https://www.linkedin.com/posts/example-activity-123');

    expect(result).toBeNull();
  });

  it('returns null when the response HTML is missing the reaction/comment attributes', async () => {
    fetchMock.mockResolvedValueOnce(htmlResponse('<div>no engagement markup here</div>'));

    const result = await fetchEngagement('https://www.linkedin.com/posts/example-activity-123');

    expect(result).toBeNull();
  });

  it('follows a redirect to another linkedin.com URL and returns its engagement', async () => {
    fetchMock
      .mockResolvedValueOnce(redirectResponse('https://www.linkedin.com/posts/redirected-activity-456'))
      .mockResolvedValueOnce(htmlResponse('<div data-num-reactions="10" data-num-comments="2"></div>'));

    const result = await fetchEngagement('https://www.linkedin.com/posts/example-activity-123');

    expect(result).toEqual({ likes: 10, comments: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('refuses to follow a redirect to a non-LinkedIn host (SSRF via open redirect)', async () => {
    fetchMock.mockResolvedValueOnce(redirectResponse('https://internal.evil.example/steal'));

    const result = await fetchEngagement('https://www.linkedin.com/posts/example-activity-123');

    expect(result).toBeNull();
    // Must never have issued a second request to the redirect target.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('gives up after too many redirects rather than looping forever', async () => {
    for (let i = 0; i < 10; i++) {
      fetchMock.mockResolvedValueOnce(
        redirectResponse(`https://www.linkedin.com/posts/hop-${i}`),
      );
    }

    const result = await fetchEngagement('https://www.linkedin.com/posts/example-activity-123');

    expect(result).toBeNull();
    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(6);
  });

  it('never throws and resolves to null when fetch itself rejects', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network unreachable'));

    await expect(
      fetchEngagement('https://www.linkedin.com/posts/example-activity-123'),
    ).resolves.toBeNull();
  });
});
