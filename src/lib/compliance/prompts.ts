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
import { buildPersonaBlock, type BarPositioning } from "./persona";
import { getTonePromptBlock, type ContentTone } from "../prompts/tone-voices";
import { getTemplateVoiceBlock, getBlendInstruction } from "../prompts/template-voices";
import { getSynergyInstructions } from "../prompts/synergy-rules";
import { buildRotationBlock } from "../prompts/prompt-rotation";
import { buildBarHooksBlock, type BarHookContext } from "../prompts/bar-hooks";

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

  // ---- New tone-adaptive template IDs (from promotion-templates.ts) ----
  // UNIVERSAL
  "after-work": {
    en: "weekday transition from work to evening, decompression, first drink, atmosphere over specifics, time-anchored (16:00–19:00)",
    fi: "siirtymä arkipäivästä iltaan, rentoutuminen, tunnelma edellä, aika-ankkuroitu (klo 16–19)",
  },
  "weekend-special": {
    en: "Friday/Saturday peak energy, full room, weekend atmosphere, positive but measured, city nightlife",
    fi: "perjantai/lauantai huippuenergia, täysi huone, viikonlopputunnelma, positiivinen mutta hillitty",
  },
  "seasonal-special": {
    en: "limited-time seasonal offering, weather-dependent, timely relevance, terrace/glögi/fresh flavors, natural scarcity",
    fi: "rajoitetun ajan kausitarjonta, sääriippuvainen, ajankohtainen, terassi/glögi/tuoreet maut, luonnollinen niukkuus",
  },
  "regulars-night": {
    en: "loyalty appreciation, familiar faces, genuine thank-you, community over commerce, the bar as third place",
    fi: "kanta-asiakkaiden arvostus, tutut kasvot, aito kiitos, yhteisö ennen kauppaa, baari kolmantena paikkana",
  },

  // SOCIAL
  "quiz-night": {
    en: "team trivia, friendly competition, brain-teasing fun, weekly ritual, strangers becoming teammates, host-led",
    fi: "joukkuevisa, ystävällinen kilpailu, viikoittainen rituaali, tuntemattomista joukkuetovereita, juontajan johtama",
  },
  "karaoke-night": {
    en: "open microphone, audience as entertainment, courage and surprise talent, shared singing joy, stage for everyone",
    fi: "avoin mikki, yleisö viihteenä, rohkeus ja yllätyslahjakkuus, jaettu laulamisen ilo, lava kaikille",
  },
  "group-celebration": {
    en: "birthdays/reunions/promotions, reserved tables, shared platters, hosts can relax, occasion-first, group-friendly",
    fi: "syntymäpäivät/tapaamiset/ylennykset, varatut pöydät, jaetut tarjoilut, isännätkin nauttivat, tilaisuus edellä",
  },
  "industry-night": {
    en: "hospitality workers' night off, industry discounts, familiar faces, community-building, on the other side of the bar",
    fi: "ravintola-alan työntekijöiden vapaa ilta, alennukset, tutut kasvot, yhteisön rakentaminen, baarin toisella puolella",
  },

  // FOOD
  "tasting-menu": {
    en: "guided tasting, kitchen+bar collaboration, curated progression, limited seats, sensory journey, food as primary focus",
    fi: "opastettu maistelu, keittiö+baari yhteistyö, kuratoitu eteneminen, rajoitetut paikat, aistimatka, ruoka pääosassa",
  },
  "food-drink-pairing": {
    en: "dish and drink partners, flavor interplay, craft focus, complementary pairing, food leads drink follows",
    fi: "annos ja juoma kumppaneina, makujen vuorovaikutus, käsityö keskiössä, täydentävä yhdistelmä, ruoka johtaa juoma seuraa",
  },
  "chefs-special": {
    en: "kitchen showing off, seasonal ingredients, bold technique, limited-time dish, food-first, culinary showcase",
    fi: "keittiö näyttää osaamistaan, kausiraaka-aineet, rohkea tekniikka, rajoitetun ajan annos, ruoka edellä, kulinaarinen näyteikkuna",
  },
  "brunch-service": {
    en: "daytime bar, different energy, daylight ambience, coffee and pastries, weekend mornings, slower pace, food-dominant",
    fi: "päiväbaari, eri energia, päivänvalotunnelma, kahvia ja leivonnaisia, viikonloppuaamut, hitaampi tahti, ruokapainotteinen",
  },

  // ENTERTAINMENT
  "live-music": {
    en: "performer-first, live sound, stage presence, genre identity, audience+artist dynamic, music as the headline, venue as backdrop",
    fi: "esiintyjä ensin, live-ääni, lavaläsnäolo, genreidentiteetti, yleisö+artisti-dynamiikka, musiikki otsikkona, tila taustana",
  },
  "dj-night": {
    en: "DJ controls the room, beats and rhythm, dance floor energy, late-night build, sound journey, music-driven not drink-driven",
    fi: "DJ hallitsee tilaa, biitit ja rytmi, tanssilattiaenergia, myöhäisillan nousu, äänimatka, musiikkivetoinen ei juomavetoinen",
  },
  "sports-screening": {
    en: "big game on big screen, collective tension, shared cheers, match-day energy, sports is the focus, drinks as refreshment",
    fi: "iso peli isolla ruudulla, kollektiivinen jännitys, jaetut hurraukset, pelipäivän energia, urheilu fokuksena, juomat virvokkeina",
  },
  "open-mic": {
    en: "raw talent showcase, supportive crowd, unexpected moments, platform for new voices, performers first, bar as venue",
    fi: "raaka lahjakkuus esillä, kannustava yleisö, odottamattomat hetket, alusta uusille äänille, esiintyjät ensin, baari tapahtumapaikkana",
  },

  // PREMIUM
  "cocktail-masterclass": {
    en: "behind the bar, hands-on learning, craft and technique, educational focus, limited spots, knowledge over consumption",
    fi: "baarin takana, käytännön oppiminen, käsityö ja tekniikka, opetuksellinen fokus, rajoitetut paikat, tieto ennen kulutusta",
  },
  "meet-the-maker": {
    en: "distiller/brewer/winemaker present, knowledge sharing, tasting with context, cultural experience, craft stories, educational",
    fi: "tislaaja/panija/viinintekijä paikalla, tiedon jakaminen, maistelu kontekstilla, kulttuurikokemus, käsityötarinat, opetuksellinen",
  },
  "private-tasting": {
    en: "small group, rare bottles, guided exploration, curated journey, intimate setting, depth over volume, water and palate cleansers",
    fi: "pieni ryhmä, harvinaiset pullot, opastettu tutkimus, kuratoitu matka, intiimi ympäristö, syvyys ennen määrää, vesi ja makupuhdistajat",
  },
  "rare-release": {
    en: "limited-release product, single-barrel/small-batch, fleeting opportunity, product rarity, tasting portions moderate, scarcity as fact",
    fi: "rajoitettu erä, harvinainen tuote, hetkellinen tilaisuus, tuotteen harvinaisuus, maltilliset maisteluannokset, niukkuus faktana",
  },

  // COMMUNITY
  "neighbourhood-night": {
    en: "local gathering, third place, bartender knows your order, community over consumption, neighbourhood celebration, unpretentious",
    fi: "lähibaari-kokoontuminen, kolmas paikka, baarimikko tuntee tilauksesi, yhteisö ennen kulutusta, naapuruston juhla, vaatimaton",
  },
  "local-artist": {
    en: "walls become gallery, local artist showcase, rotating exhibitions, art-first messaging, bar as creative platform, opening night centers artist",
    fi: "seinät galleriana, paikallistaiteilijan esittely, vaihtuvat näyttelyt, taide edellä -viestintä, baari luovana alustana, avajaiset keskittyvät taiteilijaan",
  },
  "charity-fundraiser": {
    en: "bar gives back, portion of sales to local cause, transparent donation mechanism, cause-first messaging, community impact",
    fi: "baari antaa takaisin, osa myynnistä paikalliseen kohteeseen, läpinäkyvä lahjoitusmekanismi, kohde edellä -viestintä, yhteisövaikutus",
  },
  "new-in-town": {
    en: "newcomer welcome, no cliques, inclusive social space, first semester/posting, belonging, non-alcoholic options included, warm and open",
    fi: "uusien tulokkaiden tervetulotoivotus, ei kuppikuntia, inklusiivinen sosiaalinen tila, ensimmäinen lukukausi/työpaikka, kuuluvuus, alkoholittomat vaihtoehdot mukana, lämmin ja avoin",
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

  // Build compound proximity warnings from all rules
  const compoundWarnings = COMPLIANCE_RULES
    .filter((r) => r.compoundTerms && r.compoundTerms.length > 0)
    .flatMap((r) => r.compoundTerms!.map((c) => ({
      en: c.messageEn,
      fi: c.messageFi,
    })))
    .filter((v, i, a) => a.findIndex((x) => x.en === v.en) === i)
    .map((c) => {
      if (language === "fi") return `- ${c.fi}`;
      return `- ${c.en}`;
    })
    .join("\n");

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

════════════════════════════════════════════════════════════
YHDISTELMÄVAROITUKSET — Nämä yhdistelmät laukaisevat rikkomuksen:
════════════════════════════════════════════════════════════
${compoundWarnings}

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

════════════════════════════════════════════════════════════
COMPOUND WARNINGS — These word combinations trigger violations:
════════════════════════════════════════════════════════════
${compoundWarnings}

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
// 1b. Full System Prompt — Persona + Compliance
//     Combines the Senior Marketing Operations persona with compliance rules.
//     Use this for ALL generation routes (ai-generate, suggest, suggest-fix).
// ---------------------------------------------------------------------------

/**
 * Build the complete system prompt with senior marketing persona AND
 * compliance rules. This is the primary function for all AI generation routes.
 */
export function buildFullSystemPrompt(
  language: PromptLanguage = "en",
  bar?: BarPositioning | null,
): string {
  const persona = buildPersonaBlock(language, bar);
  const compliance = buildComplianceSystemPrompt(language);
  return `${persona}\n\n${compliance}`;
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
    musicTags?: string[];
  },
  barId: string,
  recentTitles: string[],
  userPrompt: string,
  type: string,
  template?: string,
  tone?: ContentTone | null,
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
    ? `\n\nSUOMEN ALKOHOLILAIN VAATIMUKSET — sisältösi HYLÄTÄÄN jos rikot näitä:\nEHDOTTOMASTI KIELLETTY: tilapäiset hinnanalennukset (happy hour, 2 yhden hinnalla), ilmaiset juomat, yli 22% viinat (vodka, viski, tequila), alaikäisiin vetoava kieli, juomapelit/kilpailut, humalahakuinen kulutus, terveysväittämät, alkoholin juomisen kuvaileminen ("ensimmäinen siemaus", "lasillinen X:ää").\nSALLITTU LÄHESTYMISTAPA: keskity tunnelmaan, ruokaan, musiikkiin, seuraan ja ympäristöön. Kuvaile MILTÄ TUNTUU olla paikalla — älä MITÄ JUODAAN. Alkoholi on osa ympäristöä, ei tarinan päähenkilö.\nTÄRKEIN SÄÄNTÖ: Jos tekstissäsi kuvaillaan alkoholin juomista, se rikkoo lakia. Kirjoita niin että juoma voisi olla mitä tahansa — kahvia, mocktailia, vichyä. Se mikä tekee illasta erityisen on TUNNELMA ja SEURA, ei alkoholi.`
    : `\n\nFINNISH ALCOHOL ACT REQUIREMENTS — your content WILL be rejected if it violates these:\nABSOLUTELY PROHIBITED: temporary price cuts (happy hour, 2-for-1), free drinks, spirits over 22% ABV (vodka, whiskey, tequila), minor-targeting language, drinking games/contests, intoxication encouragement, health claims, describing the act of drinking ("first sip of...", "a glass of...").\nALLOWED APPROACH: focus on atmosphere, food, music, company, and environment. Describe HOW IT FEELS to be there — not WHAT PEOPLE DRINK. Alcohol is part of the setting, not the protagonist of the story.\nMOST IMPORTANT RULE: If your text describes drinking alcohol, it's a violation. Write so the drink could be anything — coffee, mocktail, sparkling water. What makes the night special is the ATMOSPHERE and COMPANY, not the alcohol.`;

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
  const visualDirectionSchemaFi = `"visualDirection": {\n    "description": "TARKKA, KONKREETTINEN visuaalinen kohtaus. TÄRKEIN SÄÄNTÖ: jos tarjous liittyy juhlaan, vuodenaikaan tai teemaan (joulu, juhannus, halloween, ystävänpäivä, vappu, kesäterassi, teemailta), kuvauksen ON KESKITYTTÄVÄ siihen teemaan — baarin sisustus on VAIN tausta, ei pääkohde. Joulutarjouksessa kuvaile joulukoristeita, kynttilöitä, lahjoja, lunta — älä baaritiskiä. Teemaillassa kuvaile koristeita, pukuja, rekvisiittaa — älä yleistä baarin tunnelmaa. Kiinnitä jokainen yksityiskohta käyttäjän pyyntöön. Jokaisen variantin visualDirection on OLTAVA TÄYSIN ERI — vaihtele tunnelmaa, perspektiiviä, vuorokaudenaikaa ja tilan tuntua.",\n    "keyElements": ["3-5 tarkkaa visuaalista elementtiä — jokaisen on oltava jäljitettävissä käyttäjän pyyntöön, teemaan tai vuodenaikaan. Ei geneerisiä 'baarituoleja' tai 'pulloja'. Priorisoi teemaan liittyviä elementtejä."],\n    "styleNotes": "valokuvaustyyli, joka sopii juuri tähän kohtaukseen ja teemaan"\n  },\n  "titleFontStyle": "BOLD_SANS | ELEGANT_SERIF | CONDENSED_IMPACT | CLASSIC_SERIF — valitse otsikon fonttityyli baarin tyylin mukaan. BOLD_SANS: moderni, monikäyttöinen (cocktail-baarit, yökerhot, pubit). ELEGANT_SERIF: tyylikäs, premium (viinibaarit, lounget). CONDENSED_IMPACT: rohkea, iskevä (livemusiikki, urheilubaarit). CLASSIC_SERIF: lämmin, perinteinen (pubit, oluthallit).",`;
  const visualDirectionSchemaEn = `"visualDirection": {\n    "description": "A SPECIFIC, CONCRETE visual scene. MOST IMPORTANT RULE: if the promotion involves a holiday, season, or theme (Christmas, Midsummer, Halloween, Valentine's, May Day, summer terrace, theme night), the description MUST center on THAT theme — the venue interior is ONLY the backdrop, not the subject. For a Christmas promo, describe decorations, candles, gifts, snow — not the bar counter. For a theme night, describe costumes, props, decor — not the general vibe of the room. Anchor every detail in the user's request. Every variant's visualDirection must be COMPLETELY DIFFERENT — vary the mood, perspective, time of day, and spatial feeling.",\n    "keyElements": ["3-5 specific visual elements — each must be traceable to the user's request, theme, or season. No generic 'bar stools' or 'bottles'. Prioritize theme-related elements over venue furniture."],\n    "styleNotes": "photographic style that matches this specific scene and theme (e.g. editorial, 35mm, golden hour, wide angle)"\n  },\n  "titleFontStyle": "BOLD_SANS | ELEGANT_SERIF | CONDENSED_IMPACT | CLASSIC_SERIF — pick the title font style matching the bar's identity. BOLD_SANS: modern, versatile (cocktail bars, nightclubs, pubs). ELEGANT_SERIF: refined, premium (wine bars, lounges). CONDENSED_IMPACT: bold, high-impact (live music, sports bars). CLASSIC_SERIF: warm, traditional (pubs, beer halls).",`;

  // Output format — fully bilingual
  const outputFormat = numVariants > 1
    ? (isFi
        ? `Palauta VAIN JSON-taulukko (ei muuta tekstiä):\n[\n  {\n    "title": "${titleLabel}",\n    "description": "${descLabel}",\n    "type": "${typeLabel}",\n    "discount": luku 0-100 tai null,\n    "callToAction": "${ctaLabel}",\n    "ctaOptions": ["vaihtoehto 1 — kiireellisin/voimakkain", "vaihtoehto 2 — pehmeämpi/uteliaampi", "vaihtoehto 3 — suorin/yksinkertaisin"],\n    "accentColor": "hex-väri",\n    "titleFontStyle": "BOLD_SANS | ELEGANT_SERIF | CONDENSED_IMPACT | CLASSIC_SERIF",\n    "conditions": "${conditionsLabel} (max 150 merkkiä)",\n    "visual": { "template": "${templateDesc}", "mood": "${moodDesc}", "overlayOpacity": 0.2-0.7 },\n    ${visualDirectionSchemaFi}\n  },\n  ...\n]`
        : `Return ONLY a JSON array (no other text):\n[\n  {\n    "title": "${titleLabel}",\n    "description": "${descLabel}",\n    "type": "${typeLabel}",\n    "discount": number 0-100 or null,\n    "callToAction": "${ctaLabel}",\n    "ctaOptions": ["option 1 — most urgent/strongest", "option 2 — softer/curiosity-driven", "option 3 — most direct/simplest"],\n    "accentColor": "hex color",\n    "titleFontStyle": "BOLD_SANS | ELEGANT_SERIF | CONDENSED_IMPACT | CLASSIC_SERIF",\n    "conditions": "${conditionsLabel} (max 150 chars)",\n    "visual": { "template": "${templateDesc}", "mood": "${moodDesc}", "overlayOpacity": 0.2-0.7 },\n    ${visualDirectionSchemaEn}\n  },\n  ...\n]`)
    : (isFi
        ? `Palauta VAIN tämä JSON (ei muuta tekstiä):\n{\n  "title": "${titleLabel}",\n  "description": "${descLabel}",\n  "type": "${typeLabel}",\n  "discount": luku 0-100 tai null,\n  "callToAction": "${ctaLabel}",\n  "ctaOptions": ["vaihtoehto 1 — kiireellisin/voimakkain", "vaihtoehto 2 — pehmeämpi/uteliaampi", "vaihtoehto 3 — suorin/yksinkertaisin"],\n  "accentColor": "hex-väri",\n  "conditions": "${conditionsLabel} (max 150 merkkiä)",\n  "visual": { "template": "${templateDesc}", "mood": "${moodDesc}", "overlayOpacity": 0.2-0.7 },\n  ${visualDirectionSchemaFi}\n}`
        : `Return ONLY this exact JSON (no other text):\n{\n  "title": "${titleLabel}",\n  "description": "${descLabel}",\n  "type": "${typeLabel}",\n  "discount": number 0-100 or null,\n  "callToAction": "${ctaLabel}",\n  "ctaOptions": ["option 1 — most urgent/strongest", "option 2 — softer/curiosity-driven", "option 3 — most direct/simplest"],\n  "accentColor": "hex color",\n  "conditions": "${conditionsLabel} (max 150 chars)",\n  "visual": { "template": "${templateDesc}", "mood": "${moodDesc}", "overlayOpacity": 0.2-0.7 },\n  ${visualDirectionSchemaEn}\n}`);

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
  const toneBlock = tone
    ? (isFi
        ? `\n\nKIRJOITUSTYYLIN SÄÄNNÖT — NÄITÄ ON NOUDATETTAVA TARKASTI:\n${getTonePromptBlock(tone, "fi")}`
        : `\n\nWRITING VOICE RULES — FOLLOW THESE STRICTLY:\n${getTonePromptBlock(tone, "en")}`)
    : "";
  const templateVoiceBlock = template
    ? (isFi
        ? `\n\n${getTemplateVoiceBlock(template, "fi")}`
        : `\n\n${getTemplateVoiceBlock(template, "en")}`)
    : "";
  const blendInstruction =
    tone && template ? getBlendInstruction(isFi ? "fi" : "en") : "";
  const synergyInstructions = getSynergyInstructions(
    tone || null,
    template || null,
    context || null,
    isFi ? "fi" : "en",
  );
  const synergyBlock =
    synergyInstructions.length > 0
      ? `\n\n${synergyInstructions.join("\n\n")}`
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

  const rotationBlock = buildRotationBlock(barId, numVariants, isFi ? "fi" : "en");
  const barHooksBlock = buildBarHooksBlock(
    {
      type: barContext.type,
      district: barContext.district,
      amenities: barContext.amenities,
      priceRange: barContext.priceRange,
      musicTags: barContext.musicTags,
    },
    isFi ? "fi" : "en",
  );

  const ingredientsBlock = isFi
    ? `${templateLine}${toneBlock}${templateVoiceBlock}${blendInstruction}${synergyBlock}${userBriefLine}${contextLine}${nonceLine}${rotationBlock}${barHooksBlock}\n\nTÄRKEÄÄ — LUOVA OHJEISTUS:\nYhdistä yllä olevat ainekset ${numVariants} ainutlaatuiseksi ${type}-tyypin tarjoukseksi baarille "${barContext.name}".\n\nJOKAINEN variantti ammentaa eri asiasta:\n- Baarin ainutlaatuisista yksityiskohdista (${barContext.type} tyyli, ${barContext.district || "sijainti"}, ${barContext.priceRange || "hintataso"})\n- Valitusta äänensävystä ja kampanjatyypin ominaispiirteistä\n- Kontekstin ajankohtaisuudesta (kausi, vuorokaudenaika, säätila)\n\nKIELLETTY:\n- Geneeriset "liity meihin" / "tervetuloa" / "paras baari" -fraasit\n- Saman lauseen toistaminen eri varianteissa\n- Yleisluontoiset kuvaukset jotka sopisivat mihin tahansa baariin

TEE NÄIN — KOUKKU → RUNKO → TOIMINTAKEHOTE -rakenteella:
- KOUKKU (otsikko): Yksi lause joka PYSÄYTTÄÄ selauksen. Ei tunnelmakuvaus, ei geneerinen tervehdys. Käytä yhtä kuudesta koukkutyypistä: uteliaisuusrako, some-häiriö, sosiaalinen todiste, kiireellisyys, tunne-ärsyke tai suora lupaus. Alle 10 sanaa. Otsikko väittää, lupaa tai kutsuu — se ei kuvaile.
- RUNKO (kuvaus): 2-3 lausetta jotka TOIMITTAVAT sen mitä otsikko lupasi. Kerro mitä tapahtuu, milloin, missä. Mainitse KONKREETTISIA yksityiskohtia tästä baarista. Kirjoita niin kuin olisit itse paikalla — mitä näet, kuulet, tunnet.
- TOIMINTAKEHOTE (callToAction): Yksi lause joka SULKEE viestin. Luo FOMO:a, uteliaisuutta tai kiireellisyyttä. Hyvä CTA ei kerjää — mutta se ei myöskään kohauttele olkapäitään. Luo LISÄKSI 2-3 ctaOptions-vaihtoehtoa jotka vaihtelevat kiireellisyyden mukaan: (1) kiireellisin — aikapaine/niukkuus, (2) pehmeämpi — uteliaisuus/kiinnostus paineen sijaan, (3) suorin — selkein pyyntö. Mukauta CTA:t sisältötyyppiin: tapahtumat → lippu/ilmoittautumiskieli, tarjoukset → lunasta/hyödynnä, passit → osta/avaa, kampanjat → tutustu/löydä. Mukauta kiireellisyyssignaaleihin: rajoitettu aika → takaraja (ennen, viimeinen, päättyy), kausiluonteinen → kalenteri (vain tänä viikonloppuna, kesän ajan), eksklusiivinen → niukkuus (rajoitettu, vain jäsenille), säännöllinen → kutsu (tule käymään, kurkkaa).
- Jokainen variantti kuulostaa eri ihmisen kirjoittamalta`
    : `${templateLine}${toneBlock}${templateVoiceBlock}${blendInstruction}${synergyBlock}${userBriefLine}${contextLine}${nonceLine}${rotationBlock}${barHooksBlock}\n\nCRITICAL — CREATIVE INSTRUCTION:\nCombine the ingredients above into ${numVariants} unique ${type} promotions for "${barContext.name}".\n\nEACH variant draws from different aspects:\n- The bar's unique details (${barContext.type} style, ${barContext.district || "location"}, ${barContext.priceRange || "price level"})\n- The chosen tone and template characteristics\n- The context's timeliness (season, time of day, weather)\n\nFORBIDDEN:\n- Generic "join us" / "welcome" / "best bar in town" filler\n- Repeating the same sentence across variants\n- Bland descriptions that could fit any bar anywhere

DO THIS — using HOOK → BODY → CTA structure:
- HOOK (title): One line that STOPS THE SCROLL. Not ambiance description, not a generic greeting. Use one of six hook types: curiosity gap, pattern interrupt, social proof, urgency/scarcity, emotional spike, or direct promise. Under 10 words. The headline claims, promises, or beckons — it does not describe.
- BODY (description): 2-3 sentences that DELIVER what the hook promised. Say what's happening, when, where. Mention SPECIFIC, CONCRETE details about THIS bar. Write as if you're standing in the room — what you see, hear, feel.
- CTA (callToAction) + ctaOptions: The PRIMARY callToAction closes the message with FOMO, curiosity, or urgency. A good CTA doesn't beg — but it also doesn't shrug. ALSO generate 2-3 ctaOptions that vary by urgency: (1) most urgent — time pressure/scarcity, (2) softer — curiosity/intrigue over pressure, (3) direct — the simplest, clearest ask. Adapt CTAs to content TYPE: events → ticket/RSVP language, promotions → redeem/claim, passes → buy/unlock, campaigns → discover/explore. Adapt to URGENCY signals: limited-time → deadline words (before, last chance, ends), seasonal → calendar words (this weekend, summer only), exclusive → scarcity (limited, members only), regular → invitation (come by, check it out).
- Each variant sounds like a different person wrote it`;

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

// ============================================================================
// BRAND CONTENT GENERATION PROMPT BUILDER
// ============================================================================
//
// Follows the exact same proven architecture as buildGeneratePrompt above,
// but adapted for brand/advertising content — no prices, discounts, or
// deal-related fields. Outputs headline + body + cta + imagePrompt per variant.

import type {
  AudienceChip,
  CoreMessageChip,
  AtmosphereChip,
  CopyStructureChip,
} from "@/lib/prompts/creative-director";
import {
  AUDIENCE_GUIDANCE,
  CORE_MESSAGE_FOCUS,
  ATMOSPHERE_LAYER,
  COPY_STRUCTURE_ARCHITECTURE,
} from "@/lib/prompts/build-brand-prompt";

export interface BrandGenerateInput {
  barName: string;
  barType: string;
  district?: string | null;
  cityName?: string | null;
  priceRange?: string | null;
  amenities?: string | null;
  description?: string | null;
  musicTags?: string | null;
  template?: string | null;
  tone?: string | null;
  toneInstruction?: string | null;
  audience?: string[];
  coreMessage?: string | null;
  atmosphere?: string[];
  imageWorld?: string | null;
  copyStructure?: string | null;
  language: "en" | "fi";
  numVariants: number;
  nonce: number;
  barId: string;
}

export function buildBrandGeneratePrompt(input: BrandGenerateInput): string {
  const isFi = input.language === "fi";
  const variants = Math.max(1, Math.min(3, input.numVariants));

  // ---- Compliance guardrails (same as promotion version) ----
  const complianceReminder = isFi
    ? `\n\nSUOMEN ALKOHOLILAIN VAATIMUKSET — sisältösi HYLÄTÄÄN jos rikot näitä:\nEHDOTTOMASTI KIELLETTY: tilapäiset hinnanalennukset, ilmaiset juomat, alkoholiprosenttien maininta, alaikäisiin vetoava kieli, juomapelit/kilpailut, humalahakuinen kulutus, terveysväittämät.\nSALLITTU LÄHESTYMISTAPA: keskity tunnelmaan, musiikkiin, seuraan, identiteettiin ja ympäristöön. Kuvaile MILTÄ TUNTUU olla paikalla — älä MITÄ JUODAAN. Alkoholi on osa ympäristöä, ei tarinan päähenkilö.\nTÄRKEIN SÄÄNTÖ: Jos tekstissäsi kuvaillaan alkoholin juomista, se rikkoo lakia. Kirjoita niin että juoma voisi olla mitä tahansa — kahvia, mocktailia, vichyä. Se mikä tekee illasta erityisen on TUNNELMA ja SEURA, ei alkoholi.`
    : `\n\nFINNISH ALCOHOL ACT REQUIREMENTS — your content WILL be rejected if it violates these:\nABSOLUTELY PROHIBITED: temporary price cuts, free drinks, mentioning alcohol percentages, minor-targeting language, drinking games/contests, intoxication encouragement, health claims.\nALLOWED APPROACH: focus on atmosphere, music, company, identity, and environment. Describe HOW IT FEELS to be there — not WHAT PEOPLE DRINK. Alcohol is part of the setting, not the protagonist.\nMOST IMPORTANT RULE: If your text describes drinking alcohol, it's a violation. Write so the drink could be anything — coffee, mocktail, sparkling water. What makes the night special is the ATMOSPHERE and COMPANY, not the alcohol.`;

  // ---- Template line ----
  const templateLine = input.template
    ? (() => {
        const chars = (TEMPLATE_CHARACTERISTICS as Record<string, { en: string; fi: string }>)[input.template!];
        const traits = chars ? (isFi ? chars.fi : chars.en) : null;
        return isFi
          ? `\nSisältötyyppi: ${input.template}${traits ? ` — ominaispiirteet: ${traits}` : ""}. Käytä luovana suuntana — älä kopioi valmista tekstiä.`
          : `\nContent type: ${input.template}${traits ? ` — characteristics: ${traits}` : ""}. Use as creative direction — do not copy pre-written text.`;
      })()
    : "";

  // ---- Tone voice block ----
  const toneBlock = input.toneInstruction
    ? `\n\n${input.toneInstruction}`
    : "";

  // ---- Brand ingredients ----
  const audienceLines: string[] = [];
  if (input.audience && input.audience.length > 0) {
    const labels = input.audience.map((a) => {
      const chip = a as AudienceChip;
      return (AUDIENCE_GUIDANCE as Record<string, { fi: string; en: string }>)[chip]?.[input.language] ?? a;
    }).filter(Boolean);
    if (labels.length > 0) {
      audienceLines.push(isFi ? `YLEISÖ: ${input.audience.join(", ")}` : `AUDIENCE: ${input.audience.join(", ")}`);
      audienceLines.push(labels.join(" "));
    }
  }
  const audienceBlock = audienceLines.length > 0 ? `\n${audienceLines.join("\n")}` : "";

  const coreMsgBlock = input.coreMessage
    ? (() => {
        const chip = input.coreMessage as CoreMessageChip;
        const focus = (CORE_MESSAGE_FOCUS as Record<string, { fi: string; en: string }>)[chip]?.[input.language] ?? "";
        return `\n${focus}`;
      })()
    : "";

  const atmosphereBlock = input.atmosphere && input.atmosphere.length > 0
    ? (() => {
        const labels = input.atmosphere.map((a) => {
          const chip = a as AtmosphereChip;
          return (ATMOSPHERE_LAYER as Record<string, { fi: string; en: string }>)[chip]?.[input.language] ?? a;
        }).filter(Boolean);
        return labels.length > 0 ? `\n${isFi ? "TUNNELMA: " : "ATMOSPHERE: "}${labels.join(" ")}` : "";
      })()
    : "";

  const imageWorldBlock = input.imageWorld && input.imageWorld !== "venue"
    ? `\n${isFi ? "KUVAMAILMA: " : "IMAGE WORLD: "}${input.imageWorld} — ${isFi ? "kuva ei esitä baaria, vaan tunnelmaa / käsityötä / luontoa. Tekstin tulee tukea tätä kuvamaailmaa." : "image does not show the bar, but mood / craft / nature. Text must support this image world."}`
    : "";

  const copyStructBlock = input.copyStructure
    ? (() => {
        const chip = input.copyStructure as CopyStructureChip;
        return (COPY_STRUCTURE_ARCHITECTURE as Record<string, { fi: string; en: string }>)[chip]?.[input.language] ?? "";
      })()
    : "";

  // ---- Nonce rotation ----
  const nonceLine = input.nonce > 0
    ? (isFi
        ? `\nVariaatioavain: ${input.nonce} — tuota TÄYSIN ERI sisältö kuin aiemmilla avaimilla.`
        : `\nVariation seed: ${input.nonce} — generate COMPLETELY DIFFERENT content than previous seeds.`)
    : "";

  // ---- Bar hooks ----
  const barHooksBlock = buildBarHooksBlock(
    {
      type: input.barType,
      district: input.district ?? undefined,
      amenities: (input.amenities?.split(",") ?? []).map((a) => a.trim().toLowerCase()),
      priceRange: input.priceRange ?? undefined,
      musicTags: (input.musicTags?.split(",") ?? []).map((t) => t.trim().toLowerCase()),
    },
    isFi ? "fi" : "en",
  );

  // ---- Rotation block ----
  const rotationBlock = buildRotationBlock(input.barId, variants, isFi ? "fi" : "en");

  // ---- Variant differentiation (brand-specific angles) ----
  const variantsInstruction = variants > 1
    ? (isFi
        ? `\nLuo ${variants} TÄYSIN ERI vaihtoehtoa — JOKAINEN variantti ottaa ERI luovan kulman:\n` +
          `1. TARINAKULMA: kerro pieni tarina — hetki, tunne, muisto. Rakenna narratiivia.\n` +
          `2. TUNNELMAKULMA: keskity siihen MILTÄ TUNTUU — aistit, ilmapiiri, valo, ääni.\n` +
          `3. KUTSUKULMA: puhuttele suoraan — "sinä", "te", "tule". Kutsu, ei mainos.\n` +
          `Jokaisella variantilla on ERI otsikko, ERI leipäteksti, ERI sävy — ne eivät saa kuulostaa samalta.`
        : `\nGenerate ${variants} COMPLETELY DIFFERENT variants — EACH variant takes a DIFFERENT creative angle:\n` +
          `1. STORY ANGLE: tell a small story — a moment, a feeling, a memory. Build narrative.\n` +
          `2. ATMOSPHERE ANGLE: focus on HOW IT FEELS — senses, vibe, light, sound.\n` +
          `3. INVITATION ANGLE: speak directly — "you", "come". An invitation, not an ad.\n` +
          `Each variant has a DIFFERENT headline, DIFFERENT body, DIFFERENT voice — they must NOT sound the same.`)
    : "";

  // ---- Output format (brand-specific: headline, body, cta, imagePrompt) ----
  const headlineRules = isFi
    ? `"headline": "OTSIKKO (max 60 merkkiä). Otsikko on ITSENÄINEN, MIELEENJÄÄVÄ lause — ei tunnelmakuvaus, ei leipätekstin alku, ei 'Paikka jossa...'.\nHYVÄ OTSIKKO ON: tiivis lupaus tai väite, joka herättää tunteen tai uteliaisuuden. Esim: 'Ilta alkaa tästä.' 'Täällä soi mitä haluat kuulla.' 'Kaupunki tarvitsee tämän paikan.' 'Tule sellaisena kuin olet.' 'Ei turhaan täällä.'\nHUONO OTSIKKO ON: tunnelman kuvailua ('Huone hengittää.' 'Tummat seinät, matala katto.'), epämääräinen ('Baarin taika'), tai geneerinen ('Tervetuloa meille'). Otsikko ei kuvaile — se väittää, lupaa tai kutsuu. Kirjoita jokainen otsikko kuin se luettaisiin ääneen julisteesta. Sen on toimittava yksinään.\nJos otsikkosi voisi olla leipätekstin ensimmäinen lause, se on väärin. Otsikko on itsenäinen yksikkö — iskevä, tiivis, omaperäinen."`
    : `"headline": "HEADLINE (max 60 chars). A headline is a STANDALONE, MEMORABLE statement — not atmospheric narration, not the start of body text, not 'A place where...'.\nA GOOD HEADLINE IS: a tight promise or claim that triggers emotion or curiosity. E.g.: 'The night starts here.' 'This is what you wanted to hear.' 'The city needs this place.' 'Come as you are.' 'Not for nothing.'\nA BAD HEADLINE IS: atmospheric scene-setting ('The room breathes.' 'Dark walls, low ceilings.'), vague ('Bar magic'), or generic ('Welcome to our bar'). A headline doesn't describe — it claims, promises, or invites. Write every headline as if it will be read aloud from a poster. It must work on its own.\nIf your headline could be the first sentence of body text, it's wrong. A headline is a self-contained unit — punchy, tight, original."`;
  const outputFormat = variants > 1
    ? (isFi
        ? `Palauta VAIN JSON-taulukko (ei muuta tekstiä):\n[\n  {\n    ${headlineRules},\n    "body": "Leipäteksti (max 250 merkkiä) — rakenna tunnelmaa, älä myy tuotetta",\n    "cta": "Toimintakehote (max 40 merkkiä) — esim. Varaa pöytä, Tule paikalle, Lue lisää",\n    "ctaOptions": ["vaihtoehto 1 — kiireellisin/suorin", "vaihtoehto 2 — pehmeämpi/uteliaampi", "vaihtoehto 3 — tarina/kutsu"],\n    "imagePrompt": "Yksityiskohtainen kuvagenerointiprompti englanniksi (max 200 merkkiä) — kuvaile mitä kuvassa näkyy: sijainti, valaistus, värit, tunnelma, sommittelma. Älä mainitse alkoholia, baaria tai ihmisiä jos kuvamaailma ei ole baari."\n  },\n  ...\n]`
        : `Return ONLY a JSON array (no other text):\n[\n  {\n    ${headlineRules},\n    "body": "Body text (max 250 chars) — build atmosphere, don't sell a product",\n    "cta": "Call to action (max 40 chars) — e.g. Book a table, Come by, Read more",\n    "ctaOptions": ["option 1 — most urgent/direct", "option 2 — softer/curiosity-driven", "option 3 — story/invitation"],\n    "imagePrompt": "Detailed image generation prompt in English (max 200 chars) — describe what's in the image: location, lighting, colors, mood, composition. Do not mention alcohol, bars, or people if the image world is not venue."\n  },\n  ...\n]`)
    : (isFi
        ? `Palauta VAIN tämä JSON (ei muuta tekstiä):\n{\n  "headline": "Otsikko — itsenäinen, iskevä väite tai lupaus, EI tunnelmakuvaus",\n  "body": "...",\n  "cta": "...",\n  "ctaOptions": ["vaihtoehto 1 — kiireellisin/suorin", "vaihtoehto 2 — pehmeämpi/uteliaampi", "vaihtoehto 3 — tarina/kutsu"],\n  "imagePrompt": "..."\n}`
        : `Return ONLY this JSON (no other text):\n{\n  "headline": "Headline — standalone, punchy claim or promise, NOT atmospheric description",\n  "body": "...",\n  "cta": "...",\n  "ctaOptions": ["option 1 — most urgent/direct", "option 2 — softer/curiosity-driven", "option 3 — story/invitation"],\n  "imagePrompt": "..."\n}`);

  // ---- Assemble ingredients block (same pattern as buildGeneratePrompt) ----
  const ingredientsBlock = isFi
    ? `${templateLine}${toneBlock}${audienceBlock}${coreMsgBlock}${atmosphereBlock}${imageWorldBlock}${copyStructBlock}${nonceLine}${rotationBlock}${barHooksBlock}\n\nTÄRKEÄÄ — LUOVA OHJEISTUS:\nYhdistä yllä olevat ainekset ${variants} ainutlaatuiseksi brändisisällöksi baarille "${input.barName}".\n\nJOKAINEN variantti ammentaa eri asiasta:\n- Baarin ainutlaatuisista yksityiskohdista (${input.barType} tyyli, ${input.district || "sijainti"}, ${input.priceRange || "hintataso"})\n- Valitusta äänensävystä ja sisältötyypin ominaispiirteistä\n- Kuvamaailmasta ja tunnelmasta\n\nKIELLETTY:\n- Hinnat, alennukset, tarjoukset, "happy hour", "ilmainen", "tarjous"\n- Geneeriset "liity meihin" / "tervetuloa" / "paras baari" -fraasit\n- Saman lauseen toistaminen eri varianteissa\n- Alkoholin mainitseminen pääasiana

TEE NÄIN — KOUKKU → RUNKO → TOIMINTAKEHOTE -rakenteella:
- KOUKKU (otsikko): Yksi lause joka PYSÄYTTÄÄ selauksen. Ei tunnelmakuvaus, ei geneerinen tervehdys. Käytä yhtä kuudesta koukkutyypistä: uteliaisuusrako, some-häiriö, sosiaalinen todiste, kiireellisyys, tunne-ärsyke tai suora lupaus. Alle 10 sanaa. Otsikko väittää, lupaa tai kutsuu — se ei kuvaile.
- RUNKO (leipäteksti): 2-3 lausetta jotka TOIMITTAVAT sen mitä otsikko lupasi. Mainitse KONKREETTISIA yksityiskohtia tästä baarista. Kirjoita kuin olisit paikalla — mitä näet, kuulet, tunnet.
- TOIMINTAKEHOTE (cta): Yksi lause joka SULKEE viestin. Luo FOMO:a, uteliaisuutta tai kiireellisyyttä. Kutsu, ei olankohautus. Luo LISÄKSI 2-3 ctaOptions-vaihtoehtoa jotka vaihtelevat kiireellisyyden mukaan: (1) kiireellisin — aikapaine/niukkuus, (2) pehmeämpi — uteliaisuus/kiinnostus, (3) suorin — selkein pyyntö. Mukauta CTA:t yleisösignaaleihin: kaveriporukat → ryhmätoiminta (tuo porukkasi), pariskunnat → intiimi (vain te kaksi), työkaverit → ammatillinen (työpäivän jälkeen), musiikinystävät → kokemuksellinen (kuule livenä), ruokaintoilijat → aistillinen (maista tätä), lähialueen asukkaat → yhteenkuuluvuus (sinun uusi paikkasi).
- Jokainen variantti kuulostaa eri ihmisen kirjoittamalta
- Rakenna mielikuvaa ja muistijälkeä — älä myy, kerro`
    : `${templateLine}${toneBlock}${audienceBlock}${coreMsgBlock}${atmosphereBlock}${imageWorldBlock}${copyStructBlock}${nonceLine}${rotationBlock}${barHooksBlock}\n\nCRITICAL — CREATIVE INSTRUCTION:\nCombine the ingredients above into ${variants} unique brand content pieces for "${input.barName}".\n\nEACH variant draws from different aspects:\n- The bar's unique details (${input.barType} style, ${input.district || "location"}, ${input.priceRange || "price level"})\n- The chosen tone and content type characteristics\n- The image world and atmosphere\n\nFORBIDDEN:\n- Prices, discounts, deals, "happy hour", "free", "offer"\n- Generic "join us" / "welcome" / "best bar in town" filler\n- Repeating the same sentence across variants\n- Mentioning alcohol as the main subject

DO THIS — using HOOK → BODY → CTA structure:
- HOOK (headline): One line that STOPS THE SCROLL. Not ambiance description, not a generic greeting. Use one of six hook types: curiosity gap, pattern interrupt, social proof, urgency/scarcity, emotional spike, or direct promise. Under 10 words. A headline claims, promises, or invites — it does not describe.
- BODY (body): 2-3 sentences that DELIVER what the hook promised. Mention SPECIFIC, CONCRETE details about THIS bar. Write as if you're standing in the room — what you see, hear, feel.
- CTA (cta): One line that CLOSES the message. Create FOMO, curiosity, or urgency. An invitation, not a shrug. ALSO generate 2-3 ctaOptions that vary by urgency: (1) most urgent — time pressure/scarcity, (2) softer — curiosity/intrigue, (3) direct — the simplest, clearest ask. Adapt CTAs to audience signals: friend-groups → group action (bring your crew), couples → intimate (just the two of you), work-colleagues → professional (after hours), music-lovers → experiential (hear it live), food-focused → sensory (taste this), neighborhood-locals → belonging (your new spot).
- Each variant sounds like a different person wrote it
- Build association and memory — don't sell, tell`;

  // ---- Final prompt (same structure as buildGeneratePrompt) ----
  const districtStr = [input.district, input.cityName].filter(Boolean).join(", ");

  return isFi
    ? `BAARIN TIEDOT:
- Nimi: ${input.barName}
- Tyyppi: ${input.barType}
- Sijainti: ${districtStr || ""}
- Hintataso: ${input.priceRange || "Kohtalainen"}
- Palvelut: ${input.amenities || "Vakiovarustelu"}
- Kuvaus: ${input.description || "Loistava paikka nauttia illasta"}

LUOVA OHJEISTUS:
${ingredientsBlock}

TÄRKEÄÄ — Kaikki sisältö TÄYTYY olla SUOMEKSI. Jos tuotat englantia, tulos hylätään.
${variantsInstruction}

${outputFormat}
${complianceReminder}`
    : `BAR CONTEXT:
- Name: ${input.barName}
- Type: ${input.barType}
- Location: ${districtStr || ""}
- Price Range: ${input.priceRange || "Moderate"}
- Amenities: ${input.amenities || "Standard bar amenities"}
- Description: ${input.description || "A great place to enjoy nightlife"}

CREATIVE INSTRUCTION:
${ingredientsBlock}

IMPORTANT — All content MUST be in English. Do not output Finnish.
${variantsInstruction}

${outputFormat}
${complianceReminder}`;
}
