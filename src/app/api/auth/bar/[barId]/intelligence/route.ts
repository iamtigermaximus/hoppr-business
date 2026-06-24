// src/app/api/auth/bar/[barId]/intelligence/route.ts
// Intelligence hub — real data queries replacing mock Math.random()

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";

// ---- Helpers ----

function startOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfPrevMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dayName(index: number): string {
  const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return names[index] || "Unknown";
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

function computeOverall(
  revenueTrend: number | null,
  engagement: number | null,
  promoPerf: number | null,
): "excellent" | "good" | "warning" | "critical" | "no-data" {
  if (engagement === null && promoPerf === null) return "no-data";
  let score = 0;
  let factors = 0;
  if (revenueTrend !== null) { score += revenueTrend >= 5 ? 2 : revenueTrend >= 0 ? 1 : 0; factors++; }
  if (engagement !== null) { score += engagement >= 70 ? 2 : engagement >= 40 ? 1 : 0; factors++; }
  if (promoPerf !== null) { score += promoPerf >= 60 ? 2 : promoPerf >= 30 ? 1 : 0; factors++; }
  if (factors === 0) return "no-data";
  const avg = score / factors;
  if (avg >= 1.8) return "excellent";
  if (avg >= 1.2) return "good";
  if (avg >= 0.6) return "warning";
  return "critical";
}

// ---- GET — full intelligence data ----

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
    const monthStart = startOfMonth(now);
    const prevMonthStart = startOfPrevMonth(now);
    const thirtyDaysAgo = daysAgo(30);

    // ---- Revenue: VIP pass sales this month vs last month ----
    const [currentRevenue, previousRevenue] = await Promise.all([
      prisma.userVIPPass.aggregate({
        where: { barId, purchasedAt: { gte: monthStart } },
        _sum: { purchasePriceCents: true },
      }),
      prisma.userVIPPass.aggregate({
        where: { barId, purchasedAt: { gte: prevMonthStart, lt: monthStart } },
        _sum: { purchasePriceCents: true },
      }),
    ]);

    const revenueCents = currentRevenue._sum.purchasePriceCents || 0;
    const prevRevenueCents = previousRevenue._sum.purchasePriceCents || 0;
    const revenueDollars = Math.round(revenueCents / 100);
    const revenueTrend = percentChange(revenueCents, prevRevenueCents);

    // ---- Active Customers: unique purchasers + event attendees (last 30 days) ----
    const [passBuyers, eventAttendees] = await Promise.all([
      prisma.userVIPPass.findMany({
        where: { barId, purchasedAt: { gte: thirtyDaysAgo } },
        select: { userId: true },
        distinct: ["userId"],
      }),
      prisma.eventParticipant.findMany({
        where: {
          event: { venueId: barId },
          joinedAt: { gte: thirtyDaysAgo },
        },
        select: { userId: true },
        distinct: ["userId"],
      }),
    ]);

    const customerSet = new Set([
      ...passBuyers.map((p) => p.userId),
      ...eventAttendees.map((e) => e.userId),
    ]);
    const customerCount = customerSet.size;

    // Previous 30 days for customer trend
    const sixtyDaysAgo = daysAgo(60);
    const [prevPassBuyers, prevEventAttendees] = await Promise.all([
      prisma.userVIPPass.findMany({
        where: { barId, purchasedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
        select: { userId: true },
        distinct: ["userId"],
      }),
      prisma.eventParticipant.findMany({
        where: {
          event: { venueId: barId },
          joinedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
        select: { userId: true },
        distinct: ["userId"],
      }),
    ]);

    const prevCustomerSet = new Set([
      ...prevPassBuyers.map((p) => p.userId),
      ...prevEventAttendees.map((e) => e.userId),
    ]);
    const customerTrend = percentChange(customerSet.size, prevCustomerSet.size);

    // ---- VIP Engagement: pass fill rate + scan rate ----
    const passStats = await prisma.vIPPassEnhanced.aggregate({
      where: { barId, isActive: true },
      _sum: { soldCount: true, totalQuantity: true },
    });

    const totalSold = passStats._sum.soldCount || 0;
    const totalQty = passStats._sum.totalQuantity || 0;
    const fillRate = totalQty > 0 ? Math.round((totalSold / totalQty) * 100) : 0;

    // Scan rate = scanned / sold (last 30 days)
    const recentScans = await prisma.vIPPassScan.count({
      where: { barId, scannedAt: { gte: thirtyDaysAgo } },
    });

    const recentPurchases = await prisma.userVIPPass.count({
      where: { barId, purchasedAt: { gte: thirtyDaysAgo } },
    });

    const scanRate = recentPurchases > 0 ? Math.round((recentScans / recentPurchases) * 100) : 0;
    const vipEngagement = Math.round((fillRate + scanRate) / 2);

    // Previous period for engagement trend
    const prevScans = await prisma.vIPPassScan.count({
      where: { barId, scannedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    });
    const prevPurchases = await prisma.userVIPPass.count({
      where: { barId, purchasedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    });
    const prevScanRate = prevPurchases > 0 ? Math.round((prevScans / prevPurchases) * 100) : 0;
    const engagementTrend = percentChange(scanRate, prevScanRate);

    // ---- Promotion Performance ----
    const promoStats = await prisma.barPromotion.aggregate({
      where: { barId, isActive: true },
      _sum: { views: true, clicks: true, redemptions: true },
    });

    const totalViews = promoStats._sum.views || 0;
    const totalRedemptions = promoStats._sum.redemptions || 0;
    const promoPerformance = totalViews > 0
      ? Math.round((totalRedemptions / totalViews) * 100)
      : null;

    const allPromos = await prisma.barPromotion.findMany({
      where: { barId, isActive: true },
      orderBy: { redemptions: "desc" },
      select: { title: true, redemptions: true, endDate: true, type: true },
    });

    const topPromotion = allPromos[0] || null;

    // ---- Best Day: from VIP pass scans grouped by day of week ----
    const scans = await prisma.vIPPassScan.findMany({
      where: { barId, scannedAt: { gte: thirtyDaysAgo } },
      select: { scannedAt: true },
    });

    const dayCounts = new Map<number, number>();
    for (const s of scans) {
      const dow = s.scannedAt.getDay();
      dayCounts.set(dow, (dayCounts.get(dow) || 0) + 1);
    }

    let bestDay = "No data yet";
    let bestDayCount = 0;
    for (const [dow, count] of dayCounts) {
      if (count > bestDayCount) {
        bestDayCount = count;
        bestDay = dayName(dow);
      }
    }

    // ---- Determine if bar has meaningful data ----
    const hasData = revenueCents > 0 || customerSet.size > 0 || totalSold > 0;

    // ---- Compute overall status ----
    const overall = hasData
      ? computeOverall(revenueTrend, vipEngagement, promoPerformance)
      : "no-data";

    // ---- Build data-driven suggestions ----
    const suggestions: Array<{
      id: string;
      icon: string;
      title: string;
      description: string;
      action: string;
      type: "setup" | "optimization" | "maintenance" | "growth";
    }> = [];

    if (!hasData) {
      // No data — setup suggestions
      suggestions.push(
        { id: "s1", icon: "📱", title: "Set Up QR Scanner", description: "Configure your QR code scanner to start tracking customer visits and VIP redemptions.", action: `/bar/${barId}/scanner`, type: "setup" },
        { id: "s2", icon: "🎯", title: "Create First Promotion", description: "Launch your first promotion to attract customers and start collecting performance data.", action: `/bar/${barId}/promotions`, type: "setup" },
        { id: "s3", icon: "🎟️", title: "Create VIP Passes", description: "Set up VIP passes to generate revenue and build a loyal customer base.", action: `/bar/${barId}/passes`, type: "setup" },
        { id: "s4", icon: "📅", title: "Plan an Event", description: "Create your first event to drive foot traffic on slower days.", action: `/bar/${barId}/events`, type: "setup" },
      );
    } else {
      // Data-driven suggestions
      if (fillRate > 80) {
        suggestions.push({
          id: "d1", icon: "🔥",
          title: "Passes Selling Fast",
          description: `Your passes are at ${fillRate}% capacity. Consider increasing quantities or adding new pass types before they sell out.`,
          action: `/bar/${barId}/passes`, type: "optimization",
        });
      }

      if (fillRate < 30 && totalQty > 0) {
        suggestions.push({
          id: "d2", icon: "📉",
          title: "Low Pass Sales",
          description: `Only ${fillRate}% of passes sold. Try lowering prices, adding benefits, or running a limited-time promotion.`,
          action: `/bar/${barId}/passes`, type: "warning" as any,
        });
      }

      const upcomingEvents = await prisma.event.count({
        where: { venueId: barId, startTime: { gte: now }, complianceStatus: "COMPLIANT" },
      });

      if (upcomingEvents === 0) {
        suggestions.push({
          id: "d3", icon: "📅",
          title: "No Upcoming Events",
          description: "Events drive 2x more foot traffic. Schedule one for the next two weeks.",
          action: `/bar/${barId}/events`, type: "optimization",
        });
      }

      if (topPromotion && topPromotion.endDate < new Date(Date.now() + 7 * 86400000)) {
        suggestions.push({
          id: "d4", icon: "⏰",
          title: "Promotion Ending Soon",
          description: `"${topPromotion.title}" ends within a week. Prepare a follow-up to maintain momentum.`,
          action: `/bar/${barId}/promotions`, type: "maintenance",
        });
      }

      // Always include a growth suggestion
      if (bestDayCount > 0) {
        suggestions.push({
          id: "d5", icon: "🚀",
          title: `${bestDay} Is Your Best Day`,
          description: `${bestDay}s have the most redemptions. Create a ${bestDay}-exclusive pass or event to maximize revenue.`,
          action: `/bar/${barId}/passes`, type: "growth",
        });
      }

      // Ensure at least 3 suggestions
      if (suggestions.length < 3) {
        suggestions.push(
          { id: "dg1", icon: "👥", title: "Boost Customer Retention", description: "Create a loyalty pass to encourage repeat visits from your customers.", action: `/bar/${barId}/passes`, type: "growth" },
          { id: "dg2", icon: "📊", title: "Review Your Analytics", description: "Check detailed analytics to spot trends in your revenue and customer data.", action: `/bar/${barId}/analytics`, type: "maintenance" },
        );
      }
    }

    // ---- Build alerts ----
    const alerts: Array<{
      id: string;
      type: "info" | "warning" | "success" | "error" | "setup";
      title: string;
      description: string;
      icon: string;
    }> = [];

    if (!hasData) {
      alerts.push(
        { id: "a1", type: "setup", title: "Welcome to Bar Intelligence!", description: "Get started by setting up your bar systems to unlock powerful insights.", icon: "👋" },
        { id: "a2", type: "info", title: "No Data Yet", description: "Start by scanning QR codes or creating promotions to see insights.", icon: "📈" },
      );
    } else {
      // Real alerts based on data
      if (vipEngagement < 40) {
        alerts.push({
          id: "a1", type: "warning",
          title: "Low VIP Engagement",
          description: `Only ${vipEngagement}% of passes are being redeemed. Consider reminding customers or simplifying redemption.`,
          icon: "⚠️",
        });
      }

      if (revenueTrend !== null && revenueTrend < -10) {
        alerts.push({
          id: "a2", type: "warning",
          title: "Revenue Declining",
          description: `Pass revenue is down ${Math.abs(revenueTrend)}% month-over-month. Review pricing and promotions.`,
          icon: "📉",
        });
      }

      if (promoPerformance !== null && promoPerformance > 50) {
        alerts.push({
          id: "a3", type: "success",
          title: "Strong Promotion Performance",
          description: `Your promotions convert at ${promoPerformance}%. Keep doing what works!`,
          icon: "🎯",
        });
      }

      // Expiring promotions
      const expiringPromos = allPromos.filter(
        (p) => p.endDate < new Date(Date.now() + 3 * 86400000) && p.endDate > now,
      );
      for (const ep of expiringPromos.slice(0, 2)) {
        alerts.push({
          id: `exp-${ep.title}`,
          type: "info",
          title: "Promotion Expiring Soon",
          description: `"${ep.title}" ends in less than 3 days. Extend or replace it.`,
          icon: "⏰",
        });
      }

      // Ensure at least 2 alerts
      if (alerts.length < 2) {
        alerts.push(
          { id: "ad1", type: "success", title: "Systems Active", description: "Your bar data is flowing. Check back regularly for new insights.", icon: "✅" },
        );
      }
    }

    // ---- Build trends ----
    const trends: Array<{
      label: string;
      value: string;
      positive?: boolean;
      isPlaceholder?: boolean;
    }> = [];

    if (hasData) {
      if (revenueTrend !== null) {
        const prefix = revenueTrend >= 0 ? "+" : "";
        trends.push({ label: "Monthly Revenue", value: `${prefix}${revenueTrend}%`, positive: revenueTrend >= 0 });
      }
      if (customerTrend !== null) {
        const prefix = customerTrend >= 0 ? "+" : "";
        trends.push({ label: "Active Customers", value: `${prefix}${customerTrend}%`, positive: customerTrend >= 0 });
      }
      if (engagementTrend !== null) {
        const prefix = engagementTrend >= 0 ? "+" : "";
        trends.push({ label: "Pass Redemption Rate", value: `${prefix}${engagementTrend}%`, positive: engagementTrend >= 0 });
      }
      if (totalRedemptions > 0) {
        trends.push({ label: "Total Redemptions", value: `${totalRedemptions} this month`, positive: undefined });
      }
      if (totalSold > 0) {
        trends.push({ label: "Passes Sold", value: `${totalSold} total`, positive: undefined });
      }
    } else {
      trends.push(
        { label: "Customer Visits", value: "No data yet", isPlaceholder: true },
        { label: "Revenue Tracking", value: "Setup needed", isPlaceholder: true },
        { label: "Promotion Performance", value: "Not started", isPlaceholder: true },
        { label: "VIP Engagement", value: "Awaiting data", isPlaceholder: true },
        { label: "Pass Sales", value: "Create passes first", isPlaceholder: true },
      );
    }

    // ---- Quick Stats ----
    const quickStats = {
      bestDay,
      topPromotion: topPromotion?.title || (hasData ? "None active" : "Create promotion"),
      passFillRate: fillRate > 0 ? `${fillRate}%` : (hasData ? "0%" : "No passes"),
    };

    return NextResponse.json({
      success: true,
      hasData,
      status: {
        overall,
        revenue: hasData ? revenueDollars : null,
        revenueTrend,
        customers: hasData ? customerCount : null,
        customerTrend,
        vipEngagement: hasData ? vipEngagement : null,
        engagementTrend,
        promotionPerformance: hasData ? promoPerformance : null,
        hasData,
      },
      suggestions,
      alerts,
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
