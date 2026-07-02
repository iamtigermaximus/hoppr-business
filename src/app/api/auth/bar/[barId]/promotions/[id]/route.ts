// src/app/api/auth/bar/[barId]/promotions/[id]/route.ts
// src/app/api/auth/bar/[barId]/promotions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";

// GET - Fetch single promotion details
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

    const promotion = await prisma.barPromotion.findFirst({
      where: { id, barId },
      include: {
        usageHistory: {
          orderBy: { usageCount: "desc" },
        },
      },
    });

    if (!promotion) {
      return NextResponse.json(
        { error: "Promotion not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      promotion,
    });
  } catch (error) {
    console.error("Fetch promotion detail error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH - Update promotion (approval status and/or image)
export async function PATCH(
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

    const body = await request.json();
    const { isApproved, imageUrl, isActive, accentColor, callToAction } = body as {
      isApproved?: boolean;
      imageUrl?: string | null;
      isActive?: boolean;
      accentColor?: string | null;
      callToAction?: string | null;
    };

    // Build update data — only include fields that were actually sent
    const updateData: Record<string, unknown> = {};

    if (typeof isApproved === "boolean") {
      if (isApproved) {
        // Approving makes it visible
        updateData.isApproved = true;
        updateData.isActive = true;
      } else {
        updateData.isApproved = false;
      }
    }

    // Allow updating image/metadata without role gate (any staff can set image)
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (accentColor !== undefined) updateData.accentColor = accentColor;
    if (callToAction !== undefined) updateData.callToAction = callToAction;
    if (typeof isActive === "boolean") updateData.isActive = isActive;

    // If only non-approval fields are being updated, any staff role is fine
    // If isApproved is being set, require elevated role
    if (typeof isApproved === "boolean") {
      const allowedRoles = ["OWNER", "MANAGER", "PROMOTIONS_MANAGER"];
      if (!allowedRoles.includes(payload.staffRole)) {
        return NextResponse.json(
          { error: "Insufficient permissions to approve promotions" },
          { status: 403 },
        );
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const promotion = await prisma.barPromotion.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Promotion updated",
      promotion,
    });
  } catch (error) {
    console.error("Update promotion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE - Delete promotion
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

    const allowedRoles = ["OWNER", "MANAGER", "PROMOTIONS_MANAGER"];
    if (!allowedRoles.includes(payload.staffRole)) {
      return NextResponse.json(
        { error: "Insufficient permissions to delete promotions" },
        { status: 403 },
      );
    }

    await prisma.barPromotion.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Promotion deleted successfully",
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
