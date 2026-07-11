// src/lib/credit-tracker.ts
// ============================================================================
// AI CREDIT TRACKER — Logs API usage, checks thresholds, triggers alerts
// ============================================================================
//
// Every AI API call (DeepSeek text, BFL image) should call logUsage() after
// completion so credits are tracked. This keeps us ahead of actual platform
// credit exhaustion — we alert BEFORE the API starts returning 402 errors.
//
// Usage:
//   await logUsage({ provider: "deepseek", endpoint: "chat/completions",
//     tokensIn: 800, tokensOut: 400, barId, barName });
//   const status = await getCreditStatus();
// ============================================================================

import { prisma } from "@/lib/database";

export type Provider = "deepseek" | "bfl_flux";

export interface UsageLogInput {
  provider: Provider;
  endpoint: string;
  tokensIn?: number;
  tokensOut?: number;
  imageCount?: number;
  barId?: string;
  barName?: string;
  metadata?: Record<string, unknown>;
}

export interface CreditStatus {
  provider: Provider;
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  alertThreshold: number;
  isLow: boolean;
  callCount: number;
  lastUsedAt: string | null;
}

// ---- Cost estimation ----

/** Estimated USD cost for DeepSeek chat completions.
 *  deepseek-chat pricing: $0.27/M input, $1.10/M output tokens.
 *  Typical promo gen: ~800 in, ~400 out = ~$0.0007. Minimum floor: $0.0001. */
function estimateDeepSeekCost(tokensIn: number, tokensOut: number): number {
  const costIn = (tokensIn / 1_000_000) * 0.27;
  const costOut = (tokensOut / 1_000_000) * 1.10;
  return Math.max(costIn + costOut, 0.0001);
}

/** Estimated USD cost for BFL/FLUX image generation.
 *  FLUX.2 Klein-9b: $0.015 per 1024×1024 image. */
function estimateBFLCost(imageCount: number): number {
  return imageCount * 0.015;
}

// ---- Public API ----

/** Log an AI API call to the usage log and check if we should alert. */
export async function logUsage(input: UsageLogInput): Promise<void> {
  const estimatedCost =
    input.provider === "deepseek"
      ? estimateDeepSeekCost(input.tokensIn || 0, input.tokensOut || 0)
      : estimateBFLCost(input.imageCount || 1);

  try {
    await prisma.apiUsageLog.create({
      data: {
        provider: input.provider,
        endpoint: input.endpoint,
        tokensIn: input.tokensIn ?? null,
        tokensOut: input.tokensOut ?? null,
        imageCount: input.imageCount ?? null,
        estimatedCost,
        barId: input.barId ?? null,
        barName: input.barName ?? null,
        metadata: (input.metadata ?? undefined) as never,
      },
    });

    // Alert check moved to cron job (src/app/api/cron/credit-alerts/route.ts)
    // — saves 2 DB queries per generation on the hot path
  } catch (err) {
    // Never let credit tracking break the main flow
    console.error("[credit-tracker] Failed to log usage:", err);
  }
}

/** Get credit status for all providers. Used by the admin dashboard. */
export async function getCreditStatus(): Promise<CreditStatus[]> {
  const pools = await prisma.creditPool.findMany({ where: { isActive: true } });

  const statuses: CreditStatus[] = [];

  for (const pool of pools) {
    const aggregate = await prisma.apiUsageLog.aggregate({
      where: { provider: pool.provider },
      _sum: { estimatedCost: true },
      _count: { id: true },
      _max: { createdAt: true },
    });

    const usedCredits = aggregate._sum.estimatedCost || 0;
    const remainingCredits = pool.totalCredits - usedCredits;

    statuses.push({
      provider: pool.provider as Provider,
      totalCredits: pool.totalCredits,
      usedCredits: Math.round(usedCredits * 10000) / 10000,
      remainingCredits: Math.round(remainingCredits * 10000) / 10000,
      alertThreshold: pool.alertThreshold,
      isLow: remainingCredits <= pool.alertThreshold,
      callCount: aggregate._count.id,
      lastUsedAt: aggregate._max.createdAt?.toISOString() ?? null,
    });
  }

  return statuses;
}

