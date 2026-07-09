// src/lib/prompts/bar-hooks.ts
// ============================================================================
// BAR HOOKS — Turns bar attributes into creative material the LLM can use.
//
// Instead of just listing facts ("Type: COCKTAIL_BAR, District: Kallio"),
// this generates actionable hooks: "Mention the terrace at sunset", "Reference
// the Kallio creative crowd", "Work in the craft cocktail expertise."
//
// These hooks don't replace the tone/template/synergy pipeline — they give
// it specific, concrete material to express THROUGH that voice.
// ============================================================================

// ---------------------------------------------------------------------------
// Type-specific hooks
// ---------------------------------------------------------------------------

const TYPE_HOOKS: Record<string, { en: string[]; fi: string[] }> = {
  PUB: {
    en: [
      "This is a PUB — write with the warmth of a neighborhood institution. The regulars know the bar by name. Casual, unpretentious, dependable.",
      "PUB energy — it's the local. Mention: familiar faces, the usual, your spot, the kind of place where the bartender remembers your order.",
    ],
    fi: [
      "Tämä on PUB — kirjoita korttelipaikan lämmöllä. Vakiokävijät tuntevat baarin nimeltä. Rento, mutkaton, luotettava.",
      "PUB-energia — se on se oma lähikuppila. Mainitse: tutut naamat, se perus, sun vakiopaikka, sellainen mesta jossa baarimikko muistaa sun tilauksen.",
    ],
  },
  COCKTAIL_BAR: {
    en: [
      "This is a COCKTAIL BAR — craftsmanship matters. Mention: the pour, the shake, the garnish, the menu. Every drink is considered. Reference the expertise behind the bar.",
      "COCKTAIL BAR — the bar is a stage for the bartender. Mention: house creations, seasonal ingredients, the ritual of a well-made drink. Knowledge is part of the experience.",
    ],
    fi: [
      "Tämä on COCKTAIL-BAARI — käsityö on keskiössä. Mainitse: kaato, ravistus, koriste, menu. Jokainen juoma on harkittu. Viittaa baaritiskin takana olevaan osaamiseen.",
      "COCKTAIL-BAARI — baaritiski on baarimikon lava. Mainitse: talon luomukset, kauden raaka-aineet, hyvin tehdyn juoman rituaali. Tieto on osa kokemusta.",
    ],
  },
  NIGHTCLUB: {
    en: [
      "This is a NIGHTCLUB — energy is everything. Mention: the sound system, the dance floor, the lights, the DJ. Night-crowd energy. Lost in the music.",
      "NIGHTCLUB — it's about the night. Mention: late hours, the beat, the crowd moving as one, the darkness and the lights. Transformative after midnight.",
    ],
    fi: [
      "Tämä on YÖKERHO — energia on kaikki. Mainitse: äänentoisto, tanssilattia, valot, DJ. Yöyleisön energia. Hukassa musiikkiin.",
      "YÖKERHO — kyse on yöstä. Mainitse: myöhäiset tunnit, biitti, yleisö joka liikkuu yhtenä, pimeys ja valot. Muodonmuutos keskiyön jälkeen.",
    ],
  },
  SPORTS_BAR: {
    en: [
      "This is a SPORTS BAR — the game is the main event. Mention: screens, the match, the atmosphere when the goal hits. Team energy. Shared reactions.",
      "SPORTS BAR — competition fuels the room. Mention: game day, the big screen, cheering together, the tension before the whistle, the celebration after.",
    ],
    fi: [
      "Tämä on SPORTS BAR — peli on pääesiintyjä. Mainitse: ruudut, matsi, tunnelma kun maali osuu. Joukkue-energiaa. Jaettuja reaktioita.",
      "SPORTS BAR — kilpailu ruokkii huoneen. Mainitse: pelipäivä, iso ruutu, yhdessä hurraaminen, jännitys ennen vihellystä, juhla sen jälkeen.",
    ],
  },
  WINE_BAR: {
    en: [
      "This is a WINE BAR — curation matters. Mention: the selection, the vintage, the pairing, the knowledge. Each glass has a story. Write with the authority of someone who knows wine but doesn't lecture.",
    ],
    fi: [
      "Tämä on VIINIBAARI — kuratointi on keskiössä. Mainitse: valikoima, vuosikerta, suositus, tieto. Jokaisella lasilla on tarina. Kirjoita viiniä tuntevan auktoriteetilla, ei luennoiden.",
    ],
  },
  LOUNGE: {
    en: [
      "This is a LOUNGE — comfort meets style. Mention: deep seats, low lighting, the soundtrack, the unhurried pace. A place to settle in, not rush through. Conversation is the main event.",
    ],
    fi: [
      "Tämä on LOUNGE — mukavuus kohtaa tyylin. Mainitse: syvät istuimet, matala valaistus, soundtrack, kiireetön tahti. Paikka asettua, ei kiirehtiä läpi. Keskustelu on pääesiintyjä.",
    ],
  },
};

