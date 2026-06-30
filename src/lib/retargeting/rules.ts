/**
 * Retargeting rule definitions — each rule specifies what user segment to
 * target, how to find them, and what cooldown to apply.
 */

import type { RetargetingRule } from "@prisma/client";

export interface RuleDefinition {
  rule: RetargetingRule;
  /** Human-readable label shown in the bar dashboard */
  label: string;
  /** Description shown as help text */
  description: string;
  /** How many days back to look for the trigger event */
  lookbackDays: number;
  /** Per-user cooldown in days (won't retarget same user+bar+rule within this) */
  cooldownDays: number;
  /** Default max notifications per bar per day for this rule */
  defaultMaxPerDay: number;
  /** The notification payload template */
  notification: {
    titleTemplate: (barName: string) => string;
    bodyTemplate: (barName: string) => string;
  };
}

export const RULE_DEFINITIONS: Record<RetargetingRule, RuleDefinition> = {
  VIEWED_NOT_FOLLOWED: {
    rule: "VIEWED_NOT_FOLLOWED",
    label: "Viewed but didn't follow",
    description:
      "Users who viewed this bar's profile in the last 48 hours but haven't followed yet.",
    lookbackDays: 2,
    cooldownDays: 7,
    defaultMaxPerDay: 5,
    notification: {
      titleTemplate: (name) => `👀 Still thinking about ${name}?`,
      bodyTemplate: (name) =>
        `You checked out ${name} recently. Follow to stay in the loop on promos and events!`,
    },
  },

  FOLLOWED_NOT_VISITED: {
    rule: "FOLLOWED_NOT_VISITED",
    label: "Followed but hasn't visited",
    description:
      "Users who follow this bar but haven't redeemed a promo, joined an event, or had a pass scanned in the last 30 days.",
    lookbackDays: 30,
    cooldownDays: 14,
    defaultMaxPerDay: 5,
    notification: {
      titleTemplate: (name) => `🍻 Missing ${name}?`,
      bodyTemplate: (name) =>
        `You follow ${name} but haven't stopped by in a while. Check out what's happening!`,
    },
  },
};
