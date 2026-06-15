import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  return NextResponse.json(db.settings.get());
}

export async function PATCH(req: NextRequest) {
  const updates = await req.json();
  return NextResponse.json(db.settings.update(updates));
}
