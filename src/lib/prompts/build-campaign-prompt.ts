// src/lib/prompts/build-campaign-prompt.ts
// ============================================================================
// CAMPAIGN PROMPT BUILDER — Multi-post sequences with unified creative direction
// ============================================================================
//
// Campaigns generate a sequence of posts (beats) that tell a narrative arc
// over days leading up to and following an event or promotion. Each beat has
// a defined job: tease, announce, remind, drive urgency, or follow up.
//
// The AI generates all beats in one call, maintaining consistent tone,
// visual identity, and narrative thread across the entire sequence.
// ============================================================================

import { buildBarHooksBlock } from "@/lib/prompts/bar-hooks";
import {
  AUDIENCE_GUIDANCE,
  CORE_MESSAGE_FOCUS,
  ATMOSPHERE_LAYER,
  COPY_STRUCTURE_ARCHITECTURE,
} from "@/lib/prompts/build-brand-prompt";
import type {
  AudienceChip,
  CoreMessageChip,
  AtmosphereChip,
  CopyStructureChip,
} from "@/lib/prompts/creative-director";
import type { ContentTone } from "@/lib/prompts/tone-voices";
import { getTonePromptBlock } from "@/lib/prompts/tone-voices";

// ---- Campaign Beat Types ----

export type CampaignBeatJob =
  | "teaser"
  | "announcement"
  | "reminder"
  | "day_of"
  | "follow_up";

export interface CampaignBeatConfig {
  job: CampaignBeatJob;
  /** Days offset from the event date (negative = before, positive = after, 0 = day-of) */
  dayOffset: number;
  /** Human-readable label */
  label: { en: string; fi: string };
  /** What this beat should accomplish */
  objective: { en: string; fi: string };
  /** Tone guidance specific to this beat */
  toneGuidance: { en: string; fi: string };
  /** CTA guidance specific to this beat */
  ctaGuidance: { en: string; fi: string };
}

// ---- Campaign Input ----

export interface CampaignPromptInput {
  campaignName: string;
  barName: string;
  barType: string;
  district?: string | null;
  cityName?: string | null;
  priceRange?: string | null;
  amenities?: string | null;
  description?: string | null;
  musicTags?: string | null;
  tone?: ContentTone | null;
  toneInstruction?: string | null;
  audience?: string[];
  coreMessage?: string | null;
  atmosphere?: string[];
  imageWorld?: string | null;
  copyStructure?: string | null;
  language: "en" | "fi";
  eventDate?: string | null; // ISO date string
  eventTime?: string | null; // "17:00" or similar
  beats: CampaignBeatJob[];
  userBrief?: string | null;
  barId: string;
}

// ---- Beat Definitions ----

