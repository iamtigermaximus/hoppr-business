// src/lib/prompts/synergy-rules.ts
// ============================================================================
// INGREDIENT SYNERGY — When tone + context combinations amplify each other.
//
// Context isn't just additional data. Certain pairings create compound
// effects: "Date night" + "Elegant" = amplified romance. "After-work" +
// "Bold" = FOMO-heavy urgency. These synergies are explicit instructions
// that modify the voice when the right ingredients align.
// ============================================================================

import type { ContentTone } from "./tone-voices";

// ---------------------------------------------------------------------------
// Canonical context keys — labels map to these for matching
// ---------------------------------------------------------------------------

const CONTEXT_KEY_MAP: Record<string, string> = {
  // English labels (short display text)
  "Weekend energy": "weekend",
  "Thursday night": "thursday",
  "Weekday calm": "weekday",
  "Daytime": "daytime",
  "After-work": "after-work",
  "Late night": "late-night",
  "Summer terrace": "summer",
  "Winter cozy": "winter",
  "Vappu": "vappu",
  "Birthday": "birthday",
  "Date night": "date-night",
  // Finnish labels
  "Viikonloppu": "weekend",
  "Torstai-ilta": "thursday",
  "Arki-ilta": "weekday",
  "Päivätapahtuma": "daytime",
  "Myöhäinen ilta": "late-night",
  "Kesäterassi": "summer",
  "Talvitunnelma": "winter",
  "Syntymäpäivät": "birthday",
  "Treffi-ilta": "date-night",
};

/**
 * Resolve an array of context strings to canonical keys.
 * Tries exact match first (short labels), then substring match (full value strings).
 * The API receives full value strings like "After-work hours — straight from the office...",
 * so we need substring matching as a fallback.
 */
function resolveContextKeys(strings: string[]): string[] {
  const keys: string[] = [];
  for (const s of strings) {
    // Exact match (short labels)
    const exact = CONTEXT_KEY_MAP[s];
    if (exact) {
      keys.push(exact);
      continue;
    }
    // Substring match (full value strings)
    for (const [label, key] of Object.entries(CONTEXT_KEY_MAP)) {
      if (s.toLowerCase().includes(label.toLowerCase())) {
        keys.push(key);
        break;
      }
    }
  }
  return [...new Set(keys)]; // dedupe
}

// ---------------------------------------------------------------------------
// Synergy definitions
// ---------------------------------------------------------------------------

interface SynergyRule {
  en: string;
  fi: string;
}

