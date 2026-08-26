import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Public, unauthenticated endpoint — excluded from the auth gate in
// src/proxy.ts. Only exposes aggregate counts (db.posts.publicStats());
// never post titles, content, or raw input.
export async function GET(): Promise<NextResponse> {
  try {
    const stats = await db.posts.publicStats();
    return NextResponse.json(stats);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch stats';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
