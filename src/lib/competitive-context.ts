// src/lib/competitive-context.ts
// ============================================================================
// COMPETITIVE CONTEXT & MARKET AWARENESS — Gap 7
// ============================================================================
//
// Queries the competitive landscape around a bar — what other venues in the
// same district (or same type in the same city) are currently running — and
// identifies saturation, whitespace, and differentiation opportunities.
//
// Architecture:
//   1. Find competitor bars (same district → same type in city)
//   2. Query active promotions + events at those bars
//   3. Analyze saturation by promotion type and event presence
//   4. Identify unique differentiators (amenities only THIS bar has)
//   5. Build prompt-ready bilingual text block for system prompt injection
//
// Usage:
//   import { getCompetitiveContext } from "@/lib/competitive-context";
//   const ctx = await getCompetitiveContext(barId, district, city, type, "en");
//   if (ctx) { systemPrompt += ctx; }
//
// Injection pattern matches performance-feedback and calendar-context:
// non-blocking, wrapped in try/catch, safe to fail.
// ============================================================================

import { prisma } from "@/lib/database";

// ---- Types ----

export interface CompetitorBar {
  id: string;
  name: string;
  type: string;
  district: string | null;
  amenities: string[];
}

export interface ActivePromo {
  title: string;
  type: string;
  barName: string;
}

export interface ActiveEvent {
  title: string;
  venueName: string;
  startTime: Date;
}

export interface CompetitiveContext {
  /** Competitor bars found */
  competitors: CompetitorBar[];
  /** Active promotions at competitor bars */
  activePromos: ActivePromo[];
  /** Active events at competitor bars */
  activeEvents: ActiveEvent[];
  /** Promotion types with 2+ competitors running them */
  saturatedTypes: string[];
  /** Promotion types no competitor is running */
  whiteSpaceTypes: string[];
  /** Amenities this bar has that zero competitors have */
  uniqueDifferentiators: string[];
  /** Total active promos at competitors */
  totalCompetitorPromos: number;
  /** Total active events at competitors */
  totalCompetitorEvents: number;
}

// All known promotion types — used for whitespace detection
const ALL_PROMO_TYPES = [
  "HAPPY_HOUR",
  "STUDENT_DISCOUNT",
  "LADIES_NIGHT",
  "THEME_NIGHT",
  "FOOD_SPECIAL",
  "DRINK_SPECIAL",
  "COVER_DISCOUNT",
  "VIP_OFFER",
  "LIVE_MUSIC_EVENT",
  "GAME_NIGHT",
  "WEEKEND_SPECIAL",
];

// ---- Core function ----

/**
 * Gather competitive context for a bar. Returns null on failure or if no
 * competitors are found — caller should handle gracefully.
 *
 * Queries are ordered by relevance:
 *   1. Same district + same city (strongest competitive signal)
 *   2. If fewer than 2 in district → expand to same type in city
 *
 * Max 12 competitors to keep query volume reasonable.
 */
