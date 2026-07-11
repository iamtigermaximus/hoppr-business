// Visual parameters the AI outputs alongside promotion text.
// The AI picks the template and colors — the templates handle layout.
import type { TitleFontStyle } from "./fonts";

export interface VisualParams {
  template: "split" | "centered" | "card" | "banner";
  photoPreference: "use_bar_cover" | "use_bar_logo" | "no_photo" | "gradient_only";
  mood: "warm" | "cool" | "vibrant" | "dark" | "minimal";
  overlayOpacity: number; // 0–1
}

// What each template receives
export interface TemplateProps {
  barName: string;
  barType: string;
  promotionTitle: string;
  promotionDescription: string;
  promotionType: string;
  callToAction: string;
  accentColor: string;
  discount: number | null;
  conditions: string;
  photoUrl: string | null;
  venueLocation: string;
  format: "wide" | "square" | "banner";
  visual: VisualParams;
  /** Title font style — AI picks based on bar positioning and creative angle */
  titleFontStyle?: TitleFontStyle | null;
}

// Mood → background colors for gradient fallback
export const MOOD_COLORS: Record<VisualParams["mood"], [string, string]> = {
  warm: ["#7c3aed", "#1a0533"],
  cool: ["#2563eb", "#0a0a2e"],
  vibrant: ["#f59e0b", "#7c2d12"],
  dark: ["#1a1a2e", "#0a0a0a"],
  minimal: ["#374151", "#111827"],
};

// Template IDs the AI can select
export const TEMPLATES = {
  SPLIT: "split",
  CENTERED: "centered",
  CARD: "card",
  BANNER: "banner",
} as const;

// Which template to use based on content type and photo availability
export function selectTemplate(
  type: string,
  hasPhoto: boolean,
): VisualParams["template"] {
  if (type === "LIVE_MUSIC_EVENT" || type === "THEME_NIGHT") return "centered";
  if (hasPhoto) return "split";
  return "card";
}

// Which mood to use based on bar type and promotion type
export function selectMood(
  barType: string,
  promoType: string,
): VisualParams["mood"] {
  if (promoType === "FOOD_SPECIAL") return "warm";
  if (promoType === "LADIES_NIGHT" || promoType === "VIP_OFFER") return "vibrant";
  if (barType === "COCKTAIL_BAR" || barType === "LOUNGE") return "minimal";
  if (promoType === "LIVE_MUSIC_EVENT") return "cool";
  if (promoType === "THEME_NIGHT") return "vibrant";
  return "dark";
}

// Build the default visual params from bar + promotion context
export function buildDefaultVisual(
  promoType: string,
  barType: string,
  hasPhoto: boolean,
): VisualParams {
  return {
    template: selectTemplate(promoType, hasPhoto),
    photoPreference: hasPhoto ? "use_bar_cover" : "gradient_only",
    mood: selectMood(barType, promoType),
    overlayOpacity: 0.4,
  };
}
