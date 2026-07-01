// src/app/api/auth/bar/[barId]/events/route.ts
// Bar dashboard event management — list and create events

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";
import { scanCompliance, complianceSummary } from "@/lib/compliance-engine";

interface CreateEventBody {
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  maxAttendees?: number;
  isPrivate?: boolean;
  imageUrl?: string;
}

// GET — list events for this bar
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

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all"; // all | upcoming | past
    const search = searchParams.get("search") || undefined;
    const sortBy = (searchParams.get("sortBy") || "startTime") as
      | "startTime"
      | "title"
      | "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "25")),
    );
    const skip = (page - 1) * limit;

    const now = new Date();
    let whereCondition: Record<string, unknown> = { venueId: barId };

    if (filter === "upcoming") {
      whereCondition = { venueId: barId, startTime: { gte: now } };
    } else if (filter === "past") {
      whereCondition = { venueId: barId, startTime: { lt: now } };
    }

    // Search — match title OR description
    if (search) {
      whereCondition.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Sort — only allow known columns
    const validSortColumns = ["startTime", "title", "createdAt"];
    const orderColumn = validSortColumns.includes(sortBy) ? sortBy : "startTime";
    const orderDirection = sortOrder === "asc" ? "asc" : "desc";

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where: whereCondition as any,
        orderBy: { [orderColumn]: orderDirection },
        skip,
        take: limit,
        include: {
          _count: { select: { participants: true } },
        },
      }),
      prisma.event.count({ where: whereCondition as any }),
    ]);

    const formatted = events.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      startTime: e.startTime.toISOString(),
      endTime: e.endTime?.toISOString() ?? null,
      maxAttendees: e.maxAttendees,
      isPrivate: e.isPrivate,
      imageUrl: e.imageUrl,
      attendeeCount: e._count.participants,
      complianceStatus: e.complianceStatus,
      createdAt: e.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      events: formatted,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Fetch bar events error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST — create a new event
export async function POST(
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

    const body = (await request.json()) as CreateEventBody;

    if (!body.title || !body.startTime) {
      return NextResponse.json(
        { error: "Missing required fields: title, startTime" },
        { status: 400 },
      );
    }

    // Fetch bar details for venueName and venueType
    const bar = await prisma.bar.findUnique({
      where: { id: barId },
      select: { name: true, type: true },
    });

    if (!bar) {
      return NextResponse.json({ error: "Bar not found" }, { status: 404 });
    }

    // Determine base compliance status by role
    const baseStatus =
      payload.staffRole === "OWNER" || payload.staffRole === "MANAGER"
        ? "COMPLIANT"
        : "PENDING_REVIEW";

    // Resolve the real User.id from BarStaff (JWT stores BarStaff.id, but Event.creatorId references User.id)
    const barStaff = await prisma.barStaff.findUnique({
      where: { id: payload.userId },
      select: { userId: true },
    });
    const creatorUserId = barStaff?.userId;

    if (!creatorUserId) {
      return NextResponse.json(
        { error: "Cannot create event: no linked user account found for this staff member" },
        { status: 400 },
      );
    }

    const event = await prisma.event.create({
      data: {
        title: body.title,
        description: body.description || null,
        venueId: barId,
        venueName: bar.name,
        venueType: bar.type,
        startTime: new Date(body.startTime),
        endTime: body.endTime ? new Date(body.endTime) : null,
        maxAttendees: body.maxAttendees || null,
        isPrivate: body.isPrivate || false,
        imageUrl: body.imageUrl || null,
        creatorId: creatorUserId,
        complianceStatus: baseStatus,
      },
      include: {
        _count: { select: { participants: true } },
      },
    });

    // ---- Compliance check ----
    const compliance = scanCompliance(body.title, body.description);

    let finalComplianceStatus = event.complianceStatus;
    if (compliance.status === "FLAGGED_AUTO") {
      // Auto-flag overrides even manager-created content
      finalComplianceStatus = "FLAGGED_AUTO";
      await prisma.event.update({
        where: { id: event.id },
        data: { complianceStatus: "FLAGGED_AUTO" },
      });
    }

    // Store compliance check record
    await prisma.complianceCheck.create({
      data: {
        eventId: event.id,
        status: finalComplianceStatus,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        violations: compliance.violations as any,
        checkedAt: compliance.checkedAt,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Event created successfully",
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime?.toISOString() ?? null,
        maxAttendees: event.maxAttendees,
        isPrivate: event.isPrivate,
        imageUrl: event.imageUrl,
        attendeeCount: event._count.participants,
        complianceStatus: finalComplianceStatus,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        violations: compliance.violations as any,
        complianceSummary: complianceSummary(compliance),
        createdAt: event.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Create bar event error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
