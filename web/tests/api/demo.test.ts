import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { POST as PostType } from '@/app/api/demo/route';

// `checkRateLimit` keeps its bucket in a module-scoped Map, and
// FREELLM_BASE_URL/FREELLM_API_KEY are read into module-scoped consts at
// import time inside demo-stream.ts. Reset modules and re-import the route
// fresh in each test so every test gets an isolated rate-limit bucket and
// picks up freshly-stubbed env vars — same pattern as tests/api/login.test.ts
// and tests/lib/llm.generate.test.ts.
async function importDemoPost(): Promise<typeof PostType> {
  const mod = await import('@/app/api/demo/route');
  return mod.POST;
}

function demoRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost/api/demo', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

function stubFreellmConfigured(): void {
  vi.stubEnv('FREELLM_BASE_URL', 'http://freellm.test/v1');
  vi.stubEnv('FREELLM_API_KEY', 'freellm-secret-key');
}

// getVoiceExamples hits the real DB via `@/lib/db` (Prisma). That's an
// out-of-scope collaborator for a route contract test — mock it directly
// rather than letting it attempt a real connection or rely on its internal
// try/catch fallback timing. loadProfileContext is left unmocked: it only
// reads static files already present in the repo, so it's fast, real, and
// deterministic.
vi.mock('@/lib/voice-examples', () => ({
  getVoiceExamples: vi.fn().mockResolvedValue('EXAMPLE (posted, standard):\nmock voice example'),
}));

function sseStream(body: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(body));
      controller.close();
    },
  });
}

function upstreamOk(sseBody: string): Response {
  return {
    ok: true,
    status: 200,
    body: sseStream(sseBody),
    text: () => Promise.resolve(''),
  } as unknown as Response;
}

function upstreamError(status: number, errBody = ''): Response {
  return {
    ok: false,
    status,
    body: null,
    text: () => Promise.resolve(errBody),
  } as unknown as Response;
}

describe('POST /api/demo', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('input validation', () => {
    it('returns 400 and never calls fetch for input shorter than 10 characters', async () => {
      stubFreellmConfigured();
      const POST = await importDemoPost();

      const res = await POST(demoRequest({ input: 'too short' }));

      expect(res.status).toBe(400);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('returns 400 and never calls fetch for input longer than 800 characters', async () => {
      stubFreellmConfigured();
      const POST = await importDemoPost();

      const res = await POST(demoRequest({ input: 'a'.repeat(801) }));

      expect(res.status).toBe(400);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('oversized body', () => {
    it('returns 413 without ever attempting to parse the JSON body', async () => {
      stubFreellmConfigured();
      const POST = await importDemoPost();
      const jsonSpy = vi.spyOn(NextRequest.prototype, 'json');

      const res = await POST(
        demoRequest({ input: 'valid enough input here' }, { 'content-length': '999999' }),
      );
      const body: { error: string } = await res.json();

      expect(res.status).toBe(413);
      expect(body.error).toBeTruthy();
      expect(jsonSpy).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('missing configuration', () => {
    it('returns 503 with a clear message and never calls fetch when FREELLM env vars are unset', async () => {
      vi.stubEnv('FREELLM_BASE_URL', '');
      vi.stubEnv('FREELLM_API_KEY', '');
      const POST = await importDemoPost();

      const res = await POST(demoRequest({ input: 'valid enough input for a demo post' }));
      const body: { error: string } = await res.json();

      expect(res.status).toBe(503);
      expect(body.error).toBeTruthy();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('rate limiting', () => {
    it('rejects the 4th request within the window with 429 and a Retry-After header, from the same trusted client IP', async () => {
      stubFreellmConfigured();
      fetchMock.mockResolvedValue(upstreamError(500));
      const POST = await importDemoPost();

      for (let attempt = 0; attempt < 3; attempt++) {
        const res = await POST(
          demoRequest({ input: 'valid enough input for a demo post' }, { 'x-forwarded-for': '9.9.9.9' }),
        );
        expect(res.status).toBe(200);
      }

      const res = await POST(
        demoRequest({ input: 'valid enough input for a demo post' }, { 'x-forwarded-for': '9.9.9.9' }),
      );
      const body: { error: string } = await res.json();

      expect(res.status).toBe(429);
      expect(res.headers.get('Retry-After')).toBeTruthy();
      expect(body.error).toBeTruthy();
    });

    it('does not reset the bucket when the caller spoofs a different leading x-forwarded-for entry while the trusted trailing hop stays the same', async () => {
      stubFreellmConfigured();
      fetchMock.mockResolvedValue(upstreamError(500));
      const POST = await importDemoPost();

      // Each call claims a different "client" IP as the first hop — exactly
      // what a spoofing caller controls — but the trusted last hop (the one
      // the reverse proxy actually appended) never changes. If getClientIp
      // trusted the first entry (the old, buggy behavior), each of these
      // would land in a fresh bucket and never hit the limit.
      const spoofedLeadingIps = ['1.1.1.1', '2.2.2.2', '3.3.3.3', '4.4.4.4'];
      const statuses: number[] = [];
      for (const leadingIp of spoofedLeadingIps) {
        const res = await POST(
          demoRequest(
            { input: 'valid enough input for a demo post' },
            { 'x-forwarded-for': `${leadingIp}, 9.9.9.9` },
          ),
        );
        statuses.push(res.status);
      }

      expect(statuses).toEqual([200, 200, 200, 429]);
    });
  });

  describe('successful generation', () => {
    it('streams the concatenated tokens from the upstream SSE response with no NUL error marker', async () => {
      stubFreellmConfigured();
      const sseBody =
        'data: {"choices":[{"delta":{"content":"Hello "}}]}\n\n' +
        'data: {"choices":[{"delta":{"content":"world"}}]}\n\n' +
        'data: [DONE]\n\n';
      fetchMock.mockResolvedValueOnce(upstreamOk(sseBody));
      const POST = await importDemoPost();

      const res = await POST(demoRequest({ input: 'valid enough input for a demo post' }));
      const text = await res.text();

      expect(res.status).toBe(200);
      expect(text).toBe('Hello world');
      expect(text).not.toContain(String.fromCharCode(0));
    });
  });

  describe('upstream failure mid-stream', () => {
    it('embeds a NUL-prefixed error marker in the body when the upstream response is not ok', async () => {
      stubFreellmConfigured();
      fetchMock.mockResolvedValueOnce(upstreamError(500, 'upstream exploded'));
      const POST = await importDemoPost();

      const res = await POST(demoRequest({ input: 'valid enough input for a demo post' }));
      const text = await res.text();

      // The route itself still returns 200 with a streaming body — the
      // failure is signaled inside the stream via DEMO_ERROR_PREFIX, not
      // via HTTP status, since headers are already committed by the time
      // the upstream call fails.
      expect(res.status).toBe(200);
      expect(text.charCodeAt(0)).toBe(0);
      expect(text).toContain('freellmapi responded 500');
      expect(text).toContain('upstream exploded');
    });
  });
});
