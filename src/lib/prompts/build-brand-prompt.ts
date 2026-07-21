// src/lib/prompts/build-brand-prompt.ts
// ============================================================================
// BRAND PROMPT BUILDER — Advertising-mode prompt assembly.
//
// In brand mode, the AI generates content that builds recognition, association,
// and emotional memory — not deals. No prices, no discounts, no conditions.
// The output is a content piece: headline + body + CTA designed to create
// feeling and identity for the venue.
//
// Architecture:
//   System: [Role definition + compliance + audience + core message +
//            atmosphere + tone + copy structure + bar hooks]
//   User:   "Create brand content for [bar] in [district]. Theme: [mood concept].
//            [DirectorDecision context]. [Image world context].
//            Output: headline, body, CTA — no prices, no alcohol framing."
// ============================================================================

import type { ContentTone } from "./tone-voices";
import { getTonePromptBlock } from "./tone-voices";
import {
  buildBarHooksBlock,
  type BarHookContext,
} from "./bar-hooks";
import type {
  DirectorDecision,
  AudienceChip,
  CoreMessageChip,
  AtmosphereChip,
  ImageWorldChip,
  CopyStructureChip,
} from "./creative-director";
import {
  AUDIENCE_LABELS,
  CORE_MESSAGE_LABELS,
  ATMOSPHERE_LABELS,
  IMAGE_WORLD_LABELS,
  COPY_STRUCTURE_LABELS,
} from "./creative-director";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BrandPromptInput {
  barName: string;
  barType: string;
  district?: string | null;
  cityName?: string | null;
  amenities?: string | null;
  priceRange?: string | null;
  description?: string | null;
  musicTags?: string | null;
  vipEnabled?: boolean;

  /** The mood concept template — e.g., "Kesäilta", "Musiikkihetki" */
  templateName?: string;
  /** Free-text brief from the user */
  userBrief: string;
  /** Language for output */
  language: "en" | "fi";

  /** Ingredient selections — all optional, filled from DirectorDecision or UI */
  audience?: AudienceChip[];
  coreMessage?: CoreMessageChip;
  atmosphere?: AtmosphereChip[];
  imageWorld?: ImageWorldChip;
  copyStructure?: CopyStructureChip;
  tone?: ContentTone;

  /** Whether to highlight this as a special occasion (Vappu, Juhannus, etc.) */
  isSpecialDate?: boolean;
  /** Seasonal context string for the LLM */
  seasonalContext?: string;
  /** Avoid repeating these headline patterns */
  avoidHeadlinePatterns?: string[];
}

export interface BrandPromptOutput {
  systemPrompt: string;
  userPrompt: string;
}

// ---------------------------------------------------------------------------
// Template → mood concept labels
// ---------------------------------------------------------------------------

const MOOD_CONCEPT_LABELS: Record<string, { fi: string; en: string }> = {
  "Kesäilta": { fi: "Kesäilta", en: "Summer Evening" },
  "Lauantai-illan rituaali": { fi: "Lauantai-illan rituaali", en: "Saturday Night Ritual" },
  "Musiikkihetki": { fi: "Musiikkihetki", en: "A Music Moment" },
  "Baarin taika": { fi: "Baarin taika", en: "The Magic of the Bar" },
  "Kutsu": { fi: "Kutsu", en: "An Invitation" },
  "Hiljaiset tunnit": { fi: "Hiljaiset tunnit", en: "The Quiet Hours" },
};

// ---------------------------------------------------------------------------
// Audience-specific writing guidance
// ---------------------------------------------------------------------------

