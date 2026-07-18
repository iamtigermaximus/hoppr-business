// src/lib/compliance/image-compliance.ts
// Finnish Alcohol Act (1102/2017) compliance filter for AI image prompts.
//
// The law restricts alcohol advertising. Key rules applied here:
// - No depictions of excessive or irresponsible drinking
// - No images suggesting alcohol improves social/sexual success
// - No imagery that could appeal primarily to minors
// - No linking alcohol to driving or dangerous activities
// - Mild vs strong alcohol distinction (strong = >22% ABV, stricter rules)
//
// Strategy: We don't try to analyze generated images (that's unreliable).
// Instead, we filter prompts BEFORE they reach the AI and inject compliance-safe
// framing that guides the model toward appropriate output.

// ---- Blocked patterns ----

interface ComplianceRule {
  pattern: RegExp;
  reason: string;
  severity: "block" | "warn";
}

const BLOCKED_PATTERNS: ComplianceRule[] = [
  {
    pattern: /\b(shots?|shooting|downing|chug|binge|hammered|wasted|drunk|intoxicated)\b/i,
    reason: "References to excessive or rapid alcohol consumption",
    severity: "block",
  },
  {
    pattern: /\b(sexy|hot\s*girls?|bikini|lingerie|stripper|pole\s*danc)/i,
    reason: "Sexualized imagery or linking alcohol to sexual success",
    severity: "block",
  },
  {
    pattern: /\b(teen|underage|college\s*(kid|student|freshman)|high\s*school|prom\s*night)/i,
    reason: "Content that could appeal primarily to minors",
    severity: "block",
  },
  {
    pattern: /\b(driving|drive|car|vehicle|motorcycle|scooter)\b.*\b(drink|alcohol|cocktail|beer|wine|shot)/i,
    reason: "Linking alcohol consumption to driving",
    severity: "block",
  },
  {
    pattern: /\b(drinking\s*game|beer\s*pong|flip\s*cup|keg\s*stand)/i,
    reason: "Depictions of drinking games or competitive drinking",
    severity: "block",
  },
  {
    pattern: /\b(free\s*alcohol|unlimited\s*drinks?|all\s*you\s*can\s*drink|bottomless)/i,
    reason: "Promoting unlimited or free alcohol (restricted under Finnish law)",
    severity: "block",
  },
  {
    pattern: /\b(hangover|cure|remedy|morning\s*after)/i,
    reason: "References to hangovers or drinking consequences",
    severity: "warn",
  },
];

// Finnish-language blocked patterns — checked alongside English ones.
// These catch Finnish terms that the English patterns would miss.
const BLOCKED_PATTERNS_FI: ComplianceRule[] = [
  {
    pattern: /(juomapeli|bisseturnaus|shottikisa|juomakilpailu)/i,
    reason: "Viittauksia juomapeleihin tai juomakilpailuihin (juomapeli, shottikisa)",
    severity: "block",
  },
  {
    pattern: /(ilmainen|ilmaiset|ilmaisia)\s*(juoma|olut|viini|siideri|alkoholi|drinksu)/i,
    reason: "Ilmaisten alkoholijuomien mainostaminen (ilmainen juoma)",
    severity: "block",
  },
  {
    pattern: /(känni|humala|päihty|hiprakka|juovuksissa)/i,
    reason: "Päihtymyksen positiivinen kuvaaminen (känni, humala, hiprakka)",
    severity: "block",
  },
  {
    pattern: /(alaikä|alaikäis|alle\s*18)/i,
    reason: "Alaikäisiin kohdistuva sisältö (alaikäinen, alle 18)",
    severity: "block",
  },
  {
    pattern: /(opiskelija\s*bileet|opiskelija\s*tarjous|koulu\s*bileet)/i,
    reason: "Opiskelijoihin/alikäisiin vetoava kieli (opiskelijabileet, koulubileet)",
    severity: "block",
  },
  {
    pattern: /(auto|ajaa|ajaminen|parkkeeraa).{0,15}(juoma|alkoholi|olut|baari)/i,
    reason: "Alkoholin yhdistäminen ajoneuvon käyttöön (auto, ajaa, parkkeeraa)",
    severity: "block",
  },
  {
    pattern: /(saada\s*seuraa|iskeä|pokata|viehättävämpi)/i,
    reason: "Alkoholin yhdistäminen sosiaaliseen/seksuaaliseen menestykseen (saada seuraa, iskeä)",
    severity: "block",
  },
  {
    pattern: /(terveellinen|vähäkalorinen|detox|terveyshyöty)\s*(juoma|cocktail|olut|drinksu)/i,
    reason: "Terveysväitteet alkoholijuomista (terveellinen, detox, vähäkalorinen)",
    severity: "warn",
  },
  {
    pattern: /(jaa\s*kuvasi|tägää\s*meidät|postaa\s*juomasi)/i,
    reason: "Kuluttajien tuottaman alkoholisisällön jakamiskehotus (jaa, tägää, postaa)",
    severity: "warn",
  },
  {
    pattern: /(rajaton|pohjaton|kaikki\s*mitä\s*juot)\s*(juoma|olut|alkoholi)/i,
    reason: "Rajattoman alkoholinkulutuksen mainostaminen (rajaton juoma, pohjaton)",
    severity: "block",
  },
];

