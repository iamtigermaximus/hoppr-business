//app/api/bar/[barId]/scan/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verify } from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface JWTPayload {
  id: string;
  email: string;
  barId: string;
  name: string;
  role: string;
  iat?: number;
  exp?: number;
}

interface ScanPayload {
  customer: {
    id: string;
    name: string;
    email: string;
    vipStatus: boolean;
  };
  promotion?: {
    id: string;
    title: string;
  };
  timestamp: string;
  signature: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { barId } = await params;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verify(token, JWT_SECRET) as JWTPayload;
    if (decoded.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { qrData } = await request.json();
    const payload: ScanPayload = JSON.parse(qrData);

    // Check if promotion exists and is valid
    let promotionResult = null;
    if (payload.promotion) {
      const promotion = await prisma.barPromotion.findUnique({
        where: { id: payload.promotion.id },
      });

      if (!promotion) {
        return NextResponse.json({
          success: true,
          data: {
            customer: payload.customer,
            isValid: false,
            message: "Promotion not found",
          },
        });
      }

      if (!promotion.isActive || !promotion.isApproved) {
        return NextResponse.json({
          success: true,
          data: {
            customer: payload.customer,
            isValid: false,
            message: "Promotion is not active",
          },
        });
      }

      if (new Date(promotion.endDate) < new Date()) {
        return NextResponse.json({
          success: true,
          data: {
            customer: payload.customer,
            isValid: false,
            message: "Promotion has expired",
          },
        });
      }

      // Increment redemption count
      await prisma.barPromotion.update({
        where: { id: promotion.id },
        data: { redemptions: { increment: 1 } },
      });

      promotionResult = {
        id: promotion.id,
        title: promotion.title,
        type: promotion.type,
      };
    }

    // Create scan record
    await prisma.vIPPassScan.create({
      data: {
        vipPassId: "pending", // Placeholder - will link to actual VIP pass later
        barId,
        scannedById: decoded.id,
        qrCode: qrData.substring(0, 100),
        customerName: payload.customer.name,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        customer: payload.customer,
        promotion: promotionResult,
        isValid: true,
        message: promotionResult
          ? `${payload.customer.name} successfully redeemed ${promotionResult.title}!`
          : `${payload.customer.name} checked in successfully!`,
      },
    });
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
