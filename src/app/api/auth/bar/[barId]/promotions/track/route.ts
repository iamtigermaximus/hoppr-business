//src/app/api/auth/bar/[barId]/promotions/track/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verify } from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(request: NextRequest) {
  try {
    const { promotionId, action } = await request.json();

    // User app sends its own JWT token
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user token (different from bar staff token)
    const decoded = verify(token, JWT_SECRET) as { id: string; type: string };

    // Ensure it's a user token, not bar staff
    if (decoded.type !== "user") {
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
              userId: decoded.id,
            },
          },
          update: {
            usageCount: { increment: 1 },
            lastUsedAt: new Date(),
          },
          create: {
            promotionId: promotionId,
            userId: decoded.id,
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
