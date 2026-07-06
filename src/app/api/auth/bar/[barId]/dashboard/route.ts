// Route: GET /api/auth/bar/[barId]/dashboard
// Description: Consolidated dashboard data endpoint.
//
// Replaces 7 separate API calls (stats, activity, profile, events, promos,
// approvals, insights) with a single request. Uses Promise.all for parallel
// database queries. Cached for 30 seconds to absorb dashboard refresh spam.
//
// Migration: The BarDashboard component currently makes 7 fetch() calls on
// mount. Switch to this single endpoint to eliminate the waterfall of requests.
// The individual endpoints remain available for fine-grained use cases
// (real-time polling, specific widget refreshes).

import { NextRequest, NextResponse } from "next/server";
import { AnalyticsEventType } from "@prisma/client";
import { prisma } from "@/lib/database";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";

// ---- Activity templates (shared with activity/route.ts) ----

const ACTIVITY_TEMPLATES: Record<string, { icon: string; singular: string; plural: string }> = {
  BAR_VIEW:       { icon: "👁️", singular: "Someone viewed your bar", plural: "{n} people viewed your bar" },
  PAGE_VIEW:      { icon: "👁️", singular: "Someone viewed your profile", plural: "{n} people viewed your profile" },
  BAR_DIRECTION:  { icon: "🧭", singular: "Someone got directions to your bar", plural: "{n} people got directions" },
  BAR_CALL:       { icon: "📞", singular: "Someone called your bar", plural: "{n} people called your bar" },
  BAR_WEBSITE:    { icon: "🌐", singular: "Someone visited your website", plural: "{n} people visited your website" },
  BAR_SHARE:      { icon: "📤", singular: "Someone shared your bar", plural: "{n} people shared your bar" },
  PROMO_VIEW:     { icon: "🎫", singular: "Someone viewed your promotion", plural: "{n} people viewed your promotion" },
  PROMO_CLICK:    { icon: "👆", singular: "Someone clicked your promotion", plural: "{n} people clicked your promotion" },
  PROMO_REDEMPTION: { icon: "✅", singular: "Someone claimed your promotion", plural: "{n} people claimed your promotion" },
  EVENT_VIEW:     { icon: "📅", singular: "Someone viewed your event", plural: "{n} people viewed your event" },
  EVENT_JOIN:     { icon: "🎉", singular: "Someone joined your event", plural: "{n} people joined your event" },
  FOLLOW:         { icon: "❤️", singular: "Someone followed your bar", plural: "{n} people followed your bar" },
  SEARCH:         { icon: "🔍", singular: "Your bar appeared in search", plural: "Your bar appeared in {n} searches" },
};

const EXCLUDED_ACTIVITY_TYPES: AnalyticsEventType[] = [
  "PASS_VIEW", "PASS_PURCHASE", "PASS_SCAN", "FEED_SCROLL", "UNFOLLOW",
];

