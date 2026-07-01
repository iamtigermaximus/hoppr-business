// src/lib/analytics-tracker.ts
// Lightweight server-side analytics event writer with write-time aggregation.
// Every track() call writes a raw AnalyticsEvent row AND upserts today's
// BarDailyStats — no cron dependency, data is always current.
//
// Usage from an API route:
//   track({ type: "PASS_SCAN", userId: payload.userId, barId, data: { passId } });

import { prisma } from "@/lib/database";
import { AnalyticsEventType } from "@prisma/client";

interface TrackOptions {
  type: AnalyticsEventType;
  userId?: string | null;
  barId?: string | null;
  data?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Maps each AnalyticsEventType to its corresponding BarDailyStats counter field.
 * Kept in sync with the aggregator's switch statement.
 */
const STAT_FIELD_MAP: Partial<Record<AnalyticsEventType, string>> = {
  PAGE_VIEW: "pageViews",
  BAR_VIEW: "barViews",
  PROMO_VIEW: "promoViews",
  PROMO_CLICK: "promoClicks",
  PROMO_REDEMPTION: "promoRedemptions",
  EVENT_VIEW: "eventViews",
  EVENT_JOIN: "eventJoins",
  PASS_VIEW: "passViews",
  PASS_PURCHASE: "passPurchases",
  PASS_SCAN: "passScans",
  BAR_DIRECTION: "barDirections",
  BAR_CALL: "barCalls",
  BAR_WEBSITE: "barWebsites",
  BAR_SHARE: "barShares",
  SEARCH: "searches",
};

/**
 * Write a single analytics event AND increment today's BarDailyStats row.
 * Fire-and-forget — errors are logged but never thrown, so tracking
 * failures don't break the user's request.
 *
 * The BarDailyStats upsert removes the need for a nightly cron job.
 * Unique visitors still benefit from the cron (which can compute them
 * from raw events), but every counter is real-time by default.
 */
export async function track(opts: TrackOptions): Promise<void> {
  try {
    // 1. Write the raw event row
    await prisma.analyticsEvent.create({
      data: {
        type: opts.type,
        userId: opts.userId ?? null,
        barId: opts.barId ?? null,
        data: (opts.data ?? undefined) as any,
        ipAddress: (opts.ipAddress ?? undefined) as any,
        userAgent: (opts.userAgent ?? undefined) as any,
      },
    });
  } catch (error) {
    console.error(
      `[analytics-tracker] Failed to write ${opts.type}:`,
      error instanceof Error ? error.message : error,
    );
    return; // can't aggregate if we didn't write the event
  }

  // 2. Increment today's BarDailyStats row (write-time aggregation)
  const statField = opts.type ? STAT_FIELD_MAP[opts.type] : undefined;

  if (statField && opts.barId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Atomic upsert: create row if first event of the day, otherwise increment
      await prisma.$executeRawUnsafe(
        `INSERT INTO "bar_daily_stats" ("bar_id", "stats_date", "${statField}", "aggregated_at", "created_at")
         VALUES ($1, $2, 1, NOW(), NOW())
         ON CONFLICT ("bar_id", "stats_date")
         DO UPDATE SET "${statField}" = "bar_daily_stats"."${statField}" + 1,
                       "aggregated_at" = NOW()`,
        opts.barId,
        today,
      );
    } catch (error) {
      console.error(
        `[analytics-tracker] Failed to upsert BarDailyStats for ${opts.type}:`,
        error instanceof Error ? error.message : error,
      );
      // Non-fatal — the raw event is already stored
    }
  }
}

// ---- Activation helpers ----

/**
 * Activation thresholds per persona.
 *
 * Consumer: first PASS_SCAN (pass redeemed at a bar) → activated.
 * Bar owner: first PROMO_REDEMPTION on their bar → activated.
 */
export const ACTIVATION_EVENTS: AnalyticsEventType[] = [
  "PASS_SCAN",
  "PROMO_REDEMPTION",
  "EVENT_JOIN",
];

export const ACTIVATION_DATA_KEY = "activatesUser";

/**
 * Check whether a User has been activated (has activatedAt set).
 */
export async function isUserActivated(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { activatedAt: true },
    });
    return !!user?.activatedAt;
  } catch {
    return false;
  }
}

/**
 * Mark a user as activated if they aren't already.
 * Called after an activation event is confirmed.
 */
export async function activateUserIfNeeded(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { activatedAt: true },
    });
    if (user?.activatedAt) return false;

    await prisma.user.update({
      where: { id: userId },
      data: { activatedAt: new Date() },
    });
    return true;
  } catch {
    return false;
  }
}
