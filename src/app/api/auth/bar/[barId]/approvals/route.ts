// src/app/api/auth/bar/[barId]/approvals/route.ts
// Unified pending approvals — promotions and events awaiting manager review

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

// GET — list all pending items needing approval
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

    // Only owners and managers see the approval queue
    const allowedRoles = ["OWNER", "MANAGER"];
    if (!decoded.staffRole || !allowedRoles.includes(decoded.staffRole)) {
      return NextResponse.json(
        { error: "Only owners and managers can view the approval queue" },
        { status: 403 },
      );
    }

    // Fetch pending promotions
    const pendingPromotions = await prisma.barPromotion.findMany({
      where: { barId, isApproved: false },
      orderBy: { createdAt: "desc" },
    });

    // Fetch pending events (PENDING_REVIEW compliance status)
    const pendingEvents = await prisma.event.findMany({
      where: { venueId: barId, complianceStatus: "PENDING_REVIEW" },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { participants: true } },
      },
    });

    return NextResponse.json({
      success: true,
      approvals: {
        promotions: pendingPromotions.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          type: p.type,
          discount: p.discount,
          createdAt: p.createdAt.toISOString(),
          itemType: "promotion" as const,
        })),
        events: pendingEvents.map((e) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          startTime: e.startTime.toISOString(),
          endTime: e.endTime?.toISOString() ?? null,
          maxAttendees: e.maxAttendees,
          attendeeCount: e._count.participants,
          createdAt: e.createdAt.toISOString(),
          itemType: "event" as const,
        })),
      },
      counts: {
        promotions: pendingPromotions.length,
        events: pendingEvents.length,
        total: pendingPromotions.length + pendingEvents.length,
      },
    });
  } catch (error) {
    console.error("Fetch approvals error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
