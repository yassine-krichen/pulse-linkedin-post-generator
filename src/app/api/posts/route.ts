import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PostStatus } from '@/types';

const VALID_STATUSES: PostStatus[] = ['draft', 'ready', 'posted'];

function isPostStatus(value: string): value is PostStatus {
  return VALID_STATUSES.includes(value as PostStatus);
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get('status');

  if (statusParam !== null && !isPostStatus(statusParam)) {
    return NextResponse.json({ error: `Invalid status: ${statusParam}` }, { status: 400 });
  }

  const posts = statusParam ? await db.posts.findByStatus(statusParam) : await db.posts.findAll();
  return NextResponse.json(posts);
}
