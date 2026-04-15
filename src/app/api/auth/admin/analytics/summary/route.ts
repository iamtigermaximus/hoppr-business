import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  AdminDashboardStats,
  AdminApiResponse,
  AdminTimeRange,
} from "@/types/admin-analytics";

const prisma = new PrismaClient();

async function verifyAdminToken(token: string) {
  try {
    const adminUser = await prisma.adminUser.findFirst({
      where: { isActive: true },
    });
    return adminUser;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

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

    const adminUser = await verifyAdminToken(token);
    if (!adminUser) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const rangeParam = request.nextUrl.searchParams.get(
      "range",
    ) as AdminTimeRange | null;
    const range: AdminTimeRange =
      rangeParam && ["7d", "30d", "90d", "1y"].includes(rangeParam)
        ? rangeParam
        : "30d";

    const { startDate, prevStartDate } = getDateRange(range);

    // Get current period data
    const totalBars = await prisma.bar.count();
    const activeBars = await prisma.bar.count({ where: { isActive: true } });
    const pendingVerification = await prisma.bar.count({
      where: { status: "UNCLAIMED", isVerified: false },
    });

    // Skip VIP Pass for now - set to 0
    const vipPassSales = 0;
    const totalRevenue = 0;

    // Get active users (bar staff)
    const activeUsers = await prisma.barStaff.count({
      where: { isActive: true },
    });

    // Get new users (bar staff created in period)
    const newUsers = await prisma.barStaff.count({
      where: { createdAt: { gte: startDate } },
    });

    // Get previous period data for growth
    const prevTotalBars = await prisma.bar.count({
      where: { createdAt: { lt: startDate, gte: prevStartDate } },
    });

    const prevNewUsers = await prisma.barStaff.count({
      where: { createdAt: { lt: startDate, gte: prevStartDate } },
    });

    // Calculate growth rates
    const barGrowth =
      prevTotalBars === 0
        ? totalBars > 0
          ? 100
          : 0
        : ((totalBars - prevTotalBars) / prevTotalBars) * 100;

    const revenueGrowth = 0; // No revenue yet
    const userGrowth =
      prevNewUsers === 0
        ? newUsers > 0
          ? 100
          : 0
        : ((newUsers - prevNewUsers) / prevNewUsers) * 100;

    const stats: AdminDashboardStats = {
      totalBars,
      activeBars,
      pendingVerification,
      vipPassSales,
      totalRevenue,
      newUsers,
      userGrowth: Number(userGrowth.toFixed(1)),
      barGrowth: Number(barGrowth.toFixed(1)),
      revenueGrowth,
      activeUsers,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Analytics summary error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
