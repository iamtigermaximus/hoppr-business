// src/lib/prompts/build-social-prompt.ts
// ============================================================================
// SOCIAL MEDIA PROMPT BUILDER — Adapt generated content for social platforms.
//
// Unlike the event and pass builders, this module doesn't generate from a
// brief. It takes already-created content (a promotion, event, or VIP pass)
// and adapts it for Instagram and Facebook. Each platform has different
// formatting rules, character expectations, and audience behavior.
//
// This is the final step in the content pipeline: create → refine → social.
// ============================================================================

// ---------------------------------------------------------------------------
// Platform profiles
// ---------------------------------------------------------------------------

export type SocialPlatform = "instagram" | "facebook";

interface PlatformProfile {
  label: string;
  writingRules: { en: string; fi: string };
  outputFormat: { en: string; fi: string };
}

const PLATFORM_PROFILES: Record<SocialPlatform, PlatformProfile> = {
  instagram: {
    label: "Instagram",
    writingRules: {
      en: `INSTAGRAM FORMATTING RULES:
- Hook in the FIRST LINE — the caption preview cuts after ~125 characters. Lead with the most compelling thing.
- Use line breaks generously — short paragraphs (1-2 sentences), lots of whitespace. Instagram readers scroll fast.
- Emojis are welcome but not required — use them naturally, not as decoration. 1-2 per post max.
- CTA early: tell people what to do (tag a friend, link in bio, DM to book, save for later).
- Hashtags: 5-8 relevant hashtags at the END, separated by a blank line from the body. Mix broad (#helsinki) and niche (#kallionightlife).
- Tone: conversational and direct. Write like you're texting a friend about something cool happening.
- Max total length: ~400 characters for the body (excluding hashtags). Instagram readers don't read novels.`,

      fi: `INSTAGRAMIN MUOTOILUSÄÄNNÖT:
- Koukkaus ENSIMMÄISELLÄ RIVILLÄ — kuvauksen esikatselu katkeaa ~125 merkin kohdalla. Aloita kiinnostavimmalla asialla.
- Käytä rivinvaihtoja runsaasti — lyhyitä kappaleita (1-2 lausetta), paljon tyhjää tilaa. Instagramin lukijat skrollaavat nopeasti.
- Emojit ovat tervetulleita muttei pakollisia — käytä luontevasti, ei koristeena. 1-2 per postaus max.
- CTA ajoissa: kerro mitä tehdä (tägää kaveri, linkki biossa, DM:llä varaus, tallenna myöhemmäksi).
- Hashtagit: 5-8 relevanttia hashtagia LOPUSSA, erotettuna tyhjällä rivillä. Sekoita laajoja (#helsinki) ja tarkkoja (#kallioyö).
- Sävy: keskusteleva ja suora. Kirjoita kuin tekstarisit kaverille siististä jutusta.
- Maksimipituus: ~400 merkkiä rungolle (ilman hashtageja). Instagramin lukijat eivät lue romaaneja.`,
    },
    outputFormat: {
      en: `OUTPUT FORMAT — Return ONLY valid JSON:
{
  "caption": "Instagram caption with line breaks (\\n), emojis, and CTA",
  "hashtags": ["#relevant1", "#relevant2", "#relevant3", "#relevant4", "#relevant5"],
  "cta": "The call to action used",
  "characterCount": "number — body only, excluding hashtags"
}`,
      fi: `PALAUTUSMUOTO — Palauta VAIN validi JSON:
{
  "caption": "Instagram-kuvateksti rivinvaihdoilla (\\n), emojeilla ja CTA:lla",
  "hashtags": ["#relevantti1", "#relevantti2", "#relevantti3", "#relevantti4", "#relevantti5"],
  "cta": "Käytetty toimintakehote",
  "characterCount": "number — vain leipäteksti, ilman hashtageja"
}`,
    },
  },

  facebook: {
    label: "Facebook",
    writingRules: {
      en: `FACEBOOK FORMATTING RULES:
- Longer form is fine — Facebook readers expect more detail. 2-4 short paragraphs.
- Lead with the event/promotion name and date if applicable — Facebook is event-oriented.
- Include all practical details: time, date, location, price, how to book. Facebook users share event info.
- Link-friendly: mention where to find more info (event page, website, booking link).
- More formal than Instagram but still warm — the tone is "helpful local business," not corporate.
- No hashtags (or 1-2 max). Facebook hashtags feel spammy.
- End with a clear CTA: "Reserve your spot," "Get tickets here," "See you there."
- Max length: ~600 characters. If the original content is already detailed, just format it.`,

      fi: `FACEBOOKIN MUOTOILUSÄÄNNÖT:
- Pidempi muoto on ok — Facebookin lukijat odottavat enemmän yksityiskohtia. 2-4 lyhyttä kappaletta.
- Aloita tapahtuman/tarjouksen nimellä ja päivämäärällä jos soveltuu — Facebook on tapahtumasuuntautunut.
- Sisällytä kaikki käytännön tiedot: aika, päivämäärä, paikka, hinta, miten varata. Facebook-käyttäjät jakavat tapahtumatietoja.
- Linkkiystävällinen: mainitse mistä löytää lisätietoa (tapahtumasivu, nettisivut, varauslinkki).
- Muodollisempi kuin Instagram mutta silti lämmin — sävy on "avulias paikallinen yritys," ei yritysmäinen.
- Ei hashtageja (tai 1-2 max). Facebook-hashtagit tuntuvat roskapostilta.
- Päätä selkeään CTA:han: "Varaa paikkasi," "Hanki liput täältä," "Nähdään siellä."
- Maksimipituus: ~600 merkkiä. Jos alkuperäinen sisältö on jo yksityiskohtaista, muotoile se vain.`,
    },
    outputFormat: {
      en: `OUTPUT FORMAT — Return ONLY valid JSON:
{
  "post": "Facebook post with practical details, links mention, and CTA",
  "linkText": "Suggested link text if the bar has an event page or website",
  "characterCount": "number"
}`,
      fi: `PALAUTUSMUOTO — Palauta VAIN validi JSON:
{
  "post": "Facebook-julkaisu käytännön tiedoilla, linkkimaininnalla ja CTA:lla",
  "linkText": "Ehdotettu linkkiteksti jos baarilla on tapahtumasivu tai nettisivut",
  "characterCount": "number"
}`,
    },
  },
};

