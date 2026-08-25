import { TrendingTopic } from '@/types';
import { generate, extractJSON } from '@/lib/llm';
import { ProfileContext } from '@/lib/profile';

interface TopicsRaw {
  topics: TrendingTopic[];
}

const SYSTEM = `You are a LinkedIn content strategist for software engineers. Suggest topics that are genuinely useful, specific, and technically interesting — not generic.`;

export async function findTrendingTopics(ctx: ProfileContext): Promise<TrendingTopic[]> {
  const prompt = `
${ctx.combined}

Suggest 5 LinkedIn post topics this engineer could write about.

Each topic must:
1. Be specific — not "AI is changing everything" but "X pattern in LLM inference that most teams get wrong"
2. Be relevant to the user's expertise: ML/AI, systems design, full-stack, DevOps, cloud
3. Allow sharing a practitioner's opinion, hard-won lesson, or clear tutorial
4. Resonate with a technical audience (engineers, leads, hiring managers)

Topics should feel timely — evergreen patterns, recent shifts in tooling, or recurring pain points the tech community is actively discussing.

Respond ONLY with valid JSON:
{
  "topics": [
    {
      "title": "specific post title or angle",
      "summary": "what this post covers in 1-2 sentences",
      "relevance": "why a technical audience cares about this right now"
    }
  ]
}`;

  const raw = await generate(SYSTEM, prompt, { maxOutputTokens: 1000, temperature: 0.85 });
  const parsed = extractJSON<TopicsRaw>(raw);
  return parsed.topics;
}

export function buildWebResearchPrompt(ctx: ProfileContext): string {
  return `You are helping me research trending topics in tech so I can write a LinkedIn post.

My context:
- Role: Software engineering postgraduate student
- Expertise: Full-stack (Node.js, React, Python), ML/AI integration, systems design, DevOps, cloud
- Audience: Software engineers, tech leads, hiring managers
- Voice: Clean, professional, technical depth — no hype

Search for 5 specific, recent tech topics (last 1–3 months) that:
1. Are directly relevant to my expertise areas
2. Allow me to share a practitioner's opinion or lesson — not just repeat the news
3. Have enough substance for a 200-word LinkedIn post

For each topic:
- Specific title (not generic)
- 2-sentence summary of what's happening
- The practitioner angle: what unique insight could I add?
- Why now: why post about this this week?

Return ONLY a JSON array (no other text):
[
  {
    "title": "specific post title or angle",
    "summary": "what's happening in 2 sentences",
    "relevance": "why a technical audience cares right now"
  }
]

${ctx.profile ? `Additional context about me:\n${ctx.profile}` : ''}`;
}

export function parseResearchPaste(raw: string): TrendingTopic[] {
  const tryParse = (s: string): TrendingTopic[] | null => {
    try {
      const parsed: unknown = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed as TrendingTopic[];
      return null;
    } catch {
      return null;
    }
  };

  const direct = tryParse(raw.trim());
  if (direct) return direct;

  const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) {
    const fromBlock = tryParse(codeBlock[1].trim());
    if (fromBlock) return fromBlock;
  }

  const arrayMatch = raw.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    const fromArray = tryParse(arrayMatch[0]);
    if (fromArray) return fromArray;
  }

  throw new Error('Could not parse research results. Make sure you copied the full JSON array from the web AI.');
}