/** Default hooks for bar types not explicitly mapped. */
const DEFAULT_TYPE_HOOKS = {
  en: ["This bar has its own character — write with personality. Specific details over generic bar descriptions. What makes THIS place different from the one next door?"],
  fi: ["Tällä baarilla on oma luonteensa — kirjoita persoonalla. Tarkkoja yksityiskohtia geneeristen baarikuvausten sijaan. Mikä tekee TÄSTÄ paikasta erilaisen kuin naapurista?"],
};

// ---------------------------------------------------------------------------
// District-specific hooks (Helsinki neighborhoods)
// ---------------------------------------------------------------------------

const DISTRICT_HOOKS: Record<string, { en: string[]; fi: string[] }> = {
  Kallio: {
    en: [
      "Kallio — Helsinki's creative and bohemian heart. Mention: the neighborhood's independent spirit, the bar-heavy streets, the crowd that values character over polish. This isn't the city center — it's better.",
    ],
    fi: [
      "Kallio — Helsingin luova ja boheemi sydän. Mainitse: kaupunginosan itsenäinen henki, baarien täyttämät kadut, porukka joka arvostaa luonnetta kiillotuksen sijaan. Tämä ei ole keskusta — se on parempi.",
    ],
  },
  Kamppi: {
    en: [
      "Kamppi — central, connected, always moving. Mention: the convenience, the after-work flow, the crossroads energy. People come through Kamppi because everything happens here.",
    ],
    fi: [
      "Kamppi — keskeinen, yhteyksien äärellä, aina liikkeessä. Mainitse: helppo tulla, after-work-virta, risteyskohtaenergia. Ihmiset kulkevat Kampin kautta koska kaikki tapahtuu täällä.",
    ],
  },
  Punavuori: {
    en: [
      "Punavuori — Helsinki's design district. Mention: the style-conscious crowd, the boutiques, the galleries, the sense that this neighborhood cares about how things look and feel. Trend-aware but never trying too hard.",
    ],
    fi: [
      "Punavuori — Helsingin design-kortteli. Mainitse: tyylitietoinen porukka, putiikit, galleriat, tunne että tämä kaupunginosa välittää siitä miltä asiat näyttävät ja tuntuvat. Trenditietoinen mutta ei koskaan yliyrittävä.",
    ],
  },
  "Etu-Töölö": {
    en: [
      "Töölö — classic Helsinki. Mention: the tree-lined streets, the cultural institutions nearby, the sophisticated but unpretentious regulars. A neighborhood that knows what it likes.",
    ],
    fi: [
      "Töölö — klassinen Helsinki. Mainitse: puiden reunustamat kadut, kulttuurilaitokset lähellä, hienostuneet mutta vaatimattomat vakiokävijät. Kaupunginosa joka tietää mistä pitää.",
    ],
  },
  Hakaniemi: {
    en: [
      "Hakaniemi — working-class roots, evolving fast. Mention: the market hall energy, the mix of old and new Helsinki, the crowd that's been here before it was cool. Authentic, unfiltered.",
    ],
    fi: [
      "Hakaniemi — työläisjuuret, nopeasti kehittyvä. Mainitse: kauppahallin energia, vanhan ja uuden Helsingin sekoitus, porukka joka on ollut täällä ennen kuin oli siistiä. Aito, suodattamaton.",
    ],
  },
};

// ---------------------------------------------------------------------------
// Amenity-specific hooks
// ---------------------------------------------------------------------------

const AMENITY_HOOKS: Record<string, { en: string; fi: string }> = {
  terrace: {
    en: "This bar has a TERRACE — mention: outdoor seating, sunset drinks, the fresh air, people-watching. In summer, the terrace is the main event.",
    fi: "Tällä baarilla on TERASSI — mainitse: ulkona istuminen, auringonlaskujuomat, raitis ilma, ihmisten katselu. Kesällä terassi on pääesiintyjä.",
  },
  "live music": {
    en: "This bar has LIVE MUSIC — mention: the stage, the sound, the performer-audience connection. Music isn't background here — it's a reason to come.",
    fi: "Tällä baarilla on ELÄVÄÄ MUSIIKKIA — mainitse: lava, ääni, esiintyjän ja yleisön yhteys. Musiikki ei ole taustaa täällä — se on syy tulla.",
  },
  "dance floor": {
    en: "This bar has a DANCE FLOOR — mention: the space to move, the beat taking over, the collective rhythm. Some nights, talking is secondary to moving.",
    fi: "Tällä baarilla on TANSSILATTIA — mainitse: tila liikkua, biitti joka vie mukanaan, kollektiivinen rytmi. Joinain öinä puhuminen on toissijaista liikkumiselle.",
  },
  "dj booth": {
    en: "This bar has a DJ BOOTH — mention: the selector, the set, the sound curation. Someone is steering the night from behind the decks.",
    fi: "Tällä baarilla on DJ-KOPPI — mainitse: valitsija, setti, äänen kuratointi. Joku ohjaa iltaa dekien takaa.",
  },
  "private rooms": {
    en: "This bar has PRIVATE ROOMS — mention: your own space, closed door, dedicated service. For when the occasion calls for something more.",
    fi: "Tällä baarilla on YKSITYISHUONEITA — mainitse: oma tila, suljettu ovi, oma palvelu. Kun tilaisuus vaatii jotain enemmän.",
  },
};