export const AUDIENCE_GUIDANCE: Record<AudienceChip, { fi: string; en: string }> = {
  "friend-groups": {
    fi: "Kirjoitat ystäväporukoille. Käytä monikon sinä-muotoa (\'te\', \'teidän\'), korosta jaettua hetkeä, mainitse ryhmille sopivat tilat. Kieli on tuttavallista ja lämmintä — kuin kutsuisit kaverin ulos.",
    en: "You are writing for friend groups. Use plural address, emphasize the shared moment, mention group-friendly spaces. Language is familiar and warm — like inviting a friend out.",
  },
  "couples": {
    fi: "Kirjoitat pariskunnille. Käytä intiimiä kieltä, mainitse kahden hengen pöydät, korosta hiljaisia nurkkia ja jaettuja kokemuksia. Sävy on läheinen mutta ei tungetteleva.",
    en: "You are writing for couples. Use intimate language, mention tables for two, emphasize quiet corners and shared experiences. Tone is close but not intrusive.",
  },
  "work-colleagues": {
    fi: "Kirjoitat työporukoille. Ammattimainen mutta rento. Korosta sopivuutta after-work -tilaisuuksiin, mainitse varattavat tilat, korosta saavutettavuutta ja mutkattomuutta.",
    en: "You are writing for work colleagues. Professional but relaxed. Emphasize suitability for after-work gatherings, mention bookable spaces, highlight accessibility and ease.",
  },
  "music-lovers": {
    fi: "Kirjoitat musiikin ystäville. Keskity akustiikkaan, esiintyjiin, äänimaailmaan. Kuvaile miten musiikki täyttää tilan. Nimeä genre tai esiintyjä jos mahdollista. Musiikki on pääasia — juoma on sivuseikka.",
    en: "You are writing for music lovers. Focus on acoustics, performers, soundscape. Describe how music fills the space. Name genre or performer if possible. Music is the main event — drinks are secondary.",
  },
  "food-focused": {
    fi: "Kirjoitat ruokailijoille. Keskity makuihin, raaka-aineisiin, annoksiin. Ruoka on pääasia. Juoma on lisuke — viinilasi ruoan rinnalla, ei toisinpäin.",
    en: "You are writing for food-focused guests. Focus on flavors, ingredients, dishes. Food is the main event. Drinks are accompaniment — a wine glass alongside food, not the other way around.",
  },
  "neighborhood-locals": {
    fi: "Kirjoitat kortteliväelle. He tuntevat paikan jo — kirjoita kuin sisäpiiriläinen. Viittaa tuttuihin rutiineihin, mainitse naapurusto, käytä lämmintä ja omistavaa kieltä (\'teidän baari\', \'täällä\').",
    en: "You are writing for neighborhood locals. They already know the place — write like an insider. Reference familiar routines, mention the neighborhood, use warm and possessive language ('your bar', 'here').",
  },
  "celebrants": {
    fi: "Kirjoitat juhlijoille. Korosta juhlatunnelmaa, mainitse mahdollisuus varata isommalle porukalle, käytä juhlavaa ja innostunutta kieltä. Tämä ilta on erityinen.",
    en: "You are writing for celebrants. Emphasize celebratory atmosphere, mention large-group booking options, use festive and excited language. This night is special.",
  },
  "city-explorers": {
    fi: "Kirjoitat kaupunkilaisille ja tutkimusmatkailijoille. Korosta löytämisen iloa, mainitse kaupunginosa, kuvaile miltä alueella tuntuu. Paikka on osa kaupunkia — tunnista se.",
    en: "You are writing for city explorers. Emphasize the joy of discovery, mention the district, describe what the area feels like. The place is part of the city — acknowledge that.",
  },
  "casual-evening": {
    fi: "Kirjoitat rennon illan etsijöille. Ei-pakotettua, matalan kynnyksen kieltä. Korosta helppoutta, mutkattomuutta, ei tarvetta pukeutua tai suunnitella. Tule sellaisena kuin olet.",
    en: "You are writing for casual evening seekers. Unforced, low-barrier language. Emphasize ease, simplicity, no need to dress up or plan. Come as you are.",
  },
  "premium-seekers": {
    fi: "Kirjoitat premium-kokijoille. Laatutietoista, hillittyä, harkittua kieltä. Korosta käsityöosaamista, ainutlaatuisia raaka-aineita, hienostunutta tunnelmaa. Vähäeleisyys on uskottavuutta.",
    en: "You are writing for premium seekers. Quality-conscious, understated, considered language. Emphasize craftsmanship, unique ingredients, sophisticated atmosphere. Understatement is credibility.",
  },
  "seasonal-celebrants": {
    fi: "Kirjoitat sesonkijuhlijoille. Tunnista vuodenaika — Vappu, Juhannus, joulu, kesä, syksy. Korosta sesongin erityisyyttä, mainitse kauden elementtejä, rakenna odotusta.",
    en: "You are writing for seasonal celebrants. Acknowledge the season — Vappu, Midsummer, Christmas, summer, autumn. Emphasize the specialness of the season, mention seasonal elements, build anticipation.",
  },
  "meeting-people": {
    fi: "Kirjoitat tutustujille. Korosta sosiaalista ilmapiiriä, matalaa kynnystä tulla yksin, mahdollisuutta tavata uusia ihmisiä. Kieli on kutsuvaa ja avointa — ei romanttista, vaan yhteisöllistä.",
    en: "You are writing for people meeting new people. Emphasize social atmosphere, low barrier to come alone, the possibility of meeting new people. Language is inviting and open — not romantic, but communal.",
  },
};

// ---------------------------------------------------------------------------
// Core message → writing focus
// ---------------------------------------------------------------------------

