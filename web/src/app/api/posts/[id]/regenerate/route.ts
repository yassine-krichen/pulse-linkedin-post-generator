import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { loadProfileContext } from '@/lib/profile';
import { generatePost, TONE_INSTRUCTIONS } from '@/lib/prompts/generate';
import { humanizeStandardPost } from '@/lib/prompts/humanize';
import { lintPost } from '@/lib/quality-check';
import { regenerateRequestSchema, formatZodError } from '@/lib/validation';
import { checkRateLimit, rateLimitResponseInit } from '@/lib/rate-limit';
import { StandardPostContent, QualityCheckResult } from '@/types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const limit = checkRateLimit('regenerate', 10, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests — slow down and try again shortly.' },
      rateLimitResponseInit(limit.retryAfterSeconds),
    );
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const result = regenerateRequestSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: formatZodError(result.error) }, { status: 400 });
  }

  const existing = await db.posts.findById(id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const ctx = loadProfileContext();
    const toneInstruction = TONE_INSTRUCTIONS[result.data.tone ?? 'default'];

    let generated = await generatePost(
      existing.rawInput,
      existing.format,
      existing.contentType,
      ctx,
      toneInstruction,
    );

    // Quality/humanizer pass — standard posts only. Skips the extra LLM call
    // entirely when the regenerated draft is already clean.
    let qualityCheck: QualityCheckResult | null = null;
    if (existing.format === 'standard') {
      const issues = lintPost(generated.content.fullText);
      if (issues.length > 0) {
        const revisedContent = await humanizeStandardPost(
          generated.content as StandardPostContent,
          issues,
          ctx,
        );
        generated = { ...generated, content: revisedContent };
      }
      qualityCheck = { issuesFound: issues, wasRevised: issues.length > 0 };
    }

    const updated = await db.posts.update(id, {
      title: generated.title,
      content: generated.content,
      imageStrategy: generated.imageStrategy,
      hashtags: generated.hashtags,
      topicCategory: generated.topicCategory,
    });
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ ...updated, qualityCheck });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Regeneration failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
