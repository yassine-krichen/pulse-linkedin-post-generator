// Pure, synchronous lint pass over generated post text — no LLM/network calls
// here so it stays fast and trivially testable. Anything flagged feeds into
// `humanizeStandardPost` for a targeted rewrite, rather than blocking generation.

const MIN_WORD_COUNT = 100;
const MAX_WORD_COUNT = 400;
const MAX_HASHTAGS = 6;
// A genuine AI-writing tell at higher frequency, per general knowledge of
// these patterns — this project has no documented threshold yet, so this is
// a heuristic starting point, not a measured constant. Tune as needed.
const MAX_EM_DASHES = 4;

const BANNED_PHRASES = [
  'game-changer',
  'crushing it',
  'no days off',
  'grind',
  'passion',
  'excited to share',
  'dive into',
  'unlock the power of',
  "let's dive in",
  "in today's fast-paced world",
  'at the end of the day',
];

// Matches the "it's not just X, it's Y" construction regardless of what
// fills X/Y — the pattern itself is the tell, not the specific words.
const NOT_JUST_PATTERN = /it's not just/i;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function countHashtags(text: string): number {
  const matches = text.match(/#\w+/g);
  return matches ? matches.length : 0;
}

function countEmDashes(text: string): number {
  const matches = text.match(/—/g);
  return matches ? matches.length : 0;
}

/**
 * Lints generated post text for the quality issues this project cares about:
 * length, hashtag count, banned/cliché phrases, and em-dash overuse. Returns
 * a human-readable issue per problem found; an empty array means the post is
 * clean and doesn't need a humanizer rewrite pass.
 */
export function lintPost(fullText: string): string[] {
  const issues: string[] = [];

  const wordCount = countWords(fullText);
  if (wordCount < MIN_WORD_COUNT) {
    issues.push(`Too short (${wordCount} words) — aim for 150-300 words.`);
  } else if (wordCount > MAX_WORD_COUNT) {
    issues.push(`Too long (${wordCount} words) — aim for 150-300 words.`);
  }

  const hashtagCount = countHashtags(fullText);
  if (hashtagCount === 0) {
    issues.push('No hashtags found in the post text — brand guide calls for 3-5.');
  } else if (hashtagCount > MAX_HASHTAGS) {
    issues.push(`Too many hashtags (${hashtagCount}) — brand guide calls for 3-5 max.`);
  }

  for (const phrase of BANNED_PHRASES) {
    if (fullText.toLowerCase().includes(phrase.toLowerCase())) {
      issues.push(`Contains banned/cliché phrase: "${phrase}".`);
    }
  }
  if (NOT_JUST_PATTERN.test(fullText)) {
    issues.push('Contains the "it\'s not just X, it\'s Y" cliché construction.');
  }

  const emDashCount = countEmDashes(fullText);
  if (emDashCount > MAX_EM_DASHES) {
    issues.push(`Overuses em dashes (${emDashCount} found) — a common AI-writing tell at this frequency.`);
  }

  return issues;
}
