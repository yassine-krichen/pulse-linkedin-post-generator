import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settingsUpdateSchema, formatZodError } from '@/lib/validation';

export async function GET(): Promise<NextResponse> {
  try {
    return NextResponse.json(await db.settings.get());
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const result = settingsUpdateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: formatZodError(result.error) }, { status: 400 });
  }

  try {
    return NextResponse.json(await db.settings.update(result.data));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
