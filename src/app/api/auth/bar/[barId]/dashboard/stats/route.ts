//app/api/bar/[barId]/dashboard/stats/route.ts

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

    const bar = await prisma.bar.findUnique({
      where: { id: barId },
      select: {
        profileViews: true,
        promotions: {
          select: { clicks: true, views: true, redemptions: true },
        },
        vipPasses: {
          select: { soldCount: true, price: true },
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
    const totalVipPassSales = bar.vipPasses.reduce(
      (sum, v) => sum + v.soldCount,
      0,
    );
    const totalRevenue = bar.vipPasses.reduce(
      (sum, v) => sum + v.price * v.soldCount,
      0,
    );

    return NextResponse.json({
      profileViews: bar.profileViews,
      vipPassSales: totalVipPassSales,
      revenue: totalRevenue,
      promotionClicks: totalPromotionClicks,
      socialCheckins: 0,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
