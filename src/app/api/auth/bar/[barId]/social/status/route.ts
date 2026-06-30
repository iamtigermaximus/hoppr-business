// GET /api/auth/bar/[barId]/social/status
// Returns the current social media connection status for this bar.

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isBarStaffToken } from "@/lib/auth";
import { prisma } from "@/lib/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || !isBarStaffToken(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { barId } = await params;
    if (payload.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const connections = await prisma.barSocialConnection.findMany({
      where: { barId, isActive: true },
      select: {
        id: true,
        platform: true,
        pageName: true,
        igUsername: true,
        isActive: true,
        tokenExpiresAt: true,
        connectedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      connections,
    });
  } catch (error) {
    console.error("Social status error:", error);
    return NextResponse.json(
      { error: "Failed to get connection status" },
      { status: 500 },
    );
  }
}
