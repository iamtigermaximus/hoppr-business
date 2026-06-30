/**
 * GET  /api/auth/bar/[barId]/scheduler/config — read auto-scheduling settings
 * PUT  /api/auth/bar/[barId]/scheduler/config — update auto-scheduling settings
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";

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

  const bar = await prisma.bar.findUnique({
    where: { id: barId },
    select: { autoSchedulingEnabled: true },
  });

  // Count pending scheduled notifications
  const pendingCount = await prisma.scheduledNotification.count({
    where: { barId, status: "PENDING" },
  });

  // Recent sent notifications
  const recentSent = await prisma.scheduledNotification.findMany({
    where: { barId, status: "SENT" },
    orderBy: { sentAt: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      scheduledAt: true,
      sentAt: true,
    },
  });

  return NextResponse.json({
    autoSchedulingEnabled: bar?.autoSchedulingEnabled ?? false,
    pendingCount,
    recentSent,
  });
}

export async function PUT(
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

  const body = await request.json();
  const { autoSchedulingEnabled } = body as {
    autoSchedulingEnabled?: boolean;
  };

  if (typeof autoSchedulingEnabled === "boolean") {
    await prisma.bar.update({
      where: { id: barId },
      data: { autoSchedulingEnabled },
    });
  }

  return NextResponse.json({ ok: true, autoSchedulingEnabled });
}
