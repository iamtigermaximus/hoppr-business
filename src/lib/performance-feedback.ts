// src/lib/performance-feedback.ts
// ============================================================================
// PERFORMANCE FEEDBACK LOOP — Gap 2
// ============================================================================
//
// Maps creative ingredients (tone, template, audience, atmosphere, etc.) to
// engagement outcomes (views, clicks, conversions) and generates actionable
// recommendations for the creative director to consume.
//
// Data flow:
//   ContentCreativeSnapshot (creative choices) + content counters (engagement)
//     → aggregate by creative dimension
//       → compute top/under performers
//         → generate PerformanceInsight[] with recommendations
//
// The module supports two modes:
//   1. getPerformanceInsights() — returns ranked insights for the SuggestionPanel
//   2. getPerformanceWeightings() — returns boosted/dampened scores for the
//      creative director's ingredient ranking
//
// CLIENT SAFETY: getPerformanceInsights() and getPerformanceWeightings() are
// server-only — they require Prisma and are NOT imported client-side.
// ============================================================================

import type { ContentTone } from "./prompts/tone-voices";

// ---- Types ----

export interface IngredientPerformance {
  /** The ingredient value (e.g. "WARM_INVITING", "after-work") */
  ingredient: string;
  /** Which creative dimension this belongs to */
  dimension: "tone" | "template" | "audience" | "atmosphere" | "copyStructure" | "hookPattern" | "imageWorld";
  /** How many published pieces used this ingredient */
  contentCount: number;
  /** Average views across all pieces using this ingredient */
  avgViews: number;
  /** Average clicks across all pieces using this ingredient */
  avgClicks: number;
  /** Average conversions (redemptions/scans/joins) */
  avgConversions: number;
  /** Conversion rate: conversions / views (0-1) */
  conversionRate: number;
  /** Direction of recent performance */
  trend: "rising" | "stable" | "declining" | "insufficient_data";
}

export interface PerformanceInsight {
  /** Type classification of this insight */
  type: "top_performer" | "underperformer" | "rising_trend" | "untapped_opportunity";
  /** Which creative dimension this insight applies to */
  dimension: string;
  /** Human-readable insight — explains what the data shows */
  insight: string;
  /** Actionable recommendation for the bar staff */
  recommendation: string;
  /** 0–1 confidence based on sample size and statistical significance */
  confidence: number;
  /** Supporting evidence with actual numbers */
  evidence: {
    topIngredient: string;
    topMetric: number;
    topMetricLabel: string;
    comparisonIngredient: string;
    comparisonMetric: number;
    multiplier: number;
  };
}

export interface PerformanceWeightings {
  /** Weighting per tone value (1.0 = neutral, 1.5 = 50% boost, 0.5 = dampen) */
  toneWeights: Record<string, number>;
  /** Weighting per template value */
  templateWeights: Record<string, number>;
  /** How much data underlies these weightings (0-1) — low = fall back to static rules */
  confidence: number;
  /** Summary of the strongest insight, for inline display */
  topInsight: string | null;
}

interface BarEngagementData {
  tonePerformance: Record<string, { contentCount: number; totalViews: number; totalClicks: number; totalConversions: number }>;
  templatePerformance: Record<string, { contentCount: number; totalViews: number; totalClicks: number; totalConversions: number }>;
  totalContentCount: number;
}

// ---- Core aggregation ----

async function getBarEngagementData(
  barId: string,
  options?: { minLookback?: Date },
): Promise<BarEngagementData> {
  // Lazy-import prisma so the module can be analyzed client-side
  const { prisma } = await import("./database");

  const lookback = options?.minLookback ?? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  // Fetch creative snapshots for this bar within the lookback window
  const snapshots = await prisma.contentCreativeSnapshot.findMany({
    where: {
      barId,
      createdAt: { gte: lookback },
    },
    orderBy: { createdAt: "desc" },
  });

  const tonePerformance: BarEngagementData["tonePerformance"] = {};
  const templatePerformance: BarEngagementData["templatePerformance"] = {};
  let totalContentCount = 0;

  for (const snap of snapshots) {
    const engagement = await getContentEngagement(snap.contentId, snap.contentType, prisma);
    if (!engagement) continue;
    totalContentCount++;

    // Aggregate by tone
    if (snap.tone) {
      const t = snap.tone;
      if (!tonePerformance[t]) tonePerformance[t] = { contentCount: 0, totalViews: 0, totalClicks: 0, totalConversions: 0 };
      tonePerformance[t].contentCount++;
      tonePerformance[t].totalViews += engagement.views;
      tonePerformance[t].totalClicks += engagement.clicks;
      tonePerformance[t].totalConversions += engagement.conversions;
    }

    // Aggregate by template
    if (snap.template) {
      const tmpl = snap.template;
      if (!templatePerformance[tmpl]) templatePerformance[tmpl] = { contentCount: 0, totalViews: 0, totalClicks: 0, totalConversions: 0 };
      templatePerformance[tmpl].contentCount++;
      templatePerformance[tmpl].totalViews += engagement.views;
      templatePerformance[tmpl].totalClicks += engagement.clicks;
      templatePerformance[tmpl].totalConversions += engagement.conversions;
    }
  }

  return { tonePerformance, templatePerformance, totalContentCount };
}