/** Get per-bar usage breakdown for a given provider and time range. */
export async function getUsageByBar(
  provider: Provider,
  days: number = 30,
): Promise<{ barId: string | null; barName: string | null; totalCost: number; callCount: number }[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const logs = await prisma.apiUsageLog.groupBy({
    by: ["barId", "barName"],
    where: {
      provider,
      createdAt: { gte: since },
    },
    _sum: { estimatedCost: true },
    _count: { id: true },
    orderBy: { _sum: { estimatedCost: "desc" } },
  });

  return logs.map((l) => ({
    barId: l.barId,
    barName: l.barName,
    totalCost: Math.round((l._sum.estimatedCost || 0) * 10000) / 10000,
    callCount: l._count.id,
  }));
}

/** Update credit pool settings. Admin-only. */
export async function updateCreditPool(
  provider: Provider,
  data: { totalCredits?: number; alertThreshold?: number; alertEmail?: string; isActive?: boolean },
): Promise<void> {
  await prisma.creditPool.upsert({
    where: { provider },
    create: {
      provider,
      totalCredits: data.totalCredits ?? 0,
      alertThreshold: data.alertThreshold ?? 2.0,
      alertEmail: data.alertEmail ?? null,
      isActive: data.isActive ?? true,
    },
    update: {
      ...(data.totalCredits !== undefined && { totalCredits: data.totalCredits }),
      ...(data.alertThreshold !== undefined && { alertThreshold: data.alertThreshold }),
      ...(data.alertEmail !== undefined && { alertEmail: data.alertEmail }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
}

// ---- Internal: threshold alert ----

/** Check credit thresholds and send alerts. Called by cron every 15 min. */
export async function checkCreditAlerts(providers: string[] = ["deepseek", "bfl_flux"]): Promise<{ alerted: string[] }> {
  const alerted: string[] = [];
  for (const provider of providers) {
    const didAlert = await checkAndAlert(provider);
    if (didAlert) alerted.push(provider);
  }
  return { alerted };
}

async function checkAndAlert(provider: string): Promise<boolean> {
  const pool = await prisma.creditPool.findUnique({ where: { provider } });
  if (!pool || !pool.isActive) return false;

  const aggregate = await prisma.apiUsageLog.aggregate({
    where: { provider },
    _sum: { estimatedCost: true },
  });

  const used = aggregate._sum.estimatedCost || 0;
  const remaining = pool.totalCredits - used;

  if (remaining > pool.alertThreshold) return false;

  // Don't re-alert within 24 hours
  if (pool.lastAlertedAt) {
    const hoursSinceLastAlert =
      (Date.now() - pool.lastAlertedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastAlert < 24) return false;
  }

  // Fire alert
  const providerLabel = provider === "deepseek" ? "DeepSeek" : "FLUX.2 Klein-9b (BFL)";
  const adminEmail = pool.alertEmail || process.env.ADMIN_EMAIL;

  if (adminEmail) {
    try {
      const { sendCreditAlert } = await import("@/lib/email");
      await sendCreditAlert({
        provider: providerLabel,
        remaining: Math.round(remaining * 100) / 100,
        threshold: pool.alertThreshold,
        totalCredits: pool.totalCredits,
        to: adminEmail,
      });
    } catch (err) {
      console.error("[credit-tracker] Failed to send alert email:", err);
    }
  }

  // Mark alerted
  await prisma.creditPool.update({
    where: { provider },
    data: { lastAlertedAt: new Date() },
  });

  console.warn(
    `[credit-tracker] ALERT: ${providerLabel} credits low — $${remaining.toFixed(2)} remaining (threshold: $${pool.alertThreshold})`,
  );
  return true;
}
