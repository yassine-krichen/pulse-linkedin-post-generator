import { ClassificationResult, ContentType } from '@/types';
import { generate, extractJSON } from '@/lib/llm';
import { ProfileContext } from '@/lib/profile';

const SYSTEM = `You are a LinkedIn content strategist. You decide the best post format for a piece of content.`;

export async function classify(
  input: string,
  contentType: ContentType,
  ctx: ProfileContext,
): Promise<ClassificationResult> {
  const prompt = `
${ctx.combined}

---

INPUT:
"${input}"

CONTENT TYPE: ${contentType}

---

Choose the best LinkedIn post format:

- "standard": Single insight, lesson, announcement, or opinion. Best when the core message is one clear idea. (150-300 words, text-based)
- "carousel": Tutorial, step-by-step process, list of tips/mistakes/principles. Best when there are 4+ distinct points. (4-8 slides)
- "image": Content where a visual artifact is the centerpiece — a certificate, project screenshot, diagram, architecture sketch. Best when showing > telling.

RULES:
- Single clear insight or story → standard
- Process with steps OR list of 4+ distinct points → carousel
- User has or needs a specific image (cert, UI screenshot, diagram) → image
- Default to standard when unsure — it's the lowest friction format

Respond ONLY with valid JSON:
{
  "format": "standard" | "carousel" | "image",
  "reason": "one sentence explaining why this format fits"
}`;

  const raw = await generate(SYSTEM, prompt, { maxOutputTokens: 500, temperature: 0.2 });
  return extractJSON<ClassificationResult>(raw);
}
