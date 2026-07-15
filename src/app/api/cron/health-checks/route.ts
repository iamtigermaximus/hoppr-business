/**
 * POST /api/cron/health-checks
 *
 * Runs every 5 minutes. Probes all external API dependencies (DeepSeek,
 * BFL Flux, Cloudinary, Resend) and stores results in the HealthCheckResult
 * time-series table. Also snapshots internal metrics (DB latency, API error
 * count, connection pool) for historical trend analysis.
 *
 * Evaluates alert thresholds:
 *  - Service transitions to DOWN → immediate email alert
 *  - Service DEGRADED for 3+ consecutive checks → email alert with warning
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { acquireLock, releaseLock } from "@/lib/cron-lock";
import { handleApiError } from "@/lib/api-error";
import {
  runAllExternalChecks,
  type HealthCheckResult,
  type HealthStatus,
} from "@/lib/health-checks";
import { Resend } from "resend";

const ALERT_EMAIL = process.env.ADMIN_EMAIL || process.env.ALERT_EMAIL || "admin@hoppr.fi";
const FROM = "Hoppr Health <onboarding@resend.dev>";

function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

// ---- Alert helpers ----

async function sendAlert(subject: string, html: string) {
  try {
    const resend = getResendClient();
    if (!resend) {
      console.warn("[HealthChecks] Cannot send alert — RESEND_API_KEY not configured");
      return;
    }
    await resend.emails.send({ from: FROM, to: ALERT_EMAIL, subject, html });
    console.log(`[HealthChecks] Alert sent to ${ALERT_EMAIL}: ${subject}`);
  } catch (err) {
    console.error("[HealthChecks] Failed to send alert:", err);
  }
}

async function sendDownAlert(service: string, result: HealthCheckResult) {
  const html = `<div style="max-width:560px;font-family:system-ui,sans-serif">
<h1 style="color:#dc2626">Service DOWN</h1>
<p><strong>${service}</strong> is unreachable.</p>
<table style="margin:16px 0"><tr><td>Latency</td><td>${result.latencyMs}ms</td></tr></table>
<p style="color:#6b7280">${result.message}</p>
<p style="color:#9ca3af;font-size:12px">Auto-detected by Hoppr health checks. Check the <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/health">health dashboard</a>.</p>
</div>`;
  await sendAlert(`[DOWN] ${service} is unreachable`, html);
}

async function sendDegradedAlert(service: string, avgLatency: number, checks: number) {
  const html = `<div style="max-width:560px;font-family:system-ui,sans-serif">
<h1 style="color:#f59e0b">Service DEGRADED</h1>
<p><strong>${service}</strong> has been degraded for ${checks} consecutive checks.</p>
<table style="margin:16px 0"><tr><td>Average latency</td><td>${avgLatency}ms</td></tr></table>
<p style="color:#6b7280">Bar content generation and image creation may be affected.</p>
<p style="color:#9ca3af;font-size:12px">Auto-detected by Hoppr health checks. Check the <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/health">health dashboard</a>.</p>
</div>`;
  await sendAlert(`[DEGRADED] ${service} — ${avgLatency}ms avg (${checks} checks)`, html);
}

// ---- Threshold evaluation ----

async function evaluateThresholds(results: HealthCheckResult[]) {
  for (const result of results) {
    // Get the last 3 results for this service (including this one)
    const recent = await prisma.healthCheckResult.findMany({
      where: { service: result.service },
      orderBy: { checkedAt: "desc" },
      take: 4, // 4 so we can check "before this" state
      select: { status: true, latencyMs: true },
    });

    const currentStatus = result.status;
    const previousStatus = recent[1]?.status; // the check before this one

    // Immediate alert: service just transitioned to DOWN
    if (currentStatus === "down" && previousStatus !== "down") {
      await sendDownAlert(result.service, result);
    }

    // Degraded trend alert: 3+ consecutive degraded/down checks
    const last3 = recent.slice(0, 3);
    if (last3.length >= 3) {
      const allDegradedOrDown = last3.every(
        (r) => r.status === "degraded" || r.status === "down",
      );
      if (allDegradedOrDown) {
        const prev3 = recent.slice(1, 4);
        const wasAlreadyAlerted = prev3.length >= 3 &&
          prev3.every((r) => r.status === "degraded" || r.status === "down");

        // Only alert if this is the first time we cross the 3-check threshold
        if (!wasAlreadyAlerted) {
          const avgLatency = Math.round(
            last3.reduce((sum, r) => sum + r.latencyMs, 0) / last3.length,
          );
          await sendDegradedAlert(result.service, avgLatency, last3.length);
        }
      }
    }
  }
}

// ---- Route ----

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lock = await acquireLock("health-checks", 2 * 60 * 1000); // 2 min max
  if (!lock) {
    return NextResponse.json({ success: true, skipped: true, reason: "Lock held" });
  }

  try {
    const now = new Date();

    // 1. Run external health checks
    const externalResults = await runAllExternalChecks();

    // 2. Run internal health checks
    const dbStart = performance.now();
    let dbLatencyMs = 0;
    let dbStatus: HealthStatus = "healthy";
    let dbMessage = "";

    try {
      await prisma.$queryRawUnsafe(`SELECT 1`);
      dbLatencyMs = Math.round(performance.now() - dbStart);
      dbStatus = dbLatencyMs <= 100 ? "healthy" : dbLatencyMs <= 200 ? "degraded" : "down";
      dbMessage = `Response time: ${dbLatencyMs}ms`;
    } catch (err) {
      dbLatencyMs = 0;
      dbStatus = "down";
      dbMessage = `Database query failed: ${err instanceof Error ? err.message : "Unknown"}`;
    }

    // API errors in last 24h
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    let errorsLast24h = 0;
    try {
      errorsLast24h = await prisma.auditLog.count({
        where: {
          createdAt: { gte: twentyFourHoursAgo },
          action: { contains: "ERROR", mode: "insensitive" },
        },
      });
    } catch { /* non-critical */ }
    const apiStatus: HealthStatus =
      errorsLast24h > 100 ? "down" : errorsLast24h > 50 ? "degraded" : "healthy";

    // Connection pool
    let poolCount = 0;
    let poolStatus: HealthStatus = "healthy";
    try {
      const poolResult = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
        `SELECT count(*)::int as count FROM pg_stat_activity WHERE datname = current_database()`,
      );
      poolCount = poolResult[0]?.count ?? 0;
      poolStatus = poolCount > 100 ? "down" : poolCount > 50 ? "degraded" : "healthy";
    } catch { /* non-critical */ }

    const internalResults: HealthCheckResult[] = [
      { service: "internal_db", status: dbStatus, latencyMs: dbLatencyMs, message: dbMessage },
      { service: "internal_api", status: apiStatus, latencyMs: 0, message: `${errorsLast24h} errors in last 24h` },
      { service: "internal_pool", status: poolStatus, latencyMs: 0, message: `${poolCount} active connections` },
    ];

    // 3. Store all results
    const allResults = [...externalResults, ...internalResults];
    const storedAt = now;

    await prisma.healthCheckResult.createMany({
      data: allResults.map((r) => ({
        service: r.service,
        status: r.status,
        latencyMs: r.latencyMs,
        message: r.message,
        checkedAt: storedAt,
      })),
    });

    // 4. Evaluate alert thresholds
    await evaluateThresholds(externalResults);

    // 5. Clean up old records — keep 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    await prisma.healthCheckResult
      .deleteMany({ where: { checkedAt: { lt: thirtyDaysAgo } } })
      .catch(() => {});

    console.log(
      `[HealthChecks] Stored ${allResults.length} results. ` +
        externalResults.map((r) => `${r.service}:${r.status}(${r.latencyMs}ms)`).join(", "),
    );

    return NextResponse.json({
      success: true,
      stored: allResults.length,
      external: externalResults.map((r) => ({
        service: r.service,
        status: r.status,
        latencyMs: r.latencyMs,
      })),
      internal: {
        db: { status: dbStatus, latencyMs: dbLatencyMs },
        api: { status: apiStatus, errors24h: errorsLast24h },
        pool: { status: poolStatus, connections: poolCount },
      },
    });
  } catch (error) {
    return handleApiError(error, "Health check cron");
  } finally {
    await releaseLock("health-checks");
  }
}

// Vercel Cron sends GET for health checks, POST for actual calls
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
