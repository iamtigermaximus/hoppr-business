// src/lib/prompts/context-analyzer.ts
// ============================================================================
// CONTEXT ANALYZER — Scores and ranks contextual suggestions for promotions.
//
// Instead of a flat list of time-based context tags, this module analyzes the
// full ingredient picture: template, tone, bar type, current time, and user's
// prompt text. Each context tag gets a relevance score, and the UI surfaces
// the highest-scoring ones as "Suggested for you."
// ============================================================================

import type { ContentTone } from "./tone-voices";

// ---- Types ----

export interface ScoredContext {
  id: string;
  label: { en: string; fi: string };
  value: { en: string; fi: string };
  score: number; // 0–8
  reasons: string[]; // e.g. ["matches template", "seasonal", "tone-pair"]
}

// ---- Context definitions — each tag with its bilingual label + description ----

interface ContextTag {
  id: string;
  label: { en: string; fi: string };
  value: { en: string; fi: string };
  /** Categories the tag belongs to for template matching. */
  categories: string[];
  /** Template IDs this context naturally pairs with. */
  templateMatches: string[];
  /** Tone values this context amplifies. */
  toneAmplifies: ContentTone[];
  /** Tone values this context clashes with. */
  toneClashes: ContentTone[];
  /** Time patterns: month ranges 0-11, day-of-week names, hour ranges. */
  timeSignals: {
    months?: number[];
    daysOfWeek?: string[];
    hourRange?: [number, number];
    specificDates?: { month: number; day: number }[];
  };
  /** Keywords for prompt text matching. */
  keywords: { en: string[]; fi: string[] };
}

