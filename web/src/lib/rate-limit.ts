// In-memory fixed-window limiter. This is a single-user personal tool with
// no shared backing store (Redis etc.) — good enough to stop an accidental
// loop or script from burning through the free-tier LLM quota in seconds.
// Resets if the process restarts; that's an acceptable tradeoff at this scale.
const buckets = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count++;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function rateLimitResponseInit(retryAfterSeconds: number): ResponseInit {
  return {
    status: 429,
    headers: { 'Retry-After': String(retryAfterSeconds) },
  };
}

/**
 * Best-effort client IP, trusting only the hop closest to us. Render sits
 * as a single reverse proxy in front of this app and appends the real
 * connecting IP as the LAST entry of x-forwarded-for — everything before
 * that (including the entire header, if a client sets it directly) is
 * attacker-controlled. Taking the first entry (a past bug here) lets any
 * caller mint a fresh rate-limit bucket on every request just by sending a
 * different x-forwarded-for value, fully defeating per-IP limits on
 * unauthenticated routes like /api/login and /api/demo.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const hops = forwardedFor.split(',');
    return hops[hops.length - 1].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return 'unknown';
}
