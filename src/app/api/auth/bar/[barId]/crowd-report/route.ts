import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";

// POST /api/auth/bar/[barId]/crowd-report — submit a crowd report
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
): Promise<NextResponse> {
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
    const { level } = body;

    if (!level || !["QUIET", "GETTING_BUSY", "BUSY", "PACKED", "AT_CAPACITY"].includes(level)) {
      return NextResponse.json({ error: "Invalid crowd level" }, { status: 400 });
    }

    const now = new Date();
    const report = await prisma.crowdReport.create({
      data: {
        barId,
        level,
        reportedBy: payload.userId,
        reportedAt: now,
        expiresAt: new Date(now.getTime() + 2 * 3600000), // 2 hours
      },
      select: {
        id: true,
        level: true,
        reportedAt: true,
        expiresAt: true,
      },
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("Crowd report error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// GET /api/auth/bar/[barId]/crowd-report — current status + history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
): Promise<NextResponse> {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isBarStaffToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { barId } = await params;
    if (payload.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "7d";

    const days = range === "30d" ? 30 : range === "90d" ? 90 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Current: most recent non-expired report
    const current = await prisma.crowdReport.findFirst({
      where: { barId, expiresAt: { gte: new Date() } },
      orderBy: { reportedAt: "desc" },
      select: {
        id: true,
        level: true,
        reportedAt: true,
        expiresAt: true,
        reporter: { select: { name: true } },
      },
    });

    // History: all reports within the range
    const history = await prisma.crowdReport.findMany({
      where: { barId, reportedAt: { gte: startDate } },
      orderBy: { reportedAt: "desc" },
      take: 200,
      select: {
        id: true,
        level: true,
        reportedAt: true,
        reporter: { select: { name: true } },
      },
    });

    // Stats
    const reportsToday = await prisma.crowdReport.count({
      where: {
        barId,
        reportedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    });

    return NextResponse.json({
      current: current
        ? {
            id: current.id,
            level: current.level,
            reportedAt: current.reportedAt.toISOString(),
            expiresAt: current.expiresAt.toISOString(),
            reportedBy: current.reporter.name,
          }
        : null,
      history: history.map((r) => ({
        id: r.id,
        level: r.level,
        reportedAt: r.reportedAt.toISOString(),
        reportedBy: r.reporter.name,
      })),
      reportsToday,
    });
  } catch (error) {
    console.error("Crowd report error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
