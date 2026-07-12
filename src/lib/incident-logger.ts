/**
 * Incident Logger — records operational errors in the content creation
 * pipeline and triggers email alerts for critical patterns.
 *
 * Usage:
 *   import { logIncident } from "@/lib/incident-logger";
 *   await logIncident({
 *     barId, barName,
 *     type: "AI_GENERATE_FAILED",
 *     severity: "CRITICAL",
 *     message: "DeepSeek returned 500 after 3 retries",
 *   });
 *
 * Critical incidents (3+ errors from the same bar in 1 hour) trigger
 * an email alert via Resend, with per-bar deduplication so you don't
 * get spammed on every single error.
 */

import { prisma } from "@/lib/database";

// ---- Types ----

export type IncidentType =
  | "AI_GENERATE_FAILED"
  | "IMAGE_GENERATE_FAILED"
  | "COMPLIANCE_BLOCKED"
  | "RATE_LIMITED"
  | "PARSE_ERROR"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "MISSING_API_KEY"
  | "SUBMIT_FAILED"
  | "SUGGEST_FAILED";

export type Severity = "INFO" | "WARNING" | "CRITICAL";

export interface IncidentInput {
  barId: string;
  barName?: string;
  type: IncidentType;
  severity?: Severity;
  message: string;
  detail?: string;
  endpoint?: string;
}

// ---- Severity thresholds ----
// How many incidents from the same bar in the last hour triggers a CRITICAL email

const CRITICAL_THRESHOLD = 3;
const CRITICAL_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// ---- Public API ----

/**
 * Log an incident to the database. For CRITICAL severity, also checks
 * if the threshold has been crossed and triggers an email alert.
 */
export async function logIncident(input: IncidentInput): Promise<void> {
  const severity = input.severity || inferSeverity(input.type);

  try {
    await prisma.barIncident.create({
      data: {
        barId: input.barId,
        barName: input.barName,
        incidentType: input.type,
        severity,
        message: input.message,
        detail: input.detail || null,
        endpoint: input.endpoint || null,
      },
    });

    // Only check threshold for non-INFO incidents
    if (severity !== "INFO") {
      await checkAndAlert(input.barId, input.barName || input.barId);
    }
  } catch (err) {
    // Never let incident logging break the request
    console.error("[IncidentLogger] Failed to write incident:", err);
  }
}

/**
 * Get recent unresolved incidents for the admin dashboard.
 */
export async function getRecentIncidents(limit = 20) {
  return prisma.barIncident.findMany({
    where: { resolved: false },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Get incident summary for a specific bar.
 */
export async function getBarIncidents(barId: string, limit = 10) {
  return prisma.barIncident.findMany({
    where: { barId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Mark incidents as resolved.
 */
export async function resolveIncidents(
  ids: string[],
  adminUserId?: string,
): Promise<number> {
  const result = await prisma.barIncident.updateMany({
    where: { id: { in: ids }, resolved: false },
    data: {
      resolved: true,
      resolvedAt: new Date(),
      resolvedBy: adminUserId || null,
    },
  });
  return result.count;
}

// ---- Helpers ----

function inferSeverity(type: IncidentType): Severity {
  switch (type) {
    case "NETWORK_ERROR":
    case "TIMEOUT":
    case "MISSING_API_KEY":
      return "CRITICAL";
    case "AI_GENERATE_FAILED":
    case "IMAGE_GENERATE_FAILED":
    case "SUBMIT_FAILED":
    case "SUGGEST_FAILED":
      return "WARNING";
    case "PARSE_ERROR":
    case "RATE_LIMITED":
    case "COMPLIANCE_BLOCKED":
      return "INFO";
  }
}

/**
 * Check if recent incidents from this bar cross the critical threshold
 * and send an email alert. Deduplicated: only one alert per bar per hour.
 */
async function checkAndAlert(barId: string, barName: string): Promise<void> {
  try {
    const windowStart = new Date(Date.now() - CRITICAL_WINDOW_MS);

    // Count recent unresolved incidents for this bar
    const count = await prisma.barIncident.count({
      where: {
        barId,
        severity: { in: ["WARNING", "CRITICAL"] },
        createdAt: { gte: windowStart },
      },
    });

    if (count < CRITICAL_THRESHOLD) return;

    // Check if we already alerted for this bar in the last hour
    const alreadyAlerted = await prisma.barIncident.findFirst({
      where: {
        barId,
        incidentType: "CRITICAL_THRESHOLD_ALERT",
        createdAt: { gte: windowStart },
      },
    });

    if (alreadyAlerted) return; // deduplicated

    // Log the alert itself as a special incident type
    await prisma.barIncident.create({
      data: {
        barId,
        barName,
        incidentType: "CRITICAL_THRESHOLD_ALERT" as any,
        severity: "CRITICAL",
        message: `${count} errors from ${barName} in the last hour. Threshold crossed.`,
        endpoint: "incident-logger",
      },
    });

    // Send email alert (lazy import to avoid circular deps at module level)
    const { sendIncidentAlert } = await import("@/lib/email");
    await sendIncidentAlert({
      barId,
      barName,
      incidentCount: count,
      windowMinutes: CRITICAL_WINDOW_MS / 60000,
    });
  } catch (err) {
    console.error("[IncidentLogger] Alert check failed:", err);
  }
}
