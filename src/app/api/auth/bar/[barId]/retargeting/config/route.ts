/**
 * GET  /api/auth/bar/[barId]/retargeting/config — read retargeting campaigns
 * PUT  /api/auth/bar/[barId]/retargeting/config — update retargeting campaigns
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";
import { RULE_DEFINITIONS } from "@/lib/retargeting/rules";
import { planHasFeature } from "@/lib/plan-limits";

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

  const [campaigns, bar] = await Promise.all([
    prisma.retargetingCampaign.findMany({
      where: { barId, contentId: "" }, // Only bar-level campaigns; content-specific are auto-managed
      orderBy: { rule: "asc" },
    }),
    prisma.bar.findUnique({
      where: { id: barId },
      select: { retargetingEnabled: true },
    }),
  ]);

  // Return all rules with their current state
  const rules = Object.values(RULE_DEFINITIONS).map((def) => {
    const existing = campaigns.find((c) => c.rule === def.rule);
    return {
      rule: def.rule,
      label: def.label,
      description: def.description,
      enabled: existing?.enabled ?? false,
      maxPerDay: existing?.maxPerDay ?? def.defaultMaxPerDay,
      id: existing?.id ?? null,
    };
  });

  return NextResponse.json({
    retargetingEnabled: bar?.retargetingEnabled ?? false,
    rules,
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

  // Feature gate: retargeting requires PRO or PREMIUM plan
  const barPlan = await prisma.bar.findUnique({
    where: { id: barId },
    select: { plan: true },
  });
  if (barPlan && !planHasFeature(barPlan.plan, "retargeting")) {
    return NextResponse.json(
      { error: "Retargeting requires a PRO or PREMIUM plan. Upgrade to access this feature." },
      { status: 402 },
    );
  }

  const body = await request.json();
  const { retargetingEnabled, rules } = body as {
    retargetingEnabled?: boolean;
    rules?: Array<{
      rule: string;
      enabled?: boolean;
      maxPerDay?: number;
    }>;
  };

  // Update the global toggle
  if (typeof retargetingEnabled === "boolean") {
    await prisma.bar.update({
      where: { id: barId },
      data: { retargetingEnabled },
    });
  }

  // Upsert individual rules
  if (Array.isArray(rules)) {
    for (const rule of rules) {
      const def = RULE_DEFINITIONS[rule.rule as keyof typeof RULE_DEFINITIONS];
      if (!def) continue;

      await prisma.retargetingCampaign.upsert({
        where: { barId_rule_contentId: { barId, rule: def.rule, contentId: "" } },
        create: {
          barId,
          rule: def.rule,
          contentId: "",
          enabled: rule.enabled ?? true,
          maxPerDay: rule.maxPerDay ?? def.defaultMaxPerDay,
        },
        update: {
          enabled: rule.enabled,
          maxPerDay: rule.maxPerDay,
        },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
