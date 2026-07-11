// Title font style options — the AI picks one per variant based on the bar's
// positioning and the promotion's creative angle.
//
// Each style maps to a CSS font-family stack. The primary fonts (Inter,
// Playfair Display, Bebas Neue) are loaded via next/font/google in the root
// layout and available as CSS variables. Fallbacks are web-safe system fonts.

export type TitleFontStyle = "BOLD_SANS" | "ELEGANT_SERIF" | "CONDENSED_IMPACT" | "CLASSIC_SERIF";

export interface TitleFontConfig {
  fontFamily: string;
  fontWeight: number;
  letterSpacing?: string;
  textTransform?: "uppercase" | "none";
  description: string;
  /** Which types of bars this style suits best */
  bestFor: string[];
}

export const TITLE_FONT_STYLES: Record<TitleFontStyle, TitleFontConfig> = {
  BOLD_SANS: {
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    fontWeight: 700,
    letterSpacing: "-0.01em",
    description: "Modern, clean, versatile — works for everything",
    bestFor: ["COCKTAIL_BAR", "NIGHTCLUB", "PUB", "SPORTS_BAR", "LOUNGE", "KARAOKE", "LIVE_MUSIC", "TERRACE_BAR", "BEER_HALL"],
  },
  ELEGANT_SERIF: {
    fontFamily: "var(--font-playfair), 'Georgia', 'Times New Roman', serif",
    fontWeight: 700,
    letterSpacing: "-0.005em",
    description: "Elegant, premium, timeless — suits upscale venues",
    bestFor: ["WINE_BAR", "LOUNGE", "COCKTAIL_BAR"],
  },
  CONDENSED_IMPACT: {
    fontFamily: "var(--font-bebas), 'Impact', 'Arial Narrow', sans-serif",
    fontWeight: 400,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
    description: "Bold, condensed, high-impact — great for events and announcements",
    bestFor: ["NIGHTCLUB", "LIVE_MUSIC", "SPORTS_BAR", "KARAOKE"],
  },
  CLASSIC_SERIF: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontWeight: 400,
    description: "Warm, traditional, readable — good for neighborhood spots",
    bestFor: ["PUB", "WINE_BAR", "BEER_HALL"],
  },
};

/** Suggest a title font style based on bar type — the AI can override this */
export function suggestFontStyle(barType: string): TitleFontStyle {
  const type = barType.toUpperCase();
  for (const [style, config] of Object.entries(TITLE_FONT_STYLES)) {
    if (config.bestFor.includes(type)) return style as TitleFontStyle;
  }
  return "BOLD_SANS";
}

/** Resolve a font config from a style key, falling back to BOLD_SANS */
export function getTitleFontConfig(style?: TitleFontStyle | null): TitleFontConfig {
  if (style && TITLE_FONT_STYLES[style]) return TITLE_FONT_STYLES[style];
  return TITLE_FONT_STYLES.BOLD_SANS;
}