// ---- Compliance-safe framing ----

/** Wraps a user prompt in compliance-safe professional framing.
 *  This guides the AI toward appropriate commercial photography
 *  AND toward high-quality, consistent output — reducing the need
 *  for regeneration by being specific about composition and lighting.
 *
 *  When imageWorld is non-venue (tunnelma, kausi_luonto, abstrakti, etc.),
 *  alcohol-specific compliance instructions are omitted — the image contains
 *  no alcohol, so those checks are unnecessary noise. */
export function wrapComplianceFraming(
  userPrompt: string,
  contentType: string,
  imageWorld?: ImageWorld,
): string {
  const containsAlcohol = !imageWorld || imageWorldContainsAlcohol(imageWorld);

  // Base framing adjusts based on image world
  const base = containsAlcohol
    ? `Professional hospitality marketing photograph for a ${contentType}. `
    : `Professional brand marketing photograph. `;

  const quality = [
    "Rule-of-thirds composition. Strong focal point. Clean leading lines.",
    "Professional depth of field with background bokeh. Sharp focus on the main subject.",
    "Cinematic lighting with natural highlights and soft shadows. No harsh flash.",
    "Warm color temperature. Rich contrast without blown-out whites or crushed blacks.",
    "Editorial photography style suitable for a premium hospitality brand.",
    "Photorealistic. 35mm film aesthetic. High production value.",
  ].join(" ");

  const noText = [
    "ABSOLUTELY NO text, words, letters, typography, or written content of any kind in the image.",
    "No signs, no menus, no labels, no brand names, no numbers, no lettering on bottles or glasses.",
    "No chalkboards, no neon text, no wall lettering, no printed materials anywhere in frame.",
    "The image must be entirely text-free — all text and graphics will be overlaid in post-production.",
  ].join(" ");

  // Alcohol-specific compliance — only included when the image world suggests
  // alcohol might be visible. For tunnelma/abstrakti/etc., we use a lighter
  // general-compliance block instead.
  const alcoholCompliance = [
    "Focus on ambiance, decor, and craft beverages — not on consumption.",
    "No people visibly drinking. If people are present, they are socializing responsibly.",
    "No logos, no brand names visible on any bottles, glasses, or surfaces.",
    "Suitable for all audiences. Professional, clean, inviting.",
  ].join(" ");

  const generalCompliance = [
    "Suitable for all audiences. Professional, clean, inviting.",
    "No identifiable brands, logos, or commercial signage.",
    "The image should evoke feeling and atmosphere, not specific commercial offers.",
  ].join(" ");

  const compliance = containsAlcohol ? alcoholCompliance : generalCompliance;

  return `${base}${userPrompt}. ${quality} ${noText} ${compliance}`;
}

// ---- Main check ----

interface ComplianceResult {
  passed: boolean;
  blockedPatterns: string[];
  warnings: string[];
  sanitizedPrompt: string;
}

/** Photography terms that contain words matching alcohol patterns (e.g. "shot").
 *  Stripped before compliance check to prevent false positives.
 *  Must be aggressive — visual directions from AI frequently use photography terminology. */
