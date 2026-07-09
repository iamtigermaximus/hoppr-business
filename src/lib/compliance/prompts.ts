// src/lib/compliance/prompts.ts
// ============================================================================
// AI PROMPT BUILDER — Generates compliance sections for LLM system prompts
// ============================================================================
//
// Every AI route that generates marketing content MUST use these functions
// to inject the canonical compliance rules. This ensures the AI always
// references the same rules from rules.ts — never its own training data.
//
// When rules change in rules.ts, all AI prompts update automatically.
// ============================================================================

import {
  COMPLIANCE_RULES,
  HIGH_SEVERITY_RULES,
  MEDIUM_SEVERITY_RULES,
  type ComplianceViolation,
} from "./rules";
import { getCitationHeader, getCitationsForViolations } from "./valvira-reference";

export type PromptLanguage = "en" | "fi";

/** Short genre-specific characteristics — tells the AI WHAT makes each format
 *  unique without giving it pre-written text to regurgitate. */
export const TEMPLATE_CHARACTERISTICS: Record<string, { en: string; fi: string }> = {
  "After-Work": {
    en: "weekday timing (16:00–19:00), professional crowd unwinding, transition from work to evening, relaxed decompression, first drink of the evening",
    fi: "arkipäivä (klo 16–19), ammattilaiset rentoutumassa, siirtymä työstä iltaan, rento tunnelma, illan ensimmäinen",
  },
  "Ladies Night": {
    en: "group-focused, social energy, curated for friend groups, welcoming atmosphere, drinks and conversation, girls' night out",
    fi: "ryhmille suunnattu, sosiaalinen energia, kuratoitu ystäväporukoille, tervetullut tunnelma, tyttöjen ilta",
  },
  "Live Music": {
    en: "live performance focus, performer + audience dynamic, music genre as identity, sound filling the room, stage presence",
    fi: "live-esiintyminen keskiössä, esiintyjän ja yleisön dynamiikka, musiikkigenre identiteettinä, ääni täyttää tilan",
  },
  "Game Night": {
    en: "competitive socializing, team play, trivia/board games/bingo, playful tension, prizes and bragging rights",
    fi: "kilpailuhenkinen seurustelu, joukkuepeli, tietovisa/lautapelit/bingo, leikkisä jännitys, palkinnot ja kerskumisoikeus",
  },
  "Food Special": {
    en: "culinary focus, craftsmanship and ingredients, food as the main event, drink pairings, dining experience",
    fi: "ruoka keskiössä, käsityö ja raaka-aineet, ruoka pääesiintyjänä, juomasuositukset, ruokailukokemus",
  },
  "VIP Experience": {
    en: "elevated service, exclusive access, premium treatment, behind-the-rope, different level of attention",
    fi: "kohotettu palvelu, eksklusiivinen pääsy, premium-kohtelu, köyden takana, eri huomion taso",
  },
  "Signature Evening": {
    en: "one-of-a-kind concept, unique to this venue, curated atmosphere, something you'd cross town for",
    fi: "ainutlaatuinen konsepti, uniikki tälle paikalle, kuratoitu tunnelma, jotain jonka takia matkustaa kaupungin halki",
  },
  "Theme Night": {
    en: "immersive transformation, dress code, shared reality, the bar becomes something else for one night, theatrical",
    fi: "uppouttava muutos, pukukoodi, jaettu todellisuus, baari muuttuu joksikin muuksi yhdeksi illaksi, teatterillinen",
  },
  "Naistenilta": {
    en: "group-focused, social energy, curated for friend groups, welcoming atmosphere, drinks and conversation, girls' night out",
    fi: "ryhmille suunnattu, sosiaalinen energia, kuratoitu ystäväporukoille, tervetullut tunnelma, tyttöjen ilta",
  },
  "Elävä musiikki": {
    en: "live performance focus, performer + audience dynamic, music genre as identity, sound filling the room, stage presence",
    fi: "live-esiintyminen keskiössä, esiintyjän ja yleisön dynamiikka, musiikkigenre identiteettinä, ääni täyttää tilan",
  },
  "Peli-ilta": {
    en: "competitive socializing, team play, trivia/board games/bingo, playful tension, prizes and bragging rights",
    fi: "kilpailuhenkinen seurustelu, joukkuepeli, tietovisa/lautapelit/bingo, leikkisä jännitys, palkinnot ja kerskumisoikeus",
  },
  "Ruokatarjous": {
    en: "culinary focus, craftsmanship and ingredients, food as the main event, drink pairings, dining experience",
    fi: "ruoka keskiössä, käsityö ja raaka-aineet, ruoka pääesiintyjänä, juomasuositukset, ruokailukokemus",
  },
  "VIP-kokemus": {
    en: "elevated service, exclusive access, premium treatment, behind-the-rope, different level of attention",
    fi: "kohotettu palvelu, eksklusiivinen pääsy, premium-kohtelu, köyden takana, eri huomion taso",
  },
  "Talon suositukset": {
    en: "one-of-a-kind concept, unique to this venue, curated atmosphere, something you'd cross town for",
    fi: "ainutlaatuinen konsepti, uniikki tälle paikalle, kuratoitu tunnelma, jotain jonka takia matkustaa kaupungin halki",
  },
  "Teemailta": {
    en: "immersive transformation, dress code, shared reality, the bar becomes something else for one night, theatrical",
    fi: "uppouttava muutos, pukukoodi, jaettu todellisuus, baari muuttuu joksikin muuksi yhdeksi illaksi, teatterillinen",
  },
};

