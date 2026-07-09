// src/lib/prompts/build-image-prompt.ts
// Converts structured user selections (style + subject + composition)
// into a complete AI image prompt — no free-text typing required.
//
// The user picks from dropdowns/chips. This function assembles the prompt
// and runs it through the compliance filter before returning.

import {
  checkPromptCompliance,
  type StylePreset,
  type SubjectPreset,
  type CompositionPreset,
  STYLE_PRESETS,
  SUBJECT_PRESETS,
  COMPOSITION_PRESETS,
} from "@/lib/compliance/image-compliance";
import type { ContentType } from "@/components/bar/create/types";

// ---- Public API ----

export interface VisualDirection {
  description: string;
  keyElements: string[];
  styleNotes: string;
}

export interface PromptSelections {
  styleId: string;
  subjectId: string;
  compositionId: string;
  /** Additional context from the form (bar name, promo title, description) */
  context: string;
  /** AI-generated visual scene description — when provided, becomes the
   *  primary prompt content. Style/subject/composition act as framing. */
  visualDirection?: VisualDirection;
}

export interface BuiltPrompt {
  /** The final prompt, compliance-wrapped and ready for the image API */
  finalPrompt: string;
  /** Human-readable summary shown in the UI before generation */
  preview: string;
  /** The raw selections (for display) */
  selections: {
    style: StylePreset;
    subject: SubjectPreset;
    composition: CompositionPreset;
  };
  /** Compliance check result */
  compliance: {
    passed: boolean;
    blockedReasons: string[];
    warnings: string[];
  };
}

/** Build a compliance-safe prompt from user selections. */
export function buildImagePrompt(
  selections: PromptSelections,
  contentType: ContentType,
): BuiltPrompt {
  const style = STYLE_PRESETS.find((s) => s.id === selections.styleId);
  const subject = SUBJECT_PRESETS.find((s) => s.id === selections.subjectId);
  const composition = COMPOSITION_PRESETS.find((c) => c.id === selections.compositionId);

  if (!style || !subject || !composition) {
    throw new Error("Invalid selection: style, subject, or composition not found.");
  }

  // Build the prompt. When visualDirection is provided (from AI-generated text),
  // it becomes the primary scene description. Style/subject/composition add
  // framing — they set the overall visual mood without overriding the AI's scene.
  let rawPrompt: string;
  if (selections.visualDirection) {
    const vd = selections.visualDirection;
    const elements = vd.keyElements?.length ? `Featuring: ${vd.keyElements.join(", ")}.` : "";
    const notes = vd.styleNotes ? `Photographic style: ${vd.styleNotes}.` : "";
    rawPrompt = [
      vd.description,
      elements,
      notes,
      style.visualPrompt,
      selections.context || "",
    ]
      .filter(Boolean)
      .join(". ");
  } else {
    rawPrompt = [
      style.visualPrompt,
      subject.visualPrompt,
      composition.visualPrompt,
      selections.context || "",
    ]
      .filter(Boolean)
      .join(". ");
  }

  // Run compliance check
  const contentTypeLabel = contentTypeLabelMap[contentType] || "hospitality venue";
  const compliance = checkPromptCompliance(rawPrompt, contentTypeLabel);

  // Build preview for the UI
  const preview = [style.label, subject.label, composition.label].join(" · ");

  return {
    finalPrompt: compliance.sanitizedPrompt,
    preview,
    selections: { style, subject, composition },
    compliance: {
      passed: compliance.passed,
      blockedReasons: compliance.blockedPatterns,
      warnings: compliance.warnings,
    },
  };
}

/** Build a context string from the current form state for richer prompts. */
export function buildContextFromForm(form: {
  title?: string;
  description?: string;
  promotionType?: string;
  barName?: string;
}): string {
  const parts: string[] = [];

  if (form.barName) {
    parts.push(`${form.barName}`);
  }
  if (form.promotionType) {
    const typeLabel = formatPromotionType(form.promotionType);
    if (typeLabel) parts.push(typeLabel);
  }
  if (form.title) {
    parts.push(form.title);
  }
  if (form.description) {
    // Truncate long descriptions — the AI only needs thematic context
    const short = form.description.slice(0, 100);
    parts.push(short);
  }

  return parts.join(" — ");
}

// ---- Helpers ----

const contentTypeLabelMap: Record<ContentType, string> = {
  promotion: "bar or nightlife promotion",
  event: "bar event or live music night",
  pass: "VIP bar experience or premium nightlife pass",
  campaign: "bar advertising campaign",
};

function formatPromotionType(type: string): string {
  const map: Record<string, string> = {
    HAPPY_HOUR: "happy hour promotion",
    DRINK_SPECIAL: "drink special",
    FOOD_SPECIAL: "food special",
    LADIES_NIGHT: "ladies night event",
    THEME_NIGHT: "theme night event",
    VIP_OFFER: "VIP exclusive offer",
    COVER_DISCOUNT: "cover discount offer",
    LIVE_MUSIC_EVENT: "live music event",
    GAME_NIGHT: "game night event",
    SEASONAL: "seasonal special",
  };
  return map[type] || "";
}

export { STYLE_PRESETS, SUBJECT_PRESETS, COMPOSITION_PRESETS };
