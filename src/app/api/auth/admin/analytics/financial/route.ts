// import { NextRequest, NextResponse } from "next/server";
// import { PrismaClient } from "@prisma/client";
// import { verify } from "jsonwebtoken";

// const prisma = new PrismaClient();
// const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// export async function GET(request: NextRequest) {
//   try {
//     const token = request.headers.get("authorization")?.replace("Bearer ", "");

//     if (!token) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const decoded = verify(token, JWT_SECRET) as { role: string };

//     if (decoded.role !== "SUPER_ADMIN") {
//       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
//     }

//     const { searchParams } = new URL(request.url);
//     const range = searchParams.get("range") || "30d";

//     const startDate = new Date();
//     switch (range) {
//       case "7d":
//         startDate.setDate(startDate.getDate() - 7);
//         break;
//       case "90d":
//         startDate.setDate(startDate.getDate() - 90);
//         break;
//       case "1y":
//         startDate.setFullYear(startDate.getFullYear() - 1);
//         break;
//       default:
//         startDate.setDate(startDate.getDate() - 30);
//     }

//     // Get VIP pass sales
//     const vipPasses = await prisma.vIPPassEnhanced.findMany({
//       where: { createdAt: { gte: startDate } },
//       select: { soldCount: true, priceCents: true },
//     });

//     const totalRevenue = vipPasses.reduce(
//       (sum, p) => sum + (p.soldCount * p.priceCents) / 100,
//       0,
//     );

//     // Get sales by bar
//     const salesByBar = await prisma.vIPPassEnhanced.groupBy({
//       by: ["barId"],
//       where: { createdAt: { gte: startDate } },
//       _sum: { soldCount: true },
//     });

//     const barIds = salesByBar.map((s) => s.barId);
//     const bars = await prisma.bar.findMany({
//       where: { id: { in: barIds } },
//       select: { id: true, name: true },
//     });

//     const barMap = new Map(bars.map((b) => [b.id, b.name]));

//     const topBars = salesByBar
//       .map((s) => ({
//         barId: s.barId,
//         barName: barMap.get(s.barId) || "Unknown",
//         sales: s._sum.soldCount || 0,
//       }))
//       .sort((a, b) => b.sales - a.sales)
//       .slice(0, 5);

//     return NextResponse.json({
//       success: true,
//       financial: {
//         totalRevenue,
//         vipPassRevenue: totalRevenue,
//         platformFee: totalRevenue * 0.1,
//         topBars,
//       },
//     });
//   } catch (error) {
//     console.error("Financial analytics error:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 },
//     );
//   }
// }
// Route: GET /api/auth/admin/analytics/financial
// Description: Get financial analytics data
// Query params: range (7d, 30d, 90d, 1y)

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verify } from "jsonwebtoken";
import {
  FinancialData,
  TopBarFinancial,
  RevenueByBarType,
  RevenueByCity,
  AdminTimeRange,
} from "@/types/admin-analytics";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

