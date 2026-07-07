// src/lib/prompts/infer-image-chips.ts
// Maps a user's brief text + bar profile to the best image generation chips.
// This eliminates the separate chip-selection step — the system infers
// what style/subject/composition makes sense from the brief alone.
//
// The user can still manually override via AIImageGenerator's chip UI
// in the review step, but the happy path skips it entirely.

import {
  STYLE_PRESETS,
  SUBJECT_PRESETS,
  COMPOSITION_PRESETS,
} from "@/lib/compliance/image-compliance";
import type { StylePreset, SubjectPreset, CompositionPreset } from "@/lib/compliance/image-compliance";

// ---- Types ----

export interface InferredChips {
  styleId: string;
  subjectId: string;
  compositionId: string;
  confidence: {
    style: number;
    subject: number;
    composition: number;
  };
}

export interface BarProfileForInference {
  name: string;
  type?: string | null;
  description?: string | null;
  district?: string | null;
  priceRange?: string | null;
  amenities?: string | null;
}

export interface PromotionContextForInference {
  title: string;
  description: string;
  type: string; // promotion type enum
  discount?: number | null;
}

// ---- Keyword → chip mappings ----

interface KeywordMatch {
  keywords: string[];
  chipId: string;
  weight: number; // 0-1, how strongly this keyword indicates the chip
}

const STYLE_KEYWORDS: KeywordMatch[] = [
  { keywords: ["cozy", "cosy", "warm", "candlelit", "candle", "intimate", "amber", "soft lighting", "hygge"], chipId: "warm_cozy", weight: 0.9 },
  { keywords: ["modern", "sleek", "contemporary", "polished", "clean lines", "neon", "urban", "city"], chipId: "modern_sleek", weight: 0.9 },
  { keywords: ["classic", "traditional", "elegant", "timeless", "refined", "sophisticated", "wood", "brass", "leather", "old school"], chipId: "classic_elegant", weight: 0.9 },
  { keywords: ["minimal", "clean", "bright", "white", "simple", "airy", "scandinavian", "nordic", "fresh"], chipId: "minimal_clean", weight: 0.9 },
  { keywords: ["outdoor", "terrace", "garden", "patio", "sun", "sunny", "outside", "open air", "al fresco", "rooftop", "summer"], chipId: "outdoor_terrace", weight: 0.9 },
];

const SUBJECT_KEYWORDS: KeywordMatch[] = [
  { keywords: ["cocktail", "drink", "beverage", "glass", "martini", "wine", "beer", "pint", "mug", "bottle", "craft", "signature cocktail", "menu"], chipId: "cocktail", weight: 0.8 },
  { keywords: ["exterior", "outside", "facade", "entrance", "door", "storefront", "street", "neon sign", "sign", "building"], chipId: "exterior", weight: 0.8 },
  { keywords: ["ambiance", "ambience", "mood", "vibe", "vibes", "atmosphere", "lights", "lighting", "blur", "abstract", "texture", "energy", "party"], chipId: "ambiance", weight: 0.8 },
  { keywords: ["interior", "inside", "bar", "counter", "seating", "room", "space", "lounge", "area", "decor", "furniture", "table", "booth", "dance floor", "stage"], chipId: "interior", weight: 0.8 },
];

const COMPOSITION_KEYWORDS: KeywordMatch[] = [
  { keywords: ["closeup", "close-up", "close up", "detail", "macro", "hero shot", "product shot", "focused", "single"], chipId: "closeup", weight: 0.85 },
  { keywords: ["medium", "focused", "section", "corner", "booth", "table", "bar area"], chipId: "medium", weight: 0.7 },
  { keywords: ["wide", "full", "whole", "entire", "panoramic", "overview", "show everything", "big", "spacious", "room", "space", "venue"], chipId: "wide", weight: 0.85 },
];

// ---- Bar type → chip hints ----

/** Map bar type to a preferred style when the brief doesn't specify one clearly. */
const BAR_TYPE_STYLE_HINTS: Record<string, string | undefined> = {
  COCKTAIL_BAR: "warm_cozy",
  WINE_BAR: "classic_elegant",
  NIGHTCLUB: "modern_sleek",
  SPORTS_BAR: "modern_sleek",
  PUB: "classic_elegant",
  LOUNGE: "warm_cozy",
  RESTAURANT: "classic_elegant",
  BEER_GARDEN: "outdoor_terrace",
  ROOFTOP_BAR: "outdoor_terrace",
};

