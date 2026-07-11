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
 *  for regeneration by being specific about composition and lighting. */
export function wrapComplianceFraming(userPrompt: string, contentType: string): string {
  const base = `Professional hospitality marketing photograph for a ${contentType}. `;
  const quality = [
    // Composition — tell the model what good looks like
    "Rule-of-thirds composition. Strong focal point. Clean leading lines.",
    "Professional depth of field with background bokeh. Sharp focus on the main subject.",
    // Lighting — specificity prevents flat or overexposed output
    "Cinematic lighting with natural highlights and soft shadows. No harsh flash.",
    "Warm color temperature. Rich contrast without blown-out whites or crushed blacks.",
    // Style — positions the output as editorial-grade
    "Editorial photography style suitable for a premium hospitality brand.",
    "Photorealistic. 35mm film aesthetic. High production value.",
  ].join(" ");
  const noText = [
    // CRITICAL: AI models often generate misspelled or garbled text in images.
    // All text/typography will be added in post-production via CSS templates.
    // This instruction must be forceful because models frequently ignore soft "no text" hints.
    "ABSOLUTELY NO text, words, letters, typography, or written content of any kind in the image.",
    "No signs, no menus, no labels, no brand names, no numbers, no lettering on bottles or glasses.",
    "No chalkboards, no neon text, no wall lettering, no printed materials anywhere in frame.",
    "The image must be entirely text-free — all text and graphics will be overlaid in post-production.",
  ].join(" ");
  const compliance = [
    "Focus on ambiance, decor, and craft beverages — not on consumption.",
    "No people visibly drinking. If people are present, they are socializing responsibly.",
    "No logos, no brand names visible on any bottles, glasses, or surfaces.",
    "Suitable for all audiences. Professional, clean, inviting.",
  ].join(" ");

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
): ComplianceResult {
  const blockedPatterns: string[] = [];
  const warnings: string[] = [];

  // Strip photography terminology before checking to avoid false positives
  // (e.g., "detail shot" = camera term, not alcohol shot)
  const cleanedPrompt = stripPhotographyTerms(rawPrompt);

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

  const passed = blockedPatterns.length === 0;

  // Always wrap in compliance framing — the framing contains safety instructions
  // that guide the model regardless of whether the raw prompt had issues.
  const sanitizedPrompt = wrapComplianceFraming(rawPrompt, contentType);

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
];

export interface SubjectPreset {
  id: string;
  label: string;
  visualPrompt: string;
}

export const SUBJECT_PRESETS: SubjectPreset[] = [
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
