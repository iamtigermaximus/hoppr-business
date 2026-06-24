// src/app/api/auth/bar/[barId]/passes/[id]/route.ts
// Bar dashboard — single VIP pass: get, update, deactivate

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";

interface UpdatePassBody {
  name?: string;
  description?: string | null;
  type?: string;
  priceCents?: number;
  originalPriceCents?: number | null;
  benefits?: string[];
  skipLinePriority?: boolean;
  coverFeeIncluded?: boolean;
  coverFeeAmount?: number;
  validityStart?: string;
  validityEnd?: string;
  validDays?: string[];
  totalQuantity?: number;
  maxPerUser?: number;
  isActive?: boolean;
  isApproved?: boolean;
  redemptionMode?: string;
  maxRedemptions?: number | null;
}

const VALID_TYPES = ["SKIP_LINE", "COVER_INCLUDED", "PREMIUM_ENTRY", "DRINK_PACKAGE"];

// GET — single pass with sales data and recent purchasers
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string; id: string }> },
) {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isBarStaffToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { barId, id } = await params;
    if (payload.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const pass = await prisma.vIPPassEnhanced.findFirst({
      where: { id, barId },
      include: {
        userPasses: {
          orderBy: { purchasedAt: "desc" },
          take: 50,
          include: {
            user: {
              select: { id: true, name: true, email: true, username: true },
            },
          },
        },
      },
    });

    if (!pass) {
      return NextResponse.json({ error: "Pass not found" }, { status: 404 });
    }

    // Compute revenue
    const revenue = pass.soldCount * pass.priceCents;

    return NextResponse.json({
      success: true,
      pass: {
        id: pass.id,
        name: pass.name,
        description: pass.description,
        type: pass.type,
        priceCents: pass.priceCents,
        originalPriceCents: pass.originalPriceCents,
        benefits: pass.benefits,
        skipLinePriority: pass.skipLinePriority,
        coverFeeIncluded: pass.coverFeeIncluded,
        coverFeeAmount: pass.coverFeeAmount,
        validityStart: pass.validityStart.toISOString(),
        validityEnd: pass.validityEnd.toISOString(),
        validDays: pass.validDays,
        totalQuantity: pass.totalQuantity,
        soldCount: pass.soldCount,
        maxPerUser: pass.maxPerUser,
        redemptionMode: pass.redemptionMode,
        maxRedemptions: pass.maxRedemptions,
        isActive: pass.isActive,
        isApproved: pass.isApproved,
        createdAt: pass.createdAt.toISOString(),
        revenueCents: revenue,
        purchasers: pass.userPasses.map((up) => ({
          id: up.id,
          userId: up.userId,
          userName: up.user.name || up.user.username || up.user.email,
          userEmail: up.user.email,
          purchasePriceCents: up.purchasePriceCents,
          status: up.status,
          scannedAt: up.scannedAt?.toISOString() ?? null,
          purchasedAt: up.purchasedAt.toISOString(),
          expiresAt: up.expiresAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("Fetch bar pass error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT — update a VIP pass
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string; id: string }> },
) {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isBarStaffToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { barId, id } = await params;
    if (payload.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allowedRoles = ["OWNER", "MANAGER"];
    if (!payload.staffRole || !allowedRoles.includes(payload.staffRole)) {
      return NextResponse.json(
        { error: "Only owners and managers can update VIP passes" },
        { status: 403 },
      );
    }

    const existing = await prisma.vIPPassEnhanced.findFirst({
      where: { id, barId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Pass not found" }, { status: 404 });
    }

    const body = (await request.json()) as UpdatePassBody;

    if (body.type && !VALID_TYPES.includes(body.type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.priceCents !== undefined) updateData.priceCents = body.priceCents;
    if (body.originalPriceCents !== undefined) updateData.originalPriceCents = body.originalPriceCents;
    if (body.benefits !== undefined) updateData.benefits = body.benefits;
    if (body.skipLinePriority !== undefined) updateData.skipLinePriority = body.skipLinePriority;
    if (body.coverFeeIncluded !== undefined) updateData.coverFeeIncluded = body.coverFeeIncluded;
    if (body.coverFeeAmount !== undefined) updateData.coverFeeAmount = body.coverFeeAmount;
    if (body.validityStart !== undefined) updateData.validityStart = new Date(body.validityStart);
    if (body.validityEnd !== undefined) updateData.validityEnd = new Date(body.validityEnd);
    if (body.validDays !== undefined) updateData.validDays = body.validDays;
    if (body.totalQuantity !== undefined) updateData.totalQuantity = body.totalQuantity;
    if (body.maxPerUser !== undefined) updateData.maxPerUser = body.maxPerUser;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.isApproved !== undefined) {
      updateData.isApproved = body.isApproved;
      updateData.approvedAt = body.isApproved ? new Date() : null;
    }
    if (body.redemptionMode !== undefined) updateData.redemptionMode = body.redemptionMode;
    if (body.maxRedemptions !== undefined) updateData.maxRedemptions = body.maxRedemptions;

    const pass = await prisma.vIPPassEnhanced.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "VIP pass updated",
      pass: {
        id: pass.id,
        name: pass.name,
        type: pass.type,
        priceCents: pass.priceCents,
        totalQuantity: pass.totalQuantity,
        soldCount: pass.soldCount,
        redemptionMode: pass.redemptionMode,
        maxRedemptions: pass.maxRedemptions,
        isActive: pass.isActive,
      },
    });
  } catch (error) {
    console.error("Update bar pass error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE — deactivate a VIP pass (doesn't actually delete for audit trail)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string; id: string }> },
) {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isBarStaffToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { barId, id } = await params;
    if (payload.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allowedRoles = ["OWNER", "MANAGER"];
    if (!payload.staffRole || !allowedRoles.includes(payload.staffRole)) {
      return NextResponse.json(
        { error: "Only owners and managers can deactivate VIP passes" },
        { status: 403 },
      );
    }

    const existing = await prisma.vIPPassEnhanced.findFirst({
      where: { id, barId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Pass not found" }, { status: 404 });
    }

    // Soft-delete: set isActive = false
    await prisma.vIPPassEnhanced.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: "VIP pass deactivated",
    });
  } catch (error) {
    console.error("Deactivate bar pass error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
