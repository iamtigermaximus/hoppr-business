// src/lib/customer-insights.ts
// ============================================================================
// CUSTOMER-LEVEL ANALYTICS — Aggregates AnalyticsEvent data per userId
// ============================================================================
//
// Every AnalyticsEvent stores userId. This module queries that data to answer
// customer-level questions the system previously ignored:
//   - Who are my regulars and how many are there?
//   - What content types do regulars prefer vs new visitors?
//   - How engaged is the average customer?
//   - What's the new vs returning visitor split?
//
// Query strategy: Uses Prisma groupBy for efficiency. Grouping by userId
// leverages the existing @@index([userId, createdAt]). Content type breakdowns
// use a second groupBy by userId + type. All processing happens in memory
// to avoid N+1 queries against the promotions/events/passes tables.
//
// Lookback: 90 days — balances statistical relevance with query performance.
// ============================================================================

import { prisma } from "@/lib/database";

// ---- Types ----

/** Raw per-user event counts from groupBy */
interface UserEventCount {
  userId: string;
  totalEvents: number;
  promoEvents: number;
  eventEvents: number;
  passEvents: number;
  profileEvents: number; // PAGE_VIEW, BAR_VIEW, BAR_DIRECTION etc.
  firstEventAt: Date;
  lastEventAt: Date;
}

/** Content preference profile */
type ContentPreference = "promotions" | "events" | "passes" | "profile" | "mixed";

/** Engagement tier */
type EngagementTier = "regular" | "occasional" | "one_time";

/** Stats for a group of users within a tier */
export interface TierStats {
  userCount: number;
  /** Percentage of total users */
  percentageOfTotal: number;
  averageEventsPerUser: number;
  /** Which content type this tier engages with most */
  topContentType: ContentPreference;
  /** % of their events that are the top type */
  topContentTypePercentage: number;
  /** Detailed content type breakdown */
  contentBreakdown: Record<string, number>;
}

/** The full customer insights payload */
export interface CustomerInsights {
  /** Total unique users with events in the lookback period */
  totalUsers: number;
  /** Total events in the lookback period */
  totalEvents: number;

  // Engagement tiers
  regulars: TierStats;
  occasionals: TierStats;
  oneTimers: TierStats;

  /** Average events per user across all users */
  averageEventsPerUser: number;
  /** Repeat visit rate: users with 3+ events / total users */
  repeatVisitRate: number;

  // New vs returning (last 30 days vs prior)
  newVisitors30d: number;
  returningVisitors30d: number;
  newVisitorPercentage: number;

  // Regular vs new content preferences
  /** What content types regulars prefer (event type → % of their events) */
  regularContentPreference: Record<string, number>;
  /** What content types new visitors prefer (event type → % of their events) */
  newVisitorContentPreference: Record<string, number>;

  /** Top 5 customers by event count (anonymized) */
  topCustomerCounts: number[];

  /** Data freshness */
  lookbackDays: number;
  computedAt: string;
}

// ---- Content type classification ----

/** Maps AnalyticsEventType values to content categories */
function classifyEventType(type: string): "promo" | "event" | "pass" | "profile" {
  if (type.startsWith("PROMO_")) return "promo";
  if (type.startsWith("EVENT_")) return "event";
  if (type.startsWith("PASS_")) return "pass";
  return "profile"; // PAGE_VIEW, BAR_VIEW, BAR_DIRECTION, BAR_WEBSITE, BAR_CALL, BAR_SHARE
}

/** Determine the dominant content preference for a user */
function determinePreference(counts: {
  promo: number;
  event: number;
  pass: number;
  profile: number;
}): ContentPreference {
  const max = Math.max(counts.promo, counts.event, counts.pass, counts.profile);
  // If no single type dominates (>60%), it's "mixed"
  const total = counts.promo + counts.event + counts.pass + counts.profile;
  if (total === 0) return "mixed";
  const maxRatio = max / total;
  if (maxRatio < 0.6) return "mixed";

  if (counts.promo === max) return "promotions";
  if (counts.event === max) return "events";
  if (counts.pass === max) return "passes";
  return "profile";
}

