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

export type PromptLanguage = "en" | "fi" | "sv";

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

const SV_PROHIBITED_MAP: Record<string, string> = {
  "happy hour": "happy hour",
  "free drinks": "gratis drinkar",
  "2 for 1": "2 för 1",
  "buy one get one": "köp en få en",
  "unlimited drinks": "obegränsat med drinkar",
  "get wasted": "bli full / berusad",
  "get drunk": "bli full",
  "student discount": "studentrabatt",
  "vodka": "vodka",
  "whiskey": "whiskey",
  "tequila": "tequila",
};

const SV_APPROVED_MAP: Record<string, string> = {
  "After-work special": "After-work-erbjudande",
  "Featured selection": "Utvalda drycker",
  "House specials": "Husets specialiteter",
  "Signature cocktails": "Signature-cocktails",
  "Great atmosphere": "Härlig atmosfär",
  "Premium spirits": "Premium-sprit",
  "Young adult offer (20+)": "Unga vuxna (20+)",
  "Tasting board": "Smakprovsbricka",
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
      if (language === "sv") return `- "${p}" / "${SV_PROHIBITED_MAP[p] || p}"`;
      return `- "${p}"`;
    })
    .join("\n");

  // Build the DO list from all rules
  const doList = COMPLIANCE_RULES.flatMap((r) => r.approved)
    .filter((v, i, a) => a.indexOf(v) === i) // dedupe
    .slice(0, 20) // keep it concise
    .map((a) => {
      if (language === "fi") return `- "${a}" / "${FI_APPROVED_MAP[a] || a}"`;
      if (language === "sv") return `- "${a}" / "${SV_APPROVED_MAP[a] || a}"`;
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

  if (language === "sv") {
    return `
============================================================
FINLÄNDSK ALKOHOLMARKNADSFÖRING — OBLIGATORISKA REGLER
============================================================

KÄLLA: ${getCitationHeader()}

Din text kontrolleras automatiskt mot dessa regler.
HIGH-överträdelser BLOCKERAR publicering.

LAGSTIFTNING: Alkohollagen (1102/2017)
- §50(1): Marknadsföring av stark alkohol (>22%) till konsumenter är förbjuden
- §50(2): Marknadsföring av milda drycker (≤22%) är tillåten med restriktioner
- §51: Restriktioner för prisannonsering av alkoholdrycker

════════════════════════════════════════════════════════════
FÖRBJUDET — ANVÄND INTE dessa ord eller fraser:
════════════════════════════════════════════════════════════
${doNotList}

════════════════════════════════════════════════════════════
TILLÅTET — ANVÄND dessa godkända alternativ:
════════════════════════════════════════════════════════════
${doList}

VIKTIGASTE PRINCIPERNA:
1. Fokusera på atmosfär, upplevelse, musik, mat och social miljö
2. Marknadsför aldrig tillfälliga alkoholprissänkningar eller gratis alkohol
3. Använd aldrig språk som riktar sig till minderåriga — ange 20+ när relevant
4. Uppmuntra aldrig överdriven konsumtion eller berusning
5. Ersätt spritmärken med "premium-sprit" eller "husets drinkar"
6. Prioritera FOOD_SPECIAL-erbjudanden — mat har inga alkoholreklambegränsningar
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

  if (language === "sv") {
    return `
KOM IHÅG — Alkohollagens krav:
- Inga tillfälliga alkoholprissänkningar, gratis drinkar eller kvantitetsrabatter
- Inget språk som riktar sig till minderåriga — ange 20+
- Ingen uppmuntran till överdriven konsumtion eller berusning
- Inga spritmärken — använd "premium-sprit" eller "husets drinkar"
- Inga hälsopåståenden, löften om social framgång eller fordonsassociationer
- Fokusera på atmosfär, upplevelse, mat och underhållning — inte alkohol`;
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
  // Re-fetch the rule definitions for the violations that were triggered
  const violatedRuleIds = new Set(violations.map((v) => v.rule));
  const triggeredRules = COMPLIANCE_RULES.filter((r) => violatedRuleIds.has(r.id));

  // Build detailed violation info with law references AND Valvira citations
  const violationDetails = triggeredRules.map((rule) => {
    const v = violations.find((x) => x.rule === rule.id)!;
    const sectionRef = rule.valviraSection
      ? ` (Valvira Ch.${rule.valviraSection.chapter}, pp. ${rule.valviraSection.pages})`
      : "";
    return [
      `Rule: ${rule.name}${sectionRef}`,
      `Law: ${rule.lawReference}`,
      `Triggered by: "${v.keyword}"`,
      `Why: ${v.message}`,
      `Fix: ${rule.suggestion}`,
      rule.examples.length > 0
        ? `Example: "${rule.examples[0].violation}" → "${rule.examples[0].fix}"`
        : null,
    ].filter(Boolean).join("\n  ");
  }).join("\n\n  ");

  // Get Valvira section citations for all violated rules
  const valviraCitations = getCitationsForViolations(
    violations.map((v) => v.rule),
  );

  // Collect DO NOT and DO from the triggered rules
  const prohibited = triggeredRules.flatMap((r) => r.prohibited);
  const approved = triggeredRules.flatMap((r) => r.approved);

  return `You are correcting marketing content to comply with Finnish alcohol
marketing law. Reference the authoritative source:
${getCitationHeader()}

CONTENT TYPE: ${contentType}
ORIGINAL TITLE: "${title}"
ORIGINAL DESCRIPTION: "${description || "(none)"}"

VIOLATIONS DETECTED (with Valvira guideline references):
  ${violationDetails}

RELEVANT VALVIRA GUIDELINE SECTIONS:
${valviraCitations}

PROHIBITED PHRASES TO AVOID:
  ${prohibited.map((p) => `- "${p}"`).join("\n  ")}

USE THESE ALTERNATIVES INSTEAD:
  ${approved.map((a) => `- "${a}"`).join("\n  ")}

Generate 2-3 alternative versions of the title and description that:
1. Preserve the original business intent and appeal
2. Remove ALL prohibited language identified above
3. Use only compliant alternatives from the approved list
4. Sound natural and appealing to Finnish bar-goers
5. Focus on atmosphere, experience, and quality — not price or quantity
6. Must pass a re-scan against the compliance engine

Return ONLY a JSON array (no other text):
[{ "title": "...", "description": "...", "explanation": "..." }, ...]

Each "explanation" should briefly note which rule was addressed.`;
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
  targetAudience?: string,
  language: PromptLanguage = "en",
  numVariants: number = 1,
): string {
  const recentList = recentTitles.length > 0
    ? `\nRecent promotions (avoid similar titles/concepts):\n${recentTitles.map((t) => `- ${t}`).join("\n")}`
    : "";

  const audienceLine = targetAudience ? `\nTarget Audience: ${targetAudience}` : "";

  const complianceSection = buildComplianceSystemPrompt(language);

  // Language-specific output instruction — placed prominently
  const isFi = language === "fi";
  const isSv = language === "sv";

  const langInstruction = isFi
    ? "KAIKKI teksti TÄYTYY olla suomeksi. Otsikko, kuvaus, toimintakehote ja ehdot — kaikki suomeksi."
    : isSv
      ? "ALL text MUST be in Swedish. Title, description, CTA, and conditions — all in Swedish."
      : "All text MUST be in English.";

  // Language-specific field labels for the JSON output schema
  const titleLabel = isFi ? "otsikko (max 60 merkkiä)" : isSv ? "titel (max 60 tecken)" : "title (max 60 chars)";
  const descLabel = isFi ? "kuvaus (max 200 merkkiä)" : isSv ? "beskrivning (max 200 tecken)" : "description (max 200 chars)";
  const typeLabel = "HAPPY_HOUR | DRINK_SPECIAL | FOOD_SPECIAL | LADIES_NIGHT | THEME_NIGHT | VIP_OFFER | COVER_DISCOUNT | LIVE_MUSIC_EVENT | GAME_NIGHT | SEASONAL";
  const ctaLabel = isFi ? "toimintakehote" : isSv ? "call-to-action" : "CTA text";
  const conditionsLabel = isFi ? "ehdot — vain sallittua sanamuotoa" : isSv ? "villkor — endast tillåten formulering" : "conditions — compliant wording only";

  // Visual template descriptions in the user's language
  const templateDesc = isFi
    ? "'split' (kuva+teksti), 'centered' (otsikko keskiössä), 'card' (neliö, kuva edellä)"
    : isSv
      ? "'split' (bild+text), 'centered' (rubrik i fokus), 'card' (kvadratiskt, bild först)"
      : "'split' (photo+text), 'centered' (headline focus), 'card' (square, photo-forward)";

  const moodDesc = isFi
    ? "'warm' (lämmin), 'cool' (viileä), 'vibrant' (eloisa), 'dark' (tumma), 'minimal' (pelkistetty)"
    : isSv
      ? "'warm' (varm), 'cool' (sval), 'vibrant' (livlig), 'dark' (mörk), 'minimal' (avskalad)"
      : "'warm' (amber/purple), 'cool' (blue), 'vibrant' (orange/gold), 'dark' (deep purple), 'minimal' (gray)";

  // Multi-variant instruction
  const variantsInstruction = numVariants > 1
    ? (isFi
        ? `\nLuo ${numVariants} ERI vaihtoehtoa. Jokaisen on oltava ainutlaatuinen: eri näkökulma, tarvittaessa eri tyyppi, eri otsikkotyyli, JA eri visuaalinen ilme (template + mood + accentColor). Kahdella vaihtoehdolla ei saa olla samaa template/mood-yhdistelmää. Palauta JSON-taulukkona.`
        : isSv
          ? `\nSkapa ${numVariants} OLIKA varianter. Varje måste vara unik: olika vinkel, annan typ vid behov, olika rubrikstil, OCH olika visuell stil (template + mood + accentColor). Inga två varianter får dela samma template/mood-kombination. Returnera som JSON-array.`
          : `\nGenerate ${numVariants} DIFFERENT variants. Each must be unique: different angle, different type if appropriate, different title style, AND different visual design (template + mood + accentColor). No two variants should share the same visual template/mood combination. Return them as a JSON array.`)
    : "";

  // Language-specific visual guidelines
  const visualGuidelines = isFi
    ? `VISUAALISET OHJEET:\n- 'split': parhaiten ruoka/juoma-tarjouksiin kun baarilla on kuvia\n- 'centered': parhaiten livemusiikkiin, teemailtoihin, esiintyjäilmoituksiin\n- 'card': parhaiten yleisiin tarjouksiin ja some-jakoon\n- accentColor: sovita tunnelmaan (lämpimät sävyt ruualle/kodikkuudelle, viileät musiikille, eloisat juhliin)\n- overlayOpacity: 0.3 kirkkaille kuville, 0.5 tummille kuville, 0.4 oletus`
    : isSv
      ? `VISUELLA RIKTLINJER:\n- 'split': bäst för mat/dryck-erbjudanden när baren har bilder\n- 'centered': bäst för livemusik, temakvällar, artistmeddelanden\n- 'card': bäst för allmänna erbjudanden och sociala medier\n- accentColor: matcha stämningen (varma toner för mat/mysigt, svala för musik, livliga för fester)\n- overlayOpacity: 0.3 för ljusa bilder, 0.5 för mörka bilder, 0.4 standard`
      : `VISUAL GUIDELINES:\n- 'split': best for food/drink promos when the bar has photos\n- 'centered': best for live music events, theme nights, performer announcements\n- 'card': best for general promos and social media sharing\n- accentColor: match the mood (warm tones for food/cozy, cool tones for music, vibrant for parties)\n- overlayOpacity: 0.3 for bright photos, 0.5 for dark photos, 0.4 default`;

  // Single unified output format — respects language for field descriptions
  const outputFormat = numVariants > 1
    ? `Return ONLY a JSON array (no other text):\n[\n  {\n    "title": "${titleLabel}",\n    "description": "${descLabel}",\n    "type": "${typeLabel}",\n    "discount": number 0-100 or null,\n    "callToAction": "${ctaLabel}",\n    "accentColor": "hex color",\n    "conditions": "${conditionsLabel} (max 150 chars)",\n    "visual": { "template": "${templateDesc}", "mood": "${moodDesc}", "overlayOpacity": 0.2-0.7 }\n  },\n  ...\n]`
    : `Return ONLY this exact JSON (no other text):\n{\n  "title": "${titleLabel}",\n  "description": "${descLabel}",\n  "type": "${typeLabel}",\n  "discount": number 0-100 or null,\n  "callToAction": "${ctaLabel}",\n  "accentColor": "hex color",\n  "conditions": "${conditionsLabel} (max 150 chars)",\n  "visual": { "template": "${templateDesc}", "mood": "${moodDesc}", "overlayOpacity": 0.2-0.7 }\n}`;

  return `${complianceSection}

BAR CONTEXT:
- Name: ${barContext.name}
- Type: ${barContext.type}
- Location: ${barContext.district || ""}, ${barContext.cityName || ""}
- Price Range: ${barContext.priceRange || "Moderate"}
- Amenities: ${barContext.amenities?.join(", ") || "Standard bar amenities"}
- Description: ${barContext.description || "A great place to enjoy nightlife"}${audienceLine}${recentList}

USER REQUEST:
${userPrompt || `Create a ${type} promotion for this bar.`}

${isFi
  ? "TÄRKEÄÄ — Kaikki alla oleva sisältö on tuotettava SUOMEKSI. Jos tuotat englantia tai ruotsia, tulos hylätään."
  : isSv
    ? "VIKTIGT — Allt innehåll nedan måste produceras på SVENSKA. Om du producerar engelska eller finska kommer resultatet att avvisas."
    : "IMPORTANT — All content below MUST be in English. Do not output Finnish or Swedish."}

${langInstruction}${variantsInstruction}

${outputFormat}

${visualGuidelines}

All text MUST comply with Finnish alcohol marketing rules above.
Title and description will be scanned and blocked if non-compliant.`;
}
