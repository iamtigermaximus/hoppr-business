//src/app/api/auth/bar/[barId]/promotions/track/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { verifyToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { promotionId, action } = await request.json();

    // Verify user token (different from bar staff token)
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // User tokens have type: "user" instead of role: "bar_staff" or role: "admin"
    const tokenData = payload as unknown as { type?: string; id: string };
    if (tokenData.type !== "user") {
      return NextResponse.json(
        { error: "Invalid token type" },
        { status: 403 },
      );
    }

    const promotion = await prisma.barPromotion.findUnique({
      where: { id: promotionId },
    });

    if (!promotion) {
      return NextResponse.json(
        { error: "Promotion not found" },
        { status: 404 },
      );
    }

    const now = new Date();
    const isValid = now >= promotion.startDate && now <= promotion.endDate;

    switch (action) {
      case "CARD_SHOWN":
        await prisma.barPromotion.update({
          where: { id: promotionId },
          data: { cardViews: { increment: 1 } },
        });
        break;

      case "REDEEMED":
        if (!isValid) {
          return NextResponse.json(
            { error: "Promotion expired" },
            { status: 400 },
          );
        }

        await prisma.barPromotion.update({
          where: { id: promotionId },
          data: { redemptions: { increment: 1 } },
        });

        await prisma.promotionUsage.upsert({
          where: {
            promotionId_userId: {
              promotionId: promotionId,
              userId: tokenData.id,
            },
          },
          update: {
            usageCount: { increment: 1 },
            lastUsedAt: new Date(),
          },
          create: {
            promotionId: promotionId,
            userId: tokenData.id,
            barId: promotion.barId,
            usageCount: 1,
            firstUsedAt: new Date(),
            lastUsedAt: new Date(),
          },
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Track error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
