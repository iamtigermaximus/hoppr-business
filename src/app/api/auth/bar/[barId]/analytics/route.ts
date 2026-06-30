import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";

/**
 * GET /api/auth/bar/[barId]/analytics?range=7d|30d|90d
 *
 * Aggregates raw AnalyticsEvent rows directly (same source as the dashboard
 * stats endpoint), so both pages always show matching numbers. No cron
 * dependency — everything is real-time.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
): Promise<NextResponse> {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isBarStaffToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { barId } = await params;
    if (payload.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30d";
    const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // ── Fetch raw events (same source as dashboard stats) ────────
    const rawEvents = await prisma.analyticsEvent.findMany({
      where: {
        barId,
        createdAt: { gte: startDate },
      },
      select: {
        type: true,
        userId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // ── Aggregate totals by type ─────────────────────────────────
    const typeCounts: Record<string, number> = {};
    const uniqueUsers = new Set<string>();

    // Daily breakdown — group counts by ISO date string
    const dailyMap = new Map<
      string,
      {
        profileViews: number;
        uniqueVisitors: Set<string>;
        promoViews: number;
        promoClicks: number;
        promoRedemptions: number;
        eventViews: number;
        eventJoins: number;
        directionClicks: number;
        shareCount: number;
      }
    >();

    const zeroDay = () => ({
      profileViews: 0,
      uniqueVisitors: new Set<string>(),
      promoViews: 0,
      promoClicks: 0,
      promoRedemptions: 0,
      eventViews: 0,
      eventJoins: 0,
      directionClicks: 0,
      shareCount: 0,
    });

    for (const ev of rawEvents) {
      typeCounts[ev.type] = (typeCounts[ev.type] || 0) + 1;
      if (ev.userId) uniqueUsers.add(ev.userId);

      const dateKey = ev.createdAt.toISOString().slice(0, 10);
      if (!dailyMap.has(dateKey)) dailyMap.set(dateKey, zeroDay());
      const day = dailyMap.get(dateKey)!;

      if (ev.userId) day.uniqueVisitors.add(ev.userId);

      switch (ev.type) {
        case "PAGE_VIEW":
        case "BAR_VIEW":
          day.profileViews++;
          break;
        case "BAR_DIRECTION":
          day.directionClicks++;
          break;
        case "BAR_SHARE":
          day.shareCount++;
          break;
        case "PROMO_VIEW":
          day.promoViews++;
          break;
        case "PROMO_CLICK":
          day.promoClicks++;
          break;
        case "PROMO_REDEMPTION":
          day.promoRedemptions++;
          break;
        case "EVENT_VIEW":
          day.eventViews++;
          break;
        case "EVENT_JOIN":
          day.eventJoins++;
          break;
      }
    }

    const totals = {
      profileViews: (typeCounts["PAGE_VIEW"] || 0) + (typeCounts["BAR_VIEW"] || 0),
      directionClicks: typeCounts["BAR_DIRECTION"] || 0,
      websiteClicks: typeCounts["BAR_WEBSITE"] || 0,
      callClicks: typeCounts["BAR_CALL"] || 0,
      shareCount: typeCounts["BAR_SHARE"] || 0,
      promoViews: typeCounts["PROMO_VIEW"] || 0,
      promoClicks: typeCounts["PROMO_CLICK"] || 0,
      promoRedemptions: typeCounts["PROMO_REDEMPTION"] || 0,
      eventViews: typeCounts["EVENT_VIEW"] || 0,
      eventJoins: typeCounts["EVENT_JOIN"] || 0,
      uniqueVisitors: uniqueUsers.size,
    };

    // ── Daily breakdown (for charts) ─────────────────────────────
    const dailyBreakdown = Array.from(dailyMap.entries())
      .map(([date, d]) => ({
        date,
        profileViews: d.profileViews,
        uniqueVisitors: d.uniqueVisitors.size,
        promoViews: d.promoViews,
        promoClicks: d.promoClicks,
        promoRedemptions: d.promoRedemptions,
        eventViews: d.eventViews,
        eventJoins: d.eventJoins,
        directionClicks: d.directionClicks,
        shareCount: d.shareCount,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ── Active counts ────────────────────────────────────────────
    const now = new Date();
    const [activePromos, activeEvents, activeCampaigns, campaignAggregates, campaignsInRange] = await Promise.all([
      prisma.barPromotion.count({
        where: {
          barId,
          isActive: true,
          isApproved: true,
          startDate: { lte: now },
          endDate: { gte: now },
        },
      }),
      prisma.event.count({
        where: {
          venueId: barId,
          startTime: { gte: now },
        },
      }),
      prisma.adCampaign.count({
        where: {
          barId,
          status: "ACTIVE",
          startDate: { lte: now },
          endDate: { gte: now },
        },
      }),
      prisma.adCampaign.aggregate({
        where: { barId },
        _sum: {
          impressions: true,
          clicks: true,
          conversions: true,
          spentCents: true,
          budgetCents: true,
        },
      }),
      prisma.adCampaign.findMany({
        where: {
          barId,
          createdAt: { gte: startDate },
        },
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          impressions: true,
          clicks: true,
          budgetCents: true,
          spentCents: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const hasData = Object.values(totals).some((v) => v > 0);

    // Longer ranges = longer cache (historical data doesn't change)
    const cacheMaxAge = days <= 7 ? 30 : days <= 30 ? 120 : 300;
    const cacheSharedMaxAge = days <= 7 ? 120 : days <= 30 ? 300 : 600;

    return NextResponse.json(
      {
        period: range,
        days,
        ...totals,
        activePromos,
        activeEvents,
        activeCampaigns,
        campaignImpressions: campaignAggregates._sum.impressions || 0,
        campaignClicks: campaignAggregates._sum.clicks || 0,
        campaignConversions: campaignAggregates._sum.conversions || 0,
        campaignSpentCents: campaignAggregates._sum.spentCents || 0,
        campaignBudgetCents: campaignAggregates._sum.budgetCents || 0,
        campaignsInRange,
        dailyBreakdown,
        hasData,
      },
      {
        headers: {
          "Cache-Control": `public, max-age=${cacheMaxAge}, s-maxage=${cacheSharedMaxAge}, stale-while-revalidate=600`,
        },
      },
    );
  } catch (error) {
    return handleApiError(error, "Analytics");
  }
}
