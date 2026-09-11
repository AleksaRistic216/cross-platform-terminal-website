/**
 * Best-effort per-key rate limit for the public API routes.
 *
 * Memory is per serverless instance, so treat this as friction against a naive loop from one
 * address, not a real rate limiter. A limit that has to hold across instances belongs in the Client
 * API — which is where the per-account cooldown on set-password links lives.
 */
export function createThrottle(maxPerWindow: number, windowMs = 60_000) {
  const hits = new Map<string, { n: number; resetAt: number }>();

  return function throttled(key: string): boolean {
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || now > entry.resetAt) {
      hits.set(key, { n: 1, resetAt: now + windowMs });
      if (hits.size > 5000) {
        for (const [k, value] of hits) if (now > value.resetAt) hits.delete(k);
      }
      return false;
    }

    entry.n += 1;
    return entry.n > maxPerWindow;
  };
}

/** The caller's address, as the platform's proxy reports it. */
export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
