// GET /api/auth/bar/[barId]/roi
// Returns ROI dashboard data: spend vs estimated revenue, attribution
// breakdown, and trend over time.
//
// Query params:
//   days (default 30) — lookback window
//   customerSpend (default 1500) — average customer spend in cents (€15.00)

import { NextRequest, NextResponse } from "next/server";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";
import { prisma } from "@/lib/database";

// ---- Types ----

interface AttributionItem {
  id: string;
  name: string;
  type: string; // "promotion" | "event" | "campaign" | "pass"
  redemptions?: number; // for promos
  joins?: number; // for events
  scans?: number; // for passes
  spend?: number; // for campaigns (cents)
  impressions?: number;
  clicks?: number;
  estimatedVisits: number;
  estimatedRevenue: number; // cents
}

interface ROIDayPoint {
  date: string; // YYYY-MM-DD
  spend: number;
  impressions: number;
  clicks: number;
  promoRedemptions: number;
  eventJoins: number;
  passScans: number;
  estimatedVisits: number;
  estimatedRevenue: number;
}

interface ROIResponse {
  success: boolean;
  bar: {
    name: string;
  };
  period: {
    start: string;
    end: string;
    days: number;
    label: string;
  };
  summary: {
    totalSpend: number; // cents
    totalImpressions: number;
    totalClicks: number;
    promoRedemptions: number;
    eventJoins: number;
    passScans: number;
    estimatedVisits: number;
    estimatedRevenue: number; // cents
    roi: number; // multiplier (revenue ÷ spend)
    avgCustomerSpend: number; // cents — configured or default
  };
  trend: ROIDayPoint[];
  attribution: {
    promotions: AttributionItem[];
    events: AttributionItem[];
    campaigns: AttributionItem[];
    passes: AttributionItem[];
  };
  previousPeriod?: {
    totalSpend: number;
    estimatedRevenue: number;
    roi: number;
  };
}

// ---- Helpers ----

/** Format a date as YYYY-MM-DD (UTC midnight) */
function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Average */
function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

