/**
 * Cron: Busyness pattern aggregation
 *
 * Aggregates CrowdReport data into BarBusynessPattern for all bars.
 * This is the data foundation for the AI Marketing Scheduler.
 *
 * Schedule (Vercel cron): daily at 02:00 UTC
 */

import { NextResponse } from "next/server";
import { aggregateAllBars } from "@/lib/scheduler/busyness-aggregator";

export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!authHeader || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await aggregateAllBars();

    const summary = {
      bars: results.length,
      patternsUpserted: results.reduce((s, r) => s + r.patternsUpserted, 0),
    };

    console.log("[Busyness] Cron complete:", summary);
    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    console.error("[Busyness] Cron failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
