// GET /api/auth/admin/staff/pending — List inactive BarStaff awaiting approval
// PATCH /api/auth/admin/staff/pending — Approve (activate) a pending BarStaff
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { authService } from "@/services/auth-service";
import { sendWelcomeEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const pending = await prisma.barStaff.findMany({
      where: { isActive: false },
      include: {
        bar: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ pending });
  } catch (error) {
    console.error("Fetch pending staff error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { staffId } = await request.json();
    if (!staffId) {
      return NextResponse.json(
        { error: "staffId is required" },
        { status: 400 },
      );
    }

    const staff = await prisma.barStaff.findUnique({
      where: { id: staffId },
      include: { bar: { select: { id: true, name: true } } },
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Staff record not found" },
        { status: 404 },
      );
    }

    if (staff.isActive) {
      return NextResponse.json(
        { error: "Staff is already active" },
        { status: 400 },
      );
    }

    // Activate the staff record
    const updated = await prisma.barStaff.update({
      where: { id: staffId },
      data: { isActive: true },
    });

    // Mark bar as verified when approving the bar owner
    if (staff.role === "OWNER") {
      await prisma.bar.update({
        where: { id: staff.barId },
        data: { isVerified: true, status: "VERIFIED" },
      });
    }

    // Send welcome email
    try {
      await sendWelcomeEmail({
        to: staff.email,
        name: staff.name,
        barName: staff.bar?.name || "your bar",
        barId: staff.barId,
      });
    } catch (emailError) {
      console.warn("Staff approved but welcome email failed:", emailError);
    }

    return NextResponse.json({
      success: true,
      staff: updated,
    });
  } catch (error) {
    console.error("Approve staff error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
