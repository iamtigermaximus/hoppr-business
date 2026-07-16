// src/lib/prompts/build-event-prompt.ts
// ============================================================================
// EVENT PROMPT BUILDER — Type-specific prompt assembly for events.
//
// Events need different AI guidance than promotions. A promotion sells a deal;
// an event sells an experience at a specific date and time. This module builds
// event-optimized system and user prompts that the suggest route can use when
// the contentType is "event".
//
// The event prompt structure (per Gap 12 spec):
//   System: [Compliance rules + tone profile + event writing rules]
//   User:   "Generate a [tone] event description for [event type] at [bar name]
//            in [district]. Event: [title], [date] at [time], [entry fee if any].
//            Features: [special guests], [themes].
//            Bar context: [bar hooks].
//            Include: date/time, what to expect, entry info, RSVP CTA.
//            Format: [platform rules for event cards]."
// ============================================================================

import type { ContentTone } from "./tone-voices";
import { getTonePromptBlock } from "./tone-voices";
import {
  buildBarHooksBlock,
  type BarHookContext,
} from "./bar-hooks";
import { getSynergyInstructions } from "./synergy-rules";

// ---------------------------------------------------------------------------
// Event type profiles — writing guidance for each event category
// ---------------------------------------------------------------------------

export type EventCategory =
  | "LIVE_MUSIC"
  | "DJ_NIGHT"
  | "QUIZ_NIGHT"
  | "SPORTS_SCREENING"
  | "TASTING"
  | "PRIVATE_PARTY"
  | "OPEN_MIC"
  | "KARAOKE"
  | "THEME_NIGHT"
  | "COMEDY_NIGHT"
  | "OTHER";

interface EventTypeProfile {
  label: { en: string; fi: string };
  /** Injected into the system prompt — how to write about this type of event */
  writingRules: { en: string; fi: string };
  /** Key fields to extract from the user's brief */
  keyFields: string[];
}