const BEAT_DEFS: Record<CampaignBeatJob, CampaignBeatConfig> = {
  teaser: {
    job: "teaser",
    dayOffset: -3,
    label: { en: "Teaser", fi: "Teaseri" },
    objective: {
      en: "Create curiosity without revealing the full offer. Make them wonder. The hook should open a loop they need closed.",
      fi: "Luo uteliaisuutta paljastamatta koko tarjousta. Saa heidät miettimään. Koukku avaa silmukan, joka tarvitsee sulkemisen.",
    },
    toneGuidance: {
      en: "Intriguing, mysterious, playful. Hint at what's coming without saying it. Use curiosity gaps and pattern interrupts.",
      fi: "Mielenkiintoinen, salaperäinen, leikkisä. Vihjaa tulevasta sanomatta sitä suoraan. Käytä uteliaisuuskuiluja ja kaavan katkaisuja.",
    },
    ctaGuidance: {
      en: "Soft CTAs only: 'Save the date', 'Stay tuned', 'Something's coming'. Do NOT ask for a commitment yet.",
      fi: "Vain pehmeät CTA:t: 'Merkkaa kalenteriin', 'Pysy kuulolla', 'Jotain on tulossa'. ÄLÄ pyydä sitoutumista vielä.",
    },
  },
  announcement: {
    job: "announcement",
    dayOffset: -1,
    label: { en: "Announcement", fi: "Julkistus" },
    objective: {
      en: "Reveal the full offer clearly and compellingly. Answer the question the teaser raised. Build excitement.",
      fi: "Paljasta koko tarjous selkeästi ja houkuttelevasti. Vastaa teaserin herättämään kysymykseen. Rakenna innostusta.",
    },
    toneGuidance: {
      en: "Confident, clear, exciting. This is the big reveal. The offer takes center stage. Still warm and inviting — not pushy.",
      fi: "Itsevarma, selkeä, innostava. Tämä on iso paljastus. Tarjous on keskiössä. Silti lämmin ja kutsuva — ei tunkeileva.",
    },
    ctaGuidance: {
      en: "Direct CTAs: 'Book now', 'Save your spot', 'Get tickets'. Make it easy to act.",
      fi: "Suorat CTA:t: 'Varaa nyt', 'Varmista paikkasi', 'Hanki liput'. Tee toimimisesta helppoa.",
    },
  },
  reminder: {
    job: "reminder",
    dayOffset: 0,
    label: { en: "Reminder", fi: "Muistutus" },
    objective: {
      en: "Keep it top of mind. Reference the announcement. Add a new detail or angle to avoid repetition. Build gentle urgency.",
      fi: "Pidä mielessä. Viittaa julkistukseen. Lisää uusi yksityiskohta tai kulma toiston välttämiseksi. Rakenna kevyttä kiirettä.",
    },
    toneGuidance: {
      en: "Warm, helpful, slightly more urgent. 'In case you forgot...' framing. Still friendly — not panicked.",
      fi: "Lämmin, avulias, hieman kiireellisempi. 'Jos satu unohtumaan...' -kehystys. Silti ystävällinen — ei paniikkinen.",
    },
    ctaGuidance: {
      en: "Confirming CTAs: 'Still coming?', 'Don't forget', 'See you there'. Reinforce the plan.",
      fi: "Vahvistavat CTA:t: 'Tuletko vielä?', 'Älä unohda', 'Nähdään siellä'. Vahvista suunnitelmaa.",
    },
  },
  day_of: {
    job: "day_of",
    dayOffset: 0,
    label: { en: "Happening Now", fi: "Tapahtuu nyt" },
    objective: {
      en: "Drive last-minute action. Create FOMO. This is the highest-energy beat — it's happening NOW.",
      fi: "Aja viime hetken toimintaa. Luo FOMO. Tämä on korkeimman energian biitti — se tapahtuu NYT.",
    },
    toneGuidance: {
      en: "Energetic, urgent, exciting. This is the peak. Short sentences. High-impact language. 'It's happening.'",
      fi: "Energinen, kiireellinen, innostava. Tämä on huippu. Lyhyitä lauseita. Voimakasta kieltä. 'Se tapahtuu.'",
    },
    ctaGuidance: {
      en: "Urgent CTAs: 'Come now', 'Last chance', 'Happening NOW'. Create immediate action pressure.",
      fi: "Kiireelliset CTA:t: 'Tule nyt', 'Viimeinen mahdollisuus', 'Tapahtuu NYT'. Luo välitöntä toimintapainetta.",
    },
  },
  follow_up: {
    job: "follow_up",
    dayOffset: 1,
    label: { en: "Follow-up", fi: "Jälkiseuranta" },
    objective: {
      en: "Recap the event. Share social proof. Thank attendees. Make non-attendees feel FOMO for NEXT time.",
      fi: "Koosta tapahtuma. Jaa sosiaalinen todiste. Kiitä osallistujia. Saa ei-osallistujat tuntemaan FOMO:a SEURAAVAA kertaa varten.",
    },
    toneGuidance: {
      en: "Grateful, warm, community-focused. 'This was amazing because of YOU.' Plant the seed for the next one.",
      fi: "Kiitollinen, lämmin, yhteisökeskeinen. 'Tämä oli mahtava SINUN ansiostasi.' Kylvä siemen seuraavaa varten.",
    },
    ctaGuidance: {
      en: "Forward-looking CTAs: 'See you next time', 'Don't miss the next one', 'Tag yourself in the photos'. Build retention.",
      fi: "Eteenpäin katsovat CTA:t: 'Nähdään ensi kerralla', 'Älä missaa seuraavaa', 'Merkitse itsesi kuviin'. Rakenna pysyvyyttä.",
    },
  },
};

/** Ordered beat sequence (priority order for display) */
const BEAT_ORDER: CampaignBeatJob[] = [
  "teaser",
  "announcement",
  "reminder",
  "day_of",
  "follow_up",
];

export { BEAT_DEFS, BEAT_ORDER };

// ---- Prompt Builder ----

