// src/lib/prompts/infer-image-chips.ts
// Maps a user's brief text + bar profile to the best image generation chips.
// This eliminates the separate chip-selection step — the system infers
// what style/subject/composition makes sense from the brief alone.
//
// The user can still manually override via AIImageGenerator's chip UI
// in the review step, but the happy path skips it entirely.
//
// Extended for the advertising hub (2026-07-18): image world inference,
// new subject/word mappings for non-venue imagery.

import {
  STYLE_PRESETS,
  SUBJECT_PRESETS,
  COMPOSITION_PRESETS,
  imageWorldContainsAlcohol,
} from "@/lib/compliance/image-compliance";
import type {
  StylePreset,
  SubjectPreset,
  CompositionPreset,
  ImageWorld,
} from "@/lib/compliance/image-compliance";

// ---- Types ----

export interface InferredChips {
  styleId: string;
  subjectId: string;
  compositionId: string;
  /** Which image world the brief suggests — "baari" unless keywords
   *  indicate mood/nature/abstract imagery. */
  imageWorld: ImageWorld;
  confidence: {
    style: number;
    subject: number;
    composition: number;
    imageWorld: number;
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
  // Original venue styles
  { keywords: ["cozy", "cosy", "warm", "candlelit", "candle", "intimate", "amber", "soft lighting", "hygge"], chipId: "warm_cozy", weight: 0.9 },
  { keywords: ["modern", "sleek", "contemporary", "polished", "clean lines", "neon", "urban", "city"], chipId: "modern_sleek", weight: 0.9 },
  { keywords: ["classic", "traditional", "elegant", "timeless", "refined", "sophisticated", "wood", "brass", "leather", "old school"], chipId: "classic_elegant", weight: 0.9 },
  { keywords: ["minimal", "clean", "bright", "white", "simple", "airy", "scandinavian", "nordic", "fresh"], chipId: "minimal_clean", weight: 0.9 },
  { keywords: ["outdoor", "terrace", "garden", "patio", "sun", "sunny", "outside", "open air", "al fresco", "rooftop", "summer"], chipId: "outdoor_terrace", weight: 0.9 },
  // New extended styles
  { keywords: ["cinematic", "film", "movie", "dramatic lighting", "golden hour", "35mm", "film grain"], chipId: "cinematic_warm", weight: 0.85 },
  { keywords: ["editorial", "magazine", "crisp", "high contrast", "commercial", "lifestyle", "photoshoot"], chipId: "editorial_clean", weight: 0.85 },
  { keywords: ["typographic", "poster", "graphic", "text overlay", "bold design", "advertisement", "print ad"], chipId: "typographic_bold", weight: 0.85 },
  { keywords: ["dreamy", "soft", "ethereal", "haze", "pastel", "romantic", "whimsical", "fairytale", "dreamlike"], chipId: "soft_dreamy", weight: 0.85 },
  { keywords: ["noir", "moody", "dark", "shadow", "dramatic", "mysterious", "chiaroscuro", "film noir", "contrasty"], chipId: "noir_moody", weight: 0.85 },
  { keywords: ["vintage", "retro", "old school", "poster style", "screen print", "mid-century", "nostalgic", "throwback"], chipId: "vintage_poster", weight: 0.85 },
  { keywords: ["nordic", "minimalist", "scandi", "space", "pale", "muted", "understated", "less is more", "zen"], chipId: "nordic_minimal", weight: 0.85 },
];

const SUBJECT_KEYWORDS: KeywordMatch[] = [
  // Original venue subjects
  { keywords: ["cocktail", "drink", "beverage", "glass", "martini", "wine", "beer", "pint", "mug", "bottle", "craft", "signature cocktail", "menu"], chipId: "cocktail", weight: 0.8 },
  { keywords: ["exterior", "outside", "facade", "entrance", "door", "storefront", "street", "neon sign", "sign", "building"], chipId: "exterior", weight: 0.8 },
  { keywords: ["ambiance", "ambience", "mood", "vibe", "vibes", "atmosphere", "lights", "lighting", "blur", "abstract", "texture", "energy", "party"], chipId: "ambiance", weight: 0.8 },
  { keywords: ["interior", "inside", "bar", "counter", "seating", "room", "space", "lounge", "area", "decor", "furniture", "table", "booth", "dance floor", "stage"], chipId: "interior", weight: 0.8 },
  // New non-venue subjects
  { keywords: ["sunset", "sun set", "dusk sky", "golden sky", "evening sky", "horizon glow", "water reflection"], chipId: "sunset_water", weight: 0.85 },
  { keywords: ["beach", "coast", "shore", "sand", "ocean", "sea", "waves", "seaside", "coastline", "by the water"], chipId: "beach_coast", weight: 0.85 },
  { keywords: ["forest", "birch", "woods", "trees", "pine", "nature trail", "woodland", "grove", "among the trees", "forest path"], chipId: "forest_birch", weight: 0.85 },
  { keywords: ["blue hour", "city night", "cityscape", "skyline", "downtown", "urban evening", "city lights", "twilight city", "street lights"], chipId: "city_bluehour", weight: 0.85 },
  { keywords: ["abstract", "texture only", "no subject", "color field", "bokeh", "blurred background", "pure atmosphere", "negative space", "gradient"], chipId: "texture_abstract", weight: 0.8 },
  { keywords: ["craft", "hands", "bartender", "making", "pouring", "mixing", "garnish", "process", "ritual", "technique", "artisan"], chipId: "craft_detail", weight: 0.8 },
  { keywords: ["winter", "ice", "archipelago", "frozen", "snow", "island", "sea ice", "cold water", "stark"], chipId: "winter_archipelago", weight: 0.85 },
  { keywords: ["nature", "landscape", "season", "finnish nature", "wilderness", "lake", "countryside", "outdoors", "natural"], chipId: "seasonal_finnish", weight: 0.7 },
  { keywords: ["window", "windows", "warm glow", "from outside", "looking in", "cozy window", "light through window", "inviting light"], chipId: "warm_window_glow", weight: 0.85 },
  { keywords: ["street", "urban", "cobblestone", "neighborhood", "city walk", "pavement", "alley", "promenade", "strolling"], chipId: "urban_street", weight: 0.8 },
  { keywords: ["northern lights", "aurora", "borealis", "night sky", "stars", "starry", "polar", "arctic sky", "green sky"], chipId: "northern_lights", weight: 0.9 },
  { keywords: ["mökki", "cottage", "cabin", "dock", "sauna", "lakeside", "by the lake", "summer house", "wooden house by water"], chipId: "lakeside_mokki", weight: 0.85 },
];

const COMPOSITION_KEYWORDS: KeywordMatch[] = [
  { keywords: ["closeup", "close-up", "close up", "detail", "macro", "hero shot", "product shot", "focused", "single"], chipId: "closeup", weight: 0.85 },
  { keywords: ["medium", "focused", "section", "corner", "booth", "table", "bar area"], chipId: "medium", weight: 0.7 },
  { keywords: ["wide", "full", "whole", "entire", "panoramic", "overview", "show everything", "big", "spacious", "room", "space", "venue"], chipId: "wide", weight: 0.85 },
];

// ---- Image world → keyword mappings ----

/** Detect image world from brief text. These keywords indicate the user
 *  is thinking about a non-venue image. */
const IMAGE_WORLD_KEYWORDS: KeywordMatch[] = [
  // tunnelma — mood/atmosphere imagery (beach, sunset, nature, city mood)
  {
    keywords: [
      "tunnelma", "tunnelmakuva", "atmosphere image", "mood image",
      "beach", "sunset", "aurinko", "meri", "sea", "ocean", "metsä",
      "forest", "nature", "luonto", "sky", "taivas", "horizon", "northern lights",
      "revontulet", "coast", "rannikko",
    ],
    chipId: "tunnelma",
    weight: 0.8,
  },
  // kasityo — craft detail
  {
    keywords: [
      "käsityö", "craft", "craftsman", "artisan", "handmade", "hands",
      "making", "preparing", "behind the scenes", "process", "technique",
      "ingredients", "raaka-aine", "valmistus",
    ],
    chipId: "kasityo",
    weight: 0.8,
  },
  // kausi_luonto — season and nature
  {
    keywords: [
      "vuodenaika", "season", "kausi", "luonto", "nature photo",
      "landscape", "maisema", "wilderness", "erämaa", "järvi", "lake",
      "mökki", "cottage", "sauna", "finnish nature", "suomen luonto",
      "archipelago", "saaristo",
    ],
    chipId: "kausi_luonto",
    weight: 0.8,
  },
  // graafinen — graphic/typographic
  {
    keywords: [
      "graafinen", "graphic", "typography", "text only", "poster style",
      "poster", "juliste", "bold text", "text forward", "quote",
      "slogan", "iskulause",
    ],
    chipId: "graafinen",
    weight: 0.85,
  },
  // kaupunki — city context
  {
    keywords: [
      "kaupunki", "city", "urban", "neighborhood", "kortteli",
      "street scene", "katukuva", "helsinki", "downtown", "keskusta",
      "city context", "kaupunkikuva",
    ],
    chipId: "kaupunki",
    weight: 0.8,
  },
  // abstrakti — abstract/textural
  {
    keywords: [
      "abstrakti", "abstract", "textural", "pure color", "gradient",
      "no subject", "just light", "just color", "minimal image",
    ],
    chipId: "abstrakti",
    weight: 0.85,
  },
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

/** Bar type → default image world. Most bars default to "baari" (venue).
 *  But descriptive types with strong associations map elsewhere. */
const BAR_TYPE_IMAGE_WORLD_HINTS: Record<string, ImageWorld | undefined> = {
  BEER_GARDEN: "tunnelma",      // outdoor → likely mood imagery
  ROOFTOP_BAR: "kaupunki",       // rooftop → city context
};

/** Smaller bars → tighter composition works better. Larger → wide. */
function inferCompositionFromCapacity(priceRange?: string | null): string | undefined {
  if (!priceRange) return undefined;
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

function bestMatch(
  scores: Map<string, number>,
  defaults: string,
  minConfidence = 0.3,
): { id: string; confidence: number } {
  if (scores.size === 0) return { id: defaults, confidence: minConfidence };
  let best = defaults;
  let bestScore = 0;
  for (const [id, score] of scores) {
    if (score > bestScore) {
      bestScore = score;
      best = id;
    }
  }
  const confidence = Math.min(minConfidence + bestScore * 0.2, 0.95);
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
 * 4. Smart defaults (warm_cozy, interior, wide, baari)
 *
 * Extended for advertising hub: also infers image world (Kuvamaailma).
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

  // ---- Score each category against combined text ----
  const styleScores = scoreMatches(combinedText, STYLE_KEYWORDS);
  const subjectScores = scoreMatches(combinedText, SUBJECT_KEYWORDS);
  const compositionScores = scoreMatches(combinedText, COMPOSITION_KEYWORDS);
  const imageWorldScores = scoreMatches(combinedText, IMAGE_WORLD_KEYWORDS);

  // ---- Apply bar type hints (lower weight than text keywords) ----
  if (barProfile?.type) {
    const typeHint = BAR_TYPE_STYLE_HINTS[barProfile.type.toUpperCase()];
    if (typeHint && !styleScores.has(typeHint)) {
      styleScores.set(typeHint, 0.4);
    }

    const worldHint = BAR_TYPE_IMAGE_WORLD_HINTS[barProfile.type.toUpperCase()];
    if (worldHint && !imageWorldScores.has(worldHint)) {
      imageWorldScores.set(worldHint, 0.3);
    }
  }

  // ---- Apply promotion type hints for subject ----
  if (promotion?.type) {
    const promoHint = PROMO_TYPE_SUBJECT_HINTS[promotion.type];
    if (promoHint && !subjectScores.has(promoHint)) {
      subjectScores.set(promoHint, 0.5);
    }
  }

  // ---- Apply price range → composition hint ----
  if (barProfile?.priceRange) {
    const compHint = inferCompositionFromCapacity(barProfile.priceRange);
    if (compHint && !compositionScores.has(compHint)) {
      compositionScores.set(compHint, 0.35);
    }
  }

  // ---- Resolve best matches with smart defaults ----
  const style = bestMatch(styleScores, "warm_cozy");
  const composition = bestMatch(compositionScores, "wide");
  const imageWorld = bestMatch(imageWorldScores, "baari", 0.2) as { id: ImageWorld; confidence: number };

  // Subject default depends on image world — non-venue worlds should
  // not default to "interior" since that's venue-specific.
  const defaultSubject = imageWorld.id === "baari" ? "interior" :
    imageWorld.id === "tunnelma" ? "sunset_water" :
    imageWorld.id === "kasityo" ? "craft_detail" :
    imageWorld.id === "kausi_luonto" ? "seasonal_finnish" :
    imageWorld.id === "graafinen" ? "texture_abstract" :
    imageWorld.id === "kaupunki" ? "city_bluehour" :
    "texture_abstract"; // abstrakti
  const subject = bestMatch(subjectScores, defaultSubject);

  return {
    styleId: style.id,
    subjectId: subject.id,
    compositionId: composition.id,
    imageWorld: imageWorld.id,
    confidence: {
      style: style.confidence,
      subject: subject.confidence,
      composition: composition.confidence,
      imageWorld: imageWorld.confidence,
    },
  };
}

/**
 * Builds a human-readable label for the inferred chips
 * (e.g., "Tunnelma · Cinematic Warm · Sunset Over Water · Wide Shot")
 */
export function labelInferredChips(chips: InferredChips): string {
  const imageWorldLabel = chips.imageWorld === "baari" ? null :
    chips.imageWorld === "tunnelma" ? "Tunnelma" :
    chips.imageWorld === "kasityo" ? "Käsityö" :
    chips.imageWorld === "kausi_luonto" ? "Luonto" :
    chips.imageWorld === "graafinen" ? "Graafinen" :
    chips.imageWorld === "kaupunki" ? "Kaupunki" :
    "Abstrakti";
  const style = STYLE_PRESETS.find((s) => s.id === chips.styleId);
  const subject = SUBJECT_PRESETS.find((s) => s.id === chips.subjectId);
  const composition = COMPOSITION_PRESETS.find((c) => c.id === chips.compositionId);
  return [imageWorldLabel, style?.label, subject?.label, composition?.label].filter(Boolean).join(" · ");
}