// ---- GET ----

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

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Fetch everything in parallel
    const [
      rawEvents,
      activePromos,
      activeCampaigns,
      campaignTotals,
      totalFollowers,
      profile,
      upcomingEvents,
      pendingApprovals,
      recentInsights,
    ] = await Promise.all([
      // Stats: raw analytics events for last 7 days
      prisma.analyticsEvent.findMany({
        where: { barId, createdAt: { gte: sevenDaysAgo } },
        select: { type: true, userId: true },
      }),

      // Active promotions count
      prisma.barPromotion.count({
        where: { barId, isActive: true, isApproved: true, startDate: { lte: now }, endDate: { gte: now } },
      }),

      // Active campaigns count
      prisma.adCampaign.count({
        where: { barId, status: "ACTIVE", startDate: { lte: now }, endDate: { gte: now } },
      }),

      // Campaign aggregate metrics
      prisma.adCampaign.aggregate({
        where: { barId },
        _sum: { impressions: true, clicks: true, conversions: true, spentCents: true, budgetCents: true },
      }),

      // Follower count
      prisma.barFollow.count({ where: { barId } }),

      // Profile (minimal fields for dashboard header)
      prisma.bar.findUnique({
        where: { id: barId },
        select: {
          id: true, name: true, type: true, cityName: true, district: true,
          coverImage: true, logoUrl: true, status: true, isVerified: true,
          isActive: true, vipEnabled: true, profileViews: true,
        },
      }),

      // Upcoming events (next 5)
      prisma.event.findMany({
        where: { venueId: barId, startTime: { gte: now } },
        orderBy: { startTime: "asc" },
        take: 5,
        select: {
          id: true, title: true, startTime: true, endTime: true,
          imageUrl: true, _count: { select: { participants: true } },
        },
      }),

      // Pending approval items (promos + events)
      prisma.barPromotion.findMany({
        where: { barId, isApproved: false, isActive: true },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, type: true, createdAt: true, isApproved: true },
      }),

      // Recent insights (last 5, not dismissed)
      prisma.barInsight.findMany({
        where: { barId, dismissed: false },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, type: true, title: true, body: true, actionLabel: true, actionRoute: true, createdAt: true },
      }),
    ]);

    // ---- Compute stats from raw events ----
    const typeCounts: Record<string, number> = {};
    const uniqueUsers = new Set<string>();

    for (const ev of rawEvents) {
      typeCounts[ev.type] = (typeCounts[ev.type] || 0) + 1;
      if (ev.userId) uniqueUsers.add(ev.userId);
    }

    const stats = {
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
      newFollowers: typeCounts["FOLLOW"] || 0,
      lostFollowers: typeCounts["UNFOLLOW"] || 0,
      netFollowers: (typeCounts["FOLLOW"] || 0) - (typeCounts["UNFOLLOW"] || 0),
      activePromos,
      activeCampaigns,
      campaignImpressions: campaignTotals._sum.impressions || 0,
      campaignClicks: campaignTotals._sum.clicks || 0,
      campaignConversions: campaignTotals._sum.conversions || 0,
      campaignSpentCents: campaignTotals._sum.spentCents || 0,
      campaignBudgetCents: campaignTotals._sum.budgetCents || 0,
      totalEvents: Object.values(typeCounts).reduce((sum, v) => sum + v, 0),
      hasData: rawEvents.length > 0,
      totalFollowers,
    };

    // ---- Compute recent activity (same logic as activity/route.ts) ----
    const activityRaw = await prisma.analyticsEvent.findMany({
      where: { barId, type: { notIn: EXCLUDED_ACTIVITY_TYPES } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, type: true, data: true, createdAt: true, userId: true },
    });

    const activities: Array<{
      id: string; icon: string; text: string; count: number;
      time: string; href?: string;
    }> = [];

    if (activityRaw.length > 0) {
      const WINDOW_MS = 10 * 60 * 1000;
      let i = 0;
      while (i < activityRaw.length) {
        const current = activityRaw[i];
        const template = ACTIVITY_TEMPLATES[current.type];
        if (!template) { i++; continue; }

        let count = 1;
        let lastInWindow = current;
        let j = i + 1;
        while (j < activityRaw.length) {
          const next = activityRaw[j];
          if (next.type !== current.type) break;
          const timeDiff = new Date(current.createdAt).getTime() - new Date(next.createdAt).getTime();
          if (timeDiff > WINDOW_MS) break;
          count++;
          lastInWindow = next;
          j++;
        }

        const metadata = (current.data as Record<string, unknown>) || {};
        const promoName = typeof metadata.promoName === "string" ? metadata.promoName : null;
        const eventTitle = typeof metadata.eventTitle === "string" ? metadata.eventTitle : null;

        let text: string;
        if (count === 1) text = template.singular;
        else text = template.plural.replace("{n}", String(count));
        if (promoName) text += `: "${promoName}"`;
        if (eventTitle) text += `: "${eventTitle}"`;

        let href: string | undefined;
        if (metadata.promoId && typeof metadata.promoId === "string") href = `/bar/${barId}/promotions/${metadata.promoId}`;
        else if (metadata.eventId && typeof metadata.eventId === "string") href = `/bar/${barId}/events/${metadata.eventId}`;

        activities.push({ id: current.id, icon: template.icon, text, count, time: lastInWindow.createdAt.toISOString(), href });
        i = j;
      }
    }

    return NextResponse.json(
      {
        cachedAt: now.toISOString(),
        profile,
        stats,
        activities: activities.slice(0, 25),
        hasActivity: activities.length > 0,
        upcomingEvents: upcomingEvents.map((e) => ({
          id: e.id,
          title: e.title,
          startTime: e.startTime,
          endTime: e.endTime,
          coverImage: e.imageUrl,
          participantCount: e._count.participants,
        })),
        pendingApprovals: pendingApprovals.map((p) => ({
          id: p.id,
          title: p.title,
          type: p.type,
          createdAt: p.createdAt,
          isApproved: p.isApproved,
        })),
        insights: recentInsights,
        hasPending: pendingApprovals.length > 0,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=30, s-maxage=120, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    return handleApiError(error, "Dashboard consolidated");
  }
}
