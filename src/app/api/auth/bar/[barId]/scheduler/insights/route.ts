/**
 * GET /api/auth/bar/[barId]/scheduler/insights — view optimal send times
 *
 * Shows the bar's busyness patterns and recommended send windows.
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

  // Get busyness patterns, grouped by day of week
  const patterns = await prisma.barBusynessPattern.findMany({
    where: { barId },
    orderBy: [{ dayOfWeek: "asc" }, { hour: "asc" }],
  });

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Group by day of week
  const byDay = new Map<number, typeof patterns>();
  for (const p of patterns) {
    if (!byDay.has(p.dayOfWeek)) byDay.set(p.dayOfWeek, []);
    byDay.get(p.dayOfWeek)!.push(p);
  }

  const days = [...byDay.entries()]
    .sort(([a], [b]) => a - b)
    .map(([dow, entries]) => {
      const rampUp = entries.find((e) => e.rampUpHour !== null);
      const peak = entries.reduce((a, b) =>
        a.avgLevel > b.avgLevel ? a : b,
      );

      return {
        day: dayNames[dow],
        dayOfWeek: dow,
        peakHour: peak.hour,
        peakLevel: peak.avgLevel.toFixed(1),
        recommendedSendHour: rampUp?.rampUpHour ?? peak.hour - 1,
        sampleCount: entries.reduce((s, e) => s + e.sampleCount, 0),
        hourly: entries.map((e) => ({
          hour: e.hour,
          level: e.avgLevel.toFixed(1),
          isRampUp: rampUp?.id === e.id,
        })),
      };
    });

  const hasData = patterns.length > 0;

  return NextResponse.json(
    {
      hasData,
      days,
      message: hasData
        ? "Times shown are in UTC. Send 30-60 min before the recommended hour for best results."
        : "Not enough crowd data yet. Once users start reporting crowd levels at this bar, optimal send times will appear here. Usually takes about a week of reports.",
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=1800",
      },
    },
  );
}
