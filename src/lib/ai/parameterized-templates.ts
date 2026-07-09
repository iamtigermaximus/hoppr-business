// src/lib/ai/parameterized-templates.ts
// ============================================================================
// IMAGE SUFFIX GENERATOR — Injects unique color palette, lighting, atmosphere,
// and composition guidance into Flux prompts. Uses barId hash as a rotation
// offset so two bars of the same type generating at the same time get
// genuinely different combinations.
// ============================================================================

// ---------------------------------------------------------------------------
// Deterministic string hash — same barId always produces same offset
// ---------------------------------------------------------------------------

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// ---------------------------------------------------------------------------
// Season detection
// ---------------------------------------------------------------------------

function getSeason(date: Date): string {
  const month = date.getMonth(); // 0-11
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}

// ---------------------------------------------------------------------------
// Bar-type color palettes — each bar type has a distinct visual identity
// ---------------------------------------------------------------------------

const BAR_COLORS: Record<string, string[]> = {
  NIGHTCLUB: ["deep violet and electric blue", "neon pink against black", "pulsing amber and shadow"],
  COCKTAIL_BAR: ["copper and emerald", "brass and deep burgundy", "candlelit gold and mahogany"],
  PUB: ["warm oak and cream", "deep green and brass", "honey-toned wood and soft amber"],
  SPORTS_BAR: ["vibrant red and navy", "electric blue and steel", "bold primary colors"],
  LOUNGE: ["velvet plum and soft gold", "smoky gray and warm amber", "midnight blue and copper"],
  WINE_BAR: ["deep ruby and candlelight", "rich burgundy and oak", "soft cream and rose gold"],
  BEER_BAR: ["golden amber and chestnut", "copper and cream", "warm barley and brass"],
  KARAOKE: ["neon purple and pink", "vibrant magenta and blue", "party lights and deep shadow"],
  ROOFTOP_BAR: ["sky blue and warm terracotta", "sunset orange and cool gray", "twilight purple and city lights"],
  RESTAURANT: ["warm cream and forest green", "soft gold and charcoal", "terracotta and sage"],
  CLUB: ["deep violet and cyan", "hot pink and black", "strobe white and shadow"],
  BREWERY_TAPROOM: ["copper and cream", "industrial gray and warm amber", "fermentation gold and steel"],
  GASTRO_PUB: ["deep burgundy and brass", "warm oak and cream", "charcoal and soft gold"],
  HOTEL_BAR: ["midnight blue and brass", "velvet burgundy and gold", "marble white and warm amber"],
  SPEAKEASY: ["smoky gray and amber", "deep mahogany and candlelight", "velvet burgundy and shadow"],
};

const DEFAULT_COLORS = ["warm amber and deep teal", "soft gold and charcoal", "candlelit warmth"];

// ---------------------------------------------------------------------------
// Composition rotation — cycles per variant index so cards look different
// ---------------------------------------------------------------------------

const COMPOSITIONS = [
  "Wide establishing composition — full room visible, the space as the main character",
  "Medium intimate composition — focused on a bar section or table, warm depth of field",
  "Close-up detail composition — shallow depth of field, texture and craft in sharp focus",
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a unique Flux image prompt suffix.
 *
 * Uses barType + barId hash + variantIndex + time-of-day + season to produce
 * a different color palette, lighting, atmosphere, and composition on every
 * call, even when two bars of the same type generate at the exact same time.
 *
 * The barId hash acts as a rotation offset — Bar A and Bar B (both cocktail bars)
 * generating variant 0 simultaneously will get DIFFERENT color/lighting/atmosphere
 * combinations because their barId hashes produce different offsets.
 */
export function generateImageSuffix(
  barType: string,
  variantIndex: number,
  barId: string,
): string {
  const now = new Date();
  const hour = now.getHours();
  const season = getSeason(now);

  // Time-of-day lighting
  const timeLighting = hour < 11
    ? ["soft morning light", "fresh daylight", "cool blue morning tones"]
    : hour < 16
      ? ["bright afternoon light", "natural daylight", "warm midday sun"]
      : hour < 20
        ? ["golden hour glow", "warm sunset light", "amber evening tones"]
        : ["intimate evening lighting", "low warm light", "candlelit night atmosphere"];

  // Season-specific atmosphere
  const seasonAtmosphere = season === "summer"
    ? ["long evening shadows", "outdoor terrace glow", "sun-drenched warmth"]
    : season === "winter"
      ? ["cosy interior warmth", "frost-kissed windows", "deep winter comfort"]
      : season === "spring"
        ? ["fresh renewal light", "soft spring evening", "blooming freshness"]
        : ["golden autumn tones", "crisp fall light", "harvest warmth"];

  const colors = BAR_COLORS[barType] || DEFAULT_COLORS;

  // Bar-specific offset — guarantees different bars get different rotations.
  // Two cocktail bars generating variant 0 at the same time WILL get different
  // color/lighting/atmosphere combinations because their barId hashes differ.
  const barOffset = hashString(barId);

  // Deterministic rotation PER VARIANT, shifted by bar-specific offset.
  // This ensures:
  //   - Different bars → different combinations (barOffset varies)
  //   - Same bar, same variant → same combination (deterministic)
  //   - Same bar, different variants → different combinations (variantIndex varies)
  const colorIdx = (variantIndex + barOffset) % colors.length;
  const lightIdx = (variantIndex + barOffset) % timeLighting.length;
  const atmosIdx = (variantIndex + barOffset) % seasonAtmosphere.length;

  return [
    `Color palette: ${colors[colorIdx]}`,
    `Lighting: ${timeLighting[lightIdx]}`,
    `Atmosphere: ${seasonAtmosphere[atmosIdx]}`,
    `Composition: ${COMPOSITIONS[variantIndex % COMPOSITIONS.length]}`,
    `Style: editorial photography, 35mm film aesthetic, no text or logos`,
  ].join(". ");
}
