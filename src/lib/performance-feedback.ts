// src/lib/performance-feedback.ts
// ============================================================================
// PERFORMANCE FEEDBACK LOOP — 14 creative dimensions + 4 interaction pairs
// ============================================================================
//
// Maps creative ingredients (tone, template, audience, atmosphere, coreMessage,
// imageWorld, copyStructure, hookPattern, cardLayout) to engagement outcomes
// (views, clicks, conversions) and generates actionable recommendations for
// the creative director to consume.
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

// ---- Types ----

/** Per-dimension aggregated engagement counters */
type PerfRecord = Record<
  string,
  { contentCount: number; totalViews: number; totalClicks: number; totalConversions: number }
>;

export interface IngredientPerformance {
  /** The ingredient value (e.g. "WARM_INVITING", "after-work") */
  ingredient: string;
  /** Which creative dimension this belongs to */
  dimension:
    | "tone"
    | "template"
    | "audience"
    | "atmosphere"
    | "copyStructure"
    | "hookPattern"
    | "imageWorld"
    | "coreMessage"
    | "cardLayout"
    | "focalPoint"
    | "season"
    | "timeOfDay"
    | "roomEnergy"
    | "mode";
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

/** Interaction effect between two creative dimensions */
export interface InteractionEffect {
  /** The two dimensions involved */
  dimensions: [string, string];
  /** The winning combination (e.g. "WARM_INVITING × intimate-personal") */
  combination: string;
  /** Average views for this specific combination */
  avgViews: number;
  /** Number of content pieces with this combination */
  contentCount: number;
  /** How much this combo outperforms the bar's overall average */
  multiplier: number;
}

export interface PerformanceWeightings {
  toneWeights: Record<string, number>;
  templateWeights: Record<string, number>;
  audienceWeights: Record<string, number>;
  atmosphereWeights: Record<string, number>;
  coreMessageWeights: Record<string, number>;
  imageWorldWeights: Record<string, number>;
  copyStructureWeights: Record<string, number>;
  hookPatternWeights: Record<string, number>;
  cardLayoutWeights: Record<string, number>;
  focalPointWeights: Record<string, number>;
  seasonWeights: Record<string, number>;
  timeOfDayWeights: Record<string, number>;
  roomEnergyWeights: Record<string, number>;
  modeWeights: Record<string, number>;
  /** How much data underlies these weightings (0-1) — low = fall back to static rules */
  confidence: number;
  /** Summary of the strongest insight, for inline display */
  topInsight: string | null;
  /** Top interaction effects (tone×atmosphere, hookPattern×copyStructure, audience×atmosphere, imageWorld×focalPoint) */
  interactionEffects: InteractionEffect[];
}

interface BarEngagementData {
  tonePerformance: PerfRecord;
  templatePerformance: PerfRecord;
  audiencePerformance: PerfRecord;
  atmospherePerformance: PerfRecord;
  coreMessagePerformance: PerfRecord;
  imageWorldPerformance: PerfRecord;
  copyStructurePerformance: PerfRecord;
  hookPatternPerformance: PerfRecord;
  cardLayoutPerformance: PerfRecord;
  focalPointPerformance: PerfRecord;
  seasonPerformance: PerfRecord;
  timeOfDayPerformance: PerfRecord;
  roomEnergyPerformance: PerfRecord;
  modePerformance: PerfRecord;
  /** Raw snapshots for interaction-effect analysis */
  snapshots: SnapshotWithEngagement[];
  totalContentCount: number;
}

interface EngagementCounters {
  views: number;
  clicks: number;
  conversions: number;
}

interface SnapshotWithEngagement {
  tone: string | null;
  template: string | null;
  audience: string[];
  atmosphere: string[];
  coreMessage: string | null;
  imageWorld: string | null;
  copyStructure: string | null;
  hookPattern: string | null;
  cardLayout: string | null;
  focalPoint: string | null;
  season: string | null;
  timeOfDay: string | null;
  roomEnergy: string | null;
  mode: string | null;
  engagement: EngagementCounters;
}

// ---- Known value pools for untapped-opportunity detection ----

const KNOWN_POOLS: Record<string, string[]> = {
  tone: ["WARM_INVITING", "BOLD_ENERGETIC", "EDGY_IRREVERENT", "ELEGANT_PREMIUM", "PLAYFUL_FUN"],
  audience: [
    "friend-groups", "couples", "work-colleagues", "music-lovers", "food-focused",
    "neighborhood-locals", "celebrants", "city-explorers", "casual-evening",
    "premium-seekers", "seasonal-celebrants", "meeting-people",
  ],
  atmosphere: [
    "warm-homey", "energetic-pulsating", "calm-serene", "curious-discovering",
    "polished-considered", "authentic-honest", "joyful-lighthearted", "intimate-personal",
    "celebratory-meaningful", "bold-distinctive", "playful-surprising",
    "nostalgic-storied", "easy-carefree",
  ],
  coreMessage: [
    "something-new", "night-is-special", "best-place", "did-you-know",
    "come-as-you-are", "your-place", "one-night-one-experience", "season-is-now",
  ],
  imageWorld: ["venue", "mood", "craft", "nature", "graphic", "city", "celebration", "abstract"],
  copyStructure: ["fab", "aida", "pas", "direct"],
  hookPattern: [
    "curiosity_gap", "urgency_scarcity", "social_proof", "direct_promise",
    "emotional_hook", "pattern_interrupt",
  ],
  cardLayout: ["split", "centered", "card", "full_bleed", "overlay"],
  focalPoint: [
    "bar-counter", "seating", "terrace", "details", "lighting",
    "stage", "entrance", "people", "in-the-glass", "walls-stories",
  ],
  season: [
    "early-spring", "spring", "early-summer", "high-summer", "late-summer",
    "early-autumn", "autumn", "november", "early-winter", "christmas",
    "deep-winter", "deep-freeze", "vappu", "midsummer",
  ],
  timeOfDay: [
    "morning", "midday", "afternoon", "golden-hour", "dusk",
    "evening", "late-night", "midnight",
  ],
  roomEnergy: [
    "just-opening", "first-arrivals", "quiet-company", "steady-hum",
    "busy-hour", "full-house", "peak-night",
  ],
  mode: ["brand", "promotional"],
};

// ---- Core aggregation ----

async function getBarEngagementData(
  barId: string,
  options?: { minLookback?: Date },
): Promise<BarEngagementData> {
  const { prisma } = await import("./database");

  const lookback = options?.minLookback ?? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const snapshots = await prisma.contentCreativeSnapshot.findMany({
    where: {
      barId,
      createdAt: { gte: lookback },
    },
    orderBy: { createdAt: "desc" },
  });

  const tonePerformance: PerfRecord = {};
  const templatePerformance: PerfRecord = {};
  const audiencePerformance: PerfRecord = {};
  const atmospherePerformance: PerfRecord = {};
  const coreMessagePerformance: PerfRecord = {};
  const imageWorldPerformance: PerfRecord = {};
  const copyStructurePerformance: PerfRecord = {};
  const hookPatternPerformance: PerfRecord = {};
  const cardLayoutPerformance: PerfRecord = {};
  const focalPointPerformance: PerfRecord = {};
  const seasonPerformance: PerfRecord = {};
  const timeOfDayPerformance: PerfRecord = {};
  const roomEnergyPerformance: PerfRecord = {};
  const modePerformance: PerfRecord = {};

  const snapshotsWithEngagement: SnapshotWithEngagement[] = [];
  let totalContentCount = 0;

  for (const snap of snapshots) {
    const engagement = await getContentEngagement(snap.contentId, snap.contentType, prisma);
    if (!engagement) continue;
    totalContentCount++;

    // Record snapshot for interaction-effect analysis
    snapshotsWithEngagement.push({
      tone: snap.tone,
      template: snap.template,
      audience: (snap.audience as string[]) ?? [],
      atmosphere: (snap.atmosphere as string[]) ?? [],
      coreMessage: snap.coreMessage,
      imageWorld: snap.imageWorld,
      copyStructure: snap.copyStructure,
      hookPattern: snap.hookPattern,
      cardLayout: snap.cardLayout,
      focalPoint: snap.focalPoint,
      season: snap.season,
      timeOfDay: snap.timeOfDay,
      roomEnergy: snap.roomEnergy,
      mode: snap.mode,
      engagement,
    });

    // Aggregate scalar dimensions
    aggregateScalar(tonePerformance, snap.tone, engagement);
    aggregateScalar(templatePerformance, snap.template, engagement);
    aggregateScalar(coreMessagePerformance, snap.coreMessage, engagement);
    aggregateScalar(imageWorldPerformance, snap.imageWorld, engagement);
    aggregateScalar(copyStructurePerformance, snap.copyStructure, engagement);
    aggregateScalar(hookPatternPerformance, snap.hookPattern, engagement);
    aggregateScalar(cardLayoutPerformance, snap.cardLayout, engagement);
    aggregateScalar(focalPointPerformance, snap.focalPoint, engagement);
    aggregateScalar(seasonPerformance, snap.season, engagement);
    aggregateScalar(timeOfDayPerformance, snap.timeOfDay, engagement);
    aggregateScalar(roomEnergyPerformance, snap.roomEnergy, engagement);
    aggregateScalar(modePerformance, snap.mode, engagement);

    // Aggregate JSON array dimensions — each element counts separately
    aggregateJsonArray(audiencePerformance, snap.audience, engagement);
    aggregateJsonArray(atmospherePerformance, snap.atmosphere, engagement);
  }

  return {
    tonePerformance,
    templatePerformance,
    audiencePerformance,
    atmospherePerformance,
    coreMessagePerformance,
    imageWorldPerformance,
    copyStructurePerformance,
    hookPatternPerformance,
    cardLayoutPerformance,
    focalPointPerformance,
    seasonPerformance,
    timeOfDayPerformance,
    roomEnergyPerformance,
    modePerformance,
    snapshots: snapshotsWithEngagement,
    totalContentCount,
  };
}

/** Aggregate a single scalar value into a PerfRecord */
function aggregateScalar(
  perf: PerfRecord,
  key: string | null | undefined,
  engagement: EngagementCounters,
): void {
  if (!key) return;
  if (!perf[key]) {
    perf[key] = { contentCount: 0, totalViews: 0, totalClicks: 0, totalConversions: 0 };
  }
  perf[key].contentCount++;
  perf[key].totalViews += engagement.views;
  perf[key].totalClicks += engagement.clicks;
  perf[key].totalConversions += engagement.conversions;
}

/** Aggregate a JSON array — each element is a separate ingredient usage */
function aggregateJsonArray(
  perf: PerfRecord,
  arr: unknown,
  engagement: EngagementCounters,
): void {
  if (!Array.isArray(arr)) return;
  for (const val of arr) {
    if (typeof val === "string") {
      aggregateScalar(perf, val, engagement);
    }
  }
}

/** Fetch engagement counters for a specific piece of content */
async function getContentEngagement(
  contentId: string,
  contentType: string,
  prisma: Awaited<
    ReturnType<typeof import("./database")["prisma"] extends never ? never : any>
  >,
): Promise<EngagementCounters | null> {
  try {
    switch (contentType) {
      case "promotion": {
        const promo = await (prisma as any).barPromotion.findUnique({
          where: { id: contentId },
          select: { views: true, clicks: true, redemptions: true },
        });
        if (!promo) return null;
        return {
          views: promo.views ?? 0,
          clicks: promo.clicks ?? 0,
          conversions: promo.redemptions ?? 0,
        };
      }
      case "event": {
        const [viewCount, joinCount] = await Promise.all([
          (prisma as any).analyticsEvent
            .count({
              where: {
                type: "EVENT_VIEW",
                data: { path: ["eventId"], equals: contentId },
              },
            })
            .catch(() => 0),
          (prisma as any).analyticsEvent
            .count({
              where: {
                type: "EVENT_JOIN",
                data: { path: ["eventId"], equals: contentId },
              },
            })
            .catch(() => 0),
        ]);
        return { views: viewCount, clicks: 0, conversions: joinCount };
      }
      case "pass": {
        const pass = await (prisma as any).vIPPassEnhanced.findUnique({
          where: { id: contentId },
          select: { soldCount: true },
        });
        if (!pass) return null;
        const scanCount = await (prisma as any).vIPPassScan
          .count({ where: { passId: contentId } })
          .catch(() => 0);
        return { views: pass.soldCount ?? 0, clicks: 0, conversions: scanCount };
      }
      case "campaign":
      case "brand": {
        const campaign = await (prisma as any).adCampaign.findUnique({
          where: { id: contentId },
          select: { impressions: true, clicks: true, conversions: true },
        });
        if (!campaign) return null;
        return {
          views: campaign.impressions ?? 0,
          clicks: campaign.clicks ?? 0,
          conversions: campaign.conversions ?? 0,
        };
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
  perf: PerfRecord,
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
      conversionRate: Math.round(conversionRate * 1000) / 10,
      trend: data.contentCount >= 3 ? "stable" : "insufficient_data",
    });
  }

  rankings.sort((a, b) => b.avgViews - a.avgViews);
  const globalAvg = globalTotal > 0 ? globalTotalViews / globalTotal : 0;

  return { rankings, globalAvg };
}

/**
 * Generate insights for a single dimension from its performance record.
 */
function generateDimensionInsights(
  perf: PerfRecord,
  dimension: string,
  dimensionLabel: string,
  totalContentCount: number,
  formatLabel: (v: string) => string,
): PerformanceInsight[] {
  const insights: PerformanceInsight[] = [];
  const { rankings, globalAvg } = computeIngredientRankings(perf, dimension);

  if (rankings.length < 2) return insights;

  const best = rankings[0];
  const worst = rankings[rankings.length - 1];

  // Top performer insight
  if (best.avgViews > globalAvg * 1.3 && best.contentCount >= 2) {
    const multiplier = Math.round((best.avgViews / Math.max(globalAvg, 1)) * 10) / 10;
    insights.push({
      type: "top_performer",
      dimension,
      insight: `${dimensionLabel} "${formatLabel(best.ingredient)}" drives ${multiplier}x more views than your average. Your audience responds to this.`,
      recommendation: `Try "${formatLabel(best.ingredient)}" for your next piece of content — it's your proven winner in ${dimensionLabel.toLowerCase()}.`,
      confidence: Math.min(0.95, best.contentCount / 10),
      evidence: {
        topIngredient: best.ingredient,
        topMetric: best.avgViews,
        topMetricLabel: "avg views",
        comparisonIngredient: "your overall average",
        comparisonMetric: Math.round(globalAvg),
        multiplier,
      },
    });
  }

  // Underperformer vs top performer
  if (worst.ingredient !== best.ingredient && best.avgViews > worst.avgViews * 1.5) {
    const gap = Math.round((best.avgViews / Math.max(worst.avgViews, 1)) * 10) / 10;
    insights.push({
      type: "underperformer",
      dimension,
      insight: `"${formatLabel(worst.ingredient)}" averages ${worst.avgViews} views — "${formatLabel(best.ingredient)}" averages ${best.avgViews}. That's a ${gap}x difference.`,
      recommendation: `Consider replacing "${formatLabel(worst.ingredient)}" with "${formatLabel(best.ingredient)}" for better reach.`,
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

  // Untapped opportunity — only for dimensions with known value pools
  const pool = KNOWN_POOLS[dimension];
  if (pool && totalContentCount >= 5) {
    const usedValues = new Set(Object.keys(perf));
    const untapped = pool.filter((v) => !usedValues.has(v));
    if (untapped.length > 0) {
      insights.push({
        type: "untapped_opportunity",
        dimension,
        insight: `You haven't tried "${formatLabel(untapped[0])}" yet. Experimenting with new options can reveal what else your audience responds to.`,
        recommendation: `Try "${formatLabel(untapped[0])}" for your next piece — it's a fresh angle in ${dimensionLabel.toLowerCase()}.`,
        confidence: 0.4,
        evidence: {
          topIngredient: untapped[0],
          topMetric: 0,
          topMetricLabel: "attempts",
          comparisonIngredient: rankings[0]?.ingredient ?? "baseline",
          comparisonMetric: rankings[0]?.avgViews ?? 0,
          multiplier: 0,
        },
      });
    }
  }

  return insights;
}

/**
 * Generate actionable performance insights from a bar's engagement data.
 * Returns insights sorted by confidence (highest first).
 */
function generateInsights(data: BarEngagementData): PerformanceInsight[] {
  const allInsights: PerformanceInsight[] = [];

  // Dimension config: [perfRecord, dimensionKey, displayLabel, formatFn]
  const dimensions: [PerfRecord, string, string, (v: string) => string][] = [
    [data.tonePerformance, "tone", "Tone", formatToneLabel],
    [data.templatePerformance, "template", "Template", (v) => `"${v}"`],
    [data.audiencePerformance, "audience", "Audience", formatAudienceLabel],
    [data.atmospherePerformance, "atmosphere", "Atmosphere", formatAtmosphereLabel],
    [data.coreMessagePerformance, "coreMessage", "Core Message", formatCoreMessageLabel],
    [data.imageWorldPerformance, "imageWorld", "Image World", formatImageWorldLabel],
    [data.copyStructurePerformance, "copyStructure", "Copy Structure", (v) => v.toUpperCase()],
    [data.hookPatternPerformance, "hookPattern", "Hook Pattern", formatHookPatternLabel],
    [data.cardLayoutPerformance, "cardLayout", "Card Layout", (v) => v],
    [data.focalPointPerformance, "focalPoint", "Focal Point", formatFocalPointLabel],
    [data.seasonPerformance, "season", "Season", formatSeasonLabel],
    [data.timeOfDayPerformance, "timeOfDay", "Time of Day", formatTimeOfDayLabel],
    [data.roomEnergyPerformance, "roomEnergy", "Room Energy", formatRoomEnergyLabel],
    [data.modePerformance, "mode", "Mode", formatModeLabel],
  ];

  for (const [perf, dimKey, dimLabel, formatFn] of dimensions) {
    const dimInsights = generateDimensionInsights(
      perf,
      dimKey,
      dimLabel,
      data.totalContentCount,
      formatFn,
    );
    allInsights.push(...dimInsights);
  }

  // ---- Interaction effects ----
  // 4 cross-dimension pairs: tone×atmosphere, hookPattern×copyStructure,
  // audience×atmosphere, imageWorld×focalPoint — winning formulas surface here
  const interactionInsights = generateAllInteractionInsights(data);
  allInsights.push(...interactionInsights);

  // Sort by confidence descending, then by insight type priority
  const typePriority: Record<string, number> = {
    top_performer: 0,
    underperformer: 1,
    interaction_effect: 1.5,
    rising_trend: 2,
    untapped_opportunity: 3,
  };
  allInsights.sort((a, b) => {
    const confDiff = b.confidence - a.confidence;
    if (Math.abs(confDiff) > 0.05) return confDiff;
    return (typePriority[a.type] ?? 99) - (typePriority[b.type] ?? 99);
  });

  return allInsights;
}

// ---------------------------------------------------------------------------
// Interaction-effect analysis — cross-dimension "winning formula" detection
// ---------------------------------------------------------------------------

/** Internal combo map entry used by the builder and consumers */
interface ComboEntry {
  totalViews: number;
  count: number;
  valueA: string;
  valueB: string;
}

/**
 * Generic combo-map builder. Groups all snapshots by a cross-product of two
 * creative dimensions (either scalar or JSON-array fields), summing engagement
 * per unique pair. Returns a Map keyed by "valueA×valueB".
 */
function buildComboMap(
  data: BarEngagementData,
  dimA: { field: keyof SnapshotWithEngagement; isArray: boolean },
  dimB: { field: keyof SnapshotWithEngagement; isArray: boolean },
): Map<string, ComboEntry> {
  const comboMap = new Map<string, ComboEntry>();

  for (const s of data.snapshots) {
    const rawA: (string | null)[] = dimA.isArray
      ? (s[dimA.field] as string[] | null) ?? []
      : [s[dimA.field] as string | null];
    const rawB: (string | null)[] = dimB.isArray
      ? (s[dimB.field] as string[] | null) ?? []
      : [s[dimB.field] as string | null];

    const valuesA = rawA.filter((v): v is string => typeof v === "string" && v.length > 0);
    const valuesB = rawB.filter((v): v is string => typeof v === "string" && v.length > 0);
    if (valuesA.length === 0 || valuesB.length === 0) continue;

    for (const va of valuesA) {
      for (const vb of valuesB) {
        const key = `${va}×${vb}`;
        const existing = comboMap.get(key);
        if (existing) {
          existing.totalViews += s.engagement.views;
          existing.count++;
        } else {
          comboMap.set(key, {
            totalViews: s.engagement.views,
            count: 1,
            valueA: va,
            valueB: vb,
          });
        }
      }
    }
  }

  return comboMap;
}

/**
 * Generate interaction-effect insights for the 4 highest-impact
 * cross-dimension pairs:
 *   1. tone × atmosphere        (mood + environment)
 *   2. hookPattern × copyStructure  (hook + narrative arc)
 *   3. audience × atmosphere      (who + vibe)
 *   4. imageWorld × focalPoint    (visual language + what the eye sees)
 *
 * Identifies "winning formulas" — specific combos that outperform >1.3x the
 * bar's global average. These surface in the prompt context block so the AI
 * gets actionable combo guidance, not just isolated ingredient tips.
 */
function generateAllInteractionInsights(data: BarEngagementData): PerformanceInsight[] {
  const insights: PerformanceInsight[] = [];
  if (data.totalContentCount < 5 || data.snapshots.length < 3) return insights;

  // Compute global average views for benchmarking
  let globalTotalViews = 0;
  for (const s of data.snapshots) globalTotalViews += s.engagement.views;
  const globalAvgViews =
    data.snapshots.length > 0 ? globalTotalViews / data.snapshots.length : 0;

  // Pair definitions: dimension key, field accessors, label formatters
  const pairs: {
    key: string;
    dimA: { field: keyof SnapshotWithEngagement; isArray: boolean; format: (v: string) => string };
    dimB: { field: keyof SnapshotWithEngagement; isArray: boolean; format: (v: string) => string };
  }[] = [
    {
      key: "tone×atmosphere",
      dimA: { field: "tone", isArray: false, format: formatToneLabel },
      dimB: { field: "atmosphere", isArray: true, format: formatAtmosphereLabel },
    },
    {
      key: "hookPattern×copyStructure",
      dimA: { field: "hookPattern", isArray: false, format: formatHookPatternLabel },
      dimB: { field: "copyStructure", isArray: false, format: (v) => v.toUpperCase() },
    },
    {
      key: "audience×atmosphere",
      dimA: { field: "audience", isArray: true, format: formatAudienceLabel },
      dimB: { field: "atmosphere", isArray: true, format: formatAtmosphereLabel },
    },
    {
      key: "imageWorld×focalPoint",
      dimA: { field: "imageWorld", isArray: false, format: formatImageWorldLabel },
      dimB: { field: "focalPoint", isArray: false, format: formatFocalPointLabel },
    },
  ];

  for (const pair of pairs) {
    const comboMap = buildComboMap(data, pair.dimA, pair.dimB);

    const combos = Array.from(comboMap.entries())
      .filter(([, v]) => v.count >= MIN_SAMPLES_FOR_INSIGHT)
      .map(([key, v]) => ({
        key,
        avgViews: v.totalViews / v.count,
        count: v.count,
        valueA: v.valueA,
        valueB: v.valueB,
        multiplier: globalAvgViews > 0 ? (v.totalViews / v.count) / globalAvgViews : 1,
      }))
      .sort((a, b) => b.avgViews - a.avgViews);

    // Surface top 2 combos that outperform significantly (>1.3x)
    const topCombos = combos.filter((c) => c.multiplier > 1.3).slice(0, 2);

    for (const combo of topCombos) {
      const labelA = pair.dimA.format(combo.valueA);
      const labelB = pair.dimB.format(combo.valueB);

      insights.push({
        type: "top_performer" as any,
        dimension: pair.key,
        insight: `The combination of ${labelA} + ${labelB} is a winning formula — ${Math.round(combo.multiplier * 10) / 10}x your average views (across ${combo.count} pieces).`,
        recommendation: `Try pairing ${labelA} with ${labelB} again — this combo consistently performs.`,
        confidence: Math.min(0.85, combo.count / 8),
        evidence: {
          topIngredient: `${combo.valueA}×${combo.valueB}`,
          topMetric: Math.round(combo.avgViews),
          topMetricLabel: "avg views",
          comparisonIngredient: "your overall average",
          comparisonMetric: Math.round(globalAvgViews),
          multiplier: Math.round(combo.multiplier * 10) / 10,
        },
      });
    }
  }

  return insights;
}

// ---- Label formatters ----

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

function formatAudienceLabel(audience: string): string {
  const labels: Record<string, string> = {
    "friend-groups": "Friend Groups",
    "couples": "Couples",
    "work-colleagues": "Work Colleagues",
    "music-lovers": "Music Lovers",
    "food-focused": "Food-Focused",
    "neighborhood-locals": "Neighborhood Locals",
    "celebrants": "Celebrants",
    "city-explorers": "City Explorers",
    "casual-evening": "Casual Evening",
    "premium-seekers": "Premium Seekers",
    "seasonal-celebrants": "Seasonal Celebrants",
    "meeting-people": "Meeting People",
  };
  return labels[audience] ?? audience;
}

function formatAtmosphereLabel(atmosphere: string): string {
  const labels: Record<string, string> = {
    "warm-homey": "Warm & Homey",
    "energetic-pulsating": "Energetic & Pulsating",
    "calm-serene": "Calm & Serene",
    "curious-discovering": "Curious & Discovering",
    "polished-considered": "Polished & Considered",
    "authentic-honest": "Authentic & Honest",
    "joyful-lighthearted": "Joyful & Lighthearted",
    "intimate-personal": "Intimate & Personal",
    "celebratory-meaningful": "Celebratory & Meaningful",
    "bold-distinctive": "Bold & Distinctive",
    "playful-surprising": "Playful & Surprising",
    "nostalgic-storied": "Nostalgic & Storied",
    "easy-carefree": "Easy & Carefree",
  };
  return labels[atmosphere] ?? atmosphere;
}

function formatCoreMessageLabel(msg: string): string {
  const labels: Record<string, string> = {
    "something-new": "Something New",
    "night-is-special": "Night Is Special",
    "best-place": "Best Place",
    "did-you-know": "Did You Know",
    "come-as-you-are": "Come As You Are",
    "your-place": "Your Place",
    "one-night-one-experience": "One Night, One Experience",
    "season-is-now": "Season Is Now",
  };
  return labels[msg] ?? msg;
}

function formatImageWorldLabel(world: string): string {
  const labels: Record<string, string> = {
    "venue": "Venue",
    "mood": "Mood",
    "craft": "Craft",
    "nature": "Nature",
    "graphic": "Graphic",
    "city": "City",
    "celebration": "Celebration",
    "abstract": "Abstract",
  };
  return labels[world] ?? world;
}

function formatHookPatternLabel(pattern: string): string {
  const labels: Record<string, string> = {
    "curiosity_gap": "Curiosity Gap",
    "urgency_scarcity": "Urgency/Scarcity",
    "social_proof": "Social Proof",
    "direct_promise": "Direct Promise",
    "emotional_hook": "Emotional Hook",
    "pattern_interrupt": "Pattern Interrupt",
  };
  return labels[pattern] ?? pattern;
}

function formatFocalPointLabel(point: string): string {
  const labels: Record<string, string> = {
    "bar-counter": "Bar Counter",
    "seating": "Seating",
    "terrace": "Terrace",
    "details": "Details",
    "lighting": "Lighting",
    "stage": "Stage",
    "entrance": "Entrance",
    "people": "People",
    "in-the-glass": "In the Glass",
    "walls-stories": "Walls & Stories",
  };
  return labels[point] ?? point;
}

function formatSeasonLabel(season: string): string {
  const labels: Record<string, string> = {
    "early-spring": "Early Spring",
    "spring": "Spring",
    "early-summer": "Early Summer",
    "high-summer": "High Summer",
    "late-summer": "Late Summer",
    "early-autumn": "Early Autumn",
    "autumn": "Autumn",
    "november": "November",
    "early-winter": "Early Winter",
    "christmas": "Christmas Season",
    "deep-winter": "Deep Winter",
    "deep-freeze": "Deep Freeze",
    "vappu": "Vappu",
    "midsummer": "Midsummer",
  };
  return labels[season] ?? season;
}

function formatTimeOfDayLabel(tod: string): string {
  const labels: Record<string, string> = {
    "morning": "Morning",
    "midday": "Midday",
    "afternoon": "Afternoon",
    "golden-hour": "Golden Hour",
    "dusk": "Dusk",
    "evening": "Evening",
    "late-night": "Late Night",
    "midnight": "Midnight",
  };
  return labels[tod] ?? tod;
}

function formatRoomEnergyLabel(energy: string): string {
  const labels: Record<string, string> = {
    "just-opening": "Just Opening",
    "first-arrivals": "First Arrivals",
    "quiet-company": "Quiet Company",
    "steady-hum": "Steady Hum",
    "busy-hour": "Busy Hour",
    "full-house": "Full House",
    "peak-night": "Peak Night",
  };
  return labels[energy] ?? energy;
}

function formatModeLabel(mode: string): string {
  const labels: Record<string, string> = {
    "brand": "Brand",
    "promotional": "Promotional",
  };
  return labels[mode] ?? mode;
}

// ---- Public API ----

/**
 * Get performance insights for a bar. Returns actionable creative recommendations
 * based on what content has performed best for THIS bar across all 14 creative
 * dimensions plus interaction effects.
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
  const minLookback = new Date(
    Date.now() - (options?.lookbackDays ?? 90) * 24 * 60 * 60 * 1000,
  );
  const data = await getBarEngagementData(barId, { minLookback });

  if (data.totalContentCount < 3) return [];
  return generateInsights(data);
}

/**
 * Compute performance weightings for a single dimension's PerfRecord.
 * Returns { [ingredient]: multiplier } where 1.0 = neutral, 1.5 = 50% boost, 0.5 = dampen.
 */
function computeDimensionWeights(perf: PerfRecord): Record<string, number> {
  const weights: Record<string, number> = {};

  let totalViews = 0;
  let count = 0;
  for (const d of Object.values(perf)) {
    if (d.contentCount >= MIN_SAMPLES_FOR_INSIGHT) {
      totalViews += d.totalViews;
      count += d.contentCount;
    }
  }
  const avgViews = count > 0 ? totalViews / count : 0;

  for (const [key, d] of Object.entries(perf)) {
    if (d.contentCount < MIN_SAMPLES_FOR_INSIGHT) continue;
    const avg = d.totalViews / d.contentCount;
    const multiplier = Math.max(0.5, Math.min(1.5, avg / Math.max(avgViews, 1)));
    weights[key] = Math.round(multiplier * 100) / 100;
  }

  return weights;
}

/**
 * Get performance weightings for the creative director.
 * Returns boosted/dampened scores for all 9 creative dimensions plus
 * interaction effects, based on what has performed for this bar.
 *
 * Weightings are designed to MULTIPLY against static compatibility scores,
 * so a tone that performed 2x better gets a ~1.3x boost (conservative —
 * enough to influence ranking without overriding static rules entirely).
 *
 * @param barId — the bar to analyze
 * @returns PerformanceWeightings with weights for all dimensions and confidence
 */
export async function getPerformanceWeightings(
  barId: string,
): Promise<PerformanceWeightings> {
  const data = await getBarEngagementData(barId);

  const empty = {
    toneWeights: {} as Record<string, number>,
    templateWeights: {} as Record<string, number>,
    audienceWeights: {} as Record<string, number>,
    atmosphereWeights: {} as Record<string, number>,
    coreMessageWeights: {} as Record<string, number>,
    imageWorldWeights: {} as Record<string, number>,
    copyStructureWeights: {} as Record<string, number>,
    hookPatternWeights: {} as Record<string, number>,
    cardLayoutWeights: {} as Record<string, number>,
    focalPointWeights: {} as Record<string, number>,
    seasonWeights: {} as Record<string, number>,
    timeOfDayWeights: {} as Record<string, number>,
    roomEnergyWeights: {} as Record<string, number>,
    modeWeights: {} as Record<string, number>,
    confidence: 0,
    topInsight: null as string | null,
    interactionEffects: [] as InteractionEffect[],
  };

  if (data.totalContentCount < 3) return empty;

  // Compute weights for all 14 dimensions
  const toneWeights = computeDimensionWeights(data.tonePerformance);
  const templateWeights = computeDimensionWeights(data.templatePerformance);
  const audienceWeights = computeDimensionWeights(data.audiencePerformance);
  const atmosphereWeights = computeDimensionWeights(data.atmospherePerformance);
  const coreMessageWeights = computeDimensionWeights(data.coreMessagePerformance);
  const imageWorldWeights = computeDimensionWeights(data.imageWorldPerformance);
  const copyStructureWeights = computeDimensionWeights(data.copyStructurePerformance);
  const hookPatternWeights = computeDimensionWeights(data.hookPatternPerformance);
  const cardLayoutWeights = computeDimensionWeights(data.cardLayoutPerformance);
  const focalPointWeights = computeDimensionWeights(data.focalPointPerformance);
  const seasonWeights = computeDimensionWeights(data.seasonPerformance);
  const timeOfDayWeights = computeDimensionWeights(data.timeOfDayPerformance);
  const roomEnergyWeights = computeDimensionWeights(data.roomEnergyPerformance);
  const modeWeights = computeDimensionWeights(data.modePerformance);

  // Confidence: logarithmic scale based on total content count
  // 3 pieces = 0.3, 10 pieces = 0.6, 30 pieces = 0.8, 100+ = 0.95
  const confidence = Math.min(0.95, Math.log10(data.totalContentCount) * 0.35);

  // Top insight: find the strongest performer across all dimensions
  const allWeightedEntries: { dimension: string; key: string; weight: number }[] = [];
  const weightCollections: [string, Record<string, number>][] = [
    ["tone", toneWeights],
    ["template", templateWeights],
    ["audience", audienceWeights],
    ["atmosphere", atmosphereWeights],
    ["coreMessage", coreMessageWeights],
    ["imageWorld", imageWorldWeights],
    ["copyStructure", copyStructureWeights],
    ["hookPattern", hookPatternWeights],
    ["cardLayout", cardLayoutWeights],
    ["focalPoint", focalPointWeights],
    ["season", seasonWeights],
    ["timeOfDay", timeOfDayWeights],
    ["roomEnergy", roomEnergyWeights],
    ["mode", modeWeights],
  ];

  for (const [dim, weights] of weightCollections) {
    for (const [key, weight] of Object.entries(weights)) {
      allWeightedEntries.push({ dimension: dim, key, weight });
    }
  }

  allWeightedEntries.sort((a, b) => Math.abs(b.weight - 1) - Math.abs(a.weight - 1));

  let topInsight: string | null = null;
  if (allWeightedEntries.length > 0) {
    const top = allWeightedEntries[0];
    const formatters: Record<string, (v: string) => string> = {
      tone: formatToneLabel,
      audience: formatAudienceLabel,
      atmosphere: formatAtmosphereLabel,
      coreMessage: formatCoreMessageLabel,
      imageWorld: formatImageWorldLabel,
      hookPattern: formatHookPatternLabel,
      focalPoint: formatFocalPointLabel,
      season: formatSeasonLabel,
      timeOfDay: formatTimeOfDayLabel,
      roomEnergy: formatRoomEnergyLabel,
      mode: formatModeLabel,
    };
    const fmt = formatters[top.dimension] ?? ((v: string) => v);
    const dir = top.weight > 1 ? "top performer" : "underperformer";
    topInsight = `${fmt(top.key)} (${top.dimension}) is your ${dir} at ${top.weight.toFixed(2)}x`;
  }

  // Build interaction effects from the snapshots
  const interactionEffects = buildInteractionEffects(data);

  return {
    toneWeights,
    templateWeights,
    audienceWeights,
    atmosphereWeights,
    coreMessageWeights,
    imageWorldWeights,
    copyStructureWeights,
    hookPatternWeights,
    cardLayoutWeights,
    focalPointWeights,
    seasonWeights,
    timeOfDayWeights,
    roomEnergyWeights,
    modeWeights,
    confidence,
    topInsight,
    interactionEffects,
  };
}

/**
 * Build interaction-effect data for all 4 cross-dimension pairs.
 * Used by getPerformanceWeightings() to attach combo multipliers to the
 * weightings object consumed by the Creative Director's data-driven selection.
 */
function buildInteractionEffects(data: BarEngagementData): InteractionEffect[] {
  if (data.snapshots.length < 3) return [];

  let globalTotalViews = 0;
  for (const s of data.snapshots) globalTotalViews += s.engagement.views;
  const globalAvgViews =
    data.snapshots.length > 0 ? globalTotalViews / data.snapshots.length : 0;

  /** Convert a ComboEntry map to InteractionEffect[] for a given pair */
  function mapToEffects(
    comboMap: Map<string, ComboEntry>,
    dimensions: [string, string],
  ): InteractionEffect[] {
    return Array.from(comboMap.entries())
      .filter(([, v]) => v.count >= MIN_SAMPLES_FOR_INSIGHT)
      .map(([key, v]) => ({
        dimensions,
        combination: key,
        avgViews: Math.round((v.totalViews / v.count) * 10) / 10,
        contentCount: v.count,
        multiplier:
          globalAvgViews > 0
            ? Math.round(((v.totalViews / v.count) / globalAvgViews) * 10) / 10
            : 1,
      }))
      .filter((e) => e.multiplier !== 1);
  }

  // Build all 4 pair combos via the generic helper
  const allEffects: InteractionEffect[] = [
    ...mapToEffects(
      buildComboMap(data, { field: "tone", isArray: false }, { field: "atmosphere", isArray: true }),
      ["tone", "atmosphere"],
    ),
    ...mapToEffects(
      buildComboMap(data, { field: "hookPattern", isArray: false }, { field: "copyStructure", isArray: false }),
      ["hookPattern", "copyStructure"],
    ),
    ...mapToEffects(
      buildComboMap(data, { field: "audience", isArray: true }, { field: "atmosphere", isArray: true }),
      ["audience", "atmosphere"],
    ),
    ...mapToEffects(
      buildComboMap(data, { field: "imageWorld", isArray: false }, { field: "focalPoint", isArray: false }),
      ["imageWorld", "focalPoint"],
    ),
  ];

  return allEffects
    .sort((a, b) => b.multiplier - a.multiplier)
    .slice(0, 8); // expanded from 5 — now covers 4 dimension pairs
}

/**
 * Build a compact performance context block for injection into AI system prompts.
 * Returns empty string if insufficient data. Now covers all 14 creative dimensions
 * plus 4 interaction pairs (tone×atmosphere, hookPattern×copyStructure,
 * audience×atmosphere, imageWorld×focalPoint).
 */
export async function buildPerformanceContextBlock(
  barId: string,
  language: "en" | "fi" = "en",
): Promise<string> {
  const insights = await getPerformanceInsights(barId, { lookbackDays: 90 });
  if (insights.length === 0) return "";

  const isFi = language === "fi";

  const lines: string[] = [];
  lines.push(
    isFi
      ? "SUORITUSKONTEKSTI (perustuu viimeaikaisiin tuloksiisi kaikilla luovilla ulottuvuuksilla):"
      : "PERFORMANCE CONTEXT (based on your recent results across all creative dimensions):",
  );

  // Surface the top 6 insights (was 4 — expanded to cover all dimensions)
  for (const ins of insights.slice(0, 6)) {
    lines.push(`- [${ins.dimension}] ${ins.insight}`);
  }

  // Add a consolidated recommendation line
  const topPerformers = insights
    .filter((i) => i.type === "top_performer")
    .slice(0, 2);
  if (topPerformers.length > 0) {
    const tpLabels = topPerformers.map((i) => {
      const fmt =
        i.dimension === "tone"
          ? formatToneLabel(i.evidence.topIngredient)
          : i.evidence.topIngredient;
      return `${i.dimension}: ${fmt}`;
    });
    lines.push(
      isFi
        ? `\nSuositus: Hyödynnä todistetusti toimivia valintoja — ${tpLabels.join("; ")}.`
        : `\nRecommendation: Leverage your proven winners — ${tpLabels.join("; ")}.`,
    );
  }

  return lines.join("\n");
}
