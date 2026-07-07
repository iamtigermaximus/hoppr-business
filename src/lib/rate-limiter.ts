/**
 * In-memory rate limiter with configurable window and max requests.
 * Uses a sliding window per key (typically userId:endpoint or IP:endpoint).
 * Stale entries are cleaned on each check.
 *
 * Note: In-memory means limits reset on server restart and don't
 * span multiple instances. For production, swap to Redis-based limiting.
 */
interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now - entry.windowStart > entryWindow(key) * 1000 * 2) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
  if (typeof cleanupTimer !== "undefined" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

const keyWindows = new Map<string, number>();

function entryWindow(key: string): number {
  return keyWindows.get(key) ?? 60;
}

export interface RateLimitConfig {
  windowSeconds: number;
  maxRequests: number;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): { allowed: true } | { allowed: false; retryAfter: number } {
  ensureCleanup();
  keyWindows.set(key, config.windowSeconds);

  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const existing = store.get(key);

  if (!existing || now - existing.windowStart > windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (existing.count >= config.maxRequests) {
    const retryAfter = Math.ceil(
      (existing.windowStart + windowMs - now) / 1000,
    );
    return { allowed: false, retryAfter };
  }

  existing.count++;
  return { allowed: true };
}

export const RateLimits = {
  /** Auth login: 5 attempts per minute per IP */
  AUTH: { windowSeconds: 60, maxRequests: 5 } as RateLimitConfig,
  /** Content creation: 10 per minute per bar */
  CREATE: { windowSeconds: 60, maxRequests: 10 } as RateLimitConfig,
  /** AI generation (suggest + generate): 10 per minute per bar */
  AI: { windowSeconds: 60, maxRequests: 10 } as RateLimitConfig,
  /** File upload: 20 per minute per bar */
  UPLOAD: { windowSeconds: 60, maxRequests: 20 } as RateLimitConfig,
  /** Social posting: 10 per minute per bar */
  SOCIAL: { windowSeconds: 60, maxRequests: 10 } as RateLimitConfig,
  /** Staff management: 15 per minute per bar */
  STAFF: { windowSeconds: 60, maxRequests: 15 } as RateLimitConfig,
  /** QR scanning: 30 per minute per bar (operational throughput) */
  SCAN: { windowSeconds: 60, maxRequests: 30 } as RateLimitConfig,
  /** Analytics/dashboard: 30 per minute per bar */
  ANALYTICS: { windowSeconds: 60, maxRequests: 30 } as RateLimitConfig,
  /** AI image generation: 5 per minute per bar (prevents rapid regeneration spam) */
  AI_IMAGE_PER_MINUTE: { windowSeconds: 60, maxRequests: 5 } as RateLimitConfig,
  /** AI image generation: 50 per day per bar (cost cap — ~$0.75/day at Klein-9b prices) */
  AI_IMAGE_PER_DAY: { windowSeconds: 86400, maxRequests: 50 } as RateLimitConfig,
} as const;

/** Extract a rate-limit key from the incoming request (IP-based fallback). */
export function getRateLimitKey(request: Request, suffix: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return `${ip}:${suffix}`;
}
