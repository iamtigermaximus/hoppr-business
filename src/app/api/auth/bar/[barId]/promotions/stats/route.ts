// src/app/api/auth/bar/[barId]/promotions/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";
import type { AnalyticsEventType } from "@prisma/client";

/**
 * GET /api/auth/bar/[barId]/promotions/stats?range=7d|30d|90d
 *
 * Returns per-promotion performance by aggregating AnalyticsEvent rows
 * (PROMO_VIEW, PROMO_CLICK, PROMO_REDEMPTION) instead of the denormalised
 * BarPromotion.cardViews/redemptions counters, keeping numbers consistent
 * with the Content Performance tab.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
) {
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

    // ── Bar profile stats (still from Bar model — simple counters) ──
    const bar = await prisma.bar.findUnique({
      where: { id: barId },
      select: {
        profileViews: true,
        directionClicks: true,
        callClicks: true,
        websiteClicks: true,
        shareCount: true,
      },
    });

    // ── All promotions for this bar ────────────────────────────────
    const promotions = await prisma.barPromotion.findMany({
      where: { barId },
      include: { usageHistory: true },
      orderBy: { createdAt: "desc" },
    });

    const promoIds = new Set(promotions.map((p) => p.id));

    // ── Aggregate analytics events for this bar in the date range ───
    const eventTypes: AnalyticsEventType[] = [
      "PROMO_VIEW", "PROMO_CLICK", "PROMO_REDEMPTION",
    ];

    const rawEvents = await prisma.analyticsEvent.findMany({
      where: {
        barId,
        type: { in: eventTypes },
        createdAt: { gte: startDate },
      },
      select: { type: true, data: true, userId: true },
    });

    interface PromoAggregate {
      views: number;
      clicks: number;
      redemptions: number;
      uniqueUsers: Set<string>;
    }

    const aggregateMap = new Map<string, PromoAggregate>();

    for (const ev of rawEvents) {
      const data = ev.data as Record<string, unknown> | null;
      if (!data) continue;

      const promoId = (data.promoId || data.promotionId || data.contentId) as string | undefined;
      if (!promoId || !promoIds.has(promoId)) continue;

      let agg = aggregateMap.get(promoId);
      if (!agg) {
        agg = { views: 0, clicks: 0, redemptions: 0, uniqueUsers: new Set() };
        aggregateMap.set(promoId, agg);
      }

      if (ev.userId) agg.uniqueUsers.add(ev.userId);

      switch (ev.type) {
        case "PROMO_VIEW": agg.views++; break;
        case "PROMO_CLICK": agg.clicks++; break;
        case "PROMO_REDEMPTION": agg.redemptions++; break;
      }
    }

    // ── Build per-promotion response ────────────────────────────────
    const promotionsWithStats = promotions.map((promo) => {
      const agg = aggregateMap.get(promo.id);
      const views = agg?.views ?? 0;
      const redemptionsAgg = agg?.redemptions ?? 0;
      const uniqueEventUsers = agg?.uniqueUsers.size ?? 0;
      const clicks = agg?.clicks ?? 0;

      // Top users still from usageHistory (per-user redemption counts
      // aren't tracked per-event, only in the usageHistory table).
      const uniqueUsers = promo.usageHistory.length;
      const totalUsageCount = promo.usageHistory.reduce(
        (sum, u) => sum + u.usageCount, 0,
      );
      const averageUsesPerUser =
        uniqueUsers > 0 ? totalUsageCount / uniqueUsers : 0;
      const conversionRate =
        views > 0 ? Math.round((redemptionsAgg / views) * 1000) / 10 : 0;

      const topUsers = promo.usageHistory
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 5)
        .map((u) => ({
          userId: u.userId,
          usageCount: u.usageCount,
          firstUsedAt: u.firstUsedAt,
          lastUsedAt: u.lastUsedAt,
        }));

      return {
        id: promo.id,
        title: promo.title,
        type: promo.type,
        discount: promo.discount,
        isActive: promo.isActive,
        isApproved: promo.isApproved,
        startDate: promo.startDate,
        endDate: promo.endDate,
        totalCardViews: views,
        totalClicks: clicks,
        totalRedemptions: redemptionsAgg,
        uniqueUsers,
        uniqueEventUsers,
        totalUsageCount,
        averageUsesPerUser,
        conversionRate,
        topUsers,
      };
    });

    // Sort by conversion rate descending for display
    promotionsWithStats.sort((a, b) => b.conversionRate - a.conversionRate);

    const totalScans = await prisma.vIPPassScan.count({ where: { barId } });

    return NextResponse.json(
      {
        cachedAt: new Date().toISOString(),
        success: true,
        period: range,
        days,
        barStats: {
          profileViews: bar?.profileViews || 0,
          directionClicks: bar?.directionClicks || 0,
          callClicks: bar?.callClicks || 0,
          websiteClicks: bar?.websiteClicks || 0,
          shareCount: bar?.shareCount || 0,
        },
        promotions: promotionsWithStats,
        totalScans,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=30, s-maxage=120, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    return handleApiError(error, "Promotion stats");
  }
}