const EVENT_TYPE_PROFILES: Record<EventCategory, EventTypeProfile> = {
  LIVE_MUSIC: {
    label: { en: "Live Music", fi: "Elävä musiikki" },
    writingRules: {
      en: `EVENT TYPE — Live Music:
The performer IS the headline. Lead with the artist/band name and genre. Describe the sound, the stage presence, what the room will feel like. Mention: set times, supporting acts, the sound system. Build anticipation around the performance — the bar is the venue, the music is the reason to come. Use sensory language: the first chord, the bass resonating, the crowd's reaction.`,

      fi: `TAPAHTUMATYYPPI — Elävä musiikki:
Esiintyjä ON otsikko. Aloita artistin/bändin nimellä ja genrellä. Kuvaile soundia, lavakarismaa, miltä tila tuntuu. Mainitse: settiajat, lämppärit, äänentoisto. Rakenna odotusta esityksen ympärille — baari on tapahtumapaikka, musiikki on syy tulla. Käytä aistikieltä: ensimmäinen sointu, basson resonointi, yleisön reaktio.`,
    },
    keyFields: ["performer", "genre", "setTime", "entryFee", "supportingActs"],
  },

  DJ_NIGHT: {
    label: { en: "DJ Night", fi: "DJ-ilta" },
    writingRules: {
      en: `EVENT TYPE — DJ Night:
The selector sets the mood. Lead with the DJ name and style/genre (house, techno, hip-hop, disco, open format). Describe the energy curve of the night — warm-up sets building to peak hours. Mention: the sound system, the dance floor, the lighting. Time anchors matter: doors open, warm-up DJ, headliner, after-hours. The bar transforms after dark — write about that transformation.`,

      fi: `TAPAHTUMATYYPPI — DJ-ilta:
Valitsija luo tunnelman. Aloita DJ:n nimellä ja tyylillä/genrellä (house, techno, hip-hop, disco, open format). Kuvaile illan energiakäyrää — lämmittelystä huipputunteihin. Mainitse: äänentoisto, tanssilattia, valaistus. Aika ankkuroi: ovet auki, lämppäri-DJ, pääesiintyjä, after-hours. Baari muuttuu pimeän tullen — kirjoita siitä muodonmuutoksesta.`,
    },
    keyFields: ["djName", "genre", "startTime", "entryFee", "dressCode"],
  },

  QUIZ_NIGHT: {
    label: { en: "Quiz Night", fi: "Tietovisa" },
    writingRules: {
      en: `EVENT TYPE — Quiz Night:
Team competition energy. Lead with the format: trivia topics, team size, round structure. Mention: the host/quizmaster, the prize, the bragging rights. Write to groups — the quiz is a social experience first, a competition second. Humor and banter welcome. Practical details: sign-up time, quiz start, duration. The bar provides the atmosphere; the quiz provides the occasion.`,

      fi: `TAPAHTUMATYYPPI — Tietovisa:
Joukkuekilpailun energiaa. Aloita formaatilla: aihealueet, joukkuekoko, kierrosrakenne. Mainitse: juontaja/visamestari, palkinto, kerskumisoikeudet. Kirjoita ryhmille — visa on ensisijaisesti sosiaalinen kokemus, toissijaisesti kilpailu. Huumori ja läppä sallittu. Käytännön tiedot: ilmoittautumisaika, visan alku, kesto. Baari tarjoaa tunnelman; visa tarjoaa tilaisuuden.`,
    },
    keyFields: ["quizTopic", "teamSize", "startTime", "prize", "entryFee"],
  },

  SPORTS_SCREENING: {
    label: { en: "Sports Screening", fi: "Urheilulähetys" },
    writingRules: {
      en: `EVENT TYPE — Sports Screening:
The game is the main event. Lead with the matchup: who's playing, what's at stake. Mention: the screens, the sound, the crowd reactions. Big-match energy — write like the bar is the next best thing to being in the stadium. Practical details: kickoff time, arrive early for good seats, drink specials during the game. The communal viewing experience is the draw — strangers become teammates for 90 minutes.`,

      fi: `TAPAHTUMATYYPPI — Urheilulähetys:
Peli on pääesiintyjä. Aloita ottelulla: kuka pelaa, mitä vaakalaudalla. Mainitse: ruudut, äänet, yleisön reaktiot. Isot pelit -energiaa — kirjoita kuin baari olisi paras paikka stadionin jälkeen. Käytännön tiedot: aloitusaika, tule ajoissa hyville paikoille, juomatarjoukset pelin aikana. Yhteisöllinen katsomiskokemus on vetonaula — tuntemattomista tulee joukkuetovereita 90 minuutiksi.`,
    },
    keyFields: ["matchup", "kickoffTime", "sport", "entryFee"],
  },

  TASTING: {
    label: { en: "Tasting", fi: "Maistelu" },
    writingRules: {
      en: `EVENT TYPE — Tasting:
Knowledge as experience. Lead with what's being tasted: whiskey flight, wine pairing, craft beer sampling, cocktail masterclass. Mention: the expert/host guiding the session, the selection, what you'll learn. Educational but never lecturing — the pleasure of tasting is primary. Sensory detail: aroma, palate, finish, pairing notes. Limited spots create exclusivity. Price includes the tasting — frame as value, not cost.`,

      fi: `TAPAHTUMATYYPPI — Maistelu:
Tieto kokemuksena. Aloita sillä mitä maistellaan: viskilennosto, viiniparitus, käsityöolutmaistelu, cocktail-mestarikurssi. Mainitse: asiantuntija/juontaja, valikoima, mitä opit. Opetuksellinen mutta ei koskaan luennoiva — maistamisen ilo on ensisijaista. Aistikieltä: tuoksu, maku, jälkimaku, paritushuomiot. Rajoitetut paikat luovat eksklusiivisuutta. Hinta sisältää maistelun — kehystä arvona, ei kuluna.`,
    },
    keyFields: ["tastingTheme", "host", "startTime", "price", "spotsAvailable"],
  },

  PRIVATE_PARTY: {
    label: { en: "Private Party", fi: "Yksityistilaisuus" },
    writingRules: {
      en: `EVENT TYPE — Private Party:
Exclusive and personal. Lead with the occasion: birthday, corporate event, launch party, reunion. Mention: the private area, dedicated service, customizable experience. The bar hosts — the guest of honor is the star. Write with the confidence of a venue that handles special occasions. Details matter: capacity, catering options, AV setup, booking process. `,

      fi: `TAPAHTUMATYYPPI — Yksityistilaisuus:
Eksklusiivinen ja henkilökohtainen. Aloita tilaisuudella: syntymäpäivät, yritystilaisuus, lanseerausjuhlat, luokkakokous. Mainitse: yksityistila, omistautunut palvelu, räätälöitävä kokemus. Baari isännöi — kunniavieras on tähti. Kirjoita sen paikan itsevarmuudella joka hoitaa erityistilaisuuksia. Yksityiskohdat merkitsevät: kapasiteetti, tarjoiluvaihtoehdot, AV-laitteisto, varausprosessi.`,
    },
    keyFields: ["occasion", "guestCount", "date", "requirements"],
  },

  OPEN_MIC: {
    label: { en: "Open Mic", fi: "Avoin mikki" },
    writingRules: {
      en: `EVENT TYPE — Open Mic:
Anything can happen. Lead with the format: comedy, poetry, music, mixed bill. Mention: sign-up process, time slots, the supportive crowd. The charm is in the unpredictability — some acts will be polished, others raw, all genuine. Write with warmth and encouragement. The bar provides the stage; the community provides the talent. `,

      fi: `TAPAHTUMATYYPPI — Avoin mikki:
Mitä tahansa voi tapahtua. Aloita formaatilla: stand-up, runous, musiikki, sekalainen kattaus. Mainitse: ilmoittautuminen, aikavälit, kannustava yleisö. Viehätys on ennakoimattomuudessa — jotkut esitykset ovat hiottuja, toiset raakoja, kaikki aitoja. Kirjoita lämmöllä ja rohkaisulla. Baari tarjoaa lavan; yhteisö tarjoaa lahjakkuuden.`,
    },
    keyFields: ["format", "signUpTime", "startTime", "entryFee"],
  },

  KARAOKE: {
    label: { en: "Karaoke", fi: "Karaoke" },
    writingRules: {
      en: `EVENT TYPE — Karaoke:
Everyone's a star tonight. Lead with the energy: the songbook, the brave first singer, the crowd that cheers for everyone. Mention: song selection, the host/MC, drink specials for performers. Write with infectious enthusiasm — karaoke is about participation, not perfection. The bar becomes a stage; every person in the room is a potential headliner.`,

      fi: `TAPAHTUMATYYPPI — Karaoke:
Kaikki ovat tähtiä tänään. Aloita energialla: laulukirja, rohkea ensimmäinen laulaja, yleisö joka hurraa kaikille. Mainitse: kappalevalikoima, juontaja, esiintyjien juomatarjoukset. Kirjoita tarttuvalla innostuksella — karaoke on osallistumisesta, ei täydellisyydestä. Baarista tulee lava; jokainen huoneessa on potentiaalinen pääesiintyjä.`,
    },
    keyFields: ["startTime", "entryFee", "host"],
  },

  THEME_NIGHT: {
    label: { en: "Theme Night", fi: "Teemailta" },
    writingRules: {
      en: `EVENT TYPE — Theme Night:
The bar transforms for one night. Lead with the theme: 80s retro, tropical luau, masquerade, black & white. Mention: dress code, decorations, themed drinks, the playlist. The fun is in committing to the concept — everyone playing along is part of the experience. Write with theatrical energy. The more specific the theme, the richer the copy.`,

      fi: `TAPAHTUMATYYPPI — Teemailta:
Baari muuttuu yhdeksi illaksi. Aloita teemalla: 80-luvun retro, trooppinen luau, naamiaiset, mustavalkoinen. Mainitse: pukukoodi, koristelut, teemajuomat, soittolista. Hauskuus on konseptiin heittäytymisessä — jokainen joka lähtee mukaan on osa kokemusta. Kirjoita teatterillisella energialla. Mitä tarkempi teema, sitä rikkaampi teksti.`,
    },
    keyFields: ["theme", "dressCode", "startTime", "entryFee"],
  },

  COMEDY_NIGHT: {
    label: { en: "Comedy Night", fi: "Komediailta" },
    writingRules: {
      en: `EVENT TYPE — Comedy Night:
Laughter is the headliner. Lead with the comedians: names, styles, credentials. Mention: the format (showcase, headliner + openers, open mic), the intimate room setup, the timing. Comedy lives in the room — write about the shared experience of a crowd laughing together. Drinks and atmosphere support the show; the talent is the reason to book.`,

      fi: `TAPAHTUMATYYPPI — Komediailta:
Nauru on pääesiintyjä. Aloita koomikoilla: nimet, tyylit, meriitit. Mainitse: formaatti (showcase, pääesiintyjä + lämppärit, avoin mikki), intiimi tila, ajoitus. Komedia elää huoneessa — kirjoita jaetusta kokemuksesta kun yleisö nauraa yhdessä. Juomat ja tunnelma tukevat shown'ta; lahjakkuus on syy varata.`,
    },
    keyFields: ["comedians", "format", "startTime", "entryFee"],
  },

  OTHER: {
    label: { en: "Special Event", fi: "Erikoistapahtuma" },
    writingRules: {
      en: `EVENT TYPE — Special Event:
A one-off experience unique to this venue. Lead with what makes it special: the concept, the occasion, the limited nature. Write with curiosity and invitation — the reader should feel like they've discovered something. Details anchor the uniqueness: date, time, what's included, why this night is different from every other night.`,

      fi: `TAPAHTUMATYYPPI — Erikoistapahtuma:
Ainutlaatuinen kokemus juuri tälle paikalle. Aloita siitä mikä tekee siitä erityisen: konsepti, tilaisuus, rajoitettu luonne. Kirjoita uteliaisuudella ja kutsulla — lukijan tulee tuntea löytäneensä jotain. Yksityiskohdat ankkuroivat ainutlaatuisuuden: päivämäärä, aika, mitä sisältyy, miksi tämä ilta on erilainen kuin jokainen muu ilta.`,
    },
    keyFields: ["concept", "date", "time", "entryFee"],
  },
};

