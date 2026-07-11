/**
 * Cron: Credit threshold alerts
 *
 * Runs checkCreditAlerts() for all configured providers — checks credit
 * pool balances against alert thresholds and sends email notifications.
 * Moved out of the hot-path logUsage() to a periodic check.
 *
 * Schedule (Vercel cron): every 15 minutes
 */

import { NextResponse } from "next/server";
import { checkCreditAlerts } from "@/lib/credit-tracker";
import { acquireLock, releaseLock } from "@/lib/cron-lock";
import { handleApiError } from "@/lib/api-error";

export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!authHeader || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lock = await acquireLock("credit-alerts", 5 * 60 * 1000); // 5 min max
  if (!lock) {
    return NextResponse.json({ ok: true, skipped: true, reason: "Lock held" });
  }

  try {
    const { alerted } = await checkCreditAlerts();
    console.log("[CreditAlerts] Cron complete — alerts fired:", alerted.length > 0 ? alerted.join(", ") : "none");
    return NextResponse.json({ ok: true, alerted });
  } catch (error) {
    return handleApiError(error, "Credit alerts cron");
  } finally {
    await releaseLock("credit-alerts");
  }
}