// ---------------------------------------------------------------------------
// Finnish prohibited → approved translation maps for AI prompt injection
// ---------------------------------------------------------------------------

const FI_PROHIBITED_MAP: Record<string, string> = {
  "happy hour": "happy hour",
  "half price drinks": "puoleen hintaan juomat",
  "2 for 1": "2 yhden hinnalla",
  "buy one get one": "osta yksi saat toisen",
  "free drinks": "ilmaiset juomat",
  "complimentary drinks": "ilmaiset juomat",
  "drinks on the house": "talon tarjoamat juomat",
  "open bar": "avoin baari",
  "free flowing drinks": "vapaasti virtaavat juomat",
  "first drink free": "ensimmäinen juoma ilmaiseksi",
  "unlimited drinks": "rajattomasti juomia",
  "all you can drink": "juo niin paljon kuin haluat",
  "get wasted": "känniin / humalaan",
  "get drunk": "juovu / humallu",
  "drinking game": "juomapeli",
  "beer pong": "beer pong",
  "shot challenge": "shottihaaste",
  "student discount": "opiskelija-alennus",
  "student night": "opiskelijailta",
  "under 18": "alle 18",
  "win free drinks": "voita ilmaisia juomia",
  "alcohol prize draw": "alkoholiarpajaiset",
  "beer giveaway": "olutarjonta / olutarvonta",
  "vodka": "vodka",
  "whiskey": "viski",
  "whisky": "viski",
  "tequila": "tequila",
  "cognac": "konjakki",
  "brandy": "brandy",
  "schnapps": "snapsi",
  "healthy cocktail": "terveellinen cocktail",
  "low-calorie drink": "vähäkalorinen juoma",
  "detox drink": "detox-juoma",
  "share your drink photo": "jaa juomakuvasi",
  "tag us with your cocktail": "tägää meidät cocktailisi kanssa",
  "post your beer": "postaa oluesi",
  "get lucky": "saada seuraa",
  "get laid": "saada / pokata",
  "boost your confidence": "lisää itseluottamusta",
  "designated driver": "kuskille ilmainen",
  "park and drink": "pysäköi ja juo",
  "high ABV": "korkea alkoholipitoisuus",
  "extra strong": "extra vahva",
  "tipsy": "hiprakassa",
  "buzzed": "pienessä sievässä",
  "cheapest drinks": "halvimmat juomat",
  "lowest price": "alin hinta",
  "bucket of beer": "ämpäri olutta",
  "pitcher deal": "kannutarjous",
  "tower of drinks": "juomatorni",
};

const FI_APPROVED_MAP: Record<string, string> = {
  "After-work special": "After-work tarjous",
  "Evening pricing": "Illan hinnoittelu",
  "Featured selection": "Päivän valikoima",
  "House specials": "Talon erikoisuudet",
  "Signature serves": "Signature-annokset",
  "Daily selection": "Päivittäinen valikoima",
  "Evening menu": "Illan menu",
  "Generous pours": "Reilut annokset",
  "Extended service": "Pidennetty tarjoilu",
  "Curated drinks menu": "Kuratoitu juomalista",
  "Bar classics": "Baariklassikot",
  "Seasonal pours": "Kauden annokset",
  "Young adult offer (20+)": "Nuorten aikuisten tarjous (20+)",
  "Valid ID required": "Henkilöllisyystodistus vaaditaan",
  "Trivia night": "Tietovisailta",
  "Premium spirits": "Premium-viinat",
  "House pours": "Talon kaadot",
  "Signature cocktails": "Signature-cocktailit",
  "Refreshing blend": "Raikas sekoitus",
  "Great atmosphere": "Loistava tunnelma",
  "Social evening": "Illanvietto",
  "Near public transport": "Lähellä julkista liikennettä",
  "Bold flavor": "Rohkea maku",
  "Craft beer flight": "Käsityöolutmaistelu",
  "Tasting board": "Maistelulautanen",
};