export const CORE_MESSAGE_FOCUS: Record<CoreMessageChip, { fi: string; en: string }> = {
  "something-new": {
    fi: "Jokainen lause palvelee tätä ajatusta: baarissa on jotain uutta. Käytä uteliaisuutta herättävää kieltä, vihjaa muutoksesta, rakenna 'tiesitkö?' -hetkeä. Uutuus on tarina.",
    en: "Every sentence serves this idea: there's something new at the bar. Use curiosity-triggering language, hint at change, build a 'did you know?' moment. Newness is the story.",
  },
  "night-is-special": {
    fi: "Jokainen lause palvelee tätä ajatusta: tämä ilta on erityinen, ei mikä tahansa ilta. Rakenna odotusta, korosta ainutkertaisuutta. Miksi juuri tänään? Mitä jää paitsi jos ei tule?",
    en: "Every sentence serves this idea: this night is special, not just any night. Build anticipation, emphasize uniqueness. Why tonight? What do you miss if you don't come?",
  },
  "best-place": {
    fi: "Jokainen lause palvelee tätä ajatusta: tämä on paras paikka tähän hetkeen. Vertaa implisiittisesti — ei 'parempi kuin X' vaan 'täällä on kaikki mitä tarvitset'. Itsevarmaa, ei ylimielistä.",
    en: "Every sentence serves this idea: this is the best place for this moment. Compare implicitly — not 'better than X' but 'here is everything you need.' Confident, not arrogant.",
  },
  "did-you-know": {
    fi: "Jokainen lause palvelee tätä ajatusta: kerro jotain mitä lukija ei tiennyt. Paljasta salaisuus, kerro tarina, esittele yllättävä fakta. Opeta ja viihdytä — älä mainosta.",
    en: "Every sentence serves this idea: tell the reader something they didn't know. Reveal a secret, tell a story, present a surprising fact. Educate and entertain — don't advertise.",
  },
  "come-as-you-are": {
    fi: "Jokainen lause palvelee tätä ajatusta: tänne voit tulla sellaisena kuin olet. Matala kynnys, ihmisläheinen, hyväksyvä. Ei vaatimuksia, ei pukukoodia, ei suorittamista.",
    en: "Every sentence serves this idea: you can come as you are. Low barrier, human-centered, accepting. No requirements, no dress code, no performance.",
  },
  "your-place": {
    fi: "Jokainen lause palvelee tätä ajatusta: tämä on sinun paikkasi. Omistava, lämmin, sisäpiiriläinen. Kuin tervetulotoivotus kotiin — 'täällä sinua odotetaan'.",
    en: "Every sentence serves this idea: this is your place. Possessive, warm, insider. Like a welcome home — 'you are expected here.'",
  },
  "one-night-one-experience": {
    fi: "Jokainen lause palvelee tätä ajatusta: yksi ilta, yksi kokemus — tätä et koe muualla. Ainutlaatuinen, hetkellinen, katoava. Luo kiireen tuntua ilman alennuspsykologiaa.",
    en: "Every sentence serves this idea: one night, one experience — you won't get this anywhere else. Unique, momentary, fleeting. Create urgency without discount psychology.",
  },
  "season-is-now": {
    fi: "Jokainen lause palvelee tätä ajatusta: kausi on nyt — älä missaa tätä vuodenaikaa. Sido sisältö sesonkiin, mainitse sesongin elementtejä, rakenna 'nyt tai ensi vuonna' -tunnetta.",
    en: "Every sentence serves this idea: the season is now — don't miss this time of year. Tie content to the season, mention seasonal elements, build a 'now or next year' feeling.",
  },
};

// ---------------------------------------------------------------------------
// Atmosphere → emotional layer
// ---------------------------------------------------------------------------

