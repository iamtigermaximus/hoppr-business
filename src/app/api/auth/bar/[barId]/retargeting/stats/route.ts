/**
 * GET /api/auth/bar/[barId]/retargeting/stats — retargeting performance stats
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";

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

  // Stats for the last 30 days
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [actions, campaigns] = await Promise.all([
    prisma.retargetingAction.groupBy({
      by: ["rule", "status"],
      where: { barId, sentAt: { gte: since } },
      _count: true,
    }),
    prisma.retargetingCampaign.findMany({
      where: { barId },
      select: { rule: true, enabled: true, maxPerDay: true },
    }),
  ]);

  // Build per-rule stats
  const ruleStats = campaigns.map((c) => {
    const sent =
      actions.find((a) => a.rule === c.rule && a.status === "sent")?._count ??
      0;
    const opened =
      actions.find((a) => a.rule === c.rule && a.status === "opened")?._count ??
      0;
    const converted =
      actions.find(
        (a) => a.rule === c.rule && a.status === "converted",
      )?._count ?? 0;

    return {
      rule: c.rule,
      enabled: c.enabled,
      maxPerDay: c.maxPerDay,
      sent,
      opened,
      converted,
      openRate: sent > 0 ? ((opened / sent) * 100).toFixed(1) : "0.0",
      conversionRate: sent > 0 ? ((converted / sent) * 100).toFixed(1) : "0.0",
    };
  });

  return NextResponse.json(
    { rules: ruleStats },
    {
      headers: {
        "Cache-Control": "public, max-age=120, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
