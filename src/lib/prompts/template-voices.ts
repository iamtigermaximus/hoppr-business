// src/lib/prompts/template-voices.ts
// ============================================================================
// TEMPLATE VOICE PROFILES — Writing personality for each promotion template.
//
// Templates define structure (time+price for happy hour, date+location for
// events). Template voices define personality — how each template should
// SOUND regardless of the chosen tone. The tone voice and template voice
// blend together: tone sets the overall writing style, template colors it
// for the specific context.
// ============================================================================

/** Known template IDs — matches TEMPLATE_CHARACTERISTICS keys in prompts.ts */
export type TemplateId =
  | "After-Work"
  | "Ladies Night"
  | "Naistenilta"
  | "Live Music"
  | "Elävä musiikki"
  | "Game Night"
  | "Peli-ilta"
  | "Food Special"
  | "Ruokatarjous"
  | "VIP Experience"
  | "VIP-kokemus"
  | "Signature Evening"
  | "Talon suositukset"
  | "Theme Night"
  | "Teemailta";

interface TemplateVoice {
  /** Short, punchy voice block injected into the prompt. */
  promptBlock: { en: string; fi: string };
}

/** Maps template IDs (including Finnish variants) to their canonical voice. */
const CANONICAL_MAP: Record<string, string> = {
  "Naistenilta": "Ladies Night",
  "Elävä musiikki": "Live Music",
  "Peli-ilta": "Game Night",
  "Ruokatarjous": "Food Special",
  "VIP-kokemus": "VIP Experience",
  "Talon suositukset": "Signature Evening",
  "Teemailta": "Theme Night",
};

