// PATCH /api/auth/admin/claims/[id]
// Approve or reject a bar claim

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { authService } from "@/services/auth-service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const authResult = await authService.validateToken(token);

    if (
      authResult.type !== "admin" ||
      authResult.user.adminRole !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        { error: "Super admin access required" },
        { status: 403 }
      );
    }

    const { id: claimId } = await params;
    const { status, notes } = await request.json();

    if (!status || !["VERIFIED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be VERIFIED or REJECTED" },
        { status: 400 }
      );
    }

    // Check if claim exists and is still pending
    const existingClaim = await prisma.barClaim.findUnique({
      where: { id: claimId },
      include: { bar: true },
    });

    if (!existingClaim) {
      return NextResponse.json(
        { error: "Claim not found" },
        { status: 404 }
      );
    }

    if (existingClaim.status !== "CLAIMED") {
      return NextResponse.json(
        { error: `Claim already ${existingClaim.status.toLowerCase()}` },
        { status: 409 }
      );
    }

    // Update the claim and bar in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the claim
      const updatedClaim = await tx.barClaim.update({
        where: { id: claimId },
        data: {
          status,
          notes: notes || existingClaim.notes,
          reviewedById: authResult.user.id,
          reviewedAt: new Date(),
        },
      });

      // If approved, update the bar status
      if (status === "VERIFIED") {
        await tx.bar.update({
          where: { id: existingClaim.barId },
          data: {
            status: "VERIFIED",
            isVerified: true,
            claimedAt: new Date(),
            claimedById: existingClaim.userId,
          },
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: authResult.user.id,
          barId: existingClaim.barId,
          action: status === "VERIFIED" ? "APPROVE_CLAIM" : "REJECT_CLAIM",
          resource: "BarClaim",
          details: {
            claimId,
            barName: existingClaim.bar.name,
            previousStatus: existingClaim.status,
            newStatus: status,
            notes: notes || null,
          },
        },
      });

      return updatedClaim;
    });

    return NextResponse.json({
      success: true,
      claim: {
        id: result.id,
        status: result.status,
        reviewedAt: result.reviewedAt,
      },
      message:
        status === "VERIFIED"
          ? "Claim approved. Bar is now verified."
          : "Claim rejected.",
    });
  } catch (error) {
    console.error("Update claim error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
