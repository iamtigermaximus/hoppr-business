/**
 * Rate limiter — Redis-backed with in-memory fallback.
 *
 * Primary: Upstash Redis (HTTP-based, spans all serverless instances).
 * Degraded: In-memory Map (per-instance, resets on restart).
 *
 * The Redis path uses INCR + EXPIRE for atomic counter operations.
 * The fallback path uses a sliding-window Map per instance.
 */

import { redis } from "@/lib/redis";

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const memoryStore = new Map<string, RateLimitEntry>();
const keyWindows = new Map<string, number>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureMemoryCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore) {
      if (now - entry.windowStart > (keyWindows.get(key) ?? 60) * 1000 * 2) {
        memoryStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
  if (typeof cleanupTimer !== "undefined" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

export interface RateLimitConfig {
  windowSeconds: number;
  maxRequests: number;
}

function checkMemory(
  key: string,
  config: RateLimitConfig,
): { allowed: true } | { allowed: false; retryAfter: number } {
  ensureMemoryCleanup();
  keyWindows.set(key, config.windowSeconds);

  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const existing = memoryStore.get(key);

  if (!existing || now - existing.windowStart > windowMs) {
    memoryStore.set(key, { count: 1, windowStart: now });
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

async function checkRedis(
  key: string,
  config: RateLimitConfig,
): Promise<{ allowed: true } | { allowed: false; retryAfter: number }> {
  if (!redis) throw new Error("Redis not available");

  const redisKey = `rl:${key}`;

  // Atomically increment the counter. Redis creates the key with
  // value 0 then increments to 1 on first call.
  const count = await redis.incr(redisKey);

  // Set expiry on first creation only
  if (count === 1) {
    await redis.expire(redisKey, config.windowSeconds);
  }

  if (count > config.maxRequests) {
    const ttl = await redis.ttl(redisKey);
    return { allowed: false, retryAfter: ttl > 0 ? ttl : config.windowSeconds };
  }

  return { allowed: true };
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<{ allowed: true } | { allowed: false; retryAfter: number }> {
  // Try Redis first — if configured and reachable, it spans all instances
  if (redis) {
    try {
      return await checkRedis(key, config);
    } catch (err) {
      console.warn(`[rate-limiter] Redis unavailable, falling back to in-memory: ${(err as Error)?.message}`);
    }
  }

  // Degraded: in-memory per-instance fallback
  return checkMemory(key, config);
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
