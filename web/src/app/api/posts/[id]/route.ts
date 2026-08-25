import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Post } from '@/types';
import { postUpdateSchema, formatZodError } from '@/lib/validation';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await params;
  try {
    const post = await db.posts.findById(id);
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(post);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch post';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const result = postUpdateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: formatZodError(result.error) }, { status: 400 });
  }

  const updates: Partial<Post> = { ...result.data } as Partial<Post>;
  if ('content' in result.data || 'title' in result.data || 'hashtags' in result.data || 'imageStrategy' in result.data) {
    updates.wasEdited = true;
  }

  try {
    const post = await db.posts.update(id, updates);
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(post);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update post';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await params;
  try {
    const ok = await db.posts.delete(id);
    if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete post';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
