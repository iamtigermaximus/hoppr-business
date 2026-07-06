// src/app/api/auth/bar/[barId]/approvals/route.ts
// Unified pending approvals — promotions and events awaiting manager review

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";

// GET — list all pending items needing approval
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

    // Only owners and managers see the approval queue
    const allowedRoles = ["OWNER", "MANAGER"];
    if (!payload.staffRole || !allowedRoles.includes(payload.staffRole)) {
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

    // Fetch pending passes (isApproved: false)
    const pendingPasses = await prisma.vIPPassEnhanced.findMany({
      where: { barId, isApproved: false },
      orderBy: { createdAt: "desc" },
    });

    // Fetch pending ad campaigns (status: PENDING_REVIEW)
    const pendingCampaigns = await prisma.adCampaign.findMany({
      where: { barId, status: "PENDING_REVIEW" },
      orderBy: { createdAt: "desc" },
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
        passes: pendingPasses.map((p) => ({
          id: p.id,
          title: p.name,
          description: p.description,
          type: p.type,
          priceCents: p.priceCents,
          totalQuantity: p.totalQuantity,
          soldCount: p.soldCount,
          createdAt: p.createdAt.toISOString(),
          itemType: "pass" as const,
        })),
        campaigns: pendingCampaigns.map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          type: c.type,
          budgetCents: c.budgetCents,
          startDate: c.startDate.toISOString(),
          endDate: c.endDate.toISOString(),
          createdAt: c.createdAt.toISOString(),
          itemType: "ad" as const,
        })),
      },
      counts: {
        promotions: pendingPromotions.length,
        events: pendingEvents.length,
        passes: pendingPasses.length,
        campaigns: pendingCampaigns.length,
        total:
          pendingPromotions.length +
          pendingEvents.length +
          pendingPasses.length +
          pendingCampaigns.length,
      },
    });
  } catch (error) {
    return handleApiError(error, "Fetch approvals error");
  }
}