// ---------------------------------------------------------------------------
// Price-range framing
// ---------------------------------------------------------------------------

const PRICE_HOOKS: Record<string, { en: string; fi: string }> = {
  BUDGET: {
    en: "Price level: ACCESSIBLE. Frame value naturally — the bar is for everyone, no pretension. Good drinks at honest prices. The deal is part of the character, not a gimmick.",
    fi: "Hintataso: EDULLINEN. Kehystä arvo luontevasti — baari on kaikille, ei teeskentelyä. Hyviä juomia rehellisin hinnoin. Diili on osa luonnetta, ei kikka.",
  },
  MODERATE: {
    en: "Price level: MODERATE. Quality and value in balance. Don't lead with price — lead with what you get for it. Good taste, fair deal.",
    fi: "Hintataso: KOHTUULLINEN. Laatu ja arvo tasapainossa. Älä johda hinnalla — johda sillä mitä saa. Hyvä maku, reilu diili.",
  },
  PREMIUM: {
    en: "Price level: PREMIUM. Quality justifies the price. Lead with craft, selection, expertise. Price mentions should feel like reassurance, not apology. You get what you pay for.",
    fi: "Hintataso: PREMIUM. Laatu oikeuttaa hinnan. Johda käsityöllä, valikoimalla, asiantuntemuksella. Hintamainintojen tulee tuntua vakuuttelulta, ei anteeksipyynnöltä. Saat mitä maksat.",
  },
  LUXURY: {
    en: "Price level: LUXURY. Exclusivity is the norm. Don't mention price — mention rarity, craft, the exceptional. The price is understood by those who belong. Understatement is the flex.",
    fi: "Hintataso: LUKSUS. Eksklusiivisuus on normi. Älä mainitse hintaa — mainitse harvinaisuus, käsityö, poikkeuksellisuus. Hinta on niiden tiedossa jotka kuuluvat joukkoon. Vähäeleisyys on flexaus.",
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface BarHookContext {
  type: string;
  district?: string;
  amenities?: string[];
  priceRange?: string;
  musicTags?: string[];
}

/**
 * Generate bar-specific creative hooks from bar attributes.
 * Returns an array of strings — each a suggestion the LLM should work into the text.
 * Capped at 4 hooks to avoid overwhelming the prompt.
 */
export function generateBarHooks(
  bar: BarHookContext,
  language: "en" | "fi" = "en",
): string[] {
  const hooks: string[] = [];
  const isFi = language === "fi";

  // 1. Type hooks (always include — this is the most important)
  const typeHooks = TYPE_HOOKS[bar.type] ?? DEFAULT_TYPE_HOOKS;
  const typeArr = isFi ? typeHooks.fi : typeHooks.en;
  // Pick one type hook deterministically based on bar type name hash
  const typeIdx = bar.type.length % typeArr.length;
  hooks.push(typeArr[typeIdx]);

  // 2. District hook (if available)
  if (bar.district) {
    const districtHooks = DISTRICT_HOOKS[bar.district];
    if (districtHooks) {
      const dArr = isFi ? districtHooks.fi : districtHooks.en;
      hooks.push(dArr[0]); // always first (only one per district)
    }
  }

  // 3. Amenity hooks (up to 2, most important first)
  if (bar.amenities && bar.amenities.length > 0) {
    const amenityPriority = ["terrace", "live music", "dance floor", "dj booth", "private rooms"];
    let added = 0;
    for (const key of amenityPriority) {
      if (bar.amenities.includes(key) && added < 2) {
        const hook = AMENITY_HOOKS[key];
        if (hook) {
          hooks.push(isFi ? hook.fi : hook.en);
          added++;
        }
      }
    }
  }

  // 4. Price-range framing (if available and not already at max)
  if (bar.priceRange && hooks.length < 4) {
    const priceHook = PRICE_HOOKS[bar.priceRange];
    if (priceHook) {
      hooks.push(isFi ? priceHook.fi : priceHook.en);
    }
  }

  return hooks;
}

/**
 * Build the bar hooks block for injection into the prompt.
 */
export function buildBarHooksBlock(
  bar: BarHookContext,
  language: "en" | "fi" = "en",
): string {
  const hooks = generateBarHooks(bar, language);
  if (hooks.length === 0) return "";

  const isFi = language === "fi";
  const header = isFi
    ? "BAARIN LUOVAT KOHTEET — konkreettisia asioita joihin voit tarttua:"
    : "BAR CREATIVE HOOKS — concrete details to work into the text:";

  return `\n\n${header}\n${hooks.map((h) => `• ${h}`).join("\n")}`;
}
