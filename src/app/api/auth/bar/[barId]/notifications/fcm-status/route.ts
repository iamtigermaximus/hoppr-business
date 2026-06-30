// GET /api/auth/bar/[barId]/notifications/fcm-status
// Returns whether Firebase Cloud Messaging is configured and ready.

import { NextRequest, NextResponse } from "next/server";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";
import { isPushConfigured, getInitError } from "@/lib/notifications";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
): Promise<NextResponse> {
  const payload = verifyAuthHeader(request);
  if (!payload || !isBarStaffToken(payload)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { barId } = await params;
  if (payload.barId !== barId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    configured: isPushConfigured(),
    error: getInitError(),
  });
}
