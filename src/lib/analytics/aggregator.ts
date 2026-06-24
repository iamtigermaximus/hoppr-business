// src/lib/analytics/aggregator.ts
// Rolls up raw AnalyticsEvent rows into pre-aggregated BarDailyStats.
// Called by the cron job at /api/cron/analytics-aggregation.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface DailyAggregate {
  barId: string;
  pageViews: number;
  barViews: number;
  promoViews: number;
  promoClicks: number;
  promoRedemptions: number;
  eventViews: number;
  eventJoins: number;
  passViews: number;
  passPurchases: number;
  passScans: number;
  barDirections: number;
  barCalls: number;
  barWebsites: number;
  barShares: number;
  searches: number;
  uniqueVisitors: number;
}

/**
 * Aggregate yesterday's AnalyticsEvent rows into BarDailyStats.
 * Should be called once per day via cron (ideally shortly after midnight UTC).
 * Processes bars in batches to avoid overwhelming the database.
 */
export async function aggregateYesterday(): Promise<{
  barsProcessed: number;
  errors: string[];
}> {
  const errors: string[] = [];

  // Get yesterday's date range (midnight to midnight UTC)
  const now = new Date();
  const yesterdayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1),
  );
  const yesterdayEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  // Get all active bars
  const bars = await prisma.bar.findMany({
    where: { status: { in: ["CLAIMED", "VERIFIED"] } },
    select: { id: true },
  });

  let barsProcessed = 0;

  for (const bar of bars) {
    try {
      // Fetch raw events for this bar on yesterday
      const events = await prisma.analyticsEvent.findMany({
        where: {
          barId: bar.id,
          createdAt: { gte: yesterdayStart, lt: yesterdayEnd },
        },
        select: { type: true, userId: true },
      });

      if (events.length === 0) continue;

      // Aggregate counts by type
      const aggregate: DailyAggregate = {
        barId: bar.id,
        pageViews: 0,
        barViews: 0,
        promoViews: 0,
        promoClicks: 0,
        promoRedemptions: 0,
        eventViews: 0,
        eventJoins: 0,
        passViews: 0,
        passPurchases: 0,
        passScans: 0,
        barDirections: 0,
        barCalls: 0,
        barWebsites: 0,
        barShares: 0,
        searches: 0,
        uniqueVisitors: 0,
      };

      const uniqueUserIds = new Set<string>();

      for (const event of events) {
        if (event.userId) uniqueUserIds.add(event.userId);

        switch (event.type) {
          case "PAGE_VIEW":
            aggregate.pageViews++;
            break;
          case "BAR_VIEW":
            aggregate.barViews++;
            break;
          case "PROMO_VIEW":
            aggregate.promoViews++;
            break;
          case "PROMO_CLICK":
            aggregate.promoClicks++;
            break;
          case "PROMO_REDEMPTION":
            aggregate.promoRedemptions++;
            break;
          case "EVENT_VIEW":
            aggregate.eventViews++;
            break;
          case "EVENT_JOIN":
            aggregate.eventJoins++;
            break;
          case "PASS_VIEW":
            aggregate.passViews++;
            break;
          case "PASS_PURCHASE":
            aggregate.passPurchases++;
            break;
          case "PASS_SCAN":
            aggregate.passScans++;
            break;
          case "BAR_DIRECTION":
            aggregate.barDirections++;
            break;
          case "BAR_CALL":
            aggregate.barCalls++;
            break;
          case "BAR_WEBSITE":
            aggregate.barWebsites++;
            break;
          case "BAR_SHARE":
            aggregate.barShares++;
            break;
          case "SEARCH":
            aggregate.searches++;
            break;
        }
      }

      aggregate.uniqueVisitors = uniqueUserIds.size;

      // Upsert into BarDailyStats
      await prisma.barDailyStats.upsert({
        where: {
          barId_date: { barId: bar.id, date: yesterdayStart },
        },
        create: {
          barId: bar.id,
          date: yesterdayStart,
          ...aggregate,
        },
        update: {
          ...aggregate,
          aggregatedAt: new Date(),
        },
      });

      barsProcessed++;
    } catch (error) {
      errors.push(
        `Bar ${bar.id}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  return { barsProcessed, errors };
}

/**
 * Aggregate a specific date range (for backfilling or manual runs).
 */
export async function aggregateDateRange(
  startDate: Date,
  endDate: Date,
): Promise<{ barsProcessed: number; errors: string[] }> {
  const errors: string[] = [];

  const bars = await prisma.bar.findMany({
    where: { status: { in: ["CLAIMED", "VERIFIED"] } },
    select: { id: true },
  });

  let barsProcessed = 0;

  for (const bar of bars) {
    try {
      const events = await prisma.analyticsEvent.findMany({
        where: {
          barId: bar.id,
          createdAt: { gte: startDate, lt: endDate },
        },
        select: { type: true, userId: true },
      });

      if (events.length === 0) continue;

      // ... same aggregation logic as above
      const aggregate: DailyAggregate = {
        barId: bar.id,
        pageViews: 0,
        barViews: 0,
        promoViews: 0,
        promoClicks: 0,
        promoRedemptions: 0,
        eventViews: 0,
        eventJoins: 0,
        passViews: 0,
        passPurchases: 0,
        passScans: 0,
        barDirections: 0,
        barCalls: 0,
        barWebsites: 0,
        barShares: 0,
        searches: 0,
        uniqueVisitors: 0,
      };

      const uniqueUserIds = new Set<string>();
      for (const event of events) {
        if (event.userId) uniqueUserIds.add(event.userId);
        switch (event.type) {
          case "PAGE_VIEW": aggregate.pageViews++; break;
          case "BAR_VIEW": aggregate.barViews++; break;
          case "PROMO_VIEW": aggregate.promoViews++; break;
          case "PROMO_CLICK": aggregate.promoClicks++; break;
          case "PROMO_REDEMPTION": aggregate.promoRedemptions++; break;
          case "EVENT_VIEW": aggregate.eventViews++; break;
          case "EVENT_JOIN": aggregate.eventJoins++; break;
          case "PASS_VIEW": aggregate.passViews++; break;
          case "PASS_PURCHASE": aggregate.passPurchases++; break;
          case "PASS_SCAN": aggregate.passScans++; break;
          case "BAR_DIRECTION": aggregate.barDirections++; break;
          case "BAR_CALL": aggregate.barCalls++; break;
          case "BAR_WEBSITE": aggregate.barWebsites++; break;
          case "BAR_SHARE": aggregate.barShares++; break;
          case "SEARCH": aggregate.searches++; break;
        }
      }
      aggregate.uniqueVisitors = uniqueUserIds.size;

      await prisma.barDailyStats.upsert({
        where: {
          barId_date: { barId: bar.id, date: startDate },
        },
        create: {
          barId: bar.id,
          date: startDate,
          ...aggregate,
        },
        update: {
          ...aggregate,
          aggregatedAt: new Date(),
        },
      });

      barsProcessed++;
    } catch (error) {
      errors.push(
        `Bar ${bar.id}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  return { barsProcessed, errors };
}