// ---------------------------------------------------------------------------
// Event context hooks — temporal + atmospheric framing specific to events
// ---------------------------------------------------------------------------

const EVENT_CONTEXT_HOOKS: Record<string, { en: string; fi: string }> = {
  weekend: {
    en: "EVENT CONTEXT — Weekend: The calendar is open, the crowd is ready. Weekend events compete with every other plan in the city — write like this is THE plan. Peak energy. The event is the destination, not a stop along the way.",
    fi: "TAPAHTUMAKONTEKSTI — Viikonloppu: Kalenteri on auki, yleisö on valmis. Viikonlopun tapahtumat kilpailevat jokaisen muun suunnitelman kanssa — kirjoita kuin tämä ON se suunnitelma. Huippuenergiaa. Tapahtuma on määränpää, ei pysäkki matkalla.",
  },
  weekday: {
    en: "EVENT CONTEXT — Weekday: A reason to go out on a Tuesday. Weekday events are special because they're unexpected — the bar is creating an occasion where there wasn't one. Frame as: 'This is worth a weeknight.' Practical details matter: timing so people can still get home at a reasonable hour.",
    fi: "TAPAHTUMAKONTEKSTI — Arki-ilta: Syy lähteä ulos tiistaina. Arki-illan tapahtumat ovat erityisiä koska ne ovat odottamattomia — baari luo tilaisuuden siellä missä sellaista ei ollut. Kehystä: 'Tämä on arki-illan arvoinen.' Käytännön tiedot merkitsevät: ajoitus niin että ihmiset ehtivät vielä kotiin järkevään aikaan.",
  },
  summer: {
    en: "EVENT CONTEXT — Summer: Long days, terraces, outdoor energy. Summer events leverage the light and the warmth. Mention: sunset timing, outdoor spaces, the seasonal feel. Summer in Finland is fleeting — events feel more urgent because the season is short.",
    fi: "TAPAHTUMAKONTEKSTI — Kesä: Pitkät päivät, terassit, ulkoilmaenergia. Kesätapahtumat hyödyntävät valoa ja lämpöä. Mainitse: auringonlaskun aika, ulkotilat, sesongin tuntu. Suomen kesä on lyhyt — tapahtumat tuntuvat kiireellisemmiltä koska kausi on lyhyt.",
  },
  winter: {
    en: "EVENT CONTEXT — Winter: The bar as warm refuge. Winter events sell the contrast: cold and dark outside, warm and alive inside. Mention: the coziness, the escape from weather, the sense of hunkering down together. Hot drinks, warm lighting, intimate atmosphere.",
    fi: "TAPAHTUMAKONTEKSTI — Talvi: Baari lämpimänä turvapaikkana. Talvitapahtumat myyvät kontrastia: ulkona kylmää ja pimeää, sisällä lämmintä ja elävää. Mainitse: kodikkuus, pako säästä, yhdessä oleilun tunne. Kuumat juomat, lämmin valaistus, intiimi tunnelma.",
  },
};