export async function getCompetitiveContext(
  barId: string,
  district: string | null | undefined,
  cityName: string | null | undefined,
  barType: string,
  thisBarAmenities: string[] = [],
): Promise<CompetitiveContext | null> {
  try {
    // ---- 1. Find competitor bars ----
    const competitorWhere: Record<string, unknown> = {
      id: { not: barId },
      isActive: true,
    };

    if (district && cityName) {
      competitorWhere.district = district;
      competitorWhere.cityName = cityName;
    } else if (cityName) {
      competitorWhere.cityName = cityName;
    } else {
      // No location data — fall back to same type
      (competitorWhere as any).type = barType;
    }

    let competitors = await prisma.bar.findMany({
      where: competitorWhere as any,
      select: {
        id: true,
        name: true,
        type: true,
        district: true,
        amenities: true,
      },
      take: 12,
    });

    // If too few district matches, expand to same type in city
    if (competitors.length < 2 && district && cityName) {
      const typeMatches = await prisma.bar.findMany({
        where: {
          id: { not: barId, notIn: competitors.map((c) => c.id) },
          type: barType as any,
          cityName,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          type: true,
          district: true,
          amenities: true,
        },
        take: 12 - competitors.length,
      });
      competitors = [...competitors, ...typeMatches];
    }

    if (competitors.length === 0) return null;

    const competitorIds = competitors.map((c) => c.id);
    const now = new Date();

    // ---- 2. Query active promotions at competitor bars ----
    const rawPromos = await prisma.barPromotion.findMany({
      where: {
        barId: { in: competitorIds },
        isActive: true,
        endDate: { gte: now },
      },
      select: {
        title: true,
        type: true,
        barId: true,
      },
    });

    // Resolve bar names for promos
    const barNameMap = new Map(competitors.map((c) => [c.id, c.name]));
    const activePromos: ActivePromo[] = rawPromos.map((p) => ({
      title: p.title,
      type: p.type,
      barName: barNameMap.get(p.barId) || "Unknown",
    }));

    // ---- 3. Query active events at competitor bars ----
    const activeEvents = await prisma.event.findMany({
      where: {
        venueId: { in: competitorIds },
        isActive: true,
        startTime: { gte: now },
      },
      select: {
        title: true,
        venueName: true,
        startTime: true,
      },
    });

    // ---- 4. Saturation analysis ----
    // Count how many competitors run each promotion type
    const typeCounts = new Map<string, number>();
    for (const promo of activePromos) {
      const count = typeCounts.get(promo.type) || 0;
      typeCounts.set(promo.type, count + 1);
    }

    // Saturated = 2+ competitors running the same type
    const saturatedTypes: string[] = [];
    for (const [type, count] of typeCounts) {
      if (count >= 2) saturatedTypes.push(type);
    }

    // White space = types NO ONE is running
    const activeTypes = new Set(activePromos.map((p) => p.type));
    const whiteSpaceTypes = ALL_PROMO_TYPES.filter((t) => !activeTypes.has(t));

    // ---- 5. Unique differentiators ----
    // Amenities that THIS bar has but zero competitors have
    const allCompetitorAmenities = new Set(
      competitors.flatMap((c) => c.amenities.map((a) => a.toLowerCase())),
    );
    const uniqueDifferentiators = (thisBarAmenities || []).filter(
      (a) => !allCompetitorAmenities.has(a.toLowerCase()),
    );

    return {
      competitors: competitors.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        district: c.district,
        amenities: c.amenities,
      })),
      activePromos,
      activeEvents,
      saturatedTypes,
      whiteSpaceTypes,
      uniqueDifferentiators,
      totalCompetitorPromos: activePromos.length,
      totalCompetitorEvents: activeEvents.length,
    };
  } catch (err) {
    console.warn("[competitive-context] Failed to gather context:", (err as Error).message);
    return null;
  }
}

// ---- Prompt block builders ----

/**
 * Build a prompt-ready text block from competitive context.
 * Returns empty string if context is null or has no meaningful data.
 */
