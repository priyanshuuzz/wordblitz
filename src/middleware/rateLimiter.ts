// ── In-memory rate limiter ─────────────────────────────────────────────────
// No Redis needed at Phase 1. Handles up to ~10k concurrent users.
// Keyed by uid (not IP) — more accurate for authenticated users.

interface RateEntry {
  count:   number;
  resetAt: number;
}

const store = new Map<string, RateEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 300_000);

/**
 * Returns true if the request is allowed, false if rate limited.
 * @param key     Unique identifier (uid, ip, etc.)
 * @param limit   Max requests per window
 * @param windowMs Window duration in ms
 */
export function checkRateLimit(
  key: string,
  limit = 60,
  windowMs = 60_000
): boolean {
  const now   = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

/** Stricter limit for matchmaking joins (prevent queue spam) */
export function checkMatchmakingLimit(uid: string): boolean {
  return checkRateLimit(`mm:${uid}`, 5, 10_000); // 5 joins per 10s
}

/** Limit word submissions per socket */
export function checkWordSubmitLimit(uid: string): boolean {
  return checkRateLimit(`ws:${uid}`, 30, 10_000); // 30 words per 10s (generous)
}