const PHOTOGRAPHY_SAFE_TERMS = [
  // "wide shot", "medium shot", etc.
  /\b(wide|medium|close-up|closeup|detail|establishing|beauty|product|hero|group|action|candid|tracking|master|two|over-the-shoulder)\s+shot\b/gi,
  // "photo shoot", "photo shooting"
  /\bphoto\s*(shoot|shooting)\b/gi,
  // "shot composition", "shot framing", etc.
  /\bshot\s*(composition|framing|angle|perspective|setup|size|type|direction|from|list|of|the)\b/gi,
  // Standalone photography terms in visual scene descriptions
  /\b(photographic|photography|camera|35mm|film|aesthetic|editorial)\s+(shot|shoot|shooting)\b/gi,
  /\b(shot|shoot)\s+(photography|photographic|camera|35mm|film|aesthetic|editorial)\b/gi,
  // "this shot shows", "the shot depicts", "a shot of the interior"
  /\b(this|the|a|each|every|one)\s+shot\b/gi,
  // "shooting style", "shooting technique"
  /\b(shooting|shoot)\s+(style|technique|mode|approach|setup)\b/gi,
];

function stripPhotographyTerms(text: string): string {
  let result = text;
  for (const term of PHOTOGRAPHY_SAFE_TERMS) {
    result = result.replace(term, "");
  }
  return result;
}

export function checkPromptCompliance(
  rawPrompt: string,
  contentType: string,
  imageWorld?: ImageWorld,
): ComplianceResult {
  const blockedPatterns: string[] = [];
  const warnings: string[] = [];
  const containsAlcohol = !imageWorld || imageWorldContainsAlcohol(imageWorld);

  // Strip photography terminology before checking to avoid false positives
  // (e.g., "detail shot" = camera term, not alcohol shot)
  const cleanedPrompt = stripPhotographyTerms(rawPrompt);

  // Only run alcohol-specific compliance checks when the image world
  // could contain alcohol. For tunnelma/abstrakti/etc., we skip these —
  // the image is about mood/nature, not drinking.
  if (containsAlcohol) {
    for (const rule of BLOCKED_PATTERNS) {
      if (rule.pattern.test(cleanedPrompt)) {
        if (rule.severity === "block") {
          blockedPatterns.push(rule.reason);
        } else {
          warnings.push(rule.reason);
        }
      }
    }

    // Also check Finnish-language blocked patterns
    for (const rule of BLOCKED_PATTERNS_FI) {
      if (rule.pattern.test(cleanedPrompt)) {
        if (rule.severity === "block") {
          blockedPatterns.push(rule.reason);
        } else {
          warnings.push(rule.reason);
        }
      }
    }
  }

  const passed = blockedPatterns.length === 0;

  // Always wrap in compliance framing — the framing contains safety instructions
  // that guide the model regardless of whether the raw prompt had issues.
  const sanitizedPrompt = wrapComplianceFraming(rawPrompt, contentType, imageWorld);

  return { passed, blockedPatterns, warnings, sanitizedPrompt };
}

// ---- Post-generation image validation ----

export interface ImageValidationResult {
  passed: boolean;
  blockedReasons: string[];
  warnings: string[];
  /** Whether the image visual description needs regeneration */
  needsRegeneration: boolean;
}

/**
 * Validate a generated image's visual description against both English
 * and Finnish compliance rules. This runs AFTER image generation to catch
 * risky visual descriptions the model may have produced despite prompt
 * framing.
 *
 * Called from images/generate/route.ts after receiving the generated image
 * and its visual description from the AI.
 */
export function validateGeneratedImage(
  visualDescription: string,
): ImageValidationResult {
  const blockedReasons: string[] = [];
  const warnings: string[] = [];

  // Strip photography terminology to avoid false positives
  const cleaned = stripPhotographyTerms(visualDescription);

  // Check English patterns
  for (const rule of BLOCKED_PATTERNS) {
    if (rule.pattern.test(cleaned)) {
      if (rule.severity === "block") {
        blockedReasons.push(`EN: ${rule.reason}`);
      } else {
        warnings.push(`EN: ${rule.reason}`);
      }
    }
  }

  // Check Finnish patterns
  for (const rule of BLOCKED_PATTERNS_FI) {
    if (rule.pattern.test(cleaned)) {
      if (rule.severity === "block") {
        blockedReasons.push(`FI: ${rule.reason}`);
      } else {
        warnings.push(`FI: ${rule.reason}`);
      }
    }
  }

  const passed = blockedReasons.length === 0;

  return {
    passed,
    blockedReasons,
    warnings,
    needsRegeneration: !passed,
  };
}

// ---- Style presets (user-friendly labels → safe visual descriptions) ----

