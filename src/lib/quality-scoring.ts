// lib/quality-scoring.ts
// 5-dimension quality scoring engine for bars (0-100 scale)
//
// Dimensions:
//   1. Profile Completeness (25%) — field presence
//   2. Visual Quality (15%)       — images and logo
//   3. Content Freshness (20%)    — recency of promos, events, updates
//   4. Consumer Engagement (25%)  — views, clicks, shares, pass sales
//   5. Activity Level (15%)       — active promos, events, VIP passes

// ---- Types ----

export interface ScoreBreakdown {
  profileCompleteness: number; // max 25
  visualQuality: number;       // max 15
  contentFreshness: number;    // max 20
  consumerEngagement: number;  // max 25
  activityLevel: number;       // max 15
  total: number;               // 0-100
}

export interface QualityInput {
  // Profile fields
  description: string | null;
  coverImage: string | null;
  logoUrl: string | null;
  operatingHours: Record<string, unknown> | null;
  amenities: string[];
  website: string | null;
  instagram: string | null;
  phone: string | null;
  email: string | null;
  priceRange: string | null;

  // Visual
  imageUrls: string[];

  // Freshness metadata
  updatedAt: Date;
  latestPromoStartDate: Date | null;
  latestEventDate: Date | null;

  // Engagement metrics
  profileViews: number;
  directionClicks: number;
  websiteClicks: number;
  callClicks: number;
  shareCount: number;

  // Activity counts
  activePromoCount: number;
  vipEnabled: boolean;
  upcomingEventCount: number;

  // Status for tier assignment
  isClaimed: boolean;
  claimedAt: Date | null;
  createdAt: Date;
}

export type PerformanceTier = "ACTIVE" | "GROWING" | "STAGNANT" | "DEAD" | "NEW";

export interface QualityResult {
  score: number;
  tier: PerformanceTier;
  breakdown: ScoreBreakdown;
}

// ---- Helpers ----

const DAYS_14 = 14 * 24 * 60 * 60 * 1000;
const DAYS_30 = 30 * 24 * 60 * 60 * 1000;
const DAYS_90 = 90 * 24 * 60 * 60 * 1000;

function daysSince(date: Date): number {
  return (Date.now() - date.getTime()) / (24 * 60 * 60 * 1000);
}

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value as object).length > 0;
  return true;
}

// ---- Scoring Functions ----

function scoreProfileCompleteness(input: QualityInput): number {
  let score = 0;

  if (hasValue(input.description)) score += 4;
  if (hasValue(input.coverImage)) score += 3;
  if (hasValue(input.logoUrl)) score += 2;
  if (hasValue(input.operatingHours) && Object.keys(input.operatingHours ?? {}).length > 0) score += 3;
  if (input.amenities.length >= 3) score += 3;
  else if (input.amenities.length >= 1) score += 1;
  if (hasValue(input.website)) score += 2;
  if (hasValue(input.instagram)) score += 2;
  if (hasValue(input.phone)) score += 2;
  if (hasValue(input.email)) score += 2;
  if (hasValue(input.priceRange)) score += 2;

  return Math.min(score, 25);
}

function scoreVisualQuality(input: QualityInput): number {
  let score = 0;

  if (hasValue(input.coverImage)) score += 5;
  if (hasValue(input.logoUrl)) score += 3;
  if (input.imageUrls.length >= 5) score += 7;
  else if (input.imageUrls.length >= 2) score += 4;
  else if (input.imageUrls.length >= 1) score += 2;

  return Math.min(score, 15);
}

function scoreContentFreshness(input: QualityInput): number {
  let score = 0;
  const now = Date.now();

  // Active promo recency
  if (input.latestPromoStartDate) {
    const promoAge = now - input.latestPromoStartDate.getTime();
    if (promoAge <= DAYS_14) score += 8;
    else if (promoAge <= DAYS_30) score += 5;
    else if (promoAge <= DAYS_90) score += 2;
  }

  // Event recency
  if (input.latestEventDate) {
    const eventAge = now - input.latestEventDate.getTime();
    if (eventAge <= DAYS_30) score += 6;
    else if (eventAge <= DAYS_90) score += 3;
  }

  // Profile update recency
  const updateAge = now - input.updatedAt.getTime();
  if (updateAge <= DAYS_30) score += 6;
  else if (updateAge <= DAYS_90) score += 3;

  return Math.min(score, 20);
}

