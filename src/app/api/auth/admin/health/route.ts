// GET /api/auth/admin/health
// Platform health monitoring — checks database, API, and system status

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { authService } from "@/services/auth-service";
import { handleApiError } from "@/lib/api-error";

// ---- Types ----

type HealthStatus = "HEALTHY" | "DEGRADED" | "DOWN";

interface ComponentHealth {
  name: string;
  status: HealthStatus;
  latencyMs: number;
  message: string;
  checkedAt: string;
}

interface ErrorBucket {
  hour: string;
  count: number;
}

interface CronJobHealth {
  name: string;
  label: string;
  lastRun: string | null;
  isStale: boolean;
  expectedInterval: string;
}

interface ExternalServiceHealth {
  service: string;
  label: string;
  status: HealthStatus;
  latencyMs: number;
  message: string;
  checkedAt: string | null;
}

interface TrendPoint {
  timestamp: string;
  latencyMs: number;
  status: string;
}

interface SystemHealth {
  overall: HealthStatus;
  components: ComponentHealth[];
  metrics: {
    totalBars: number;
    totalUsers: number;
    totalClaims: number;
    totalOutreachLogs: number;
    errorsLast24h: number;
    avgDbQueryMs: number;
  };
  errorsByHour: ErrorBucket[];
  cronJobs: CronJobHealth[];
  thresholds: {
    dbLatencyMs: number;
    errorRate: number;
    externalLatencyHealthyMs: number;
    externalLatencyDegradedMs: number;
  };
  externalServices: ExternalServiceHealth[];
  serviceTrends: Record<string, TrendPoint[]>;
}

// ---- Helpers ----

function determineStatus(latencyMs: number, threshold: number): HealthStatus {
  if (latencyMs <= threshold) return "HEALTHY";
  if (latencyMs <= threshold * 2) return "DEGRADED";
  return "DOWN";
}

function determineOverall(components: ComponentHealth[]): HealthStatus {
  if (components.some((c) => c.status === "DOWN")) return "DOWN";
  if (components.some((c) => c.status === "DEGRADED")) return "DEGRADED";
  return "HEALTHY";
}