// ---------------------------------------------------------------------------
// 1. Full Compliance System Prompt Section
//    Injected into the AI's system prompt for content generation routes
//    (suggest, ai-generate)
// ---------------------------------------------------------------------------

/**
 * Build the complete compliance section for AI system prompts.
 * Includes the actual law text, prohibited phrases, and approved alternatives
 * from every rule. This is the authoritative instruction set the AI must follow.
 *
 * Usage:
 *   const systemPrompt = `${basePrompt}\n\n${buildComplianceSystemPrompt("fi")}`;
 */
export function buildComplianceSystemPrompt(language: PromptLanguage = "en"): string {
  const highRules = HIGH_SEVERITY_RULES;
  const medRules = MEDIUM_SEVERITY_RULES;

  // Build the DO NOT list from all high+medium severity rules
  const doNotList = [...highRules, ...medRules]
    .flatMap((r) => r.prohibited)
    .map((p) => {
      if (language === "fi") return `- "${p}" / "${FI_PROHIBITED_MAP[p] || p}"`;
      return `- "${p}"`;
    })
    .join("\n");

  // Build the DO list from all rules
  const doList = COMPLIANCE_RULES.flatMap((r) => r.approved)
    .filter((v, i, a) => a.indexOf(v) === i) // dedupe
    .slice(0, 20) // keep it concise
    .map((a) => {
      if (language === "fi") return `- "${a}" / "${FI_APPROVED_MAP[a] || a}"`;
      return `- "${a}"`;
    })
    .join("\n");

  // Build a concise rule-by-rule summary with law references
  const ruleSummaries = COMPLIANCE_RULES.map((r) => {
    const severityLabel = r.severity === "high" ? "BLOCKED" : r.severity === "medium" ? "FLAGGED" : "ADVISORY";
    return `[${severityLabel}] ${r.name} (${r.lawReference}): ${r.suggestion.split(".")[0]}.`;
  }).join("\n");

  // Language-specific framing
  if (language === "fi") {
    return `
============================================================
SUOMEN ALKOHOLIMARKKINOINNIN SÄÄNNÖT — PAKOLLISET SÄÄNNÖT
============================================================

VIRANOMAISLÄHDE: ${getCitationHeader()}

Tuotoksesi tarkistetaan automaattisesti näitä sääntöjä vasten.
HIGH-tason rikkomukset ESTÄVÄT sisällön julkaisun.

LAINSÄÄDÄNTÖ: Alkoholilaki (1102/2017)
- §50(1): Yli 22% alkoholia sisältävien juomien markkinointi kuluttajille on kielletty
- §50(2): Mietojen (≤22%) alkoholijuomien markkinointi on sallittua rajoituksin
- §51: Alkoholijuomien hintailmoittelua koskevat rajoitukset

Alla olevat säännöt on poimittu Valviran ohjeesta.
Noudata niitä tarkasti — älä käytä omaa tulkintaasi.

════════════════════════════════════════════════════════════
KIELLETTY — ÄLÄ käytä näitä sanoja tai ilmauksia:
════════════════════════════════════════════════════════════
${doNotList}

════════════════════════════════════════════════════════════
SALLITTU — Käytä NÄITÄ sääntöjen mukaisia vaihtoehtoja:
════════════════════════════════════════════════════════════
${doList}

════════════════════════════════════════════════════════════
SÄÄNTÖYHTEENVETO — Pikaohje:
════════════════════════════════════════════════════════════
${ruleSummaries}

TÄRKEIMMÄT PERIAATTEET:
1. Keskity tunnelmaan, elämykseen, musiikkiin, ruokaan ja sosiaaliseen ympäristöön
2. Älä koskaan mainosta tilapäisiä alkoholin hinnanalennuksia tai ilmaista alkoholia
3. Älä koskaan käytä alaikäisiin vetoavaa kieltä — mainitse ikäraja 20+
4. Älä koskaan kannusta liialliseen kulutukseen tai humaltumiseen
5. Korvaa viinamerkit ilmauksilla "premium-viinat" tai "talon kaadot"
6. Suosi FOOD_SPECIAL-tarjouksia — ruokaan ei kohdistu alkoholimainonnan rajoituksia
7. Tapahtumissa: keskity viihteeseen (musiikki, pelit, tunnelma)
8. Kampanjoissa: keskity arvoon ja elämykseen, älä alkoholin hintaan tai määrään
9. Älä koskaan sisällytä alkoholiin liittyviä pelejä, kilpailuja tai arvontoja
10. Älä koskaan kannusta jakamaan alkoholisisältöä sosiaalisessa mediassa
============================================================`;
  }

  return `
============================================================
FINNISH ALCOHOL MARKETING COMPLIANCE — MANDATORY RULES
============================================================

AUTHORITATIVE SOURCE: ${getCitationHeader()}

Your output will be automatically scanned against these rules.
HIGH severity violations will BLOCK the content from being published.

REFERENCE LAW: Finnish Alcohol Act (1102/2017)
- §50(1): Strong alcohol (>22% ABV) marketing to consumers is prohibited
- §50(2): Mild alcohol (≤22% ABV) marketing is permitted with restrictions
- §51: Price advertising restrictions on alcoholic beverages

The rules below are extracted verbatim from the Valvira guideline.
Follow them exactly — do not substitute your own interpretation.

════════════════════════════════════════════════════════════
PROHIBITED — DO NOT use these words or phrases in titles or descriptions:
════════════════════════════════════════════════════════════
${doNotList}

════════════════════════════════════════════════════════════
APPROVED — USE these compliant alternatives instead:
════════════════════════════════════════════════════════════
${doList}

════════════════════════════════════════════════════════════
RULE SUMMARY — Quick reference:
════════════════════════════════════════════════════════════
${ruleSummaries}

KEY PRINCIPLES:
1. Focus on atmosphere, experience, music, food, and social environment
2. Never advertise temporary alcohol price reductions or free alcohol
3. Never use language targeting minors — specify age 20+ when relevant
4. Never encourage excessive consumption or intoxication
5. Replace spirit brand names with "premium spirits" or "house pours"
6. Prefer FOOD_SPECIAL promotions — food has no alcohol advertising restrictions
7. For events: focus on the entertainment (music, games, atmosphere)
8. For promotions: focus on value and experience, not alcohol price or quantity
9. Never include games, contests, or prize draws linked to alcohol
10. Never encourage sharing alcohol content on social media
============================================================`;
}

