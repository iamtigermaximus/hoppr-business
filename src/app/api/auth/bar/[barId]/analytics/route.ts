import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";

/**
 * GET /api/auth/bar/[barId]/analytics?range=7d|30d|90d
 *
 * Returns aggregated analytics from BarDailyStats for the given date range,
 * plus a daily breakdown for chart rendering. All data is real — no
 * hardcoded values, no VIP/payment metrics (VIP passes are hidden).
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

    // ── Query BarDailyStats ──────────────────────────────────────
    const dailyStats = await prisma.barDailyStats.findMany({
      where: {
        barId,
        date: { gte: startDate },
      },
      orderBy: { date: "asc" },
    });

    // ── Aggregate totals ─────────────────────────────────────────
    const totals = dailyStats.reduce(
      (acc, d) => ({
        profileViews: acc.profileViews + d.pageViews + d.barViews,
        directionClicks: acc.directionClicks + d.barDirections,
        websiteClicks: acc.websiteClicks + d.barWebsites,
        callClicks: acc.callClicks + d.barCalls,
        shareCount: acc.shareCount + d.barShares,
        promoViews: acc.promoViews + d.promoViews,
        promoClicks: acc.promoClicks + d.promoClicks,
        promoRedemptions: acc.promoRedemptions + d.promoRedemptions,
        eventViews: acc.eventViews + d.eventViews,
        eventJoins: acc.eventJoins + d.eventJoins,
        uniqueVisitors: acc.uniqueVisitors + d.uniqueVisitors,
      }),
      {
        profileViews: 0,
        directionClicks: 0,
        websiteClicks: 0,
        callClicks: 0,
        shareCount: 0,
        promoViews: 0,
        promoClicks: 0,
        promoRedemptions: 0,
        eventViews: 0,
        eventJoins: 0,
        uniqueVisitors: 0,
      },
    );

    // ── Daily breakdown (for charts) ─────────────────────────────
    const dailyBreakdown = dailyStats.map((d) => ({
      date: d.date.toISOString().slice(0, 10),
      profileViews: d.pageViews + d.barViews,
      uniqueVisitors: d.uniqueVisitors,
      promoViews: d.promoViews,
      promoClicks: d.promoClicks,
      promoRedemptions: d.promoRedemptions,
      eventViews: d.eventViews,
      eventJoins: d.eventJoins,
      directionClicks: d.barDirections,
      shareCount: d.barShares,
    }));

    // ── Active counts ────────────────────────────────────────────
    const now = new Date();
    const [activePromos, activeEvents] = await Promise.all([
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
    ]);

    const hasData = Object.values(totals).some((v) => v > 0);

    return NextResponse.json({
      period: range,
      days,
      ...totals,
      activePromos,
      activeEvents,
      dailyBreakdown,
      hasData,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