/** Tone × Context synergies */
const TONE_CONTEXT_SYNERGIES: Record<string, Record<string, SynergyRule>> = {
  BOLD_ENERGETIC: {
    "after-work": {
      en: "SYNERGY — Bold + After-work: FOMO energy. The workday is done — the window is now. Use countdown language. Short urgent bursts. The best tables go first. The deal is live RIGHT NOW.",
      fi: "SYNERGIA — Rohkea + After-work: FOMO-energia. Työpäivä on ohi — ikkuna on nyt. Käytä lähtölaskentakieltä. Lyhyitä kiireellisiä purkauksia. Parhaat pöydät menevät ensin. Tarjous on päällä JUURI NYT.",
    },
    "weekend": {
      en: "SYNERGY — Bold + Weekend: Peak energy. This is THE night. Full-throttle party language. No holding back. The weekend is the main event — write like it.",
      fi: "SYNERGIA — Rohkea + Viikonloppu: Huippuenergia. Tämä on SE ilta. Täysillä bilekielellä. Ei pidättelyä. Viikonloppu on pääesiintyjä — kirjoita niin.",
    },
    "late-night": {
      en: "SYNERGY — Bold + Late night: The night peaks NOW. Urgency at maximum. Last-call energy. No looking ahead to tomorrow — this moment is all that matters.",
      fi: "SYNERGIA — Rohkea + Myöhäinen ilta: Yö huipentuu NYT. Kiireellisyys maksimissa. Viimeisen kutsun energia. Ei huomisen miettimistä — tämä hetki on kaikki.",
    },
  },

  WARM_INVITING: {
    "date-night": {
      en: "SYNERGY — Warm + Date night: Amplify intimacy. Candlelit detail. Two-person framing — 'your table for two,' 'an evening together.' Slow, deliberate rhythm. Romance through atmosphere, not cliché.",
      fi: "SYNERGIA — Lämmin + Treffi-ilta: Vahvista intimiteettiä. Kynttilänvalon yksityiskohdat. Kahden hengen kehystys — 'pöytä kahdelle,' 'ilta yhdessä.' Hidas, harkittu rytmi. Romantiikkaa tunnelman kautta, ei kliseillä.",
    },
    "winter": {
      en: "SYNERGY — Warm + Winter: The bar as refuge. Cold outside, warmth inside. Double down on sensory comfort — fire, blankets, hot drinks, amber light. The contrast between outdoors and indoors IS the appeal.",
      fi: "SYNERGIA — Lämmin + Talvi: Baari turvapaikkana. Kylmä ulkona, lämpö sisällä. Tuplaa aistillinen mukavuus — tuli, viltit, kuumat juomat, meripihkanvalo. Kontrasti ulko- ja sisätilan välillä ON vetovoima.",
    },
    "weekday": {
      en: "SYNERGY — Warm + Weekday: The neighborhood regular. Familiar faces. Unhurried warmth. No urgency — the bar is always here, always welcoming. The consistency is the comfort.",
      fi: "SYNERGIA — Lämmin + Arki-ilta: Naapuruston vakiokasvot. Tutut naamat. Kiireetöntä lämpöä. Ei kiirettä — baari on aina täällä, aina tervetullut. Jatkuvuus on lohtu.",
    },
  },

  EDGY_IRREVERENT: {
    "late-night": {
      en: "SYNERGY — Edgy + Late night: Dark humor peaks. The filter is off. Write like 1am honesty — no pretense, no polish. The late crowd doesn't want marketing. Give them truth with a smirk.",
      fi: "SYNERGIA — Ronski + Myöhäinen ilta: Musta huumori huipentuu. Filtteri on pois. Kirjoita kuin klo 1 rehellisyys — ei teeskentelyä, ei kiillotusta. Myöhäisillan yleisö ei halua markkinointia. Anna totuus virneellä.",
    },
    "thursday": {
      en: "SYNERGY — Edgy + Thursday: The real ones know. Thursday is the actual weekend — Friday's for amateurs. Subvert the Friday hype. Call it what it is: the smart crowd's head start.",
      fi: "SYNERGIA — Ronski + Torstai: Oikeat tietää. Torstai on oikea viikonloppu — perjantai on amatööreille. Kumoa perjantaihehkutus. Sano se niin kuin se on: fiksun porukan etumatka.",
    },
  },

  ELEGANT_PREMIUM: {
    "date-night": {
      en: "SYNERGY — Elegant + Date night: Amplified refinement. Every detail matters — the pour, the plating, the lighting. Write like you're describing a Michelin-listed evening. The occasion is the experience.",
      fi: "SYNERGIA — Elegantti + Treffi-ilta: Vahvistettua hienostuneisuutta. Jokainen yksityiskohta merkitsee — kaato, asettelu, valaistus. Kirjoita kuin kuvailisit Michelin-listattua iltaa. Tilaisuus on kokemus.",
    },
    "summer": {
      en: "SYNERGY — Elegant + Summer: Terrace elegance. Sunset light through glassware. Outdoor sophistication — not casual, elevated. White linen, chilled pours, golden hour. Summer at its most refined.",
      fi: "SYNERGIA — Elegantti + Kesä: Terassieleganssia. Auringonlaskun valo lasien läpi. Ulkotilojen hienostuneisuutta — ei rentoa, vaan kohotettua. Valkoista pellavaa, viilennettyjä kaatoja, kultaista tuntia. Kesä hienostuneimmillaan.",
    },
  },

  PLAYFUL_FUN: {
    "weekend": {
      en: "SYNERGY — Playful + Weekend: Peak party energy. The group chat is blowing up. Infectious enthusiasm — write like the plan is already in motion and everyone's invited. Banter, call-outs, inside-joke energy.",
      fi: "SYNERGIA — Leikkisä + Viikonloppu: Huippubile-energia. Ryhmächatti räjähtää. Tarttuvaa innostusta — kirjoita kuin suunnitelma on jo käynnissä ja kaikki on kutsuttu. Läppää, huutelua, inside-vitsienergiaa.",
    },
    "birthday": {
      en: "SYNERGY — Playful + Birthday: Celebration mode activated. It's someone's day — write like you're throwing the party yourself. Cake references, toast energy, 'they deserve this' framing. Make the birthday person feel like the main character.",
      fi: "SYNERGIA — Leikkisä + Syntymäpäivät: Juhlatila aktivoitu. On jonkun päivä — kirjoita kuin järjestäisit juhlat itse. Kakkureferenssejä, maljaenergiaa, 'ne ansaitsee tän' -kehystys. Saa syntymäpäiväsankari tuntemaan itsensä päähenkilöksi.",
    },
    "vappu": {
      en: "SYNERGY — Playful + Vappu: Carnival mode. Finland's wildest weekend. Balloons, confetti, city-wide celebration. Write like the entire city is your venue. Maximum playfulness. No restraint.",
      fi: "SYNERGIA — Leikkisä + Vappu: Karnevaalitila. Suomen villein viikonloppu. Ilmapalloja, konfettia, koko kaupungin juhla. Kirjoita kuin koko kaupunki on tapahtumapaikkasi. Maksimaalista leikkisyyttä. Ei pidättelyä.",
    },
  },
};

