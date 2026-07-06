import { NextRequest, NextResponse } from "next/server";
import { aggregateYesterday } from "@/lib/analytics/aggregator";
import { acquireLock, releaseLock } from "@/lib/cron-lock";
import { handleApiError } from "@/lib/api-error";

/**
 * POST /api/cron/analytics-aggregation
 *
 * Called daily (shortly after midnight UTC) to roll up yesterday's
 * raw AnalyticsEvent rows into pre-aggregated BarDailyStats.
 *
 * Vercel Cron config (vercel.json):
 *   { "path": "/api/cron/analytics-aggregation", "schedule": "0 1 * * *" }
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Prevent overlapping runs
  const lock = await acquireLock("analytics-aggregation", 30 * 60 * 1000); // 30 min max
  if (!lock) {
    return NextResponse.json({ success: true, skipped: true, reason: "Lock held" });
  }

  try {
    const result = await aggregateYesterday();

    return NextResponse.json({
      success: true,
      barsProcessed: result.barsProcessed,
      errors: result.errors.length > 0 ? result.errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error, "Analytics aggregation cron");
  } finally {
    await releaseLock("analytics-aggregation");
  }
}

// Vercel Cron sends GET for health checks
export async function GET() {
  return NextResponse.json({ status: "ok", description: "Analytics aggregation cron endpoint" });
}
