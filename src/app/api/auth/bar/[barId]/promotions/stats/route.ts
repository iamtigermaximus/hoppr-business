// src/app/api/auth/bar/[barId]/promotions/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verify } from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { barId } = await params;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verify(token, JWT_SECRET) as { barId: string };
    if (decoded.barId !== barId) {
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

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Promotion stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
