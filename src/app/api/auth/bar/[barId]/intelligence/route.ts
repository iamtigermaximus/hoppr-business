// src/app/api/auth/bar/[barId]/intelligence/route.ts
// Rewritten — uses raw AnalyticsEvent rows + bar profile, no VIP/payment data.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";

// ── Helpers ────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Suggestion {
  id: string;
  icon: string;
  title: string;
  description: string;
  action: string;
  type: "setup" | "optimization" | "maintenance" | "growth";
}

interface Alert {
  id: string;
  type: "info" | "warning" | "success" | "error" | "setup";
  title: string;
  description: string;
  icon: string;
}

interface Trend {
  label: string;
  value: string;
  positive?: boolean;
  isPlaceholder?: boolean;
}

// ── GET ────────────────────────────────────────────────────────

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

    const now = new Date();
    const sevenDaysAgo = daysAgo(7);
    const thirtyDaysAgo = daysAgo(30);

    // ── Bar profile (completeness check) ────────────────────
    const bar = await prisma.bar.findUnique({
      where: { id: barId },
      select: {
        coverImage: true,
        logoUrl: true,
        operatingHours: true,
        coverCharge: true,
        musicTags: true,
        imageUrls: true,
        _count: {
          select: {
            promotions: { where: { isActive: true } },
            events: { where: { startTime: { gte: now } } },
          },
        },
      },
    });

    // ── Campaign data ─────────────────────────────────────────
    const [activeCampaigns, campaignTotals, expiringCampaigns] = await Promise.all([
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
          status: "ACTIVE",
          endDate: { gte: now, lte: new Date(Date.now() + 3 * 86400000) },
        },
        select: { title: true, endDate: true, spentCents: true, budgetCents: true },
      }),
    ]);

    const profileChecks = {
      hasPhoto: !!(bar?.coverImage || bar?.logoUrl),
      hasHours: !!(bar?.operatingHours && Object.keys(bar.operatingHours as object).length > 0),
      hasBusinessInfo: !!(bar?.coverCharge != null || (bar?.musicTags?.length ?? 0) > 0),
      hasGallery: (bar?.imageUrls?.length ?? 0) > 0,
      hasPromo: (bar?._count?.promotions ?? 0) > 0,
      hasEvent: (bar?._count?.events ?? 0) > 0,
      hasCampaign: activeCampaigns > 0,
    };

    const completedCount = Object.values(profileChecks).filter(Boolean).length;
    const profileScore = Math.round((completedCount / 7) * 100);

    // ── Raw events for last 7 and 30 days (same source as dashboard/analytics) ─
    const [recentEvents, olderEvents] = await Promise.all([
      prisma.analyticsEvent.findMany({
        where: { barId, createdAt: { gte: sevenDaysAgo } },
        select: { type: true, userId: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.analyticsEvent.findMany({
        where: { barId, createdAt: { gte: thirtyDaysAgo, lt: sevenDaysAgo } },
        select: { type: true, userId: true, createdAt: true },
      }),
    ]);

    // ── Aggregate by type + unique visitors ──────────────────
    function aggregateEvents(events: typeof recentEvents) {
      const typeCounts: Record<string, number> = {};
      const uniqueUsers = new Set<string>();
      for (const ev of events) {
        typeCounts[ev.type] = (typeCounts[ev.type] || 0) + 1;
        if (ev.userId) uniqueUsers.add(ev.userId);
      }
      return {
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
    }

    const recent = aggregateEvents(recentEvents);
    const older = aggregateEvents(olderEvents);

    const hasTraffic = recent.profileViews > 0;
    const hasAnyData = hasTraffic || profileScore > 0;

    // ── Trends (week-over-week) ─────────────────────────────
    function trend(current: number, previous: number): number | null {
      if (previous === 0 && current === 0) return null;
      if (previous === 0) return current > 0 ? 100 : null;
      return Math.round(((current - previous) / previous) * 100);
    }

    const viewsTrend = trend(recent.profileViews, older.profileViews);
    const visitorsTrend = trend(recent.uniqueVisitors, older.uniqueVisitors);
    const directionsTrend = trend(recent.directionClicks, older.directionClicks);
    const promosTrend = trend(recent.promoViews, older.promoViews);
    const eventsTrend = trend(recent.eventJoins, older.eventJoins);
    const promoConversion = recent.promoViews > 0
      ? Math.round((recent.promoClicks / recent.promoViews) * 100)
      : null;
    const eventConversion = recent.eventViews > 0
      ? Math.round((recent.eventJoins / recent.eventViews) * 100)
      : null;

    // ── Campaign metrics ─────────────────────────────────────
    const campaignImpressions = campaignTotals._sum.impressions || 0;
    const campaignClicks = campaignTotals._sum.clicks || 0;
    const campaignConversions = campaignTotals._sum.conversions || 0;
    const campaignSpentCents = campaignTotals._sum.spentCents || 0;
    const campaignBudgetCents = campaignTotals._sum.budgetCents || 0;
    const campaignCTR = campaignImpressions > 0
      ? Math.round((campaignClicks / campaignImpressions) * 100)
      : null;

    // ── Best day by traffic ─────────────────────────────────
    const dayTotals = new Map<number, number>();
    for (const ev of recentEvents) {
      const dow = ev.createdAt.getDay();
      dayTotals.set(dow, (dayTotals.get(dow) || 0) + 1);
    }
    let bestDay = "Not enough data";
    let bestDayCount = 0;
    for (const [dow, count] of dayTotals) {
      if (count > bestDayCount) { bestDayCount = count; bestDay = DAY_NAMES[dow]; }
    }

    // ── Top promotion by redemptions ────────────────────────
    const topPromo = await prisma.barPromotion.findFirst({
      where: { barId, isActive: true },
      orderBy: { redemptions: "desc" },
      select: { title: true, redemptions: true, endDate: true },
    });

    // ── Expiring promos ─────────────────────────────────────
    const threeDaysFromNow = new Date(Date.now() + 3 * 86400000);
    const expiringPromos = await prisma.barPromotion.findMany({
      where: {
        barId,
        isActive: true,
        endDate: { gte: now, lte: threeDaysFromNow },
      },
      select: { title: true, endDate: true },
    });

    // ── Compute overall status ──────────────────────────────
    let overall: "excellent" | "good" | "warning" | "critical" | "no-data";
    if (!hasAnyData) {
      overall = "no-data";
    } else {
      const score =
        (profileScore >= 80 ? 2 : profileScore >= 40 ? 1 : 0) +
        (hasTraffic ? 1 : 0) +
        (profileChecks.hasPromo ? 1 : 0) +
        (profileChecks.hasEvent ? 1 : 0) +
        (activeCampaigns > 0 ? 1 : 0);
      if (score >= 6) overall = "excellent";
      else if (score >= 4) overall = "good";
      else if (score >= 2) overall = "warning";
      else overall = "critical";
    }

    // ── Build suggestions ───────────────────────────────────
    const suggestions: Suggestion[] = [];

    // Profile completeness suggestions
    if (!profileChecks.hasPhoto) {
      suggestions.push({
        id: "p-photo", icon: "📷", title: "Add a profile photo",
        description: "Bars with photos get 3x more profile views. Add a cover image or logo.",
        action: `/bar/${barId}/profile`, type: "setup",
      });
    }
    if (!profileChecks.hasHours) {
      suggestions.push({
        id: "p-hours", icon: "🕐", title: "Set your operating hours",
        description: "Customers check opening hours before deciding where to go.",
        action: `/bar/${barId}/profile`, type: "setup",
      });
    }
    if (!profileChecks.hasBusinessInfo) {
      suggestions.push({
        id: "p-info", icon: "🏷️", title: "Add cover charge & music tags",
        description: "Music genre and cover charge help customers find your vibe.",
        action: `/bar/${barId}/profile`, type: "setup",
      });
    }

    // Traffic-based suggestions
    if (hasTraffic) {
      if (bestDayCount > 0 && recent.uniqueVisitors > 0) {
        suggestions.push({
          id: "t-bestday", icon: "📈", title: `${bestDay} is your busiest day`,
          description: `Schedule events or launch promos on ${bestDay}s to maximize reach.`,
          action: `/bar/${barId}/events`, type: "optimization",
        });
      }
      if (promoConversion !== null && promoConversion < 20) {
        suggestions.push({
          id: "t-promo", icon: "🎯", title: "Improve promo conversion",
          description: `Only ${promoConversion}% of promo views lead to clicks. Try clearer titles or limited-time offers.`,
          action: `/bar/${barId}/promotions`, type: "optimization",
        });
      }
      if (recent.shareCount === 0 && recent.profileViews > 10) {
        suggestions.push({
          id: "t-share", icon: "📤", title: "Encourage sharing",
          description: `${recent.profileViews} people viewed your profile but none shared. Add a promo to give them something worth sharing.`,
          action: `/bar/${barId}/promotions`, type: "growth",
        });
      }
      if (activeCampaigns > 0 && campaignCTR !== null && campaignCTR < 2) {
        suggestions.push({
          id: "t-campaign-ctr", icon: "📢", title: "Improve ad campaign CTR",
          description: `Your campaign CTR is ${campaignCTR}% — below the 2-3% benchmark. Try updating your campaign image or targeting.`,
          action: `/bar/${barId}/campaigns`, type: "optimization",
        });
      }
    }

    // Promo/event gap suggestions
    if (!profileChecks.hasPromo) {
      suggestions.push({
        id: "g-promo", icon: "🎫", title: "Create your first promotion",
        description: "Promotions are the #1 way customers discover new bars on Hoppr.",
        action: `/bar/${barId}/promotions`, type: "setup",
      });
    }
    if (!profileChecks.hasEvent) {
      suggestions.push({
        id: "g-event", icon: "📅", title: "Schedule an event",
        description: "Events drive 2x more profile views and direction requests.",
        action: `/bar/${barId}/events`, type: "setup",
      });
    }
    if (!profileChecks.hasCampaign && (profileChecks.hasPromo || profileChecks.hasEvent)) {
      suggestions.push({
        id: "g-campaign", icon: "📢", title: "Launch your first ad campaign",
        description: "Boost your best promo or event with a targeted ad campaign to reach more customers.",
        action: `/bar/${barId}/create?type=campaign`, type: "growth",
      });
    }

    // Ensure we have at least 3 suggestions
    if (suggestions.length < 3 && hasTraffic) {
      suggestions.push({
        id: "gen-analytics", icon: "📊", title: "Review your analytics",
        description: "Check detailed charts to spot trends in your traffic and engagement.",
        action: `/bar/${barId}/analytics`, type: "maintenance",
      });
    }

    // ── Build alerts ────────────────────────────────────────
    const alerts: Alert[] = [];

    if (!hasAnyData) {
      alerts.push(
        { id: "a-welcome", type: "setup", title: "Welcome to Bar Intelligence!",
          description: "Complete your profile and create a promotion to start seeing insights.", icon: "👋" },
      );
    } else {
      // Profile gaps
      if (profileScore < 50) {
        alerts.push({
          id: "a-profile", type: "warning", title: "Profile incomplete",
          description: `Your profile is ${profileScore}% complete. Fill in missing info to attract more customers.`,
          icon: "⚠️",
        });
      }

      // Expiring promos
      for (const ep of expiringPromos.slice(0, 2)) {
        alerts.push({
          id: `exp-${ep.title}`, type: "info",
          title: "Promotion expiring soon",
          description: `"${ep.title}" ends soon. Extend or create a follow-up to keep momentum.`,
          icon: "⏰",
        });
      }

      // Expiring campaigns
      for (const ec of expiringCampaigns.slice(0, 2)) {
        const spentPercent = ec.budgetCents > 0 ? Math.round((ec.spentCents / ec.budgetCents) * 100) : 0;
        alerts.push({
          id: `exp-campaign-${ec.title}`, type: "info",
          title: "Campaign ending soon",
          description: `"${ec.title}" ends soon. ${spentPercent}% of budget spent — review performance before it expires.`,
          icon: "⏰",
        });
      }

      // Campaign budget nearly spent
      for (const ec of expiringCampaigns) {
        const spentPercent = ec.budgetCents > 0 ? Math.round((ec.spentCents / ec.budgetCents) * 100) : 0;
        if (spentPercent >= 90) {
          alerts.push({
            id: `budget-${ec.title}`, type: "warning",
            title: "Campaign budget nearly spent",
            description: `"${ec.title}" has used ${spentPercent}% of its budget. Consider topping up if performance is strong.`,
            icon: "💰",
          });
          break;
        }
      }

      // No upcoming events
      if (!profileChecks.hasEvent && hasTraffic) {
        alerts.push({
          id: "a-noevents", type: "warning", title: "No upcoming events",
          description: "You have traffic but no events scheduled. Events convert visitors into customers.",
          icon: "📅",
        });
      }

      // Positive: good conversion
      if (promoConversion !== null && promoConversion >= 50) {
        alerts.push({
          id: "a-goodpromo", type: "success", title: "Strong promo conversion",
          description: `${promoConversion}% of promo views convert to clicks — above average!`,
          icon: "🎯",
        });
      }

      if (eventConversion !== null && eventConversion >= 30) {
        alerts.push({
          id: "a-goodevents", type: "success", title: "High event join rate",
          description: `${eventConversion}% of event viewers are joining. Your events resonate.`,
          icon: "🎉",
        });
      }

      if (campaignCTR !== null && campaignCTR >= 3) {
        alerts.push({
          id: "a-goodcampaigns", type: "success", title: "Strong campaign CTR",
          description: `Your ad campaigns have a ${campaignCTR}% click-through rate — above the industry average!`,
          icon: "📢",
        });
      }

      // Fallback
      if (alerts.length < 1) {
        alerts.push({
          id: "a-active", type: "success", title: "Systems active",
          description: "Your bar data is flowing. Check back regularly for new insights.", icon: "✅",
        });
      }
    }

    // ── Build trends ─────────────────────────────────────────
    const trends: Trend[] = [];

    if (hasTraffic) {
      if (viewsTrend !== null) {
        const prefix = viewsTrend >= 0 ? "+" : "";
        trends.push({ label: "Profile Views (7d)", value: `${prefix}${viewsTrend}%`, positive: viewsTrend >= 0 });
      }
      if (visitorsTrend !== null) {
        const prefix = visitorsTrend >= 0 ? "+" : "";
        trends.push({ label: "Unique Visitors (7d)", value: `${prefix}${visitorsTrend}%`, positive: visitorsTrend >= 0 });
      }
      if (directionsTrend !== null) {
        const prefix = directionsTrend >= 0 ? "+" : "";
        trends.push({ label: "Direction Requests (7d)", value: `${prefix}${directionsTrend}%`, positive: directionsTrend >= 0 });
      }
      if (promoConversion !== null) {
        trends.push({ label: "Promo Click Rate", value: `${promoConversion}%`, positive: promoConversion >= 30 });
      }
      if (eventConversion !== null) {
        trends.push({ label: "Event Join Rate", value: `${eventConversion}%`, positive: eventConversion >= 25 });
      }
      if (campaignImpressions > 0) {
        trends.push({ label: "Ad Impressions (all-time)", value: campaignImpressions.toLocaleString(), positive: campaignImpressions >= 100 });
      }
      if (campaignCTR !== null) {
        trends.push({ label: "Campaign CTR", value: `${campaignCTR}%`, positive: campaignCTR >= 3 });
      }
    } else {
      trends.push(
        { label: "Profile Views", value: "No data yet", isPlaceholder: true },
        { label: "Direction Requests", value: "Awaiting traffic", isPlaceholder: true },
        { label: "Promo Performance", value: "Create a promo first", isPlaceholder: true },
        { label: "Event Engagement", value: "Schedule an event", isPlaceholder: true },
        { label: "Profile Completeness", value: `${profileScore}%`, positive: profileScore >= 50, isPlaceholder: false },
      );
    }

    // ── Quick stats ──────────────────────────────────────────
    const quickStats = {
      bestDay: hasTraffic ? bestDay : "Not enough data",
      topPromotion: topPromo?.title || (profileChecks.hasPromo ? "No redemptions yet" : "Create a promotion"),
      profileScore: `${profileScore}% (${completedCount}/7)`,
    };

    return NextResponse.json({
      success: true,
      hasData: hasAnyData,
      status: {
        overall,
        profileViews: hasTraffic ? recent.profileViews : null,
        uniqueVisitors: hasTraffic ? recent.uniqueVisitors : null,
        viewsTrend,
        visitorsTrend,
        promoConversion,
        eventConversion,
        campaignImpressions: campaignImpressions > 0 ? campaignImpressions : null,
        campaignClicks: campaignClicks > 0 ? campaignClicks : null,
        campaignCTR,
        campaignSpentCents: campaignSpentCents > 0 ? campaignSpentCents : null,
        campaignBudgetCents: campaignBudgetCents > 0 ? campaignBudgetCents : null,
        activeCampaigns,
        profileScore,
        hasData: hasAnyData,
      },
      suggestions: suggestions.slice(0, 6),
      alerts: alerts.slice(0, 4),
      trends,
      quickStats,
    });
  } catch (error) {
    console.error("Intelligence fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
