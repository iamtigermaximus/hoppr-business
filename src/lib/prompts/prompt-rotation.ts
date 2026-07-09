// src/lib/prompts/prompt-rotation.ts
// ============================================================================
// PROMPT ROTATION — Bar-specific randomness for text generation.
//
// The image pipeline already uses generateImageSuffix (barId hash as rotation
// offset) so two bars generating at the same time get different visual output.
// This does the same for text: deterministic-but-varied rotation of framing
// angles, opening hooks, and emphasis patterns based on a bar-specific seed.
//
// Each bar consistently gets the same "angles" — creating a recognizable
// creative identity across promotions. Two bars with the same tone+template
// will approach the same brief from different creative directions.
// ============================================================================

// ---------------------------------------------------------------------------
// Hash function — turns barId into a deterministic number
// ---------------------------------------------------------------------------

function hashBarId(barId: string): number {
  let hash = 0;
  for (let i = 0; i < barId.length; i++) {
    const char = barId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

// ---------------------------------------------------------------------------
// Rotation pools
// ---------------------------------------------------------------------------

/** What the promotion leads with. */
const FRAMING_ANGLES = {
  en: [
    "Lead with the DEAL — what they get, the value, the concrete offer. Price and timing up front.",
    "Lead with the ATMOSPHERE — how it feels, the scene, the sensory experience. Paint the room first.",
    "Lead with the SOCIAL angle — who's there, the crowd, the shared moment. Make them picture their crew.",
    "Lead with the UNIQUENESS — why this night, this bar, this moment. Something they can't get elsewhere.",
    "Lead with the URGENCY — tonight, this weekend, right now. The window is open but it won't stay open.",
  ],
  fi: [
    "Johda TARJOUKSELLA — mitä saa, arvo, konkreettinen etu. Hinta ja ajoitus ensin.",
    "Johda TUNNELMALLA — miltä tuntuu, miljöö, aistikokemus. Maalaa huone ensin.",
    "Johda SOSIAALISELLA kulmalla — kuka siellä on, porukka, jaettu hetki. Saa heidät kuvittelemaan oma jenginsä.",
    "Johda AINUTLAATUISUUDELLA — miksi juuri tämä ilta, tämä baari, tämä hetki. Jotain mitä ei saa muualta.",
    "Johda KIIREELLISYYDELLÄ — tänään, tänä viikonloppuna, juuri nyt. Ikkuna on auki mutta ei pysy.",
  ],
};

/** How the first sentence opens. */
const OPENING_HOOKS = {
  en: [
    "Open with a QUESTION — pull them in. Make them answer in their head before they read on.",
    "Open with a STATEMENT — confident, declarative. Set the tone immediately. No warm-up.",
    "Open with a SCENE — drop them into the room. What do they see, hear, smell? Start mid-moment.",
    "Open with a COMMAND — short, direct. Tell them what to do. No preamble.",
    "Open with CURIOSITY — a teaser, a hint. Make them want to read the next line. Don't give it all away.",
  ],
  fi: [
    "Aloita KYSYMYKSellÄ — vedä heidät mukaan. Saa heidät vastaamaan päässään ennen kuin lukevat eteenpäin.",
    "Aloita TOTEAMUKSELLA — itsevarma, julistava. Aseta sävy heti. Ei lämmittelyä.",
    "Aloita KOHTAUKSELLA — pudota heidät huoneeseen. Mitä he näkevät, kuulevat, haistavat? Aloita keskeltä hetkeä.",
    "Aloita KÄSKYLLÄ — lyhyt, suora. Kerro mitä tehdä. Ei johdantoa.",
    "Aloita UTELIAISUUDELLA — teaseri, vihje. Saa heidät haluamaan lukea seuraava rivi. Älä paljasta kaikkea.",
  ],
};

/** What details get the most attention. */
const EMPHASIS_PATTERNS = {
  en: [
    "EMPHASIZE the drinks and menu — what's on pour, what's on the plate. The craft, the selection, the quality.",
    "EMPHASIZE the music and entertainment — the sound, the performer, the energy. What you'll hear and feel.",
    "EMPHASIZE the crowd and social energy — who's there, the vibe, the community. It's about the people.",
    "EMPHASIZE the space and atmosphere — the room, the lighting, the design. Where you are matters.",
    "EMPHASIZE the timing and occasion — why tonight, why now. The moment is the main character.",
  ],
  fi: [
    "KOROSTA juomia ja menua — mitä on tarjolla, mitä lautasella. Käsityö, valikoima, laatu.",
    "KOROSTA musiikkia ja viihdettä — ääni, esiintyjä, energia. Mitä kuulet ja tunnet.",
    "KOROSTA porukkaa ja sosiaalista energiaa — kuka siellä on, tunnelma, yhteisö. Kyse on ihmisistä.",
    "KOROSTA tilaa ja tunnelmaa — huone, valaistus, design. Sillä on väliä missä olet.",
    "KOROSTA ajoitusta ja tilaisuutta — miksi tänään, miksi nyt. Hetki on päähenkilö.",
  ],
};

/** How each variant within a generation batch differentiates. */
const VARIANT_DIFFERENTIATION = {
  en: [
    [
      "Variant 1: OFFER-FOCUSED. Lead with the deal, the value, the concrete benefit. What they get.",
      "Variant 2: VIBE-FOCUSED. Lead with atmosphere, sensory detail, the experience. How it feels.",
      "Variant 3: SOCIAL-FOCUSED. Lead with the crowd, the shared moment, the community. Who they'll be with.",
    ],
    [
      "Variant 1: URGENT. Countdown energy. Tonight only. The window is closing.",
      "Variant 2: CURIOUS. Teaser energy. Hint at something special without revealing everything.",
      "Variant 3: CONFIDENT. Understated certainty. No hard sell — the quality speaks.",
    ],
    [
      "Variant 1: SHORT & PUNCHY. Headline-driven. Minimal description. Let the offer do the work.",
      "Variant 2: DESCRIPTIVE. Scene-driven. Paint the full picture. Sensory detail throughout.",
      "Variant 3: CONVERSATIONAL. Casual, direct. Like a recommendation from someone who was there last week.",
    ],
  ],
  fi: [
    [
      "Variantti 1: TARJOUSKESKEINEN. Johda diilillä, arvolla, konkreettisella edulla. Mitä he saavat.",
      "Variantti 2: TUNNELMAKESKEINEN. Johda tunnelmalla, aistiyksityiskohdilla, kokemuksella. Miltä tuntuu.",
      "Variantti 3: SOSIAALISKESKEINEN. Johda porukalla, jaetulla hetkellä, yhteisöllä. Kenen kanssa he ovat.",
    ],
    [
      "Variantti 1: KIIREELLINEN. Lähtölaskentaenergia. Vain tänään. Ikkuna sulkeutuu.",
      "Variantti 2: UTELIAS. Teaser-energia. Vihjaa jostain erityisestä paljastamatta kaikkea.",
      "Variantti 3: ITSEVARMA. Hillitty varmuus. Ei kovaa myyntiä — laatu puhuu.",
    ],
    [
      "Variantti 1: LYHYT & ISKEVÄ. Otsikkovetoinen. Minimaalinen kuvaus. Anna tarjouksen tehdä työ.",
      "Variantti 2: KUVAILEVA. Kohtausvetoinen. Maalaa koko kuva. Aistiyksityiskohtia läpi tekstin.",
      "Variantti 3: KESKUSTELEVA. Rento, suora. Kuin suositus joltakulta joka oli siellä viime viikolla.",
    ],
  ],
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface RotationSelections {
  framingAngle: string;
  openingHook: string;
  emphasisPattern: string;
  variantStrategy: string[];
}

/**
 * Produce deterministic rotation selections for a bar.
 * Same barId always returns the same selections — creating a recognizable
 * creative identity across promotions.
 */
export function getRotationSelections(
  barId: string,
  numVariants: number,
  language: "en" | "fi" = "en",
): RotationSelections {
  const hash = hashBarId(barId);

  const framingIdx = hash % FRAMING_ANGLES.en.length;
  const openingIdx = (hash >> 3) % OPENING_HOOKS.en.length;
  const emphasisIdx = (hash >> 6) % EMPHASIS_PATTERNS.en.length;
  const variantStrategyIdx = (hash >> 9) % VARIANT_DIFFERENTIATION.en.length;

  const variantStrategy = VARIANT_DIFFERENTIATION[language]
    ? VARIANT_DIFFERENTIATION[language][variantStrategyIdx].slice(0, numVariants)
    : VARIANT_DIFFERENTIATION.en[variantStrategyIdx].slice(0, numVariants);

  return {
    framingAngle: FRAMING_ANGLES[language]?.[framingIdx] ?? FRAMING_ANGLES.en[framingIdx],
    openingHook: OPENING_HOOKS[language]?.[openingIdx] ?? OPENING_HOOKS.en[openingIdx],
    emphasisPattern: EMPHASIS_PATTERNS[language]?.[emphasisIdx] ?? EMPHASIS_PATTERNS.en[emphasisIdx],
    variantStrategy,
  };
}

/**
 * Build the rotation block for injection into the prompt.
 */
export function buildRotationBlock(
  barId: string,
  numVariants: number,
  language: "en" | "fi" = "en",
): string {
  const r = getRotationSelections(barId, numVariants, language);

  const isFi = language === "fi";
  const header = isFi
    ? "LUOVAN LÄHESTYMISTAVAN OHJEET — tälle baarille ominainen tyyli:"
    : "CREATIVE APPROACH — this bar's signature style:";

  const variantHeader = isFi
    ? "VARIAATIOIDEN ERIYTYS — jokaisella variantilla on eri strategia:"
    : "VARIANT DIFFERENTIATION — each variant uses a different strategy:";

  const variants = r.variantStrategy
    .map((s, i) => `  ${s}`)
    .join("\n");

  return `\n\n${header}\n${r.framingAngle}\n${r.openingHook}\n${r.emphasisPattern}\n\n${variantHeader}\n${variants}`;
}
