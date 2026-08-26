import { StandardPostContent } from '@/types';
import { generate, extractJSON } from '@/lib/llm';
import { ProfileContext } from '@/lib/profile';

interface HumanizedStandardPostRaw {
  hook: string;
  body: string;
  takeaway: string;
  cta: string;
  fullText: string;
}

/**
 * Rewrites only what's needed to fix the specific quality issues `lintPost`
 * flagged (length, hashtag count, banned phrases, em-dash overuse) while
 * preserving the original voice, facts, and structure. Only ever called when
 * `lintPost` actually found something — a clean draft skips this entirely.
 */
export async function humanizeStandardPost(
  content: StandardPostContent,
  issues: string[],
  ctx: ProfileContext,
): Promise<StandardPostContent> {
  const SYSTEM = `You are editing a LinkedIn post for a software engineer to fix specific quality issues. You must preserve the original voice, facts, and structure — make the smallest edit that resolves each flagged issue, nothing more.`;

  const prompt = `
${ctx.combined}

---

ORIGINAL POST (structured):
{
  "hook": ${JSON.stringify(content.hook)},
  "body": ${JSON.stringify(content.body)},
  "takeaway": ${JSON.stringify(content.takeaway)},
  "cta": ${JSON.stringify(content.cta)},
  "fullText": ${JSON.stringify(content.fullText)}
}

---

ISSUES TO FIX (fix only these — do not rewrite anything that isn't broken):
${issues.map((issue) => `- ${issue}`).join('\n')}

---

Rewrite the post to resolve every issue above. Keep the same hook/body/takeaway/cta structure, the same facts, and the same voice — this is a targeted edit, not a fresh draft.

Respond ONLY with valid JSON (no markdown wrapper):
{
  "hook": "the hook paragraph",
  "body": "the body (use \\n\\n between paragraphs)",
  "takeaway": "the takeaway",
  "cta": "the call to action",
  "fullText": "complete ready-to-paste post: hook + \\n\\n + body + \\n\\n + takeaway + \\n\\n + cta + \\n\\n + hashtags"
}`;

  const raw = await generate(SYSTEM, prompt, { maxOutputTokens: 2000, temperature: 0.6 });
  const parsed = extractJSON<HumanizedStandardPostRaw>(raw);
  return {
    hook: parsed.hook,
    body: parsed.body,
    takeaway: parsed.takeaway,
    cta: parsed.cta,
    fullText: parsed.fullText,
  };
}
