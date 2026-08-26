import { createHash, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { loginRequestSchema, formatZodError } from '@/lib/validation';
import { createSessionCookie } from '@/lib/session';
import { checkRateLimit, getClientIp, rateLimitResponseInit } from '@/lib/rate-limit';

function passwordMatches(candidate: string, expected: string): boolean {
  // Compare fixed-length digests rather than the raw strings — timingSafeEqual
  // requires equal-length buffers, and hashing first means there's no
  // length-mismatch branch that could otherwise leak the real password's length.
  const candidateHash = createHash('sha256').update(candidate).digest();
  const expectedHash = createHash('sha256').update(expected).digest();
  return timingSafeEqual(candidateHash, expectedHash);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limit = checkRateLimit(`login:${getClientIp(req)}`, 5, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts — slow down and try again shortly.' },
      rateLimitResponseInit(limit.retryAfterSeconds),
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const result = loginRequestSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: formatZodError(result.error) }, { status: 400 });
  }

  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) {
    console.error('[login] APP_PASSWORD is not configured');
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  if (!passwordMatches(result.data.password, appPassword)) {
    console.warn('[login] password mismatch');
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const cookie = createSessionCookie();
  const response = NextResponse.json({ success: true });
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