const TEMPLATE_VOICES: Record<string, TemplateVoice> = {
  "After-Work": {
    promptBlock: {
      en: `TEMPLATE VOICE — After-Work:
Professional crowd unwinding. Write with the energy of 5pm on a weekday — the exhale after the workday. Mention the transition: office mode → evening mode. Time is part of the appeal (16:00–19:00). The draw is decompression, not partying. Practical details matter: timing, location, what's on pour.`,

      fi: `MALLIPOHJAN ÄÄNI — After-Work:
Ammattilaiset rentoutumassa. Kirjoita arkipäivän klo 17 energialla — työpäivän jälkeinen uloshengitys. Mainitse siirtymä: toimistotilasta iltatilaan. Aika on osa vetovoimaa (klo 16–19). Pääasia on rentoutuminen, ei bilettäminen. Käytännön yksityiskohdat merkitsevät: ajoitus, sijainti, mitä on tarjolla.`,
    },
  },

  "Ladies Night": {
    promptBlock: {
      en: `TEMPLATE VOICE — Ladies Night:
Social, celebratory, group-oriented. Write to friend groups — not individuals, not couples. The energy is shared. Mention: your crew, your girls, the squad. Perks matter: reserved tables, welcome pours, group-friendly service. Inclusive and welcoming, not exclusive. The bar is hosting a party, not running a club.`,

      fi: `MALLIPOHJAN ÄÄNI — Ladies Night:
Sosiaalinen, juhlava, ryhmille suunnattu. Kirjoita ystäväporukoille — ei yksilöille, ei pareille. Energia on jaettua. Mainitse: sun porukka, tytöt, jengi. Edut merkitsevät: varatut pöydät, tervetulokaadot, ryhmäpalvelu. Kutsuva ja mukaanottava, ei eksklusiivinen. Baari järjestää juhlat, ei pyöritä klubia.`,
    },
  },

  "Live Music": {
    promptBlock: {
      en: `TEMPLATE VOICE — Live Music:
Performer-first. The artist IS the headline. Write about sound, presence, genre, stage. Mention: the set, the show, the sound filling the room. Room dynamics matter: standing vs seated, intimate vs loud. Time anchors: doors at, show at, set times. Build anticipation around the performer — the bar is the venue, not the star.`,

      fi: `MALLIPOHJAN ÄÄNI — Live Music:
Esiintyjä ensin. Artisti ON otsikko. Kirjoita äänestä, läsnäolosta, genrestä, lavasta. Mainitse: setti, show, ääni joka täyttää tilan. Tilan dynamiikka merkitsee: seisomapaikat vs istumapaikat, intiimi vs kovaääninen. Aika ankkuroi: ovet klo, show klo, settiajat. Rakenna odotusta esiintyjän ympärille — baari on tapahtumapaikka, ei tähti.`,
    },
  },

  "Game Night": {
    promptBlock: {
      en: `TEMPLATE VOICE — Game Night:
Competitive socializing. Team play energy. Mention: your team, the competition, the prize. The format matters: trivia, bingo, board games, beer pong alternatives. Playful tension — stakes are low but pride is high. Call out the host/MC if there is one. Bragging rights are the real reward.`,

      fi: `MALLIPOHJAN ÄÄNI — Peli-ilta:
Kilpailuhenkinen seurustelu. Joukkuepelin energiaa. Mainitse: sun tiimi, kilpailu, palkinto. Formaatti merkitsee: tietovisa, bingo, lautapelit. Leikkisä jännitys — panokset matalat mutta ylpeys korkealla. Mainitse juontaja/järjestäjä jos sellainen on. Kerskumisoikeus on todellinen palkinto.`,
    },
  },

  "Food Special": {
    promptBlock: {
      en: `TEMPLATE VOICE — Food Special:
Culinary-first. The food IS the promotion — drinks are the accompaniment, not the other way around. Write about ingredients, preparation, pairings. Mention: the kitchen, the chef, the menu, the plates. Sensory detail: texture, aroma, presentation. Generous but never gluttonous. Food has no alcohol advertising restrictions — lean into it.`,

      fi: `MALLIPOHJAN ÄÄNI — Ruokatarjous:
Ruoka ensin. Ruoka ON tarjous — juomat ovat lisuke, eivät toisinpäin. Kirjoita raaka-aineista, valmistuksesta, suosituksista. Mainitse: keittiö, kokki, menu, annokset. Aistiyksityiskohtia: rakenne, tuoksu, asettelu. Runsas mutta ei ahne. Ruokaan ei kohdistu alkoholimainonnan rajoituksia — nojaa siihen.`,
    },
  },

  "VIP Experience": {
    promptBlock: {
      en: `TEMPLATE VOICE — VIP Experience:
Elevated, exclusive, premium. The experience is the difference between regular and exceptional. Mention: behind the rope, dedicated service, private area, bottle service, skip the line. Scarcity works here — limited tables, capped capacity. Confident, not bragging. The people who know, know. Don't explain why it's special — describe what makes it special.`,

      fi: `MALLIPOHJAN ÄÄNI — VIP Experience:
Kohotettu, eksklusiivinen, premium. Kokemus on ero tavallisen ja poikkeuksellisen välillä. Mainitse: köyden takana, oma palvelu, yksityistila, pullopalvelu, ohita jono. Niukkuus toimii täällä — rajoitetut pöydät, rajattu kapasiteetti. Itsevarma, ei leveilevä. Ne jotka tietävät, tietävät. Älä selitä miksi se on erityistä — kuvaile mikä tekee siitä erityistä.`,
    },
  },

  "Signature Evening": {
    promptBlock: {
      en: `TEMPLATE VOICE — Signature Evening:
One-of-a-kind. Unique to THIS venue. Write like this night doesn't exist anywhere else — because it doesn't. Mention: the concept, what we've prepared, a one-night-only feel. The draw is novelty and curation. Something you'd cross town for. The bar is flexing its creative muscle — this is its signature move.`,

      fi: `MALLIPOHJAN ÄÄNI — Signature Evening:
Ainutlaatuinen. Uniikki JUURI tälle paikalle. Kirjoita kuin tätä iltaa ei ole missään muualla — koska ei ole. Mainitse: konsepti, mitä olemme valmistaneet, vain-yhden-illan tuntu. Vetovoima on uutuudessa ja kuratoinnissa. Jotain jonka takia matkustaa kaupungin halki. Baari näyttää luovaa lihastaan — tämä on sen nimikkoliike.`,
    },
  },

  "Theme Night": {
    promptBlock: {
      en: `TEMPLATE VOICE — Theme Night:
Immersive transformation. The bar becomes something else for one night. Write like you're describing an alternate reality. Mention: the dress code, the transformation, the shared experience. Theatrical and transportive. The fun is in committing to the bit. Everyone playing along is part of the show.`,

      fi: `MALLIPOHJAN ÄÄNI — Teemailta:
Uppouttava muutos. Baari muuttuu joksikin muuksi yhdeksi illaksi. Kirjoita kuin kuvailisit vaihtoehtoista todellisuutta. Mainitse: pukukoodi, muodonmuutos, jaettu kokemus. Teatterillinen ja kuljettava. Hauskuus on jutussa mukana olemisessa. Jokainen joka lähtee leikkiin on osa shown'ta.`,
    },
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Return the template voice block for injection into the prompt.
 * Handles Finnish template ID variants by mapping them to their canonical English key.
 */
export function getTemplateVoiceBlock(
  template: string | undefined | null,
  language: "en" | "fi" = "en",
): string {
  if (!template) return "";

  // Resolve Finnish variants to canonical keys
  const canonicalKey = CANONICAL_MAP[template] || template;
  const voice = TEMPLATE_VOICES[canonicalKey];
  if (!voice) return "";

  return language === "fi" ? voice.promptBlock.fi : voice.promptBlock.en;
}

/**
 * Return a compact blending instruction that tells the LLM how to combine
 * the tone voice and template voice into a single coherent style.
 */
export function getBlendInstruction(language: "en" | "fi" = "en"): string {
  return language === "fi"
    ? `\n\nÄÄNEN YHDISTÄMINEN: Yllä oleva KIRJOITUSTYYLIN SÄÄNNÖT määrittelee MITEN kirjoitat (rytmi, sanasto, välimerkit). Yllä oleva MALLIPOHJAN SÄÄNNÖT määrittelee MISTÄ kirjoitat ja kenelle (konteksti, yleisö, tunnelma). Yhdistä molemmat — kirjoita äänensävyllä mallipohjan kontekstissa. Älä valitse yhtä toisen kustannuksella.`
    : `\n\nVOICE BLENDING: The WRITING VOICE RULES above define HOW you write (rhythm, vocabulary, punctuation). The TEMPLATE VOICE above defines WHAT you're writing about and WHO it's for (context, audience, atmosphere). Combine both — write in the voice FOR the template context. Don't pick one at the expense of the other.`;
}
