import { NextRequest } from 'next/server';

/**
 * Best-effort in-memory rate limiter. Works per server instance — good enough
 * to shrug off casual script abuse on public endpoints. For stronger guarantees
 * (multi-region, multi-instance) swap this for Upstash Redis or Vercel KV.
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function sweep() {
  if (buckets.size < MAX_BUCKETS) return;
  const now = Date.now();
  for (const [key, b] of buckets) if (b.resetAt < now) buckets.delete(key);
}

export function getClientIp(request: Request | NextRequest): string {
  const h = (request as any).headers;
  const xff = h?.get?.('x-forwarded-for') || '';
  const first = xff.split(',')[0]?.trim();
  if (first) return first;
  const real = h?.get?.('x-real-ip');
  if (real) return real;
  return 'unknown';
}

/**
 * @param key        unique identifier (usually `route:ip`)
 * @param limit      max requests in the window
 * @param windowMs   window duration in ms
 * @returns          { ok } — true if allowed, false if rate-limited
 */
export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  sweep();
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  bucket.count++;
  return { ok: true, retryAfter: 0 };
}
