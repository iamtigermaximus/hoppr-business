// src/app/api/auth/bar/[barId]/plan/route.ts
// Returns the bar's current subscription plan, usage vs limits, and upgrade path.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";
import { getPlanLimits, getPlanUpgradePath, checkPlanLimit } from "@/lib/plan-limits";
import { handleApiError } from "@/lib/api-error";

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

    // Fetch bar with counts
    const bar = await prisma.bar.findUnique({
      where: { id: barId },
      select: {
        id: true,
        name: true,
        plan: true,
        _count: {
          select: {
            promotions: true,
            staff: true,
            vipPassesEnhanced: true,
            adCampaigns: true,
          },
        },
      },
    });

    if (!bar) {
      return NextResponse.json({ error: "Bar not found" }, { status: 404 });
    }

    const limits = getPlanLimits(bar.plan);

    // Check each resource against plan limits
    const usage = {
      promotions: checkPlanLimit(bar.plan, "promotions", bar._count.promotions),
      staff: checkPlanLimit(bar.plan, "staff", bar._count.staff),
      passes: checkPlanLimit(bar.plan, "passes", bar._count.vipPassesEnhanced),
      adCampaigns: checkPlanLimit(bar.plan, "adCampaigns", bar._count.adCampaigns),
    };

    // Build features list with availability
    const features = [
      {
        key: "aiGeneration",
        label: "AI Promotion Generator",
        description: "Generate promotions automatically with AI suggestions",
        included: limits.aiGeneration,
      },
      {
        key: "retargeting",
        label: "Customer Retargeting",
        description: "Auto-reach customers who viewed but didn't redeem",
        included: limits.retargeting,
      },
      {
        key: "analyticsExport",
        label: "Analytics Export",
        description: "Download CSV reports of your promotion performance",
        included: limits.analyticsExport,
      },
      {
        key: "whiteLabel",
        label: "White Label",
        description: "Remove Hoppr branding from your customer-facing pages",
        included: limits.whiteLabel,
      },
    ];

    return NextResponse.json({
      success: true,
      plan: {
        current: bar.plan,
        label: limits.label,
        description: limits.description,
        upgradePath: getPlanUpgradePath(bar.plan),
        usage,
        features,
        cachedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error, "Plan fetch error");
  }
}
