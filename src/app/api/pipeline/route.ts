import { NextRequest, NextResponse } from 'next/server';
import { evaluate } from '@/lib/prompts/evaluate';
import { classify } from '@/lib/prompts/classify';
import { generatePost } from '@/lib/prompts/generate';
import { loadProfileContext } from '@/lib/profile';
import { db } from '@/lib/db';
import { Post } from '@/types';
import { createId } from '@/lib/id';

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json();

    if (!input || typeof input !== 'string' || input.trim().length < 10) {
      return NextResponse.json({ error: 'Input too short or missing.' }, { status: 400 });
    }

    const ctx = loadProfileContext();

    // Step 1: Evaluate
    const evaluation = await evaluate(input.trim(), ctx);
    if (!evaluation.worthy) {
      return NextResponse.json({ evaluation, classification: null, post: null });
    }

    // Step 2: Classify
    const classification = await classify(input.trim(), evaluation.classifiedAs ?? 'learned', ctx);

    // Step 3: Generate
    const generated = await generatePost(
      input.trim(),
      classification.format,
      evaluation.classifiedAs ?? 'learned',
      ctx,
    );

    const now = new Date().toISOString();
    const post: Post = {
      id: createId(),
      rawInput: input.trim(),
      format: classification.format,
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

    db.posts.create(post);

    return NextResponse.json({ evaluation, classification, post });
  } catch (err) {
    console.error('[pipeline]', err);
    const message = err instanceof Error ? err.message : 'Generation failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