const CONTEXT_TAGS: ContextTag[] = [
  {
    id: "weekend",
    label: { en: "Weekend energy", fi: "Viikonloppu" },
    value: {
      en: "Weekend energy — the crowd is ready, the vibe is high, the night is wide open",
      fi: "Viikonlopun tunnelma, bilekansa liikkeellä, korkea energia",
    },
    categories: ["time", "social"],
    templateMatches: ["weekend-special", "dj-night", "live-music", "sports-screening", "group-celebration", "karaoke-night"],
    toneAmplifies: ["BOLD_ENERGETIC", "PLAYFUL_FUN", "EDGY_IRREVERENT"],
    toneClashes: ["ROMANTIC_INTIMATE", "NOSTALGIC_CLASSIC"],
    timeSignals: { daysOfWeek: ["Friday", "Saturday"], hourRange: [18, 24] },
    keywords: {
      en: ["weekend", "friday", "saturday", "party", "crowd", "busy night", "big night", "club"],
      fi: ["viikonloppu", "perjantai", "lauantai", "bileet", "väkijoukko", "klubi", "iso ilta"],
    },
  },
  {
    id: "weekday",
    label: { en: "Weekday calm", fi: "Arki-ilta" },
    value: {
      en: "Weekday calm — less crowd, more room to breathe, the regulars' night",
      fi: "Arki-illan rentous — vähemmän tungosta, enemmän tilaa nauttia",
    },
    categories: ["time", "atmosphere"],
    templateMatches: ["after-work", "regulars-night", "brunch-service", "neighbourhood-night", "quiz-night"],
    toneAmplifies: ["WARM_INVITING", "COMMUNITY_LOCAL", "NOSTALGIC_CLASSIC", "ELEGANT_PREMIUM"],
    toneClashes: ["BOLD_ENERGETIC", "EDGY_IRREVERENT"],
    timeSignals: { daysOfWeek: ["Monday", "Tuesday", "Wednesday", "Sunday"], hourRange: [16, 22] },
    keywords: {
      en: ["weekday", "calm", "quiet", "regular", "monday", "tuesday", "wednesday", "sunday", "relaxed"],
      fi: ["arki", "rauhallinen", "hiljainen", "kanta-asiakas", "maanantai", "tiistai", "keskiviikko", "sunnuntai"],
    },
  },
  {
    id: "thursday",
    label: { en: "Thursday night", fi: "Torstai-ilta" },
    value: {
      en: "Thursday — the weekend starts early, the smart crowd is already out",
      fi: "Torstai on uusi perjantai — viikonlopun odotus, rento mutta energinen fiilis",
    },
    categories: ["time", "social"],
    templateMatches: ["after-work", "quiz-night", "industry-night", "live-music", "open-mic"],
    toneAmplifies: ["PLAYFUL_FUN", "BOLD_ENERGETIC", "COMMUNITY_LOCAL"],
    toneClashes: ["ELEGANT_PREMIUM", "ROMANTIC_INTIMATE"],
    timeSignals: { daysOfWeek: ["Thursday"] },
    keywords: {
      en: ["thursday", "pre-weekend", "thirsty thursday", "almost friday", "weekend eve"],
      fi: ["torstai", "pikkulauantai", "melkein perjantai", "viikonlopun alku"],
    },
  },
  {
    id: "daytime",
    label: { en: "Daytime", fi: "Päivätapahtuma" },
    value: {
      en: "Daytime event — brunch, lunch, early start, different energy",
      fi: "Päivätapahtuma — brunssi, lounas, aikainen startti",
    },
    categories: ["time", "food"],
    templateMatches: ["brunch-service", "tasting-menu", "food-drink-pairing", "chefs-special", "seasonal-special"],
    toneAmplifies: ["WARM_INVITING", "COMMUNITY_LOCAL", "NOSTALGIC_CLASSIC"],
    toneClashes: ["EDGY_IRREVERENT", "MYSTERIOUS_EXCLUSIVE", "BOLD_ENERGETIC"],
    timeSignals: { hourRange: [8, 15] },
    keywords: {
      en: ["daytime", "brunch", "lunch", "morning", "afternoon", "day event", "early", "coffee"],
      fi: ["päivä", "brunssi", "lounas", "aamu", "iltapäivä", "päivätapahtuma", "aikaisin", "kahvi"],
    },
  },
  {
    id: "after-work",
    label: { en: "After-work", fi: "After-work" },
    value: {
      en: "After-work hours — straight from the office, the decompression hour",
      fi: "After-work-aika — toimistolta suoraan, rentoutumisen hetki",
    },
    categories: ["time", "atmosphere"],
    templateMatches: ["after-work", "regulars-night", "chefs-special", "weekend-special", "industry-night"],
    toneAmplifies: ["WARM_INVITING", "PLAYFUL_FUN", "COMMUNITY_LOCAL", "BOLD_ENERGETIC"],
    toneClashes: ["MYSTERIOUS_EXCLUSIVE", "ELEGANT_PREMIUM"],
    timeSignals: { daysOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], hourRange: [16, 19] },
    keywords: {
      en: ["after work", "after-work", "office", "decompress", "unwind", "happy hour", "5pm", "commute"],
      fi: ["after work", "toimisto", "rentoutua", "työpäivän jälkeen", "klo 17", "työmatka"],
    },
  },
  {
    id: "late-night",
    label: { en: "Late night", fi: "Myöhäinen ilta" },
    value: {
      en: "Late night energy — the party is alive, the night crowd has arrived",
      fi: "Iltatunnelma — myöhäinen ilta, bileet käynnissä, yöelämän syke",
    },
    categories: ["time", "social"],
    templateMatches: ["dj-night", "live-music", "sports-screening", "karaoke-night", "weekend-special"],
    toneAmplifies: ["BOLD_ENERGETIC", "EDGY_IRREVERENT", "PLAYFUL_FUN", "MYSTERIOUS_EXCLUSIVE"],
    toneClashes: ["WARM_INVITING", "NOSTALGIC_CLASSIC"],
    timeSignals: { hourRange: [21, 4] },
    keywords: {
      en: ["late night", "midnight", "after hours", "nightcap", "late", "club", "dance floor", "dj"],
      fi: ["myöhään", "keskiyö", "yökerho", "tanssilattia", "dj", "myöhäisilta"],
    },
  },
  {
    id: "summer",
    label: { en: "Summer terrace", fi: "Kesäterassi" },
    value: {
      en: "Summer terrace season — outdoor, sunset, long evenings, fresh air",
      fi: "Kesäterassi — ulkoilma, auringonlasku, pitkät illat",
    },
    categories: ["seasonal", "atmosphere"],
    templateMatches: ["seasonal-special", "brunch-service", "group-celebration", "food-drink-pairing", "after-work"],
    toneAmplifies: ["PLAYFUL_FUN", "WARM_INVITING", "ADVENTUROUS_CURIOUS", "NOSTALGIC_CLASSIC"],
    toneClashes: ["MYSTERIOUS_EXCLUSIVE", "EDGY_IRREVERENT"],
    timeSignals: { months: [5, 6, 7] },
    keywords: {
      en: ["summer", "terrace", "outdoor", "sunset", "patio", "garden", "sunny", "warm weather", "al fresco"],
      fi: ["kesä", "terassi", "ulkona", "auringonlasku", "patio", "puutarha", "aurinkoinen", "lämmin"],
    },
  },
  {
    id: "winter",
    label: { en: "Winter cozy", fi: "Talvitunnelma" },
    value: {
      en: "Winter warmth — cozy indoors, warm lighting, escape from the cold",
      fi: "Talvinen tunnelma — lämmintä valoa, pimeyttä vastaan, sisätilojen kodikkuus",
    },
    categories: ["seasonal", "atmosphere"],
    templateMatches: ["seasonal-special", "private-tasting", "meet-the-maker", "tasting-menu", "neighbourhood-night"],
    toneAmplifies: ["WARM_INVITING", "NOSTALGIC_CLASSIC", "ROMANTIC_INTIMATE", "COMMUNITY_LOCAL"],
    toneClashes: ["BOLD_ENERGETIC", "PLAYFUL_FUN"],
    timeSignals: { months: [11, 0, 1] },
    keywords: {
      en: ["winter", "cozy", "warm", "cold", "snow", "hygge", "fireplace", "dark", "christmas", "holiday"],
      fi: ["talvi", "kodikas", "lämmin", "kylmä", "lumi", "takka", "pimeä", "joulu", "glögi"],
    },
  },
  {
    id: "vappu",
    label: { en: "Vappu", fi: "Vappu" },
    value: {
      en: "Vappu celebration — Finland's biggest carnival, spring festival",
      fi: "Vappu-tunnelma — kevään juhla, kaupungin suurin karnevaali",
    },
    categories: ["seasonal", "social"],
    templateMatches: ["weekend-special", "group-celebration", "theme-night", "seasonal-special"],
    toneAmplifies: ["PLAYFUL_FUN", "BOLD_ENERGETIC", "COMMUNITY_LOCAL", "EDGY_IRREVERENT"],
    toneClashes: ["ELEGANT_PREMIUM", "MYSTERIOUS_EXCLUSIVE", "ROMANTIC_INTIMATE"],
    timeSignals: { months: [4], specificDates: [{ month: 4, day: 28 }, { month: 4, day: 29 }, { month: 4, day: 30 }, { month: 5, day: 1 }] },
    keywords: {
      en: ["vappu", "may day", "spring carnival", "carnival", "may 1st", "balloons", "parade"],
      fi: ["vappu", "vapun", "karnevaali", "serpentiini", "simaa", "munkki", "paraati"],
    },
  },
  {
    id: "birthday",
    label: { en: "Birthday", fi: "Syntymäpäivät" },
    value: {
      en: "Birthday or celebration — group bookings, private area",
      fi: "Syntymäpäivät tai juhlat — ryhmävaraukset, yksityistila",
    },
    categories: ["social", "event"],
    templateMatches: ["group-celebration", "vip-experience", "private-tasting", "karaoke-night", "cocktail-masterclass"],
    toneAmplifies: ["PLAYFUL_FUN", "WARM_INVITING", "BOLD_ENERGETIC", "ELEGANT_PREMIUM"],
    toneClashes: ["EDGY_IRREVERENT", "MYSTERIOUS_EXCLUSIVE"],
    timeSignals: {},
    keywords: {
      en: ["birthday", "celebration", "party", "group", "friends", "bachelor", "bachelorette", "reunion", "anniversary"],
      fi: ["syntymäpäivä", "juhla", "bileet", "ryhmä", "ystävät", "polttarit", "tapaaminen", "vuosipäivä"],
    },
  },
  {
    id: "date-night",
    label: { en: "Date night", fi: "Treffi-ilta" },
    value: {
      en: "Date night — intimate atmosphere, tables for two",
      fi: "Treffi-ilta — intiimi tunnelma, kahden hengen pöydät",
    },
    categories: ["social", "atmosphere"],
    templateMatches: ["private-tasting", "tasting-menu", "food-drink-pairing", "meet-the-maker", "cocktail-masterclass"],
    toneAmplifies: ["ROMANTIC_INTIMATE", "ELEGANT_PREMIUM", "WARM_INVITING", "NOSTALGIC_CLASSIC"],
    toneClashes: ["BOLD_ENERGETIC", "EDGY_IRREVERENT", "PLAYFUL_FUN"],
    timeSignals: {},
    keywords: {
      en: ["date", "romantic", "couple", "intimate", "two", "dinner for two", "candlelit", "special night", "valentine"],
      fi: ["treffit", "romanttinen", "pari", "intiimi", "kahdelle", "illallinen", "kynttilä", "ystävänpäivä"],
    },
  },
];

