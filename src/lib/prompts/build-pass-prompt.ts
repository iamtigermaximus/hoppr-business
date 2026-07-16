// src/lib/prompts/build-pass-prompt.ts
// ============================================================================
// VIP PASS PROMPT BUILDER — Type-specific prompt assembly for VIP passes.
//
// Passes are different from events and promotions: they sell access and
// treatment, not an experience at a specific time. A pass is "what you get
// when you choose this bar" — skip-the-line, reserved tables, drink packages,
// bottle service. This module builds pass-optimized prompts that frame value
// and exclusivity.
//
// The pass prompt structure:
//   System: [Compliance rules + pass voice rules + pass-type-specific rules]
//   User:   "Generate a [tone] VIP pass description for [pass type] at
//            [bar name]. Pass: [name], [price], [benefits], [validity].
//            Bar context: [bar hooks].
//            Include: what you get, price/value, how to use, purchase CTA."
// ============================================================================

import type { ContentTone } from "./tone-voices";
import { getTonePromptBlock } from "./tone-voices";
import { buildBarHooksBlock, type BarHookContext } from "./bar-hooks";

// ---------------------------------------------------------------------------
// Pass type profiles
// ---------------------------------------------------------------------------

export type PassCategory =
  | "SKIP_LINE"
  | "DRINK_PACKAGE"
  | "TABLE_RESERVATION"
  | "COVER_INCLUDED"
  | "BOTTLE_SERVICE"
  | "GROUP_PACKAGE"
  | "OTHER";

interface PassTypeProfile {
  label: { en: string; fi: string };
  writingRules: { en: string; fi: string };
  /** Core value proposition for this pass type */
  valueProp: { en: string; fi: string };
}

