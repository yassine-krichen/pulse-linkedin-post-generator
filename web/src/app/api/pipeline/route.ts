import { NextRequest, NextResponse } from 'next/server';
import { evaluate } from '@/lib/prompts/evaluate';
import { classify } from '@/lib/prompts/classify';
import { generatePost } from '@/lib/prompts/generate';
import { loadProfileContext } from '@/lib/profile';
import { db } from '@/lib/db';
import { createPostFromGeneration } from '@/lib/posts';
import { pipelineRequestSchema, formatZodError } from '@/lib/validation';
import { checkRateLimit, rateLimitResponseInit } from '@/lib/rate-limit';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limit = checkRateLimit('pipeline', 10, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests — slow down and try again shortly.' },
      rateLimitResponseInit(limit.retryAfterSeconds),
    );
  }

  try {
    const body = await req.json();
    const result = pipelineRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: formatZodError(result.error) }, { status: 400 });
    }
    const { input } = result.data;

    const ctx = loadProfileContext();

    // Step 1: Evaluate
    const evaluation = await evaluate(input, ctx);
    if (!evaluation.worthy) {
      return NextResponse.json({ evaluation, classification: null, post: null });
    }

    const contentType = evaluation.classifiedAs ?? 'learned';

    // Step 2: Classify
    const classification = await classify(input, contentType, ctx);

    // Step 3: Generate
    const generated = await generatePost(input, classification.format, contentType, ctx);

    const post = createPostFromGeneration({
      rawInput: input,
      format: classification.format,
      contentType,
      generated,
      status: 'draft',
      source: 'user',
    });

    await db.posts.create(post);

    return NextResponse.json({ evaluation, classification, post });
  } catch (err) {
    console.error('[pipeline]', err);
    const message = err instanceof Error ? err.message : 'Generation failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
