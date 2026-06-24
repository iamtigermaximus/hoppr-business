// src/app/api/auth/bar/[barId]/campaigns/route.ts
// Bar dashboard ad campaign management — list and create campaigns

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";

const VALID_TYPES = ["FEATURED_LISTING", "BANNER_AD", "BOOSTED_PROMO", "SPONSORED_EVENT"];

// GET — list ad campaigns for this bar
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
    const status = searchParams.get("status") || "all";
    const type = searchParams.get("type");

    const where: Record<string, unknown> = { barId };
    if (status === "active") where.status = "ACTIVE";
    else if (status === "draft") where.status = "DRAFT";
    else if (status === "ended") {
      where.OR = [{ status: "COMPLETED" }, { status: "CANCELLED" }];
    }
    if (type && VALID_TYPES.includes(type)) where.type = type;

    const campaigns = await prisma.adCampaign.findMany({
      where,
      include: {
        bar: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = campaigns.map((c) => ({
      id: c.id,
      barId: c.barId,
      title: c.title,
      description: c.description,
      type: c.type,
      status: c.status,
      budgetCents: c.budgetCents,
      spentCents: c.spentCents,
      impressions: c.impressions,
      clicks: c.clicks,
      conversions: c.conversions,
      startDate: c.startDate.toISOString(),
      endDate: c.endDate.toISOString(),
      imageUrl: c.imageUrl,
      targetUrl: c.targetUrl,
      promotedItemId: c.promotedItemId,
      complianceStatus: c.complianceStatus,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));

    return NextResponse.json({ success: true, campaigns: formatted });
  } catch (error) {
    console.error("Fetch campaigns error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST — create a new ad campaign
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

    const allowedRoles = ["OWNER", "MANAGER"];
    if (!payload.staffRole || !allowedRoles.includes(payload.staffRole)) {
      return NextResponse.json(
        { error: "Only owners and managers can create campaigns" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { title, description, type, budgetCents, startDate, endDate, imageUrl, targetUrl, promotedItemId } = body;

    if (!title || !type || !budgetCents || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields: title, type, budgetCents, startDate, endDate" },
        { status: 400 },
      );
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` },
        { status: 400 },
      );
    }

    // OWNER/MANAGER get auto-approved (only they can create campaigns)
    const initialStatus = "ACTIVE";
    const initialCompliance = "COMPLIANT";

    const campaign = await prisma.adCampaign.create({
      data: {
        barId,
        title,
        description: description || null,
        type: type as any,
        budgetCents,
        status: initialStatus,
        spentCents: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        imageUrl: imageUrl || null,
        targetUrl: targetUrl || null,
        promotedItemId: promotedItemId || null,
        complianceStatus: initialCompliance,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Campaign created successfully",
      campaign: {
        id: campaign.id,
        title: campaign.title,
        type: campaign.type,
        status: campaign.status,
        budgetCents: campaign.budgetCents,
      },
    });
  } catch (error) {
    console.error("Create campaign error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
