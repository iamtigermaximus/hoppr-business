/**
 * Cron: Notification scheduler queue processor
 *
 * Processes the ScheduledNotification queue — sends any PENDING
 * notifications whose scheduledAt has arrived.
 *
 * Schedule (Vercel cron): every 15 minutes
 */

import { NextResponse } from "next/server";
import { processQueue } from "@/lib/scheduler/queue-processor";

export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!authHeader || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await processQueue();
    console.log("[Scheduler] Cron complete:", results);
    return NextResponse.json({ ok: true, ...results });
  } catch (err) {
    console.error("[Scheduler] Cron failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
