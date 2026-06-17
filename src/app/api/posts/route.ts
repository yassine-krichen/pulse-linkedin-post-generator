import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PostStatus } from '@/types';

const VALID_STATUSES: PostStatus[] = ['draft', 'ready', 'posted'];

function isPostStatus(value: string): value is PostStatus {
  return VALID_STATUSES.includes(value as PostStatus);
}

function parsePositiveInt(value: string | null): number | undefined {
  if (value === null) return undefined;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : NaN;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get('status');

  if (statusParam !== null && !isPostStatus(statusParam)) {
    return NextResponse.json({ error: `Invalid status: ${statusParam}` }, { status: 400 });
  }

  const limit = parsePositiveInt(searchParams.get('limit'));
  const offset = parsePositiveInt(searchParams.get('offset'));
  if (Number.isNaN(limit) || Number.isNaN(offset)) {
    return NextResponse.json({ error: 'limit and offset must be non-negative integers' }, { status: 400 });
  }

  const result = statusParam
    ? await db.posts.findByStatus(statusParam, { limit, offset })
    : await db.posts.findAll({ limit, offset });

  return NextResponse.json(result);
}
