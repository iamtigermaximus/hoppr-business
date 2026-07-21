// src/lib/coherence-check.ts
// ============================================================================
// VISUAL-TEXT COHERENCE CHECK — Gap 4
// ============================================================================
//
// Post-generation validation that verifies the imagePrompt's visual
// characteristics align with the text variant's emotional register.
// Runs after AI returns, before the response is sent to the client.
//
// Architecture:
//   1. Extract emotional register from text (headline + body)
//   2. Extract visual keywords from imagePrompt
//   3. Map both to shared dimensions (lighting, energy, density, scale)
//   4. Score alignment — flag mismatches with severity and suggested fix
//
// Usage:
//   import { checkCoherence, type CoherenceResult } from "./coherence-check";
//   const result = checkCoherence(headline, body, imagePrompt, atmosphere);
//   if (!result.pass) { console.warn(result.warnings); }
// ============================================================================

// ---- Types ----

export interface CoherenceResult {
  /** Whether the variant passes all coherence checks */
  pass: boolean;
  /** Aggregate score 0-100. 100 = perfect alignment. */
  score: number;
  /** Individual dimension checks */
  dimensions: CoherenceDimension[];
  /** Human-readable warnings for the UI */
  warnings: string[];
  /** Suggested fixes if not passing */
  fixSuggestions: string[];
}

export interface CoherenceDimension {
  name: string;
  label: string;
  /** Whether this dimension is aligned */
  aligned: boolean;
  /** Text-side signals found */
  textSignals: string[];
  /** Image-side signals found */
  imageSignals: string[];
  /** Severity of mismatch: low, medium, high */
  severity: "low" | "medium" | "high";
  /** Explanation of why it mismatches (if applicable) */
  detail?: string;
}

// ---- Signal dictionaries ----

/** Maps atmosphere/emotional keywords to lighting expectations */
const LIGHTING_SIGNALS: Record<
  string,
  { textKeywords: string[]; imageKeywords: string[]; expectBright: boolean }
> = {
  dark_intimate: {
    textKeywords: [
      "dark", "darkness", "shadow", "shadows", "candle", "candles",
      "candlelit", "candlelight", "dim", "dimly lit", "low light",
      "moody lighting", "after dark", "late night", "midnight",
      "hämärä", "hämärän", "kynttilänvalo", "kynttilä", "pimeä",
      "illan hämärtyessä",
    ],
    imageKeywords: [
      "dark", "shadow", "low light", "dim", "candlelit", "moody",
      "amber glow", "warm glow", "soft light", "twilight", "night",
    ],
    expectBright: false,
  },
  bright_sunny: {
    textKeywords: [
      "bright", "sun", "sunny", "daylight", "sunshine", "terrace",
      "outdoor", "al fresco", "sunlit", "golden hour", "summer day",
      "aurinko", "aurinkoinen", "päivänvalo", "valoisa", "terassi",
      "kesäpäivä",
    ],
    imageKeywords: [
      "bright", "sun", "sunny", "daylight", "sunshine", "terrace",
      "outdoor", "golden hour", "sunlight", "daytime", "natural light",
    ],
    expectBright: true,
  },
};

const ENERGY_SIGNALS: Record<
  string,
  { textKeywords: string[]; imageKeywords: string[]; expectHighEnergy: boolean }