export const ATMOSPHERE_LAYER: Record<AtmosphereChip, { fi: string; en: string }> = {
  "warm-homey": {
    fi: "Lämmin ja kotoisa tunnekerros: kuin olohuone poissa kotoa. Pehmeä valo, tutut kasvot, mukavuus ennen kaikkea.",
    en: "Warm and homey emotional layer: like a living room away from home. Soft light, familiar faces, comfort above all.",
  },
  "energetic-pulsating": {
    fi: "Energinen ja sykkivä tunnekerros: rytmi, liike, kollektiivinen energia. Tila elää ja hengittää.",
    en: "Energetic and pulsating emotional layer: rhythm, movement, collective energy. The space lives and breathes.",
  },
  "calm-serene": {
    fi: "Rauhallinen ja seesteinen tunnekerros: hiljaisuus on arvokasta. Hengähdä. Tämä on turvapaikka.",
    en: "Calm and serene emotional layer: quiet is valuable. Breathe. This is a sanctuary.",
  },
  "curious-discovering": {
    fi: "Utelias ja löytävä tunnekerros: mitä kulman takana on? Tutkimusmatka, löytöretki, ensimmäinen kerta.",
    en: "Curious and discovering emotional layer: what's around the corner? Expedition, discovery, the first time.",
  },
  "polished-considered": {
    fi: "Tyylikäs ja hiottu tunnekerros: jokainen yksityiskohta on harkittu. Laatu näkyy — ei huuda.",
    en: "Polished and considered emotional layer: every detail is intentional. Quality shows — it doesn't shout.",
  },
  "authentic-honest": {
    fi: "Aito ja rehellinen tunnekerros: ei kiiltokuvaa, ei markkinointipuhetta. Tämä on mitä on — ja se riittää.",
    en: "Authentic and honest emotional layer: no gloss, no marketing speak. This is what it is — and that's enough.",
  },
  "joyful-lighthearted": {
    fi: "Iloinen ja kepeä tunnekerros: nauru, helppous, keveys. Elämä on hyvää juuri nyt.",
    en: "Joyful and lighthearted emotional layer: laughter, ease, lightness. Life is good right now.",
  },
  "intimate-personal": {
    fi: "Intiimi ja läheinen tunnekerros: jaettu katse, hiljainen hetki, kahdenkeskinen. Vain me kaksi — tai me muutama.",
    en: "Intimate and personal emotional layer: a shared glance, a quiet moment, just the two of us. Just us few.",
  },
  "celebratory-meaningful": {
    fi: "Juhlava ja merkityksellinen tunnekerros: virstanpylväs, merkkipäivä, nostetaan malja. Tämä hetki ansaitsee tulla juhlituksi.",
    en: "Celebratory and meaningful emotional layer: milestone, anniversary, raise a glass. This moment deserves to be celebrated.",
  },
  "bold-distinctive": {
    fi: "Rohkea ja omaleimainen tunnekerros: erilainen, tunnistettava, oma ääni. Ei sulaudu massaan.",
    en: "Bold and distinctive emotional layer: different, recognizable, own voice. Doesn't blend in.",
  },
  "playful-surprising": {
    fi: "Leikkisä ja yllättävä tunnekerros: käänne, yllätys, 'mitä tapahtuu?'. Ei vakavaa — hauskaa ja arvaamatonta.",
    en: "Playful and surprising emotional layer: twist, surprise, 'what happens?'. Not serious — fun and unpredictable.",
  },
  "nostalgic-storied": {
    fi: "Nostalginen ja tarinallinen tunnekerros: muistatko kun? Tällä paikalla on historia, kerro se.",
    en: "Nostalgic and storied emotional layer: remember when? This place has history, tell it.",
  },
  "easy-carefree": {
    fi: "Rento ja huoleton tunnekerros: ei suunnitelmia, ei stressiä. Mennään minne ilta vie.",
    en: "Easy and carefree emotional layer: no plans, no stress. Let's go wherever the evening takes us.",
  },
};

// ---------------------------------------------------------------------------
// Copy structure → paragraph architecture
// ---------------------------------------------------------------------------

