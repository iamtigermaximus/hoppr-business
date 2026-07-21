// src/lib/utils/hook-classifier.ts
// ============================================================================
// HOOK PATTERN CLASSIFIER — Post-hoc headline pattern detection
// ============================================================================
//
// Classifies headlines into hook patterns so users learn to recognize
// what makes a strong headline. Used as a fallback when the AI doesn't
// provide a hookPattern label, and for real-time re-classification when
// the user manually edits a headline.
//
// The six patterns match the Creative Director Review's Criterion 9
// in persona.ts. This classifier is deliberately simple and heuristic —
// it prioritizes explainability over perfect accuracy.
// ============================================================================

// ---- Hook Pattern Types ----

export type HookPattern =
  | "curiosity_gap"
  | "pattern_interrupt"
  | "social_proof"
  | "urgency_scarcity"
  | "emotional_spike"
  | "direct_promise";

export interface HookAnnotation {
  /** The classified hook pattern */
  pattern: HookPattern;
  /** Human-readable label in English */
  label: string;
  /** Finnish label */
  labelFi: string;
  /** Short teaching explanation in English */
  explanation: string;
  /** Finnish teaching explanation */
  explanationFi: string;
  /** Confidence: "ai" = labeled by AI, "classified" = heuristic, "uncertain" = low confidence */
  confidence: "ai" | "classified" | "uncertain";
}

// ---- Pattern Definitions (labels match persona.ts Criterion 9) ----

const PATTERN_DEFS: Record<HookPattern, Omit<HookAnnotation, "pattern" | "confidence">> = {
  curiosity_gap: {
    label: "Curiosity Gap",
    labelFi: "Uteliaisuuskuilu",
    explanation: "Raises a question the reader needs answered — makes you want to read the next line",
    explanationFi: "Herättää kysymyksen, johon lukija tarvitsee vastauksen — pakottaa lukemaan seuraavan rivin",
  },
  pattern_interrupt: {
    label: "Pattern Interrupt",
    labelFi: "Kaavan katkaisu",
    explanation: "Breaks the scroll with the unexpected — something that doesn't fit the pattern",
    explanationFi: "Katkaisee skrollauksen odottamattomalla — jokin, joka ei sovi kaavaan",
  },
  social_proof: {
    label: "Social Proof",
    labelFi: "Sosiaalinen todiste",
    explanation: "Signals popularity or peer behavior — references crowd, numbers, or community",
    explanationFi: "Viestii suosiosta tai vertaiskäyttäytymisestä — viittaa väkijoukkoon, numeroihin tai yhteisöön",
  },
  urgency_scarcity: {
    label: "Urgency / Scarcity",
    labelFi: "Kiire / Niukkuus",
    explanation: "Creates fear of missing out — time pressure, limited availability, exclusivity",
    explanationFi: "Luo menettämisen pelkoa — aikapainetta, rajoitettua saatavuutta, eksklusiivisuutta",
  },
  emotional_spike: {
    label: "Emotional Spike",
    labelFi: "Tunnepiikki",
    explanation: "Triggers an immediate feeling — nostalgia, excitement, curiosity, desire",
    explanationFi: "Laukaisee välittömän tunteen — nostalgiaa, innostusta, uteliaisuutta, halua",
  },
  direct_promise: {
    label: "Direct Promise",
    labelFi: "Suora lupaus",
    explanation: "States the value clearly — straightforward offer, no mystery, just the benefit",
    explanationFi: "Ilmaisee arvon selkeästi — suora tarjous, ei mysteeriä, vain hyöty",
  },
};

// ---- Signal words and patterns per hook type ----

