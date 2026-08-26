const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const REACTIONS_PATTERN = /data-num-reactions="(\d+)"/;
const COMMENTS_PATTERN = /data-num-comments="(\d+)"/;

export interface Engagement {
  likes: number;
  comments: number;
}

function isLinkedInUrl(postUrl: string): boolean {
  try {
    const { hostname, protocol } = new URL(postUrl);
    if (protocol !== 'https:') return false;
    return hostname === 'linkedin.com' || hostname.endsWith('.linkedin.com');
  } catch {
    return false;
  }
}

const MAX_REDIRECTS = 5;

// Hostname allowlisting only protects the *first* request — a plain
// `redirect: 'follow'` would let linkedin.com (or any future open redirect
// on it) send this server-side fetch anywhere, including internal hosts.
// So redirects are followed manually, re-validating the Location header
// against the same allowlist on every hop, with a hop limit against loops.
async function fetchFollowingLinkedInRedirects(url: string): Promise<Response | null> {
  let currentUrl = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isLinkedInUrl(currentUrl)) return null;

    const res = await fetch(currentUrl, {
      headers: { 'User-Agent': BROWSER_USER_AGENT },
      redirect: 'manual',
      signal: AbortSignal.timeout(10_000),
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) return null;
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    return res;
  }
  return null;
}

/**
 * Best-effort scrape of a public LinkedIn post's like/comment counts.
 *
 * LinkedIn server-renders `data-num-reactions` and `data-num-comments`
 * attributes into the HTML of public post permalinks — no login or JS
 * execution required. This is an undocumented, unofficial HTML contract:
 * LinkedIn can change or block it at any time without notice. Callers must
 * treat a `null` result as a normal, expected outcome (not an error) and
 * fall back to manual entry.
 *
 * Deliberately does not fetch impressions/shares — LinkedIn does not expose
 * those in this same public markup (impressions are owner-only, and shares
 * aren't server-rendered here), so those stay manual-entry.
 */
export async function fetchEngagement(postUrl: string): Promise<Engagement | null> {
  if (!isLinkedInUrl(postUrl)) return null;

  try {
    const res = await fetchFollowingLinkedInRedirects(postUrl);
    if (!res || !res.ok) return null;

    const html = await res.text();
    const reactionsMatch = html.match(REACTIONS_PATTERN);
    const commentsMatch = html.match(COMMENTS_PATTERN);
    if (!reactionsMatch || !commentsMatch) return null;

    return {
      likes: Number(reactionsMatch[1]),
      comments: Number(commentsMatch[1]),
    };
  } catch {
    return null;
  }
}