export const COPY_STRUCTURE_ARCHITECTURE: Record<CopyStructureChip, { fi: string; en: string }> = {
  "fab": {
    fi: `RAKENNE: FAB (Feature → Advantage → Benefit)
Ensimmäinen virke: Ominaisuus — mitä baarissa on (konkreettinen fakta).
Toinen virke: Hyöty — miksi se on hyvä asia (käytännöllinen seuraus).
Kolmas virke: Arvo — mitä se merkitsee lukijalle (emotionaalinen merkitys).
Viimeinen virke: Toimintakehote — mitä tehdä seuraavaksi.
Jokainen virke rakentaa edellisen päälle. Ei hintaa, ei alennusta — arvo on kokemuksessa.`,
    en: `STRUCTURE: FAB (Feature → Advantage → Benefit)
First sentence: Feature — what the bar has (concrete fact).
Second sentence: Advantage — why it's good (practical consequence).
Third sentence: Benefit — what it means to the reader (emotional significance).
Final sentence: Call to action — what to do next.
Each sentence builds on the previous. No price, no discount — value is in the experience.`,
  },
  "aida": {
    fi: `RAKENNE: AIDA (Attention → Interest → Desire → Action)
Ensimmäinen virke: Huomio — pysäytä scrollaaja. Yllätä, kysy, väitä jotain rohkeaa.
Toinen virke: Kiinnostus — rakenna konteksti. Miksi tämä on relevanttia juuri nyt?
Kolmas virke: Halu — luo kaipuu. Miltä tuntuisi olla siellä?
Neljäs virke: Toiminta — yksi selkeä CTA. Mitä klikata tai tehdä.
Koko kaari yhdessä kappaleessa. Ei hintaa, ei alennusta.`,
    en: `STRUCTURE: AIDA (Attention → Interest → Desire → Action)
First sentence: Attention — stop the scroller. Surprise, ask, claim something bold.
Second sentence: Interest — build context. Why is this relevant right now?
Third sentence: Desire — create longing. What would it feel like to be there?
Fourth sentence: Action — one clear CTA. What to click or do.
The full arc in one paragraph. No price, no discount.`,
  },
  "pas": {
    fi: `RAKENNE: PAS (Problem → Agitation → Solution)
Ensimmäinen virke: Ongelma — tunnista lukijan tilanne. "Ystävät haluavat tavata. Kukaan ei halua järjestää."
Toinen virke: Kärjistys — miksi ongelma on ärsyttävä, toistuva, ratkaisematon. "Joka kerta sama keskustelu — missä, milloin, kuka varaa."
Kolmas virke: Ratkaisu — tässä se on. "Me hoidamme tilan, pöydän ja tunnelman."
Neljäs virke: Toimintakehote. Ei hintaa, ei alennusta — ratkaisu on olemassaolon helppous.
Tämä rakenne toimii erityisen hyvin suomalaiselle yleisölle — tunnista ongelma, tarjoa helpotus.`,
    en: `STRUCTURE: PAS (Problem → Agitation → Solution)
First sentence: Problem — recognize the reader's situation. "Your friends want to meet up. No one wants to organize."
Second sentence: Agitation — why the problem is annoying, recurring, unsolved. "Same conversation every time — where, when, who books."
Third sentence: Solution — here it is. "We handle the space, the table, the atmosphere."
Fourth sentence: Call to action. No price, no discount — the solution is the ease of existing.
This structure works especially well for Finnish audiences — recognize the problem, offer relief.`,
  },
  "direct": {
    fi: `RAKENNE: Suora (Yksi lause, yksi toimintakehote)
Tämä on suomalaisen mainonnan tehokkain muoto. Yksi väite. Yksi toiminto.
Esimerkki: "Lauantai. Jazzia. Kallio." → "Varaa pöytä"
Aliarviointi on uskottavuutta. Lyhyys on itsevarmuutta.
Älä selitä. Älä perustele. Sano mitä on ja mitä tehdä.
Ei hintaa, ei alennusta.`,
    en: `STRUCTURE: Direct (One statement, one action)
This is the most effective form of Finnish advertising. One claim. One action.
Example: "Saturday. Jazz. Kallio." → "Book a table"
Understatement is credibility. Brevity is confidence.
Don't explain. Don't justify. Say what is and what to do.
No price, no discount.`,
  },
};

// ---------------------------------------------------------------------------
// Build system prompt
// ---------------------------------------------------------------------------

