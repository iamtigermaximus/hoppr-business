/**
 * Cron: Retargeting engine
 *
 * Finds users who match retargeting rules (viewed bar but didn't follow,
 * followed but haven't visited) and sends them push notifications.
 *
 * Schedule (Vercel cron): every 2 hours
 */

import { NextResponse } from "next/server";
import { runRetargetingForAllBars } from "@/lib/retargeting/engine";

export async function GET(request: Request): Promise<NextResponse> {
  // Auth: CRON_SECRET bearer token
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!authHeader || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await runRetargetingForAllBars();

    const summary = {
      bars: results.length,
      totalSent: results.reduce((s, r) => s + r.sent, 0),
      totalCandidates: results.reduce((s, r) => s + r.candidates, 0),
      skippedCooldown: results.reduce((s, r) => s + r.skippedCooldown, 0),
      skippedNoDevice: results.reduce((s, r) => s + r.skippedNoDevice, 0),
      skippedCap: results.reduce((s, r) => s + r.skippedCap, 0),
    };

    console.log("[Retargeting] Cron complete:", summary);
    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    console.error("[Retargeting] Cron failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