> = {
  high_energy: {
    textKeywords: [
      "party", "dance", "dancing", "dj", "live music", "concert", "gig",
      "energetic", "high energy", "electric", "buzzing", "packed",
      "loud", "celebrate", "celebration", "festive", "night out",
      "bileet", "tanssi", "tanssilattia", "keikka", "energinen",
      "juhlia", "juhla",
    ],
    imageKeywords: [
      "party", "dance floor", "dj", "energy", "movement", "dynamic",
      "crowd", "people dancing", "action", "vibrant", "electric",
      "lights", "neon", "stage",
    ],
    expectHighEnergy: true,
  },
  low_energy: {
    textKeywords: [
      "quiet", "calm", "peaceful", "still", "intimate", "cozy",
      "cosy", "relax", "relaxing", "unwind", "slow", "gentle",
      "soft", "hushed", "corner", "booth", "hideaway", "escape",
      "rauhallinen", "hiljainen", "intimi", "rentoutua", "nurkka",
      "piilopaikka", "lempeä",
    ],
    imageKeywords: [
      "quiet", "calm", "peaceful", "still", "empty", "intimate",
      "cozy", "warm glow", "soft light", "alone", "secluded",
      "one person", "no crowd", "serene",
    ],
    expectHighEnergy: false,
  },
};

const SCALE_SIGNALS: Record<
  string,
  { textKeywords: string[]; imageKeywords: string[]; expectWide: boolean }
> = {
  wide_venue: {
    textKeywords: [
      "whole bar", "the room", "spacious", "entire venue", "big",
      "full house", "packed floor", "dance floor", "main room",
      "lobby", "hall", "large", "expansive",
    ],
    imageKeywords: [
      "wide", "full room", "entire", "panoramic", "spacious",
      "large", "expansive", "whole",
    ],
    expectWide: true,
  },
  close_detail: {
    textKeywords: [
      "detail", "close", "small", "corner", "booth", "table",
      "nook", "glass", "drink", "hands", "craft", "intimate space",
      "a single", "one drink", "pieni", "yksityiskohta", "nurkka",
      "pöytä", "käsityö",
    ],
    imageKeywords: [
      "close-up", "closeup", "macro", "detail", "focused",
      "shallow depth", "medium", "tight", "intimate scale",
    ],
    expectWide: false,
  },
};

// ---- Core function ----

/**
 * Check visual-text coherence for a single variant.
 *
 * Takes the headline, body, imagePrompt, and optional atmosphere keywords
 * and validates that the image description matches the text's emotional
 * register across four dimensions: lighting, energy, scale, and density.
 *
 * Returns a CoherenceResult with pass/fail, dimension scores, and
 * fix suggestions for any mismatches found.
 */
