// Route: GET /api/auth/admin/analytics/summary
// Description: Get main admin dashboard statistics
// Query params: range (7d, 30d, 90d, 1y)

import { NextRequest, NextResponse } from "next/server";
import { verifyAuthHeader, isAdminToken } from "@/lib/auth";
import { prisma } from "@/lib/database";
import { handleApiError } from "@/lib/api-error";
import {
  AdminDashboardStats,
  AdminTimeRange,
  TopBarByViews,
  TopBarByCompletion,
  NeedingAttentionIssue,
  DistrictStat,
  BarTypeGap,
} from "@/types/admin-analytics";

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

    const { startDate, prevStartDate } = getDateRange(range);

    // Get current period data
    const totalBars = await prisma.bar.count();
    const activeBars = await prisma.bar.count({ where: { isActive: true } });
    const pendingVerification = await prisma.bar.count({
      where: { status: "UNCLAIMED", isVerified: false },
    });

    const verifiedBars = await prisma.bar.count({
      where: { isVerified: true },
    });

    // Data quality metrics
    const barsWithImages = await prisma.bar.count({
      where: { coverImage: { not: null } },
    });

    const barsWithHours = await prisma.bar.count({
      where: { operatingHours: { not: {} } },
    });

    const barsWithDescription = await prisma.bar.count({
      where: { description: { not: null } },
    });

    const barsWithCoordinates = await prisma.bar.count({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
    });

    // Calculate MISSING counts
    const barsMissingImages = totalBars - barsWithImages;
    const barsMissingHours = totalBars - barsWithHours;
    const barsMissingDescription = totalBars - barsWithDescription;
    const barsMissingCoordinates = totalBars - barsWithCoordinates;
    const barsUnverified = totalBars - verifiedBars;
    const barsInactive = totalBars - activeBars;

    // Bar completion score (based on 6 fields)
    const completionFields = [
      { name: "description", condition: { description: { not: null } } },
      { name: "coverImage", condition: { coverImage: { not: null } } },
      { name: "operatingHours", condition: { operatingHours: { not: {} } } },
      { name: "phone", condition: { phone: { not: null } } },
      { name: "website", condition: { website: { not: null } } },
      { name: "amenities", condition: { amenities: { isEmpty: false } } },
    ];

    let totalCompletionScore = 0;
    for (const field of completionFields) {
      const count = await prisma.bar.count({ where: field.condition });
      totalCompletionScore += totalBars > 0 ? (count / totalBars) * 100 : 0;
    }
    const barCompletionScore = Math.round(
      totalCompletionScore / completionFields.length,
    );

    // Bars with no staff
    const barsWithNoStaff = await prisma.bar.count({
      where: { staff: { none: {} } },
    });

    // Bars inactive > 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const barsInactiveOver30Days = await prisma.bar.count({
      where: { updatedAt: { lt: thirtyDaysAgo }, isActive: true },
    });

    // Top districts by bar count
    const topDistrictsRaw = await prisma.bar.groupBy({
      by: ["district"],
      where: { district: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    });

    const topDistricts: DistrictStat[] = topDistrictsRaw.map((d) => ({
      district: d.district as string,
      count: d._count.id,
    }));

    // Districts with 0 bars
    const existingDistrictsRaw = await prisma.bar.groupBy({
      by: ["district"],
      where: { district: { not: null } },
    });

    const existingDistrictSet = new Set(
      existingDistrictsRaw.map((d) => d.district as string),
    );

    const knownDistricts = [
      "Kamppi", "Kallio", "Punavuori", "Sörnäinen", "Eira", "Ullanlinna",
      "Kruununhaka", "Kaartinkaupunki", "Katajanokka", "Vallila", "Pasila",
      "Arabianranta", "Lauttasaari", "Kulosaari", "Malmi", "Haaga",
      "Munkkiniemi", "Meilahti", "Kumpula", "Alppiharju", "Hermanni",
      "Harju", "Käpylä", "Maunula", "Herttoniemi", "Vuosaari", "Roihuvuori",
      "Vartiokylä", "Mellunkylä", "Puotila", "Töölö", "Etu-Töölö", "Taka-Töölö",
    ];

    const helsinkiDistrictsWithZeroBars = knownDistricts.filter(
      (d) => !existingDistrictSet.has(d),
    );

    // Cities without bars
    const citiesWithBars = await prisma.bar.groupBy({
      by: ["cityName"],
      _count: { id: true },
    });

    const citiesWithBarsSet = new Set(citiesWithBars.map((c) => c.cityName));
    const targetCities = ["Helsinki", "Espoo", "Vantaa", "Kauniainen"];
    const citiesWithoutBars = targetCities.filter(
      (city) => !citiesWithBarsSet.has(city),
    );

    // Bar type gaps
    const allBarTypes = [
      "PUB", "CLUB", "LOUNGE", "COCKTAIL_BAR", "RESTAURANT_BAR",
      "SPORTS_BAR", "KARAOKE", "LIVE_MUSIC",
    ];

    const existingTypes = await prisma.bar.groupBy({
      by: ["type"],
      _count: { id: true },
    });

    const existingTypeMap = new Map<string, number>();
    for (const item of existingTypes) {
      existingTypeMap.set(item.type, item._count.id);
    }

    const barTypeGapsTemp = allBarTypes
      .map((type) => ({
        type,
        count: existingTypeMap.get(type) || 0,
        status: existingTypeMap.has(type) ? "exists" : "missing",
      }))
      .filter((t) => t.count < 5);

    const barTypeGaps: BarTypeGap[] = barTypeGapsTemp.map((item) => ({
      type: item.type,
      count: item.count,
      status: item.status as "exists" | "missing",
    }));

    // Bar engagement metrics
    const totalProfileViewsAgg = await prisma.bar.aggregate({
      _sum: { profileViews: true },
    });
    const totalProfileViews = totalProfileViewsAgg._sum.profileViews || 0;

    const avgViewsPerBar = totalBars > 0 ? Math.round(totalProfileViews / totalBars) : 0;

    const barsWithZeroViews = await prisma.bar.count({
      where: { profileViews: 0 },
    });

    // Top bars by views
    const topBarsByViewsRaw = await prisma.bar.findMany({
      where: { profileViews: { gt: 0 } },
      select: {
        id: true, name: true, type: true, cityName: true,
        district: true, profileViews: true, coverImage: true,
      },
      orderBy: { profileViews: "desc" },
      take: 10,
    });

    const topBarsByViews: TopBarByViews[] = topBarsByViewsRaw.map((bar) => ({
      id: bar.id,
      name: bar.name,
      type: bar.type,
      city: bar.cityName || "Unknown",
      district: bar.district,
      profileViews: bar.profileViews,
      coverImage: bar.coverImage,
    }));

    // Top bars by completion
    const allBarsForCompletion = await prisma.bar.findMany({
      select: {
        id: true, name: true, type: true, cityName: true, district: true,
        description: true, coverImage: true, operatingHours: true,
        phone: true, website: true, amenities: true, profileViews: true,
      },
    });

    const barsWithCompletionScores = allBarsForCompletion.map((bar) => {
      let score = 0;
      const totalFields = 6;
      if (bar.description) score++;
      if (bar.coverImage) score++;
      if (bar.operatingHours && Object.keys(bar.operatingHours).length > 0) score++;
      if (bar.phone) score++;
      if (bar.website) score++;
      if (bar.amenities && bar.amenities.length > 0) score++;
      const completionScore = Math.round((score / totalFields) * 100);
      return {
        id: bar.id, name: bar.name, type: bar.type,
        city: bar.cityName || "Unknown", district: bar.district,
        completionScore, profileViews: bar.profileViews,
      };
    });

    const topBarsByCompletion: TopBarByCompletion[] = barsWithCompletionScores
      .sort((a, b) => b.completionScore - a.completionScore)
      .slice(0, 10)
      .map((bar) => ({
        id: bar.id, name: bar.name, type: bar.type,
        city: bar.city, district: bar.district,
        completionScore: bar.completionScore, profileViews: bar.profileViews,
      }));

    // Bars needing attention
    const barsNeedingAttentionTemp = [
      { reason: "No staff assigned", count: barsWithNoStaff, priority: "high", action: "Reach out to claim the bar" },
      { reason: "Missing operating hours", count: barsMissingHours, priority: "high", action: "Add operating hours" },
      { reason: "Missing cover image", count: barsMissingImages, priority: "medium", action: "Upload a cover image" },
      { reason: "Missing description", count: barsMissingDescription, priority: "medium", action: "Add bar description" },
      { reason: "Zero profile views", count: barsWithZeroViews, priority: "medium", action: "Promote the bar" },
      { reason: "Inactive >30 days", count: barsInactiveOver30Days, priority: "high", action: "Contact bar owner" },
    ].filter((item) => item.count > 0);

    const barsNeedingAttention: NeedingAttentionIssue[] =
      barsNeedingAttentionTemp.map((item) => ({
        reason: item.reason,
        count: item.count,
        priority: item.priority as "high" | "medium" | "low",
        action: item.action,
      }));

    // VIP pass sales
    let vipPassSales = 0;
    let totalRevenue = 0;
    try {
      const vipPasses = await prisma.vIPPassEnhanced.findMany({
        where: { createdAt: { gte: startDate } },
        select: { soldCount: true, priceCents: true },
      });
      vipPassSales = vipPasses.reduce((sum, p) => sum + p.soldCount, 0);
      totalRevenue = vipPasses.reduce((sum, p) => sum + (p.soldCount * p.priceCents) / 100, 0);
    } catch {
      console.log("Error fetching VIP pass data");
    }

    const activeUsers = await prisma.barStaff.count({ where: { isActive: true } });
    const newUsers = await prisma.barStaff.count({ where: { createdAt: { gte: startDate } } });

    // Previous period
    const prevTotalBars = await prisma.bar.count({
      where: { createdAt: { lt: startDate, gte: prevStartDate } },
    });

    let previousRevenue = 0;
    try {
      const prevVipPasses = await prisma.vIPPassEnhanced.findMany({
        where: { createdAt: { lt: startDate, gte: prevStartDate } },
        select: { soldCount: true, priceCents: true },
      });
      previousRevenue = prevVipPasses.reduce((sum, p) => sum + (p.soldCount * p.priceCents) / 100, 0);
    } catch {
      console.log("Error calculating previous revenue");
    }

    const prevNewUsers = await prisma.barStaff.count({
      where: { createdAt: { lt: startDate, gte: prevStartDate } },
    });

    // Growth rates
    const barGrowth = prevTotalBars === 0
      ? (totalBars > 0 ? 100 : 0)
      : ((totalBars - prevTotalBars) / prevTotalBars) * 100;

    const revenueGrowth = previousRevenue === 0
      ? (totalRevenue > 0 ? 100 : 0)
      : ((totalRevenue - previousRevenue) / previousRevenue) * 100;

    const userGrowth = prevNewUsers === 0
      ? (newUsers > 0 ? 100 : 0)
      : ((newUsers - prevNewUsers) / prevNewUsers) * 100;

    // Data completeness
    const dataCompletenessScore = totalBars > 0
      ? Math.round(((barsWithImages + barsWithHours + barsWithDescription + barsWithCoordinates) / (totalBars * 4)) * 100)
      : 0;

    const stats: AdminDashboardStats = {
      totalBars, activeBars, pendingVerification, vipPassSales,
      totalRevenue, newUsers, userGrowth: Number(userGrowth.toFixed(1)),
      barGrowth: Number(barGrowth.toFixed(1)), revenueGrowth: Number(revenueGrowth.toFixed(1)),
      activeUsers, verifiedBars, barsWithImages, barsWithHours,
      barsWithDescription, barsWithCoordinates, dataCompletenessScore,
      barsMissingImages, barsMissingHours, barsMissingDescription,
      barsMissingCoordinates, barsUnverified, barsInactive,
      barCompletionScore, barsWithNoStaff, barsInactiveOver30Days,
      topDistricts, citiesWithoutBars, helsinkiDistrictsWithZeroBars,
      barTypeGaps, totalProfileViews, avgViewsPerBar, barsWithZeroViews,
      topBarsByViews, topBarsByCompletion, barsNeedingAttention,
    };

    return NextResponse.json(
      { success: true, data: stats },
      {
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=1800",
        },
      },
    );
  } catch (error) {
    return handleApiError(error, "Analytics summary error:");
  }
}
