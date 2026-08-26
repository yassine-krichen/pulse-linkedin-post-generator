import { describe, expect, it } from 'vitest';
import { lintPost } from '@/lib/quality-check';

// Builds a clean post body: within word count bounds, exactly 3 hashtags,
// no banned phrases, no em dashes — the "nothing to flag" baseline other
// tests deviate from one dimension at a time.
function buildCleanPost(wordCount = 150): string {
  const words = Array.from({ length: wordCount }, (_, i) => `word${i}`).join(' ');
  return `${words} #Engineering #Systems #DevOps`;
}

describe('lintPost', () => {
  it('returns no issues for a clean post within length, hashtag, and phrase rules', () => {
    expect(lintPost(buildCleanPost())).toEqual([]);
  });

  it('flags a post containing a banned cliché phrase', () => {
    const text = `${buildCleanPost()} this is a real game-changer for the team`;
    const issues = lintPost(text);
    expect(issues.some((issue) => issue.includes('game-changer'))).toBe(true);
  });

  it('flags a post containing the "dive into" cliché phrase', () => {
    const text = `${buildCleanPost()} let's dive into the details`;
    const issues = lintPost(text);
    expect(issues.some((issue) => issue.includes('dive into'))).toBe(true);
  });

  it('flags the "it\'s not just X, it\'s Y" cliché construction', () => {
    const text = `${buildCleanPost()} it's not just a bug fix, it's a mindset shift`;
    const issues = lintPost(text);
    expect(issues.some((issue) => issue.includes('not just X'))).toBe(true);
  });

  it('flags a post under the minimum word count', () => {
    const issues = lintPost('too short #Engineering #Systems #DevOps');
    expect(issues.some((issue) => issue.includes('Too short'))).toBe(true);
  });

  it('flags a post over the maximum word count', () => {
    const issues = lintPost(buildCleanPost(450));
    expect(issues.some((issue) => issue.includes('Too long'))).toBe(true);
  });

  it('flags a post with zero hashtags', () => {
    const words = Array.from({ length: 150 }, (_, i) => `word${i}`).join(' ');
    const issues = lintPost(words);
    expect(issues.some((issue) => issue.includes('No hashtags'))).toBe(true);
  });

  it('flags a post with more than 6 hashtags', () => {
    const words = Array.from({ length: 150 }, (_, i) => `word${i}`).join(' ');
    const hashtags = Array.from({ length: 7 }, (_, i) => `#Tag${i}`).join(' ');
    const issues = lintPost(`${words} ${hashtags}`);
    expect(issues.some((issue) => issue.includes('Too many hashtags'))).toBe(true);
  });

  it('flags a post with more than 4 em dashes as overusing them', () => {
    const text = `${buildCleanPost()} a—b—c—d—e—f`;
    const issues = lintPost(text);
    expect(issues.some((issue) => issue.includes('Overuses em dashes'))).toBe(true);
  });

  it('does not flag em dashes at or below the threshold of 4', () => {
    const text = `${buildCleanPost()} a—b—c—d`;
    const issues = lintPost(text);
    expect(issues.some((issue) => issue.includes('em dashes'))).toBe(false);
  });
});