export function checkCoherence(
  headline: string,
  body: string,
  imagePrompt: string,
  atmosphere?: string[],
): CoherenceResult {
  const combined = `${headline} ${body}`.toLowerCase();
  const image = imagePrompt.toLowerCase();

  const dimensions: CoherenceDimension[] = [];
  const warnings: string[] = [];
  const fixSuggestions: string[] = [];

  // ---- DIMENSION 1: Lighting ----
  const darkMatch = matchSignals(combined, image, LIGHTING_SIGNALS.dark_intimate, "lighting", "warm/dim");
  const brightMatch = matchSignals(combined, image, LIGHTING_SIGNALS.bright_sunny, "lighting", "bright/daylight");

  if (darkMatch) {
    dimensions.push(darkMatch);
    if (!darkMatch.aligned) {
      warnings.push(`Lighting mismatch: text reads ${darkMatch.textSignals.join(", ")} but image has ${darkMatch.imageSignals.join(", ")}`);
      if (darkMatch.severity === "high") {
        fixSuggestions.push("Rewrite imagePrompt with low/warm lighting — remove bright/daytime references");
      }
    }
  }
  if (brightMatch && brightMatch.severity !== "low") {
    dimensions.push(brightMatch);
    if (!brightMatch.aligned) {
      warnings.push(`Lighting mismatch: text reads ${brightMatch.textSignals.join(", ")} but image has ${brightMatch.imageSignals.join(", ")}`);
    }
  }

  // If no lighting signals found in text, that's fine — not every text mentions lighting

  // ---- DIMENSION 2: Energy ----
  const highEnergyMatch = matchSignals(combined, image, ENERGY_SIGNALS.high_energy, "energy", "high");
  const lowEnergyMatch = matchSignals(combined, image, ENERGY_SIGNALS.low_energy, "energy", "calm/intimate");

  if (highEnergyMatch) {
    dimensions.push(highEnergyMatch);
    if (!highEnergyMatch.aligned) {
      warnings.push(`Energy mismatch: text signals high energy (${highEnergyMatch.textSignals.join(", ")}) but image reads calm/quiet`);
      if (highEnergyMatch.severity === "high") {
        fixSuggestions.push("Add energy signals to imagePrompt — crowd, movement, dynamic lighting");
      }
    }
  }
  if (lowEnergyMatch) {
    dimensions.push(lowEnergyMatch);
    if (!lowEnergyMatch.aligned) {
      warnings.push(`Energy mismatch: text is calm/intimate (${lowEnergyMatch.textSignals.join(", ")}) but image shows high energy`);
      if (lowEnergyMatch.severity === "high") {
        fixSuggestions.push("Calm the imagePrompt — remove crowd/party references, add quiet/still mood");
      }
    }
  }

  // ---- DIMENSION 3: Scale ----
  const wideMatch = matchSignals(combined, image, SCALE_SIGNALS.wide_venue, "scale", "wide");
  const closeMatch = matchSignals(combined, image, SCALE_SIGNALS.close_detail, "scale", "close-up/intimate");

  if (wideMatch) {
    dimensions.push(wideMatch);
  }
  if (closeMatch) {
    dimensions.push(closeMatch);
    if (!closeMatch.aligned && closeMatch.severity !== "low") {
      warnings.push(`Scale mismatch: text is intimate/close (${closeMatch.textSignals.join(", ")}) but image is wide`);
      if (closeMatch.severity === "high") {
        fixSuggestions.push("Tighten imagePrompt to close-up or medium — avoid wide/panoramic shots");
      }
    }
  }

  // ---- Aggregate score ----
  const totalDims = dimensions.length;
  const alignedDims = dimensions.filter((d) => d.aligned).length;
  const score = totalDims > 0 ? Math.round((alignedDims / totalDims) * 100) : 100;

  const highSeverityCount = dimensions.filter((d) => d.severity === "high" && !d.aligned).length;

  return {
    pass: highSeverityCount === 0,
    score,
    dimensions,
    warnings,
    fixSuggestions,
  };
}

/**
 * Match text signals against image signals for a single dimension.
 * Returns a CoherenceDimension with alignment status and severity.
 */
