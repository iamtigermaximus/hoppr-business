import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";


/**
 * POST /api/auth/bar/[barId]/dashboard/seed
 *
 * Seeds 7 days of realistic AnalyticsEvent data for this bar,
 * then runs the aggregator to populate BarDailyStats.
 * Only usable in development — blocked in production.
 *
 * After calling this, refresh the dashboard to see real numbers.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
): Promise<NextResponse> {
  // Block in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Seed endpoint is disabled in production" },
      { status: 403 },
    );
  }

  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isBarStaffToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { barId } = await params;
    if (payload.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify bar exists
    const bar = await prisma.bar.findUnique({ where: { id: barId } });
    if (!bar) {
      return NextResponse.json({ error: "Bar not found" }, { status: 404 });
    }

    // Get existing promos and events for realistic metadata
    const promos = await prisma.barPromotion.findMany({
      where: { barId },
      select: { id: true, title: true },
      take: 3,
    });
    const existingEvents = await prisma.event.findMany({
      where: { venueId: barId },
      select: { id: true, title: true },
      take: 3,
    });

    // Generate 7 days of data (yesterday back to 7 days ago)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const seedEvents: any[] = [];

    for (let daysAgo = 7; daysAgo >= 1; daysAgo--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - daysAgo);
      dayStart.setHours(8, 0, 0, 0); // Start at 8am

      // Base traffic grows slightly over the week (newer days have more)
      const growthFactor = 1 + (7 - daysAgo) * 0.15; // 1.0 → ~1.9

      const counts: Record<string, [number, number]> = {
        PAGE_VIEW: [12, 25],
        BAR_VIEW: [8, 18],
        PROMO_VIEW: [4, 12],
        PROMO_CLICK: [2, 7],
        EVENT_VIEW: [2, 8],
        EVENT_JOIN: [1, 4],
        BAR_DIRECTION: [2, 8],
        BAR_CALL: [0, 3],
        BAR_WEBSITE: [1, 5],
        BAR_SHARE: [1, 3],
        SEARCH: [3, 8],
        FOLLOW: [0, 2],
      };

      for (const [type, [min, max]] of Object.entries(counts)) {
        const baseCount =
          Math.floor(Math.random() * (max - min + 1)) + min;
        const count = Math.round(baseCount * growthFactor);

        for (let i = 0; i < count; i++) {
          // Spread events throughout the day (8am to 2am next day)
          const hour = 8 + Math.floor(Math.random() * 18);
          const minute = Math.floor(Math.random() * 60);
          const eventTime = new Date(dayStart);
          eventTime.setHours(hour, minute, Math.floor(Math.random() * 60));

          const data: Record<string, unknown> = {};

          // Attach promo/event metadata when relevant
          if (
            (type === "PROMO_VIEW" ||
              type === "PROMO_CLICK" ||
              type === "PROMO_REDEMPTION") &&
            promos.length > 0
          ) {
            const promo = promos[Math.floor(Math.random() * promos.length)];
            data.promoId = promo.id;
            data.promoName = promo.title;
          }
          if (
            (type === "EVENT_VIEW" || type === "EVENT_JOIN") &&
            existingEvents.length > 0
          ) {
            const event = existingEvents[Math.floor(Math.random() * existingEvents.length)];
            data.eventId = event.id;
            data.eventTitle = event.title;
          }

          seedEvents.push({
            barId,
            type,
            data,
            createdAt: eventTime,
          });
        }
      }

      // PROMO_REDEMPTION: fewer, only if promos exist
      if (promos.length > 0) {
        const redemptionCount = Math.round(
          (Math.floor(Math.random() * 5) + 1) * growthFactor,
        );
        for (let i = 0; i < redemptionCount; i++) {
          const hour = 10 + Math.floor(Math.random() * 16);
          const eventTime = new Date(dayStart);
          eventTime.setHours(hour, Math.floor(Math.random() * 60));
          const promo = promos[Math.floor(Math.random() * promos.length)];
          seedEvents.push({
            barId,
            type: "PROMO_REDEMPTION",
            data: { promoId: promo.id, promoName: promo.title },
            createdAt: eventTime,
          });
        }
      }
    }

    // Batch insert all events (chunked to avoid huge statements)
    const CHUNK_SIZE = 100;
    let inserted = 0;
    for (let i = 0; i < seedEvents.length; i += CHUNK_SIZE) {
      const chunk = seedEvents.slice(i, i + CHUNK_SIZE);
      await prisma.analyticsEvent.createMany({ data: chunk });
      inserted += chunk.length;
    }

    // Run the aggregator to populate BarDailyStats
    const { aggregateDateRange } = await import(
      "@/lib/analytics/aggregator"
    );

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const aggResult = await aggregateDateRange(sevenDaysAgo, tomorrow);

    return NextResponse.json({
      success: true,
      eventsInserted: inserted,
      daysSeeded: 7,
      barsAggregated: aggResult.barsProcessed,
      errors: aggResult.errors,
      hint: "Refresh your dashboard to see the seeded data. The Performance section will show real numbers.",
    });
  } catch (error) {
    console.error("Seed test data error:", error);
    return NextResponse.json(
      { error: "Failed to seed test data" },
      { status: 500 },
    );
  }
}
