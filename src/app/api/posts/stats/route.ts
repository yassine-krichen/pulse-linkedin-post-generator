import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(): Promise<NextResponse> {
  const stats = await db.posts.stats();
  return NextResponse.json(stats);
}