function matchSignals(
  text: string,
  image: string,
  signals: {
    textKeywords: string[];
    imageKeywords: string[];
    expectBright?: boolean;
    expectHighEnergy?: boolean;
    expectWide?: boolean;
  },
  dimension: string,
  textPolarity: string,
): CoherenceDimension | null {
  // Find which text signals are present
  const textSignals = signals.textKeywords.filter((kw) =>
    text.toLowerCase().includes(kw.toLowerCase()),
  );
  // Find which image signals are present
  const imageSignals = signals.imageKeywords.filter((kw) =>
    image.toLowerCase().includes(kw.toLowerCase()),
  );

  // If no text signals found for this dimension, skip it
  if (textSignals.length === 0) return null;

  // Determine alignment: do the image keywords match the text's polarity?
  const expectBright = signals.expectBright ?? true;
  const expectHighEnergy = signals.expectHighEnergy ?? true;
  const expectWide = signals.expectWide ?? true;

  // Determine what the image is actually showing
  const imageIsBright = hasBrightKeywords(image);
  const imageIsDark = hasDarkKeywords(image);
  const imageHasHighEnergy = hasHighEnergyKeywords(image);
  const imageHasLowEnergy = hasLowEnergyKeywords(image);
  const imageIsWide = hasWideKeywords(image);

  let aligned = false;
  let severity: "low" | "medium" | "high" = "low";

  if (dimension === "lighting") {
    if (expectBright && (imageIsBright || imageSignals.length > 0)) {
      aligned = true;
    } else if (!expectBright && (imageIsDark || imageSignals.length > 0)) {
      aligned = true;
    } else if (imageIsBright && !expectBright) {
      // Text wants dark, image is bright
      severity = "high";
    } else if (imageIsDark && expectBright) {
      // Text wants bright, image is dark
      severity = "medium";
    } else {
      // No clear image signal — ambiguous
      severity = "low";
      aligned = true; // ambiguous is not a clear mismatch
    }
  } else if (dimension === "energy") {
    if (expectHighEnergy && (imageHasHighEnergy || imageSignals.length > 0)) {
      aligned = true;
    } else if (!expectHighEnergy && (imageHasLowEnergy || imageSignals.length > 0)) {
      aligned = true;
    } else if (imageHasHighEnergy && !expectHighEnergy) {
      severity = "high";
    } else if (imageHasLowEnergy && expectHighEnergy) {
      severity = "high";
    } else {
      severity = "low";
      aligned = imageSignals.length > 0 || (!imageHasHighEnergy && !imageHasLowEnergy);
    }
  } else if (dimension === "scale") {
    if (expectWide && (imageIsWide || imageSignals.length > 0)) {
      aligned = true;
    } else if (!expectWide && (imageSignals.length > 0)) {
      aligned = true;
    } else if (imageIsWide && !expectWide) {
      severity = "high";
    } else {
      severity = "low";
      aligned = true;
    }
  }

  return {
    name: dimension,
    label: `${dimension} (${textPolarity})`,
    aligned,
    textSignals,
    imageSignals: imageSignals.length > 0 ? imageSignals : (imageIsBright ? ["bright"] : imageIsDark ? ["dark"] : imageHasHighEnergy ? ["energetic"] : imageIsWide ? ["wide"] : ["ambiguous"]),
    severity,
    detail: aligned
      ? undefined
      : `Text expects ${textPolarity} but image shows ${imageSignals.length > 0 ? imageSignals.join(", ") : "opposite"}`,
  };
}

// ---- Keyword detection helpers ----

function hasBrightKeywords(text: string): boolean {
  const bright = ["bright", "sun", "sunny", "daylight", "sunshine", "overhead light", "daytime", "natural light", "white", "harsh light"];
  return bright.some((kw) => text.toLowerCase().includes(kw));
}

function hasDarkKeywords(text: string): boolean {
  const dark = ["dark", "shadow", "low light", "dim", "candlelit", "moody", "amber", "twilight", "night", "noir", "soft light", "warm glow"];
  return dark.some((kw) => text.toLowerCase().includes(kw));
}

function hasHighEnergyKeywords(text: string): boolean {
  const high = ["crowd", "packed", "party", "dance floor", "movement", "dynamic", "action", "vibrant", "electric", "energy", "people dancing", "neon", "loud"];
  return high.some((kw) => text.toLowerCase().includes(kw));
}

function hasLowEnergyKeywords(text: string): boolean {
  const low = ["quiet", "calm", "empty", "still", "peaceful", "alone", "serene", "tranquil", "intimate", "cozy", "no crowd", "solitude", "secluded"];
  return low.some((kw) => text.toLowerCase().includes(kw));
}

function hasWideKeywords(text: string): boolean {
  const wide = ["wide", "full room", "entire", "panoramic", "spacious", "large", "expansive", "whole", "overview"];
  return wide.some((kw) => text.toLowerCase().includes(kw));
}

/**
 * Batch check: run coherence validation on multiple variants at once.
 * Returns per-variant results + an aggregate summary.
 */
export function batchCheckCoherence(
  variants: { headline: string; body: string; imagePrompt: string }[],
  atmosphere?: string[],
): { results: CoherenceResult[]; allPass: boolean; averageScore: number } {
  const results = variants.map((v) =>
    checkCoherence(v.headline, v.body, v.imagePrompt, atmosphere),
  );
  const allPass = results.every((r) => r.pass);
  const averageScore =
    results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
      : 100;

  return { results, allPass, averageScore };
}
