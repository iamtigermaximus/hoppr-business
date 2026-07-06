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
import { acquireLock, releaseLock } from "@/lib/cron-lock";
import { handleApiError } from "@/lib/api-error";

export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!authHeader || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Prevent overlapping runs — runs every 15 min, should complete quickly
  const lock = await acquireLock("scheduler", 10 * 60 * 1000); // 10 min max
  if (!lock) {
    return NextResponse.json({ ok: true, skipped: true, reason: "Lock held" });
  }

  try {
    const results = await processQueue();
    console.log("[Scheduler] Cron complete:", results);
    return NextResponse.json({ ok: true, ...results });
  } catch (error) {
    return handleApiError(error, "Scheduler cron");
  } finally {
    await releaseLock("scheduler");
  }
}