// ---- Scoring engine ----

interface ScoreInput {
  template?: string | null;
  tone?: ContentTone | null;
  barType?: string | null;
  /** Current Date for time-based relevance. */
  now?: Date;
  /** User's free-text prompt for keyword matching. */
  promptText?: string | null;
  language: "en" | "fi";
}

/**
 * Score a single context tag against all available ingredients.
 * Returns 0–8 where 5+ = strong suggestion, 3–4 = relevant, 0–2 = available.
 */
function scoreTag(tag: ContextTag, input: ScoreInput): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const lang = input.language;

  // 1. Template-context pairing (0–3)
  if (input.template && tag.templateMatches.includes(input.template)) {
    score += 3;
    reasons.push(lang === "fi" ? "sopii mallipohjaan" : "matches template");
  }

  // 2. Tone-context pairing (0–2)
  if (input.tone) {
    if (tag.toneAmplifies.includes(input.tone)) {
      score += 2;
      reasons.push(lang === "fi" ? "vahvistaa sävyä" : "amplifies tone");
    } else if (!tag.toneClashes.includes(input.tone)) {
      score += 1; // neutral
    }
    // score 0 if tone clashes — don't add reason
  }

  // 3. Time/seasonal relevance (0–2)
  if (input.now) {
    let timeScore = 0;
    const ts = tag.timeSignals;

    if (ts.months && ts.months.includes(input.now.getMonth())) {
      timeScore = Math.max(timeScore, 2);
    }
    if (ts.daysOfWeek) {
      const dow = input.now.toLocaleDateString("en-US", { weekday: "long" });
      if (ts.daysOfWeek.includes(dow)) {
        timeScore = Math.max(timeScore, 2);
      }
    }
    if (ts.hourRange) {
      const hour = input.now.getHours();
      if (hour >= ts.hourRange[0] && hour < ts.hourRange[1]) {
        timeScore = Math.max(timeScore, 1);
      }
    }
    if (ts.specificDates) {
      const month = input.now.getMonth();
      const day = input.now.getDate();
      if (ts.specificDates.some((d) => d.month === month && d.day === day)) {
        timeScore = 2;
      }
    }

    if (timeScore > 0) {
      score += timeScore;
      if (timeScore >= 2) {
        reasons.push(lang === "fi" ? "ajankohtainen" : "timely");
      }
    }
  }

  // 4. Prompt keyword match (0–1)
  if (input.promptText) {
    const text = input.promptText.toLowerCase();
    const keywords = tag.keywords[lang];
    if (keywords.some((kw) => text.includes(kw.toLowerCase()))) {
      score += 1;
      reasons.push(lang === "fi" ? "löytyi kuvauksesta" : "found in brief");
    }
  }

  return { score, reasons };
}

// ---- Public API ----

/**
 * Return all context tags, scored and ranked by relevance to the current ingredients.
 * Tags scoring 0 are included at the bottom — every context is usable, just some fit better.
 */
export function getScoredContexts(input: ScoreInput): ScoredContext[] {
  const scored = CONTEXT_TAGS.map((tag) => {
    const { score, reasons } = scoreTag(tag, input);
    return {
      id: tag.id,
      label: tag.label,
      value: tag.value,
      score,
      reasons,
    };
  });

  // Sort: highest score first, then by label alphabetically for ties
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.label.en.localeCompare(b.label.en);
  });

  return scored;
}

/**
 * Return only the top-scoring contexts (score ≥ 4) — the "Suggested for you" tier.
 */
export function getTopSuggestedContexts(input: ScoreInput, limit = 4): ScoredContext[] {
  return getScoredContexts(input).filter((c) => c.score >= 4).slice(0, limit);
}

/**
 * Return the remaining contexts (score < 4) — the "Always available" tier.
 */
export function getRemainingContexts(input: ScoreInput): ScoredContext[] {
  return getScoredContexts(input).filter((c) => c.score < 4);
}