const PASS_TYPE_PROFILES: Record<PassCategory, PassTypeProfile> = {
  SKIP_LINE: {
    label: { en: "Skip-the-Line", fi: "Jononohitus" },
    valueProp: {
      en: "Walk past the queue. The night starts when you arrive — not 30 minutes later.",
      fi: "Kävele jonon ohi. Ilta alkaa kun saavut — ei 30 minuuttia myöhemmin.",
    },
    writingRules: {
      en: `PASS TYPE — Skip-the-Line:
The core sell is TIME and STATUS. Lead with the feeling of walking past the queue: the recognition, the ease, being expected. This is the most universal pass — it appeals to everyone who hates waiting. Frame the pass as the smart choice, not the expensive one. Mention: how it works (show pass at door), when it's valid (peak hours Friday-Saturday), any capacity limits. The pass says "I belong here" — lean into that.`,

      fi: `PASSITYYPPI — Jononohitus:
Päämyyntivaltti on AIKA ja STATUS. Aloita tunteella kun kävelet jonon ohi: tunnistus, helppous, odotettu vieras. Tämä on universaalein passi — se vetoaa kaikkiin jotka vihaavat jonottamista. Kehystä passi fiksuna valintana, ei kalliina. Mainitse: miten toimii (näytä passi ovella), milloin voimassa (huipputunnit pe-la), kapasiteettirajat. Passi sanoo "kuulun tänne" — nojaa siihen.`,
    },
  },

  DRINK_PACKAGE: {
    label: { en: "Drink Package", fi: "Juomapaketti" },
    valueProp: {
      en: "Your drinks are sorted before you arrive. The value is in the bundle — more for less, zero hassle.",
      fi: "Juomasi on hoidettu ennen saapumistasi. Arvo on paketissa — enemmän vähemmällä, nolla vaivaa.",
    },
    writingRules: {
      en: `PASS TYPE — Drink Package:
The core sell is VALUE and CONVENIENCE. Lead with the bundle: what's included, what it would cost separately, the savings. Mention: drink selection (welcome drink, X number of drinks, specific menu or open choice), validity (per night, per person). Frame as: "The math works — and so does the experience." Practical tone with a wink. The pass buyer is smart with money and smart with their night.`,

      fi: `PASSITYYPPI — Juomapaketti:
Päämyyntivaltti on ARVO ja VAI VATTOMUUS. Aloita paketilla: mitä sisältyy, mitä maksaisi erikseen, säästö. Mainitse: juomavalikoima (tervetuliaismalja, X juomaa, tietty lista vai vapaa valinta), voimassaolo (per ilta, per henkilö). Kehystä: "Matematiikka toimii — ja niin toimii kokemuskin." Käytännöllinen sävy silmäniskulla. Passin ostaja on fiksu rahan kanssa ja fiksu iltansa kanssa.`,
    },
  },

  TABLE_RESERVATION: {
    label: { en: "Table Reservation", fi: "Pöytävaraus" },
    valueProp: {
      en: "Your table is waiting. No scanning the room, no standing — a guaranteed base for the night.",
      fi: "Pöytäsi odottaa. Ei tilan skannausta, ei seisoskelua — taattu tukikohta illalle.",
    },
    writingRules: {
      en: `PASS TYPE — Table Reservation:
The core sell is COMFORT and SOCIAL. Lead with the group experience: your own space, your crew together, a home base for the night. Mention: table size, location in the venue (best view, near dance floor, quieter corner), dedicated service. Frame as the foundation of a great night: "Everything starts from the table." The pass is for groups who want to do it right — not scramble for seats.`,

      fi: `PASSITYYPPI — Pöytävaraus:
Päämyyntivaltti on MUKAVUUS ja SOSIAALISUUS. Aloita ryhmäkokemuksella: oma tila, oma porukka yhdessä, kotipesä illalle. Mainitse: pöydän koko, sijainti (paras näkymä, lähellä tanssilattiaa, hiljaisempi nurkka), oma palvelu. Kehystä loistavan illan perustana: "Kaikki alkaa pöydästä." Passi on ryhmille jotka haluavat tehdä illan oikein — ei tuolien metsästystä.`,
    },
  },

  COVER_INCLUDED: {
    label: { en: "Cover + Perk", fi: "Sisäänpääsy + etu" },
    valueProp: {
      en: "Entry sorted, plus something extra. The pass that makes the door price feel like a deal.",
      fi: "Sisäänpääsy hoidettu, plus jotain extraa. Passi joka saa ovihinnan tuntumaan diililtä.",
    },
    writingRules: {
      en: `PASS TYPE — Cover + Perk:
The core sell is BUNDLED VALUE. Lead with both sides: entry IS included AND you get something on top (welcome drink, cloakroom, first round). The pass transforms "paying to get in" into "getting more than you paid for." Mention both parts: the cover charge value AND the perk. Frame as: "You're coming anyway — might as well get the upgrade."`,

      fi: `PASSITYYPPI — Sisäänpääsy + etu:
Päämyyntivaltti on PAKETOITU ARVO. Aloita molemmilla puolilla: sisäänpääsy ON mukana JA saat jotain päälle (tervetuliaismalja, narikka, ensimmäinen kierros). Passi muuttaa "maksat päästäksesi sisään" muotoon "saat enemmän kuin maksoit." Mainitse molemmat osat: ovihinnan arvo JA etu. Kehystä: "Olet tulossa kuitenkin — mikset ottaisi upgradea."`,
    },
  },

  BOTTLE_SERVICE: {
    label: { en: "Bottle Service", fi: "Pullopalvelu" },
    valueProp: {
      en: "The full VIP treatment. Your bottle, your table, your night — the bar at its best.",
      fi: "Täysi VIP-kohtelu. Oma pullo, oma pöytä, oma ilta — baari parhaimmillaan.",
    },
    writingRules: {
      en: `PASS TYPE — Bottle Service:
The core sell is STATUS and SPECTACLE. Lead with the experience: the bottle arriving at your table, the sparkler, the attention. This is the premium pass — the one people buy to celebrate or impress. Mention: bottle selection, mixers included, dedicated server, table placement. Write with aspirational confidence. The buyer isn't just getting a drink — they're making a statement.`,

      fi: `PASSITYYPPI — Pullopalvelu:
Päämyyntivaltti on STATUS ja NÄYTÖS. Aloita kokemuksella: pullo saapuu pöytään, tähtisädetikku, huomio. Tämä on premium-passi — se jonka ihmiset ostavat juhliakseen tai vaikuttaakseen. Mainitse: pullovalikoima, mikserit mukana, oma tarjoilija, pöydän sijainti. Kirjoita tavoittelevalla itsevarmuudella. Ostaja ei vain osta juomaa — hän tekee lausunnon.`,
    },
  },

  GROUP_PACKAGE: {
    label: { en: "Group Package", fi: "Ryhmäpaketti" },
    valueProp: {
      en: "The whole night, sorted for the whole crew. One booking, everyone covered.",
      fi: "Koko ilta, hoidettu koko porukalle. Yksi varaus, kaikki katettu.",
    },
    writingRules: {
      en: `PASS TYPE — Group Package:
The core sell is SIMPLICITY and VALUE for groups. Lead with the all-in-one angle: entry, drinks, table — everything handled for a fixed per-person price. The organizer looks like a hero; the group gets a seamless night. Mention: group size range, what's included per person, group discount framing. The pass is for the person planning the night out — make them feel smart for choosing it.`,

      fi: `PASSITYYPPI — Ryhmäpaketti:
Päämyyntivaltti on YKSINKERTAISUUS ja ARVO ryhmille. Aloita all-in-one-kulmalla: sisäänpääsy, juomat, pöytä — kaikki hoidettu kiinteällä henkilöhinnalla. Järjestäjä näyttää sankarilta; ryhmä saa saumattoman illan. Mainitse: ryhmän kokohaarukka, mitä sisältyy per henkilö, ryhmäalennuksen kehystys. Passi on illan suunnittelijalle — saa heidät tuntemaan itsensä fiksuksi valinnasta.`,
    },
  },

  OTHER: {
    label: { en: "VIP Pass", fi: "VIP-passi" },
    valueProp: {
      en: "An elevated experience at this venue — something extra that makes the night special.",
      fi: "Kohotettu kokemus tässä paikassa — jotain extraa joka tekee illasta erityisen.",
    },
    writingRules: {
      en: `PASS TYPE — Custom/Other:
A unique pass combining benefits specific to this venue. Lead with what makes it special: the combination of perks, the exclusivity, the limited availability. Frame as a curated experience rather than a transaction. Mention: all included benefits clearly, the total value, why it's worth it.`,

      fi: `PASSITYYPPI — Muu/Räätälöity:
Ainutlaatuinen passi joka yhdistää tälle paikalle ominaisia etuja. Aloita siitä mikä tekee siitä erityisen: etujen yhdistelmä, eksklusiivisuus, rajoitettu saatavuus. Kehystä kuratoituna kokemuksena transaktion sijaan. Mainitse: kaikki sisältyvät edut selkeästi, kokonaisarvo, miksi se on sen arvoinen.`,
    },
  },
};

