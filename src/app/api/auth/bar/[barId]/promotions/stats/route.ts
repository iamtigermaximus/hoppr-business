// src/app/api/auth/bar/[barId]/promotions/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";

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

    // Get bar analytics
    const bar = await prisma.bar.findUnique({
      where: { id: barId },
      select: {
        profileViews: true,
        directionClicks: true,
        callClicks: true,
        websiteClicks: true,
        shareCount: true,
      },
    });

    // Get all promotions with their usage data
    const promotions = await prisma.barPromotion.findMany({
      where: { barId },
      include: {
        usageHistory: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate stats for each promotion
    const promotionsWithStats = promotions.map((promo) => {
      const uniqueUsers = promo.usageHistory.length;
      const totalUsageCount = promo.usageHistory.reduce(
        (sum, u) => sum + u.usageCount,
        0,
      );
      const averageUsesPerUser =
        uniqueUsers > 0 ? totalUsageCount / uniqueUsers : 0;
      const conversionRate =
        promo.cardViews > 0 ? (promo.redemptions / promo.cardViews) * 100 : 0;

      // Get top 5 users
      const topUsers = promo.usageHistory
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 5)
        .map((u) => ({
          userId: u.userId,
          usageCount: u.usageCount,
          firstUsedAt: u.firstUsedAt,
          lastUsedAt: u.lastUsedAt,
        }));

      return {
        id: promo.id,
        title: promo.title,
        type: promo.type,
        discount: promo.discount,
        isActive: promo.isActive,
        isApproved: promo.isApproved,
        startDate: promo.startDate,
        endDate: promo.endDate,
        totalCardViews: promo.cardViews,
        totalRedemptions: promo.redemptions,
        uniqueUsers,
        totalUsageCount,
        averageUsesPerUser,
        conversionRate,
        topUsers,
      };
    });

    // Get total VIP scans
    const totalScans = await prisma.vIPPassScan.count({
      where: { barId },
    });

    return NextResponse.json(
      {
        success: true,
        barStats: {
          profileViews: bar?.profileViews || 0,
          directionClicks: bar?.directionClicks || 0,
          callClicks: bar?.callClicks || 0,
          websiteClicks: bar?.websiteClicks || 0,
          shareCount: bar?.shareCount || 0,
        },
        promotions: promotionsWithStats,
        totalScans,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=30, s-maxage=120, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    return handleApiError(error, "Promotion stats");
  }
}