export function buildCompetitiveContextBlock(
  ctx: CompetitiveContext | null,
  language: "en" | "fi",
): string {
  if (!ctx || ctx.competitors.length === 0) return "";

  const isFi = language === "fi";
  const lines: string[] = [];

  if (isFi) {
    lines.push(`\nKILPAILIJAKENTTÄ — Strateginen markkinatieto:`);

    // Competitor list
    const compNames = ctx.competitors.map((c) => c.name).join(", ");
    lines.push(`Alueen kilpailevat baarit (${ctx.competitors.length}): ${compNames}.`);

    // Active promotions
    if (ctx.totalCompetitorPromos > 0) {
      lines.push(`\nAktiiviset tarjoukset nyt: ${ctx.totalCompetitorPromos} kpl.`);
      const promoByType = groupByType(ctx.activePromos);
      for (const [type, count] of promoByType) {
        const label = promoTypeLabel(type, "fi");
        lines.push(`  • ${label}: ${count} baarilla käynnissä`);
      }
    } else {
      lines.push(`\nYhdelläkään kilpailijalla ei ole aktiivisia tarjouksia juuri nyt.`);
    }

    // Active events
    if (ctx.totalCompetitorEvents > 0) {
      lines.push(
        `\nAktiiviset tapahtumat nyt: ${ctx.totalCompetitorEvents} kpl (${ctx.activeEvents.map((e) => e.title).slice(0, 5).join(", ")})`,
      );
    }

    // Saturation warnings
    if (ctx.saturatedTypes.length > 0) {
      const satLabels = ctx.saturatedTypes.map((t) => promoTypeLabel(t, "fi")).join(", ");
      lines.push(
        `\nKYLLÄSTYNEET TYYPIT: ${satLabels} — vältä näitä, ne ovat ylikäytettyjä tässä kaupunginosassa. Erotu joukosta eri kulmalla.`,
      );
    }

    // White space opportunities
    if (ctx.whiteSpaceTypes.length > 0) {
      const topWhiteSpace = ctx.whiteSpaceTypes.slice(0, 4);
      const wsLabels = topWhiteSpace.map((t) => promoTypeLabel(t, "fi")).join(", ");
      lines.push(
        `\nVAPAAT TYYPIT: ${wsLabels} — kukaan ei käytä näitä. Tämä on erottautumismahdollisuus. Harkitse näitä ensisijaisina kulmina.`,
      );
    }

    // Unique differentiators
    if (ctx.uniqueDifferentiators.length > 0) {
      lines.push(
        `\nAinutlaatuiset vahvuudet: ${ctx.uniqueDifferentiators.join(", ")} — vain TÄLLÄ baarilla. Käytä näitä sisällössä.`,
      );
    }
  } else {
    lines.push(`\nCOMPETITIVE LANDSCAPE — Strategic market intelligence:`);

    // Competitor list
    const compNames = ctx.competitors.map((c) => c.name).join(", ");
    lines.push(`Nearby competing venues (${ctx.competitors.length}): ${compNames}.`);

    // Active promotions
    if (ctx.totalCompetitorPromos > 0) {
      lines.push(`\nActive promotions right now: ${ctx.totalCompetitorPromos}.`);
      const promoByType = groupByType(ctx.activePromos);
      for (const [type, count] of promoByType) {
        const label = promoTypeLabel(type, "en");
        lines.push(`  • ${label}: ${count} venue(s) running this`);
      }
    } else {
      lines.push(`\nNo competitor has active promotions right now.`);
    }

    // Active events
    if (ctx.totalCompetitorEvents > 0) {
      lines.push(
        `\nActive events right now: ${ctx.totalCompetitorEvents} (${ctx.activeEvents.map((e) => e.title).slice(0, 5).join(", ")})`,
      );
    }

    // Saturation warnings
    if (ctx.saturatedTypes.length > 0) {
      const satLabels = ctx.saturatedTypes.map((t) => promoTypeLabel(t, "en")).join(", ");
      lines.push(
        `\nSATURATED TYPES: ${satLabels} — avoid these, they're overused in this district. Differentiate with a different angle.`,
      );
    }

    // White space opportunities
    if (ctx.whiteSpaceTypes.length > 0) {
      const topWhiteSpace = ctx.whiteSpaceTypes.slice(0, 4);
      const wsLabels = topWhiteSpace.map((t) => promoTypeLabel(t, "en")).join(", ");
      lines.push(
        `\nWHITE SPACE: ${wsLabels} — nobody is running these. This is your differentiation opportunity. Consider these angles first.`,
      );
    }

    // Unique differentiators
    if (ctx.uniqueDifferentiators.length > 0) {
      lines.push(
        `\nUnique strengths: ${ctx.uniqueDifferentiators.join(", ")} — only THIS bar has these. Use them in the content.`,
      );
    }
  }

  return lines.join("\n");
}

// ---- Helpers ----

function groupByType(promos: ActivePromo[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const p of promos) {
    map.set(p.type, (map.get(p.type) || 0) + 1);
  }
  return map;
}

function promoTypeLabel(type: string, lang: "en" | "fi"): string {
  const labels: Record<string, { en: string; fi: string }> = {
    HAPPY_HOUR: { en: "Happy Hour", fi: "Happy Hour" },
    STUDENT_DISCOUNT: { en: "Student Discount", fi: "Opiskelija-alennus" },
    LADIES_NIGHT: { en: "Ladies Night", fi: "Ladies Night" },
    THEME_NIGHT: { en: "Theme Night", fi: "Teemailta" },
    FOOD_SPECIAL: { en: "Food Special", fi: "Ruokatarjous" },
    DRINK_SPECIAL: { en: "Drink Special", fi: "Juomatarjous" },
    COVER_DISCOUNT: { en: "Cover Discount", fi: "Sisäänpääsyalennus" },
    VIP_OFFER: { en: "VIP Offer", fi: "VIP-tarjous" },
    LIVE_MUSIC_EVENT: { en: "Live Music", fi: "Live-musiikki" },
    GAME_NIGHT: { en: "Game Night", fi: "Peli-ilta" },
    WEEKEND_SPECIAL: { en: "Weekend Special", fi: "Viikonlopputarjous" },
  };
  return labels[type]?.[lang] ?? type;
}
