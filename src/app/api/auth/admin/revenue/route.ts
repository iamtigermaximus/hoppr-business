// GET /api/auth/admin/revenue
// Revenue dashboard — VIP pass revenue, trends, breakdowns

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { authService } from "@/services/auth-service";

// ---- Types ----

interface RevenueByBarType {
  type: string;
  revenue: number;
  passCount: number;
  barCount: number;
}

interface RevenueByCity {
  city: string;
  revenue: number;
  passCount: number;
  barCount: number;
}

interface TopBarRevenue {
  barId: string;
  barName: string;
  barType: string;
  city: string | null;
  revenue: number;
  passesSold: number;
}

interface MonthlyTrend {
  month: string;
  revenue: number;
  passesSold: number;
}

interface RevenueData {
  totalRevenue: number;
  totalPassesSold: number;
  totalPassQuantity: number;
  vipEnabledBars: number;
  totalBars: number;
  vipAdoptionRate: number;
  averageRevenuePerBar: number;
  revenueByType: RevenueByBarType[];
  revenueByCity: RevenueByCity[];
  topBars: TopBarRevenue[];
  monthlyTrends: MonthlyTrend[];
  periodComparison: {
    currentPeriod: string;
    currentRevenue: number;
    previousRevenue: number;
    growthPercent: number;
  };
}

// ---- GET ----

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const authResult = await authService.validateToken(token);

    if (
      authResult.type !== "admin" ||
      authResult.user.adminRole !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        { error: "Super admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30d";

    const now = new Date();
    const startDate = new Date();
    switch (range) {
      case "7d":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "90d":
        startDate.setDate(startDate.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Previous period for comparison
    const periodDays = Math.round((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const prevStartDate = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // ---- Fetch Data ----

    // All VIP passes (for revenue calculation)
    const allPasses = await prisma.vIPPassEnhanced.findMany({
      include: {
        bar: {
          select: { id: true, name: true, type: true, cityName: true },
        },
      },
    });

    // Passes sold in current period (from UserVIPPass)
    const periodPurchases = await prisma.userVIPPass.findMany({
      where: { purchasedAt: { gte: startDate } },
      include: {
        vipPass: {
          include: {
            bar: { select: { id: true, name: true, type: true, cityName: true } },
          },
        },
      },
    });

    // Previous period purchases
    const prevPurchases = await prisma.userVIPPass.findMany({
      where: {
        purchasedAt: { gte: prevStartDate, lt: startDate },
      },
    });

    // Total bar counts
    const totalBars = await prisma.bar.count();
    const vipEnabledBars = await prisma.bar.count({
      where: { vipEnabled: true },
    });

    // ---- Calculate Revenue ----

    // Total lifetime revenue
    const totalRevenue = allPasses.reduce(
      (sum, p) => sum + (p.soldCount * p.priceCents) / 100,
      0
    );
    const totalPassesSold = allPasses.reduce((sum, p) => sum + p.soldCount, 0);
    const totalPassQuantity = allPasses.reduce((sum, p) => sum + p.totalQuantity, 0);

    // Current period revenue
    const currentRevenue = periodPurchases.reduce(
      (sum, p) => sum + p.purchasePriceCents / 100,
      0
    );
    const prevRevenue = prevPurchases.reduce(
      (sum, p) => sum + p.purchasePriceCents / 100,
      0
    );
    const growthPercent =
      prevRevenue > 0
        ? Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 100)
        : currentRevenue > 0
          ? 100
          : 0;

    // ---- Revenue by Bar Type ----
    const typeMap = new Map<string, { revenue: number; passCount: number; bars: Set<string> }>();
    for (const pass of allPasses) {
      const type = pass.bar.type;
      const existing = typeMap.get(type) || { revenue: 0, passCount: 0, bars: new Set() };
      existing.revenue += (pass.soldCount * pass.priceCents) / 100;
      existing.passCount += pass.soldCount;
      existing.bars.add(pass.barId);
      typeMap.set(type, existing);
    }

    const revenueByType: RevenueByBarType[] = Array.from(typeMap.entries())
      .map(([type, data]) => ({
        type: type.replace(/_/g, " "),
        revenue: Math.round(data.revenue * 100) / 100,
        passCount: data.passCount,
        barCount: data.bars.size,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // ---- Revenue by City ----
    const cityMap = new Map<string, { revenue: number; passCount: number; bars: Set<string> }>();
    for (const pass of allPasses) {
      const city = pass.bar.cityName || "Unknown";
      const existing = cityMap.get(city) || { revenue: 0, passCount: 0, bars: new Set() };
      existing.revenue += (pass.soldCount * pass.priceCents) / 100;
      existing.passCount += pass.soldCount;
      existing.bars.add(pass.barId);
      cityMap.set(city, existing);
    }

    const revenueByCity: RevenueByCity[] = Array.from(cityMap.entries())
      .map(([city, data]) => ({
        city,
        revenue: Math.round(data.revenue * 100) / 100,
        passCount: data.passCount,
        barCount: data.bars.size,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // ---- Top Bars ----
    const barRevenueMap = new Map<string, { bar: typeof allPasses[0]["bar"]; revenue: number; sold: number }>();
    for (const pass of allPasses) {
      const existing = barRevenueMap.get(pass.barId) || {
        bar: pass.bar,
        revenue: 0,
        sold: 0,
      };
      existing.revenue += (pass.soldCount * pass.priceCents) / 100;
      existing.sold += pass.soldCount;
      barRevenueMap.set(pass.barId, existing);
    }

    const topBars: TopBarRevenue[] = Array.from(barRevenueMap.values())
      .map(({ bar, revenue, sold }) => ({
        barId: bar.id,
        barName: bar.name,
        barType: bar.type,
        city: bar.cityName,
        revenue: Math.round(revenue * 100) / 100,
        passesSold: sold,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // ---- Monthly Trends (last 6 months) ----
    const monthlyTrends: MonthlyTrend[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const monthPurchases = await prisma.userVIPPass.findMany({
        where: {
          purchasedAt: { gte: monthStart, lt: monthEnd },
        },
        select: { purchasePriceCents: true },
      });

      const monthRevenue = monthPurchases.reduce(
        (sum, p) => sum + p.purchasePriceCents / 100,
        0
      );

      monthlyTrends.push({
        month: monthStart.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        revenue: Math.round(monthRevenue * 100) / 100,
        passesSold: monthPurchases.length,
      });
    }

    // ---- VIP Adoption ----
    const vipAdoptionRate =
      totalBars > 0 ? Math.round((vipEnabledBars / totalBars) * 100) : 0;
    const averageRevenuePerBar =
      totalBars > 0 ? Math.round((totalRevenue / totalBars) * 100) / 100 : 0;

    const revenueData: RevenueData = {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalPassesSold,
      totalPassQuantity,
      vipEnabledBars,
      totalBars,
      vipAdoptionRate,
      averageRevenuePerBar,
      revenueByType,
      revenueByCity,
      topBars,
      monthlyTrends,
      periodComparison: {
        currentPeriod: `Last ${periodDays} days`,
        currentRevenue: Math.round(currentRevenue * 100) / 100,
        previousRevenue: Math.round(prevRevenue * 100) / 100,
        growthPercent,
      },
    };

    return NextResponse.json({ success: true, revenue: revenueData });
  } catch (error) {
    console.error("Revenue fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