// ---------------------------------------------------------------------------
// 2. Short Compliance Reminder
//    Injected into user prompts to reinforce the rules
// ---------------------------------------------------------------------------

export function buildUserReminder(language: PromptLanguage = "en"): string {
  if (language === "fi") {
    return `
MUISTA — Alkoholilain vaatimukset:
- Ei tilapäisiä alkoholin hinnanalennuksia, ilmaisia juomia tai määräalennuksia
- Ei alaikäisiin vetoavaa kieltä — mainitse 20+ nuorten aikuisten tarjouksissa
- Ei liialliseen kulutukseen tai humaltumiseen kannustamista
- Ei viinamerkkejä — käytä "premium-viinat" tai "talon kaadot"
- Ei terveysväittämiä, sosiaalisen menestyksen lupauksia tai ajoneuvoyhteyksiä
- Ei alkoholiin liittyviä pelejä/kilpailuja, ei "jaa juomasi" -toimintakehotuksia
- Keskity tunnelmaan, elämykseen, ruokaan ja viihteeseen — älä alkoholiin`;
  }

  return `
REMEMBER — Finnish Alcohol Act compliance:
- No temporary alcohol price reductions, free drinks, or quantity discounts
- No targeting minors — specify 20+ for young adult offers
- No encouraging excessive consumption or intoxication
- No spirit brand names — use "premium spirits" or "house pours"
- No health claims, social success promises, or vehicle associations
- No games/contests with alcohol prizes, no "share your drink" CTAs
- Focus on atmosphere, experience, food, and entertainment — not alcohol`;
}

// ---------------------------------------------------------------------------
// 3. Compliance Fix Prompt
//    Used when the AI needs to generate compliant alternatives for
//    text that was already flagged by the scan engine.
// ---------------------------------------------------------------------------

/**
 * Build the prompt for the suggest-fix route.
 * Takes the flagged content and specific violations, generates
 * 2-3 compliant rewrites.
 */
export function buildFixPrompt(
  title: string,
  description: string,
  violations: ComplianceViolation[],
  contentType: string,
): string {
  // Build concise violation summary — what's wrong and what principle to fix
  const violationSummary = violations.map((v) => {
    return `- Issue: ${v.message}. Fix: ${v.suggestion}`;
  }).join("\n");

  return `You are rewriting Finnish bar marketing content to comply with alcohol advertising regulations.

CONTENT TYPE: ${contentType}
ORIGINAL TITLE: "${title}"
ORIGINAL DESCRIPTION: "${description || "(none)"}"

VIOLATIONS TO FIX:
${violationSummary}

Generate 2-3 alternative versions of the title and description that:
1. Preserve the original business intent and appeal
2. Fix each violation listed above — do NOT just swap synonyms
3. Sound natural, original, and appealing to Finnish bar-goers
4. Focus on atmosphere, experience, quality, and social setting — not price, quantity, or intoxication
5. Write fresh, creative copy — never copy-paste from examples

CRITICAL: Write authentic marketing copy, not legal-compliant filler. The goal is compelling text that happens to be compliant, not compliant text that sounds hollow.

Return ONLY a JSON array (no other text):
[{ "title": "...", "description": "...", "explanation": "..." }, ...]

Each "explanation" should briefly note what was changed and why.`;
}

