import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Post } from '@/types';
import { postUpdateSchema, formatZodError } from '@/lib/validation';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await params;
  const post = await db.posts.findById(id);
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(post);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await params;
  const body = await req.json();
  const result = postUpdateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: formatZodError(result.error) }, { status: 400 });
  }

  const updates: Partial<Post> = { ...result.data } as Partial<Post>;
  if ('content' in result.data || 'title' in result.data || 'hashtags' in result.data || 'imageStrategy' in result.data) {
    updates.wasEdited = true;
  }
  const post = await db.posts.update(id, updates);
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(post);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await params;
  const ok = await db.posts.delete(id);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