/**
 * Build the system prompt for campaign generation.
 * Includes bar positioning, compliance, campaign-specific sequencing
 * instructions, and output format.
 */
export function buildCampaignSystemPrompt(
  language: "en" | "fi",
  barPositioning: {
    name: string;
    type: string;
    district?: string;
    cityName?: string;
    differentiators: string[];
    seasonalContext?: string;
  },
): string {
  const isFi = language === "fi";

  // Bar positioning block
  const barBlock = isFi
    ? `Olet Hoppr-alustan Senior Marketing Operations Manager — kokenut markkinoinnin ammattilainen, joka luo kampanjoita baareille ja yökerhoille. Olet työskennellyt alalla yli vuosikymmenen ja ymmärrät, mikä toimii Helsingin yöelämässä.

TYÖSKENTELET SEURAAVALLE BAARILLE:
- Nimi: ${barPositioning.name}
- Tyyppi: ${barPositioning.type}
- Sijainti: ${barPositioning.district ?? ""}, ${barPositioning.cityName ?? ""}
- Erottuvuustekijät: ${barPositioning.differentiators.join("; ")}${barPositioning.seasonalContext ? `\n- Kausi: ${barPositioning.seasonalContext}` : ""}`
    : `You are a Senior Marketing Operations Manager for the Hoppr platform — an experienced marketing professional who creates campaigns for bars and nightclubs. You've spent over a decade in the industry and understand what works in Helsinki nightlife.

YOU ARE WORKING FOR THIS BAR:
- Name: ${barPositioning.name}
- Type: ${barPositioning.type}
- Location: ${barPositioning.district ?? ""}, ${barPositioning.cityName ?? ""}
- Differentiators: ${barPositioning.differentiators.join("; ")}${barPositioning.seasonalContext ? `\n- Season: ${barPositioning.seasonalContext}` : ""}`;

  // Compliance rules (abbreviated — full compliance is in the main system prompt)
  const complianceBlock = isFi
    ? `\n\nSUOMEN ALKOHOLILAKI — NÄITÄ EI SAA TEHDÄ:
- Ei tilapäisiä alkoholin hinnanalennuksia tai ilmaisia juomia
- Ei alaikäisiin vetoavaa kieltä
- Ei liialliseen kulutukseen kannustamista
- Ei viinamerkkejä — käytä "premium-viinat" tai "talon kaadot"
- Ei alkoholiin liittyviä pelejä/kilpailuja
- Keskity tunnelmaan, elämykseen, ruokaan ja viihteeseen`
    : `\n\nFINNISH ALCOHOL ACT — YOU MUST NOT:
- Offer temporary alcohol price reductions or free drinks
- Use language targeting minors
- Encourage excessive consumption
- Name spirit brands — use "premium spirits" or "house pours"
- Include alcohol-related games/contests
- Focus on atmosphere, experience, food, and entertainment`;

  // Campaign sequencing instructions
  const campaignInstructions = isFi
    ? `\n\nKAMPANJAN LUOMINEN — Tämä on KAMPANJA, ei yksittäinen postaus.
Luo sarja toisiinsa liittyviä postauksia, jotka kertovat TARINAN usean päivän aikana.

KAMPANJAN KERTOMUKSEN KAARI:
1. TEASER — Avaa uteliaisuus. Älä paljasta kaikkea. Koukuta.
2. JULKISTUS — Kerro mistä on kyse. Rakenna innostusta. Selkeä, houkutteleva.
3. MUISTUTUS — Pidä mielessä. Uusi kulma. Kevyt kiire.
4. TAPAHTUU NYT — Huippuenergia. Toimintakehotus. FOMO.
5. JÄLKISEURANTA — Kiitä. Jaa tunnelmia. Kylvä siemen seuraavaa varten.

TÄRKEIMMÄT KAMPANJASÄÄNNÖT:
- Jokainen postaus LUKEE kuin saman brändin kirjoittama. Sama ääni, eri energia.
- Jokainen postaus viittaa EDELLISEEN — "Kerroimme eilen..." "Se on huomenna..." "Kiitos eilisestä..."
- Älä toista samaa sisältöä. Jokaisella postauksella on ERI tehtävä.
- Otsikot ERILAISIA — teaser käyttää uteliaisuuskuilua, julkistus suoraa lupausta, tapahtuu-nyt kiirettä.
- Kuvakuvaukset KEHITTYVÄT — teaser: vihjaileva lähikuva, julkistus: baarin yleiskuva, tapahtuu-nyt: täysi tila/energia, jälkiseuranta: tunnelmallisia hetkiä.
- ALKOHOLILAKI pätee JOKAISEEN postaukseen — ei poikkeuksia.

LAATUTARKISTUS ENNEN PALAUTUSTA:
- Onko jokaisella postauksella selkeä, erilainen tehtävä?
- Tuntuuko sarja yhtenäiseltä brändiltä?
- Viittaavatko postaukset toisiinsa luonnollisesti?
- Ovatko CTA:t beat-kohtaisia (pehmeä teaserissa, suora julkistuksessa, kiireellinen tapahtuu-nytissä)?
- Noudattaako jokainen postaus Alkoholilakia?`
    : `\n\nCAMPAIGN CREATION — This is a CAMPAIGN, not a single post.
Create a series of connected posts that tell a STORY over multiple days.

CAMPAIGN NARRATIVE ARC:
1. TEASER — Open curiosity. Don't reveal everything. Hook them.
2. ANNOUNCEMENT — Reveal what it is. Build excitement. Clear, compelling.
3. REMINDER — Keep it top of mind. New angle. Gentle urgency.
4. HAPPENING NOW — Peak energy. Call to action. FOMO.
5. FOLLOW-UP — Thank them. Share the vibe. Plant the seed for next time.

CRITICAL CAMPAIGN RULES:
- Every post READS like the same brand wrote it. Same voice, different energy.
- Every post REFERENCES the PREVIOUS one — "We mentioned yesterday..." "It's tomorrow..." "Thanks for last night..."
- Do NOT repeat the same content. Each post has a DIFFERENT job.
- Headlines are DIFFERENT — teaser uses curiosity gap, announcement uses direct promise, happening-now uses urgency.
- Image prompts EVOLVE — teaser: hinting close-up, announcement: bar overview, happening-now: packed venue/energy, follow-up: atmospheric moments.
- ALCOHOL ACT applies to EVERY post — no exceptions.

QUALITY CHECK BEFORE RETURNING:
- Does every post have a clear, different job?
- Does the sequence feel like one cohesive brand?
- Do posts reference each other naturally?
- Are CTAs beat-appropriate (soft on teaser, direct on announcement, urgent on happening-now)?
- Does every post comply with the Alcohol Act?`;

  return `${barBlock}${complianceBlock}${campaignInstructions}`;
}

