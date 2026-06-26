import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";

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

    // Last 7 days — aggregate raw AnalyticsEvent rows directly (real-time, no cron needed)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const rawEvents = await prisma.analyticsEvent.findMany({
      where: {
        barId,
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        type: true,
        userId: true,
      },
    });

    // Count by type + distinct visitors
    const typeCounts: Record<string, number> = {};
    const uniqueUsers = new Set<string>();

    for (const ev of rawEvents) {
      typeCounts[ev.type] = (typeCounts[ev.type] || 0) + 1;
      if (ev.userId) uniqueUsers.add(ev.userId);
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

    // Active promo count (real-time)
    const now = new Date();
    const activePromos = await prisma.barPromotion.count({
      where: {
        barId,
        isActive: true,
        isApproved: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    const totalEvents = Object.values(totals).reduce((sum, v) => sum + v, 0);
    const hasData = totalEvents > 0;

    // Follower metrics — live count + weekly net change from raw events
    const [totalFollowers, weeklyFollowEvents] = await Promise.all([
      prisma.barFollow.count({ where: { barId } }),
      prisma.analyticsEvent.count({
        where: {
          barId,
          createdAt: { gte: sevenDaysAgo },
          type: { in: ["FOLLOW", "UNFOLLOW"] },
        },
      }),
    ]);

    const newFollowers = typeCounts["FOLLOW"] || 0;
    const lostFollowers = typeCounts["UNFOLLOW"] || 0;
    const netFollowers = newFollowers - lostFollowers;

    return NextResponse.json({
      ...totals,
      activePromos,
      hasData,
      totalFollowers,
      newFollowers,
      lostFollowers,
      netFollowers,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
