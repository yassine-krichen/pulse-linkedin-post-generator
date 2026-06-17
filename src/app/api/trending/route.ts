import { NextRequest, NextResponse } from 'next/server';
import { findTrendingTopics, buildWebResearchPrompt, parseResearchPaste } from '@/lib/search';
import { loadProfileContext } from '@/lib/profile';
import { generatePost } from '@/lib/prompts/generate';
import { db } from '@/lib/db';
import { Post, TrendingTopic } from '@/types';
import { createId } from '@/lib/id';

export async function GET(): Promise<NextResponse> {
  try {
    const ctx = loadProfileContext();
    const [topics, researchPrompt] = await Promise.all([
      findTrendingTopics(ctx),
      Promise.resolve(buildWebResearchPrompt(ctx)),
    ]);
    return NextResponse.json({ topics, researchPrompt });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch topics';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: { topic?: TrendingTopic; researchPaste?: string; scheduledDate?: string } =
      await req.json();

    const ctx = loadProfileContext();
    let topic: TrendingTopic;

    if (body.researchPaste) {
      const parsed = parseResearchPaste(body.researchPaste);
      if (parsed.length === 0) {
        return NextResponse.json({ error: 'No topics found in pasted research' }, { status: 400 });
      }
      topic = parsed[0];
    } else if (body.topic) {
      topic = body.topic;
    } else {
      return NextResponse.json({ error: 'Provide either topic or researchPaste' }, { status: 400 });
    }

    const input = `Write a LinkedIn post with my perspective on this topic: ${topic.title}. Context: ${topic.summary}`;
    const generated = await generatePost(input, 'standard', 'opinion', ctx);

    const now = new Date().toISOString();
    const post: Post = {
      id: createId(),
      rawInput: input,
      format: 'standard',
      title: generated.title,
      content: generated.content,
      imageStrategy: generated.imageStrategy,
      hashtags: generated.hashtags,
      status: 'ready',
      source: 'trending',
      topicCategory: generated.topicCategory,
      scheduledDate: body.scheduledDate ?? undefined,
      createdAt: now,
      updatedAt: now,
    };

    await db.posts.create(post);
    return NextResponse.json(post);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