export interface StylePreset {
  id: string;
  label: string;
  description: string;
  /** The visual description injected into the prompt. Pre-vetted for compliance. */
  visualPrompt: string;
  /** Whether this style is safe for strong alcohol (>22% ABV) content */
  strongAlcoholSafe: boolean;
}

export const STYLE_PRESETS: StylePreset[] = [
  // ---- Original (venue-focused) ----
  {
    id: "warm_cozy",
    label: "Warm & Cozy",
    description: "Candlelit, amber tones, intimate atmosphere",
    visualPrompt:
      "Warm candlelit interior with amber and gold tones, intimate seating, soft ambient lighting, cozy and welcoming hospitality atmosphere",
    strongAlcoholSafe: true,
  },
  {
    id: "modern_sleek",
    label: "Modern & Sleek",
    description: "Clean lines, neon accents, contemporary",
    visualPrompt:
      "Modern clean-lined bar interior, subtle neon accents, polished surfaces, contemporary design, sophisticated urban hospitality venue",
    strongAlcoholSafe: true,
  },
  {
    id: "classic_elegant",
    label: "Classic & Elegant",
    description: "Dark wood, brass, traditional",
    visualPrompt:
      "Classic elegant bar with dark wood paneling, brass fixtures, warm traditional lighting, refined and timeless hospitality setting",
    strongAlcoholSafe: true,
  },
  {
    id: "minimal_clean",
    label: "Minimal & Clean",
    description: "White space, single subject focus",
    visualPrompt:
      "Minimal clean composition, single craft cocktail or beverage as the hero subject, bright natural lighting, editorial food-and-drink photography style",
    strongAlcoholSafe: true,
  },
  {
    id: "outdoor_terrace",
    label: "Outdoor Terrace",
    description: "Natural light, plants, open-air",
    visualPrompt:
      "Outdoor terrace or patio bar setting, natural daylight, greenery and plants, fresh open-air atmosphere, relaxed European hospitality",
    strongAlcoholSafe: true,
  },
  // ---- New (extended — advertising/brand use) ----
  {
    id: "cinematic_warm",
    label: "Cinematic Warm",
    description: "Film-like warmth, golden hour glow, rich color grading",
    visualPrompt:
      "Cinematic warm color grading with rich golden tones, film-like depth, natural vignette, 35mm aesthetic, atmospheric and emotionally resonant",
    strongAlcoholSafe: true,
  },
  {
    id: "editorial_clean",
    label: "Editorial Clean",
    description: "Magazine-quality, crisp, high contrast",
    visualPrompt:
      "Editorial magazine-quality photography, crisp details, clean color separation, high production value, commercial lifestyle aesthetic",
    strongAlcoholSafe: true,
  },
  {
    id: "typographic_bold",
    label: "Typographic Bold",
    description: "Text-forward design, graphic composition",
    visualPrompt:
      "Graphic composition with strong negative space for text overlay, bold contrast, geometric framing, poster-design sensibility, visual hierarchy built into the image",
    strongAlcoholSafe: true,
  },
  {
    id: "soft_dreamy",
    label: "Soft & Dreamy",
    description: "Ethereal, hazy, pastel tones",
    visualPrompt:
      "Soft dreamy atmosphere with ethereal haze, pastel color palette, gentle light diffusion, romantic and wistful mood, shallow focus with glowing highlights",
    strongAlcoholSafe: true,
  },
  {
    id: "noir_moody",
    label: "Noir & Moody",
    description: "Dark, dramatic, high contrast shadows",
    visualPrompt:
      "Noir-inspired moody lighting, deep shadows with selective illumination, high contrast chiaroscuro, dramatic and mysterious atmosphere, cinematic darkness with intent",
    strongAlcoholSafe: true,
  },
  {
    id: "vintage_poster",
    label: "Vintage Poster",
    description: "Retro, screen-printed, travel-poster feel",
    visualPrompt:
      "Vintage travel-poster aesthetic, screen-printed color separation, mid-century illustration style, bold flat colors, nostalgic and timeless graphic quality",
    strongAlcoholSafe: true,
  },
  {
    id: "nordic_minimal",
    label: "Nordic Minimal",
    description: "Scandinavian simplicity, light, space",
    visualPrompt:
      "Nordic minimalist aesthetic, abundant negative space, pale natural light, muted earth-and-stone palette, Scandinavian design sensibility — less is more, calm is luxury",
    strongAlcoholSafe: true,
  },
];

