import { NextRequest, NextResponse } from "next/server";
import { aggregateYesterday } from "@/lib/analytics/aggregator";

/**
 * POST /api/cron/analytics-aggregation
 *
 * Called daily (shortly after midnight UTC) to roll up yesterday's
 * raw AnalyticsEvent rows into pre-aggregated BarDailyStats.
 *
 * Vercel Cron config (vercel.json):
 *   { "path": "/api/cron/analytics-aggregation", "schedule": "0 1 * * *" }
 *
 * Concurrency note: This endpoint processes bars sequentially in
 * batches. Each bar's aggregation is a single upsert. At beta scale
 * (<100 bars, ~500 events/bar/day) this completes in under 10 seconds.
 * If it grows, we can parallelize with Promise.allSettled in chunks.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    console.error("Analytics aggregation cron error:", error);
    return NextResponse.json(
      { error: "Aggregation failed", details: String(error) },
      { status: 500 },
    );
  }
}

// Vercel Cron sends GET for health checks
export async function GET() {
  return NextResponse.json({ status: "ok", description: "Analytics aggregation cron endpoint" });
}
