// GET /api/auth/bar/[barId]/notifications/settings
// PATCH /api/auth/bar/[barId]/notifications/settings
// User notification preferences for bar staff

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
) {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isBarStaffToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { barId } = await params;
    if (payload.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get userId via staff record
    const staff = await prisma.barStaff.findUnique({
      where: { id: payload.userId },
      select: { userId: true },
    });

    if (!staff?.userId) {
      return NextResponse.json({ claimNotificationsEnabled: true });
    }

    const user = await prisma.user.findUnique({
      where: { id: staff.userId },
      select: { claimNotificationsEnabled: true },
    });

    return NextResponse.json({
      claimNotificationsEnabled: user?.claimNotificationsEnabled ?? true,
    });
  } catch (error) {
    return handleApiError(error, "Fetch notification settings error");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
) {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isBarStaffToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { barId } = await params;
    if (payload.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { claimNotificationsEnabled } = body as {
      claimNotificationsEnabled?: boolean;
    };

    if (typeof claimNotificationsEnabled !== "boolean") {
      return NextResponse.json(
        { error: "claimNotificationsEnabled must be a boolean" },
        { status: 400 },
      );
    }

    // Get userId via staff record
    const staff = await prisma.barStaff.findUnique({
      where: { id: payload.userId },
      select: { userId: true },
    });

    if (!staff?.userId) {
      return NextResponse.json(
        { error: "No linked user account found" },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: staff.userId },
      data: { claimNotificationsEnabled },
    });

    return NextResponse.json({
      success: true,
      claimNotificationsEnabled,
    });
  } catch (error) {
    return handleApiError(error, "Update notification settings error");
  }
}