/** Template × Context synergies */
const TEMPLATE_CONTEXT_SYNERGIES: Record<string, Record<string, SynergyRule>> = {
  "Ladies Night": {
    "weekend": {
      en: "SYNERGY — Ladies Night + Weekend: The whole crew's free. Peak group energy. Frame it as the main event of the weekend — not a pregame, not an afterthought. Everyone's calendar is open.",
      fi: "SYNERGIA — Ladies Night + Viikonloppu: Koko porukka on vapaana. Huippuryhmäenergia. Kehystä se viikonlopun pääesiintymänä — ei etkoina, ei jälkiajatuksena. Kaikkien kalenteri on auki.",
    },
    "birthday": {
      en: "SYNERGY — Ladies Night + Birthday: Double celebration. Girls' night AND a birthday. Write like the bar is throwing a private party for the group — reserved area, special treatment, make it theirs.",
      fi: "SYNERGIA — Ladies Night + Syntymäpäivät: Tuplajuhla. Tyttöjen ilta JA syntymäpäivät. Kirjoita kuin baari järjestäisi yksityiset juhlat ryhmälle — varattu alue, erityiskohtelu, tee siitä heidän.",
    },
  },

  "Live Music": {
    "late-night": {
      en: "SYNERGY — Live Music + Late night: The set is on NOW. Night-crowd energy — this isn't background music, this is THE event. Sound fills the room. Time is specific: doors, opener, headliner. Build the timeline.",
      fi: "SYNERGIA — Elävä musiikki + Myöhäinen ilta: Setti on päällä NYT. Yöyleisön energia — tämä ei ole taustamusiikkia, tämä ON tapahtuma. Ääni täyttää tilan. Aika on tarkka: ovet, lämppäri, pääesiintyjä. Rakenna aikajana.",
    },
    "weekend": {
      en: "SYNERGY — Live Music + Weekend: Weekend lineup energy. The band everyone's talking about. Saturday night sound. Frame the performer as the reason to leave the house — the bar is just lucky to host them.",
      fi: "SYNERGIA — Elävä musiikki + Viikonloppu: Viikonlopun kokoonpanoenergia. Bändi josta kaikki puhuu. Lauantai-illan soundi. Kehystä esiintyjä syynä lähteä kotoa — baari on onnekas saadessaan isännöidä.",
    },
  },

  "Food Special": {
    "date-night": {
      en: "SYNERGY — Food + Date night: Dining IS the date. The table is the stage. Write about the meal as the shared experience — what you'll taste together, what the kitchen prepared. Pairings matter. Let the food lead.",
      fi: "SYNERGIA — Ruoka + Treffi-ilta: Ruokailu ON treffit. Pöytä on lava. Kirjoita ateriasta jaettuna kokemuksena — mitä maistatte yhdessä, mitä keittiö on valmistanut. Suositukset merkitsevät. Anna ruuan johtaa.",
    },
  },

  "VIP Experience": {
    "birthday": {
      en: "SYNERGY — VIP + Birthday: Red carpet treatment. Bottle service. Private area. Write like the birthday person is the most important guest in the building — because tonight, they are. Skip-the-line energy. Exclusive treatment is the gift.",
      fi: "SYNERGIA — VIP + Syntymäpäivät: Punaisen maton kohtelu. Pullopalvelu. Yksityistila. Kirjoita kuin syntymäpäiväsankari on rakennuksen tärkein vieras — koska tänään, hän on. Ohita-jono-energia. Eksklusiivinen kohtelu on lahja.",
    },
    "weekend": {
      en: "SYNERGY — VIP + Weekend: Weekend means demand. Tables sell out. Write with the confidence of scarcity — the people who book early get the experience. Exclusivity peaks on Friday and Saturday.",
      fi: "SYNERGIA — VIP + Viikonloppu: Viikonloppu tarkoittaa kysyntää. Pöydät myydään loppuun. Kirjoita niukkuuden itsevarmuudella — ne jotka varaavat ajoissa saavat kokemuksen. Eksklusiivisuus huipentuu perjantaina ja lauantaina.",
    },
  },

  "Theme Night": {
    "vappu": {
      en: "SYNERGY — Theme Night + Vappu: Carnival transformation. The bar becomes the festival. Costumes, confetti, full commitment. Write like the theme takes over everything — the bar isn't hosting a Vappu party, the bar IS Vappu.",
      fi: "SYNERGIA — Teemailta + Vappu: Karnevaalimuodonmuutos. Baarista tulee festivaali. Asuja, konfettia, täysi sitoutuminen. Kirjoita kuin teema valtaa kaiken — baari ei järjestä Vappu-juhlia, baari ON Vappu.",
    },
  },

  "After-Work": {
    "after-work": {
      en: "SYNERGY — After-Work template + After-work: Double down. This isn't just a promotion — it IS the after-work moment. Time is the main ingredient: 4pm, 5pm, the window between office and evening. Mention the transition explicitly. Practical details anchor the appeal.",
      fi: "SYNERGIA — After-Work-mallipohja + After-work: Tuplaa. Tämä ei ole vain tarjous — se ON after-work-hetki. Aika on pääainesosa: klo 16, klo 17, ikkuna toimiston ja illan välissä. Mainitse siirtymä eksplisiittisesti. Käytännön yksityiskohdat ankkuroivat vetovoiman.",
    },
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Resolve template to its canonical English form (handles Finnish variants). */
function canonicalTemplate(template: string): string {
  const map: Record<string, string> = {
    "Naistenilta": "Ladies Night",
    "Elävä musiikki": "Live Music",
    "Peli-ilta": "Game Night",
    "Ruokatarjous": "Food Special",
    "VIP-kokemus": "VIP Experience",
    "Talon suositukset": "Signature Evening",
    "Teemailta": "Theme Night",
  };
  return map[template] || template;
}

/**
 * Compute synergy instructions from the selected tone, template, and context.
 * Returns up to 3 synergy strings — tone×context first (primary voice modifier),
 * then template×context (secondary). Capped to avoid prompt bloat.
 */
export function getSynergyInstructions(
  tone: ContentTone | undefined | null,
  template: string | undefined | null,
  contextLabels: string[] | undefined | null,
  language: "en" | "fi" = "en",
): string[] {
  if (!tone || !contextLabels || contextLabels.length === 0) return [];

  const contextKeys = resolveContextKeys(contextLabels);
  if (contextKeys.length === 0) return [];

  const instructions: string[] = [];
  const seen = new Set<string>();

  // Tone × Context synergies (priority — these modify the primary voice)
  const toneMap = TONE_CONTEXT_SYNERGIES[tone];
  if (toneMap) {
    for (const key of contextKeys) {
      const rule = toneMap[key];
      if (rule && !seen.has(key)) {
        seen.add(key);
        instructions.push(language === "fi" ? rule.fi : rule.en);
        if (instructions.length >= 3) return instructions;
      }
    }
  }

  // Template × Context synergies (secondary — these amplify the template context)
  if (template) {
    const canonTemplate = canonicalTemplate(template);
    const templateMap = TEMPLATE_CONTEXT_SYNERGIES[canonTemplate];
    if (templateMap) {
      for (const key of contextKeys) {
        if (seen.has(key)) continue; // don't double-fire the same context key
        const rule = templateMap[key];
        if (rule) {
          seen.add(key);
          instructions.push(language === "fi" ? rule.fi : rule.en);
          if (instructions.length >= 3) return instructions;
        }
      }
    }
  }

  return instructions;
}

// ---------------------------------------------------------------------------
// Template → Tone recommendations
// When a template is selected, certain tones are naturally synergistic
// ("recommended") while others create tonal mismatch ("cautionary").
// Used by the UI to highlight / dim tone chips based on template context.
// ---------------------------------------------------------------------------

/** Canonicalize template display labels to recommendation keys */
function templateToRecommendationKey(template: string): string {
  const normalized = template.toLowerCase().replace(/[^a-z0-9]/g, "");
  const MAP: Record<string, string> = {
    afterwork: "after-work",
    ladiesnight: "ladies-night",
    livemusic: "live-music",
    livenight: "live-music",
    gamenight: "game-night",
    foodspecial: "food-special",
    vipexperience: "vip-experience",
    signatureevening: "signature-evening",
    themenight: "theme-night",
  };
  return MAP[normalized] || normalized;
}

interface ToneRecommendation {
  recommended: string[];
  cautionary: string[];
}

const TEMPLATE_TONE_RECOMMENDATIONS: Record<string, ToneRecommendation> = {
  "ladies-night": {
    recommended: ["PLAYFUL_FUN", "BOLD_ENERGETIC"],
    cautionary: ["EDGY_IRREVERENT", "ELEGANT_PREMIUM"],
  },
  "game-night": {
    recommended: ["PLAYFUL_FUN", "BOLD_ENERGETIC"],
    cautionary: ["ELEGANT_PREMIUM"],
  },
  "food-special": {
    recommended: ["WARM_INVITING", "ELEGANT_PREMIUM"],
    cautionary: ["EDGY_IRREVERENT"],
  },
  "vip-experience": {
    recommended: ["ELEGANT_PREMIUM", "WARM_INVITING"],
    cautionary: ["EDGY_IRREVERENT", "PLAYFUL_FUN"],
  },
  "signature-evening": {
    recommended: ["ELEGANT_PREMIUM", "WARM_INVITING"],
    cautionary: ["BOLD_ENERGETIC", "EDGY_IRREVERENT"],
  },
  "theme-night": {
    recommended: ["PLAYFUL_FUN", "EDGY_IRREVERENT"],
    cautionary: ["ELEGANT_PREMIUM"],
  },
  // ---- New tone-adaptive templates ----
  // UNIVERSAL
  "after-work": {
    recommended: ["WARM_INVITING", "PLAYFUL_FUN"],
    cautionary: ["EDGY_IRREVERENT"],
  },
  "weekend-special": {
    recommended: ["BOLD_ENERGETIC", "PLAYFUL_FUN"],
    cautionary: ["ELEGANT_PREMIUM"],
  },
  "seasonal-special": {
    recommended: ["WARM_INVITING", "ELEGANT_PREMIUM"],
    cautionary: ["EDGY_IRREVERENT", "BOLD_ENERGETIC"],
  },
  "regulars-night": {
    recommended: ["WARM_INVITING", "COMMUNITY_LOCAL"],
    cautionary: ["EDGY_IRREVERENT", "MYSTERIOUS_EXCLUSIVE"],
  },
  // SOCIAL
  "quiz-night": {
    recommended: ["PLAYFUL_FUN", "BOLD_ENERGETIC"],
    cautionary: ["ELEGANT_PREMIUM", "ROMANTIC_INTIMATE"],
  },
  "karaoke-night": {
    recommended: ["PLAYFUL_FUN", "BOLD_ENERGETIC"],
    cautionary: ["ELEGANT_PREMIUM", "MYSTERIOUS_EXCLUSIVE"],
  },
  "group-celebration": {
    recommended: ["PLAYFUL_FUN", "WARM_INVITING"],
    cautionary: ["MYSTERIOUS_EXCLUSIVE"],
  },
  "industry-night": {
    recommended: ["EDGY_IRREVERENT", "COMMUNITY_LOCAL"],
    cautionary: ["ROMANTIC_INTIMATE", "ELEGANT_PREMIUM"],
  },
  // FOOD
  "tasting-menu": {
    recommended: ["ELEGANT_PREMIUM", "WARM_INVITING"],
    cautionary: ["EDGY_IRREVERENT", "BOLD_ENERGETIC"],
  },
  "food-drink-pairing": {
    recommended: ["ELEGANT_PREMIUM", "WARM_INVITING"],
    cautionary: ["EDGY_IRREVERENT"],
  },
  "chefs-special": {
    recommended: ["ELEGANT_PREMIUM", "BOLD_ENERGETIC"],
    cautionary: ["EDGY_IRREVERENT", "PLAYFUL_FUN"],
  },
  "brunch-service": {
    recommended: ["WARM_INVITING", "PLAYFUL_FUN"],
    cautionary: ["EDGY_IRREVERENT", "MYSTERIOUS_EXCLUSIVE"],
  },
  // ENTERTAINMENT
  "live-music": {
    recommended: ["BOLD_ENERGETIC", "EDGY_IRREVERENT"],
    cautionary: ["ELEGANT_PREMIUM"],
  },
  "dj-night": {
    recommended: ["BOLD_ENERGETIC", "EDGY_IRREVERENT"],
    cautionary: ["ELEGANT_PREMIUM", "ROMANTIC_INTIMATE"],
  },
  "sports-screening": {
    recommended: ["BOLD_ENERGETIC", "PLAYFUL_FUN"],
    cautionary: ["ELEGANT_PREMIUM", "ROMANTIC_INTIMATE"],
  },
  "open-mic": {
    recommended: ["WARM_INVITING", "PLAYFUL_FUN"],
    cautionary: ["MYSTERIOUS_EXCLUSIVE", "ELEGANT_PREMIUM"],
  },
  // PREMIUM
  "cocktail-masterclass": {
    recommended: ["ELEGANT_PREMIUM", "WARM_INVITING"],
    cautionary: ["EDGY_IRREVERENT", "PLAYFUL_FUN"],
  },
  "meet-the-maker": {
    recommended: ["ELEGANT_PREMIUM", "WARM_INVITING"],
    cautionary: ["EDGY_IRREVERENT"],
  },
  "private-tasting": {
    recommended: ["ELEGANT_PREMIUM", "MYSTERIOUS_EXCLUSIVE"],
    cautionary: ["BOLD_ENERGETIC", "PLAYFUL_FUN"],
  },
  "rare-release": {
    recommended: ["MYSTERIOUS_EXCLUSIVE", "ELEGANT_PREMIUM"],
    cautionary: ["PLAYFUL_FUN"],
  },
  // COMMUNITY
  "neighbourhood-night": {
    recommended: ["COMMUNITY_LOCAL", "WARM_INVITING"],
    cautionary: ["MYSTERIOUS_EXCLUSIVE", "ELEGANT_PREMIUM"],
  },
  "local-artist": {
    recommended: ["COMMUNITY_LOCAL", "ELEGANT_PREMIUM"],
    cautionary: ["EDGY_IRREVERENT"],
  },
  "charity-fundraiser": {
    recommended: ["COMMUNITY_LOCAL", "WARM_INVITING"],
    cautionary: ["EDGY_IRREVERENT", "MYSTERIOUS_EXCLUSIVE"],
  },
  "new-in-town": {
    recommended: ["COMMUNITY_LOCAL", "WARM_INVITING"],
    cautionary: ["MYSTERIOUS_EXCLUSIVE"],
  },
};

export function getTemplateToneRecommendations(
  template: string | undefined | null,
): ToneRecommendation | null {
  if (!template) return null;
  const key = templateToRecommendationKey(template);
  return TEMPLATE_TONE_RECOMMENDATIONS[key] || null;
}