// ---------------------------------------------------------------------------
// Content type context — what to emphasize per source type
// ---------------------------------------------------------------------------

type SourceContentType = "promotion" | "event" | "pass";

interface ContentTypeContext {
  instagramFocus: { en: string; fi: string };
  facebookFocus: { en: string; fi: string };
}

const CONTENT_TYPE_CONTEXTS: Record<SourceContentType, ContentTypeContext> = {
  promotion: {
    instagramFocus: {
      en: "SOURCE: Promotion. Focus on the DEAL and the VIBE. Instagram promos need FOMO: the offer won't last, the deal is live now, get it before it's gone. Visual-first: what does the drink/food look like?",
      fi: "LÄHDE: Tarjous. Keskity DIILIIN ja TUNNELMAAN. Instagram-tarjoukset tarvitsevat FOMO:a: tarjous ei kestä ikuisesti, diili on päällä nyt, nappaa ennen kuin loppuu. Visuaalisuus edellä: miltä juoma/ruoka näyttää?",
    },
    facebookFocus: {
      en: "SOURCE: Promotion. Provide the full offer details: what's included, the price, the validity period, any conditions. Facebook users share practical deals — make it easy to forward to a friend.",
      fi: "LÄHDE: Tarjous. Anna täydet tarjoustiedot: mitä sisältyy, hinta, voimassaoloaika, mahdolliset ehdot. Facebook-käyttäjät jakavat käytännön diilejä — tee helpoksi lähettää kaverille.",
    },
  },
  event: {
    instagramFocus: {
      en: "SOURCE: Event. Focus on the EXPERIENCE and the DATE. Instagram event posts need urgency: this Saturday, one night only, limited capacity. Build FOMO around missing it. Visual: what will the room look/feel like?",
      fi: "LÄHDE: Tapahtuma. Keskity KOKEMUKSEEN ja PÄIVÄMÄÄRÄÄN. Instagram-tapahtumapostaukset tarvitsevat kiireellisyyttä: tänä lauantaina, vain yksi ilta, rajoitettu kapasiteetti. Rakenna FOMO:a poisjäämisestä. Visuaalinen: miltä tila tulee näyttämään/tuntumaan?",
    },
    facebookFocus: {
      en: "SOURCE: Event. Provide all event logistics: date, time, location, entry fee, lineup, schedule. Facebook is where people RSVP and share events — give them everything they need to decide and invite friends.",
      fi: "LÄHDE: Tapahtuma. Anna kaikki tapahtumalogistiikka: päivämäärä, aika, paikka, sisäänpääsymaksu, esiintyjät, aikataulu. Facebook on paikka jossa ihmiset RSVP:aa ja jakavat tapahtumia — anna kaikki mitä he tarvitsevat päättääkseen ja kutsuakseen kavereita.",
    },
  },
  pass: {
    instagramFocus: {
      en: "SOURCE: VIP Pass. Focus on the STATUS and the DEAL. Instagram pass posts need aspiration: this is how you do a night out right. Show, don't tell — the pass is the upgrade. ",
      fi: "LÄHDE: VIP-passi. Keskity STATUKSEEN ja DIILIIN. Instagram-passipostaukset tarvitsevat tavoittelua: näin teet illan oikein. Näytä, älä kerro — passi on upgrade.",
    },
    facebookFocus: {
      en: "SOURCE: VIP Pass. Explain the pass clearly: what's included, the price, how to purchase, when it's valid. Facebook users want the practical breakdown before committing.",
      fi: "LÄHDE: VIP-passi. Selitä passi selkeästi: mitä sisältyy, hinta, miten ostaa, milloin voimassa. Facebook-käyttäjät haluavat käytännön erittelyn ennen sitoutumista.",
    },
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface SocialPromptInput {
  /** The bar name for context */
  barName: string;
  /** The content title (event title, promotion headline, pass name) */
  title: string;
  /** The content description (already generated by the AI for the original type) */
  description: string;
  /** What type of content this was originally */
  sourceType: SourceContentType;
  /** Additional details to include (date, price, location, etc.) */
  details?: {
    date?: string;
    time?: string;
    price?: string;
    location?: string;
    link?: string;
  };
  /** Target platform */
  platform: SocialPlatform;
  language?: "en" | "fi";
  tone?: string; // optional: "casual", "energetic", etc. — just passed as context
}

export interface SocialPromptOutput {
  systemPrompt: string;
  userPrompt: string;
  platform: SocialPlatform;
}

/**
 * Build a platform-specific social media prompt from existing content.
 */
export function buildSocialPrompt(
  input: SocialPromptInput,
): SocialPromptOutput {
  const {
    barName,
    title,
    description,
    sourceType,
    details,
    platform,
    language = "en",
    tone,
  } = input;

  const isFi = language === "fi";
  const platformProfile = PLATFORM_PROFILES[platform];
  const contentTypeCtx = CONTENT_TYPE_CONTEXTS[sourceType];

  // ---- Build system prompt ----

  const systemParts: string[] = [];

  // 1. Persona
  systemParts.push(
    isFi
      ? `Olet some-markkinoinnin asiantuntija, joka on erikoistunut Helsingin baari- ja ravintola-alan sisältöön. Muokkaat olemassa olevaa sisältöä ${platformProfile.label}ia varten. Osaat kirjoittaa alustan konventioiden mukaan — Instagramiin rennosti ja visuaalisesti, Facebookiin informatiivisesti ja jaettavasti.`
      : `You are a social media marketing specialist for Helsinki bar and restaurant content. You adapt existing content for ${platformProfile.label}. You know how to write to each platform's conventions — casual and visual for Instagram, informative and shareable for Facebook.`,
  );

  // 2. Platform writing rules
  const platformRules = isFi
    ? platformProfile.writingRules.fi
    : platformProfile.writingRules.en;
  systemParts.push(platformRules);

  // 3. Content type context
  const typeFocus = isFi
    ? contentTypeCtx[platform === "instagram" ? "instagramFocus" : "facebookFocus"].fi
    : contentTypeCtx[platform === "instagram" ? "instagramFocus" : "facebookFocus"].en;
  systemParts.push(typeFocus);

  // 4. Tone hint (if provided)
  if (tone) {
    systemParts.push(
      isFi
        ? `SÄVY: Käytä ${tone} sävyä — sovita se alustan tyyliin.`
        : `TONE: Use a ${tone} voice — adapt it to the platform style.`,
    );
  }

  // 5. Output format
  const outputFormat = isFi
    ? platformProfile.outputFormat.fi
    : platformProfile.outputFormat.en;
  systemParts.push(`\n\n${outputFormat}`);

  // 6. Compliance note
  systemParts.push(
    isFi
      ? "NOUDATA ALKOHOLILAKIA: Älä kannusta liialliseen juomiseen. Keskity viihteeseen, tunnelmaan ja sosiaaliseen kokemukseen juomisen sijaan."
      : "COMPLIANCE: Do not encourage excessive drinking. Focus on entertainment, atmosphere, and social experience rather than alcohol consumption.",
  );

  const systemPrompt = systemParts.join("\n\n");

  // ---- Build user prompt ----

  const detailsBlock = details
    ? [
        details.date ? (isFi ? `Päivämäärä: ${details.date}` : `Date: ${details.date}`) : "",
        details.time ? (isFi ? `Aika: ${details.time}` : `Time: ${details.time}`) : "",
        details.price ? (isFi ? `Hinta: ${details.price}` : `Price: ${details.price}`) : "",
        details.location ? (isFi ? `Paikka: ${details.location}` : `Location: ${details.location}`) : "",
        details.link ? (isFi ? `Linkki: ${details.link}` : `Link: ${details.link}`) : "",
      ]
        .filter(Boolean)
        .join(" | ")
    : "";

  const userPrompt = isFi
    ? `MUOKKAA TÄMÄ SISÄLTÖ ${platformProfile.label.toUpperCase()}ILLE:

Baari: ${barName}
Otsikko: "${title}"
Kuvaus: "${description}"
${detailsBlock ? `Lisätiedot: ${detailsBlock}` : ""}

${platform === "instagram"
      ? "Luo Instagram-teksti joka toimii puhelimen ruudulla. Ensimmäinen rivi on KOUKKU. Käytä rivinvaihtoja. Luo 5-8 relevanttia hashtagia."
      : "Luo Facebook-julkaisu joka sisältää kaikki käytännön tiedot ja on helppo jakaa. Pidempi ja informatiivisempi kuin Instagram-versio."
    }

Palauta VAIN validi JSON. KAIKKI teksti SUOMEKSI.`
    : `ADAPT THIS CONTENT FOR ${platformProfile.label.toUpperCase()}:

Bar: ${barName}
Title: "${title}"
Description: "${description}"
${detailsBlock ? `Details: ${detailsBlock}` : ""}

${platform === "instagram"
      ? "Create an Instagram caption that works on a phone screen. The first line is a HOOK. Use line breaks. Create 5-8 relevant hashtags."
      : "Create a Facebook post that includes all practical details and is easy to share. Longer and more informative than the Instagram version."
    }

Return ONLY valid JSON. Generate ALL content in English.`;

  return { systemPrompt, userPrompt, platform };
}

export { PLATFORM_PROFILES };
