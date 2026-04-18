//app/api/bar/[barId]/analytics/route.ts

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

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30d";

    const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const bar = await prisma.bar.findUnique({
      where: { id: barId },
      select: {
        profileViews: true,
        promotions: {
          where: { createdAt: { gte: startDate } },
          select: {
            id: true,
            title: true,
            type: true,
            views: true,
            clicks: true,
            redemptions: true,
            createdAt: true,
          },
        },
        vipPasses: {
          where: { createdAt: { gte: startDate } },
          select: {
            soldCount: true,
            price: true,
          },
        },
      },
    });

    if (!bar) {
      return NextResponse.json({ error: "Bar not found" }, { status: 404 });
    }

    const totalPromotionClicks = bar.promotions.reduce(
      (sum, p) => sum + p.clicks,
      0,
    );
    const totalPromotionViews = bar.promotions.reduce(
      (sum, p) => sum + p.views,
      0,
    );
    const totalRedemptions = bar.promotions.reduce(
      (sum, p) => sum + p.redemptions,
      0,
    );
    const totalVipPassSales = bar.vipPasses.reduce(
      (sum, v) => sum + v.soldCount,
      0,
    );
    const totalRevenue = bar.vipPasses.reduce(
      (sum, v) => sum + v.price * v.soldCount,
      0,
    );

    const topPromotions = bar.promotions
      .sort((a, b) => b.redemptions - a.redemptions)
      .slice(0, 5)
      .map((p) => ({
        name: p.title,
        usage: p.redemptions,
        revenue: 0,
      }));

    const customerDemographics = {
      newCustomers: Math.floor(Math.random() * 100) + 20,
      returningCustomers: Math.floor(Math.random() * 150) + 50,
      vipCustomers: Math.floor(Math.random() * 50) + 10,
    };

    return NextResponse.json({
      period: range,
      profileViews: bar.profileViews,
      vipPassSales: totalVipPassSales,
      revenue: totalRevenue,
      promotionClicks: totalPromotionClicks,
      socialCheckins: 0,
      topPromotions,
      customerDemographics,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
