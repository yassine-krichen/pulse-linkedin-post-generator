import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp, rateLimitResponseInit } from '@/lib/rate-limit';
import { streamDemoPost } from '@/lib/demo-stream';
import { demoRequestSchema, formatZodError } from '@/lib/validation';

// Unauthenticated by design — this is the public landing-page "try it live"
// demo (see src/proxy.ts's matcher exclusion). Rate-limited per client IP,
// not persisted anywhere: no Post row is created for a demo generation.
export async function POST(req: NextRequest): Promise<Response> {
  const limit = checkRateLimit(`demo:${getClientIp(req)}`, 3, 10 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many demo requests — try again in a few minutes.' },
      rateLimitResponseInit(limit.retryAfterSeconds),
    );
  }

  // Reject oversized bodies before buffering them into memory at all — this
  // endpoint is reachable by anyone, unauthenticated. The real payload is at
  // most a few hundred bytes of JSON wrapping an 800-char string; 4KB is
  // already generous headroom.
  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > 4096) {
    return NextResponse.json({ error: 'Request body too large' }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const result = demoRequestSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: formatZodError(result.error) }, { status: 400 });
  }

  try {
    const stream = streamDemoPost(result.data.input);
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Demo generation is unavailable right now.';
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
