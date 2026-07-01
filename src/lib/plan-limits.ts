// src/lib/plan-limits.ts
// Maps SubscriptionPlan → feature limits and capabilities.
// Used by API routes to enforce limits before create operations
// and by the /plan endpoint to show usage vs limits.

import { SubscriptionPlan } from "@prisma/client";

// ---- Feature limits per plan ----

export interface PlanLimits {
  maxPromotions: number | null;      // null = unlimited
  maxStaff: number | null;
  maxPasses: number | null;
  maxAdCampaigns: number | null;
  aiGeneration: boolean;
  retargeting: boolean;
  analyticsExport: boolean;
  whiteLabel: boolean;
  label: string;
  description: string;
}

const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  FREE: {
    maxPromotions: 3,
    maxStaff: 1,
    maxPasses: 5,
    maxAdCampaigns: 0,
    aiGeneration: false,
    retargeting: false,
    analyticsExport: false,
    whiteLabel: false,
    label: "Free",
    description: "Basic tools to get started. Limited to 3 promotions and 1 staff member.",
  },
  PRO: {
    maxPromotions: 20,
    maxStaff: 5,
    maxPasses: null, // unlimited
    maxAdCampaigns: 3,
    aiGeneration: true,
    retargeting: true,
    analyticsExport: true,
    whiteLabel: false,
    label: "Pro",
    description: "Full-featured bar management with AI, retargeting, and analytics exports.",
  },
  PREMIUM: {
    maxPromotions: null, // unlimited
    maxStaff: null,
    maxPasses: null,
    maxAdCampaigns: null,
    aiGeneration: true,
    retargeting: true,
    analyticsExport: true,
    whiteLabel: true,
    label: "Premium",
    description: "Unlimited everything with white-label branding and priority support.",
  },
};

export function getPlanLimits(plan: SubscriptionPlan): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE;
}

export function getPlanUpgradePath(current: SubscriptionPlan): SubscriptionPlan[] {
  switch (current) {
    case "FREE":
      return ["PRO", "PREMIUM"];
    case "PRO":
      return ["PREMIUM"];
    case "PREMIUM":
      return [];
    default:
      return ["PRO", "PREMIUM"];
  }
}

// ---- Plan limit checker (for use in API routes) ----

export interface LimitCheck {
  allowed: boolean;
  reason?: string;
  current: number;
  max: number | null;
  plan: SubscriptionPlan;
}

/**
 * Check whether a bar can create another resource of the given type.
 * Returns { allowed, reason, current, max }.
 * null max = unlimited.
 */
export function checkPlanLimit(
  plan: SubscriptionPlan,
  resource: "promotions" | "staff" | "passes" | "adCampaigns",
  currentCount: number,
): LimitCheck {
  const limits = getPlanLimits(plan);

  const maxMap: Record<string, number | null> = {
    promotions: limits.maxPromotions,
    staff: limits.maxStaff,
    passes: limits.maxPasses,
    adCampaigns: limits.maxAdCampaigns,
  };

  const max = maxMap[resource];

  if (max === null) {
    return { allowed: true, current: currentCount, max: null, plan };
  }

  if (currentCount >= max) {
    const resourceLabel =
      resource === "adCampaigns" ? "ad campaigns" : resource;
    return {
      allowed: false,
      reason: `Your ${limits.label} plan allows ${max} ${resourceLabel}. You have ${currentCount}. Upgrade to ${getPlanUpgradePath(plan).join(" or ")} for more.`,
      current: currentCount,
      max,
      plan,
    };
  }

  return { allowed: true, current: currentCount, max, plan };
}

/**
 * Check whether a plan includes a specific feature (AI, retargeting, etc.).
 */
export function planHasFeature(
  plan: SubscriptionPlan,
  feature: "aiGeneration" | "retargeting" | "analyticsExport" | "whiteLabel",
): boolean {
  const limits = getPlanLimits(plan);
  return limits[feature];
}