/** Signal words/phrases that suggest each pattern. English + Finnish. */
const SIGNALS: Record<HookPattern, RegExp[]> = {
  curiosity_gap: [
    /we('re| are) doing something/i,
    /guess what/i,
    /you('ll| will) never/i,
    /what happens when/i,
    /the secret/i,
    /something (is )?(different|new|changed)/i,
    /you won't believe/i,
    /\?$/,                                     // Ends with a question mark
    /^what if/i,
    /^how (to|do|does)/i,
    /^why /i,
    /arvaa|arvatkaa|tiedätkö|tiesitkö/i,
    /mitä tapahtuu|mitä jos/i,
    /\?$/,                                     // Finnish question mark (same char)
  ],
  pattern_interrupt: [
    /^this is not/i,
    /^stop /i,
    /^don't /i,
    /^forget /i,
    /not (a|another|your|just)/i,
    /^(wait|hold on)/i,
    /^(tämä|tässä) ei ole/i,
    /^älä |^lopeta /i,
    /^unohda /i,
    /^odota|^hetkinen/i,
  ],
  social_proof: [
    /\d+ people/i,
    /\d+ (came|joined|showed|attended)/i,
    /everyone('s| is) (talking|going|coming)/i,
    /the crowd/i,
    /your friends/i,
    /(everyone|everybody|all of)/i,
    /sold out/i,
    /full (house|room)/i,
    /regulars/i,
    /(the|your) neighborhood/i,
    /(\d+|sadat|tuhannet) (ihmis|kävij|tuli)/i,
    /kaikki (puhuu|tulee|menee)/i,
    /loppuunmyyty/i,
    /täynnä/i,
    /naapurusto|kortteli/i,
  ],
  urgency_scarcity: [
    /(\d+|only|just) (spots?|left|remaining|tickets?)/i,
    /last (chance|call|night|few)/i,
    /before (it'?s?|they'?re?|we'?re?) gone/i,
    /limited/i,
    /exclusive/i,
    /(ends?|closing) (tonight|soon|this week)/i,
    /hurry/i,
    /don't miss/i,
    /(tonight|this weekend|today) only/i,
    /(vain|vain |enää) (\d+|muutama)/i,
    /viime(i|nen|set)/i,
    /ennen kuin/i,
    /rajoitettu/i,
    /(päättyy|loppuu|sulkeutuu)/i,
    /älä missaa|älä myöhästy/i,
  ],
  emotional_spike: [
    /remember (when|how)/i,
    /feel(s|ing)? (like|the)/i,
    /that feeling/i,
    /imagine/i,
    /(summer|winter|spring|autumn|night|morning|evening)/i,
    /(warm|cozy|electric|alive|magic)/i,
    /nostalgia/i,
    /(never|always) (felt|feel)/i,
    /muistatko|muistele/i,
    /(tunne|tuntuu|tuntema)/i,
    /kuvitella|kuvittele/i,
    /(kesä|talvi|kevät|syksy|yö|aamu|ilta)/i,
    /(lämmin|kotoisa|sähköinen|maaginen)/i,
  ],
  direct_promise: [
    /^\d+% off/i,
    /^(free|get|buy|book|order|reserve|try)/i,
    /(for|at) (half|low|reduced)/i,
    /straight(forward| to)/i,
    /simple as/i,
    /no (catch|strings|hassle)/i,
    /^ilmainen|^osta|^varaa|^tilaa|^kokeile/i,
    /^\d+% alennus/i,
    /(puoleen|alennettuun) hintaan/i,
    /suoraan|yksinkertaisesti/i,
    /ei (koukkua|ehtoja|häslinkiä)/i,
  ],
};

// ---- Classification ----

/**
 * Classify a headline into one of the six hook patterns.
 *
 * Strategy: iterate through each pattern's signal words and count matches.
 * The pattern with the most matches wins. Ties are broken by priority
 * (curiosity_gap > social_proof > urgency_scarcity > emotional_spike >
 *  pattern_interrupt > direct_promise — more sophisticated patterns
 *  rank higher).
 *
 * Returns `null` if the headline is too short or produces no matches.
 */
export function classifyHookPattern(title: string): HookAnnotation | null {
  if (!title || title.trim().length < 6) return null;

  const clean = title.trim();

  // Count signal matches per pattern
  const scores = new Map<HookPattern, number>();
  for (const [pattern, regexes] of Object.entries(SIGNALS) as [HookPattern, RegExp[]][]) {
    let score = 0;
    for (const re of regexes) {
      if (re.test(clean)) score++;
    }
    scores.set(pattern, score);
  }

  // Find the top-scoring pattern(s)
  let bestPattern: HookPattern = "direct_promise"; // default
  let bestScore = 0;

  // Priority order for tie-breaking (most specific → most generic)
  const PRIORITY: HookPattern[] = [
    "curiosity_gap",
    "social_proof",
    "urgency_scarcity",
    "emotional_spike",
    "pattern_interrupt",
    "direct_promise",
  ];

  for (const pattern of PRIORITY) {
    const score = scores.get(pattern) || 0;
    if (score > bestScore) {
      bestScore = score;
      bestPattern = pattern;
    }
  }

  const def = PATTERN_DEFS[bestPattern];
  return {
    pattern: bestPattern,
    ...def,
    confidence: bestScore >= 2 ? "classified" : "uncertain",
  };
}

/**
 * Given an AI-labeled hook pattern string, produce a full annotation.
 * Used when the AI has explicitly labeled the hook pattern.
 */
export function aiHookAnnotation(pattern: string): HookAnnotation | null {
  const normalized = pattern.toLowerCase().replace(/[^a-z_]/g, "_");
  const match = Object.keys(PATTERN_DEFS).find((key) => normalized.includes(key));
  if (!match) return null;

  const def = PATTERN_DEFS[match as HookPattern];
  return {
    pattern: match as HookPattern,
    ...def,
    confidence: "ai",
  };
}

/**
 * Get the hook annotation for a headline, preferring AI labels.
 * Falls back to heuristic classification if the AI label is missing or invalid.
 */
export function getHookAnnotation(
  title: string,
  aiLabel?: string | null,
): HookAnnotation | null {
  // Try AI label first
  if (aiLabel) {
    const aiAnnotation = aiHookAnnotation(aiLabel);
    if (aiAnnotation) return aiAnnotation;
  }

  // Fall back to heuristic classification
  return classifyHookPattern(title);
}

// ---- Pattern reference (for UI hints / tooltips) ----

export const HOOK_PATTERN_REFERENCE = PATTERN_DEFS;

export const HOOK_PATTERNS = Object.keys(PATTERN_DEFS) as HookPattern[];
