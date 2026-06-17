import { NextRequest, NextResponse } from 'next/server';
import { evaluate } from '@/lib/prompts/evaluate';
import { classify } from '@/lib/prompts/classify';
import { generatePost } from '@/lib/prompts/generate';
import { loadProfileContext } from '@/lib/profile';
import { db } from '@/lib/db';
import { Post } from '@/types';
import { createId } from '@/lib/id';
import { pipelineRequestSchema, formatZodError } from '@/lib/validation';

export async function POST(req: NextRequest) {
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

    const now = new Date().toISOString();
    const post: Post = {
      id: createId(),
      rawInput: input,
      format: classification.format,
      contentType,
      title: generated.title,
      content: generated.content,
      imageStrategy: generated.imageStrategy,
      hashtags: generated.hashtags,
      status: 'draft',
      source: 'user',
      topicCategory: generated.topicCategory,
      createdAt: now,
      updatedAt: now,
    };

    await db.posts.create(post);

    return NextResponse.json({ evaluation, classification, post });
  } catch (err) {
    console.error('[pipeline]', err);
    const message = err instanceof Error ? err.message : 'Generation failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
