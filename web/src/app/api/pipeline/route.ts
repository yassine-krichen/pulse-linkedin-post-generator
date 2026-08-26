import { NextRequest, NextResponse } from 'next/server';
import { evaluate } from '@/lib/prompts/evaluate';
import { classify } from '@/lib/prompts/classify';
import { generatePost } from '@/lib/prompts/generate';
import { humanizeStandardPost } from '@/lib/prompts/humanize';
import { lintPost } from '@/lib/quality-check';
import { loadProfileContext } from '@/lib/profile';
import { fetchRepoSummary } from '@/lib/repo-fetch';
import { db } from '@/lib/db';
import { createPostFromGeneration } from '@/lib/posts';
import { pipelineRequestSchema, formatZodError } from '@/lib/validation';
import { checkRateLimit, rateLimitResponseInit } from '@/lib/rate-limit';
import { StandardPostContent, QualityCheckResult } from '@/types';

const RECENT_TOPICS_LIMIT = 15;

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
    const { repoUrl } = result.data;
    let input = result.data.input;

    if (!input && repoUrl) {
      try {
        input = await fetchRepoSummary(repoUrl);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch repo';
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    if (!input) {
      // Unreachable given the schema's refine, but narrows the type for TS.
      return NextResponse.json({ error: 'Provide either input or repoUrl' }, { status: 400 });
    }

    const ctx = loadProfileContext();

    // Step 1: Evaluate (with awareness of what's already covered or in progress)
    const { posts: recentPosts } = await db.posts.findAll({ limit: RECENT_TOPICS_LIMIT });
    const recentTopics = recentPosts.map((p) => ({
      title: p.title,
      topicCategory: p.topicCategory ?? null,
    }));
    const evaluation = await evaluate(input, ctx, recentTopics);
    if (!evaluation.worthy) {
      return NextResponse.json({ evaluation, classification: null, post: null, qualityCheck: null });
    }

    const contentType = evaluation.classifiedAs ?? 'learned';

    // Step 2: Classify
    const classification = await classify(input, contentType, ctx);

    // Step 3: Generate
    let generated = await generatePost(input, classification.format, contentType, ctx);

    // Step 4: Quality/humanizer pass — standard posts only. Skips the extra
    // LLM call entirely when the draft is already clean.
    let qualityCheck: QualityCheckResult | null = null;
    if (classification.format === 'standard') {
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

    const post = createPostFromGeneration({
      rawInput: input,
      format: classification.format,
      contentType,
      generated,
      status: 'draft',
      source: 'user',
    });

    await db.posts.create(post);

    return NextResponse.json({ evaluation, classification, post, qualityCheck });
  } catch (err) {
    console.error('[pipeline]', err);
    const message = err instanceof Error ? err.message : 'Generation failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
