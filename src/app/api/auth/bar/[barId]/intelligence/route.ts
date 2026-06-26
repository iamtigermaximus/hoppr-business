// src/app/api/auth/bar/[barId]/intelligence/route.ts
// Rewritten — uses BarDailyStats + bar profile, no VIP/payment data.

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

    const profileChecks = {
      hasPhoto: !!(bar?.coverImage || bar?.logoUrl),
      hasHours: !!(bar?.operatingHours && Object.keys(bar.operatingHours as object).length > 0),
      hasBusinessInfo: !!(bar?.coverCharge != null || (bar?.musicTags?.length ?? 0) > 0),
      hasGallery: (bar?.imageUrls?.length ?? 0) > 0,
      hasPromo: (bar?._count?.promotions ?? 0) > 0,
      hasEvent: (bar?._count?.events ?? 0) > 0,
    };

    const completedCount = Object.values(profileChecks).filter(Boolean).length;
    const profileScore = Math.round((completedCount / 6) * 100);

    // ── BarDailyStats for last 7 and 30 days ────────────────
    const [recentStats, olderStats] = await Promise.all([
      prisma.barDailyStats.findMany({
        where: { barId, date: { gte: sevenDaysAgo } },
        orderBy: { date: "asc" },
      }),
      prisma.barDailyStats.findMany({
        where: { barId, date: { gte: thirtyDaysAgo, lt: sevenDaysAgo } },
        orderBy: { date: "asc" },
      }),
    ]);

    const sumStats = (rows: typeof recentStats) =>
      rows.reduce(
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
          searches: acc.searches + d.searches,
        }),
        { profileViews: 0, directionClicks: 0, websiteClicks: 0, callClicks: 0, shareCount: 0, promoViews: 0, promoClicks: 0, promoRedemptions: 0, eventViews: 0, eventJoins: 0, uniqueVisitors: 0, searches: 0 },
      );

    const recent = sumStats(recentStats);
    const older = sumStats(olderStats);

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

    // ── Best day by traffic ─────────────────────────────────
    const dayTotals = new Map<number, number>();
    for (const d of recentStats) {
      const dow = d.date.getDay();
      const dayTraffic = d.pageViews + d.barViews + d.promoViews + d.eventViews + d.barDirections;
      dayTotals.set(dow, (dayTotals.get(dow) || 0) + dayTraffic);
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
        (profileChecks.hasEvent ? 1 : 0);
      if (score >= 5) overall = "excellent";
      else if (score >= 3) overall = "good";
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
      profileScore: `${profileScore}% (${completedCount}/6)`,
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
