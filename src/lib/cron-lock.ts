// src/lib/cron-lock.ts
// ============================================================================
// DISTRIBUTED CRON LOCK
// ============================================================================
//
// Prevents overlapping cron job runs when multiple Vercel serverless instances
// fire the same cron endpoint concurrently.
//
// Usage in a cron route handler:
//   const lock = await acquireLock("insights");
//   if (!lock) return NextResponse.json({ skipped: true, reason: "Lock held" });
//   try {
//     // ... cron work ...
//   } finally {
//     await releaseLock("insights");
//   }
// ============================================================================

import { prisma } from "@/lib/database";

const DEFAULT_MAX_DURATION_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Try to acquire a named lock. Returns `true` if the lock was acquired,
 * `false` if another instance already holds it and the lock hasn't expired.
 *
 * Locks auto-expire after `maxDurationMs` to prevent permanent deadlocks
 * if a serverless function crashes before releasing.
 */
export async function acquireLock(
  lockName: string,
  maxDurationMs: number = DEFAULT_MAX_DURATION_MS,
): Promise<boolean> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + maxDurationMs);
  const instanceId = process.env.VERCEL_INSTANCE_ID ?? "local";

  try {
    // First, clean up any expired lock for this name
    await prisma.cronLock.deleteMany({
      where: {
        lockName,
        expiresAt: { lt: now },
      },
    });

    // Try to create a new lock — if one already exists and isn't expired,
    // the unique constraint on lockName will throw
    await prisma.cronLock.create({
      data: {
        lockName,
        acquiredAt: now,
        expiresAt,
        instanceId,
      },
    });

    console.log(`[CronLock] Acquired "${lockName}" (expires ${expiresAt.toISOString()})`);
    return true;
  } catch (error) {
    // Unique constraint violation (P2002) = lock already held
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      console.log(`[CronLock] Skipped "${lockName}" — already held by another instance`);
      return false;
    }

    // Re-throw unexpected errors
    throw error;
  }
}

/**
 * Release a named lock. Safe to call even if the lock doesn't exist.
 */
export async function releaseLock(lockName: string): Promise<void> {
  try {
    await prisma.cronLock.delete({ where: { lockName } });
    console.log(`[CronLock] Released "${lockName}"`);
  } catch (error) {
    // P2025 = record not found (already released or never acquired) — safe to ignore
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error.code === "P2025" || error.code === "P2016")
    ) {
      return;
    }
    console.error(`[CronLock] Failed to release "${lockName}":`, error);
  }
}

/**
 * Refresh an existing lock's expiry time. Use this for long-running jobs
 * that need more time than the initial maxDurationMs.
 */
export async function refreshLock(
  lockName: string,
  extendByMs: number,
): Promise<boolean> {
  const newExpiresAt = new Date(Date.now() + extendByMs);

  try {
    await prisma.cronLock.update({
      where: { lockName },
      data: { expiresAt: newExpiresAt },
    });
    console.log(`[CronLock] Refreshed "${lockName}" (new expiry ${newExpiresAt.toISOString()})`);
    return true;
  } catch {
    return false; // Lock doesn't exist — someone else released it
  }
}
