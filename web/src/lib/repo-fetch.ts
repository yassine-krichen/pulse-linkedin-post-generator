const GITHUB_API_BASE = 'https://api.github.com';
const USER_AGENT = 'linkedin-post-generator';

// READMEs can run tens of thousands of characters. This is meant to be a
// distilled signal for the pipeline's "raw input," not the whole document —
// a few thousand characters is enough to capture what the project does
// without drowning the LLM prompt.
const README_EXCERPT_LENGTH = 3000;

interface RepoMetadata {
  description: string | null;
  language: string | null;
  stargazers_count: number;
  topics?: string[];
}

interface RepoCommit {
  commit: {
    message: string;
  };
}

/**
 * Parses owner/repo out of common GitHub URL forms:
 * https://github.com/owner/repo, https://github.com/owner/repo.git,
 * github.com/owner/repo, with or without a trailing slash or extra path.
 */
function parseGitHubUrl(repoUrl: string): { owner: string; repo: string } {
  const match = repoUrl
    .trim()
    .match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/\s#?]+)\/([^/\s#?]+)/i);

  if (!match) {
    throw new Error('That doesn\'t look like a GitHub repo URL — expected something like https://github.com/owner/repo');
  }

  const owner = match[1];
  const repo = match[2].replace(/\.git$/i, '');
  return { owner, repo };
}

function githubHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github+json',
    'User-Agent': USER_AGENT,
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function fetchRepoMetadata(owner: string, repo: string): Promise<RepoMetadata> {
  const res = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
    headers: githubHeaders(),
  });

  if (res.status === 404) {
    throw new Error('Repo not found or private — this only works with public repos right now');
  }
  if (!res.ok) {
    throw new Error(`GitHub API error fetching repo metadata (${res.status})`);
  }

  return res.json();
}

async function fetchReadmeExcerpt(owner: string, repo: string): Promise<string | null> {
  try {
    const res = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/readme`, {
      headers: githubHeaders(),
    });
    if (!res.ok) return null;

    const data: { content: string; encoding: string } = await res.json();
    if (data.encoding !== 'base64') return null;

    const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
    return decoded.slice(0, README_EXCERPT_LENGTH);
  } catch {
    return null;
  }
}

async function fetchRecentCommitSubjects(owner: string, repo: string): Promise<string[]> {
  try {
    const res = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?per_page=10`, {
      headers: githubHeaders(),
    });
    if (!res.ok) return [];

    const commits: RepoCommit[] = await res.json();
    return commits.map((c) => c.commit.message.split('\n')[0]);
  } catch {
    return [];
  }
}

/**
 * Fetches a distilled summary of a public GitHub repo (description, tech
 * stack, README excerpt, recent commit subjects) suitable as pipeline input —
 * standing in for text the user would otherwise type by hand.
 */
export async function fetchRepoSummary(repoUrl: string): Promise<string> {
  const { owner, repo } = parseGitHubUrl(repoUrl);

  const metadata = await fetchRepoMetadata(owner, repo);
  const [readmeExcerpt, commitSubjects] = await Promise.all([
    fetchReadmeExcerpt(owner, repo),
    fetchRecentCommitSubjects(owner, repo),
  ]);

  const lines: string[] = [`Repo: ${owner}/${repo}`];

  if (metadata.description) {
    lines.push(`Description: ${metadata.description}`);
  }
  if (metadata.language) {
    lines.push(`Primary language: ${metadata.language}`);
  }
  if (metadata.topics && metadata.topics.length > 0) {
    lines.push(`Topics: ${metadata.topics.join(', ')}`);
  }
  lines.push(`Stars: ${metadata.stargazers_count}`);

  if (readmeExcerpt) {
    lines.push('', 'README excerpt:', readmeExcerpt);
  }

  if (commitSubjects.length > 0) {
    lines.push('', 'Recent commits:', ...commitSubjects.map((subject) => `- ${subject}`));
  }

  return lines.join('\n');
}
