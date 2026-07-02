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

  // Language-specific output instruction
  const langInstruction = language === "fi"
    ? "KAIKKI teksti TÄYTYY olla suomeksi. Otsikko, kuvaus, toimintakehote ja ehdot — kaikki suomeksi."
    : language === "sv"
      ? "ALL text MUST be in Swedish. Title, description, CTA, and conditions — all in Swedish."
      : "All text MUST be in English.";

  // Multi-variant instruction
  const variantsInstruction = numVariants > 1
    ? `\nGenerate ${numVariants} DIFFERENT variants. Each must be unique: different angle, different type if appropriate, different title style, AND different visual design (template + mood + accentColor). No two variants should share the same visual template/mood combination. Return them as a JSON array.`
    : "";

  // Output format instruction
  const outputFormat = numVariants > 1
    ? `TASK: Generate ${numVariants} different promotion variants. Return ONLY a JSON array (no other text):\n[\n  {\n    "title": "Catchy, compliant title (max 60 chars)",\n    "description": "Compelling, compliant description (max 200 chars)",\n    "type": "One of: HAPPY_HOUR | DRINK_SPECIAL | FOOD_SPECIAL | LADIES_NIGHT | THEME_NIGHT | VIP_OFFER | COVER_DISCOUNT | LIVE_MUSIC_EVENT | GAME_NIGHT | SEASONAL",\n    "discount": number between 0-100 or null,\n    "callToAction": "CTA text",\n    "accentColor": "Hex color matching the mood",\n    "conditions": "Terms — compliant wording only (max 150 chars)",\n    "visual": { "template": "'split' | 'centered' | 'card'", "mood": "'warm' | 'cool' | 'vibrant' | 'dark' | 'minimal'", "overlayOpacity": 0.2-0.7 }\n  },\n  ...\n]`
    : `TASK: Generate a promotion with this exact JSON structure (no extra text):\n{\n  "title": "Catchy, Finland-compliant title (max 60 chars)",\n  "description": "Compelling, compliant description (max 200 chars)",\n  "type": "One of: HAPPY_HOUR | DRINK_SPECIAL | FOOD_SPECIAL | LADIES_NIGHT | THEME_NIGHT | VIP_OFFER | COVER_DISCOUNT | LIVE_MUSIC_EVENT | GAME_NIGHT | SEASONAL",\n  "discount": number between 0-100 or null,\n  "callToAction": "CTA text like 'View Menu', 'Join Us', 'Book Now'",\n  "accentColor": "Hex color code matching the promotion mood (e.g., #8b5cf6 for purple, #f59e0b for amber, #10b981 for green)",\n  "conditions": "Terms — compliant wording only (max 150 chars)",\n  "visual": {\n    "template": "Which image layout fits: 'split' (photo+text), 'centered' (bold event style), or 'card' (square feed format)",\n    "mood": "Color mood: 'warm' (purple/amber), 'cool' (blue), 'vibrant' (orange/gold), 'dark' (deep purple), or 'minimal' (gray)",\n    "overlayOpacity": number between 0.2 and 0.7 — how dark the photo overlay should be\n  }\n}`;

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

LANGUAGE: ${langInstruction}${variantsInstruction}

${outputFormat}

TASK: Generate a promotion with this exact JSON structure (no extra text):
{
  "title": "Catchy, Finland-compliant title (max 60 chars)",
  "description": "Compelling, compliant description (max 200 chars)",
  "type": "One of: HAPPY_HOUR | DRINK_SPECIAL | FOOD_SPECIAL | LADIES_NIGHT | THEME_NIGHT | VIP_OFFER | COVER_DISCOUNT | LIVE_MUSIC_EVENT | GAME_NIGHT",
  "discount": number between 0-100 or null,
  "callToAction": "CTA text like 'View Menu', 'Join Us', 'Book Now'",
  "accentColor": "Hex color code matching the promotion mood (e.g., #8b5cf6 for purple, #f59e0b for amber, #10b981 for green)",
  "conditions": "Terms — compliant wording only (max 150 chars)",
  "visual": {
    "template": "Which image layout fits: 'split' (photo+text), 'centered' (bold event style), or 'card' (square feed format)",
    "mood": "Color mood: 'warm' (purple/amber), 'cool' (blue), 'vibrant' (orange/gold), 'dark' (deep purple), or 'minimal' (gray)",
    "overlayOpacity": number between 0.2 and 0.7 — how dark the photo overlay should be
  }
}

VISUAL GUIDELINES:
- 'split' template: best for food/drink promos when the bar has photos
- 'centered' template: best for live music events, theme nights, performer announcements
- 'card' template: best for general promos and social media sharing
- Pick accentColor to match the mood (warm tones for food/cozy, cool tones for music, vibrant for parties)
- overlayOpacity: 0.3 for bright photos, 0.5 for dark photos, 0.4 default

All text MUST comply with Finnish alcohol marketing rules above.
Title and description will be scanned and blocked if non-compliant.`;
}
