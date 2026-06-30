// POST /api/auth/bar/[barId]/social/disconnect
// Removes a social media connection for this bar.

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isBarStaffToken } from "@/lib/auth";
import { prisma } from "@/lib/database";

export async function POST(
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

    const { platform } = await request.json();
    if (!platform || !["instagram", "facebook"].includes(platform)) {
      return NextResponse.json(
        { error: "platform must be 'instagram' or 'facebook'" },
        { status: 400 },
      );
    }

    const platformEnum = platform.toUpperCase() as "INSTAGRAM" | "FACEBOOK";

    // Soft-delete by marking inactive (preserves post history)
    await prisma.barSocialConnection.updateMany({
      where: { barId, platform: platformEnum },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: `${platform} disconnected`,
    });
  } catch (error) {
    console.error("Social disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect" },
      { status: 500 },
    );
  }
}
