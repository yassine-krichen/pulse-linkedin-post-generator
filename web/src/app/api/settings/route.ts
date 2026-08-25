import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settingsUpdateSchema, formatZodError } from '@/lib/validation';

export async function GET() {
  return NextResponse.json(await db.settings.get());
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const result = settingsUpdateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: formatZodError(result.error) }, { status: 400 });
  }
  return NextResponse.json(await db.settings.update(result.data));
}