/** Compute content type breakdown as percentages */
function contentBreakdown(counts: { promo: number; event: number; pass: number; profile: number }): Record<string, number> {
  const total = counts.promo + counts.event + counts.pass + counts.profile;
  if (total === 0) return { promotions: 0, events: 0, passes: 0, profile: 0 };
  return {
    promotions: Math.round((counts.promo / total) * 100),
    events: Math.round((counts.event / total) * 100),
    passes: Math.round((counts.pass / total) * 100),
    profile: Math.round((counts.profile / total) * 100),
  };
}

/** Map AnalyticsEventType to human-readable content preference label */
function preferenceLabel(type: string): ContentPreference {
  if (type.startsWith("PROMO_")) return "promotions";
  if (type.startsWith("EVENT_")) return "events";
  if (type.startsWith("PASS_")) return "passes";
  return "profile";
}

// ---- Core function ----

/**
 * Compute customer-level insights for a bar from AnalyticsEvent data.
 *
 * Query strategy:
 *   1. Group all events by userId (90-day lookback) → per-user totals
 *   2. Group events by userId + type → per-user content type breakdown
 *   3. Compute tiers, preferences, new vs returning in memory
 *
 * Returns null if no events with userId are found (bar has no traffic or
 * events are all anonymous).
 */
export async function getCustomerInsights(
  barId: string,
  options?: { lookbackDays?: number },
): Promise<CustomerInsights | null> {
  const lookbackDays = options?.lookbackDays ?? 90;
  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    // ---- Step 1: Get per-user event counts grouped by userId ----
    // Uses the @@index([userId, createdAt]) for efficient lookup, then
    // filtered to barId. Since we need bar-scoped data and the index is
    // not compound with barId, larger bars may see some scan overhead.
    const userAggregates = await prisma.analyticsEvent.groupBy({
      by: ["userId"],
      where: {
        barId,
        userId: { not: null },
        createdAt: { gte: lookbackDate },
      },
      _count: { id: true },
      _min: { createdAt: true },
      _max: { createdAt: true },
      orderBy: { _count: { id: "desc" } },
    });

    if (userAggregates.length === 0) return null;

    // ---- Step 2: Get per-user × per-type breakdown ----
    // Groups by userId + type so we can determine content preferences.
    // We fetch ALL types for each user, then pivot in memory.
    const userTypeAggregates = await prisma.analyticsEvent.groupBy({
      by: ["userId", "type"],
      where: {
        barId,
        userId: { not: null },
        createdAt: { gte: lookbackDate },
      },
      _count: { id: true },
    });

    // ---- Step 3: Build UserEventCount map in memory ----
    const userMap = new Map<string, UserEventCount>();

    for (const row of userAggregates) {
      if (!row.userId) continue;
      userMap.set(row.userId, {
        userId: row.userId,
        totalEvents: row._count.id,
        promoEvents: 0,
        eventEvents: 0,
        passEvents: 0,
        profileEvents: 0,
        firstEventAt: row._min.createdAt ?? lookbackDate,
        lastEventAt: row._max.createdAt ?? lookbackDate,
      });
    }

    // Pivot type counts into user records
    for (const row of userTypeAggregates) {
      if (!row.userId) continue;
      const user = userMap.get(row.userId);
      if (!user) continue;
      const category = classifyEventType(row.type);
      const count = row._count.id;
      switch (category) {
        case "promo": user.promoEvents += count; break;
        case "event": user.eventEvents += count; break;
        case "pass": user.passEvents += count; break;
        case "profile": user.profileEvents += count; break;
      }
    }

    const users = Array.from(userMap.values());
    const totalUsers = users.length;
    const totalEvents = users.reduce((sum, u) => sum + u.totalEvents, 0);

    // ---- Step 4: Classify users into engagement tiers ----
    // regulars = 4+ events, occasionals = 2-3 events, oneTimers = 1 event
    const regularUsers = users.filter((u) => u.totalEvents >= 4);
    const occasionalUsers = users.filter((u) => u.totalEvents >= 2 && u.totalEvents <= 3);
    const oneTimeUsers = users.filter((u) => u.totalEvents === 1);

    function buildTierStats(tierUsers: UserEventCount[]): TierStats {
      if (tierUsers.length === 0) {
        return {
          userCount: 0,
          percentageOfTotal: 0,
          averageEventsPerUser: 0,
          topContentType: "mixed",
          topContentTypePercentage: 0,
          contentBreakdown: { promotions: 0, events: 0, passes: 0, profile: 0 },
        };
      }

      const totalTierEvents = tierUsers.reduce((sum, u) => sum + u.totalEvents, 0);
      const aggPromo = tierUsers.reduce((sum, u) => sum + u.promoEvents, 0);
      const aggEvent = tierUsers.reduce((sum, u) => sum + u.eventEvents, 0);
      const aggPass = tierUsers.reduce((sum, u) => sum + u.passEvents, 0);
      const aggProfile = tierUsers.reduce((sum, u) => sum + u.profileEvents, 0);

      const counts = { promo: aggPromo, event: aggEvent, pass: aggPass, profile: aggProfile };
      const preference = determinePreference(counts);
      const breakdown = contentBreakdown(counts);
      const maxRatio = totalTierEvents > 0
        ? Math.max(aggPromo, aggEvent, aggPass, aggProfile) / totalTierEvents
        : 0;

      return {
        userCount: tierUsers.length,
        percentageOfTotal: totalUsers > 0 ? Math.round((tierUsers.length / totalUsers) * 100) : 0,
        averageEventsPerUser: Math.round((totalTierEvents / tierUsers.length) * 10) / 10,
        topContentType: preference,
        topContentTypePercentage: Math.round(maxRatio * 100),
        contentBreakdown: breakdown,
      };
    }

    // ---- Step 5: New vs returning (30-day window) ----
    const newVisitors = users.filter((u) => u.firstEventAt >= thirtyDaysAgo);
    const returningVisitors = users.filter((u) => u.firstEventAt < thirtyDaysAgo);

    // ---- Step 6: Content preferences by cohort ----
    function cohortContentBreakdown(cohortUsers: UserEventCount[]): Record<string, number> {
      if (cohortUsers.length === 0) return { promotions: 0, events: 0, passes: 0, profile: 0 };
      const aggPromo = cohortUsers.reduce((sum, u) => sum + u.promoEvents, 0);
      const aggEvent = cohortUsers.reduce((sum, u) => sum + u.eventEvents, 0);
      const aggPass = cohortUsers.reduce((sum, u) => sum + u.passEvents, 0);
      const aggProfile = cohortUsers.reduce((sum, u) => sum + u.profileEvents, 0);
      return contentBreakdown({ promo: aggPromo, event: aggEvent, pass: aggPass, profile: aggProfile });
    }

    // ---- Step 7: Top customer counts (anonymized — just the event counts) ----
    const topCustomerCounts = users
      .slice(0, 5)
      .map((u) => u.totalEvents);

    // ---- Step 8: Assemble result ----
    const regulars = buildTierStats(regularUsers);
    const occasionals = buildTierStats(occasionalUsers);
    const oneTimers = buildTierStats(oneTimeUsers);

    const regularContentPref = cohortContentBreakdown(regularUsers);
    const newVisitorContentPref = cohortContentBreakdown(newVisitors);

    // Repeat visit rate: % of users who come back (3+ events)
    const multiVisitUsers = regularUsers.length + occasionalUsers.length;
    const repeatVisitRate = totalUsers > 0 ? Math.round((multiVisitUsers / totalUsers) * 100) : 0;

    return {
      totalUsers,
      totalEvents,
      regulars,
      occasionals,
      oneTimers,
      averageEventsPerUser: totalUsers > 0 ? Math.round((totalEvents / totalUsers) * 10) / 10 : 0,
      repeatVisitRate,
      newVisitors30d: newVisitors.length,
      returningVisitors30d: returningVisitors.length,
      newVisitorPercentage: totalUsers > 0 ? Math.round((newVisitors.length / totalUsers) * 100) : 0,
      regularContentPreference: regularContentPref,
      newVisitorContentPreference: newVisitorContentPref,
      topCustomerCounts,
      lookbackDays,
      computedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error("[customer-insights] Failed to compute customer insights:", err);
    return null;
  }
}