// ---------------------------------------------------------------------------
// Event-specific bar hooks — details that matter for events but not promos
// ---------------------------------------------------------------------------

function getEventBarHooks(
  bar: BarHookContext & { vipEnabled?: boolean },
  language: "en" | "fi",
): string[] {
  const hooks: string[] = [];
  const isFi = language === "fi";

  // Add event-specific hooks based on bar attributes
  if (bar.amenities) {
    const amenitySet = new Set(bar.amenities.map((a) => a.toLowerCase()));

    // Sound system — relevant for music/DJ events
    if (amenitySet.has("sound system") || amenitySet.has("dj booth") || amenitySet.has("live music")) {
      hooks.push(
        isFi
          ? "TAPAHTUMAKOHTEET — Äänentoisto: Tässä baarissa on kunnon äänentoisto. Mainitse miten tila on suunniteltu musiikille — akustiikka, äänenlaatu, tanssilattian ja lavan suhde."
          : "EVENT HOOK — Sound: This bar has a proper sound system. Mention how the room is built for music — the acoustics, the sound quality, the relationship between stage and dance floor.",
      );
    }

    // Capacity framing — relevant for ticketed events
    if (amenitySet.has("large capacity") || bar.type === "NIGHTCLUB") {
      hooks.push(
        isFi
          ? "TAPAHTUMAKOHTEET — Kapasiteetti: Iso tila isolla energialla. Mainitse miten tila täyttyy — suuri yleisö, kollektiivinen energia, yhteisöllinen kokemus."
          : "EVENT HOOK — Capacity: A big room with big energy. Mention how the space fills up — the scale of the crowd, the collective energy, the shared experience of a full house.",
      );
    } else if (amenitySet.has("intimate") || bar.type === "WINE_BAR" || bar.type === "LOUNGE") {
      hooks.push(
        isFi
          ? "TAPAHTUMAKOHTEET — Intiimi tila: Pieni tila tarkoittaa läheistä kokemusta. Mainitse miten rajoitettu kapasiteetti tekee tapahtumasta erityisen — jokainen paikka on eturivissä. Kehota varaamaan ajoissa."
          : "EVENT HOOK — Intimate space: A small room means an up-close experience. Mention how limited capacity makes the event special — every seat is a front-row seat. Encourage early booking.",
      );
    }

    // Reservations / booking
    if (amenitySet.has("reservations") || amenitySet.has("private rooms")) {
      hooks.push(
        isFi
          ? "TAPAHTUMAKOHTEET — Varaukset: Pöytävaraukset ja yksityistilat saatavilla. Mainitse varausvaihtoehdot luontevasti — miten varmistaa paikka, mitä paketit sisältävät."
          : "EVENT HOOK — Reservations: Table bookings and private areas available. Mention reservation options naturally — how to secure a spot, what packages include.",
      );
    }
  }

  // VIP capability
  if (bar.vipEnabled) {
    hooks.push(
      isFi
        ? "TAPAHTUMAKOHTEET — VIP: VIP-palvelut käytössä. Mainitse: skip-the-line, pullopalvelu, varatut pöydät, oma sisäänkäynti. VIP tekee tapahtumasta kohotetun kokemuksen."
        : "EVENT HOOK — VIP: VIP services available. Mention: skip-the-line, bottle service, reserved tables, dedicated entrance. VIP makes the event an elevated experience.",
    );
  }

  return hooks;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface EventPromptInput {
  barName: string;
  barType: string;
  district?: string;
  cityName?: string;
  amenities?: string[];
  priceRange?: string;
  description?: string;
  musicTags?: string[];
  vipEnabled?: boolean;
  userBrief: string;
  tone?: ContentTone;
  language?: "en" | "fi";
  /** If the AI already inferred an event category, pass it for specialized rules */
  eventCategory?: EventCategory;
  /** If the user specified context labels (weekend, summer, etc.) */
  contextLabels?: string[];
}

export interface EventPromptOutput {
  systemPrompt: string;
  userPrompt: string;
  /** The event category used (inferred or explicit) */
  eventCategory: EventCategory;
}

/**
 * Build event-optimized system and user prompts.
 *
 * The system prompt contains compliance rules + tone voice + event writing
 * guidance + event-type-specific rules. The user prompt contains the bar
 * context, the staff member's brief, and extraction instructions.
 */
export function buildEventPrompt(input: EventPromptInput): EventPromptOutput {
  const {
    barName,
    barType,
    district,
    cityName,
    amenities,
    priceRange,
    description,
    musicTags,
    vipEnabled,
    userBrief,
    tone,
    language = "en",
    eventCategory: explicitCategory,
    contextLabels,
  } = input;

  const isFi = language === "fi";
  const category = explicitCategory || "OTHER";
  const profile = EVENT_TYPE_PROFILES[category];

  // ---- Build system prompt ----

  const systemParts: string[] = [];

  // 1. Senior event copywriter persona
  systemParts.push(
    isFi
      ? `Olet kokenut tapahtumamarkkinoinnin copywriter, joka on erikoistunut baari- ja yöelämätapahtumiin Helsingissä. Kirjoitat tapahtumakuvauksia jotka saavat ihmiset merkkaamaan kalenteriin ja ostamaan liput. Tiedät miten tapahtumat eroavat tarjouksista: tapahtuma myy KOKEMUSTA tiettynä ajankohtana, ei diiliä.`
      : `You are a senior event marketing copywriter specializing in bar and nightlife events in Helsinki. You write event descriptions that make people mark their calendars and buy tickets. You understand how events differ from promotions: an event sells an EXPERIENCE at a specific moment in time, not a deal.`,
  );

  // 2. Event writing rules (platform-level, not type-specific)
  systemParts.push(
    isFi
      ? `TAPAHTUMAN KIRJOITUSSÄÄNNÖT:
- Johda otsikolla — sen on kerrottava MITÄ ja MILLOIN yhdellä silmäyksellä
- Rakenna odotusta — anna lukijan kuvitella olevansa siellä
- Aika ja päivämäärä ovat keskeisiä — ne ankkuroivat tapahtuman todellisuuteen
- Mainitse sisäänpääsymaksu ja ilmoittautuminen luontevasti — älä piilota niitä
- Päätä toimintakehotukseen: varaa paikka, osta lippu, ilmesty paikalle
- Tapahtumakuvaukset voivat olla pidempiä kuin tarjoustekstit — 2-3 lausetta on ok
- Keskity viihteeseen (musiikki, pelit, tunnelma) juomisen sijaan — Alkoholilain mukainen`
      : `EVENT WRITING RULES:
- Lead with the headline — it should tell WHAT and WHEN at a glance
- Build anticipation — make the reader imagine being there
- Date and time are critical — they anchor the event in reality
- Mention entry fee and registration naturally — don't hide them
- Close with a call to action: reserve a spot, buy a ticket, show up
- Event descriptions can be longer than promotion copy — 2-3 sentences is ok
- Focus on the entertainment (music, games, atmosphere) rather than drinking — Finland-compliant`,
  );

  // 3. Event type writing rules
  const typeRules = isFi ? profile.writingRules.fi : profile.writingRules.en;
  systemParts.push(typeRules);

  // 4. Tone voice rules (if a tone is selected)
  if (tone) {
    const toneBlock = getTonePromptBlock(tone, language);
    if (toneBlock) systemParts.push(toneBlock);
  }

  // 5. Synergy instructions (if context labels provided)
  if (tone && contextLabels && contextLabels.length > 0) {
    const synergies = getSynergyInstructions(tone, "Live Music", contextLabels, language);
    for (const s of synergies) {
      systemParts.push(s);
    }
  }

  // 6. Seasonal / temporal context
  const month = new Date().getMonth();
  let seasonalKey = "weekday";
  if (month >= 5 && month <= 7) seasonalKey = "summer";
  else if (month >= 9 && month <= 10) seasonalKey = "weekday";
  else if (month >= 11 || month <= 1) seasonalKey = "winter";

  const dayOfWeek = new Date().getDay();
  if (dayOfWeek === 5 || dayOfWeek === 6) seasonalKey = "weekend";

  const eventContext = EVENT_CONTEXT_HOOKS[seasonalKey];
  if (eventContext) {
    systemParts.push(isFi ? eventContext.fi : eventContext.en);
  }

  // 7. Output format specification
  systemParts.push(
    isFi
      ? `\n\nPALAUTUSMUOTO — Palauta VAIN validi JSON, ei muuta tekstiä:
{
  "title": "Kiinnostava tapahtuman otsikko (max 60 merkkiä, kerro MITÄ ja MILLOIN)",
  "description": "Tapahtumakuvaus (max 250 merkkiä) — rakenna odotusta, sisällytä aika/paikka/hinta",
  "startTime": "ISO date-time (päättele tekstistä tai ehdota sopivaa ajankohtaa)",
  "endTime": "ISO date-time or null",
  "entryFee": "string tai null (esim. '15€', 'Free entry', '5€ ennakkoon / 8€ ovelta')",
  "maxAttendees": "number tai null (jos tapahtumalla on kapasiteettiraja)",
  "isPrivate": "boolean",
  "eventCategory": "${category}",
  "imageSuggestion": "Yksi: live-music | dj-night | party | bar-ambiance | outdoor-terrace | special-offer | quiz | sports",
  "reasoning": "Lyhyt selitys siitä miten tulkitsit toiveen"
}`
      : `\n\nOUTPUT FORMAT — Return ONLY valid JSON, no other text:
{
  "title": "Catchy event title (max 60 chars, tell WHAT and WHEN)",
  "description": "Event description (max 250 chars) — build anticipation, include time/place/price",
  "startTime": "ISO date-time (infer from text or suggest a reasonable time)",
  "endTime": "ISO date-time or null",
  "entryFee": "string or null (e.g. '€15', 'Free entry', '€5 advance / €8 door')",
  "maxAttendees": "number or null (if the event has a capacity limit)",
  "isPrivate": "boolean",
  "eventCategory": "${category}",
  "imageSuggestion": "One of: live-music | dj-night | party | bar-ambiance | outdoor-terrace | special-offer | quiz | sports",
  "reasoning": "Brief explanation of how you interpreted the request"
}`,
  );

  const systemPrompt = systemParts.join("\n\n");

  // ---- Build user prompt ----

  const barContext = isFi
    ? [
        `Baarin nimi: ${barName}`,
        `Tyyppi: ${barType}`,
        district ? `Alue: ${district}, ${cityName || ""}` : "",
        priceRange ? `Hintataso: ${priceRange}` : "",
        amenities?.length ? `Palvelut: ${amenities.join(", ")}` : "",
        description ? `Kuvaus: ${description}` : "",
        musicTags?.length ? `Musiikkityylit: ${musicTags.join(", ")}` : "",
        vipEnabled ? "VIP-palvelut käytössä" : "",
      ]
        .filter(Boolean)
        .join("\n")
    : [
        `Bar name: ${barName}`,
        `Type: ${barType}`,
        district ? `Location: ${district}, ${cityName || ""}` : "",
        priceRange ? `Price range: ${priceRange}` : "",
        amenities?.length ? `Amenities: ${amenities.join(", ")}` : "",
        description ? `Description: ${description}` : "",
        musicTags?.length ? `Music tags: ${musicTags.join(", ")}` : "",
        vipEnabled ? "VIP services available" : "",
      ]
        .filter(Boolean)
        .join("\n");

  // Add bar hooks
  const barHookContext: BarHookContext = {
    type: barType,
    district,
    amenities,
    priceRange,
    musicTags,
  };
  const hooksBlock = buildBarHooksBlock(barHookContext, language);

  // Add event-specific hooks
  const eventHooks = getEventBarHooks(
    { ...barHookContext, vipEnabled },
    language,
  );
  const eventHooksBlock =
    eventHooks.length > 0
      ? (isFi ? "\n\nTAPAHTUMAKOHTEET:\n" : "\n\nEVENT HOOKS:\n") +
        eventHooks
          .map((h) => `• ${h}`)
          .join("\n")
      : "";

  const userPrompt = isFi
    ? `${barName}n henkilökunta haluaa luoda TAPAHTUMAN ja kuvaili sen näin:

"${userBrief}"

${barContext}${hooksBlock}${eventHooksBlock}

Päivämäärä tänään: ${new Date().toISOString()}

Analysoi kuvaus. Päättele tapahtuman tyyppi (${Object.values(EVENT_TYPE_PROFILES)
        .map((p) => p.label.fi)
        .join(", ")}). Poimi päivämäärä, kellonaika, esiintyjät, pääsymaksu ja muut olennaiset tiedot. Jos kellonaikaa tai päivämäärää ei mainita, ehdota sopivaa (tapahtumat alkavat tyypillisesti klo 19-22, DJ-illat klo 21-23).

Luo 3 täysin erilaista varianttia — jokaisella eri otsikko, eri kuvakulma, eri energia. Palauta paras.

KAIKKI teksti SUOMEKSI. Älä kopioi englanninkielistä tekstiä.`
    : `A bar staff member at ${barName} wants to create an EVENT and described it like this:

"${userBrief}"

${barContext}${hooksBlock}${eventHooksBlock}

Current date: ${new Date().toISOString()}

Analyze the description. Determine the event type (${Object.values(EVENT_TYPE_PROFILES)
        .map((p) => p.label.en)
        .join(", ")}). Extract date, time, performers, entry fee, and all relevant details. If time or date aren't specified, suggest reasonable defaults (events typically start 7-10pm, DJ nights 9-11pm).

Generate 3 completely different variants — each with a different headline, angle, and energy. Return the best one.

Generate ALL content in English.`;

  return { systemPrompt, userPrompt, eventCategory: category };
}

/**
 * Infer the event category from the user's brief text.
 * Simple keyword matching — the AI will refine this in its response.
 */
export function inferEventCategory(brief: string): EventCategory {
  const lower = brief.toLowerCase();

  if (/dj\b|dj set|deejay|electronic|house music|techno|disco/.test(lower)) return "DJ_NIGHT";
  if (/live music|live band|concert|gig|acoustic|solo act|performing live/.test(lower)) return "LIVE_MUSIC";
  if (/quiz|trivia|pub quiz|tietovisa|visa/.test(lower)) return "QUIZ_NIGHT";
  if (/sports|screening|match|game on|watching|cups|champions|f1|hockey|football|jääkiekko|urheilu/.test(lower)) return "SPORTS_SCREENING";
  if (/tasting|flight|sampling|masterclass|whiskey|wine pairing|maistelu|maistajais/.test(lower)) return "TASTING";
  if (/private party|birthday|corporate|launch|reunion|yksityis|synttärit|syntymäpäiv/.test(lower)) return "PRIVATE_PARTY";
  if (/open mic|open stage|avoin mikki|avoin lava/.test(lower)) return "OPEN_MIC";
  if (/karaoke/.test(lower)) return "KARAOKE";
  if (/comedy|stand-up|standup|open mic comedy/.test(lower)) return "COMEDY_NIGHT";
  if (/theme|themed|costume|dress up|pukukoodi|teema/.test(lower)) return "THEME_NIGHT";

  return "OTHER";
}

export { EVENT_TYPE_PROFILES };
