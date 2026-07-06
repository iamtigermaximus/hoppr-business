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
import { acquireLock, releaseLock } from "@/lib/cron-lock";
import { handleApiError } from "@/lib/api-error";

export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!authHeader || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Prevent overlapping runs — daily aggregation, allow generous time
  const lock = await acquireLock("busyness-aggregation", 30 * 60 * 1000); // 30 min max
  if (!lock) {
    return NextResponse.json({ ok: true, skipped: true, reason: "Lock held" });
  }

  try {
    const results = await aggregateAllBars();

    const summary = {
      bars: results.length,
      patternsUpserted: results.reduce((s, r) => s + r.patternsUpserted, 0),
    };

    console.log("[Busyness] Cron complete:", summary);
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    return handleApiError(error, "Busyness cron");
  } finally {
    await releaseLock("busyness-aggregation");
  }
}
