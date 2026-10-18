/**
 * Minimal fixed-window rate limiter for unauthenticated auth endpoints.
 *
 * In-memory and therefore per-instance: it blunts casual abuse (email bombing,
 * token guessing) but is not a distributed limiter. Swap the store for Redis /
 * Upstash if you need a global guarantee across serverless instances.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const globalForLimiter = globalThis as typeof globalThis & {
  __skillpathRateBuckets?: Map<string, Bucket>;
};

const buckets = (globalForLimiter.__skillpathRateBuckets ??= new Map<string, Bucket>());

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, retryAfterSeconds: windowSeconds };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
}

/** Prune expired buckets so the map cannot grow without bound. */
export function pruneRateBuckets() {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function clientKey(request: Request, scope: string) {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return `${scope}:${ip}`;
}