function getDateRange(range: AdminTimeRange): {
  startDate: Date;
  prevStartDate: Date;
} {
  const now = new Date();
  const startDate = new Date();
  const prevStartDate = new Date();

  switch (range) {
    case "7d":
      startDate.setDate(now.getDate() - 7);
      prevStartDate.setDate(now.getDate() - 14);
      break;
    case "90d":
      startDate.setDate(now.getDate() - 90);
      prevStartDate.setDate(now.getDate() - 180);
      break;
    case "1y":
      startDate.setFullYear(now.getFullYear() - 1);
      prevStartDate.setFullYear(now.getFullYear() - 2);
      break;
    default:
      startDate.setDate(now.getDate() - 30);
      prevStartDate.setDate(now.getDate() - 60);
  }

  return { startDate, prevStartDate };
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verify(token, JWT_SECRET) as { role: string };

    if (decoded.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rangeParam = request.nextUrl.searchParams.get(
      "range",
    ) as AdminTimeRange | null;
    const range: AdminTimeRange =
      rangeParam && ["7d", "30d", "90d", "1y"].includes(rangeParam)
        ? rangeParam
        : "30d";

    const { startDate, prevStartDate } = getDateRange(range);
    const totalBars = await prisma.bar.count();
    const vipEnabledBars = await prisma.bar.count({
      where: { vipEnabled: true },
    });

    // Get VIP pass sales data
    const currentVipPasses = await prisma.vIPPassEnhanced.findMany({
      where: { createdAt: { gte: startDate } },
      select: { soldCount: true, priceCents: true, barId: true },
    });

    const previousVipPasses = await prisma.vIPPassEnhanced.findMany({
      where: { createdAt: { lt: startDate, gte: prevStartDate } },
      select: { soldCount: true, priceCents: true },
    });

    const totalRevenue = currentVipPasses.reduce(
      (sum, p) => sum + (p.soldCount * p.priceCents) / 100,
      0,
    );

    const previousRevenue = previousVipPasses.reduce(
      (sum, p) => sum + (p.soldCount * p.priceCents) / 100,
      0,
    );

    const vipPassesSold = currentVipPasses.reduce(
      (sum, p) => sum + p.soldCount,
      0,
    );
    const previousPassSales = previousVipPasses.reduce(
      (sum, p) => sum + p.soldCount,
      0,
    );

    // Get sales by bar
    const salesByBar = new Map<string, number>();
    for (const pass of currentVipPasses) {
      const current = salesByBar.get(pass.barId) || 0;
      salesByBar.set(pass.barId, current + pass.soldCount);
    }

    const barIds = Array.from(salesByBar.keys());
    const bars = await prisma.bar.findMany({
      where: { id: { in: barIds } },
      select: { id: true, name: true },
    });

    const barMap = new Map(bars.map((b) => [b.id, b.name]));

    const topBarsByRevenue: TopBarFinancial[] = Array.from(salesByBar.entries())
      .map(([barId, sales]) => ({
        barId,
        barName: barMap.get(barId) || "Unknown",
        sales,
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    // Revenue by bar type
    const barsWithTypes = await prisma.bar.findMany({
      where: { id: { in: barIds } },
      select: { id: true, type: true },
    });

    const typeMap = new Map(barsWithTypes.map((b) => [b.id, b.type]));
    const revenueByTypeMap = new Map<string, number>();

    for (const pass of currentVipPasses) {
      const barType = typeMap.get(pass.barId) || "UNKNOWN";
      const revenue = (pass.soldCount * pass.priceCents) / 100;
      revenueByTypeMap.set(
        barType,
        (revenueByTypeMap.get(barType) || 0) + revenue,
      );
    }

    const revenueByBarType: RevenueByBarType[] = Array.from(
      revenueByTypeMap.entries(),
    )
      .map(([type, revenue]) => ({ type, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    // Revenue by city
    const barsWithCities = await prisma.bar.findMany({
      where: { id: { in: barIds } },
      select: { id: true, cityName: true },
    });

    const cityMap = new Map(
      barsWithCities.map((b) => [b.id, b.cityName || "Unknown"]),
    );
    const revenueByCityMap = new Map<string, number>();

    for (const pass of currentVipPasses) {
      const city = cityMap.get(pass.barId) || "Unknown";
      const revenue = (pass.soldCount * pass.priceCents) / 100;
      revenueByCityMap.set(city, (revenueByCityMap.get(city) || 0) + revenue);
    }

    const revenueByCity: RevenueByCity[] = Array.from(
      revenueByCityMap.entries(),
    )
      .map(([city, revenue]) => ({ city, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    // Calculate growth rates
    const revenueGrowth =
      previousRevenue === 0
        ? totalRevenue > 0
          ? 100
          : 0
        : ((totalRevenue - previousRevenue) / previousRevenue) * 100;

    const passSalesGrowth =
      previousPassSales === 0
        ? vipPassesSold > 0
          ? 100
          : 0
        : ((vipPassesSold - previousPassSales) / previousPassSales) * 100;

    const vipAdoptionRate =
      totalBars > 0 ? (vipEnabledBars / totalBars) * 100 : 0;
    const averageRevenuePerBar = totalBars > 0 ? totalRevenue / totalBars : 0;

    const financialData: FinancialData = {
      totalRevenue,
      platformRevenue: totalRevenue * 0.9,
      vipPassesSold,
      vipEnabledBars,
      vipAdoptionRate: Number(vipAdoptionRate.toFixed(1)),
      averageRevenuePerBar: Number(averageRevenuePerBar.toFixed(2)),
      revenueGrowth: Number(revenueGrowth.toFixed(1)),
      passSalesGrowth: Number(passSalesGrowth.toFixed(1)),
      topBarsByRevenue,
      revenueByBarType,
      revenueByCity,
    };

    return NextResponse.json({
      success: true,
      financial: financialData,
    });
  } catch (error) {
    console.error("Financial analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