export interface SubjectPreset {
  id: string;
  label: string;
  visualPrompt: string;
}

export const SUBJECT_PRESETS: SubjectPreset[] = [
  // ---- Original (venue-focused) ----
  {
    id: "interior",
    label: "Bar Interior",
    visualPrompt: "The bar's interior space showing seating, bar counter, and atmosphere",
  },
  {
    id: "cocktail",
    label: "Cocktail / Drink",
    visualPrompt: "A beautifully presented craft cocktail or beverage as the main subject",
  },
  {
    id: "exterior",
    label: "Bar Exterior",
    visualPrompt: "The bar's exterior entrance and facade, inviting and well-lit",
  },
  {
    id: "ambiance",
    label: "Ambiance / Mood",
    visualPrompt: "Abstract ambiance with blurred lights, warm atmosphere, and mood textures",
  },
  // ---- New (extended — non-venue subjects for brand advertising) ----
  {
    id: "sunset_water",
    label: "Sunset Over Water",
    visualPrompt: "Golden sunset over calm water, warm reflections, horizon glow, peaceful end-of-day atmosphere, no people visible",
  },
  {
    id: "beach_coast",
    label: "Beach & Coast",
    visualPrompt: "Scenic beach or coastline, soft waves, sand texture, open sky, natural summer beauty, no people or minimal distant silhouettes",
  },
  {
    id: "forest_birch",
    label: "Birch Forest",
    visualPrompt: "Finnish birch forest, dappled light through leaves, white trunks, green undergrowth, natural tranquility, forest path or clearing",
  },
  {
    id: "city_bluehour",
    label: "City at Blue Hour",
    visualPrompt: "Urban cityscape during blue hour, warm window lights against dusk sky, street level or elevated view, atmospheric city energy, no identifiable brands",
  },
  {
    id: "texture_abstract",
    label: "Abstract Texture",
    visualPrompt: "Abstract texture composition, pure color and light interplay, no recognizable objects, artistic blur and bokeh, suitable as a background with negative space for text overlay",
  },
  {
    id: "craft_detail",
    label: "Craft Detail",
    visualPrompt: "Close-up of hands at work — pouring, mixing, garnishing — focus on the craft ritual, shallow depth of field, natural materials, artisan process, no faces visible",
  },
  {
    id: "winter_archipelago",
    label: "Winter Archipelago",
    visualPrompt: "Finnish archipelago in winter, ice formations on dark water, snow-dusted rocky islands, pale winter light, stark and beautiful Nordic seascape",
  },
  {
    id: "seasonal_finnish",
    label: "Finnish Seasons",
    visualPrompt: "Finnish natural landscape in season, no buildings, pure nature — could be autumn russet colors, spring melt, summer meadow, or winter snow blanket depending on context",
  },
  {
    id: "warm_window_glow",
    label: "Warm Window Glow",
    visualPrompt: "Exterior view of warm-lit windows at dusk or night, the inviting glow of interiors seen from outside, cozy welcome implied but not shown, European street scene, no people as main subject",
  },
  {
    id: "urban_street",
    label: "Urban Street Scene",
    visualPrompt: "European city street, wet cobblestones after rain, warm streetlamp glow, neighborhood character, people walking naturally — not posed, not the main subject, urban life in motion",
  },
  {
    id: "northern_lights",
    label: "Northern Lights",
    visualPrompt: "Aurora borealis in the Finnish night sky, green and purple light curtains, dark silhouette landscape below, starry sky, awe-inspiring natural phenomenon, no artificial lights",
  },
  {
    id: "lakeside_mokki",
    label: "Lakeside Mökki",
    visualPrompt: "Traditional Finnish lakeside cottage, wooden sauna building by the water, summer evening light, dock extending into the lake, peaceful retreat atmosphere, no people visible",
  },
];

export interface CompositionPreset {
  id: string;
  label: string;
  visualPrompt: string;
}

export const COMPOSITION_PRESETS: CompositionPreset[] = [
  {
    id: "wide",
    label: "Wide Shot",
    visualPrompt: "Wide-angle composition showing the full space and atmosphere",
  },
  {
    id: "medium",
    label: "Medium Shot",
    visualPrompt: "Medium composition focused on a table, bar section, or group seating area",
  },
  {
    id: "closeup",
    label: "Close-up",
    visualPrompt: "Close-up detail view, shallow depth of field, focusing on texture and craft",
  },
];

