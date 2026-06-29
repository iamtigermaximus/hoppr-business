// PATCH /api/auth/admin/claims/[id]
// DELETE /api/auth/admin/claims/[id]
// Approve, reject, or delete a bar claim

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { authService } from "@/services/auth-service";

type AuthResult =
  | { error: NextResponse; user?: undefined }
  | { error?: undefined; user: Record<string, unknown> };

// Shared auth guard
async function requireSuperAdmin(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const token = authHeader.substring(7);
  const authResult = await authService.validateToken(token);
  if (authResult.type !== "admin" || authResult.user.adminRole !== "SUPER_ADMIN") {
    return { error: NextResponse.json({ error: "Super admin access required" }, { status: 403 }) };
  }
  return { user: authResult.user as Record<string, unknown> };
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const auth = await requireSuperAdmin(request);
    if (auth.error) return auth.error;

    const { id: claimId } = await params;

    const existing = await prisma.barClaim.findUnique({
      where: { id: claimId },
      select: { id: true, status: true, bar: { select: { id: true, name: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    const barId = existing.bar?.id;
    await prisma.barClaim.delete({ where: { id: claimId } });

    // Revert bar to UNCLAIMED if no remaining claims
    if (barId) {
      const remainingClaims = await prisma.barClaim.count({
        where: { barId, status: "CLAIMED" },
      });
      if (remainingClaims === 0) {
        await prisma.bar.update({
          where: { id: barId },
          data: { status: "UNCLAIMED" },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Claim for "${existing.bar.name}" deleted.`,
    });
  } catch (error) {
    console.error("Delete claim error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const auth = await requireSuperAdmin(request);
    if (auth.error) return auth.error;

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
      include: {
        bar: true,
        user: { select: { id: true, email: true } },
      },
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

    // Capture reviewer info before the transaction (cast from Record<string, unknown>)
    const reviewerId = auth.user.id as string;
    const reviewerName = auth.user.name as string;
    const reviewerEmail = auth.user.email as string;

    // Update the claim and bar in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the claim
      const updatedClaim = await tx.barClaim.update({
        where: { id: claimId },
        data: {
          status,
          notes: notes || existingClaim.notes,
          // reviewedById references the User table, but admin reviewers are in AdminUser
          // Store reviewer identity in the audit log instead
          reviewedAt: new Date(),
        },
      });

      // If approved, update the bar status and activate pending staff
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

        // Activate any pending staff records for the claiming user on this bar
        // Match by userId or by email (staff invites may not have userId linked yet)
        const staffWhere: any = {
          barId: existingClaim.barId,
          isActive: false,
        };
        if (existingClaim.user?.email) {
          staffWhere.OR = [
            { userId: existingClaim.userId },
            { email: existingClaim.user.email },
          ];
        } else {
          staffWhere.userId = existingClaim.userId;
        }
        await tx.barStaff.updateMany({
          where: staffWhere,
          data: { isActive: true },
        });
      }

      // If rejected, revert bar to UNCLAIMED if no other pending claims exist
      if (status === "REJECTED") {
        const remainingClaims = await tx.barClaim.count({
          where: {
            barId: existingClaim.barId,
            status: "CLAIMED",
            id: { not: claimId },
          },
        });
        if (remainingClaims === 0) {
          await tx.bar.update({
            where: { id: existingClaim.barId },
            data: { status: "UNCLAIMED" },
          });
        }
      }

      // Create audit log (userId omitted — admin reviewers are in AdminUser, not User table)
      await tx.auditLog.create({
        data: {
          barId: existingClaim.barId,
          action: status === "VERIFIED" ? "APPROVE_CLAIM" : "REJECT_CLAIM",
          resource: "BarClaim",
          details: {
            claimId,
            barName: existingClaim.bar.name,
            previousStatus: existingClaim.status,
            newStatus: status,
            notes: notes || null,
            reviewedBy: { id: reviewerId, name: reviewerName, email: reviewerEmail },
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