// ---- GET ----

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const authResult = await authService.validateToken(token);

    if (
      authResult.type !== "admin" ||
      authResult.user.adminRole !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        { error: "Super admin access required" },
        { status: 403 }
      );
    }

    const now = new Date();
    const thresholds = {
      dbLatencyMs: 100,
      errorRate: 5, // per hour
      externalLatencyHealthyMs: 1000,
      externalLatencyDegradedMs: 3000,
    };

    // ---- External service health ----

    const externalServiceLabels: Record<string, string> = {
      deepseek: "DeepSeek AI",
      bfl_flux: "BFL Flux",
      cloudinary: "Cloudinary",
      resend: "Resend Email",
    };

    const externalServices: ExternalServiceHealth[] = [];
    const serviceTrends: Record<string, TrendPoint[]> = {};

    try {
      // Fetch the latest check for each external service
      const latestChecks = await prisma.$queryRawUnsafe<
        Array<{ service: string; status: string; latency_ms: number; message: string; checked_at: string }>
      >(`
        SELECT DISTINCT ON (service) service, status, "latencyMs" as latency_ms, message, "checkedAt" as checked_at
        FROM health_check_results
        WHERE service IN ('deepseek', 'bfl_flux', 'cloudinary', 'resend')
        ORDER BY service, "checkedAt" DESC
      `);

      for (const check of latestChecks) {
        externalServices.push({
          service: check.service,
          label: externalServiceLabels[check.service] || check.service,
          status: check.status.toUpperCase() as HealthStatus,
          latencyMs: check.latency_ms,
          message: check.message || "",
          checkedAt: check.checked_at,
        });
      }

      // For any service without data yet, return "unknown" placeholder
      for (const [svc, label] of Object.entries(externalServiceLabels)) {
        if (!externalServices.find((s) => s.service === svc)) {
          externalServices.push({
            service: svc,
            label,
            status: "DEGRADED",
            latencyMs: 0,
            message: "No health check data yet — first check will run within 5 minutes.",
            checkedAt: null,
          });
        }
      }

      // Fetch 24-hour trends for each service (for sparklines) — includes internal metrics
      const trendStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const allServices = ["deepseek", "bfl_flux", "cloudinary", "resend", "internal_db", "internal_api", "internal_pool"];
      const allTrends = await prisma.healthCheckResult.findMany({
        where: {
          service: { in: allServices },
          checkedAt: { gte: trendStart },
        },
        orderBy: { checkedAt: "asc" },
        select: { service: true, latencyMs: true, status: true, checkedAt: true },
      });

      for (const point of allTrends) {
        if (!serviceTrends[point.service]) serviceTrends[point.service] = [];
        serviceTrends[point.service].push({
          timestamp: point.checkedAt.toISOString(),
          latencyMs: point.latencyMs,
          status: point.status,
        });
      }
    } catch (err) {
      console.warn("[Health] Could not query health_check_results:", err);
      // Table might not exist yet — return empty placeholders
      for (const [svc, label] of Object.entries(externalServiceLabels)) {
        if (!externalServices.find((s) => s.service === svc)) {
          externalServices.push({
            service: svc,
            label,
            status: "DEGRADED",
            latencyMs: 0,
            message: "Health check table not yet created — run prisma db push.",
            checkedAt: null,
          });
        }
      }
    }

    const components: ComponentHealth[] = [];

    // 1. Database health check — time a simple query
    const dbStart = performance.now();
    let dbLatencyMs = 0;
    let dbStatus: HealthStatus = "HEALTHY";
    let dbMessage = "Database is responsive";

    try {
      await prisma.$queryRawUnsafe(`SELECT 1`);
      dbLatencyMs = Math.round(performance.now() - dbStart);
      dbStatus = determineStatus(dbLatencyMs, thresholds.dbLatencyMs);
      if (dbStatus !== "HEALTHY") {
        dbMessage = `Database latency (${dbLatencyMs}ms) exceeds threshold (${thresholds.dbLatencyMs}ms)`;
      } else {
        dbMessage = `Response time: ${dbLatencyMs}ms`;
      }
      components.push({
        name: "Database",
        status: dbStatus,
        latencyMs: dbLatencyMs,
        message: dbMessage,
        checkedAt: now.toISOString(),
      });
    } catch (err) {
      components.push({
        name: "Database",
        status: "DOWN",
        latencyMs: 0,
        message: `Database connection failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        checkedAt: now.toISOString(),
      });
    }

    // 2. API health — check recent errors from audit logs
    const apiStart = performance.now();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    let errorsLast24h = 0;
    try {
      errorsLast24h = await prisma.auditLog.count({
        where: {
          createdAt: { gte: twentyFourHoursAgo },
          action: { contains: "ERROR", mode: "insensitive" },
        },
      });
    } catch {
      // Audit log query failed — not critical
    }

    const apiLatency = Math.round(performance.now() - apiStart);
    const apiStatus: HealthStatus =
      errorsLast24h > 100 ? "DOWN" : errorsLast24h > 50 ? "DEGRADED" : "HEALTHY";

    components.push({
      name: "API Routes",
      status: apiStatus,
      latencyMs: apiLatency,
      message:
        errorsLast24h === 0
          ? "No errors in last 24 hours"
          : `${errorsLast24h} errors in last 24 hours`,
      checkedAt: now.toISOString(),
    });

    // 3. Prisma connection pool — count active connections
    try {
      const poolStart = performance.now();
      const result = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
        `SELECT count(*)::int as count FROM pg_stat_activity WHERE datname = current_database()`
      );
      const poolLatency = Math.round(performance.now() - poolStart);
      const activeConns = result[0]?.count ?? 0;
      const poolStatus: HealthStatus =
        activeConns > 50 ? "DEGRADED" : activeConns > 100 ? "DOWN" : "HEALTHY";

      components.push({
        name: "Connection Pool",
        status: poolStatus,
        latencyMs: poolLatency,
        message: `${activeConns} active connections`,
        checkedAt: now.toISOString(),
      });
    } catch {
      components.push({
        name: "Connection Pool",
        status: "DEGRADED",
        latencyMs: 0,
        message: "Could not query connection pool stats",
        checkedAt: now.toISOString(),
      });
    }

    // 4. System metrics — counts
    const [totalBars, totalUsers, totalClaims, totalOutreachLogs] = await Promise.all([
      prisma.bar.count().catch(() => -1),
      prisma.user.count().catch(() => -1),
      prisma.barClaim.count().catch(() => -1),
      prisma.outreachLog.count().catch(() => -1),
    ]);

    // 5. Cron job health — check CronLock table for last run times
    const cronJobs: CronJobHealth[] = [];
    const cronConfig: Record<string, { label: string; maxIntervalMs: number }> = {
      "analytics-aggregation": { label: "Daily analytics rollup", maxIntervalMs: 25 * 60 * 60 * 1000 },
      "busyness-aggregation": { label: "Daily busyness patterns", maxIntervalMs: 25 * 60 * 60 * 1000 },
      "insights": { label: "Insight generation (3hr)", maxIntervalMs: 4 * 60 * 60 * 1000 },
      "retargeting": { label: "Retargeting push (2hr)", maxIntervalMs: 3 * 60 * 60 * 1000 },
      "scheduler": { label: "Notification scheduler (15min)", maxIntervalMs: 30 * 60 * 1000 },
      "health-checks": { label: "Health checks (5min)", maxIntervalMs: 10 * 60 * 1000 },
    };

    try {
      const locks = await prisma.cronLock.findMany({
        select: { lockName: true, acquiredAt: true },
      });

      for (const [name, config] of Object.entries(cronConfig)) {
        const lock = locks.find((l) => l.lockName === name);
        const lastRun = lock ? lock.acquiredAt.toISOString() : null;
        const isStale = lastRun
          ? now.getTime() - new Date(lastRun).getTime() > config.maxIntervalMs
          : true;

        cronJobs.push({
          name,
          label: config.label,
          lastRun,
          isStale,
          expectedInterval: config.label,
        });
      }
    } catch {
      // CronLock table might not exist yet — gracefully degrade
      for (const [name, config] of Object.entries(cronConfig)) {
        cronJobs.push({
          name,
          label: config.label,
          lastRun: null,
          isStale: false, // Don't alert if the table hasn't been created yet
          expectedInterval: config.label,
        });
      }
    }

    // If any cron is stale, add a component warning
    const staleCronJobs = cronJobs.filter((j) => j.isStale);
    if (staleCronJobs.length > 0) {
      components.push({
        name: "Cron Jobs",
        status: staleCronJobs.length === cronJobs.length ? "DOWN" : "DEGRADED",
        latencyMs: 0,
        message: `${staleCronJobs.length}/${cronJobs.length} cron jobs stale: ${staleCronJobs.map((j) => j.name).join(", ")}`,
        checkedAt: now.toISOString(),
      });
    }

    // 6. Error distribution by hour (last 24h) — parallel Prisma queries
    const errorsByHour: ErrorBucket[] = [];
    try {
      const hourPromises = Array.from({ length: 24 }, (_, h) => {
        const hourStart = new Date(now.getTime() - h * 60 * 60 * 1000);
        const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
        return prisma.auditLog
          .count({
            where: {
              createdAt: { gte: hourStart, lt: hourEnd },
              action: { contains: "ERROR", mode: "insensitive" },
            },
          })
          .then((count) => ({
            hour: hourStart.toISOString().slice(11, 13) + ":00",
            count,
          }));
      });

      const results = await Promise.all(hourPromises);
      // Reverse so most recent hour is last (matches chart display order)
      results.reverse();
      errorsByHour.push(...results);
    } catch {
      // Non-critical — return empty
    }

    const avgDbQueryMs = dbLatencyMs;

    // Factor external services into overall status
    const allComponents = [
      ...components,
      ...externalServices.map((s) => ({
        name: s.label,
        status: s.status as HealthStatus,
        latencyMs: s.latencyMs,
        message: s.message,
        checkedAt: s.checkedAt || now.toISOString(),
      })),
    ];
    const overall = determineOverall(allComponents);

    const health: SystemHealth = {
      overall,
      components,
      metrics: {
        totalBars,
        totalUsers,
        totalClaims,
        totalOutreachLogs,
        errorsLast24h,
        avgDbQueryMs,
      },
      errorsByHour,
      cronJobs,
      thresholds,
      externalServices,
      serviceTrends,
    };

    return NextResponse.json({ success: true, health });
  } catch (error) {
    return handleApiError(error, "Health check error:");
  }
}