function buildBrandSystemPrompt(input: BrandPromptInput): string {
  const isFi = input.language === "fi";
  const templateLabel = input.templateName
    ? (MOOD_CONCEPT_LABELS[input.templateName]?.[input.language] ?? input.templateName)
    : undefined;

  const lines: string[] = [];

  // ---- Role definition ----
  if (isFi) {
    lines.push(`Olet baarin brändisisällön asiantuntija. Kirjoitat mainontaa — et tarjouksia.`);
    lines.push(`Tavoite: rakenna mielikuvaa, assosiaatiota, muistijälkeä. Ei hintoja. Ei alennuksia. Ei juomista pääasiana.`);
    lines.push(`Kirjoitat ihmiselle joka harkitsee illanviettoa — ei henkilölle joka etsii halvinta juomaa.`);
    if (templateLabel) {
      lines.push(`Teema: ${templateLabel}`);
    }
  } else {
    lines.push(`You are a bar brand content expert. You write advertising — not deals.`);
    lines.push(`Goal: build association, memory traces, desire. No prices. No discounts. Drinks are never the main subject.`);
    lines.push(`You are writing for someone considering a night out — not someone looking for the cheapest drink.`);
    if (templateLabel) {
      lines.push(`Theme: ${templateLabel}`);
    }
  }

  // ---- Compliance (structural) ----
  if (isFi) {
    lines.push(`\nNOUDATA ALKOHOLILAKIA (1102/2017 §50):`);
    lines.push(`- Älä mainitse alkoholin hintaa, alennusta, tai tarjousta.`);
    lines.push(`- Älä ehdota alkoholin parantavan mielialaa, sosiaalisia taitoja, tai henkilökohtaisia ominaisuuksia.`);
    lines.push(`- Älä kehota lisäämään alkoholin kulutusta.`);
    lines.push(`- Älä kuvaa alkoholia pääasiana — se on aina sivuroolissa tunnelmalle, seuralle, musiikille.`);
    lines.push(`- Älä käytä sanoja: ilmainen, tarjous, ale, diili, halpa, edullinen, -20%, happy hour.`);
    lines.push(`- Tämä on BRÄNDISISÄLTÖÄ — ei tarjouskampanja.`);
  } else {
    lines.push(`\nCOMPLY WITH FINNISH ALCOHOL ACT (1102/2017 §50):`);
    lines.push(`- Do not mention alcohol price, discount, or special offer.`);
    lines.push(`- Do not suggest alcohol improves mood, social skills, or personal qualities.`);
    lines.push(`- Do not encourage increased alcohol consumption.`);
    lines.push(`- Do not depict alcohol as the main subject — it is always secondary to atmosphere, company, music.`);
    lines.push(`- Do not use words: free, offer, deal, discount, cheap, affordable, -20%, happy hour.`);
    lines.push(`- This is BRAND CONTENT — not a promotional campaign.`);
  }

  // ---- Audience ----
  if (input.audience && input.audience.length > 0) {
    const audienceStr = input.audience
      .map((a) => AUDIENCE_LABELS[a]?.[input.language] ?? a)
      .join(", ");
    const guidance = input.audience
      .map((a) => AUDIENCE_GUIDANCE[a]?.[input.language])
      .filter(Boolean)
      .join(" ");
    if (isFi) {
      lines.push(`\nYLEISÖ: ${audienceStr}`);
      lines.push(guidance);
    } else {
      lines.push(`\nAUDIENCE: ${audienceStr}`);
      lines.push(guidance);
    }
  }

  // ---- Core message ----
  if (input.coreMessage) {
    const focus = CORE_MESSAGE_FOCUS[input.coreMessage]?.[input.language] ?? "";
    if (isFi) {
      const label = CORE_MESSAGE_LABELS[input.coreMessage]?.fi ?? input.coreMessage;
      lines.push(`\nYDINVIESTI: ${label}`);
    } else {
      const label = CORE_MESSAGE_LABELS[input.coreMessage]?.en ?? input.coreMessage;
      lines.push(`\nCORE MESSAGE: ${label}`);
    }
    lines.push(focus);
  }

  // ---- Atmosphere (emotional register) ----
  if (input.atmosphere && input.atmosphere.length > 0) {
    const atmosStr = input.atmosphere
      .map((a) => ATMOSPHERE_LABELS[a]?.[input.language] ?? a)
      .join(" + ");
    const layer = input.atmosphere
      .map((a) => ATMOSPHERE_LAYER[a]?.[input.language])
      .filter(Boolean)
      .join(" ");
    if (isFi) {
      lines.push(`\nTUNNELMA: ${atmosStr}`);
    } else {
      lines.push(`\nATMOSPHERE: ${atmosStr}`);
    }
    lines.push(layer);
  }

  // ---- Tone ----
  if (input.tone) {
    const toneBlock = getTonePromptBlock(input.tone, input.language);
    if (toneBlock) {
      lines.push(`\n${toneBlock}`);
    }
  }

  // ---- Copy structure ----
  if (input.copyStructure) {
    const arch = COPY_STRUCTURE_ARCHITECTURE[input.copyStructure]?.[input.language] ?? "";
    lines.push(`\n${arch}`);
  }

  // ---- Special date context ----
  if (input.isSpecialDate) {
    if (isFi) {
      lines.push(`\nERITYISPÄIVÄ: Tämä on suomalainen juhlapyhä. Sisällytä juhlan henki luontevasti — ei väkisin, ei kliseisesti. Juhla on konteksti, ei mainoslause.`);
    } else {
      lines.push(`\nSPECIAL DATE: This is a Finnish holiday. Include the holiday spirit naturally — not forced, not clichéd. The holiday is context, not a tagline.`);
    }
  }

  // ---- Image world note ----
  if (input.imageWorld && input.imageWorld !== "venue") {
    const worldLabel = IMAGE_WORLD_LABELS[input.imageWorld]?.[input.language] ?? input.imageWorld;
    if (isFi) {
      lines.push(`\nKUVAMAILMA: ${worldLabel} — kuva ei esitä baaria. Tekstin tulee tukea tätä kuvamaailmaa: tunne, ei tila; maisema, ei sisustus.`);
    } else {
      lines.push(`\nIMAGE WORLD: ${worldLabel} — the image does not show the bar. The text should support this image world: feeling, not space; landscape, not interior.`);
    }
  }

  // ---- Output format ----
  if (isFi) {
    lines.push(`\nPALAUTA VAIN validi JSON — ei muuta tekstiä. Luo 3 erilaista varianttia, jokaisella oma kulma ja tunnelma:
{
  "inferredType": "brand",
  "confidence": 0.0-1.0,
  "variants": [
    {
      "headline": "Otsikko (max 60 merkkiä) — kiinnostava, jää mieleen, alkoholilain mukainen",
      "body": "Leipäteksti (max 250 merkkiä) — rakenna tunnelmaa, älä myy tuotetta",
      "cta": "Toimintakehote (max 40 merkkiä) — esim. Varaa pöytä, Tule paikalle, Lue lisää",
      "imagePrompt": "Yksityiskohtainen kuvagenerointiprompti englanniksi (max 200 merkkiä) — kuvaile mitä kuvassa näkyy: sijainti, valaistus, värit, tunnelma, sommittelma. Älä mainitse alkoholia, baaria tai ihmisiä jos kuvamaailma ei ole baari. KRIITTINEN SÄÄNTÖ: imagePromptin tunnelman ja valaistuksen ON VASTATTAVA otsikon ja leipätekstin tunnetilaa. Jos teksti on intiimi ja lämmin → imagePromptissa on oltava matala valaistus ja lämmin tunnelma. Jos teksti on energinen ja bilettävä → imagePromptissa on oltava liikettä ja energiaa. Kuva ja teksti kertovat saman tarinan."
    },
    ...
  ]
}`);
  } else {
    lines.push(`\nRETURN ONLY valid JSON — no other text. Create 3 distinct variants, each with a different angle and mood:
{
  "inferredType": "brand",
  "confidence": 0.0-1.0,
  "variants": [
    {
      "headline": "Headline (max 60 chars) — compelling, memorable, alcohol-law compliant",
      "body": "Body text (max 250 chars) — build atmosphere, don't sell a product",
      "cta": "Call to action (max 40 chars) — e.g. Book a table, Come by, Read more",
      "imagePrompt": "Detailed image generation prompt in English (max 200 chars) — describe what's in the image: location, lighting, colors, mood, composition. Do not mention alcohol, bars, or people if the image world is not venue. CRITICAL RULE: The imagePrompt's mood and lighting MUST MATCH the emotional register of the headline and body text. If the text is intimate and warm → the imagePrompt must use low lighting and warm tones. If the text is energetic and party-like → the imagePrompt must include movement and energy. Image and copy tell the same story."
    },
    ...
  ]
}`);
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Build user prompt
// ---------------------------------------------------------------------------

function buildBrandUserPrompt(input: BrandPromptInput): string {
  const isFi = input.language === "fi";
  const templateLabel = input.templateName
    ? (MOOD_CONCEPT_LABELS[input.templateName]?.[input.language] ?? input.templateName)
    : undefined;

  const lines: string[] = [];

  if (isFi) {
    lines.push(`Luo brändisisältöä ravintolalle "${input.barName}" rakenna, älä tarjoa.`);
    if (templateLabel) {
      lines.push(`Teema: ${templateLabel}`);
    }

    const districtStr = [input.district, input.cityName].filter(Boolean).join(", ");
    lines.push(`Baarin tiedot:`);
    lines.push(`- Tyyppi: ${input.barType}`);
    if (districtStr) lines.push(`- Sijainti: ${districtStr}`);
    if (input.description) lines.push(`- Kuvaus: ${input.description}`);
    if (input.seasonalContext) lines.push(`- Vuodenaika: ${input.seasonalContext}`);

    lines.push(`\nHenkilökunnan kuvaus siitä mitä he haluavat:`);
    lines.push(`"${input.userBrief}"`);

    if (input.avoidHeadlinePatterns && input.avoidHeadlinePatterns.length > 0) {
      const avoidList = input.avoidHeadlinePatterns.join('", "');
      lines.push(`\nVÄLTÄ NÄITÄ OTSIKOITA (ne on käytetty äskettäin): "${avoidList}"`);
    }

    lines.push(`\nTUOTA: 3 erilaista varianttia. Jokaisessa: otsikko (max 60 merkkiä), leipäteksti (max 250 merkkiä), toimintakehote, ja kuvagenerointiprompti (englanniksi, max 200 merkkiä).`);
    lines.push(`Jokaisella variantilla tulee olla eri kulma tai tunnelma — esim. yksi lämmin ja kutsuva, toinen energinen, kolmas utelias.`);
    lines.push(`Älä mainitse hintoja, alennuksia, tai tarjouksia. Tämä on brändisisältöä — ei mainostarjousta.`);
    lines.push(`Palauta VAIN JSON-muodossa.`);
  } else {
    lines.push(`Create brand content for "${input.barName}" — build the brand, don't sell a deal.`);
    if (templateLabel) {
      lines.push(`Theme: ${templateLabel}`);
    }

    const districtStr = [input.district, input.cityName].filter(Boolean).join(", ");
    lines.push(`Bar details:`);
    lines.push(`- Type: ${input.barType}`);
    if (districtStr) lines.push(`- Location: ${districtStr}`);
    if (input.description) lines.push(`- Description: ${input.description}`);
    if (input.seasonalContext) lines.push(`- Season: ${input.seasonalContext}`);

    lines.push(`\nThe staff described what they want:`);
    lines.push(`"${input.userBrief}"`);

    if (input.avoidHeadlinePatterns && input.avoidHeadlinePatterns.length > 0) {
      const avoidList = input.avoidHeadlinePatterns.join('", "');
      lines.push(`\nAVOID THESE HEADLINES (recently used): "${avoidList}"`);
    }

    lines.push(`\nPRODUCE: 3 distinct variants. Each: headline (max 60 chars), body text (max 250 chars), call to action, and image generation prompt (max 200 chars).`);
    lines.push(`Each variant should have a different angle or mood — e.g. one warm and inviting, another energetic, a third curious.`);
    lines.push(`Do not mention prices, discounts, or deals. This is brand content — not a promotional offer.`);
    lines.push(`Return ONLY JSON format.`);
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build a complete system + user prompt for brand/advertising mode content generation.
 *
 * This is the advertising-mode equivalent of buildEventPrompt/buildPassPrompt.
 * Instead of extracting deal/event/pass details, it guides the LLM to produce
 * brand-building content: headlines, body copy, and CTAs that create feeling,
 * association, and memory — without any reference to price or alcohol incentives.
 */
export function buildBrandPrompt(input: BrandPromptInput): BrandPromptOutput {
  const systemPrompt = buildBrandSystemPrompt(input);
  const userPrompt = buildBrandUserPrompt(input);

  return { systemPrompt, userPrompt };
}

/**
 * Convenience: build a brand prompt directly from a DirectorDecision + bar profile.
 * This is the main path — the CreativeDirector pre-fills ingredients, and this
 * function converts them into a complete LLM prompt.
 */
export function buildBrandPromptFromDirector(
  decision: DirectorDecision,
  bar: {
    name: string;
    type: string;
    district?: string | null;
    cityName?: string | null;
    amenities?: string | null;
    priceRange?: string | null;
    description?: string | null;
    musicTags?: string | null;
    vipEnabled?: boolean;
  },
  userBrief: string,
  language: "en" | "fi" = "fi",
  tone?: ContentTone,
): BrandPromptOutput {
  // Build bar hook context for the hooks block
  const barHookContext: BarHookContext = {
    type: bar.type,
    district: bar.district ?? undefined,
    amenities: (bar.amenities?.split(",") ?? []).map((a) => a.trim().toLowerCase()),
    priceRange: bar.priceRange ?? undefined,
    musicTags: (bar.musicTags?.split(",") ?? []).map((t) => t.trim().toLowerCase()),
  };

  // Build the bar hooks block — inject it into the system prompt
  const hooksBlock = buildBarHooksBlock(barHookContext, language);

  // Build the base system + user prompts
  const { systemPrompt, userPrompt } = buildBrandPrompt({
    barName: bar.name,
    barType: bar.type,
    district: bar.district,
    cityName: bar.cityName,
    amenities: bar.amenities,
    priceRange: bar.priceRange,
    description: bar.description,
    musicTags: bar.musicTags,
    vipEnabled: bar.vipEnabled,
    templateName: decision.suggestTemplate,
    userBrief,
    language,
    audience: decision.audience,
    coreMessage: decision.coreMessage,
    atmosphere: decision.atmosphere,
    imageWorld: decision.imageWorld,
    copyStructure: decision.copyStructure,
    tone: tone ?? "WARM_INVITING",
    isSpecialDate: decision.isSpecialDate,
    seasonalContext: decision.seasonalContext,
    avoidHeadlinePatterns: decision.avoidHeadlinePatterns,
  });

  // Append bar hooks to the system prompt
  const fullSystemPrompt = hooksBlock
    ? `${systemPrompt}\n\n${hooksBlock}`
    : systemPrompt;

  return { systemPrompt: fullSystemPrompt, userPrompt };
}
