import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { loadProfileContext } from '@/lib/profile';
import { generateHookVariants } from '@/lib/prompts/generate';
import { checkRateLimit, rateLimitResponseInit } from '@/lib/rate-limit';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const limit = checkRateLimit('hook-variants', 10, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests — slow down and try again shortly.' },
      rateLimitResponseInit(limit.retryAfterSeconds),
    );
  }

  const { id } = await params;

  const existing = await db.posts.findById(id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (existing.format !== 'standard') {
    return NextResponse.json(
      { error: 'Hook variants are only available for standard-format posts.' },
      { status: 400 },
    );
  }

  try {
    const ctx = loadProfileContext();
    const hooks = await generateHookVariants(existing, ctx);
    return NextResponse.json({ hooks });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate hook variants.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
