// src/lib/prompts/tone-to-image-chips.ts
// Maps user's tone + template choices to image style/subject/composition chips
// for Flux prompt construction. Used by the images/generate route and the
// UnifiedCreationFlow for deriving visual presets from voice choices.

import type { ContentTone } from "@/components/bar/create/ToneSelector";
import {
  subjectsForImageWorld,
  IMAGE_WORLD_CHIP_TO_COMPLIANCE,
} from "@/lib/compliance/image-compliance";

interface ImageChips {
  styleId: string;
  subjectId: string;
  compositionId: string;
}

// Tone → style mapping (IDs must match STYLE_PRESETS in image-compliance.ts)
const TONE_STYLE_MAP: Record<ContentTone, string> = {
  BOLD_ENERGETIC: "modern_sleek",
  WARM_INVITING: "warm_cozy",
  EDGY_IRREVERENT: "modern_sleek",
  ELEGANT_PREMIUM: "classic_elegant",
  PLAYFUL_FUN: "outdoor_terrace",
};

// Template → composition hint (IDs must match COMPOSITION_PRESETS in image-compliance.ts)
const TEMPLATE_COMPOSITION_HINTS: Record<string, string[]> = {
  afterWork: ["wide", "medium"],
  ladiesNight: ["wide", "medium"],
  liveMusic: ["medium", "wide"],
  gameNight: ["medium", "wide"],
  foodSpecial: ["wide", "medium"],
  vipExperience: ["medium", "wide"],
  signatureEvening: ["medium", "wide"],
  themeNight: ["wide", "medium"],
};

/**
 * Derive image chips from the user's voice + template choices.
 * Each variant index gets slightly different composition for visual variety.
 * When `imageWorld` is provided (brand mode), subjects are derived from
 * the image world rather than always defaulting to "interior".
 */
export function deriveImageChips(
  tone: ContentTone | null | undefined,
  templateLabel: string | null | undefined,
  variantIndex: number = 0,
  imageWorld?: string | null,
): ImageChips {
  const styleId = tone ? (TONE_STYLE_MAP[tone] || "warm_cozy") : "warm_cozy";

  // Template-specific composition rotation
  let compositionId = "wide";
  if (templateLabel) {
    // Convert display label to key
    const key = templateLabel
      .toLowerCase()
      .replace(/[^a-z]/g, "");
    const hints = TEMPLATE_COMPOSITION_HINTS[key];
    if (hints) {
      compositionId = hints[variantIndex % hints.length];
    }
  } else {
    // No template — cycle through all compositions per variant
    const all = ["wide", "medium", "closeup"];
    compositionId = all[variantIndex % all.length];
  }

  // Subject: use image world mapping when available (brand mode),
  // otherwise default to "interior" (promotional mode)
  let subjectId = "interior";
  if (imageWorld) {
    const complianceWorld = IMAGE_WORLD_CHIP_TO_COMPLIANCE[imageWorld];
    if (complianceWorld) {
      const subjects = subjectsForImageWorld(complianceWorld);
      if (subjects.length > 0) {
        // Rotate subjects across variants for variety
        subjectId = subjects[variantIndex % subjects.length];
      }
    }
  }

  return { styleId, subjectId, compositionId };
}