// ---- Route handler ----

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
): Promise<NextResponse> {
  try {
    // 1. Auth
    const payload = verifyAuthHeader(request);
    if (!payload || !isBarStaffToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { barId } = await params;
    if (payload.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Params
    const url = new URL(request.url);
    const days = Math.min(Math.max(parseInt(url.searchParams.get("days") || "30"), 7), 90);
    const avgCustomerSpend = parseInt(
      url.searchParams.get("customerSpend") || "1500", // €15.00 default (Helsinki bar average)
    );

    // 3. Date windows
    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    // Previous period for comparison
    const prevEndDate = new Date(startDate);
    const prevStartDate = new Date(prevEndDate);
    prevStartDate.setDate(prevStartDate.getDate() - days);

    // 4. Fetch bar name
    const bar = await prisma.bar.findUnique({
      where: { id: barId },
      select: { name: true },
    });
    if (!bar) {
      return NextResponse.json({ error: "Bar not found" }, { status: 404 });
    }

    // 5. Campaign spend + performance (current period)
    const campaigns = await prisma.adCampaign.findMany({
      where: {
        barId,
        startDate: { lt: endDate },
        endDate: { gt: startDate },
      },
      select: {
        id: true,
        title: true,
        spentCents: true,
        impressions: true,
        clicks: true,
        conversions: true,
        promotedItemId: true,
        startDate: true,
        endDate: true,
      },
    });

    // 6. BarDailyStats for both current and previous periods
    const [currentStats, prevStats] = await Promise.all([
      prisma.barDailyStats.findMany({
        where: {
          barId,
          date: { gte: startDate, lt: endDate },
        },
        orderBy: { date: "asc" },
      }),
      prisma.barDailyStats.findMany({
        where: {
          barId,
          date: { gte: prevStartDate, lt: prevEndDate },
        },
      }),
    ]);

    // 7. Promotions with redemption counts
    const promotions = await prisma.barPromotion.findMany({
      where: {
        barId,
        startDate: { lt: endDate },
        endDate: { gt: startDate },
      },
      select: {
        id: true,
        title: true,
        type: true,
        redemptions: true,
        views: true,
        clicks: true,
      },
    });

    // 8. Events with participant counts
    const events = await prisma.event.findMany({
      where: {
        venueId: barId,
        startTime: { lt: endDate },
      },
      select: {
        id: true,
        title: true,
        _count: { select: { participants: true } },
      },
    });

    // 9. VIP passes with scan counts
    const passes = await prisma.vIPPassEnhanced.findMany({
      where: {
        barId,
        validityStart: { lt: endDate },
        validityEnd: { gt: startDate },
      },
      select: {
        id: true,
        name: true,
        soldCount: true,
      },
    });

    const passIds = passes.map((p) => p.id);
    const passScans = passIds.length > 0
      ? await prisma.vIPPassScan.groupBy({
          by: ["vipPassId"],
          where: {
            barId,
            vipPassId: { in: passIds },
            scannedAt: { gte: startDate, lt: endDate },
          },
          _count: { id: true },
        })
      : [];

    // ---- Aggregation ----

    // Current period stats from daily stats
    const currentAgg = {
      promoRedemptions: currentStats.reduce((s, d) => s + d.promoRedemptions, 0),
      eventJoins: currentStats.reduce((s, d) => s + d.eventJoins, 0),
      passScans: currentStats.reduce((s, d) => s + d.passScans, 0),
      barViews: currentStats.reduce((s, d) => s + d.barViews, 0),
      promoClicks: currentStats.reduce((s, d) => s + d.promoClicks, 0),
    };

    const prevAgg = {
      promoRedemptions: prevStats.reduce((s, d) => s + d.promoRedemptions, 0),
      eventJoins: prevStats.reduce((s, d) => s + d.eventJoins, 0),
      passScans: prevStats.reduce((s, d) => s + d.passScans, 0),
    };

    // Campaign totals
    const totalSpend = campaigns.reduce((s, c) => s + c.spentCents, 0);
    const totalCampaignImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
    const totalCampaignClicks = campaigns.reduce((s, c) => s + c.clicks, 0);

    // Estimated visits: promo redemptions + event joins + pass scans
    // These are the "confirmed" touchpoints
    const estimatedVisits =
      currentAgg.promoRedemptions + currentAgg.eventJoins + currentAgg.passScans;

    const estimatedRevenue = estimatedVisits * avgCustomerSpend;
    const roi = totalSpend > 0 ? Math.round((estimatedRevenue / totalSpend) * 10) / 10 : 0;

    // Previous period
    const prevVisits =
      prevAgg.promoRedemptions + prevAgg.eventJoins + prevAgg.passScans;
    const prevRevenue = prevVisits * avgCustomerSpend;
    const prevSpend = 0; // Campaign spend for previous period — we'd need to query it separately
    // For simplicity, we only show revenue trend, not full prev-period ROI
    const prevRoi = 0;

    // ---- Trend data ----
    const trendMap = new Map<string, ROIDayPoint>();

    // Initialize all days in the period
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = dateKey(d);
      trendMap.set(key, {
        date: key,
        spend: 0,
        impressions: 0,
        clicks: 0,
        promoRedemptions: 0,
        eventJoins: 0,
        passScans: 0,
        estimatedVisits: 0,
        estimatedRevenue: 0,
      });
    }

    // Fill from daily stats
    for (const stat of currentStats) {
      const key = dateKey(stat.date);
      const existing = trendMap.get(key);
      if (!existing) continue;
      existing.promoRedemptions = stat.promoRedemptions;
      existing.eventJoins = stat.eventJoins;
      existing.passScans = stat.passScans;
      existing.impressions = stat.barViews + stat.promoViews;
      existing.clicks = stat.promoClicks;
      existing.estimatedVisits =
        stat.promoRedemptions + stat.eventJoins + stat.passScans;
      existing.estimatedRevenue = existing.estimatedVisits * avgCustomerSpend;
    }

    // Distribute campaign spend across days proportionally (simplified: even split)
    const activeCampaignDays = campaigns.map((c) => {
      const cStart = c.startDate > startDate ? c.startDate : startDate;
      const cEnd = c.endDate < endDate ? c.endDate : endDate;
      const cDays = Math.max(
        1,
        Math.ceil((cEnd.getTime() - cStart.getTime()) / (1000 * 60 * 60 * 24)),
      );
      return { ...c, activeDays: cDays };
    });

    for (const campaign of activeCampaignDays) {
      const cStart = campaign.startDate > startDate ? campaign.startDate : startDate;
      const cEnd = campaign.endDate < endDate ? campaign.endDate : endDate;
      const dailySpend = Math.round(campaign.spentCents / campaign.activeDays);
      const dailyImpressions = Math.round(campaign.impressions / campaign.activeDays);
      const dailyClicks = Math.round(campaign.clicks / campaign.activeDays);

      for (let d = new Date(cStart); d < cEnd; d.setDate(d.getDate() + 1)) {
        const key = dateKey(d);
        const existing = trendMap.get(key);
        if (!existing) continue;
        existing.spend += dailySpend;
        existing.impressions += dailyImpressions;
        existing.clicks += dailyClicks;
      }
    }

    const trend = Array.from(trendMap.values()).sort(
      (a, b) => a.date.localeCompare(b.date),
    );

    // ---- Attribution ----

    // Promotions
    const promotionAttribution: AttributionItem[] = promotions
      .filter((p) => p.redemptions > 0)
      .map((p) => ({
        id: p.id,
        name: p.title,
        type: "promotion" as const,
        redemptions: p.redemptions,
        estimatedVisits: p.redemptions,
        estimatedRevenue: p.redemptions * avgCustomerSpend,
      }))
      .sort((a, b) => (b.redemptions ?? 0) - (a.redemptions ?? 0));

    // Events
    const eventAttribution: AttributionItem[] = events
      .filter((e) => e._count.participants > 0)
      .map((e) => ({
        id: e.id,
        name: e.title,
        type: "event" as const,
        joins: e._count.participants,
        estimatedVisits: e._count.participants,
        estimatedRevenue: e._count.participants * avgCustomerSpend,
      }))
      .sort((a, b) => (b.joins ?? 0) - (a.joins ?? 0));

    // Campaigns
    const campaignAttribution: AttributionItem[] = campaigns
      .filter((c) => c.spentCents > 0)
      .map((c) => ({
        id: c.id,
        name: c.title,
        type: "campaign" as const,
        spend: c.spentCents,
        impressions: c.impressions,
        clicks: c.clicks,
        estimatedVisits: c.conversions,
        estimatedRevenue: c.conversions * avgCustomerSpend,
      }))
      .sort((a, b) => (b.spend ?? 0) - (a.spend ?? 0));

    // Passes
    const passAttribution: AttributionItem[] = passes
      .map((p) => {
        const scans = passScans.find((s) => s.vipPassId === p.id)?._count.id ?? 0;
        return {
          id: p.id,
          name: p.name,
          type: "pass" as const,
          scans,
          estimatedVisits: scans,
          estimatedRevenue: scans * avgCustomerSpend,
        };
      })
      .filter((p) => (p.scans ?? 0) > 0)
      .sort((a, b) => (b.scans ?? 0) - (a.scans ?? 0));

    // ---- Response ----
    const result: ROIResponse = {
      success: true,
      bar: { name: bar.name },
      period: {
        start: dateKey(startDate),
        end: dateKey(endDate),
        days,
        label: days === 7 ? "Last 7 days" : days === 30 ? "Last 30 days" : `Last ${days} days`,
      },
      summary: {
        totalSpend,
        totalImpressions: totalCampaignImpressions,
        totalClicks: totalCampaignClicks,
        promoRedemptions: currentAgg.promoRedemptions,
        eventJoins: currentAgg.eventJoins,
        passScans: currentAgg.passScans,
        estimatedVisits,
        estimatedRevenue,
        roi,
        avgCustomerSpend,
      },
      trend,
      attribution: {
        promotions: promotionAttribution.slice(0, 5),
        events: eventAttribution.slice(0, 5),
        campaigns: campaignAttribution.slice(0, 5),
        passes: passAttribution.slice(0, 5),
      },
      previousPeriod: {
        totalSpend: prevSpend,
        estimatedRevenue: prevRevenue,
        roi: prevRoi,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("ROI API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to calculate ROI",
      },
      { status: 500 },
    );
  }
}