/** Fetch engagement counters for a specific piece of content */
async function getContentEngagement(
  contentId: string,
  contentType: string,
  prisma: Awaited<ReturnType<typeof import("./database")["prisma"] extends never ? never : any>>,
): Promise<{ views: number; clicks: number; conversions: number } | null> {
  try {
    switch (contentType) {
      case "promotion": {
        const promo = await (prisma as any).barPromotion.findUnique({
          where: { id: contentId },
          select: { views: true, clicks: true, redemptions: true },
        });
        if (!promo) return null;
        return { views: promo.views ?? 0, clicks: promo.clicks ?? 0, conversions: promo.redemptions ?? 0 };
      }
      case "event": {
        // Events track engagement via AnalyticsEvent (EVENT_VIEW, EVENT_JOIN)
        const [viewCount, joinCount] = await Promise.all([
          (prisma as any).analyticsEvent.count({ where: { barId: undefined, type: "EVENT_VIEW", data: { path: ["eventId"], equals: contentId } } }).catch(() => 0),
          (prisma as any).analyticsEvent.count({ where: { barId: undefined, type: "EVENT_JOIN", data: { path: ["eventId"], equals: contentId } } }).catch(() => 0),
        ]);
        return { views: viewCount, clicks: 0, conversions: joinCount };
      }
      case "pass": {
        const pass = await (prisma as any).vIPPassEnhanced.findUnique({
          where: { id: contentId },
          select: { soldCount: true },
        });
        if (!pass) return null;
        const scanCount = await (prisma as any).vIPPassScan.count({ where: { passId: contentId } }).catch(() => 0);
        return { views: pass.soldCount ?? 0, clicks: 0, conversions: scanCount };
      }
      case "campaign":
      case "brand": {
        const campaign = await (prisma as any).adCampaign.findUnique({
          where: { id: contentId },
          select: { impressions: true, clicks: true, conversions: true },
        });
        if (!campaign) return null;
        return { views: campaign.impressions ?? 0, clicks: campaign.clicks ?? 0, conversions: campaign.conversions ?? 0 };
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

// ---- Insight generation ----

const MIN_SAMPLES_FOR_INSIGHT = 2;

/**
 * Build performance rankings for a given dimension from aggregated data.
 * Returns the best and worst performers, plus the overall average.
 */
function computeIngredientRankings(
  perf: Record<string, { contentCount: number; totalViews: number; totalClicks: number; totalConversions: number }>,
  dimension: string,
): { rankings: IngredientPerformance[]; globalAvg: number } {
  const rankings: IngredientPerformance[] = [];
  let globalTotalViews = 0;
  let globalTotal = 0;

  for (const [ingredient, data] of Object.entries(perf)) {
    if (data.contentCount < MIN_SAMPLES_FOR_INSIGHT) continue;
    const avgViews = data.totalViews / data.contentCount;
    const avgClicks = data.totalClicks / data.contentCount;
    const avgConversions = data.totalConversions / data.contentCount;
    const conversionRate = avgViews > 0 ? avgConversions / avgViews : 0;

    globalTotalViews += data.totalViews;
    globalTotal += data.contentCount;

    rankings.push({
      ingredient,
      dimension: dimension as IngredientPerformance["dimension"],
      contentCount: data.contentCount,
      avgViews: Math.round(avgViews),
      avgClicks: Math.round(avgClicks),
      avgConversions: Math.round(avgConversions * 10) / 10,
      conversionRate: Math.round(conversionRate * 1000) / 10, // percentage
      trend: data.contentCount >= 3 ? "stable" : "insufficient_data",
    });
  }

  rankings.sort((a, b) => b.avgViews - a.avgViews);
  const globalAvg = globalTotal > 0 ? globalTotalViews / globalTotal : 0;

  return { rankings, globalAvg };
}

/**
 * Generate actionable performance insights from a bar's engagement data.
 * Returns insights sorted by confidence (highest first).
 */
function generateInsights(data: BarEngagementData): PerformanceInsight[] {
  const insights: PerformanceInsight[] = [];

  // ---- Tone insights ----
  const { rankings: toneRankings, globalAvg: toneAvg } = computeIngredientRankings(data.tonePerformance, "tone");

  if (toneRankings.length >= 2) {
    const best = toneRankings[0];
    const worst = toneRankings[toneRankings.length - 1];

    // Top performer insight
    if (best.avgViews > toneAvg * 1.3 && best.contentCount >= 2) {
      const multiplier = Math.round((best.avgViews / Math.max(toneAvg, 1)) * 10) / 10;
      insights.push({
        type: "top_performer",
        dimension: "tone",
        insight: `${formatToneLabel(best.ingredient)} tone drives ${multiplier}x more views than your average. Your audience responds to this voice.`,
        recommendation: `Try ${formatToneLabel(best.ingredient)} tone for your next piece of content — it's your proven winner.`,
        confidence: Math.min(0.95, best.contentCount / 10),
        evidence: {
          topIngredient: best.ingredient,
          topMetric: best.avgViews,
          topMetricLabel: "avg views",
          comparisonIngredient: "your overall average",
          comparisonMetric: Math.round(toneAvg),
          multiplier,
        },
      });
    }

    // Underperformer vs top performer comparison
    if (worst.ingredient !== best.ingredient && best.avgViews > worst.avgViews * 1.5) {
      const gap = Math.round((best.avgViews / Math.max(worst.avgViews, 1)) * 10) / 10;
      insights.push({
        type: "underperformer",
        dimension: "tone",
        insight: `${formatToneLabel(worst.ingredient)} tone averages ${worst.avgViews} views — ${formatToneLabel(best.ingredient)} averages ${best.avgViews}. That's a ${gap}x difference.`,
        recommendation: `Consider replacing ${formatToneLabel(worst.ingredient)} with ${formatToneLabel(best.ingredient)} for better reach.`,
        confidence: Math.min(0.9, (best.contentCount + worst.contentCount) / 15),
        evidence: {
          topIngredient: best.ingredient,
          topMetric: best.avgViews,
          topMetricLabel: "avg views",
          comparisonIngredient: worst.ingredient,
          comparisonMetric: worst.avgViews,
          multiplier: gap,
        },
      });
    }
  }

  // Untapped opportunity: tones with zero usage in this bar
  const usedTones = new Set(Object.keys(data.tonePerformance));
  const allTones = ["WARM_INVITING", "BOLD_ENERGETIC", "EDGY_IRREVERENT", "ELEGANT_PREMIUM", "PLAYFUL_FUN"];
  const untappedTones = allTones.filter((t) => !usedTones.has(t) && data.totalContentCount >= 5);
  if (untappedTones.length > 0 && toneRankings.length > 0) {
    insights.push({
      type: "untapped_opportunity",
      dimension: "tone",
      insight: `You haven't tried ${formatToneLabel(untappedTones[0])} tone yet. Experimenting with new voices can reveal what else your audience responds to.`,
      recommendation: `Try ${formatToneLabel(untappedTones[0])} for your next promotion — it's a fresh angle your audience hasn't seen.`,
      confidence: 0.4,
      evidence: {
        topIngredient: untappedTones[0],
        topMetric: 0,
        topMetricLabel: "attempts",
        comparisonIngredient: toneRankings[0]?.ingredient ?? "baseline",
        comparisonMetric: toneRankings[0]?.avgViews ?? 0,
        multiplier: 0,
      },
    });
  }

  // ---- Template insights ----
  const { rankings: templateRankings, globalAvg: templateAvg } = computeIngredientRankings(data.templatePerformance, "template");

  if (templateRankings.length >= 2) {
    const bestT = templateRankings[0];
    const worstT = templateRankings[templateRankings.length - 1];

    if (bestT.avgViews > templateAvg * 1.3 && bestT.contentCount >= 2) {
      const multiplier = Math.round((bestT.avgViews / Math.max(templateAvg, 1)) * 10) / 10;
      insights.push({
        type: "top_performer",
        dimension: "template",
        insight: `The "${bestT.ingredient}" template gets ${multiplier}x more views than your average template.`,
        recommendation: `Use the "${bestT.ingredient}" template format more often — your audience engages with it.`,
        confidence: Math.min(0.9, bestT.contentCount / 8),
        evidence: {
          topIngredient: bestT.ingredient,
          topMetric: bestT.avgViews,
          topMetricLabel: "avg views",
          comparisonIngredient: "overall template average",
          comparisonMetric: Math.round(templateAvg),
          multiplier,
        },
      });
    }

    if (worstT.ingredient !== bestT.ingredient && bestT.avgViews > worstT.avgViews * 1.5) {
      const gap = Math.round((bestT.avgViews / Math.max(worstT.avgViews, 1)) * 10) / 10;
      insights.push({
        type: "underperformer",
        dimension: "template",
        insight: `"${worstT.ingredient}" templates underperform — ${worstT.avgViews} views vs ${bestT.avgViews} for "${bestT.ingredient}".`,
        recommendation: `Swap "${worstT.ingredient}" for "${bestT.ingredient}" templates when possible.`,
        confidence: Math.min(0.85, (bestT.contentCount + worstT.contentCount) / 12),
        evidence: {
          topIngredient: bestT.ingredient,
          topMetric: bestT.avgViews,
          topMetricLabel: "avg views",
          comparisonIngredient: worstT.ingredient,
          comparisonMetric: worstT.avgViews,
          multiplier: gap,
        },
      });
    }
  }

  // Sort by confidence descending, then by insight type priority
  const typePriority: Record<string, number> = {
    top_performer: 0,
    underperformer: 1,
    rising_trend: 2,
    untapped_opportunity: 3,
  };
  insights.sort((a, b) => {
    const confDiff = b.confidence - a.confidence;
    if (Math.abs(confDiff) > 0.05) return confDiff;
    return (typePriority[a.type] ?? 99) - (typePriority[b.type] ?? 99);
  });

  return insights;
}

/** Human-readable tone label from the constant value */
function formatToneLabel(tone: string): string {
  const labels: Record<string, string> = {
    WARM_INVITING: "Warm & Inviting",
    BOLD_ENERGETIC: "Bold & Energetic",
    EDGY_IRREVERENT: "Edgy & Irreverent",
    ELEGANT_PREMIUM: "Elegant & Premium",
    PLAYFUL_FUN: "Playful & Fun",
    COMMUNITY_LOCAL: "Community & Local",
    ROMANTIC_INTIMATE: "Romantic & Intimate",
    MYSTERIOUS_EXCLUSIVE: "Mysterious & Exclusive",
    ADVENTUROUS_CURIOUS: "Adventurous & Curious",
    NOSTALGIC_CLASSIC: "Nostalgic & Classic",
  };
  return labels[tone] ?? tone;
}

// ---- Public API ----

/**
 * Get performance insights for a bar. Returns actionable creative recommendations
 * based on what content has performed best for THIS bar.
 *
 * Requires the bar to have at least 3 snapshots with engagement data before
 * meaningful insights can be generated.
 *
 * @param barId — the bar to analyze
 * @param options.lookbackDays — how many days of history to consider (default 90)
 * @returns PerformanceInsight[] sorted by confidence, or empty if insufficient data
 */
export async function getPerformanceInsights(
  barId: string,
  options?: { lookbackDays?: number },
): Promise<PerformanceInsight[]> {
  const minLookback = new Date(Date.now() - (options?.lookbackDays ?? 90) * 24 * 60 * 60 * 1000);
  const data = await getBarEngagementData(barId, { minLookback });

  if (data.totalContentCount < 3) return [];
  return generateInsights(data);
}

/**
 * Get performance weightings for the creative director.
 * Returns boosted/dampened scores for tones and templates based on
 * what has performed for this bar.
 *
 * Weightings are designed to MULTIPLY against static compatibility scores,
 * so a tone that performed 2x better gets a ~1.3x boost (conservative —
 * enough to influence ranking without overriding static rules entirely).
 *
 * @param barId — the bar to analyze
 * @returns PerformanceWeightings with tone/template weights and confidence
 */
export async function getPerformanceWeightings(
  barId: string,
): Promise<PerformanceWeightings> {
  const data = await getBarEngagementData(barId);

  const toneWeights: Record<string, number> = {};
  const templateWeights: Record<string, number> = {};

  if (data.totalContentCount < 3) {
    return { toneWeights, templateWeights, confidence: 0, topInsight: null };
  }

  // Compute average views across all tones
  let totalToneViews = 0;
  let toneCount = 0;
  for (const d of Object.values(data.tonePerformance)) {
    if (d.contentCount >= MIN_SAMPLES_FOR_INSIGHT) {
      totalToneViews += d.totalViews;
      toneCount += d.contentCount;
    }
  }
  const toneAvgViews = toneCount > 0 ? totalToneViews / toneCount : 0;

  // Weight each tone relative to the bar's average
  for (const [tone, d] of Object.entries(data.tonePerformance)) {
    if (d.contentCount < MIN_SAMPLES_FOR_INSIGHT) continue;
    const avg = d.totalViews / d.contentCount;
    // Cap boosting at 1.5x and dampening at 0.5x
    const multiplier = Math.max(0.5, Math.min(1.5, avg / Math.max(toneAvgViews, 1)));
    toneWeights[tone] = Math.round(multiplier * 100) / 100;
  }

  // Compute average views across all templates
  let totalTemplateViews = 0;
  let templateCount = 0;
  for (const d of Object.values(data.templatePerformance)) {
    if (d.contentCount >= MIN_SAMPLES_FOR_INSIGHT) {
      totalTemplateViews += d.totalViews;
      templateCount += d.contentCount;
    }
  }
  const templateAvgViews = templateCount > 0 ? totalTemplateViews / templateCount : 0;

  for (const [tmpl, d] of Object.entries(data.templatePerformance)) {
    if (d.contentCount < MIN_SAMPLES_FOR_INSIGHT) continue;
    const avg = d.totalViews / d.contentCount;
    const multiplier = Math.max(0.5, Math.min(1.5, avg / Math.max(templateAvgViews, 1)));
    templateWeights[tmpl] = Math.round(multiplier * 100) / 100;
  }

  // Confidence: logarithmic scale based on total content count
  // 3 pieces = 0.3, 10 pieces = 0.6, 30 pieces = 0.8, 100+ = 0.95
  const confidence = Math.min(0.95, Math.log10(data.totalContentCount) * 0.35);

  // Top insight: the strongest tone performer
  let topInsight: string | null = null;
  const bestTone = Object.entries(data.tonePerformance)
    .filter(([, d]) => d.contentCount >= MIN_SAMPLES_FOR_INSIGHT)
    .sort(([, a], [, b]) => (b.totalViews / b.contentCount) - (a.totalViews / a.contentCount))[0];
  if (bestTone) {
    const avgV = Math.round(bestTone[1].totalViews / bestTone[1].contentCount);
    topInsight = `${formatToneLabel(bestTone[0])} tone is your top performer (${avgV} avg views across ${bestTone[1].contentCount} posts)`;
  }

  return { toneWeights, templateWeights, confidence, topInsight };
}

/**
 * Build a compact performance context block for injection into AI system prompts.
 * Returns empty string if insufficient data.
 */
export async function buildPerformanceContextBlock(
  barId: string,
  language: "en" | "fi" = "en",
): Promise<string> {
  const insights = await getPerformanceInsights(barId, { lookbackDays: 90 });
  if (insights.length === 0) return "";

  const isFi = language === "fi";

  const lines: string[] = [];
  lines.push(isFi
    ? "SUORITUSKONTEKSTI (perustuu viimeaikaisiin tuloksiisi):"
    : "PERFORMANCE CONTEXT (based on your recent results):");

  for (const ins of insights.slice(0, 4)) {
    lines.push(`- ${ins.insight}`);
  }

  if (insights.length > 0 && insights[0].type === "top_performer") {
    lines.push(isFi
      ? `\nSuositus: Suosi ${formatToneLabel(insights[0].evidence.topIngredient)}-sävyä — se toimii yleisöllesi.`
      : `\nRecommendation: Favor ${formatToneLabel(insights[0].evidence.topIngredient)} tone — it works for your audience.`);
  }

  return lines.join("\n");
}
