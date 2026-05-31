// GET /api/auth/admin/health
// Platform health monitoring — checks database, API, and system status

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { authService } from "@/services/auth-service";

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
  thresholds: {
    dbLatencyMs: number;
    errorRate: number;
  };
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
    };

    const components: ComponentHealth[] = [];

    // 1. Database health check — time a simple query
    const dbStart = performance.now();
    let dbStatus: HealthStatus = "HEALTHY";
    let dbMessage = "Database is responsive";

    try {
      await prisma.$queryRawUnsafe(`SELECT 1`);
      const dbLatency = Math.round(performance.now() - dbStart);
      dbStatus = determineStatus(dbLatency, thresholds.dbLatencyMs);
      if (dbStatus !== "HEALTHY") {
        dbMessage = `Database latency (${dbLatency}ms) exceeds threshold (${thresholds.dbLatencyMs}ms)`;
      } else {
        dbMessage = `Response time: ${dbLatency}ms`;
      }
      components.push({
        name: "Database",
        status: dbStatus,
        latencyMs: dbLatency,
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
      errorsLast24h > 50 ? "DEGRADED" : errorsLast24h > 100 ? "DOWN" : "HEALTHY";

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

    // 5. Error distribution by hour (last 24h)
    const errorsByHour: ErrorBucket[] = [];
    try {
      for (let h = 23; h >= 0; h--) {
        const hourStart = new Date(now.getTime() - h * 60 * 60 * 1000);
        const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
        const count = await prisma.auditLog.count({
          where: {
            createdAt: { gte: hourStart, lt: hourEnd },
            action: { contains: "ERROR", mode: "insensitive" },
          },
        });
        errorsByHour.push({
          hour: hourStart.toISOString().slice(11, 13) + ":00",
          count,
        });
      }
    } catch {
      // Non-critical — return empty
    }

    const avgDbQueryMs = components.length > 0
      ? Math.round(components.reduce((s, c) => s + c.latencyMs, 0) / components.length)
      : 0;

    const overall = determineOverall(components);

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
      thresholds,
    };

    return NextResponse.json({ success: true, health });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