/** Smaller bars → tighter composition works better. Larger → wide. */
function inferCompositionFromCapacity(priceRange?: string | null): string | undefined {
  if (!priceRange) return undefined;
  // Price range 1-2 suggests smaller venues → medium or close-up
  // Price range 3-4 suggests larger → wide
  const price = parseInt(priceRange, 10);
  if (price <= 2) return "medium";
  return "wide";
}

/** Promotion type hints for subject */
const PROMO_TYPE_SUBJECT_HINTS: Record<string, string> = {
  DRINK_SPECIAL: "cocktail",
  FOOD_SPECIAL: "interior",
  HAPPY_HOUR: "interior",
  LIVE_MUSIC_EVENT: "interior",
  GAME_NIGHT: "interior",
  THEME_NIGHT: "ambiance",
  VIP_OFFER: "interior",
};

// ---- Core inference ----

function scoreMatches(text: string, matches: KeywordMatch[]): Map<string, number> {
  const lower = text.toLowerCase();
  const scores = new Map<string, number>();

  for (const match of matches) {
    for (const keyword of match.keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        const current = scores.get(match.chipId) || 0;
        scores.set(match.chipId, current + match.weight);
      }
    }
  }

  return scores;
}

function bestMatch(scores: Map<string, number>, defaults: string): { id: string; confidence: number } {
  if (scores.size === 0) return { id: defaults, confidence: 0.3 };
  let best = defaults;
  let bestScore = 0;
  for (const [id, score] of scores) {
    if (score > bestScore) {
      bestScore = score;
      best = id;
    }
  }
  // Normalize confidence: 0.3 (no match) → 0.95 (strong match)
  const confidence = Math.min(0.3 + bestScore * 0.2, 0.95);
  return { id: best, confidence };
}

/**
 * Infers the best image generation chips from the user's brief text,
 * bar profile, and promotion context. Returns chip IDs with confidence scores.
 *
 * Priority order:
 * 1. Brief text keywords (strongest signal)
 * 2. Promotion type (e.g., DRINK_SPECIAL → cocktail subject)
 * 3. Bar profile hints (type, price range)
 * 4. Smart defaults (warm_cozy, interior, wide)
 */
export function inferImageChips(
  brief: string,
  barProfile?: BarProfileForInference | null,
  promotion?: PromotionContextForInference | null,
): InferredChips {
  // Combine all text sources: brief is primary, promotion context adds signal
  let combinedText = brief;
  if (promotion) {
    combinedText += ` ${promotion.title} ${promotion.description} ${promotion.type}`;
  }

  // Score each category against combined text
  const styleScores = scoreMatches(combinedText, STYLE_KEYWORDS);
  const subjectScores = scoreMatches(combinedText, SUBJECT_KEYWORDS);
  const compositionScores = scoreMatches(combinedText, COMPOSITION_KEYWORDS);

  // Apply bar type hints (lower weight than text keywords)
  if (barProfile?.type) {
    const typeHint = BAR_TYPE_STYLE_HINTS[barProfile.type.toUpperCase()];
    if (typeHint && !styleScores.has(typeHint)) {
      styleScores.set(typeHint, 0.4); // weak hint — text overrides
    }
  }

  // Apply promotion type hints for subject
  if (promotion?.type) {
    const promoHint = PROMO_TYPE_SUBJECT_HINTS[promotion.type];
    if (promoHint && !subjectScores.has(promoHint)) {
      subjectScores.set(promoHint, 0.5); // medium hint
    }
  }

  // Apply price range → composition hint
  if (barProfile?.priceRange) {
    const compHint = inferCompositionFromCapacity(barProfile.priceRange);
    if (compHint && !compositionScores.has(compHint)) {
      compositionScores.set(compHint, 0.35);
    }
  }

  // Resolve best matches with smart defaults
  const style = bestMatch(styleScores, "warm_cozy");
  const subject = bestMatch(subjectScores, "interior");
  const composition = bestMatch(compositionScores, "wide");

  return {
    styleId: style.id,
    subjectId: subject.id,
    compositionId: composition.id,
    confidence: {
      style: style.confidence,
      subject: subject.confidence,
      composition: composition.confidence,
    },
  };
}

/**
 * Builds a human-readable label for the inferred chips (e.g., "Warm & Cozy · Bar Interior · Wide Shot")
 */
export function labelInferredChips(chips: InferredChips): string {
  const style = STYLE_PRESETS.find((s) => s.id === chips.styleId);
  const subject = SUBJECT_PRESETS.find((s) => s.id === chips.subjectId);
  const composition = COMPOSITION_PRESETS.find((c) => c.id === chips.compositionId);
  return [style?.label, subject?.label, composition?.label].filter(Boolean).join(" · ");
}
