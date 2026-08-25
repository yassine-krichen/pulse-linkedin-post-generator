import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { loadProfileContext } from '@/lib/profile';
import { generatePost, TONE_INSTRUCTIONS } from '@/lib/prompts/generate';
import { regenerateRequestSchema, formatZodError } from '@/lib/validation';
import { checkRateLimit, rateLimitResponseInit } from '@/lib/rate-limit';

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

  const body = await req.json().catch(() => ({}));
  const result = regenerateRequestSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: formatZodError(result.error) }, { status: 400 });
  }

  const existing = await db.posts.findById(id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const ctx = loadProfileContext();
    const toneInstruction = TONE_INSTRUCTIONS[result.data.tone ?? 'default'];

    const generated = await generatePost(
      existing.rawInput,
      existing.format,
      existing.contentType,
      ctx,
      toneInstruction,
    );

    const updated = await db.posts.update(id, {
      title: generated.title,
      content: generated.content,
      imageStrategy: generated.imageStrategy,
      hashtags: generated.hashtags,
      topicCategory: generated.topicCategory,
    });

    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Regeneration failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
