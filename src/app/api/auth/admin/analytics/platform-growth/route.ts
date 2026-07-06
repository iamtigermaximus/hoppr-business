// Route: GET /api/auth/admin/analytics/platform-growth
// Description: Get platform growth data over time
// Query params: range (7d, 30d, 90d, 1y)

import { NextRequest, NextResponse } from "next/server";
import { verifyAuthHeader, isAdminToken } from "@/lib/auth";
import { PlatformGrowthData, AdminTimeRange } from "@/types/admin-analytics";
import { prisma } from "@/lib/database";
import { handleApiError } from "@/lib/api-error";

function getDateRange(range: AdminTimeRange): { startDate: Date } {
  const now = new Date();
  const startDate = new Date();

  switch (range) {
    case "7d":
      startDate.setDate(now.getDate() - 7);
      break;
    case "90d":
      startDate.setDate(now.getDate() - 90);
      break;
    case "1y":
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setDate(now.getDate() - 30);
  }

  return { startDate };
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getDaysInRange(startDate: Date, endDate: Date): string[] {
  const days: string[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    days.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

export async function GET(request: NextRequest) {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isAdminToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rangeParam = request.nextUrl.searchParams.get(
      "range",
    ) as AdminTimeRange | null;
    const range: AdminTimeRange =
      rangeParam && ["7d", "30d", "90d", "1y"].includes(rangeParam)
        ? rangeParam
        : "30d";

    const { startDate } = getDateRange(range);
    const now = new Date();

    // Get summary data
    const totalBars = await prisma.bar.count();
    const activeBars = await prisma.bar.count({ where: { isActive: true } });
    const totalUsers = await prisma.barStaff.count();
    const activeUsers = await prisma.barStaff.count({
      where: { isActive: true },
    });

    // Get new bars in current period
    const newBars = await prisma.bar.count({
      where: { createdAt: { gte: startDate } },
    });

    // Get new users in current period
    const newUsers = await prisma.barStaff.count({
      where: { createdAt: { gte: startDate } },
    });

    // Get daily bar creation data
    const barsRaw = await prisma.bar.groupBy({
      by: ["createdAt"],
      where: { createdAt: { gte: startDate } },
      _count: { id: true },
      orderBy: { createdAt: "asc" },
    });

    // Get daily user creation data
    const usersRaw = await prisma.barStaff.groupBy({
      by: ["createdAt"],
      where: { createdAt: { gte: startDate } },
      _count: { id: true },
      orderBy: { createdAt: "asc" },
    });

    // Convert to maps for easier lookup
    const barsByDate: Map<string, number> = new Map();
    const usersByDate: Map<string, number> = new Map();

    for (const item of barsRaw) {
      const dateStr = formatDate(item.createdAt);
      barsByDate.set(dateStr, item._count.id);
    }

    for (const item of usersRaw) {
      const dateStr = formatDate(item.createdAt);
      usersByDate.set(dateStr, item._count.id);
    }

    // Generate all dates in range
    const allDates = getDaysInRange(startDate, now);

    // Build arrays for charts
    const labels: string[] = [];
    const barsData: number[] = [];
    const usersData: number[] = [];
    const revenueData: number[] = [];

    let cumulativeBars = 0;
    let cumulativeUsers = 0;

    for (const date of allDates) {
      labels.push(date);

      const dailyBars = barsByDate.get(date) || 0;
      const dailyUsers = usersByDate.get(date) || 0;

      cumulativeBars += dailyBars;
      cumulativeUsers += dailyUsers;

      barsData.push(cumulativeBars);
      usersData.push(cumulativeUsers);
      revenueData.push(0);
    }

    // Calculate user growth rate
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const previousPeriodUsers = await prisma.barStaff.count({
      where: { createdAt: { lt: startDate, gte: thirtyDaysAgo } },
    });

    const userGrowthRate =
      previousPeriodUsers === 0
        ? newUsers > 0
          ? 100
          : 0
        : ((newUsers - previousPeriodUsers) / previousPeriodUsers) * 100;

    // Calculate bar retention rate
    const barRetentionRate = totalBars > 0 ? (activeBars / totalBars) * 100 : 0;

    const responseData: PlatformGrowthData = {
      labels,
      barsData,
      usersData,
      revenueData,
      totalBars,
      activeBars,
      newBars,
      barRetentionRate: Number(barRetentionRate.toFixed(1)),
      totalUsers,
      activeUsers,
      newUsers,
      userGrowthRate: Number(userGrowthRate.toFixed(1)),
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    return handleApiError(error, "Platform growth error:");
  }
}
