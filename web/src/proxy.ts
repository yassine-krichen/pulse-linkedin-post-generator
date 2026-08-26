import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionCookie } from '@/lib/session';

// Runs on the Node.js runtime by default in Next.js 16 Proxy, so
// node:crypto (used inside verifySessionCookie) is available here.

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const isApiRequest = pathname.startsWith('/api/');

  const appPassword = process.env.APP_PASSWORD;

  if (!appPassword) {
    if (process.env.NODE_ENV === 'production') {
      // Fail closed: never let traffic through an unconfigured gate in prod.
      console.error('[proxy] APP_PASSWORD is not set in production — blocking all requests');
      return isApiRequest
        ? NextResponse.json(
            { error: 'Server misconfigured: APP_PASSWORD is not set.' },
            { status: 500 },
          )
        : new NextResponse('Server misconfigured: APP_PASSWORD is not set.', { status: 500 });
    }
    // Local dev convenience: no password configured means no gate.
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (verifySessionCookie(sessionCookie)) {
    return NextResponse.next();
  }

  if (isApiRequest) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /login (the login page itself)
     * - /api/login (needed to actually log in)
     * - Next.js internals and static assets
     */
    '/((?!login$|api/login$|_next/static|_next/image|favicon.ico).*)',
  ],
};