// ---------------------------------------------------------------------------
// 4. Template Generation Prompt
//    Used by the AI generation route (promotions/ai-generate)
// ---------------------------------------------------------------------------

/**
 * Build the user prompt for the AI promotion generator.
 * Unlike the suggest route (which infers content type), this generates
 * a complete promotion for a known type.
 */
export function buildGeneratePrompt(
  barContext: {
    name: string;
    type: string;
    district?: string;
    cityName?: string;
    priceRange?: string;
    amenities?: string[];
    description?: string;
  },
  recentTitles: string[],
  userPrompt: string,
  type: string,
  template?: string,
  context?: string[],
  targetAudience?: string,
  language: PromptLanguage = "en",
  numVariants: number = 1,
  nonce: number = 0,
): string {
  const isFi = language === "fi";

  const recentList = recentTitles.length > 0
    ? (isFi
        ? `\nAiemmat tarjoukset (vältä samankaltaisia otsikoita/konsepteja):\n${recentTitles.map((t) => `- ${t}`).join("\n")}`
        : `\nRecent promotions (avoid similar titles/concepts):\n${recentTitles.map((t) => `- ${t}`).join("\n")}`)
    : "";

  const audienceLine = targetAudience
    ? (isFi ? `\nKohderyhmä: ${targetAudience}` : `\nTarget Audience: ${targetAudience}`)
    : "";

  // Compliance guardrails — condensed from the full rules in rules.ts.
  // Presented as creative BOUNDARIES, not a pick-list. The model must write
  // original content that fits within these lines; it must NOT copy phrases.
  const complianceReminder = isFi
    ? `\n\nSUOMEN ALKOHOLIMARKKINOINNIN RAJAT — luovat raamit, EI sanalista:\nKIELLETTY: tilapaiset hinnanalennukset (happy hour, 2 yhden hinnalla), ilmaiset juomat, yli 22% viinat (vodka, viski, tequila), alaikaisiin vetoava kieli, juomapelit/kilpailut, humalahakuinen kulutus, terveysvaitteet.\nSALLITTU TYYLI (esimerkkeja, ALA kopioi): \"After-work tarjous\", \"Illan menu\", \"Talon kaadot\", \"Signature-cocktailit\", \"Premium-valikoima\", \"Reilut annokset\", \"Kuratoitu juomalista\".\nPERIAATE: kirjoita omaperaisesti naiden raamien sisalla — keskity tunnelmaan, elamykseen, ruokaan, musiikkiin ja sosiaaliseen ymparistoon.`
    : `\n\nFINNISH ALCOHOL MARKETING BOUNDARIES — creative guardrails, NOT a word bank:\nPROHIBITED: temporary price cuts (happy hour, 2-for-1), free drinks, spirits over 22% ABV (vodka, whiskey, tequila), minor-targeting language, drinking games/contests, intoxication encouragement, health claims.\nCOMPLIANT STYLE (examples only — do NOT copy): \"After-work special\", \"Evening menu\", \"House pours\", \"Signature cocktails\", \"Premium selection\", \"Generous pours\", \"Curated drinks menu\".\nPRINCIPLE: write original content within these boundaries — focus on atmosphere, experience, food, music, and social environment.`;

  // Language-specific field labels for the JSON output schema
  const titleLabel = isFi ? "otsikko (max 60 merkkiä)" : "title (max 60 chars)";
  const descLabel = isFi ? "kuvaus (max 200 merkkiä)" : "description (max 200 chars)";
  const typeLabel = "HAPPY_HOUR | DRINK_SPECIAL | FOOD_SPECIAL | LADIES_NIGHT | THEME_NIGHT | VIP_OFFER | COVER_DISCOUNT | LIVE_MUSIC_EVENT | GAME_NIGHT | SEASONAL";
  const ctaLabel = isFi ? "toimintakehote" : "CTA text";
  const conditionsLabel = isFi ? "ehdot — vain sallittua sanamuotoa" : "conditions — compliant wording only";

  // Visual template descriptions in the user's language
  const templateDesc = isFi
    ? "'split' (kuva+teksti), 'centered' (otsikko keskiössä), 'card' (neliö, kuva edellä)"
    : "'split' (photo+text), 'centered' (headline focus), 'card' (square, photo-forward)";

  const moodDesc = isFi
    ? "'warm' (lämmin), 'cool' (viileä), 'vibrant' (eloisa), 'dark' (tumma), 'minimal' (pelkistetty)"
    : "'warm' (amber/purple), 'cool' (blue), 'vibrant' (orange/gold), 'dark' (deep purple), 'minimal' (gray)";

  // Multi-variant instruction
  const templates = ["split", "centered", "card"];
  const moods = ["warm", "cool", "vibrant", "dark", "minimal"];
  const variantsInstruction = numVariants > 1
    ? (isFi
        ? `\nLuo ${numVariants} TÄYSIN ERI vaihtoehtoa — JOKAINEN variantti ottaa ERI luovan kulman samaan tarjoukseen:\n` +
          `1. TARJOUSKULMA: keskity siihen MITÄ asiakas saa — hinta, arvo, konkreettinen etu.\n` +
          `2. TUNNELMAKULMA: keskity siihen MILTÄ TUNTUU — ilmapiiri, kokemus, aistit.\n` +
          `3. SOSIAALINEN KULMA: keskity KENEEN ja KEHEN KANSSA — porukka, yhteisö, jaettu hetki.\n` +
          `Jokaisella variantilla on ERI otsikko, ERI kuvaus, ERI sävy — ne eivät saa kuulostaa samalta.\n` +
          `ERI template: ${templates.slice(0, numVariants).join(", ")} (yksi per variantti, EI toistoa)\n` +
          `ERI mood: ${moods.slice(0, numVariants).join(", ")} (yksi per variantti, EI toistoa)\n` +
          `ERI accentColor per variantti. Palauta JSON-taulukkona.`
        : `\nGenerate ${numVariants} COMPLETELY DIFFERENT variants — EACH variant takes a DIFFERENT creative angle on the same promotion:\n` +
          `1. OFFER ANGLE: focus on WHAT the customer gets — the deal, the value, the concrete benefit.\n` +
          `2. VIBE ANGLE: focus on HOW IT FEELS — the atmosphere, the experience, the senses.\n` +
          `3. SOCIAL ANGLE: focus on WHO and WITH WHOM — the crowd, the community, the shared moment.\n` +
          `Each variant has a DIFFERENT title, DIFFERENT description, DIFFERENT voice — they must NOT sound the same.\n` +
          `DIFFERENT template: ${templates.slice(0, numVariants).join(", ")} (one per variant, NO repeats)\n` +
          `DIFFERENT mood: ${moods.slice(0, numVariants).join(", ")} (one per variant, NO repeats)\n` +
          `DIFFERENT accentColor per variant. Return as JSON array.`)
    : "";

  // Language-specific visual guidelines
  const visualGuidelines = isFi
    ? `VISUAALISET OHJEET:\n- 'split': parhaiten ruoka/juoma-tarjouksiin kun baarilla on kuvia\n- 'centered': parhaiten livemusiikkiin, teemailtoihin, esiintyjäilmoituksiin\n- 'card': parhaiten yleisiin tarjouksiin ja some-jakoon\n- accentColor: sovita tunnelmaan (lämpimät sävyt ruualle/kodikkuudelle, viileät musiikille, eloisat juhliin)\n- overlayOpacity: 0.3 kirkkaille kuville, 0.5 tummille kuville, 0.4 oletus`
    : `VISUAL GUIDELINES:\n- 'split': best for food/drink promos when the bar has photos\n- 'centered': best for live music events, theme nights, performer announcements\n- 'card': best for general promos and social media sharing\n- accentColor: match the mood (warm tones for food/cozy, cool tones for music, vibrant for parties)\n- overlayOpacity: 0.3 for bright photos, 0.5 for dark photos, 0.4 default`;

  // visualDirection field definition — shared across all output formats
  const visualDirectionSchemaFi = `"visualDirection": {\n    "description": "TARKKA, KONKREETTINEN visuaalinen kohtaus, joka perustuu STRICTLY käyttäjän pyyntöön ja baarin ainutlaatuiseen identiteettiin. ÄLÄ kirjoita geneeristä baarin sisustusta. Kiinnitä jokainen yksityiskohta käyttäjän sanoihin — jos mainitaan terassi auringonlaskussa, kuvaile juuri HEIDÄN terassiaan siinä valossa. Jokaisen variantin visualDirection on OLTAVA TÄYSIN ERI — vaihtele tunnelmaa, perspektiiviä, vuorokaudenaikaa ja tilan tuntua.",\n    "keyElements": ["3-5 tarkkaa visuaalista elementtiä — jokaisen on oltava jäljitettävissä käyttäjän pyyntöön tai baarin identiteettiin. Ei geneerisiä 'baarituoleja'."],\n    "styleNotes": "valokuvaustyyli, joka sopii juuri tähän kohtaukseen"\n  }`;
  const visualDirectionSchemaEn = `"visualDirection": {\n    "description": "A SPECIFIC, CONCRETE visual scene built STRICTLY from the user's request and the bar's unique identity. Do NOT write generic bar interiors. Anchor every detail in the user's own words — if they mention a terrace at sunset, describe THEIR terrace in that light. If they mention live music, describe the specific stage and performer. Every variant's visualDirection must be COMPLETELY DIFFERENT — vary the mood, perspective, time of day, and spatial feeling.",\n    "keyElements": ["3-5 specific visual elements — each must be traceable to the user's request or the bar's identity. No generic 'bar stools' or 'bottles'."],\n    "styleNotes": "photographic style that matches this specific scene (e.g. editorial, 35mm, golden hour, wide angle)"\n  }`;

  // Output format — fully bilingual
  const outputFormat = numVariants > 1
    ? (isFi
        ? `Palauta VAIN JSON-taulukko (ei muuta tekstiä):\n[\n  {\n    "title": "${titleLabel}",\n    "description": "${descLabel}",\n    "type": "${typeLabel}",\n    "discount": luku 0-100 tai null,\n    "callToAction": "${ctaLabel}",\n    "accentColor": "hex-väri",\n    "conditions": "${conditionsLabel} (max 150 merkkiä)",\n    "visual": { "template": "${templateDesc}", "mood": "${moodDesc}", "overlayOpacity": 0.2-0.7 },\n    ${visualDirectionSchemaFi}\n  },\n  ...\n]`
        : `Return ONLY a JSON array (no other text):\n[\n  {\n    "title": "${titleLabel}",\n    "description": "${descLabel}",\n    "type": "${typeLabel}",\n    "discount": number 0-100 or null,\n    "callToAction": "${ctaLabel}",\n    "accentColor": "hex color",\n    "conditions": "${conditionsLabel} (max 150 chars)",\n    "visual": { "template": "${templateDesc}", "mood": "${moodDesc}", "overlayOpacity": 0.2-0.7 },\n    ${visualDirectionSchemaEn}\n  },\n  ...\n]`)
    : (isFi
        ? `Palauta VAIN tämä JSON (ei muuta tekstiä):\n{\n  "title": "${titleLabel}",\n  "description": "${descLabel}",\n  "type": "${typeLabel}",\n  "discount": luku 0-100 tai null,\n  "callToAction": "${ctaLabel}",\n  "accentColor": "hex-väri",\n  "conditions": "${conditionsLabel} (max 150 merkkiä)",\n  "visual": { "template": "${templateDesc}", "mood": "${moodDesc}", "overlayOpacity": 0.2-0.7 },\n  ${visualDirectionSchemaFi}\n}`
        : `Return ONLY this exact JSON (no other text):\n{\n  "title": "${titleLabel}",\n  "description": "${descLabel}",\n  "type": "${typeLabel}",\n  "discount": number 0-100 or null,\n  "callToAction": "${ctaLabel}",\n  "accentColor": "hex color",\n  "conditions": "${conditionsLabel} (max 150 chars)",\n  "visual": { "template": "${templateDesc}", "mood": "${moodDesc}", "overlayOpacity": 0.2-0.7 },\n  ${visualDirectionSchemaEn}\n}`);

  // Build the user request from ingredients — dynamic, not hardcoded
  const contextTags = context && context.length > 0
    ? context.map((c) => `- ${c}`).join("\n")
    : "";
  const templateLine = template
    ? (() => {
        const chars = TEMPLATE_CHARACTERISTICS[template];
        const traits = chars
          ? (isFi ? chars.fi : chars.en)
          : null;
        return isFi
          ? `\nKampanjatyyppi: ${template}${traits ? ` — ominaispiirteet: ${traits}` : ""}. Käytä näitä luovana suuntana — älä kopioi valmista tekstiä. Kirjoita omaperäistä sisältöä juuri tälle baarille.`
          : `\nTemplate type: ${template}${traits ? ` — characteristics: ${traits}` : ""}. Use these as creative direction only — do NOT copy pre-written text. Write original content for this specific bar.`;
      })()
    : "";
  const userBriefLine = userPrompt
    ? (isFi
        ? `\nKäyttäjän kuvaus: ${userPrompt}`
        : `\nUser's brief: ${userPrompt}`)
    : "";
  const contextLine = contextTags
    ? (isFi
        ? `\nLisäkonteksti:\n${contextTags}`
        : `\nAdditional context:\n${contextTags}`)
    : "";
  const nonceLine = nonce > 0
    ? (isFi
        ? `\nVariaatioavain: ${nonce} — tuota TÄYSIN ERI sisältö kuin aiemmilla avaimilla.`
        : `\nVariation seed: ${nonce} — generate COMPLETELY DIFFERENT content than previous seeds.`)
    : "";

  const ingredientsBlock = isFi
    ? `${templateLine}${userBriefLine}${contextLine}${nonceLine}\n\nTÄRKEÄÄ — LUOVA OHJEISTUS:\nYhdistä yllä olevat ainekset ${numVariants} ainutlaatuiseksi ${type}-tyypin tarjoukseksi baarille "${barContext.name}".\n\nJOKAINEN variantti ammentaa eri asiasta:\n- Baarin ainutlaatuisista yksityiskohdista (${barContext.type} tyyli, ${barContext.district || "sijainti"}, ${barContext.priceRange || "hintataso"})\n- Valitusta äänensävystä ja kampanjatyypin ominaispiirteistä\n- Kontekstin ajankohtaisuudesta (kausi, vuorokaudenaika, säätila)\n\nKIELLETTY:\n- Geneeriset "liity meihin" / "tervetuloa" / "paras baari" -fraasit\n- Saman lauseen toistaminen eri varianteissa\n- Yleisluontoiset kuvaukset jotka sopisivat mihin tahansa baariin\n\nTEE NÄIN:\n- Mainitse KONKREETTISIA yksityiskohtia tästä baarista\n- Kirjoita niin kuin olisit itse paikalla — mitä näet, kuulet, tunnet\n- Jokainen variantti kuulostaa eri ihmisen kirjoittamalta`
    : `${templateLine}${userBriefLine}${contextLine}${nonceLine}\n\nCRITICAL — CREATIVE INSTRUCTION:\nCombine the ingredients above into ${numVariants} unique ${type} promotions for "${barContext.name}".\n\nEACH variant draws from different aspects:\n- The bar's unique details (${barContext.type} style, ${barContext.district || "location"}, ${barContext.priceRange || "price level"})\n- The chosen tone and template characteristics\n- The context's timeliness (season, time of day, weather)\n\nFORBIDDEN:\n- Generic "join us" / "welcome" / "best bar in town" filler\n- Repeating the same sentence across variants\n- Bland descriptions that could fit any bar anywhere\n\nDO THIS:\n- Mention SPECIFIC, CONCRETE details about THIS bar\n- Write as if you're standing in the room — what you see, hear, feel\n- Each variant sounds like a different person wrote it`;

  // Fully bilingual return
  // IMPORTANT: The creative instruction (ingredientsBlock) comes FIRST after bar context.
  // Compliance is a short footnote at the end — the full rules are in the system prompt.
  // This prevents compliance conservatism from collapsing all variants into near-identical text.
  return isFi
    ? `BAARIN TIEDOT:
- Nimi: ${barContext.name}
- Tyyppi: ${barContext.type}
- Sijainti: ${barContext.district || ""}, ${barContext.cityName || ""}
- Hintataso: ${barContext.priceRange || "Kohtalainen"}
- Palvelut: ${barContext.amenities?.join(", ") || "Vakiovarustelu"}
- Kuvaus: ${barContext.description || "Loistava paikka nauttia illasta"}${audienceLine}${recentList}

KÄYTTÄJÄN PYYNTÖ:
${ingredientsBlock}

TARKEAA — Kaikki sisalto TAYTYY olla SUOMEKSI. Jos tuotat englantia, tulos hylataan.

KAIKKI teksti TAYTYY olla suomeksi. Otsikko, kuvaus, toimintakehote ja ehdot — kaikki suomeksi.${variantsInstruction}

${outputFormat}

${visualGuidelines}${complianceReminder}`
    : `BAR CONTEXT:
- Name: ${barContext.name}
- Type: ${barContext.type}
- Location: ${barContext.district || ""}, ${barContext.cityName || ""}
- Price Range: ${barContext.priceRange || "Moderate"}
- Amenities: ${barContext.amenities?.join(", ") || "Standard bar amenities"}
- Description: ${barContext.description || "A great place to enjoy nightlife"}${audienceLine}${recentList}

USER REQUEST:
${ingredientsBlock}

IMPORTANT — All content MUST be in English. Do not output Finnish.${variantsInstruction}

${outputFormat}

${visualGuidelines}${complianceReminder}`;
}