// ---- Image World (Kuvamaailma) — controls whether the image depicts the venue or
//      a conceptual subject that serves the emotional register. ----

export type ImageWorld =
  | "baari"            // The venue itself — current behavior
  | "tunnelma"         // Mood/atmosphere — beach, sunset, city, forest
  | "kasityo"          // Craft detail — ingredients, tools, hands, process
  | "kausi_luonto"     // Season & nature — Finnish landscape
  | "graafinen"        // Graphic/typographic — text-forward, abstract
  | "kaupunki"         // City context — neighborhood, Helsinki
  | "abstrakti";       // Abstract/textural — pure color and light

export const IMAGE_WORLD_LABELS: Record<ImageWorld, { fi: string; en: string }> = {
  baari: { fi: "Baari", en: "The Venue" },
  tunnelma: { fi: "Tunnelma", en: "Mood & Atmosphere" },
  kasityo: { fi: "Käsityö", en: "Craft Detail" },
  kausi_luonto: { fi: "Kausi & luonto", en: "Season & Nature" },
  graafinen: { fi: "Graafinen", en: "Graphic / Typographic" },
  kaupunki: { fi: "Kaupunki", en: "City Context" },
  abstrakti: { fi: "Abstrakti", en: "Abstract / Textural" },
};

/**
 * Map brand UI ImageWorldChip values (from creative-director) to compliance
 * ImageWorld values. Used by tone-to-image-chips and the UI subject selector.
 */
export const IMAGE_WORLD_CHIP_TO_COMPLIANCE: Record<string, ImageWorld> = {
  venue: "baari",
  mood: "tunnelma",
  craft: "kasityo",
  nature: "kausi_luonto",
  graphic: "graafinen",
  city: "kaupunki",
  celebration: "kausi_luonto",
  abstract: "abstrakti",
};

/**
 * Returns the subject preset IDs available for a given image world.
 * Non-venue worlds show different options than the default 4 venue subjects.
 */
export function subjectsForImageWorld(world: ImageWorld): string[] {
  switch (world) {
    case "baari":
      return ["interior", "cocktail", "exterior", "ambiance"];
    case "tunnelma":
      return ["beach_coast", "sunset_water", "forest_birch", "city_bluehour", "seasonal_finnish", "northern_lights"];
    case "kasityo":
      return ["craft_detail", "cocktail", "texture_abstract"];
    case "kausi_luonto":
      return ["seasonal_finnish", "winter_archipelago", "forest_birch", "sunset_water", "lakeside_mokki"];
    case "graafinen":
      return ["texture_abstract"];
    case "kaupunki":
      return ["city_bluehour", "exterior", "urban_street", "warm_window_glow", "seasonal_finnish"];
    case "abstrakti":
      return ["texture_abstract"];
  }
}

/**
 * Returns style presets recommended for a given image world.
 * Some styles don't make sense for certain worlds (e.g., vintage_poster
 * with a photorealistic interior).
 */
export function stylesForImageWorld(world: ImageWorld): string[] {
  switch (world) {
    case "baari":
      return ["warm_cozy", "modern_sleek", "classic_elegant", "minimal_clean", "outdoor_terrace", "cinematic_warm", "editorial_clean", "noir_moody", "nordic_minimal"];
    case "tunnelma":
      return ["cinematic_warm", "soft_dreamy", "noir_moody", "editorial_clean", "nordic_minimal", "vintage_poster"];
    case "kasityo":
      return ["editorial_clean", "minimal_clean", "cinematic_warm", "nordic_minimal"];
    case "kausi_luonto":
      return ["cinematic_warm", "soft_dreamy", "editorial_clean", "nordic_minimal", "vintage_poster"];
    case "graafinen":
      return ["typographic_bold", "vintage_poster", "nordic_minimal"];
    case "kaupunki":
      return ["cinematic_warm", "noir_moody", "editorial_clean", "nordic_minimal", "soft_dreamy"];
    case "abstrakti":
      return ["soft_dreamy", "typographic_bold", "nordic_minimal", "vintage_poster", "noir_moody"];
  }
}

/**
 * Whether the image world implies alcohol visibility. When false, we can skip
 * alcohol-specific compliance checks and framing — the image is about mood/nature/
 * craft, not about drinking.
 */
export function imageWorldContainsAlcohol(world: ImageWorld): boolean {
  return world === "baari" || world === "kasityo";
}
