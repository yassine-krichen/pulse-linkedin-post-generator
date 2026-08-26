import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fetchEngagement } from '@/lib/linkedin-engagement';
import { checkRateLimit, rateLimitResponseInit } from '@/lib/rate-limit';

export async function POST(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const limit = checkRateLimit('refresh-engagement', 10, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests — slow down and try again shortly.' },
      rateLimitResponseInit(limit.retryAfterSeconds),
    );
  }

  const { id } = await params;

  try {
    const post = await db.posts.findById(id);
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!post.postUrl) {
      return NextResponse.json(
        { error: 'This post has no LinkedIn URL set — add one before refreshing engagement.' },
        { status: 400 },
      );
    }

    const engagement = await fetchEngagement(post.postUrl);
    if (!engagement) {
      // Best-effort scrape found nothing — an expected, common outcome, not
      // a server failure. Caller should prompt for manual entry.
      return NextResponse.json({ post, refreshed: false });
    }

    const updated = await db.posts.update(id, {
      likes: engagement.likes,
      comments: engagement.comments,
    });
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ post: updated, refreshed: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to refresh engagement';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