// ---- Formatter for AI prompt ----

/**
 * Format customer insights as a human-readable text block for injection
 * into the AI intelligence prompt's user message.
 */
export function formatCustomerInsightsForPrompt(
  insights: CustomerInsights,
  language: "en" | "fi",
): string {
  const isFi = language === "fi";

  if (isFi) {
    return [
      `=== ${label("AUDIENCE INSIGHTS", "YLEISÖTILASTOT")} (${insights.lookbackDays} ${label("days", "pv")}) ===`,
      `Yksilöityjä kävijöitä: ${insights.totalUsers} (${insights.totalEvents} tapahtumaa yhteensä)`,
      `Keskimäärin tapahtumia per kävijä: ${insights.averageEventsPerUser}`,
      ``,
      `SITOUTUMISTASOT:`,
      `- Vakiokävijät (4+ tapahtumaa): ${insights.regulars.userCount} kävijää (${insights.regulars.percentageOfTotal}% yleisöstä), keskimäärin ${insights.regulars.averageEventsPerUser} tapahtumaa`,
      `- Satunnaiskävijät (2-3 tapahtumaa): ${insights.occasionals.userCount} kävijää (${insights.occasionals.percentageOfTotal}% yleisöstä)`,
      `- Kertakävijät (1 tapahtuma): ${insights.oneTimers.userCount} kävijää (${insights.oneTimers.percentageOfTotal}% yleisöstä)`,
      `- Palaamisaste (2+ tapahtumaa): ${insights.repeatVisitRate}%`,
      ``,
      `Vakiokävijöiden suosima sisältö: ${insights.regulars.topContentType} (${insights.regulars.topContentTypePercentage}% vakiokävijöiden tapahtumista)`,
      `Vakiokävijöiden sisältöjakauma: promootiot ${insights.regularContentPreference.promotions}%, tapahtumat ${insights.regularContentPreference.events}%, passit ${insights.regularContentPreference.passes}%, profiili ${insights.regularContentPreference.profile}%`,
      ``,
      `UUSI VS. PALAAVA (viimeiset 30pv):`,
      `- Uusia kävijöitä: ${insights.newVisitors30d} (${insights.newVisitorPercentage}% yleisöstä)`,
      `- Palavia kävijöitä: ${insights.returningVisitors30d}`,
      `- Uusien kävijöiden suosima sisältö: promootiot ${insights.newVisitorContentPreference.promotions}%, tapahtumat ${insights.newVisitorContentPreference.events}%, passit ${insights.newVisitorContentPreference.passes}%, profiili ${insights.newVisitorContentPreference.profile}%`,
    ].join("\n");
  }

  return [
    `=== AUDIENCE INSIGHTS (${insights.lookbackDays} days) ===`,
    `Unique visitors: ${insights.totalUsers} (${insights.totalEvents} total events)`,
    `Average events per visitor: ${insights.averageEventsPerUser}`,
    ``,
    `ENGAGEMENT TIERS:`,
    `- Regulars (4+ events): ${insights.regulars.userCount} visitors (${insights.regulars.percentageOfTotal}% of audience), avg ${insights.regulars.averageEventsPerUser} events`,
    `- Occasionals (2-3 events): ${insights.occasionals.userCount} visitors (${insights.occasionals.percentageOfTotal}% of audience)`,
    `- One-timers (1 event): ${insights.oneTimers.userCount} visitors (${insights.oneTimers.percentageOfTotal}% of audience)`,
    `- Repeat visit rate (2+ events): ${insights.repeatVisitRate}%`,
    ``,
    `Regulars' top content type: ${insights.regulars.topContentType} (${insights.regulars.topContentTypePercentage}% of regular events)`,
    `Regulars' content breakdown: promotions ${insights.regularContentPreference.promotions}%, events ${insights.regularContentPreference.events}%, passes ${insights.regularContentPreference.passes}%, profile ${insights.regularContentPreference.profile}%`,
    ``,
    `NEW VS RETURNING (last 30 days):`,
    `- New visitors: ${insights.newVisitors30d} (${insights.newVisitorPercentage}% of audience)`,
    `- Returning visitors: ${insights.returningVisitors30d}`,
    `- New visitor content preference: promotions ${insights.newVisitorContentPreference.promotions}%, events ${insights.newVisitorContentPreference.events}%, passes ${insights.newVisitorContentPreference.passes}%, profile ${insights.newVisitorContentPreference.profile}%`,
  ].join("\n");
}

const label = (en: string, fi: string) => en; // placeholder for l10n pattern