function scoreConsumerEngagement(input: QualityInput): number {
  let score = 0;

  // Profile views
  if (input.profileViews >= 500) score += 10;
  else if (input.profileViews >= 100) score += 6;
  else if (input.profileViews >= 10) score += 2;

  // Action clicks (direction + website + call)
  const totalClicks = input.directionClicks + input.websiteClicks + input.callClicks;
  if (totalClicks >= 200) score += 10;
  else if (totalClicks >= 50) score += 6;
  else if (totalClicks >= 5) score += 2;

  // Social sharing
  if (input.shareCount >= 5) score += 5;
  else if (input.shareCount >= 1) score += 3;

  return Math.min(score, 25);
}

function scoreActivityLevel(input: QualityInput): number {
  let score = 0;

  // Active promos
  if (input.activePromoCount >= 2) score += 6;
  else if (input.activePromoCount >= 1) score += 3;

  // VIP passes
  if (input.vipEnabled) score += 4;

  // Upcoming events
  if (input.upcomingEventCount >= 2) score += 5;
  else if (input.upcomingEventCount >= 1) score += 3;

  return Math.min(score, 15);
}

// ---- Tier Assignment ----

function assignTier(score: number, input: QualityInput): PerformanceTier {
  const now = Date.now();

  // NEW: added within 14 days and not yet claimed
  const ageDays = daysSince(input.createdAt);
  if (ageDays <= 14 && !input.isClaimed) return "NEW";

  // DEAD: score < 30, unclaimed, no activity for 30+ days
  const hasRecentActivity =
    (input.latestPromoStartDate && now - input.latestPromoStartDate.getTime() <= DAYS_30) ||
    (input.latestEventDate && now - input.latestEventDate.getTime() <= DAYS_30) ||
    (input.updatedAt && now - input.updatedAt.getTime() <= DAYS_30);

  if (score < 30 && !input.isClaimed && !hasRecentActivity) return "DEAD";

  // STAGNANT: score 30-69, no new content for 14+ days
  const hasRecentContent =
    (input.latestPromoStartDate && now - input.latestPromoStartDate.getTime() <= DAYS_14) ||
    (input.latestEventDate && now - input.latestEventDate.getTime() <= DAYS_14) ||
    (input.updatedAt && now - input.updatedAt.getTime() <= DAYS_14);

  if (score <= 69 && !hasRecentContent) return "STAGNANT";

  // ACTIVE: score 70+, has promo/event in 14 days
  if (score >= 70 && hasRecentContent) return "ACTIVE";

  // GROWING: score 50-69, claimed recently
  if (score >= 50 && input.isClaimed) return "GROWING";

  // Default catch-all
  if (score >= 70) return "ACTIVE";
  if (score >= 50) return "GROWING";
  if (score >= 30) return "STAGNANT";
  return "DEAD";
}

// ---- Main Scoring Function ----

export function calculateQualityScore(input: QualityInput): QualityResult {
  const breakdown: ScoreBreakdown = {
    profileCompleteness: scoreProfileCompleteness(input),
    visualQuality: scoreVisualQuality(input),
    contentFreshness: scoreContentFreshness(input),
    consumerEngagement: scoreConsumerEngagement(input),
    activityLevel: scoreActivityLevel(input),
    total: 0,
  };

  breakdown.total =
    breakdown.profileCompleteness +
    breakdown.visualQuality +
    breakdown.contentFreshness +
    breakdown.consumerEngagement +
    breakdown.activityLevel;

  const tier = assignTier(breakdown.total, input);

  return {
    score: Math.round(breakdown.total),
    tier,
    breakdown,
  };
}

// ---- Improvement Suggestions ----

export function getImprovementSuggestions(breakdown: ScoreBreakdown): string[] {
  const suggestions: string[] = [];

  if (breakdown.profileCompleteness < 20) {
    const missing: string[] = [];
    if (breakdown.profileCompleteness < 15) missing.push("Add business details (hours, contact info, price range)");
    if (breakdown.profileCompleteness < 10) missing.push("Complete all profile fields (description, amenities, social links)");
    suggestions.push(...missing);
  }

  if (breakdown.visualQuality < 10) {
    suggestions.push("Upload more photos (aim for 5+) and add a logo");
  }

  if (breakdown.contentFreshness < 12) {
    suggestions.push("Post new promotions or events to keep content fresh");
  }

  if (breakdown.consumerEngagement < 15) {
    suggestions.push("Encourage customer engagement through promotions and VIP passes");
  }

  if (breakdown.activityLevel < 9) {
    suggestions.push("Activate VIP passes and add at least 2 active promotions");
  }

  if (suggestions.length === 0) {
    suggestions.push("Your bar profile is in great shape! Keep it up.");
  }

  return suggestions;
}
