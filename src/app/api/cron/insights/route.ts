import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  checkGapDetection,
  checkInactivity,
  checkPatterns,
} from "@/lib/insights/triggers";
import { computeWeeklySummary } from "@/lib/insights/aggregator";

const prisma = new PrismaClient();

// Called by Vercel Cron every 3 hours
// vercel.json: { "crons": [{ "path": "/api/cron/insights", "schedule": "0 */3 * * *" }] }
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bars = await prisma.bar.findMany({
    where: { status: { in: ["CLAIMED", "VERIFIED"] } },
    select: { id: true },
  });

  let insightsCreated = 0;

  for (const bar of bars) {
    const checks = await Promise.all([
      checkGapDetection(bar.id),
      checkInactivity(bar.id),
      checkPatterns(bar.id),
    ]);

    for (const insight of checks) {
      if (!insight) continue;

      // Don't create duplicate insights of same type in 24h
      const existing = await prisma.barInsight.findFirst({
        where: {
          barId: bar.id,
          type: insight.type,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          dismissed: false,
        },
      });

      if (existing) continue;

      await prisma.barInsight.create({
        data: {
          barId: bar.id,
          type: insight.type,
          title: insight.title,
          body: insight.body,
          actionLabel: insight.actionLabel,
          actionRoute: insight.actionRoute,
        },
      });

      // Create notification for bar staff
      const staff = await prisma.barStaff.findMany({
        where: {
          barId: bar.id,
          role: { in: ["OWNER", "MANAGER"] },
          userId: { not: null },
        },
        select: { userId: true },
      });

      for (const s of staff) {
        if (s.userId) {
          await prisma.notification.create({
            data: {
              userId: s.userId,
              type: "INSIGHT",
              title: insight.title,
              body: insight.body,
              data: {
                barId: bar.id,
                insightType: insight.type,
                actionRoute: insight.actionRoute,
              },
            },
          });
        }
      }

      insightsCreated++;
    }
  }

  // Monday between 9am-12pm: generate weekly summaries
  const now = new Date();
  if (now.getDay() === 1 && now.getHours() >= 9 && now.getHours() < 12) {
    for (const bar of bars) {
      const summary = await computeWeeklySummary(bar.id);

      if (summary.totalViews === 0) continue;

      const comparison =
        summary.comparisonToLastWeek.percentChange > 0
          ? `up ${summary.comparisonToLastWeek.percentChange}%`
          : summary.comparisonToLastWeek.percentChange < 0
            ? `down ${Math.abs(summary.comparisonToLastWeek.percentChange)}%`
            : "about the same";

      const body = `${summary.totalViews} views · ${summary.totalClicks} clicks · Best day: ${summary.bestDay}. ${comparison} from last week.`;

      await prisma.barInsight.create({
        data: {
          barId: bar.id,
          type: "WEEKLY_SUMMARY",
          title: "Your week in review",
          body,
        },
      });
    }
  }

  return NextResponse.json({ barsChecked: bars.length, insightsCreated });
}

// Vercel Cron sends GET for health checks, POST for actual calls
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