/**
 * Build the user prompt for campaign generation.
 * Contains bar context, creative direction (tone, audience, atmosphere),
 * beat specifications, and output format.
 */
export function buildCampaignUserPrompt(input: CampaignPromptInput): string {
  const isFi = input.language === "fi";

  // ---- Campaign header ----
  const campaignHeader = isFi
    ? `\n\nKAMPANJA: "${input.campaignName}"`
    : `\n\nCAMPAIGN: "${input.campaignName}"`;

  // ---- Bar context ----
  const barContext = isFi
    ? `\n\nBaarin tiedot:
- Nimi: ${input.barName}
- Tyyppi: ${input.barType}
- Sijainti: ${input.district || ""}, ${input.cityName || ""}
- Hintataso: ${input.priceRange || "Kohtalainen"}
- Palvelut: ${input.amenities || "Vakiovarustelu"}
- Kuvaus: ${input.description || "Loistava paikka nauttia illasta"}`
    : `\n\nBar context:
- Name: ${input.barName}
- Type: ${input.barType}
- Location: ${input.district || ""}, ${input.cityName || ""}
- Price Range: ${input.priceRange || "Moderate"}
- Amenities: ${input.amenities || "Standard bar amenities"}
- Description: ${input.description || "A great place to enjoy nightlife"}`;

  // ---- Event info ----
  let eventLine = "";
  if (input.eventDate) {
    eventLine = isFi
      ? `\n\nTapahtuman ajankohta: ${input.eventDate}${input.eventTime ? ` klo ${input.eventTime}` : ""}`
      : `\n\nEvent date: ${input.eventDate}${input.eventTime ? ` at ${input.eventTime}` : ""}`;
  }

  // ---- User brief ----
  const briefLine = input.userBrief
    ? (isFi
        ? `\n\nLisäohjeet: ${input.userBrief}`
        : `\n\nAdditional notes: ${input.userBrief}`)
    : "";

  // ---- Tone voice block ----
  const toneBlock = input.toneInstruction
    ? `\n\n${input.toneInstruction}`
    : "";

  // ---- Brand ingredients ----
  const audienceBlock = input.audience && input.audience.length > 0
    ? (() => {
        const labels = input.audience.map((a) => {
          const chip = a as AudienceChip;
          return (AUDIENCE_GUIDANCE as Record<string, { fi: string; en: string }>)[chip]?.[input.language] ?? a;
        }).filter(Boolean);
        return isFi
          ? `\n\nKOHDERYHMÄ: ${input.audience.join(", ")}\n${labels.join(" ")}`
          : `\n\nTARGET AUDIENCE: ${input.audience.join(", ")}\n${labels.join(" ")}`;
      })()
    : "";

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
        return labels.length > 0
          ? `\n${isFi ? "TUNNELMA: " : "ATMOSPHERE: "}${labels.join(" ")}`
          : "";
      })()
    : "";

  // ---- Beat specifications ----
  const beatsList = input.beats
    .map((job) => {
      const def = BEAT_DEFS[job];
      const label = isFi ? def.label.fi : def.label.en;
      const objective = isFi ? def.objective.fi : def.objective.en;
      const toneGuide = isFi ? def.toneGuidance.fi : def.toneGuidance.en;
      const ctaGuide = isFi ? def.ctaGuidance.fi : def.ctaGuidance.en;
      const offsetStr = def.dayOffset < 0
        ? `${Math.abs(def.dayOffset)} ${isFi ? "päivää ennen" : "days before"}`
        : def.dayOffset === 0
          ? (isFi ? "tapahtumapäivänä" : "day of")
          : `${def.dayOffset} ${isFi ? "päivää jälkeen" : "days after"}`;

      return `\n--- POSTAUS: ${label} (${offsetStr}) ---
Tehtävä: ${objective}
Ääniohje: ${toneGuide}
CTA-ohje: ${ctaGuide}`;
    })
    .join("");

  const beatsSection = isFi
    ? `\n\nLUO SEURAAVAT POSTAUKSET:${beatsList}`
    : `\n\nCREATE THE FOLLOWING POSTS:${beatsList}`;

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

  // ---- Output format ----
  const outputFormat = isFi
    ? `\n\nPALAUTUSMUOTO — palauta VAIN validi JSON-taulukko (ei muuta tekstiä):
[
  {
    "job": "teaser" | "announcement" | "reminder" | "day_of" | "follow_up",
    "headline": "Otsikko (max 60 merkkiä)",
    "body": "Leipäteksti (2-4 lausetta)",
    "cta": "Toimintakehotus",
    "hookPattern": "curiosity_gap" | "pattern_interrupt" | "social_proof" | "urgency_scarcity" | "emotional_spike" | "direct_promise",
    "imagePrompt": "Yksityiskohtainen englanninkielinen kuvaus Flux-kuvagenerointia varten. KRIITTINEN: imagePromptin tunnelman ja valaistuksen ON VASTATTAVA otsikon ja leipatekstin tunnetilaa. Jos teksti on intiimi → kuvaan matala valaistus. Jos teksti on energinen → kuvaan liiketta ja energiaa. Kuva ja teksti kertovat saman tarinan."
  }
]`
    : `\n\nOUTPUT FORMAT — return ONLY a valid JSON array (no other text):
[
  {
    "job": "teaser" | "announcement" | "reminder" | "day_of" | "follow_up",
    "headline": "Headline (max 60 characters)",
    "body": "Body text (2-4 sentences)",
    "cta": "Call to action",
    "hookPattern": "curiosity_gap" | "pattern_interrupt" | "social_proof" | "urgency_scarcity" | "emotional_spike" | "direct_promise",
    "imagePrompt": "Detailed English description for Flux image generation. CRITICAL: The imagePrompt's mood and lighting MUST MATCH the emotional register of the headline and body text. If the text is intimate → low lighting in the image. If the text is energetic → movement and energy in the image. Image and copy tell the same story."
  }
]`;

  const reminder = isFi
    ? `\n\nKAIKKI teksti SUOMEKSI. Palauta VAIN JSON-taulukko — ei muuta.`
    : `\n\nReturn ONLY the JSON array — nothing else.`;

  return `${campaignHeader}${barContext}${eventLine}${briefLine}${toneBlock}${audienceBlock}${coreMsgBlock}${atmosphereBlock}${beatsSection}\n${barHooksBlock}${outputFormat}${reminder}`;
}
