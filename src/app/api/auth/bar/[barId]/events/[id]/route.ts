// src/app/api/auth/bar/[barId]/events/[id]/route.ts
// Bar dashboard — single event: get, update, delete

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";

interface UpdateEventBody {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string | null;
  maxAttendees?: number | null;
  isPrivate?: boolean;
  imageUrl?: string | null;
}

// GET — single event with attendees
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string; id: string }> },
) {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isBarStaffToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { barId, id } = await params;
    if (payload.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const event = await prisma.event.findFirst({
      where: { id, venueId: barId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
                image: true,
              },
            },
          },
        },
        _count: { select: { participants: true } },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        venueId: event.venueId,
        venueName: event.venueName,
        venueType: event.venueType,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime?.toISOString() ?? null,
        maxAttendees: event.maxAttendees,
        isPrivate: event.isPrivate,
        imageUrl: event.imageUrl,
        complianceStatus: event.complianceStatus,
        createdAt: event.createdAt.toISOString(),
        attendeeCount: event._count.participants,
        attendees: event.participants.map((p) => ({
          userId: p.userId,
          name: p.user.name,
          username: p.user.username,
          email: p.user.email,
          image: p.user.image,
          joinedAt: p.joinedAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    return handleApiError(error, "Fetch bar event error");
  }
}

// PUT — update an event
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string; id: string }> },
) {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isBarStaffToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { barId, id } = await params;
    if (payload.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify event belongs to this bar
    const existing = await prisma.event.findFirst({
      where: { id, venueId: barId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const body = (await request.json()) as UpdateEventBody;

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.startTime !== undefined) updateData.startTime = new Date(body.startTime);
    if (body.endTime !== undefined) {
      updateData.endTime = body.endTime ? new Date(body.endTime) : null;
    }
    if (body.maxAttendees !== undefined) updateData.maxAttendees = body.maxAttendees;
    if (body.isPrivate !== undefined) updateData.isPrivate = body.isPrivate;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        _count: { select: { participants: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Event updated",
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
      },
    });
  } catch (error) {
    console.error("Update bar event error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH — approve or reject an event (manager only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string; id: string }> },
) {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isBarStaffToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { barId, id } = await params;
    if (payload.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allowedRoles = ["OWNER", "MANAGER"];
    if (!payload.staffRole || !allowedRoles.includes(payload.staffRole)) {
      return NextResponse.json(
        { error: "Only owners and managers can approve or reject events" },
        { status: 403 },
      );
    }

    const existing = await prisma.event.findFirst({
      where: { id, venueId: barId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const { action } = await request.json();

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "Action must be 'approve' or 'reject'" },
        { status: 400 },
      );
    }

    const newStatus = action === "approve" ? "COMPLIANT" : "REJECTED";

    const event = await prisma.event.update({
      where: { id },
      data: { complianceStatus: newStatus },
    });

    return NextResponse.json({
      success: true,
      message: action === "approve" ? "Event approved" : "Event rejected",
      event: {
        id: event.id,
        title: event.title,
        complianceStatus: event.complianceStatus,
      },
    });
  } catch (error) {
    console.error("Approve/reject event error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE — cancel/delete an event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string; id: string }> },
) {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isBarStaffToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { barId, id } = await params;
    if (payload.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify event belongs to this bar
    const existing = await prisma.event.findFirst({
      where: { id, venueId: barId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    await prisma.event.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Event cancelled",
    });
  } catch (error) {
    console.error("Delete bar event error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
