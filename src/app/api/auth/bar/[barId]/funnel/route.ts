// src/app/api/auth/bar/[barId]/funnel/route.ts
// Bar dashboard funnel/activation view.
// Shows promo funnel (views → clicks → redemptions), pass funnel,
// and time-to-first-activation for consumers reaching this bar.
// Data source: BarDailyStats (pre-aggregated by Cron) + AnalyticsEvent (raw).

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";

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
    const days = Math.min(90, Math.max(7, parseInt(searchParams.get("days") || "30")));

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // 1. Aggregated promo funnel from BarDailyStats
    const dailyStats = await prisma.barDailyStats.findMany({
      where: { barId, date: { gte: startDate } },
      orderBy: { date: "desc" },
    });

    const promoFunnel = dailyStats.reduce(
      (acc, d) => ({
        views: acc.views + d.promoViews,
        clicks: acc.clicks + d.promoClicks,
        redemptions: acc.redemptions + d.promoRedemptions,
      }),
      { views: 0, clicks: 0, redemptions: 0 },
    );

    const passFunnel = dailyStats.reduce(
      (acc, d) => ({
        views: acc.views + d.passViews,
        purchases: acc.purchases + d.passPurchases,
        scans: acc.scans + d.passScans,
      }),
      { views: 0, purchases: 0, scans: 0 },
    );

    // 2. Time-to-first-activation for consumers who activated via this bar's content
    // Look at raw AnalyticsEvent for pass scans and promo redemptions at this bar
    const activationEvents = await prisma.analyticsEvent.findMany({
      where: {
        barId,
        type: { in: ["PASS_SCAN", "PROMO_REDEMPTION"] },
        createdAt: { gte: startDate },
        userId: { not: null },
        data: { path: ["activatesUser"], equals: true },
      },
      select: {
        userId: true,
        type: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // For each activating user, find their signup date to compute time-to-activation
    const userIds = [...new Set(activationEvents.map((e) => e.userId!))];

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, createdAt: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u.createdAt]));

    const timeToActivation: number[] = [];
    for (const event of activationEvents) {
      const signupDate = userMap.get(event.userId!);
      if (signupDate) {
        const hours = (event.createdAt.getTime() - signupDate.getTime()) / (1000 * 60 * 60);
        timeToActivation.push(hours);
      }
    }

    const avgHoursToActivate =
      timeToActivation.length > 0
        ? timeToActivation.reduce((a, b) => a + b, 0) / timeToActivation.length
        : null;

    // Bucket time-to-activation for histogram
    const buckets = { under1d: 0, under3d: 0, under7d: 0, under14d: 0, over14d: 0 };
    for (const hours of timeToActivation) {
      if (hours <= 24) buckets.under1d++;
      else if (hours <= 72) buckets.under3d++;
      else if (hours <= 168) buckets.under7d++;
      else if (hours <= 336) buckets.under14d++;
      else buckets.over14d++;
    }

    // 3. Daily trend (last 30 days for the chart)
    const dailyTrend = dailyStats.slice(0, 30).reverse().map((d) => ({
      date: d.date.toISOString().split("T")[0],
      promoViews: d.promoViews,
      promoClicks: d.promoClicks,
      promoRedemptions: d.promoRedemptions,
      passPurchases: d.passPurchases,
      passScans: d.passScans,
    }));

    // 4. Conversion rates
    const promoClickRate = promoFunnel.views > 0
      ? Math.round((promoFunnel.clicks / promoFunnel.views) * 1000) / 10
      : 0;
    const promoRedemptionRate = promoFunnel.clicks > 0
      ? Math.round((promoFunnel.redemptions / promoFunnel.clicks) * 1000) / 10
      : 0;

    return NextResponse.json({
      success: true,
      funnel: {
        periodDays: days,
        promos: {
          ...promoFunnel,
          clickRate: promoClickRate,
          redemptionRate: promoRedemptionRate,
        },
        passes: passFunnel,
        activation: {
          totalActivated: timeToActivation.length,
          avgHoursToActivate: avgHoursToActivate
            ? Math.round(avgHoursToActivate * 10) / 10
            : null,
          distribution: buckets,
        },
        dailyTrend,
        cachedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error, "Funnel fetch error");
  }
}
