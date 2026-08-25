import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(): Promise<NextResponse> {
  try {
    const stats = await db.posts.stats();
    return NextResponse.json(stats);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch stats';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
