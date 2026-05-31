// src/app/api/auth/bar/[barId]/events/route.ts
// Bar dashboard event management — list and create events

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { verify } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface JWTPayload {
  id: string;
  email: string;
  barId: string;
  name: string;
  role: string;
  staffRole?: string;
}

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
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { barId } = await params;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verify(token, JWT_SECRET) as JWTPayload;
    if (decoded.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all"; // all | upcoming | past

    const now = new Date();
    let whereCondition: Record<string, unknown> = { venueId: barId };

    if (filter === "upcoming") {
      whereCondition = { venueId: barId, startTime: { gte: now } };
    } else if (filter === "past") {
      whereCondition = { venueId: barId, startTime: { lt: now } };
    }

    const events = await prisma.event.findMany({
      where: whereCondition,
      orderBy: { startTime: "desc" },
      include: {
        _count: { select: { participants: true } },
      },
    });

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

    return NextResponse.json({ success: true, events: formatted });
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
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { barId } = await params;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verify(token, JWT_SECRET) as JWTPayload;
    if (decoded.barId !== barId) {
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
        creatorId: decoded.id,
        complianceStatus: "COMPLIANT",
      },
      include: {
        _count: { select: { participants: true } },
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
        complianceStatus: event.complianceStatus,
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