// ---------------------------------------------------------------------------
// Pass voice profiles — how the copy should feel by value positioning
// ---------------------------------------------------------------------------

type PassVoice = "VALUE_FOCUSED" | "EXCLUSIVE" | "PRACTICAL";

interface PassVoiceProfile {
  systemInstruction: { en: string; fi: string };
}

const PASS_VOICES: Record<PassVoice, PassVoiceProfile> = {
  VALUE_FOCUSED: {
    systemInstruction: {
      en: `PASS VOICE — Value-Focused:
You are writing copy for someone who cares about getting their money's worth. Lead with the math: what you get vs what you'd pay separately. Frame the pass as the smart financial choice — not cheap, but efficient. Use phrases like "sorted," "covered," "built in." The tone is confident but never flashy. Numbers help: "€30 value for €20."`,

      fi: `PASSIN ÄÄNI — Arvokeskeinen:
Kirjoitat henkilölle joka välittää vastineesta rahalleen. Aloita matematiikalla: mitä saat vs mitä maksaisit erikseen. Kehystä passi fiksuna taloudellisena valintana — ei halpana, vaan tehokkaana. Käytä ilmaisuja kuten "hoidettu," "katettu," "sisältyy." Sävy on itsevarma mutta ei koskaan pröystäilevä. Numerot auttavat: "30 € arvo 20 € hintaan."`,
    },
  },
  EXCLUSIVE: {
    systemInstruction: {
      en: `PASS VOICE — Exclusive:
You are writing copy for someone who wants the best. Lead with status and treatment: priority, reserved, private, dedicated. The pass is not for everyone — it's limited, and that's the point. Use aspirational language: "Your table," "Your bottle," "Your night." The tone is polished and confident. Price is mentioned as a signal of quality, not a barrier.`,

      fi: `PASSIN ÄÄNI — Eksklusiivinen:
Kirjoitat henkilölle joka haluaa parasta. Aloita statuksella ja kohtelulla: prioriteetti, varattu, yksityinen, omistautunut. Passi ei ole kaikille — se on rajoitettu, ja se on pointti. Käytä tavoittelevaa kieltä: "Sinun pöytäsi," "Sinun pullosi," "Sinun iltasi." Sävy on hiottu ja itsevarma. Hinta mainitaan laadun merkkinä, ei esteenä.`,
    },
  },
  PRACTICAL: {
    systemInstruction: {
      en: `PASS VOICE — Practical:
You are writing copy for someone who wants things to work smoothly. Lead with convenience: no waiting, no hassle, everything ready when you arrive. The pass is the efficient choice — it removes friction from the night. Use straightforward language: "Show this at the door," "Your drinks are pre-paid," "Walk straight in." The tone is helpful and direct, never pushy.`,

      fi: `PASSIN ÄÄNI — Käytännöllinen:
Kirjoitat henkilölle joka haluaa asioiden toimivan sujuvasti. Aloita mukavuudella: ei odottelua, ei vaivaa, kaikki valmiina kun saavut. Passi on tehokas valinta — se poistaa kitkaa illasta. Käytä suoraviivaista kieltä: "Näytä tämä ovella," "Juomasi on maksettu etukäteen," "Kävele suoraan sisään." Sävy on avulias ja suora, ei koskaan tuputtava.`,
    },
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface PassPromptInput {
  barName: string;
  barType: string;
  district?: string;
  cityName?: string;
  amenities?: string[];
  priceRange?: string;
  description?: string;
  vipEnabled?: boolean;
  userBrief: string;
  tone?: ContentTone;
  language?: "en" | "fi";
  passCategory?: PassCategory;
  /** Controls which value proposition voice to use */
  passVoice?: PassVoice;
}

export interface PassPromptOutput {
  systemPrompt: string;
  userPrompt: string;
  passCategory: PassCategory;
}

/**
 * Determine the pass voice from the tone. Elegant + Bold tones suggest
 * exclusivity; Warm and Playful suggest value; others default to practical.
 */
function inferPassVoice(
  tone: ContentTone | undefined,
  category: PassCategory,
): PassVoice {
  if (category === "BOTTLE_SERVICE" || category === "TABLE_RESERVATION") return "EXCLUSIVE";
  if (category === "DRINK_PACKAGE" || category === "COVER_INCLUDED") return "VALUE_FOCUSED";
  if (category === "SKIP_LINE") return "PRACTICAL";

  if (tone === "ELEGANT_PREMIUM" || tone === "BOLD_ENERGETIC") return "EXCLUSIVE";
  if (tone === "WARM_INVITING" || tone === "PLAYFUL_FUN") return "VALUE_FOCUSED";
  return "PRACTICAL";
}

/**
 * Build pass-optimized system and user prompts.
 */
export function buildPassPrompt(input: PassPromptInput): PassPromptOutput {
  const {
    barName,
    barType,
    district,
    cityName,
    amenities,
    priceRange,
    description,
    vipEnabled,
    userBrief,
    tone,
    language = "en",
    passCategory: explicitCategory,
    passVoice: explicitVoice,
  } = input;

  const isFi = language === "fi";
  const category = explicitCategory || "OTHER";
  const profile = PASS_TYPE_PROFILES[category];
  const voice = explicitVoice || inferPassVoice(tone, category);
  const voiceProfile = PASS_VOICES[voice];

  // ---- Build system prompt ----

  const systemParts: string[] = [];

  // 1. Persona
  systemParts.push(
    isFi
      ? `Olet VIP-passien ja premium-palveluiden copywriter, joka on erikoistunut Helsingin baari- ja yöelämäkohteisiin. Kirjoitat passikuvauksia jotka myyvät — selkeästi, houkuttelevasti, ilman turhaa liioittelua. Osaat kehystää hinnan arvoksi ja rajoitetun saatavuuden eduksi.`
      : `You are a VIP pass and premium experience copywriter specializing in Helsinki bar and nightlife venues. You write pass descriptions that sell — clearly, compellingly, without empty hype. You know how to frame price as value and limited availability as advantage.`,
  );

  // 2. General pass writing rules
  systemParts.push(
    isFi
      ? `PASSIN KIRJOITUSSÄÄNNÖT:
- Johda passin nimellä — sen on kerrottava MITÄ saat yhdellä silmäyksellä
- Listaa edut selkeästi — bullet point -tyyli, vaikka tekstimuodossa
- Hinta on aina kehystettävä arvona: mitä saat, mitä se normaalisti maksaisi
- Mainitse rajoitukset rehellisesti: voimassaolo, määrä, ehdot
- Päätä toimintakehotukseen: osta, varaa, lunasta
- Passikuvaukset ovat lyhyitä ja täsmällisiä — ei löysää tekstiä
- Keskity palveluun ja kokemukseen, älä alkoholin määrään — Alkoholilain mukainen`
      : `PASS WRITING RULES:
- Lead with the pass name — it should tell WHAT you get at a glance
- List benefits clearly — bullet-point style, even in prose form
- Price is always framed as value: what you get, what it would normally cost
- Mention limitations honestly: validity, quantity, terms
- Close with a call to action: buy, reserve, redeem
- Pass descriptions are short and precise — no filler
- Focus on service and experience, not alcohol volume — Finland-compliant`,
  );

  // 3. Pass type writing rules
  const typeRules = isFi ? profile.writingRules.fi : profile.writingRules.en;
  systemParts.push(typeRules);

  // 4. Pass voice rules
  const voiceRules = isFi
    ? voiceProfile.systemInstruction.fi
    : voiceProfile.systemInstruction.en;
  systemParts.push(voiceRules);

  // 5. Tone voice rules (if tone selected — pass voices override tone partially)
  if (tone) {
    const toneBlock = getTonePromptBlock(tone, language);
    if (toneBlock) {
      // Add tone with a caveat: pass voice takes priority for value framing
      systemParts.push(
        isFi
          ? `SÄVYN HUOMIO: Käytä tätä äänensävyä kielen ja rytmin osalta, mutta passin arvolupaus (yllä) määrittää MITÄ korostat.\n\n${toneBlock}`
          : `TONE NOTE: Use this voice for language and rhythm, but the pass value proposition (above) determines WHAT you emphasize.\n\n${toneBlock}`,
      );
    }
  }

  // 6. Output format
  systemParts.push(
    isFi
      ? `\n\nPALAUTUSMUOTO — Palauta VAIN validi JSON, ei muuta tekstiä:
{
  "name": "Passin nimi (max 40 merkkiä, esim. 'Skip the Line – Lauantai')",
  "description": "Passin kuvaus (max 200 merkkiä) — mitä saat, hinta, miten toiminii",
  "price": "number (euroina, esim. 15)",
  "benefits": ["etu 1", "etu 2", "etu 3"],
  "validityPeriod": "string (esim. 'Per night', 'Friday-Saturday', 'Until 31.8.')",
  "maxQuantity": "number tai null (jos rajoitettu määrä)",
  "passCategory": "${category}",
  "reasoning": "Lyhyt selitys hinnoittelusta ja eduista"
}`
      : `\n\nOUTPUT FORMAT — Return ONLY valid JSON, no other text:
{
  "name": "Pass name (max 40 chars, e.g. 'Skip the Line – Saturday')",
  "description": "Pass description (max 200 chars) — what you get, price, how it works",
  "price": "number (in euros, e.g. 15)",
  "benefits": ["benefit 1", "benefit 2", "benefit 3"],
  "validityPeriod": "string (e.g. 'Per night', 'Friday-Saturday', 'Until Aug 31')",
  "maxQuantity": "number or null (if limited quantity)",
  "passCategory": "${category}",
  "reasoning": "Brief explanation of pricing and benefits"
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
        vipEnabled ? "VIP services enabled" : "",
      ]
        .filter(Boolean)
        .join("\n");

  const barHookContext: BarHookContext = {
    type: barType,
    district,
    amenities,
    priceRange,
  };
  const hooksBlock = buildBarHooksBlock(barHookContext, language);

  // Build VIP-specific hook if the bar has VIP enabled
  const vipHook = vipEnabled
    ? isFi
      ? "\n\nVIP-KONTEKSTI: Tämä baari tarjoaa VIP-palveluita. Passit integroituvat olemassa olevaan VIP-järjestelmään — mainitse miten passi toimii VIP-kokemuksen kanssa."
      : "\n\nVIP CONTEXT: This bar offers VIP services. Passes integrate with the existing VIP system — mention how the pass works with the VIP experience."
    : "";

  // Pass voice cue
  const voiceCue =
    voice === "VALUE_FOCUSED"
      ? isFi
        ? "\n\nArvolupaus: Korosta hintaa suhteessa etuihin. Lukijan tulee tuntea saavansa enemmän kuin maksoi."
        : "\n\nValue angle: Emphasize price relative to benefits. The reader should feel they're getting more than they paid."
      : voice === "EXCLUSIVE"
        ? isFi
          ? "\n\nEksklusiivisuuskulma: Korosta rajoitettua saatavuutta ja kohotettua kohtelua. Passi ei ole kaikille — se on niille jotka haluavat parasta."
          : "\n\nExclusivity angle: Emphasize limited availability and elevated treatment. This pass isn't for everyone — it's for those who want the best."
        : isFi
          ? "\n\nKäytännöllisyyskulma: Korosta helppoutta ja sujuvuutta. Passi poistaa vaivaa — se on fiksu valinta, ei luksusta."
          : "\n\nPractical angle: Emphasize ease and smoothness. The pass removes hassle — it's the smart choice, not the luxury one.";

  const userPrompt = isFi
    ? `${barName}n henkilökunta haluaa luoda VIP-PASSIN ja kuvaili sen näin:

"${userBrief}"

${barContext}${hooksBlock}${vipHook}${voiceCue}

Analysoi kuvaus. Päättele passin tyyppi (${Object.values(PASS_TYPE_PROFILES)
        .map((p) => p.label.fi)
        .join(", ")}). Poimi hinta, edut, voimassaoloaika ja määrä.

Luo 3 täysin erilaista varianttia — jokaisella eri nimi, eri kulma, eri hinnoittelustrategia. Palauta paras.

KAIKKI teksti SUOMEKSI. Älä kopioi englanninkielistä tekstiä.`
    : `A bar staff member at ${barName} wants to create a VIP PASS and described it like this:

"${userBrief}"

${barContext}${hooksBlock}${vipHook}${voiceCue}

Analyze the description. Determine the pass type (${Object.values(PASS_TYPE_PROFILES)
        .map((p) => p.label.en)
        .join(", ")}). Extract price, benefits, validity period, and quantity.

Generate 3 completely different variants — each with a different name, angle, and pricing strategy. Return the best one.

Generate ALL content in English.`;

  return { systemPrompt, userPrompt, passCategory: category };
}

/**
 * Infer the pass category from the user's brief text.
 */
export function inferPassCategory(brief: string): PassCategory {
  const lower = brief.toLowerCase();

  if (/skip.line|skip the line|ohita jono|jononohitus|fast.track|priority.entry/.test(lower)) return "SKIP_LINE";
  if (/bottle.service|pullo|pullopalvelu|sparkler|vip.bottle/.test(lower)) return "BOTTLE_SERVICE";
  if (/group.package|group.deal|ryhmä|porukka|crew.package/.test(lower)) return "GROUP_PACKAGE";
  if (/table|pöytä|pöytävaraus|reserved.table|booth/.test(lower)) return "TABLE_RESERVATION";
  if (/drink.package|juomapaketti|drinks.included|welcome.drink|round.of/.test(lower)) return "DRINK_PACKAGE";
  if (/cover.included|sisäänpääsy|entry.included|door.price|narikka|cloakroom/.test(lower)) return "COVER_INCLUDED";

  return "OTHER";
}

export { PASS_TYPE_PROFILES, PASS_VOICES };
