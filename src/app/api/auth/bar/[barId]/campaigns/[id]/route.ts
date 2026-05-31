// src/app/api/auth/bar/[barId]/campaigns/[id]/route.ts
// Single campaign: GET, PUT (update/status transitions), DELETE

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

const VALID_STATUSES = ["DRAFT", "PENDING_REVIEW", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"];

// GET — single campaign detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string; id: string }> },
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { barId, id } = await params;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verify(token, JWT_SECRET) as JWTPayload;
    if (decoded.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const campaign = await prisma.adCampaign.findUnique({
      where: { id },
      include: {
        bar: { select: { name: true } },
      },
    });

    if (!campaign || campaign.barId !== barId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaign.id,
        barId: campaign.barId,
        title: campaign.title,
        description: campaign.description,
        type: campaign.type,
        status: campaign.status,
        budgetCents: campaign.budgetCents,
        spentCents: campaign.spentCents,
        impressions: campaign.impressions,
        clicks: campaign.clicks,
        conversions: campaign.conversions,
        startDate: campaign.startDate.toISOString(),
        endDate: campaign.endDate.toISOString(),
        imageUrl: campaign.imageUrl,
        targetUrl: campaign.targetUrl,
        promotedItemId: campaign.promotedItemId,
        complianceStatus: campaign.complianceStatus,
        createdAt: campaign.createdAt.toISOString(),
        updatedAt: campaign.updatedAt.toISOString(),
        bar: { name: campaign.bar.name },
      },
    });
  } catch (error) {
    console.error("Fetch campaign error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT — update campaign (partial) with status transitions
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string; id: string }> },
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { barId, id } = await params;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verify(token, JWT_SECRET) as JWTPayload;
    if (decoded.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allowedRoles = ["OWNER", "MANAGER"];
    if (!decoded.staffRole || !allowedRoles.includes(decoded.staffRole)) {
      return NextResponse.json(
        { error: "Only owners and managers can update campaigns" },
        { status: 403 },
      );
    }

    const campaign = await prisma.adCampaign.findUnique({ where: { id } });
    if (!campaign || campaign.barId !== barId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    // Editable fields
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.budgetCents !== undefined) updateData.budgetCents = body.budgetCents;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.targetUrl !== undefined) updateData.targetUrl = body.targetUrl;
    if (body.promotedItemId !== undefined) updateData.promotedItemId = body.promotedItemId;
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate);
    if (body.endDate !== undefined) updateData.endDate = new Date(body.endDate);

    // Status transitions (validated)
    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
          { status: 400 },
        );
      }

      // Enforce valid transitions
      const current = campaign.status;
      const next = body.status as string;
      const validTransitions: Record<string, string[]> = {
        DRAFT: ["PENDING_REVIEW", "CANCELLED"],
        PENDING_REVIEW: ["ACTIVE", "DRAFT", "CANCELLED"],
        ACTIVE: ["PAUSED", "COMPLETED", "CANCELLED"],
        PAUSED: ["ACTIVE", "COMPLETED", "CANCELLED"],
        COMPLETED: [],
        CANCELLED: [],
      };

      const allowed = validTransitions[current] || [];
      if (!allowed.includes(next)) {
        return NextResponse.json(
          { error: `Cannot transition from ${current} to ${next}. Allowed: ${allowed.join(", ") || "none"}` },
          { status: 400 },
        );
      }

      updateData.status = next;
    }

    const updated = await prisma.adCampaign.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Campaign updated",
      campaign: {
        id: updated.id,
        title: updated.title,
        type: updated.type,
        status: updated.status,
        budgetCents: updated.budgetCents,
        spentCents: updated.spentCents,
        impressions: updated.impressions,
        clicks: updated.clicks,
        conversions: updated.conversions,
      },
    });
  } catch (error) {
    console.error("Update campaign error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE — only DRAFT campaigns can be deleted
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string; id: string }> },
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { barId, id } = await params;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verify(token, JWT_SECRET) as JWTPayload;
    if (decoded.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allowedRoles = ["OWNER", "MANAGER"];
    if (!decoded.staffRole || !allowedRoles.includes(decoded.staffRole)) {
      return NextResponse.json(
        { error: "Only owners and managers can delete campaigns" },
        { status: 403 },
      );
    }

    const campaign = await prisma.adCampaign.findUnique({ where: { id } });
    if (!campaign || campaign.barId !== barId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (campaign.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft campaigns can be deleted" },
        { status: 400 },
      );
    }

    await prisma.adCampaign.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Campaign deleted" });
  } catch (error) {
    console.error("Delete campaign error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
