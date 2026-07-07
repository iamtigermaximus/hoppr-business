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
 *  Stripped before compliance check to prevent false positives. */
const PHOTOGRAPHY_SAFE_TERMS = [
  /\b(wide|medium|close-up|detail|establishing|beauty|product|hero|group|action|candid)\s+shot\b/gi,
  /\bphoto\s*(shoot|shooting)\b/gi,
  /\bshot\s*(composition|framing|angle|perspective|setup)\b/gi,
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

  const passed = blockedPatterns.length === 0;

  // Always wrap in compliance framing, regardless of whether the prompt passed
  const sanitizedPrompt = passed
    ? wrapComplianceFraming(rawPrompt, contentType)
    : rawPrompt; // If blocked, don't bother wrapping — it won't be sent

  return { passed, blockedPatterns, warnings, sanitizedPrompt };
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
