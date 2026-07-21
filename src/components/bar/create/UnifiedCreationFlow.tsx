"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import styled from "styled-components";
import type { ContentType, FormState } from "./types";
import { PROMOTION_TYPES } from "./types";
import type { ContentTone } from "./ToneSelector";
import { TONE_OPTIONS } from "./ToneSelector";
import ImageUploader from "./shared/ImageUploader";
import ScheduleStep from "./ScheduleStep";
import { deriveImageChips } from "@/lib/prompts/tone-to-image-chips";
import { TEMPLATE_CHARACTERISTICS } from "@/lib/compliance/prompts";
import {
  getWizardForTemplate,
  assembleWizardPrompt,
  type WizardStep,
} from "@/lib/prompts/template-wizards";
import {
  AUDIENCE_LABELS,
  CORE_MESSAGE_LABELS,
  ATMOSPHERE_LABELS,
  IMAGE_WORLD_LABELS as CREATIVE_IMAGE_WORLD_LABELS,
  COPY_STRUCTURE_LABELS,
} from "@/lib/prompts/creative-director";
import type {
  AudienceChip,
  CoreMessageChip,
  AtmosphereChip,
  ImageWorldChip,
  CopyStructureChip,
} from "@/lib/prompts/creative-director";
import {
  subjectsForImageWorld,
  IMAGE_WORLD_CHIP_TO_COMPLIANCE,
  SUBJECT_PRESETS,
} from "@/lib/compliance/image-compliance";
import { getTemplateToneRecommendations } from "@/lib/prompts/synergy-rules";
import {
  getScoredContexts,
  type ScoredContext,
} from "@/lib/prompts/context-analyzer";
import {
  validatePlatform,
  getPlatformWarnings,
  formatPlatformWarning,
  getLimitStatusColor,
  getReadabilityColor,
  PLATFORM_LIMITS,
} from "@/lib/utils/platform-validator";
import {
  getHookAnnotation,
  type HookAnnotation,
} from "@/lib/utils/hook-classifier";
import {
  type VoiceProfile,
  getVoiceSummary,
  buildVoiceProfileBlock,
} from "@/lib/voice-profile";
import {
  BEAT_DEFS,
  BEAT_ORDER,
  type CampaignBeatJob,
} from "@/lib/prompts/build-campaign-prompt";

// ---- Canvas helpers for social card export ----

/** Draw a rounded rectangle path on a canvas context */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/** Draw wrapped text on a canvas context, returning the next y position */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(" ");
  let line = "";
  let currentY = y;
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      currentY += lineHeight;
      line = word;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, x, currentY);
  return currentY + lineHeight;
}

type CampaignBeatResult = {
  job: CampaignBeatJob;
  headline: string;
  body: string;
  cta: string;
  hookPattern?: string;
  imagePrompt: string;
};
import {
  getTemplates,
  getTemplatesByCategory,
  getSuggestedTemplates,
  CATEGORY_LABELS,
  type PromotionTemplate,
  type TemplateCategory,
} from "@/lib/prompts/promotion-templates";
import TemplateDetailPanel from "./TemplateDetailPanel";
import {
  getFieldsForTemplate,
  formatTemplateFieldValues,
} from "@/lib/prompts/template-fields";

// ---- Types ----

type Language = "fi" | "en";
type FlowStep = "type" | "brief" | "refine" | "images" | "schedule" | "publish";

interface UnifiedCreationFlowProps {
  barId: string;
  barName?: string;
  barType?: string | null;
  barCoverImage?: string | null;
  contentType: ContentType;
  creationMode?: "brand" | "promotional" | "campaign";
  onModeChange?: (mode: "brand" | "promotional" | "campaign") => void;
  formState: FormState;
  contentTone?: ContentTone | null;
  onGenerated: (data: Record<string, unknown>) => void;
  onFieldChange: (field: string, value: unknown) => void;
  onTypeChange: (type: ContentType) => void;
  onSubmit: () => void;
  submitting?: boolean;
  /** Start at a specific step instead of the type selection grid. */
  initialStep?: FlowStep;
  // Brand ingredient props
  brandAudience?: string[];
  onBrandAudienceChange?: (chips: string[]) => void;
  brandCoreMessage?: string | null;
  onBrandCoreMessageChange?: (chip: string | null) => void;
  brandAtmosphere?: string[];
  onBrandAtmosphereChange?: (chips: string[]) => void;
  brandImageWorld?: string;
  onBrandImageWorldChange?: (chip: string) => void;
  brandCopyStructure?: string;
  onBrandCopyStructureChange?: (chip: string) => void;
  brandTemplateName?: string;
  onBrandTemplateNameChange?: (name: string) => void;
}

interface EditableVariant {
  title: string;
  description: string;
  type: string;
  discount: number | null;
  callToAction: string;
  /** 2-3 context-aware CTA options generated by AI — varies by urgency/audience */
  ctaOptions: string[];
  /** AI-labeled hook pattern — one of the six hook types. Falls back to heuristic classification if missing. */
  hookPattern?: string | null;
  accentColor: string;
  /** Title font style chosen by AI based on bar positioning */
  titleFontStyle?: string | null;
  conditions: string;
  visualDirection: {
    description: string;
    keyElements: string[];
    styleNotes: string;
  } | null;
  /** The Flux prompt — derived from visualDirection but fully editable */
  fluxPrompt: string;
  /** User-supplied image mood/context — e.g. "Christmas party", "summer beach",
   *  "golden hour". Prepended to the flux prompt during image generation. */
  imageMood?: string;
  /** Marketing strategy label for this variant — derived from the three
   *  fixed differentiation angles (offer, vibe, social). */
  strategy?: "offer" | "vibe" | "social";
}

// ---- Constants ----

/** Strategy labels derived from the AI's three fixed differentiation angles.
 *  Variant 0 = offer-focused, 1 = vibe-focused, 2 = social-focused. */
const STRATEGY_LABELS: Record<
  "offer" | "vibe" | "social",
  { en: string; fi: string; color: string }
> = {
  offer: { en: "Offer-driven", fi: "Tarjousvetoinen", color: "#f59e0b" },
  vibe: { en: "Vibe-driven", fi: "Tunnelmavetoinen", color: "#8b5cf6" },
  social: { en: "Social", fi: "Yhteisöllinen", color: "#06b6d4" },
};

const STRATEGIES: Array<"offer" | "vibe" | "social"> = [
  "offer",
  "vibe",
  "social",
];

const TYPE_OPTIONS: {
  value: ContentType;
  label: string;
  desc: string;
  emoji: string;
}[] = [
  {
    value: "promotion",
    label: "Promotion",
    desc: "Happy hours, drink specials, food deals",
    emoji: "",
  },
  {
    value: "event",
    label: "Event",
    desc: "Live music, game nights, theme parties",
    emoji: "",
  },
  {
    value: "campaign",
    label: "Ad Campaign",
    desc: "Boosted listings, featured placements",
    emoji: "",
  },
  {
    value: "pass",
    label: "Pass / Ticket",
    desc: "Skip-line, VIP, cover charge passes",
    emoji: "",
  },
];

const TEMPLATES: Record<Language, { label: string; prompt: string }[]> = {
  en: [
    {
      label: "After-Work",
      prompt:
        "After-work gathering. The moment the workday ends and the evening begins. Describe the transition — the first drink, the decompression, the shift in energy as people unwind. Focus on atmosphere over specifics.",
    },
    {
      label: "Ladies Night",
      prompt:
        "A night designed for groups of friends. The music, the welcome, the space — all curated to make groups feel at home. Describe the social energy, the laughter, the feeling of a night out with your people.",
    },
    {
      label: "Live Music",
      prompt:
        "Music takes over the room. The first chord, the shifting crowd, the shared experience of live sound. Describe the performer, the audience, the moment when everything else fades and only the music matters.",
    },
    {
      label: "Game Night",
      prompt:
        "Friendly competition with drinks in hand. The playful tension, the surprise victory, the laughter after a wrong answer. Describe the social glue of games — how they turn strangers into teammates.",
    },
    {
      label: "Food Special",
      prompt:
        "The kitchen is showing off. A dish worth planning your evening around. Describe the craftsmanship, the ingredients, the pairing, the satisfaction of a meal that exceeds expectations.",
    },
    {
      label: "VIP Experience",
      prompt:
        "Behind the rope, above the crowd. A different pace, a different level of attention. Describe what makes this experience feel elevated — not just exclusive, but genuinely better.",
    },
    {
      label: "Signature Evening",
      prompt:
        "A curated night that couldn't happen anywhere else. Something unique to this bar, this team, this moment. Describe the concept, the craft, the reason someone would cross town for this.",
    },
    {
      label: "Theme Night",
      prompt:
        "The bar transforms. A concept, a dress code, a shared reality that everyone in the room is part of. Describe the immersion — what it looks like, sounds like, feels like to step into a different world for one night.",
    },
  ],
  fi: [
    {
      label: "After-Work",
      prompt:
        "After-work-kokoontuminen. Hetki jolloin työpäivä päättyy ja ilta alkaa. Kuvaile siirtymä — ensimmäinen juoma, rentoutuminen, energian muutos. Keskity tunnelmaan.",
    },
    {
      label: "Naistenilta",
      prompt:
        "Ilta ystäväporukoille. Musiikki, vastaanotto, tila — kaikki kuratoitu ryhmien viihtymiseen. Kuvaile sosiaalista energiaa, naurua, yhdessä vietetyn illan tunnelmaa.",
    },
    {
      label: "Elävä musiikki",
      prompt:
        "Musiikki valtaa tilan. Ensimmäinen sointu, liikkuva yleisö, jaettu live-äänen kokemus. Kuvaile esiintyjää, yleisöä, hetkeä jolloin kaikki muu katoaa.",
    },
    {
      label: "Peli-ilta",
      prompt:
        "Ystävällismielistä kilpailua juoman äärellä. Leikkisä jännitys, yllätysvoitto, nauru väärän vastauksen jälkeen. Kuvaile pelien sosiaalista liimaa.",
    },
    {
      label: "Ruokatarjous",
      prompt:
        "Keittiö näyttää osaamistaan. Annos, jonka ympärille kannattaa suunnitella ilta. Kuvaile käsityötaitoa, raaka-aineita, makupareja, ateriaa joka ylittää odotukset.",
    },
    {
      label: "VIP-kokemus",
      prompt:
        "Köyden takana, väkijoukon yllä. Eri rytmi, eri huomion taso. Kuvaile mikä tekee tästä kokemuksesta kohotetun — ei vain eksklusiivisen, vaan aidosti paremman.",
    },
    {
      label: "Talon suositukset",
      prompt:
        "Kuratoitu ilta jota ei voisi tapahtua missään muualla. Jotain ainutlaatuista tälle baarille, tälle tiimille, tälle hetkelle. Kuvaile konsepti, syy miksi joku matkustaisi kaupungin halki tämän takia.",
    },
    {
      label: "Teemailta",
      prompt:
        "Baari muuntuu. Konsepti, pukukoodi, jaettu todellisuus. Kuvaile immersio — miltä näyttää, kuulostaa, tuntuu astua eri maailmaan yhden illan ajaksi.",
    },
  ],
};

const EVENT_TEMPLATES: Record<Language, { label: string; prompt: string }[]> = {
  en: [
    {
      label: "Live Music",
      prompt:
        "A night of live music. Describe the performer, the sound filling the room, the crowd's energy as the first notes hit. Focus on the shared experience — the moment when the music takes over and everything else fades.",
    },
    {
      label: "DJ Night",
      prompt:
        "The DJ takes control of the room. Describe the beats, the dance floor, the late-night energy. The music builds, the crowd moves, the night peaks. Focus on the rhythm and the atmosphere.",
    },
    {
      label: "Quiz Night",
      prompt:
        "Teams compete, brains are tested. Describe the friendly rivalry, the surprise answers, the prizes at stake. A weekly ritual where strangers become teammates over trivia and drinks.",
    },
    {
      label: "Sports Screening",
      prompt:
        "The big game on the big screen. Describe the collective tension, the cheers, the groans — an entire room experiencing the same moment together. Game-day energy with drinks in hand.",
    },
    {
      label: "Tasting Event",
      prompt:
        "A guided tasting experience. Describe the craftsmanship, the expert leading the session, the flavors unfolding. Limited spots, premium experience — a journey for the senses.",
    },
    {
      label: "Karaoke Night",
      prompt:
        "The microphone is open and the stage belongs to everyone. Describe the courage, the surprise talent, the shared joy of singing together. A night where the audience becomes the entertainment.",
    },
    {
      label: "Comedy Night",
      prompt:
        "Laughter fills the room. Describe the comedians, the jokes landing, the shared experience of a room laughing together. Stand-up that turns a regular night into something memorable.",
    },
    {
      label: "Open Mic",
      prompt:
        "The stage is open for anyone with something to share. Describe the raw talent, the unexpected moments, the supportive crowd. A platform for new voices — musicians, poets, comedians.",
    },
  ],
  fi: [
    {
      label: "Elävä musiikki",
      prompt:
        "Illallinen elävää musiikkia. Kuvaile esiintyjää, äänen täyttämää tilaa, yleisön energiaa ensimmäisten sointujen osuessa. Keskity jaettuun kokemukseen — hetkeen jolloin musiikki vie mukanaan.",
    },
    {
      label: "DJ-ilta",
      prompt:
        "DJ ottaa tilan haltuun. Kuvaile bittejä, tanssilattiaa, myöhäisillan energiaa. Musiikki rakentuu, väkijoukko liikkuu, ilta huipentuu. Keskity rytmiin ja tunnelmaan.",
    },
    {
      label: "Tietovisa",
      prompt:
        "Joukkueet kilpailevat, aivot koetuksella. Kuvaile ystävällistä kilpailua, yllättäviä vastauksia, palkintoja pelissä. Viikoittainen rituaali jossa tuntemattomista tulee joukkuetovereita.",
    },
    {
      label: "Urheilulähetys",
      prompt:
        "Iso peli isolla ruudulla. Kuvaile kollektiivista jännitystä, hurrauksia, huokauksia — koko huone kokee saman hetken yhdessä. Pelipäivän energiaa juomat kädessä.",
    },
    {
      label: "Maistelutapahtuma",
      prompt:
        "Opastettu maistelukokemus. Kuvaile käsityötaitoa, asiantuntijan johtamaa sessiota, makujen avautumista. Rajoitetut paikat, premium-kokemus — matka aisteille.",
    },
    {
      label: "Karaoke-ilta",
      prompt:
        "Mikki on auki ja lava kuuluu kaikille. Kuvaile rohkeutta, yllättävää lahjakkuutta, yhteistä laulamisen iloa. Ilta jossa yleisöstä tulee viihde.",
    },
    {
      label: "Komediailta",
      prompt:
        "Nauru täyttää huoneen. Kuvaile koomikoita, osuvia vitsejä, yhdessä nauravan huoneen jaettua kokemusta. Stand-up joka tekee tavallisesta illasta mieleenpainuvan.",
    },
    {
      label: "Avoin mikki",
      prompt:
        "Lava on avoin kaikille joilla on jotain jaettavaa. Kuvaile raakaa lahjakkuutta, odottamattomia hetkiä, kannustavaa yleisöä. Alusta uusille äänille — muusikoille, runoilijoille, koomikoille.",
    },
  ],
};

const PASS_TEMPLATES: Record<Language, { label: string; prompt: string }[]> = {
  en: [
    {
      label: "Skip the Line",
      prompt:
        "Priority entry pass — no waiting, straight in. Describe the feeling of walking past the queue, the VIP treatment from the door. Focus on the convenience and status of skipping the line on busy nights.",
    },
    {
      label: "Bottle Service",
      prompt:
        "Premium bottle service with reserved table. Describe the elevated experience — your own space, dedicated service, a premium bottle with mixers. The night done right.",
    },
    {
      label: "Drink Package",
      prompt:
        "Pre-paid drink package for the night. Describe the value, the convenience, the freedom of having your drinks sorted before you arrive. No wallet needed — just show up and enjoy.",
    },
    {
      label: "Table Reservation",
      prompt:
        "Reserved table for your group. Describe the peace of mind — your spot is guaranteed, no searching for seats on a busy night. Your group's home base for the evening.",
    },
    {
      label: "Group Package",
      prompt:
        "Everything your group needs in one pass. Describe the all-inclusive experience — entry, drinks, a reserved area. The easiest way to organize a group night out.",
    },
    {
      label: "Cover Included",
      prompt:
        "Entry cover included in the pass. Describe the simplicity — one upfront payment, everything handled. No fumbling for cash at the door, just walk in and start your night.",
    },
  ],
  fi: [
    {
      label: "Ohita jono",
      prompt:
        "Prioriteettisisäänpääsy — ei odottelua, suoraan sisään. Kuvaile tunnetta jonon ohi kävelemisestä, VIP-kohtelua ovelta alkaen. Keskity mukavuuteen ja statukseen kiireisinä iltoina.",
    },
    {
      label: "Pullopalvelu",
      prompt:
        "Premium-pullopalvelu varatulla pöydällä. Kuvaile kohotettua kokemusta — oma tila, oma palvelu, premium-pullo lisukkeineen. Ilta tehtynä oikein.",
    },
    {
      label: "Juomapaketti",
      prompt:
        "Ennakkoon maksettu juomapaketti illalle. Kuvaile arvoa, mukavuutta, vapautta siitä että juomat on hoidettu ennen saapumista. Ei lompakkoa tarvita — saavu ja nauti.",
    },
    {
      label: "Pöytävaraus",
      prompt:
        "Varattu pöytä ryhmällesi. Kuvaile mielenrauhaa — paikkasi on taattu, ei paikkojen etsimistä kiireisenä iltana. Ryhmäsi kotipesä illaksi.",
    },
    {
      label: "Ryhmäpaketti",
      prompt:
        "Kaikki mitä ryhmäsi tarvitsee yhdessä passissa. Kuvaile all-inclusive-kokemusta — sisäänpääsy, juomat, varattu alue. Helpoin tapa järjestää ryhmän ilta.",
    },
    {
      label: "Sisäänpääsy sisältyy",
      prompt:
        "Sisäänpääsymaksu sisältyy passiin. Kuvaile yksinkertaisuutta — yksi ennakkomaksu, kaikki hoidettu. Ei käteisen kaivelua ovella, kävele sisään ja aloita iltasi.",
    },
  ],
};

const LAYOUT_HINTS = [
  {
    template: "split" as const,
    label: "Split",
    desc: "Photo left, text right",
  },
  {
    template: "centered" as const,
    label: "Centered",
    desc: "Bold headline focus",
  },
  { template: "card" as const, label: "Card", desc: "Square, photo-forward" },
];

// ---- Example cards shown when template (+ tone) is selected, replacing the
//      free-text textarea. Each template has 2 sample outputs so bar owners see
//      what kind of content the selected ingredients will produce. ----

interface ExampleCard {
  title: string;
  description: string;
}

const EXAMPLE_CARDS: Record<Language, Record<string, ExampleCard[]>> = {
  en: {
    "After-Work": [
      {
        title: "Unwind After Work — Drinks From 4 PM",
        description:
          "The workday is over. Step in, grab a seat, and let the evening begin with handcrafted cocktails and a relaxed vibe.",
      },
      {
        title: "Your After-Work Ritual Starts Here",
        description:
          "Wind down with colleagues or solo. Great drinks, chill music, and the perfect transition from desk to downtime.",
      },
    ],
    "Ladies Night": [
      {
        title: "Ladies Night — Bring Your Crew",
        description:
          "The ultimate girls' night out. Curated drinks, the best playlist in town, and a space made for unforgettable nights.",
      },
      {
        title: "Wednesday Is Ladies Night",
        description:
          "Round up your best people. Welcome drinks, a buzzing atmosphere, and a night that always delivers.",
      },
    ],
    "Live Music": [
      {
        title: "Live at the Bar — This Friday",
        description:
          "A night of raw talent and electric energy. Grab a drink, find your spot, and let the music take over.",
      },
      {
        title: "Live Music Night — Free Entry",
        description:
          "Discover your new favorite artist. Craft cocktails, great sound, and an atmosphere you won't want to leave.",
      },
    ],
    "Game Night": [
      {
        title: "Game Night — Trivia, Prizes & Drinks",
        description:
          "Assemble your team. Competitive, chaotic, and always a good time — with drinks to fuel the action.",
      },
      {
        title: "Weekly Game Night — Everyone's Invited",
        description:
          "Board games, trivia, and friendly rivalry. Great drinks, bigger laughs, and bragging rights on the line.",
      },
    ],
    "Food Special": [
      {
        title: "The Kitchen Is Showing Off Tonight",
        description:
          "A dish worth planning your evening around. Seasonal ingredients, bold flavors, and the perfect drink pairing.",
      },
      {
        title: "Chef's Special — Limited This Week",
        description:
          "Something new from the kitchen. Crafted with care, served with pride. Come hungry, leave happy.",
      },
    ],
    "VIP Experience": [
      {
        title: "Go VIP — A Different Level of Service",
        description:
          "Skip the line. Premium seating, dedicated service, and a private atmosphere above the crowd.",
      },
      {
        title: "VIP Night — This Is How It's Done",
        description:
          "Behind the rope. Bottle service, personal attention, and an experience that feels genuinely elevated.",
      },
    ],
    "Signature Evening": [
      {
        title: "A Curated Evening — One Night Only",
        description:
          "Something unique is happening here. A concept built for this bar, this team, this moment. You'll want to be here.",
      },
      {
        title: "The Signature Experience — Tonight",
        description:
          "Not just another night out. A crafted atmosphere, exceptional drinks, and a reason to cross town.",
      },
    ],
    "Theme Night": [
      {
        title: "The Bar Transforms — Theme Night",
        description:
          "Step into a different world. Dress the part, play the role, and experience the bar like never before.",
      },
      {
        title: "Theme Night — This One's Special",
        description:
          "Costumes, cocktails, and a shared reality. One night only — the bar becomes something extraordinary.",
      },
    ],
  },
  fi: {
    "After-Work": [
      {
        title: "After-Work — Juomat klo 16 Alkaen",
        description:
          "Työpäivä on ohi. Astu sisään, nappaa paikka ja anna illan alkaa käsityödrinkkien ja rennon tunnelman kera.",
      },
      {
        title: "After-Work-rituaalisi Alkaa Täällä",
        description:
          "Rentoudu kollegoiden kanssa tai yksin. Hyvät juomat, rento musiikki ja täydellinen siirtymä työpöydältä vapaa-aikaan.",
      },
    ],
    Naistenilta: [
      {
        title: "Naistenilta — Kokoa Porukkasi",
        description:
          "Täydellinen tyttöjen ilta. Kuratoidut drinkit, kaupungin paras soittolista ja tila tehty unohtumattomia iltoja varten.",
      },
      {
        title: "Keskiviikko On Naistenilta",
        description:
          "Kerää parhaat tyyppisi. Tervetuliaisdrinkit, sykkivä tunnelma ja ilta joka aina toimittaa.",
      },
    ],
    "Elävä musiikki": [
      {
        title: "Livenä Baarissa — Tänä Perjantaina",
        description:
          "Illallinen raakaa lahjakkuutta ja sähköistä energiaa. Nappaa juoma, löydä paikkasi ja anna musiikin viedä.",
      },
      {
        title: "Live-musiikki-ilta — Vapaa Pääsy",
        description:
          "Löydä uusi suosikkiartistisi. Käsityödrinkit, loistava soundi ja tunnelma josta et halua lähteä.",
      },
    ],
    "Peli-ilta": [
      {
        title: "Peli-ilta — Tietovisa, Palkinnot & Juomat",
        description:
          "Kokoa tiimisi. Kilpailuhenkistä, kaoottista ja aina hyvää aikaa — juomat vauhdittamassa toimintaa.",
      },
      {
        title: "Viikoittainen Peli-ilta — Kaikki Tervetulleita",
        description:
          "Lautapelejä, tietovisaa ja ystävällistä kilpailua. Hyvät juomat, isot naurut ja kerskumisoikeus pelissä.",
      },
    ],
    Ruokatarjous: [
      {
        title: "Keittiö Näyttää Osaamistaan Tänään",
        description:
          "Annos, jonka ympärille kannattaa suunnitella ilta. Kausiraaka-aineita, rohkeita makuja ja täydellinen juomasuositus.",
      },
      {
        title: "Kokin Suositus — Rajoitettu Tällä Viikolla",
        description:
          "Jotain uutta keittiöstä. Huolella valmistettu, ylpeydellä tarjoiltu. Tule nälkäisenä, lähde onnellisena.",
      },
    ],
    "VIP-kokemus": [
      {
        title: "VIP — Eri Tasolla Palvelua",
        description:
          "Ohita jono. Premium-istumapaikat, oma palvelu ja yksityinen tunnelma väkijoukon yläpuolella.",
      },
      {
        title: "VIP-ilta — Näin Se Tehdään",
        description:
          "Köyden takana. Pullopalvelu, henkilökohtainen huomio ja kokemus joka tuntuu aidosti kohotetulta.",
      },
    ],
    "Talon suositukset": [
      {
        title: "Kuratoitu Ilta — Vain Tänään",
        description:
          "Jotain ainutlaatuista tapahtuu täällä. Konsepti rakennettu tälle baarille, tälle tiimille, tälle hetkelle. Haluat olla täällä.",
      },
      {
        title: "Talon Suositus — Tänä Iltana",
        description:
          "Ei vain yksi ilta muiden joukossa. Kuratoitu tunnelma, poikkeukselliset juomat ja syy matkustaa kaupungin halki.",
      },
    ],
    Teemailta: [
      {
        title: "Baari Muuntuu — Teemailta",
        description:
          "Astu eri maailmaan. Pukeudu osaan, näyttele roolisi ja koe baari kuten et koskaan ennen.",
      },
      {
        title: "Teemailta — Tämä On Erityinen",
        description:
          "Asusteita, cocktaileja ja jaettu todellisuus. Vain yhden illan — baarista tulee jotain poikkeuksellista.",
      },
    ],
  },
};

const GENERATING_MESSAGES: Record<Language, string> = {
  fi: "Luodaan vaihtoehtoja...",
  en: "Creating your options...",
};

const GENERATING_IMAGES_MSG: Record<Language, string> = {
  fi: "Luodaan kuvia...",
  en: "Generating images...",
};

// ---- Progress labels ----

const STEP_LABELS: Record<FlowStep, string> = {
  type: "What are you creating?",
  brief: "Describe what's happening",
  refine: "Review & edit",
  images: "Choose your image",
  schedule: "Set your schedule",
  publish: "Review & publish",
};

function stepNumber(step: FlowStep): number {
  return (
    ["type", "brief", "refine", "images", "schedule", "publish"].indexOf(step) +
    1
  );
}

// ---- Progress display labels (short, for the progress bar) ----

const PROGRESS_LABELS: Record<FlowStep, string> = {
  type: "Type",
  brief: "Brief",
  refine: "Refine",
  images: "Image",
  schedule: "Schedule",
  publish: "Publish",
};

// ---- Contextual suggestions ----

interface ContextSuggestion {
  label: string; // Short display text that fits in chips
  value: string; // Full description injected into prompt generation
}

function getContextualSuggestions(language: Language): ContextSuggestion[] {
  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();
  const dayOfWeek = now.toLocaleDateString("en-US", { weekday: "long" });
  const hour = now.getHours();
  const suggestions: ContextSuggestion[] = [];

  if (dayOfWeek === "Friday" || dayOfWeek === "Saturday") {
    suggestions.push({
      label: language === "fi" ? "Viikonloppu" : "Weekend energy",
      value:
        language === "fi"
          ? "Viikonlopun tunnelma, bilekansa liikkeellä, korkea energia"
          : "Weekend energy — the crowd is ready, the vibe is high, the night is wide open",
    });
  } else if (dayOfWeek === "Thursday") {
    suggestions.push({
      label: language === "fi" ? "Torstai-ilta" : "Thursday night",
      value:
        language === "fi"
          ? "Torstai on uusi perjantai — viikonlopun odotus, rento mutta energinen fiilis"
          : "Thursday — the weekend starts early, the smart crowd is already out",
    });
  } else {
    suggestions.push({
      label: language === "fi" ? "Arki-ilta" : "Weekday calm",
      value:
        language === "fi"
          ? "Arki-illan rentous — vähemmän tungosta, enemmän tilaa nauttia"
          : "Weekday calm — less crowd, more room to breathe, the regulars' night",
    });
  }

  if (hour < 12) {
    suggestions.push({
      label: language === "fi" ? "Päivätapahtuma" : "Daytime",
      value:
        language === "fi"
          ? "Päivätapahtuma — brunssi, lounas, aikainen startti"
          : "Daytime event — brunch, lunch, early start, different energy",
    });
  } else if (hour >= 16 && hour < 20) {
    suggestions.push({
      label: language === "fi" ? "After-work" : "After-work",
      value:
        language === "fi"
          ? "After-work-aika — toimistolta suoraan, rentoutumisen hetki"
          : "After-work hours — straight from the office, the decompression hour",
    });
  } else {
    suggestions.push({
      label: language === "fi" ? "Myöhäinen ilta" : "Late night",
      value:
        language === "fi"
          ? "Iltatunnelma — myöhäinen ilta, bileet käynnissä, yöelämän syke"
          : "Late night energy — the party is alive, the night crowd has arrived",
    });
  }

  if (month >= 5 && month <= 7) {
    suggestions.push({
      label: language === "fi" ? "Kesäterassi" : "Summer terrace",
      value:
        language === "fi"
          ? "Kesäterassi — ulkoilma, auringonlasku, pitkät illat"
          : "Summer terrace season — outdoor, sunset, long evenings, fresh air",
    });
  } else if (month >= 11 || month <= 1) {
    suggestions.push({
      label: language === "fi" ? "Talvitunnelma" : "Winter cozy",
      value:
        language === "fi"
          ? "Talvinen tunnelma — lämmintä valoa, pimeyttä vastaan, sisätilojen kodikkuus"
          : "Winter warmth — cozy indoors, warm lighting, escape from the cold",
    });
  }

  if (month === 4 && day >= 28 && day <= 30) {
    suggestions.push({
      label: language === "fi" ? "Vappu" : "Vappu",
      value:
        language === "fi"
          ? "Vappu-tunnelma — kevään juhla, kaupungin suurin karnevaali"
          : "Vappu celebration — Finland's biggest carnival, spring festival",
    });
  }

  suggestions.push({
    label: language === "fi" ? "Syntymäpäivät" : "Birthday",
    value:
      language === "fi"
        ? "Syntymäpäivät tai juhlat — ryhmävaraukset, yksityistila"
        : "Birthday or celebration — group bookings, private area",
  });
  suggestions.push({
    label: language === "fi" ? "Treffi-ilta" : "Date night",
    value:
      language === "fi"
        ? "Treffi-ilta — intiimi tunnelma, kahden hengen pöydät"
        : "Date night — intimate atmosphere, tables for two",
  });

  return suggestions;
}

/** Builds a label→value lookup map from the scored context set. */
function getContextValueMap(
  contexts: ScoredContext[],
  language: "en" | "fi",
): Map<string, string> {
  return new Map(
    contexts.map((s) => [s.label[language], s.value[language]]),
  );
}

// ---- Tone instruction for appending to textarea ----

function toneInstructionText(tone: ContentTone, language: Language): string {
  if (language === "fi") {
    const map: Record<ContentTone, string> = {
      BOLD_ENERGETIC:
        "Äänensävy: rohkea ja energinen. Lyhyitä lauseita, aktiivisia verbejä, suoria kehotuksia.",
      WARM_INVITING:
        "Äänensävy: lämmin ja kutsuva. Keskity tunnelmaan ja vieraanvaraisuuteen.",
      EDGY_IRREVERENT:
        "Äänensävy: ronski ja railakas. Rentoa, suoraa, persoonallista.",
      ELEGANT_PREMIUM:
        "Äänensävy: elegantti ja premium. Hillittyä, laadukasta, hienostunutta.",
      PLAYFUL_FUN: "Äänensävy: leikkisä ja hauska. Iloinen, energinen, rento.",
      COMMUNITY_LOCAL: "Äänensävy: yhteisöllinen ja paikallinen. Naapurillinen, tuttu, vaatimaton.",
      ROMANTIC_INTIMATE: "Äänensävy: romanttinen ja intiimi. Pehmeä, aistillinen, pariskuntakeskeinen.",
      MYSTERIOUS_EXCLUSIVE: "Äänensävy: salaperäinen ja eksklusiivinen. Arvoituksellinen, minimalistinen.",
      ADVENTUROUS_CURIOUS: "Äänensävy: seikkailunhaluinen ja utelias. Uutuusvetoinen, kokeellinen.",
      NOSTALGIC_CLASSIC: "Äänensävy: nostalginen ja klassinen. Ajaton, itsevarma, perintö edellä.",
    };
    return map[tone];
  }
  const map: Record<ContentTone, string> = {
    BOLD_ENERGETIC:
      "Tone: bold and energetic. Short sentences, active verbs, direct CTAs.",
    WARM_INVITING:
      "Tone: warm and inviting. Focus on atmosphere and hospitality.",
    EDGY_IRREVERENT:
      "Tone: edgy and irreverent. Casual, direct, personality-driven.",
    ELEGANT_PREMIUM: "Tone: elegant and premium. Understated sophistication.",
    PLAYFUL_FUN: "Tone: playful and fun. Upbeat, emoji-friendly, energetic.",
    COMMUNITY_LOCAL: "Tone: community and local. Neighbourly, familiar, unpretentious.",
    ROMANTIC_INTIMATE: "Tone: romantic and intimate. Soft, sensual, couple-focused.",
    MYSTERIOUS_EXCLUSIVE: "Tone: mysterious and exclusive. Cryptic, minimal, secret-door energy.",
    ADVENTUROUS_CURIOUS: "Tone: adventurous and curious. Novelty-driven, educational, craft-forward.",
    NOSTALGIC_CLASSIC: "Tone: nostalgic and classic. Timeless, confident, heritage-forward.",
  };
  return map[tone];
}

// ---- Build initial Flux prompt from visualDirection ----

function buildInitialFluxPrompt(
  vd:
    | { description: string; keyElements: string[]; styleNotes: string }
    | null
    | undefined,
): string {
  if (!vd) return "";
  const elements = vd.keyElements?.length
    ? `Key elements: ${vd.keyElements.join(", ")}.`
    : "";
  const notes = vd.styleNotes ? `Style: ${vd.styleNotes}.` : "";
  return [vd.description, elements, notes].filter(Boolean).join(" ");
}

// ---- Build synthesized creative brief from ingredients ----
// Produces a professional creative brief that reads like a senior marketing
// brief — weaving template, tone, context, and bar identity into a unified
// creative direction. Each establishment type gets a unique framing.
// The brief explicitly shows HOW ingredients connect and WHY the combination works.

function buildPreviewPrompt(
  barName: string,
  barType: string | null | undefined,
  prompt: string,
  template: string | null,
  tone: ContentTone | null,
  contextValues: string[],
  templateFieldValues: Record<string, string>,
  language: Language,
): string {
  const isFi = language === "fi";
  const lines: string[] = [];

  // ---- Collect ingredient data ----
  const tpl = template ? getTemplates().find((t) => t.id === template) : null;
  const templateName = tpl ? tpl.label[language] : template || "";
  const chars = template ? TEMPLATE_CHARACTERISTICS[template] : null;
  const templateTraits = chars ? (isFi ? chars.fi : chars.en) : null;
  const toneOption = tone ? TONE_OPTIONS.find((t) => t.value === tone) : null;
  const toneLabel = toneOption?.label || tone || "";
  const hasBrief = prompt.trim().length > 0;

  // Bar type label for per-establishment uniqueness
  const barTypeLabel = barType
    ? barType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
    : "";

  // ---- No ingredients — show placeholder ----
  if (!template && !tone && contextValues.length === 0 && !hasBrief) {
    return isFi
      ? "Valitse aineksia nähdäksesi luovan briefin — malli, sävy, konteksti tai kuvaus."
      : "Select ingredients to see your creative brief — template, tone, context, or description.";
  }

  // ---- SECTION 1: Establishment & Format — who we are + what we're making ----
  // Anchors the entire brief in the bar's identity so no two establishments
  // produce the same opening, even with identical template choices.
  if (isFi) {
    const typeIntro = barTypeLabel
      ? `${barName} on ${barTypeLabel}`
      : barName;
    if (template) {
      lines.push(`${typeIntro} — ${templateName.toLowerCase()}.`);
      if (templateTraits) lines.push(`Suunta: ${templateTraits}.`);
    } else {
      lines.push(typeIntro);
    }
  } else {
    const typeIntro = barTypeLabel
      ? `${barName} is a ${barTypeLabel}`
      : barName;
    if (template) {
      lines.push(`${typeIntro} — creating a ${templateName.toLowerCase()} promotion.`);
      if (templateTraits) lines.push(`Direction: ${templateTraits}.`);
    } else {
      lines.push(typeIntro);
    }
  }

  // ---- SECTION 2: Voice & Connection — how the tone shapes the message ----
  // Explicitly connects tone to template (synergy) and bar type (fit).
  if (tone) {
    lines.push("");
    if (isFi) {
      lines.push(`Äänensävy: ${toneLabel}.`);
      // Tone description
      if (toneOption) {
        const voice = toneOption as typeof TONE_OPTIONS[number];
        if (voice.sampleBody) lines.push(voice.sampleBody.slice(0, 120) + ".");
      }
      // Tone × template connection
      if (template) {
        lines.push(
          templateTraits
            ? `Yhteys: ${toneLabel.toLowerCase()} -sävy vahvistaa ${templateName.toLowerCase()} -mallin luontaista suuntaa — ${templateTraits.slice(0, 100)}.`
            : `Yhteys: ${toneLabel.toLowerCase()} -sävy ja ${templateName.toLowerCase()} -malli tukevat toisiaan.`
        );
      }
      // Tone × bar type fit
      if (barTypeLabel) {
        lines.push(`Sopii: ${toneLabel.toLowerCase()} -sävy on luonteva valinta ${barTypeLabel.toLowerCase()} -tyyppiselle paikalle.`);
      }
    } else {
      lines.push(`Voice: ${toneLabel}.`);
      if (toneOption) {
        const voice = toneOption as typeof TONE_OPTIONS[number];
        if (voice.sampleBody) lines.push(voice.sampleBody.slice(0, 120) + ".");
      }
      if (template) {
        lines.push(
          templateTraits
            ? `Connection: ${toneLabel.toLowerCase()} voice amplifies the ${templateName.toLowerCase()} format's core — ${templateTraits.slice(0, 100)}.`
            : `Connection: ${toneLabel.toLowerCase()} voice and ${templateName.toLowerCase()} format reinforce each other.`
        );
      }
      if (barTypeLabel) {
        lines.push(`Fit: ${toneLabel.toLowerCase()} voice is a natural choice for a ${barTypeLabel.toLowerCase()} venue.`);
      }
    }
  }

  // ---- SECTION 3: Scene & Context — when, where, what's the vibe ----
  // Context values are woven into the setting. Shows time/season/atmosphere
  // and how they interact with the template and tone choices.
  if (contextValues.length > 0) {
    lines.push("");
    const ctxText = contextValues.join(". ");
    if (isFi) {
      lines.push(`Ajankohta: ${ctxText}.`);
      if (template || tone) {
        lines.push("Vaikutus: Konteksti tarkentaa kohdentamista — sama tarjous eri vuodenaikana tai kellonaikana tuntuu erilaiselta.");
      }
    } else {
      lines.push(`Setting: ${ctxText}.`);
      if (template || tone) {
        lines.push("Impact: Context sharpens targeting — the same offer at a different time or season feels entirely different.");
      }
    }
  }

  // ---- SECTION 4: Core Message — the user's brief as creative anchor ----
  if (hasBrief) {
    lines.push("");
    lines.push(isFi ? "Ydinviesti:" : "Core message:");
    lines.push(prompt.trim());
  }

  // ---- SECTION 4b: Template Details — user-supplied specifics ----
  const fieldValuesStr = formatTemplateFieldValues(templateFieldValues, language);
  if (fieldValuesStr) {
    lines.push(fieldValuesStr);
  }

  // ---- SECTION 5: Creative Strategy Summary — what we're building ----
  const ingredientCount = [template, tone, contextValues.length > 0, hasBrief].filter(Boolean).length;
  lines.push("");
  lines.push("---");
  if (isFi) {
    lines.push(`LUOVA STRATEGIA (${ingredientCount} ainesta):`);
    lines.push("");
    if (template) {
      lines.push(`• Malli "${templateName}" määrittää formaatin ja kohderyhmän.`);
    }
    if (tone) {
      lines.push(`• Sävy "${toneLabel}" määrittää kirjoitustyylin — sanavalinnat, rytmin, tunteen.`);
      if (template) {
        lines.push(`  → Nämä kaksi yhdessä luovat tunnistettavan äänen juuri tälle tarjoukselle.`);
      }
    }
    if (contextValues.length > 0) {
      lines.push(`• Konteksti kohdentaa viestin oikeaan hetkeen — ${contextValues[0].slice(0, 80)}.`);
      if (tone) {
        lines.push(`  → Konteksti + sävy = tunne siitä, ETTÄ TÄMÄ ON NYT.`);
      }
    }
    if (hasBrief) {
      lines.push(`• Ydinviesti ankkuroi kaiken baarin omaan sanaan — ei geneeristä täytettä.`);
    }
    lines.push("");
    lines.push("TULOS:");
    lines.push("3 uniikkia sisältövarianttia — jokainen eri kulmasta, eri otsikolla.");
    lines.push("3 kuvagenerointipromptia — jokainen johdettu samoista aineksista.");
    lines.push("Sävy, malli ja konteksti ohjaavat myös visuaalista suuntaa.");
  } else {
    lines.push(`CREATIVE STRATEGY (${ingredientCount} ingredients):`);
    lines.push("");
    if (template) {
      lines.push(`• Format "${templateName}" defines the structure and target audience.`);
    }
    if (tone) {
      lines.push(`• Voice "${toneLabel}" defines the writing style — word choice, rhythm, emotional register.`);
      if (template) {
        lines.push(`  → Together they create a recognizable voice for this specific promotion.`);
      }
    }
    if (contextValues.length > 0) {
      lines.push(`• Context targets the right moment — ${contextValues[0].slice(0, 80)}.`);
      if (tone) {
        lines.push(`  → Context + voice = the feeling that THIS IS NOW.`);
      }
    }
    if (hasBrief) {
      lines.push(`• Core message anchors everything in the bar's own story — no generic filler.`);
    }
    lines.push("");
    lines.push("OUTPUT:");
    lines.push("3 unique content variants — each from a different angle, with a different headline.");
    lines.push("3 image generation prompts — each derived from the same ingredients.");
    lines.push("Voice, format, and context also steer the visual direction.");
  }

  return lines.join("\n");
}

// ---- Component ----

export default function UnifiedCreationFlow({
  barId,
  barName = "Your Bar",
  barType,
  barCoverImage,
  contentType,
  creationMode = "promotional",
  onModeChange,
  formState,
  contentTone,
  onGenerated,
  onFieldChange,
  onTypeChange,
  onSubmit,
  submitting,
  initialStep,
  brandAudience = [],
  onBrandAudienceChange,
  brandCoreMessage = null,
  onBrandCoreMessageChange,
  brandAtmosphere = [],
  onBrandAtmosphereChange,
  brandImageWorld = "venue",
  onBrandImageWorldChange,
  brandCopyStructure = "direct",
  onBrandCopyStructureChange,
  brandTemplateName = "",
  onBrandTemplateNameChange,
}: UnifiedCreationFlowProps) {
  // Flow state
  const [step, setStep] = useState<FlowStep>(initialStep || "type");
  const [error, setError] = useState<string | null>(null);

  // Brief state
  const [text, setText] = useState("");
  const [language, setLanguage] = useState<Language>("en");
  const [activeTone, setActiveTone] = useState<ContentTone | null>(
    contentTone ?? null,
  );
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [selectedContexts, setSelectedContexts] = useState<string[]>([]);
  const [customContextInput, setCustomContextInput] = useState("");

  // Voice profile — fetched on mount, updated after each generation
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null);
  const [voiceOverride, setVoiceOverride] = useState(false);
  const voiceProfileFetched = useRef(false);

  // ---- Campaign state ----
  const [campaignName, setCampaignName] = useState("");
  const [campaignBeats, setCampaignBeats] = useState<CampaignBeatJob[]>([
    "teaser",
    "announcement",
    "day_of",
  ]);
  const [campaignEventDate, setCampaignEventDate] = useState("");
  const [campaignEventTime, setCampaignEventTime] = useState("");
  const [campaignResults, setCampaignResults] = useState<
    Array<{
      job: CampaignBeatJob;
      headline: string;
      body: string;
      cta: string;
      hookPattern?: string;
      imagePrompt: string;
    }>
  >([]);
  const [campaignGenerating, setCampaignGenerating] = useState(false);
  const [campaignGenerationStatus, setCampaignGenerationStatus] = useState("");
  const [editingCampaignBeat, setEditingCampaignBeat] = useState<number | null>(
    null,
  );
  const [activeCampaignBeatIndex, setActiveCampaignBeatIndex] = useState<number>(0);
  const [campaignBeatImages, setCampaignBeatImages] = useState<string[]>([]);
  const [campaignBeatImagesLoading, setCampaignBeatImagesLoading] = useState<
    boolean[]
  >([]);

  // Social card export — captures each beat as a 1200×630 downloadable PNG
  const [campaignCardDataUrls, setCampaignCardDataUrls] = useState<(string | null)[]>([]);
  const campaignCardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Compute the voice profile context block for AI prompts — always
  // in sync with the current language
  const voicePromptBlock = useMemo(() => {
    if (!voiceProfile) return "";
    return buildVoiceProfileBlock(voiceProfile, language);
  }, [voiceProfile, language]);
  const nonceRef = useRef(0);
  const [complianceBlocked, setComplianceBlocked] = useState<{
    reasons: string[];
  } | null>(null);
  const [complianceWarnings, setComplianceWarnings] = useState<string[] | null>(
    null,
  );
  const [variantViolations, setVariantViolations] = useState<
    Array<{
      rule: string;
      keyword: string;
      severity: string;
      message: string;
      suggestion: string;
    }>[]
  >([]);
  const [usingFallback, setUsingFallback] = useState(false);
  const [inferredType, setInferredType] = useState<string>("promotion");
  // Store the suggest response for events/passes so handleSelectVariant can
  // access type-specific fields (startTime, priceEuros, benefits, etc.)
  const suggestDataRef = useRef<Record<string, unknown> | null>(null);
  const [synthesizingBrief, setSynthesizingBrief] = useState(false);
  const [aiBrief, setAiBrief] = useState<string | null>(null);
  const [templateFieldValues, setTemplateFieldValues] = useState<
    Record<string, string>
  >({});

  // Derive templates based on content type
  const activeTemplates = useMemo(() => {
    if (contentType === "event") return EVENT_TEMPLATES[language];
    if (contentType === "pass") return PASS_TEMPLATES[language];
    return TEMPLATES[language];
  }, [contentType, language]);

  // Categorized templates for promotions (new tone-adaptive system)
  const isCategorizedTemplates = contentType === "promotion";
  const categorizedTemplates = useMemo(() => {
    if (!isCategorizedTemplates) return null;
    return getTemplatesByCategory();
  }, [isCategorizedTemplates]);

  // Lookup display label for an active template (new system)
  const activeTemplateLabel = useMemo(() => {
    if (!activeTemplate) return null;
    const tpl = getTemplates().find((t) => t.id === activeTemplate);
    return tpl ? tpl.label[language] : activeTemplate;
  }, [activeTemplate, language]);

  // AI-suggested templates based on bar type + tone
  const suggestedTemplates = useMemo(() => {
    if (!isCategorizedTemplates) return [];
    return getSuggestedTemplates(barType, activeTone, 4);
  }, [isCategorizedTemplates, barType, activeTone]);

  // Custom "Can't find what you need?" state
  const [customTemplateIdea, setCustomTemplateIdea] = useState("");

  const handleCustomTemplateSubmit = () => {
    const idea = customTemplateIdea.trim();
    if (!idea) return;
    setActiveTemplate("custom");
    setText(idea);
    setWizardActive(false);
    setTemplatesOpen(false);
    setContextOpen(true);
    setCustomTemplateIdea("");
  };

  // Helper collapse state
  const [toneOpen, setToneOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  // Brand ingredient helper toggles
  const [brandAudienceOpen, setBrandAudienceOpen] = useState(false);
  const [brandCoreMsgOpen, setBrandCoreMsgOpen] = useState(false);
  const [brandAtmosphereOpen, setBrandAtmosphereOpen] = useState(false);
  const [brandImageWorldOpen, setBrandImageWorldOpen] = useState(false);
  const [brandCopyStructOpen, setBrandCopyStructOpen] = useState(false);

  // Wizard state
  const [wizardActive, setWizardActive] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardAnswers, setWizardAnswers] = useState<Record<string, string>>(
    {},
  );
  /** Base concept prompt preserved when wizard is active for a categorized template */
  const [wizardBasePrompt, setWizardBasePrompt] = useState<string | null>(null);
  const wizardConfig = activeTemplate
    ? getWizardForTemplate(activeTemplate)
    : null;
  const wizardSteps: WizardStep[] =
    wizardConfig && wizardConfig.steps[language]
      ? wizardConfig.steps[language]
      : [];

  // Auto-open tone section when entering Step 2 (brief)
  useEffect(() => {
    if (step === "brief") {
      setToneOpen(true);
      setTemplatesOpen(false);
      setContextOpen(false);
    }
  }, [step]);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("hoppr_token") : null;

  // Fetch voice profile on mount — defaults activeTone to the bar's established voice
  useEffect(() => {
    if (!token || voiceProfileFetched.current) return;
    voiceProfileFetched.current = true;

    const fetchVoiceProfile = async () => {
      try {
        const res = await fetch(`/api/auth/bar/${barId}/voice-profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const profile = data.profile as VoiceProfile;
        setVoiceProfile(profile);

        // Default to preferred tone if nothing is selected yet
        // and no explicit contentTone prop was provided
        if (!activeTone && !contentTone && profile.preferredTone) {
          setActiveTone(profile.preferredTone);
        }
      } catch {
        // Silent fail — voice profile is a nice-to-have, not critical
      }
    };
    fetchVoiceProfile();
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, barId]);

  // Auto-fill campaign defaults when entering campaign mode
  const campaignDefaultsApplied = useRef(false);
  useEffect(() => {
    if (creationMode === "campaign" && !campaignDefaultsApplied.current) {
      campaignDefaultsApplied.current = true;

      // Default event date to next Friday
      if (!campaignEventDate) {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0=Sun, 5=Fri
        const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7; // next Friday (skip today if it's Fri)
        const nextFriday = new Date(today);
        nextFriday.setDate(today.getDate() + daysUntilFriday);
        setCampaignEventDate(nextFriday.toISOString().slice(0, 10));
      }

      // Auto-suggest campaign name from bar name
      if (!campaignName && barName) {
        const monthName = new Date().toLocaleString("default", { month: "long" });
        setCampaignName(`${barName} — ${monthName} Series`);
      }
    }
    // Reset when switching away from campaign
    if (creationMode !== "campaign") {
      campaignDefaultsApplied.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creationMode]);

  // Text generation state (declared above the voice profile useEffect
  // that depends on variants.length)
  const [variants, setVariants] = useState<EditableVariant[]>([]);
  const [generatingText, setGeneratingText] = useState(false);

  // Update voice profile after successful generation — fire-and-forget
  const genStepRef = useRef<FlowStep>("type");
  useEffect(() => {
    const prevStep = genStepRef.current;
    genStepRef.current = step;

    // Detect transition INTO "refine" step (successful generation)
    if (prevStep !== "refine" && step === "refine" && variants.length > 0 && token) {
      const updateProfile = async () => {
        try {
          const body: Record<string, unknown> = {};
          if (activeTone) body.tone = activeTone;
          if (activeTemplate) body.template = activeTemplate;
          if (creationMode === "brand" && brandAudience.length > 0) {
            body.audience = brandAudience;
          }

          if (Object.keys(body).length === 0) return;

          await fetch(`/api/auth/bar/${barId}/voice-profile`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
          });

          // Refresh the local profile so the voice summary stays current
          const res = await fetch(`/api/auth/bar/${barId}/voice-profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setVoiceProfile(data.profile as VoiceProfile);
          }
        } catch {
          // Silent fail
        }
      };
      updateProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, variants.length]);

  // Auto-open preview when any ingredient is selected
  const hasIngredients = !!(
    activeTone ||
    activeTemplate ||
    selectedContexts.length > 0 ||
    text.trim()
  );
  useEffect(() => {
    if (hasIngredients) {
      setPreviewOpen(true);
    }
  }, [activeTone, activeTemplate, selectedContexts, text, hasIngredients]);

  // Image generation state
  const [variantImages, setVariantImages] = useState<(string | null)[]>([]);
  const [variantImagesLoading, setVariantImagesLoading] = useState<boolean[]>(
    [],
  );
  const [generatingImages, setGeneratingImages] = useState(false);
  const [variantLayouts, setVariantLayouts] = useState<
    Array<"split" | "centered" | "card">
  >([]);
  const [variantSubjects, setVariantSubjects] = useState<string[]>([]);

  // Subject label lookup (subject ID → English label)
  const subjectLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const preset of SUBJECT_PRESETS) {
      map[preset.id] = preset.label;
    }
    return map;
  }, []);

  // Available subjects for the current brand image world
  const availableBrandSubjects = useMemo(() => {
    if (creationMode !== "brand") return [];
    const complianceWorld =
      IMAGE_WORLD_CHIP_TO_COMPLIANCE[brandImageWorld || "venue"];
    return complianceWorld ? subjectsForImageWorld(complianceWorld) : [];
  }, [creationMode, brandImageWorld]);

  // Template → Tone recommendations for the tone selector UI
  const toneRecommendations = useMemo(
    () => getTemplateToneRecommendations(activeTemplate),
    [activeTemplate],
  );

  // Smart context suggestions — scored against all current ingredients
  const nowDate = useMemo(() => new Date(), []);
  const scoredContexts = useMemo(
    () =>
      getScoredContexts({
        template: activeTemplate,
        tone: activeTone,
        barType: barType ?? undefined,
        now: nowDate,
        promptText: text || null,
        language,
      }),
    [activeTemplate, activeTone, barType, nowDate, text, language],
  );

  const topSuggestedContexts = useMemo(
    () => scoredContexts.filter((c) => c.score >= 4),
    [scoredContexts],
  );

  const remainingContexts = useMemo(
    () => scoredContexts.filter((c) => c.score < 4),
    [scoredContexts],
  );

  // ---- Tone ----

  const handleToneSelect = (tone: ContentTone) => {
    const newTone = activeTone === tone ? null : tone;
    setActiveTone(newTone);

    // Track whether the user is overriding the established voice
    if (voiceProfile?.preferredTone) {
      setVoiceOverride(newTone !== null && newTone !== voiceProfile.preferredTone);
    }

    if (newTone) {
      // In brand mode, tone is a structured ingredient — don't inject
      // instruction text into the brief textarea. The tone voice profile
      // is applied via the brand prompt builder on the server.
      if (creationMode !== "brand") {
        const instruction = toneInstructionText(newTone, language);
        setText((prev) => {
          const trimmed = prev.trim();
          const lines = trimmed.split("\n");
          const toneIdx = lines.findIndex(
            (l) => l.startsWith("Tone:") || l.startsWith("Äänensävy:"),
          );
          if (toneIdx >= 0) {
            lines[toneIdx] = instruction;
            return lines.join("\n");
          }
          return trimmed ? `${trimmed}\n\n${instruction}` : instruction;
        });
      }
      // Auto-advance: close tone, open templates
      setToneOpen(false);
      setTemplatesOpen(true);
    }
  };

  // ---- Template click → fill textarea ----

  const handleTemplateClick = (label: string) => {
    const isDeselect = activeTemplate === label;
    if (isDeselect) {
      setActiveTemplate(null);
      setWizardActive(false);
      setWizardStep(0);
      setWizardAnswers({});
      setWizardBasePrompt(null);
      return;
    }

    setActiveTemplate(label);

    // New tone-adaptive templates: fill textarea with concept prompt.
    // Tone voice, template voice, and compliance are handled by the backend's prompt builder.
    if (isCategorizedTemplates && categorizedTemplates) {
      const tpl = getTemplates().find((t) => t.id === label);
      if (tpl) {
        setText(tpl.conceptPrompt[language]);

        // Check if this template has a guided wizard — if so, activate it
        // so the user can enrich the brief with structured answers.
        const promoWizard = getWizardForTemplate(label);
        if (promoWizard) {
          setWizardActive(true);
          setWizardStep(0);
          setWizardAnswers({});
          setWizardBasePrompt(tpl.conceptPrompt[language]);
          setContextOpen(false);
          // Keep templates open so user sees the wizard steps
        } else {
          setWizardActive(false);
          setTemplatesOpen(false);
          setContextOpen(true);
        }
        return;
      }
    }

    // Old template system (events, passes, legacy promotions)
    const wizard = getWizardForTemplate(label);

    if (wizard) {
      setWizardActive(true);
      setWizardStep(0);
      setWizardAnswers({});
      setWizardBasePrompt(null);
      // Keep templates open so user can complete the wizard
    } else {
      setWizardActive(false);
      setWizardStep(0);
      setWizardAnswers({});
      // Close templates, open context after non-wizard selection
      setTemplatesOpen(false);
      setContextOpen(true);
    }
  };

  // ---- Wizard ----

  const handleWizardAnswer = (stepLabel: string, promptFragment: string) => {
    const updated = { ...wizardAnswers, [stepLabel]: promptFragment };
    setWizardAnswers(updated);

    const assembledPrompt = assembleWizardPrompt(updated, barName, language);
    // Prepend the base concept prompt (from categorized template) if present
    const finalText = wizardBasePrompt
      ? `${wizardBasePrompt}\n\n${assembledPrompt}`
      : assembledPrompt;

    if (wizardStep < wizardSteps.length - 1) {
      setWizardStep(wizardStep + 1);
      setText(finalText);
    } else {
      // Wizard complete — close templates, open context
      setWizardActive(false);
      setTemplatesOpen(false);
      setContextOpen(true);
      setWizardBasePrompt(null);
      setText(finalText);
    }
  };

  const handleWizardBack = () => {
    if (wizardStep > 0) {
      const currentStepLabel = wizardSteps[wizardStep].label;
      const updated = { ...wizardAnswers };
      delete updated[currentStepLabel];
      setWizardAnswers(updated);
      setWizardStep(wizardStep - 1);
      const assembled = assembleWizardPrompt(updated, barName, language);
      setText(wizardBasePrompt ? `${wizardBasePrompt}\n\n${assembled}` : assembled);
    }
  };

  const handleWizardDismiss = () => {
    setWizardActive(false);
    setTemplatesOpen(false);
    setContextOpen(true);
    setWizardBasePrompt(null);
  };

  // ---- Regenerate brief — re-calls AI with new nonce for guaranteed different output ----

  const handleRegenerateBrief = () => {
    nonceRef.current += 1;
    handleGenerateText();
  };

  // ---- Toggle context tag ----

  const handleToggleContext = (suggestion: { label: { en: string; fi: string } }) => {
    const label = suggestion.label[language];
    setSelectedContexts((prev) => {
      if (prev.includes(label)) {
        return prev.filter((s) => s !== label);
      }
      return [...prev, label];
    });
  };

  // ---- Add custom context ----

  const handleAddCustomContext = () => {
    const trimmed = customContextInput.trim();
    if (!trimmed) return;
    if (selectedContexts.includes(trimmed)) return;
    setSelectedContexts((prev) => [...prev, trimmed]);
    setCustomContextInput("");
  };

  // ---- Remove context (from summary tags) ----

  const handleRemoveContext = (ctx: string) => {
    setSelectedContexts((prev) => prev.filter((s) => s !== ctx));
  };

  // ---- AI-synthesize creative brief from selected ingredients ----

  const handleSynthesizeBrief = async () => {
    if (!token) return;
    setSynthesizingBrief(true);
    setAiBrief(null);
    try {
      const res = await fetch(
        `/api/auth/bar/${barId}/create/synthesize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            template: activeTemplate,
            tone: activeTone,
            context: selectedContexts.length > 0
              ? selectedContexts.map(
                  (label) =>
                    getContextValueMap(scoredContexts, language).get(label) || label,
                )
              : [],
            language,
            templateFields: templateFieldValues,
          }),
        },
      );
      const data = await res.json();
      if (data.brief) {
        setAiBrief(data.brief);
        // Populate the textarea with the AI-synthesized brief as the user's
        // creative core — the backend generate step still adds its own
        // synthesis (tone voice, compliance, bar hooks, etc.) on top.
        setText(data.brief);
      } else if (!data.success) {
        console.warn("[synthesize] No brief returned:", data);
      }
    } catch (err) {
      console.error("[synthesize] Failed:", err);
    } finally {
      setSynthesizingBrief(false);
    }
  };

  // ---- Campaign: beat toggle ----

  const toggleCampaignBeat = (beat: CampaignBeatJob) => {
    setCampaignBeats((prev) =>
      prev.includes(beat)
        ? prev.filter((b) => b !== beat)
        : [...prev, beat].sort(
            (a, b) =>
              BEAT_ORDER.indexOf(a as CampaignBeatJob) -
              BEAT_ORDER.indexOf(b as CampaignBeatJob),
          ),
    );
  };

  const handleCampaignGenerate = async () => {
    if (!token || !campaignName.trim()) return;
    setCampaignGenerating(true);
    setError(null);
    setCampaignResults([]);
    setCampaignGenerationStatus(
      language === "fi" ? "Valmistellaan kampanjaa..." : "Preparing campaign...",
    );

    try {
      const body: Record<string, unknown> = {
        campaignName: campaignName.trim(),
        language,
        beats: campaignBeats,
        contentTone: activeTone,
        eventDate: campaignEventDate || undefined,
        eventTime: campaignEventTime || undefined,
        userBrief: text.trim() || undefined,
        voiceProfileContext: voicePromptBlock || undefined,
      };
      if (creationMode === "brand") {
        if (brandAudience.length > 0) body.audience = brandAudience;
        if (brandCoreMessage) body.coreMessage = brandCoreMessage;
        if (brandAtmosphere.length > 0) body.atmosphere = brandAtmosphere;
        if (brandImageWorld) body.imageWorld = brandImageWorld;
        if (brandCopyStructure) body.copyStructure = brandCopyStructure;
      }

      setCampaignGenerationStatus(
        language === "fi"
          ? `Luodaan ${campaignBeats.length} postausta... (tämä voi kestää hetken)`
          : `Generating ${campaignBeats.length} posts... (this may take a moment)`,
      );

      const res = await fetch(`/api/auth/bar/${barId}/create/campaign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Campaign generation failed");
      }

      const data = await res.json();

      setCampaignGenerationStatus(
        language === "fi"
          ? "Käsitellään tuloksia..."
          : "Processing results...",
      );

      if (data.warning) setError(data.warning as string);
      setCampaignResults(data.beats as CampaignBeatResult[]);
      setCampaignBeatImages(new Array((data.beats as CampaignBeatResult[]).length).fill(""));
      setCampaignBeatImagesLoading([]);
      setActiveCampaignBeatIndex(0);

      // Sync first beat to formState so ConsumerPreviewPanel shows live social preview
      if (data.beats.length > 0) {
        const firstBeat = data.beats[0];
        onFieldChange("title", firstBeat.headline);
        onFieldChange("description", firstBeat.body);
        // Propagate campaign metadata for the preview panel
        onFieldChange("brandHeadline", firstBeat.headline);
        onFieldChange("brandBody", firstBeat.body);
        onFieldChange("brandCta", firstBeat.cta);
        if (campaignEventDate) onFieldChange("campaignStartDate", campaignEventDate);
      }

      // Update voice profile (fire-and-forget)
      const updateBody: Record<string, unknown> = {};
      if (activeTone) updateBody.tone = activeTone;
      if (activeTemplate) updateBody.template = activeTemplate;
      if (Object.keys(updateBody).length > 0) {
        fetch(`/api/auth/bar/${barId}/voice-profile`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateBody),
        }).catch(() => {});
      }

      setCampaignGenerationStatus("");
      setStep("refine");
    } catch (err) {
      setCampaignGenerationStatus("");
      setError(err instanceof Error ? err.message : "Campaign generation failed");
    } finally {
      setCampaignGenerating(false);
    }
  };

  // ---- Campaign image generation ----
  const handleCampaignImageGenerate = useCallback(
    async (beatIndex: number) => {
      if (!token) return;

      setCampaignBeatImagesLoading((prev) => {
        const next = [...prev];
        next[beatIndex] = true;
        return next;
      });
      setError(null);

      try {
        const beat = campaignResults[beatIndex];
        if (!beat?.imagePrompt) {
          setError("No image prompt for this beat");
          return;
        }

        const chips = deriveImageChips(activeTone, activeTemplate, 0);

        const res = await fetch(
          `/api/auth/bar/${barId}/images/generate`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              styleId: chips.styleId,
              subjectId: chips.subjectId,
              compositionId: chips.compositionId,
              contentType: "campaign",
              formContext: {
                title: beat.headline,
                description: beat.body,
                barName,
              },
              visualDirection: {
                description: beat.imagePrompt,
                keyElements: [],
                styleNotes: "",
              },
              count: 1,
            }),
          },
        );

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Image generation failed");
        }

        const data = await res.json();
        const jobIds: string[] = data.jobIds || [];

        if (jobIds.length === 0) throw new Error("No image job created");

        // Poll for completion (up to 45 attempts, 2s apart = 90s max)
        let imageUrl: string | null = null;
        for (let attempt = 0; attempt < 45; attempt++) {
          await new Promise((r) => setTimeout(r, 2000));
          try {
            const statusRes = await fetch(
              `/api/auth/bar/${barId}/images/jobs/${jobIds[0]}`,
              { headers: { Authorization: `Bearer ${token}` } },
            );
            if (!statusRes.ok) continue;
            const statusData = await statusRes.json();
            if (statusData.status === "completed" && statusData.urls?.[0]) {
              imageUrl = statusData.urls[0];
              break;
            }
            if (statusData.status === "failed") break;
          } catch {
            // Continue polling
          }
        }

        setCampaignBeatImages((prev) => {
          const next = [...prev];
          next[beatIndex] = imageUrl || "";
          return next;
        });

        // Sync image to formState for live preview (if this is the active beat)
        if (imageUrl && beatIndex === activeCampaignBeatIndex) {
          onFieldChange("imageUrl", imageUrl);
        }

        if (!imageUrl) {
          setError(
            language === "fi"
              ? "Kuvan luominen aikakatkaistiin. Yritä uudelleen."
              : "Image generation timed out. Please try again.",
          );
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Image generation failed",
        );
      } finally {
        setCampaignBeatImagesLoading((prev) => {
          const next = [...prev];
          next[beatIndex] = false;
          return next;
        });
      }
    },
    [token, barId, activeTone, activeTemplate, language, campaignResults, barName, activeCampaignBeatIndex, onFieldChange],
  );

  const handleCampaignAllImages = useCallback(async () => {
    if (!token) return;

    const loading = new Array(campaignResults.length).fill(true);
    setCampaignBeatImagesLoading(loading);
    setError(null);

    try {
      const chips = deriveImageChips(activeTone, activeTemplate, 0);

      const variantVDs = campaignResults.map((beat) => ({
        visualDirection: {
          description: beat.imagePrompt || "",
          keyElements: [],
          styleNotes: "",
        },
        formContext: {
          title: beat.headline,
          description: beat.body,
          barName,
        },
      }));

      const res = await fetch(
        `/api/auth/bar/${barId}/images/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            variantVisualDirections: variantVDs,
            contentType: "campaign",
            styleId: chips.styleId,
            subjectId: chips.subjectId,
            compositionId: chips.compositionId,
            count: 1,
          }),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Image generation failed");
      }

      const data = await res.json();
      const jobIds: string[] = data.jobIds || [];

      if (jobIds.length === 0) throw new Error("No image jobs created");

      // Poll all jobs concurrently
      const variantUrls: (string | null)[] = new Array(campaignResults.length).fill(null);

      for (let attempt = 0; attempt < 45; attempt++) {
        await new Promise((r) => setTimeout(r, 2000));
        let allDone = true;

        for (let i = 0; i < jobIds.length; i++) {
          if (variantUrls[i]) continue;
          try {
            const statusRes = await fetch(
              `/api/auth/bar/${barId}/images/jobs/${jobIds[i]}`,
              { headers: { Authorization: `Bearer ${token}` } },
            );
            if (!statusRes.ok) continue;
            const statusData = await statusRes.json();
            if (statusData.status === "completed" && statusData.urls?.[0]) {
              variantUrls[i] = statusData.urls[0];
            } else if (statusData.status === "failed") {
              variantUrls[i] = null;
            } else {
              allDone = false;
            }
          } catch {
            allDone = false;
          }
        }

        if (allDone) break;
      }

      setCampaignBeatImages(variantUrls.map((url) => url || ""));

      // Sync first beat's image to formState for live preview
      const firstUrl = variantUrls[0];
      if (firstUrl) onFieldChange("imageUrl", firstUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image generation failed");
    } finally {
      setCampaignBeatImagesLoading([]);
    }
  }, [token, barId, activeTone, activeTemplate, campaignResults, barName, onFieldChange]);

  // ---- Step 2 → 3: Generate text ----

  const handleGenerateText = useCallback(async () => {
    const input = text.trim();
    if (!token) return;

    setGeneratingText(true);
    setError(null);
    setComplianceBlocked(null);
    setComplianceWarnings(null);
    setVariantViolations([]);
    setUsingFallback(false);
    setVariants([]);
    setVariantSubjects([]);

    try {
      // Call suggest — passes contentType so the API routes to the right prompt builder
      // When mode is "brand", also pass ingredient selections for the brand prompt builder
      const suggestBody: Record<string, unknown> = {
        text: input,
        language,
        contentTone: activeTone,
        contentType,
        templateFields: templateFieldValues,
      };
      // Inject voice profile context so the creative director knows
      // the bar's established voice and can default to it
      if (voicePromptBlock) {
        suggestBody.voiceProfileContext = voicePromptBlock;
      }
      if (creationMode === "brand") {
        suggestBody.mode = "brand";
        if (brandAudience.length > 0) suggestBody.audience = brandAudience;
        if (brandCoreMessage) suggestBody.coreMessage = brandCoreMessage;
        if (brandAtmosphere.length > 0)
          suggestBody.atmosphere = brandAtmosphere;
        if (brandImageWorld) suggestBody.imageWorld = brandImageWorld;
        if (brandCopyStructure) suggestBody.copyStructure = brandCopyStructure;
        if (brandTemplateName) suggestBody.templateName = brandTemplateName;
      }
      const suggestRes = await fetch(`/api/auth/bar/${barId}/create/suggest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(suggestBody),
      });

      if (!suggestRes.ok) {
        const data = await suggestRes.json();
        throw new Error(data.error || "Type inference failed");
      }

      const suggestData = await suggestRes.json();
      const type =
        (suggestData.inferredType as string) || contentType || "promotion";
      setInferredType(type);

      // ---- Brand mode: suggest endpoint returns 3 variants with headline/body/cta/imagePrompt ----
      // Must run BEFORE the event/pass handler — when creationMode is "brand",
      // the server used the brand prompt builder, not the event/pass builder.
      if (creationMode === "brand") {
        suggestDataRef.current = suggestData;

        // Show fallback warning when AI produced generic/incomplete response
        if (suggestData.warning) {
          setError(suggestData.warning as string);
          setUsingFallback(true);
        } else {
          setUsingFallback(false);
        }

        const rawVariants: Array<Record<string, unknown>> =
          Array.isArray(suggestData.variants) && suggestData.variants.length > 0
            ? (suggestData.variants as Array<Record<string, unknown>>)
            : [
                {
                  headline:
                    (suggestData.headline as string) ||
                    (suggestData.title as string) ||
                    input.slice(0, 60),
                  body:
                    (suggestData.body as string) ||
                    (suggestData.description as string) ||
                    "",
                  cta: (suggestData.cta as string) || "Learn More",
                  imagePrompt: (suggestData.imageSuggestion as string) || "",
                },
              ];

        const editableVariants: EditableVariant[] = rawVariants.map(
          (bv, idx) => ({
            title: (bv.headline as string) || `Option ${idx + 1}`,
            description: (bv.body as string) || "",
            type: "brand",
            discount: null,
            callToAction: (bv.cta as string) || "Learn More",
            ctaOptions: Array.isArray(bv.ctaOptions) ? (bv.ctaOptions as string[]) : [],
            hookPattern: typeof bv.hookPattern === "string" ? (bv.hookPattern as string) : null,
            accentColor: "#7c3aed",
            titleFontStyle: null,
            conditions: "",
            visualDirection: null,
            fluxPrompt: (bv.imagePrompt as string) || "",
            imageMood: "",
            strategy: STRATEGIES[idx % STRATEGIES.length],
          }),
        );

        console.log(
          "[brand] Setting",
          editableVariants.length,
          "variants for refine step",
        );
        setVariants(editableVariants);
        setVariantLayouts(new Array(editableVariants.length).fill("centered"));
        setVariantImages(new Array(editableVariants.length).fill(null));
        // Initialize subjects from current image world
        const complianceWorld =
          IMAGE_WORLD_CHIP_TO_COMPLIANCE[brandImageWorld || "venue"];
        const subjects = complianceWorld
          ? subjectsForImageWorld(complianceWorld)
          : ["interior"];
        setVariantSubjects(
          editableVariants.map(
            (_, idx) => subjects[idx % subjects.length] || "interior",
          ),
        );

        // Per-variant compliance violations — same pattern as promotions ai-generate
        if (
          suggestData.complianceResults &&
          Array.isArray(suggestData.complianceResults)
        ) {
          const violationsByVariant: Array<
            Array<{
              rule: string;
              keyword: string;
              severity: string;
              message: string;
              suggestion: string;
            }>
          > = new Array(editableVariants.length).fill(null).map(() => []);
          for (const cr of suggestData.complianceResults as Array<{
            variantIndex: number;
            violations: Array<{
              rule: string;
              keyword: string;
              severity: string;
              message: string;
              suggestion: string;
            }>;
          }>) {
            if (cr.variantIndex < violationsByVariant.length) {
              violationsByVariant[cr.variantIndex] = cr.violations;
            }
          }
          setVariantViolations(violationsByVariant);
          setComplianceWarnings(null);
        } else {
          setVariantViolations([]);
          setComplianceWarnings(null);
        }

        setStep("refine");
        setGeneratingText(false);
        return;
      }

      // ---- Events & Passes: the suggest endpoint already returns full content ----
      // No separate ai-generate call needed — build a single variant directly.
      if (contentType === "event" || contentType === "pass") {
        suggestDataRef.current = suggestData; // save for handleSelectVariant
        const singleVariant: EditableVariant = {
          title: (suggestData.title as string) || input.slice(0, 60),
          description: (suggestData.description as string) || "",
          type:
            contentType === "event"
              ? (suggestData.eventCategory as string) || "OTHER"
              : (suggestData.passType as string) || "SKIP_LINE",
          discount: null,
          callToAction: contentType === "event" ? "Get Tickets" : "Buy Pass",
          ctaOptions: Array.isArray(suggestData.ctaOptions)
            ? (suggestData.ctaOptions as string[])
            : contentType === "event"
              ? ["Reserve Your Spot", "See Who's Going", "Get Tickets"]
              : ["Unlock This Pass", "Skip the Line", "Buy Pass"],
          hookPattern: typeof suggestData.hookPattern === "string" ? (suggestData.hookPattern as string) : null,
          accentColor: "#7c3aed",
          titleFontStyle: null,
          conditions:
            contentType === "pass"
              ? (suggestData.priceEuros as string) ||
                (suggestData.validityPeriod as string) ||
                ""
              : (suggestData.entryFee as string) || "",
          visualDirection: null,
          fluxPrompt: (suggestData.imageSuggestion as string) || "",
          imageMood: "",
          strategy: "vibe",
        };

        setVariants([singleVariant]);
        setVariantLayouts(["centered"]);
        setVariantImages([null]);
        setVariantSubjects([]);
        setStep("refine");
        setGeneratingText(false);
        return;
      }

      // ---- Promotions: existing two-step flow (suggest → ai-generate) ----
      const genRes = await fetch(
        `/api/auth/bar/${barId}/promotions/ai-generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            prompt: input || undefined,
            type,
            template: activeTemplate,
            tone: activeTone,
            context:
              selectedContexts.length > 0
                ? selectedContexts.map(
                    (label) => getContextValueMap(scoredContexts, language).get(label) || label,
                  )
                : undefined,
            language,
            numVariants: 3,
            nonce: nonceRef.current,
            templateFields: templateFieldValues,
            voiceProfileContext: voicePromptBlock || undefined,
          }),
        },
      );

      const genData = await genRes.json();

      if (!genRes.ok) {
        // Handle compliance pre-check failure
        if (genData.complianceBlocked) {
          setComplianceBlocked({ reasons: genData.complianceBlocked });
          throw new Error(
            genData.error || "Prompt blocked by compliance check",
          );
        }
        throw new Error(genData.error || "Variant generation failed");
      }

      // Per-variant compliance violations — shown inline under each variant card
      if (
        genData.complianceResults &&
        Array.isArray(genData.complianceResults)
      ) {
        const violationsByVariant: Array<
          Array<{
            rule: string;
            keyword: string;
            severity: string;
            message: string;
            suggestion: string;
          }>
        > = new Array((genData.variants as Array<unknown>).length)
          .fill(null)
          .map(() => []);
        for (const cr of genData.complianceResults as Array<{
          variantIndex: number;
          violations: Array<{
            rule: string;
            keyword: string;
            severity: string;
            message: string;
            suggestion: string;
          }>;
        }>) {
          if (cr.variantIndex < violationsByVariant.length) {
            violationsByVariant[cr.variantIndex] = cr.violations;
          }
        }
        setVariantViolations(violationsByVariant);
        setComplianceWarnings(null);
      } else {
        setVariantViolations([]);
        setComplianceWarnings(null);
      }

      // Show fallback warning when AI wasn't used
      if (!genData.aiGenerated && genData.warning) {
        setUsingFallback(true);
      } else {
        setUsingFallback(false);
      }

      if (genData.variants && Array.isArray(genData.variants)) {
        const rawVariants = genData.variants as Array<Record<string, unknown>>;

        // Build editable variants with Flux prompts
        const editableVariants: EditableVariant[] = rawVariants.map((v, idx) => {
          const vd = v.visualDirection as
            | EditableVariant["visualDirection"]
            | undefined;
          return {
            title: (v.title as string) || "",
            description: (v.description as string) || "",
            type: (v.type as string) || type,
            discount: (v.discount as number) ?? null,
            callToAction: (v.callToAction as string) || "",
            ctaOptions: Array.isArray(v.ctaOptions) ? (v.ctaOptions as string[]) : [],
            hookPattern: typeof v.hookPattern === "string" ? (v.hookPattern as string) : null,
            accentColor: (v.accentColor as string) || "#7c3aed",
            titleFontStyle: (v.titleFontStyle as string) || null,
            conditions: (v.conditions as string) || "",
            visualDirection: vd || null,
            fluxPrompt: buildInitialFluxPrompt(vd),
            imageMood: "",
            strategy: STRATEGIES[idx % STRATEGIES.length],
          };
        });

        setVariants(editableVariants);
        // Use the AI's chosen template per variant, not hardcoded "split"
        setVariantLayouts(
          rawVariants.map((v) => {
            const t = (v.visual as Record<string, unknown> | undefined)
              ?.template as string | undefined;
            return t && ["split", "centered", "card"].includes(t)
              ? (t as "split" | "centered" | "card")
              : "split";
          }),
        );
        setVariantImages(new Array(editableVariants.length).fill(null));
        setVariantSubjects([]);
        setStep("refine");
      } else {
        throw new Error("No variants returned");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate. Try again.",
      );
    } finally {
      setGeneratingText(false);
    }
  }, [
    text,
    token,
    barId,
    language,
    activeTone,
    activeTemplate,
    selectedContexts,
    contentType,
    templateFieldValues,
  ]);

  // ---- Edit a variant field ----

  const updateVariant = (
    index: number,
    field: keyof EditableVariant,
    value: unknown,
  ) => {
    setVariants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // ---- Delete a variant ----

  const deleteVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
    setVariantImages((prev) => prev.filter((_, i) => i !== index));
    setVariantLayouts((prev) => prev.filter((_, i) => i !== index));
    setVariantViolations((prev) => prev.filter((_, i) => i !== index));
  };

  // ---- Fix variant violations via AI ----

  const [fixingVariant, setFixingVariant] = useState<number | null>(null);

  // ---- AI rephrase for platform over-limit fields ----
  const [rephrasingField, setRephrasingField] = useState<string | null>(null);

  // ---- AI iterative refinement ----
  const [refiningVariant, setRefiningVariant] = useState<number | null>(null);
  const [refineInputs, setRefineInputs] = useState<Record<number, string>>({});

  const handleFixVariant = async (index: number) => {
    if (!token || !variantViolations[index]?.length) return;
    setFixingVariant(index);

    try {
      const v = variants[index];
      const res = await fetch(`/api/auth/bar/${barId}/create/suggest-fix`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: v.title,
          description: v.description,
          violations: variantViolations[index],
          contentType,
        }),
      });

      if (!res.ok) throw new Error("Fix generation failed");

      const data = await res.json();
      if (data.alternatives?.length > 0) {
        // Auto-apply the first compliant alternative
        const fix = data.alternatives[0];
        updateVariant(index, "title", fix.title);
        updateVariant(index, "description", fix.description);
        // Clear violations for this variant
        setVariantViolations((prev) => {
          const next = [...prev];
          next[index] = [];
          return next;
        });
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Fix failed. Edit manually instead.",
      );
    } finally {
      setFixingVariant(null);
    }
  };

  // ---- AI rephrase: shorten over-limit fields ----

  const handleRephraseField = async (
    variantIndex: number,
    field: "title" | "description" | "cta",
    targetLength: number,
  ) => {
    if (!token) return;
    const v = variants[variantIndex];
    // Map API field name to EditableVariant key ("cta" → "callToAction")
    const variantField = field === "cta" ? "callToAction" : field;
    const text = v[variantField] as string;

    // Don't call the API if already within limit
    if (!text || text.length <= targetLength) return;

    const fieldKey = `${variantIndex}-${field}`;
    setRephrasingField(fieldKey);

    try {
      const res = await fetch(`/api/auth/bar/${barId}/create/rephrase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text,
          field,
          targetLength,
          language,
        }),
      });

      if (!res.ok) throw new Error("Rephrase failed");

      const data = await res.json();

      if (data.text && data.text !== text) {
        updateVariant(variantIndex, variantField, data.text);
        setError(null);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "AI rephrase failed. Try again or edit manually.",
      );
    } finally {
      setRephrasingField(null);
    }
  };

  // ---- AI iterative refinement: apply natural-language instruction to a variant ----

  const handleRefine = async (variantIndex: number, instruction: string) => {
    if (!token || !instruction.trim()) return;
    const v = variants[variantIndex];
    setRefiningVariant(variantIndex);
    setRefineInputs((prev) => ({ ...prev, [variantIndex]: "" }));

    try {
      const res = await fetch(`/api/auth/bar/${barId}/create/refine`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: v.title,
          description: v.description,
          callToAction: v.callToAction,
          instruction,
          language,
        }),
      });

      if (!res.ok) throw new Error("Refine failed");

      const data = await res.json();

      // Apply refined fields if they differ from original
      if (data.title && data.title !== v.title) {
        updateVariant(variantIndex, "title", data.title);
      }
      if (data.description && data.description !== v.description) {
        updateVariant(variantIndex, "description", data.description);
      }
      if (data.callToAction && data.callToAction !== v.callToAction) {
        updateVariant(variantIndex, "callToAction", data.callToAction);
      }
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Refinement failed. Try again or edit manually.",
      );
    } finally {
      setRefiningVariant(null);
    }
  };

  // ---- Step 3 → 4: Generate images ----

  const handleGenerateImages = useCallback(async () => {
    if (!token || variants.length === 0) return;

    setGeneratingImages(true);
    setError(null);
    setVariantImagesLoading(new Array(variants.length).fill(true));

    try {
      const chips = deriveImageChips(
        activeTone,
        activeTemplate,
        0,
        creationMode === "brand" ? brandImageWorld : undefined,
      );

      // Enrich each variant's visual description with imageMood + selected context
      const contextKeywords =
        selectedContexts.length > 0
          ? selectedContexts
              .map((label) =>
                getContextValueMap(scoredContexts, language).get(label) || label,
              )
              .join(", ")
          : "";
      const variantVDs = variants.map((v) => {
        const moodPrefix = v.imageMood?.trim();
        const baseDescription =
          v.fluxPrompt || v.visualDirection?.description || "";
        // Weave mood + context into the prompt as natural scene-setting
        // language, not bracketed metadata — Flux responds better to
        // descriptive prose than tagged prefixes.
        const moodIntro = moodPrefix
          ? `${moodPrefix}.`
          : "";
        const contextIntro = contextKeywords
          ? `${contextKeywords} setting.`
          : "";
        const enrichedDescription = [moodIntro, contextIntro, baseDescription]
          .filter(Boolean)
          .join(" ");
        return {
          visualDirection: {
            description: enrichedDescription,
            keyElements: v.visualDirection?.keyElements || [],
            styleNotes: v.visualDirection?.styleNotes || "",
          },
          formContext: {
            title: v.title,
            description: v.description,
            promotionType: v.type,
            barName,
          },
        };
      });

      const res = await fetch(`/api/auth/bar/${barId}/images/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          variantVisualDirections: variantVDs,
          contentType,
          styleId: chips.styleId,
          subjectId: chips.subjectId,
          compositionId: chips.compositionId,
          count: 1,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.blockedReasons && Array.isArray(data.blockedReasons)) {
          const variantLabel =
            data.variantIndex != null
              ? ` (Option ${data.variantIndex + 1})`
              : "";
          const reasons = data.blockedReasons.join("; ");
          const hint = data.hint ? ` ${data.hint}` : "";
          setError(`Image blocked${variantLabel}: ${reasons}.${hint}`);
        } else if (data.error) {
          throw new Error(data.error);
        } else {
          throw new Error(data.hint || "Image generation failed");
        }
        setGeneratingImages(false);
        setVariantImagesLoading(new Array(variants.length).fill(false));
        return;
      }

      // Poll each async job for completion
      const jobIds: string[] = data.jobIds || [];
      if (jobIds.length > 0) {
        const variantUrls: (string | null)[] = new Array(variants.length).fill(
          null,
        );

        for (let pollAttempt = 0; pollAttempt < 45; pollAttempt++) {
          await new Promise((r) => setTimeout(r, 2000));
          let allDone = true;

          for (let i = 0; i < jobIds.length; i++) {
            if (variantUrls[i]) continue; // already got this one
            try {
              const statusRes = await fetch(
                `/api/auth/bar/${barId}/images/jobs/${jobIds[i]}`,
                { headers: { Authorization: `Bearer ${token}` } },
              );
              if (!statusRes.ok) continue;
              const statusData = await statusRes.json();
              if (statusData.status === "completed" && statusData.urls?.[0]) {
                variantUrls[i] = statusData.urls[0];
              } else if (statusData.status === "failed") {
                variantUrls[i] = null; // mark as done but failed
              } else {
                allDone = false;
              }
            } catch {
              allDone = false;
            }
          }

          if (allDone) break;
        }

        setVariantImages(variantUrls);
        setStep("images");
      } else {
        throw new Error("Image generation returned no job IDs");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Image generation failed. Try again.",
      );
    } finally {
      setGeneratingImages(false);
      setVariantImagesLoading(new Array(variants.length).fill(false));
    }
  }, [
    token,
    variants,
    barId,
    barName,
    activeTone,
    activeTemplate,
    contentType,
    selectedContexts,
    scoredContexts,
    language,
  ]);

  // ---- Step 4 → 5: Select variant ----

  const handleSelectVariant = useCallback(
    (variantIndex: number) => {
      const v = variants[variantIndex];
      const layout = variantLayouts[variantIndex] || "split";
      const sd = suggestDataRef.current;

      const baseData: Record<string, unknown> = {
        inferredType,
        aiGenerated: true,
        confidence: 0.85,
        mode: creationMode,
        title: v.title,
        description: v.description,
        callToAction: v.callToAction,
        ctaOptions: v.ctaOptions || [],
        hookPattern: v.hookPattern || null,
        imageUrl: variantImages[variantIndex] || null,
        cardFormat: "wide",
        visual: {
          template: layout,
          mood: "dark",
          overlayOpacity: 0.4,
          accentColor: v.accentColor,
        },
      };

      // Attach type-specific fields from the suggest response
      if (contentType === "event") {
        baseData.startTime = sd?.startTime || null;
        baseData.endTime = sd?.endTime || null;
        baseData.maxAttendees = sd?.maxAttendees || null;
        baseData.isPrivate = sd?.isPrivate || false;
        baseData.eventCategory = sd?.eventCategory || v.type;
      } else if (contentType === "pass") {
        baseData.passType = sd?.passType || v.type;
        baseData.priceEuros = sd?.priceEuros || v.conditions || null;
        baseData.originalPriceEuros = sd?.originalPriceEuros || null;
        baseData.benefits = sd?.benefits || [];
        baseData.totalQuantity = sd?.totalQuantity || null;
        baseData.validityPeriod = sd?.validityPeriod || null;
      } else {
        // Promotions
        baseData.promotionType = v.type;
        baseData.discountValue = v.discount;
        baseData.conditions = v.conditions;
      }

      onGenerated(baseData);

      setStep("schedule");
    },
    [
      variants,
      variantLayouts,
      variantImages,
      inferredType,
      contentType,
      onGenerated,
    ],
  );

  // ---- Regenerate single image ----

  const handleRegenerateImage = useCallback(
    async (variantIndex: number, subjectOverride?: string) => {
      const v = variants[variantIndex];
      if (!v || !token) return;

      const loading = [...variantImagesLoading];
      loading[variantIndex] = true;
      setVariantImagesLoading(loading);

      try {
        const chips = deriveImageChips(
          activeTone,
          activeTemplate,
          variantIndex,
          creationMode === "brand" ? brandImageWorld : undefined,
        );
        // Override subject: explicit override > per-variant state > derived default
        if (subjectOverride) {
          chips.subjectId = subjectOverride;
        } else if (variantSubjects[variantIndex]) {
          chips.subjectId = variantSubjects[variantIndex];
        }

        // Enrich visual description with imageMood + context (same as handleGenerateImages)
        const moodPrefix = v.imageMood?.trim();
        const contextKeywords =
          selectedContexts.length > 0
            ? selectedContexts
                .map((label) =>
                  getContextValueMap(scoredContexts, language).get(label) || label,
                )
                .join(", ")
            : "";
        const baseDescription =
          v.fluxPrompt || v.visualDirection?.description || "";
        // Weave mood + context into the prompt as natural scene-setting language
        const moodIntro = moodPrefix
          ? `${moodPrefix}.`
          : "";
        const contextIntro = contextKeywords
          ? `${contextKeywords} setting.`
          : "";
        const enrichedDescription = [moodIntro, contextIntro, baseDescription]
          .filter(Boolean)
          .join(" ");

        const res = await fetch(`/api/auth/bar/${barId}/images/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            variantVisualDirections: [
              {
                visualDirection: {
                  description: enrichedDescription,
                  keyElements: v.visualDirection?.keyElements || [],
                  styleNotes: v.visualDirection?.styleNotes || "",
                },
                formContext: {
                  title: v.title,
                  description: v.description,
                  promotionType: v.type,
                  barName,
                },
              },
            ],
            contentType,
            styleId: chips.styleId,
            subjectId: chips.subjectId,
            compositionId: chips.compositionId,
            count: 1,
          }),
        });

        const data = await res.json();
        if (data.jobIds?.[0]) {
          // Poll for job completion
          for (let attempt = 0; attempt < 45; attempt++) {
            await new Promise((r) => setTimeout(r, 2000));
            const statusRes = await fetch(
              `/api/auth/bar/${barId}/images/jobs/${data.jobIds[0]}`,
              { headers: { Authorization: `Bearer ${token}` } },
            );
            if (!statusRes.ok) continue;
            const statusData = await statusRes.json();
            if (statusData.status === "completed" && statusData.urls?.[0]) {
              const images = [...variantImages];
              images[variantIndex] = statusData.urls[0];
              setVariantImages(images);
              break;
            }
            if (statusData.status === "failed") break;
          }
        }
      } catch {
        // Silently fail — keep existing image
      } finally {
        const loading = [...variantImagesLoading];
        loading[variantIndex] = false;
        setVariantImagesLoading(loading);
      }
    },
    [
      variants,
      variantImages,
      variantImagesLoading,
      token,
      barId,
      barName,
      activeTone,
      activeTemplate,
      selectedContexts,
      scoredContexts,
      language,
    ],
  );

  // ---- Navigation ----

  const goBack = () => {
    if (step === "brief") setStep("type");
    else if (step === "refine") setStep("brief");
    else if (step === "images") setStep("refine");
    else if (step === "schedule") setStep("images");
    else if (step === "publish") setStep("schedule");
  };

  // ---- Render helpers ----

  const toneLabel = activeTone
    ? TONE_OPTIONS.find((o) => o.value === activeTone)
    : null;

  return (
    <Container>
      {/* ---- Progress bar ---- */}
      <ProgressBar>
        {(
          [
            "type",
            "brief",
            "refine",
            "images",
            "schedule",
            "publish",
          ] as FlowStep[]
        ).map((s, i) => {
          const isActive = s === step;
          const isDone = stepNumber(step) > stepNumber(s);
          const isClickable = isDone && s !== "refine" && s !== "images";

          return (
            <React.Fragment key={s}>
              <ProgressStep>
                <ProgressDot
                  $active={isActive}
                  $done={isDone}
                  onClick={isClickable ? () => setStep(s) : undefined}
                  style={{ cursor: isClickable ? "pointer" : "default" }}
                >
                  {isDone ? "✓" : i + 1}
                </ProgressDot>
                <ProgressLabel $active={isActive} $done={isDone}>
                  {PROGRESS_LABELS[s]}
                </ProgressLabel>
              </ProgressStep>
              {i < 5 && <ProgressLine $done={isDone} />}
            </React.Fragment>
          );
        })}
      </ProgressBar>

      <StepBody>
        <StepTitle>
          <StepNum>{stepNumber(step)}.</StepNum> {STEP_LABELS[step]}
        </StepTitle>

        {/* ===== STEP 1: TYPE ===== */}
        {step === "type" && (
          <>
            {/* Mode selector — brand building vs promotional offers */}
            <ModeGrid>
              <ModeCard
                $active={creationMode === "brand"}
                onClick={() => {
                  onModeChange?.("brand");
                  onTypeChange("brand" as ContentType);
                  setStep("brief");
                }}
              >
                <ModeCardLabel>
                  {language === "fi" ? "Sisältöä brändille" : "Brand Content"}
                </ModeCardLabel>
                <ModeCardDesc>
                  {language === "fi"
                    ? "Rakenna tunnelmaa, kerro tarinoita, luo mielikuvia. Ei hintoja, ei tarjouksia — tunnetta ja muistijälkeä."
                    : "Build atmosphere, tell stories, create associations. No prices, no offers — feeling and memory."}
                </ModeCardDesc>
              </ModeCard>
              <ModeCard
                $active={creationMode === "promotional"}
                onClick={() => onModeChange?.("promotional")}
              >
                <ModeCardLabel>
                  {language === "fi" ? "Tarjouskampanja" : "Promotional Offer"}
                </ModeCardLabel>
                <ModeCardDesc>
                  {language === "fi"
                    ? "Aikarajoitettu etu. Hinta, ehdot, toimintakehote. Alkoholilain rajoitukset huomioidaan."
                    : "Time-limited benefit. Price, conditions, call to action. Alcohol law restrictions apply."}
                </ModeCardDesc>
              </ModeCard>
              <ModeCard
                $active={creationMode === "campaign"}
                onClick={() => {
                  onModeChange?.("campaign");
                  setStep("brief");
                }}
              >
                <ModeCardLabel>
                  {language === "fi" ? "Kampanja" : "Campaign"}
                </ModeCardLabel>
                <ModeCardDesc>
                  {language === "fi"
                    ? "Usean postauksen sarja. Teaseri → julkistus → muistutus → tapahtuu nyt → jälkiseuranta. Yhtenäinen luova suunta."
                    : "Multi-post sequence. Teaser → announcement → reminder → day-of → follow-up. Unified creative direction."}
                </ModeCardDesc>
              </ModeCard>
            </ModeGrid>

            {creationMode !== "brand" && (
              <>
                <SectionLabel style={{ marginTop: 20 }}>
                  {language === "fi"
                    ? "Valitse sisältötyyppi"
                    : "Choose content type"}
                </SectionLabel>
                <TypeGrid>
                  {TYPE_OPTIONS.map((opt) => (
                    <TypeCard
                      key={opt.value}
                      $selected={contentType === opt.value}
                      onClick={() => {
                        onTypeChange(opt.value);
                        setStep("brief");
                      }}
                    >
                      <TypeCardEmoji>{opt.emoji}</TypeCardEmoji>
                      <TypeCardLabel>{opt.label}</TypeCardLabel>
                      <TypeCardDesc>{opt.desc}</TypeCardDesc>
                    </TypeCard>
                  ))}
                </TypeGrid>
              </>
            )}
          </>
        )}

        {/* ===== STEP 2: BRIEF ===== */}
        {step === "brief" && (
          <div>
            {/* Campaign config panel — only shown in campaign mode */}
            {creationMode === "campaign" && (
              <CampaignConfigPanel>
                <SectionLabel>
                  {language === "fi"
                    ? "Kampanjan asetukset"
                    : "Campaign Settings"}
                </SectionLabel>

                {/* Campaign name */}
                <FieldGroup>
                  <FieldLabel>
                    {language === "fi" ? "Kampanjan nimi" : "Campaign Name"}
                  </FieldLabel>
                  <CampaignNameInput
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder={
                      language === "fi"
                        ? 'esim. "Perjantai After-Work -sarja"'
                        : 'e.g. "Friday After-Work Series"'
                    }
                    disabled={campaignGenerating}
                  />
                </FieldGroup>

                {/* Beat selection */}
                <FieldGroup>
                  <FieldLabel>
                    {language === "fi"
                      ? "Postaukset (järjestyksessä)"
                      : "Posts (in order)"}
                  </FieldLabel>
                  <BeatCheckRow>
                    {BEAT_ORDER.map((beat) => {
                      const def = BEAT_DEFS[beat];
                      const label = language === "fi" ? def.label.fi : def.label.en;
                      const isSelected = campaignBeats.includes(beat);
                      return (
                        <BeatCheckChip
                          key={beat}
                          $active={isSelected}
                          onClick={() => toggleCampaignBeat(beat)}
                          disabled={campaignGenerating}
                          title={
                            language === "fi"
                              ? def.objective.fi
                              : def.objective.en
                          }
                        >
                          {label}
                        </BeatCheckChip>
                      );
                    })}
                  </BeatCheckRow>
                  <FieldHint style={{ marginTop: 6 }}>
                    {language === "fi"
                      ? "Suositus: teaser + julkistus + tapahtuu nyt = 3 postausta 5 päivässä"
                      : "Recommended: teaser + announcement + day-of = 3 posts over 5 days"}
                  </FieldHint>
                </FieldGroup>

                {/* Event date / time */}
                <FieldGroup>
                  <FieldLabel>
                    {language === "fi"
                      ? "Tapahtuman päivämäärä"
                      : "Event Date"}
                  </FieldLabel>
                  <DateRow>
                    <DateInput
                      type="date"
                      value={campaignEventDate}
                      onChange={(e) => setCampaignEventDate(e.target.value)}
                      disabled={campaignGenerating}
                    />
                    <TimeInput
                      type="time"
                      value={campaignEventTime}
                      onChange={(e) => setCampaignEventTime(e.target.value)}
                      disabled={campaignGenerating}
                      placeholder="17:00"
                    />
                  </DateRow>
                  <FieldHint style={{ marginTop: 4 }}>
                    {language === "fi"
                      ? "AI käyttää päivämäärää postausten ajoituksen laskemiseen (teaseri 3pv ennen, julkistus 1pv ennen jne.)"
                      : "The AI uses this date to calculate post timing (teaser 3 days before, announcement 1 day before, etc.)"}
                  </FieldHint>
                </FieldGroup>

                <Divider />
              </CampaignConfigPanel>
            )}

            {/* Campaign preview — always visible summary of what will be generated */}
            {creationMode === "campaign" && campaignName.trim() && (
              <PreviewSection style={{ marginBottom: 16 }}>
                <PreviewBody>
                    <PreviewLine>
                      <strong>{campaignName}</strong>
                      {campaignEventDate && (
                        <span style={{ color: "#6b7280", marginLeft: 8 }}>
                          — {new Date(campaignEventDate).toLocaleDateString(
                            language === "fi" ? "fi-FI" : "en-US",
                            { weekday: "short", month: "long", day: "numeric" },
                          )}
                        </span>
                      )}
                    </PreviewLine>
                    <PreviewLine style={{ color: "#9ca3af", marginTop: 4 }}>
                      {`${barName} • ${toneLabel ? toneLabel.label : language === "fi" ? "Ei äänensävyä" : "No tone selected"}`}
                    </PreviewLine>
                    <PreviewLine style={{ color: "#6b7280", marginTop: 6 }}>
                      {language === "fi" ? "Postaukset:" : "Posts:"}
                    </PreviewLine>
                    {campaignBeats.map((beat, i) => {
                      const def = BEAT_DEFS[beat];
                      const label = language === "fi" ? def.label.fi : def.label.en;
                      return (
                        <PreviewLine key={beat} style={{ color: "#e5e7eb", paddingLeft: 12 }}>
                          <span
                            style={{
                              display: "inline-block",
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: CAMPAIGN_JOB_COLORS[beat],
                              marginRight: 8,
                              verticalAlign: "middle",
                            }}
                          />
                          {i + 1}. {label}
                          <span style={{ color: "#6b7280", marginLeft: 6, fontSize: 11 }}>
                            {language === "fi" ? def.objective.fi : def.objective.en}
                          </span>
                        </PreviewLine>
                      );
                    })}
                    {text.trim() && (
                      <>
                        <PreviewLine style={{ color: "#6b7280", marginTop: 6 }}>
                          {language === "fi" ? "Lisätiedot:" : "Additional context:"}
                        </PreviewLine>
                        <PreviewLine style={{ color: "#e5e7eb", paddingLeft: 12 }}>
                          {text.trim()}
                        </PreviewLine>
                      </>
                    )}
                  </PreviewBody>
              </PreviewSection>
            )}

            {/* Language toggle */}
            <ControlsRow style={{ marginTop: 0, marginBottom: 14 }}>
              <ControlGroup>
                <ControlLabel>Language</ControlLabel>
                <PillGroup>
                  {(["en", "fi"] as const).map((lang) => (
                    <Pill
                      key={lang}
                      $active={language === lang}
                      onClick={() => setLanguage(lang)}
                      disabled={generatingText}
                    >
                      {lang.toUpperCase()}
                    </Pill>
                  ))}
                </PillGroup>
              </ControlGroup>
            </ControlsRow>

            {/* Example cards — appear when a template is selected, showing
                what kind of content the chosen ingredients will produce */}
            {activeTemplate && EXAMPLE_CARDS[language]?.[activeTemplate] ? (
              <>
                <SectionLabel>
                  {language === "fi" ? "Esimerkkitulokset" : "Example outputs"}
                </SectionLabel>
                <ExampleCardsRow>
                  {EXAMPLE_CARDS[language][activeTemplate].map((card, i) => (
                    <ExampleCard key={i} $tone={activeTone}>
                      <ExampleCardTitle>{card.title}</ExampleCardTitle>
                      <ExampleCardDesc>{card.description}</ExampleCardDesc>
                    </ExampleCard>
                  ))}
                </ExampleCardsRow>
              </>
            ) : (
              <ExampleCardsRow>
                <ExampleCard $tone={null}>
                  <ExampleLabel>
                    {language === "fi" ? "Valitse malli" : "Pick a template"}
                  </ExampleLabel>
                  <ExampleCardDesc>
                    {language === "fi"
                      ? "Valitse pikamalli nähdäksesi esimerkkituloksia. Mallit auttavat sinua luomaan sisältöä nopeasti."
                      : "Choose a quick template above to see example outputs. Templates help you create content fast."}
                  </ExampleCardDesc>
                </ExampleCard>
                <ExampleCard $tone={null}>
                  <ExampleLabel>
                    {language === "fi" ? "Lisää äänensävy" : "Add a tone"}
                  </ExampleLabel>
                  <ExampleCardDesc>
                    {language === "fi"
                      ? "Valitse äänensävy antaaksesi sisällölle persoonallisuutta. Eri sävyt toimivat eri tilanteisiin."
                      : "Pick a tone to give your content personality. Different tones suit different occasions."}
                  </ExampleCardDesc>
                </ExampleCard>
              </ExampleCardsRow>
            )}

            <BriefActionsRow>
              {activeTemplate && (
                <RegenerateBriefButton
                  onClick={handleRegenerateBrief}
                  disabled={generatingText}
                >
                  {language === "fi" ? "↻ Arvo uusi" : "↻ Regenerate"}
                </RegenerateBriefButton>
              )}
              <TextareaHint>
                {language === "fi"
                  ? "Valitse malli ja äänensävy — tai jätä tyhjäksi ja luo automaattisesti."
                  : "Pick a template and tone — or leave empty to generate automatically."}
              </TextareaHint>
            </BriefActionsRow>

            {/* ---- Collapsible Helpers ---- */}

            {/* Tone helper */}
            <HelperSection>
              <HelperToggle onClick={() => setToneOpen(!toneOpen)}>
                <HelperToggleIcon $open={toneOpen}>
                  {toneOpen ? "▼" : "▶"}
                </HelperToggleIcon>
                <HelperToggleLabel>
                  {language === "fi" ? "Äänensävy" : "Tone"}
                  {activeTone && (
                    <HelperActiveTag>
                      {toneLabel?.label}
                    </HelperActiveTag>
                  )}
                </HelperToggleLabel>
                {/* Voice profile indicator — shows the bar's established voice */}
                {(() => {
                  if (!voiceProfile) return null;
                  const summary = getVoiceSummary(voiceProfile, language);
                  if (!summary) return null;
                  return (
                    <VoiceIndicator>
                      <VoiceLabel>
                        {summary.label}:
                      </VoiceLabel>
                      {voiceOverride ? (
                        <VoiceToneChip $override>
                          {summary.tone}
                        </VoiceToneChip>
                      ) : (
                        <VoiceToneChip>
                          {summary.tone}
                        </VoiceToneChip>
                      )}
                      {voiceOverride && activeTone && (
                        <VoiceOverrideLink
                          onClick={(e) => {
                            e.stopPropagation();
                            if (voiceProfile?.preferredTone) {
                              setActiveTone(voiceProfile.preferredTone);
                              setVoiceOverride(false);
                            }
                          }}
                        >
                          {language === "fi"
                            ? "palauta"
                            : "reset"}
                        </VoiceOverrideLink>
                      )}
                    </VoiceIndicator>
                  );
                })()}
                {!toneOpen && (
                  <HelperHint>
                    {language === "fi" ? "Valinnainen" : "Optional"}
                  </HelperHint>
                )}
              </HelperToggle>
              {toneOpen && (
                <HelperBody>
                  <HelperDesc>
                    {language === "fi"
                      ? "Valitse äänensävy — se lisätään briefiin ohjeeksi."
                      : "Pick a tone — it'll be included in your brief as guidance."}
                  </HelperDesc>
                  {toneRecommendations && (
                    <HelperHint style={{ marginBottom: 6 }}>
                      {language === "fi"
                        ? `"${activeTemplate}"-malli toimii parhaiten tiettyjen sävyjen kanssa. Suositellut on merkitty vihreällä.`
                        : `The "${activeTemplate}" template works best with certain tones. Recommended ones are highlighted in green.`}
                    </HelperHint>
                  )}
                  <ToneRow>
                    {TONE_OPTIONS.map((opt) => {
                      const isRecommended =
                        toneRecommendations?.recommended.includes(opt.value);
                      const isCautionary =
                        toneRecommendations?.cautionary.includes(opt.value);
                      return (
                        <ToneChip
                          key={opt.value}
                          $active={activeTone === opt.value}
                          $recommended={isRecommended}
                          $cautionary={isCautionary}
                          onClick={() => handleToneSelect(opt.value)}
                          disabled={generatingText}
                        >
                          {opt.label}
                          {isRecommended && (
                            <ToneRecommendTag>
                              {language === "fi" ? "suositus" : "recommended"}
                            </ToneRecommendTag>
                          )}
                        </ToneChip>
                      );
                    })}
                  </ToneRow>
                </HelperBody>
              )}
            </HelperSection>

            {/* Templates helper */}
            <HelperSection>
              <HelperToggle onClick={() => setTemplatesOpen(!templatesOpen)}>
                <HelperToggleIcon $open={templatesOpen}>
                  {templatesOpen ? "▼" : "▶"}
                </HelperToggleIcon>
                <HelperToggleLabel>
                  {language === "fi" ? "Pikamallit" : "Quick templates"}
                  {activeTemplateLabel && (
                    <HelperActiveTag>{activeTemplateLabel}</HelperActiveTag>
                  )}
                </HelperToggleLabel>
                {!templatesOpen && (
                  <HelperHint>
                    {language === "fi" ? "Valinnainen" : "Optional"}
                  </HelperHint>
                )}
              </HelperToggle>
              {templatesOpen && (
                <HelperBody>
                  <HelperDesc>
                    {language === "fi"
                      ? "Klikkaa mallia täyttääksesi briefin. Jokainen malli on sävyyn mukautuva ja noudattaa Suomen alkoholilainsäädäntöä."
                      : "Click a template to fill your brief. Each template is tone-adaptive and complies with Finnish alcohol marketing law."}
                  </HelperDesc>

                  {/* Categorized template view (promotions) */}
                  {isCategorizedTemplates && categorizedTemplates ? (
                    <>
                      {/* Suggested for you — AI-ranked by bar type + tone */}
                      {suggestedTemplates.length > 0 && (
                        <CategorySection>
                          <CategoryHeader style={{ color: "#a78bfa" }}>
                            {language === "fi"
                              ? `Ehdotukset: ${barName}`
                              : `Suggested for ${barName || "you"}`}
                          </CategoryHeader>
                          <CategoryTemplateGrid>
                            {suggestedTemplates.map((tpl) => (
                              <CategoryTemplateCard
                                key={`suggested-${tpl.id}`}
                                $active={activeTemplate === tpl.id}
                                onClick={() => handleTemplateClick(tpl.id)}
                                disabled={generatingText}
                                style={{
                                  borderColor:
                                    tpl.reason === "both"
                                      ? "rgba(167, 139, 250, 0.5)"
                                      : tpl.reason === "tone-match" || tpl.reason === "bar-type-match"
                                        ? "rgba(167, 139, 250, 0.3)"
                                        : undefined,
                                }}
                              >
                                <TemplateName>
                                  {tpl.label[language]}
                                  {tpl.reason === "both" && (
                                    <WizardBadge style={{ background: "rgba(167,139,250,0.2)", color: "#c4b5fd" }}>
                                      {language === "fi" ? "paras" : "top pick"}
                                    </WizardBadge>
                                  )}
                                </TemplateName>
                                <TemplateDesc>
                                  {tpl.conceptPrompt[language].length > 60
                                    ? tpl.conceptPrompt[language].slice(0, 57) + "…"
                                    : tpl.conceptPrompt[language]}
                                </TemplateDesc>
                              </CategoryTemplateCard>
                            ))}
                          </CategoryTemplateGrid>
                        </CategorySection>
                      )}

                      {/* All templates by category */}
                      {(Object.entries(categorizedTemplates) as [TemplateCategory, PromotionTemplate[]][])
                        .filter(([, templates]) => templates.length > 0)
                        .map(([category, templates]) => (
                          <CategorySection key={category}>
                            <CategoryHeader>
                              {CATEGORY_LABELS[category]?.[language] || category}
                            </CategoryHeader>
                            <CategoryTemplateGrid>
                              {templates.map((tpl) => (
                                <CategoryTemplateCard
                                  key={tpl.id}
                                  $active={activeTemplate === tpl.id}
                                  onClick={() => handleTemplateClick(tpl.id)}
                                  disabled={generatingText}
                                >
                                  <TemplateName>{tpl.label[language]}</TemplateName>
                                  <TemplateDesc>
                                    {tpl.conceptPrompt[language].length > 70
                                      ? tpl.conceptPrompt[language].slice(0, 67) + "…"
                                      : tpl.conceptPrompt[language]}
                                  </TemplateDesc>
                                </CategoryTemplateCard>
                              ))}
                            </CategoryTemplateGrid>
                          </CategorySection>
                        ))}

                      {/* "Can't find what you need?" custom prompt */}
                      <div style={{
                        marginTop: "10px",
                        padding: "10px 12px",
                        background: "rgba(124, 58, 237, 0.04)",
                        border: "1px dashed rgba(124, 58, 237, 0.2)",
                        borderRadius: "8px",
                        display: "flex",
                        gap: "6px",
                        alignItems: "center",
                      }}>
                        <input
                          type="text"
                          value={customTemplateIdea}
                          onChange={(e) => setCustomTemplateIdea(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCustomTemplateSubmit();
                          }}
                          placeholder={
                            language === "fi"
                              ? "Etkö löydä etsimääsi? Kuvaile ideasi..."
                              : "Can't find what you need? Describe your idea..."
                          }
                          disabled={generatingText}
                          style={{
                            flex: 1,
                            padding: "6px 10px",
                            border: "1px solid #2d2d4a",
                            borderRadius: "6px",
                            background: "#0d0d1a",
                            color: "#e5e7eb",
                            fontSize: "11px",
                            fontFamily: "inherit",
                          }}
                        />
                        <button
                          onClick={handleCustomTemplateSubmit}
                          disabled={!customTemplateIdea.trim() || generatingText}
                          style={{
                            padding: "6px 12px",
                            background: customTemplateIdea.trim()
                              ? "rgba(124, 58, 237, 0.2)"
                              : "rgba(124, 58, 237, 0.05)",
                            color: customTemplateIdea.trim() ? "#c4b5fd" : "#4b5563",
                            border: customTemplateIdea.trim()
                              ? "1px solid rgba(124, 58, 237, 0.3)"
                              : "1px solid rgba(124, 58, 237, 0.1)",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 600,
                            cursor: customTemplateIdea.trim() ? "pointer" : "default",
                            whiteSpace: "nowrap",
                            fontFamily: "inherit",
                          }}
                        >
                          {language === "fi" ? "Käytä" : "Use idea"}
                        </button>
                      </div>
                    {/* Template detail panel — shows category-specific fields
                        when a new-system template is selected */}
                    {activeTemplate && getFieldsForTemplate(activeTemplate).length > 0 && (
                      <TemplateDetailPanel
                        templateId={activeTemplate}
                        language={language}
                        onChange={setTemplateFieldValues}
                      />
                    )}
                    </>
                  ) : (
                    /* Old flat template grid (events/passes) */
                    <TemplateGrid>
                      {activeTemplates.map((tpl) => {
                        const hasWizard = !!getWizardForTemplate(tpl.label);
                        return (
                          <TemplateCard
                            key={tpl.label}
                            $active={activeTemplate === tpl.label}
                            onClick={() => handleTemplateClick(tpl.label)}
                            disabled={generatingText}
                          >
                            <TemplateName>
                              {tpl.label}
                              {hasWizard && (
                                <WizardBadge>
                                  {language === "fi" ? "ohjattu" : "wizard"}
                                </WizardBadge>
                              )}
                            </TemplateName>
                            <TemplateDesc>
                              {tpl.prompt.length > 80
                                ? tpl.prompt.slice(0, 77) + "…"
                                : tpl.prompt}
                            </TemplateDesc>
                          </TemplateCard>
                        );
                      })}
                    </TemplateGrid>
                  )}

                  {/* Wizard panel */}
                  {wizardActive && wizardSteps.length > 0 && (
                    <WizardPanel>
                      <WizardProgress>
                        <span>
                          {language === "fi" ? "Vaihe" : "Step"}{" "}
                          {wizardStep + 1}/{wizardSteps.length}
                        </span>
                        <WizardStepPips>
                          {wizardSteps.map((_, i) => (
                            <WizardPip
                              key={i}
                              $active={i === wizardStep}
                              $done={i < wizardStep}
                            />
                          ))}
                        </WizardStepPips>
                      </WizardProgress>
                      <WizardQuestion>
                        {wizardSteps[wizardStep].question}
                      </WizardQuestion>
                      <WizardChipRow>
                        {wizardSteps[wizardStep].options.map((opt, j) => (
                          <WizardChip
                            key={j}
                            onClick={() =>
                              handleWizardAnswer(
                                wizardSteps[wizardStep].label,
                                opt.prompt,
                              )
                            }
                          >
                            {opt.label}
                          </WizardChip>
                        ))}
                      </WizardChipRow>
                      <WizardActions>
                        <WizardBackButton
                          onClick={handleWizardBack}
                          disabled={wizardStep === 0}
                        >
                          {language === "fi" ? "← Edellinen" : "← Back"}
                        </WizardBackButton>
                        <WizardSkipButton onClick={handleWizardDismiss}>
                          {language === "fi" ? "Ohita" : "Skip"}
                        </WizardSkipButton>
                      </WizardActions>
                    </WizardPanel>
                  )}
                </HelperBody>
              )}
            </HelperSection>

            {/* Context helper */}
            <HelperSection>
              <HelperToggle onClick={() => setContextOpen(!contextOpen)}>
                <HelperToggleIcon $open={contextOpen}>
                  {contextOpen ? "▼" : "▶"}
                </HelperToggleIcon>
                <HelperToggleLabel>
                  {language === "fi" ? "Lisää kontekstia" : "Add context"}
                </HelperToggleLabel>
                {!contextOpen && (
                  <HelperHint>
                    {topSuggestedContexts.length > 0
                      ? `${topSuggestedContexts.length} ${language === "fi" ? "ehdotusta" : "suggestions"}`
                      : language === "fi"
                        ? "Kausiluonteiset vinkit"
                        : "Seasonal hooks"}
                  </HelperHint>
                )}
              </HelperToggle>
              {contextOpen && (
                <HelperBody>
                  <HelperDesc>
                    {language === "fi"
                      ? "Konteksti auttaa tekoälyä räätälöimään sisältöä tilanteeseen. Klikkaa lisätäksesi."
                      : "Context helps the AI tailor content to the situation. Click to add."}
                  </HelperDesc>

                  {/* Suggested contexts — scored by relevance */}
                  {topSuggestedContexts.length > 0 && (
                    <div style={{ marginBottom: "10px" }}>
                      <div style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#a78bfa",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: "5px",
                      }}>
                        {language === "fi" ? "Ehdotetut" : "Suggested for you"}
                      </div>
                      <SuggestionRow>
                        {topSuggestedContexts.map((ctx) => {
                          const labelKey = ctx.label[language];
                          const isSelected = selectedContexts.includes(labelKey);
                          return (
                            <SuggestionChip
                              key={ctx.id || labelKey}
                              $selected={isSelected}
                              onClick={() => handleToggleContext(ctx)}
                              disabled={generatingText}
                              title={ctx.value[language]}
                              style={{
                                borderColor: isSelected ? "#7c3aed" : "rgba(167, 139, 250, 0.3)",
                              }}
                            >
                              {isSelected ? "✓ " : ""}
                              {labelKey}
                              {ctx.reasons.length > 0 && (
                                <span style={{
                                  fontSize: "8px",
                                  color: "#a78bfa",
                                  marginLeft: "3px",
                                  opacity: 0.7,
                                }}>
                                  {ctx.reasons[0]}
                                </span>
                              )}
                            </SuggestionChip>
                          );
                        })}
                      </SuggestionRow>
                    </div>
                  )}

                  {/* All contexts */}
                  <div style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "5px",
                    marginTop: topSuggestedContexts.length > 0 ? "8px" : 0,
                  }}>
                    {language === "fi" ? "Kaikki kontekstit" : "All contexts"}
                  </div>
                  <SuggestionRow>
                    {remainingContexts.map((ctx) => {
                      const labelKey = ctx.label[language];
                      const isSelected = selectedContexts.includes(labelKey);
                      return (
                        <SuggestionChip
                          key={ctx.id || labelKey}
                          $selected={isSelected}
                          onClick={() => handleToggleContext(ctx)}
                          disabled={generatingText}
                          title={ctx.value[language]}
                        >
                          {isSelected ? "✓ " : ""}
                          {labelKey}
                        </SuggestionChip>
                      );
                    })}
                    {topSuggestedContexts.length > 0 && topSuggestedContexts.map((ctx) => {
                      const labelKey = ctx.label[language];
                      const isSelected = selectedContexts.includes(labelKey);
                      return (
                        <SuggestionChip
                          key={`all-${ctx.id || labelKey}`}
                          $selected={isSelected}
                          onClick={() => handleToggleContext(ctx)}
                          disabled={generatingText}
                          title={ctx.value[language]}
                          style={{ opacity: 0.5 }}
                        >
                          {isSelected ? "✓ " : ""}
                          {labelKey}
                        </SuggestionChip>
                      );
                    })}
                  </SuggestionRow>

                  <CustomContextRow>
                    <CustomContextInput
                      placeholder={
                        language === "fi"
                          ? "Kirjoita oma konteksti..."
                          : "Type your own context..."
                      }
                      value={customContextInput}
                      onChange={(e) => setCustomContextInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomContext();
                        }
                      }}
                      disabled={generatingText}
                    />
                    <CustomContextAddBtn
                      onClick={handleAddCustomContext}
                      disabled={generatingText || !customContextInput.trim()}
                    >
                      {language === "fi" ? "Lisää" : "Add"}
                    </CustomContextAddBtn>
                  </CustomContextRow>
                </HelperBody>
              )}
            </HelperSection>

            {/* ===== Brand ingredient helpers — only visible in brand mode ===== */}
            {creationMode === "brand" && (
              <>
                <Divider style={{ margin: "12px 0" }} />
                <SectionLabel>
                  {language === "fi" ? "Brändiainekset" : "Brand Ingredients"}
                </SectionLabel>

                {/* Audience (Yleisö) */}
                <HelperSection>
                  <HelperToggle
                    onClick={() => setBrandAudienceOpen(!brandAudienceOpen)}
                  >
                    <HelperToggleIcon $open={brandAudienceOpen}>
                      {brandAudienceOpen ? "▼" : "▶"}
                    </HelperToggleIcon>
                    <HelperToggleLabel>
                      {language === "fi" ? "Yleisö" : "Audience"}
                      {brandAudience.length > 0 && (
                        <HelperActiveTag>
                          {brandAudience.length}{" "}
                          {language === "fi" ? "valittu" : "selected"}
                        </HelperActiveTag>
                      )}
                    </HelperToggleLabel>
                  </HelperToggle>
                  {brandAudienceOpen && (
                    <HelperBody>
                      <HelperDesc>
                        {language === "fi"
                          ? "Kenelle sisältö on suunnattu? Valitse yksi tai useampi."
                          : "Who is this content for? Select one or more."}
                      </HelperDesc>
                      <ToneRow>
                        {(Object.keys(AUDIENCE_LABELS) as AudienceChip[]).map(
                          (key) => {
                            const label = AUDIENCE_LABELS[key];
                            const isSelected = brandAudience.includes(key);
                            return (
                              <ToneChip
                                key={key}
                                $active={isSelected}
                                onClick={() => {
                                  const next = isSelected
                                    ? brandAudience.filter((a) => a !== key)
                                    : [...brandAudience, key];
                                  onBrandAudienceChange?.(next);
                                }}
                                disabled={generatingText}
                              >
                                {language === "fi" ? label.fi : label.en}
                              </ToneChip>
                            );
                          },
                        )}
                      </ToneRow>
                    </HelperBody>
                  )}
                </HelperSection>

                {/* Core Message (Viestin ydin) */}
                <HelperSection>
                  <HelperToggle
                    onClick={() => setBrandCoreMsgOpen(!brandCoreMsgOpen)}
                  >
                    <HelperToggleIcon $open={brandCoreMsgOpen}>
                      {brandCoreMsgOpen ? "▼" : "▶"}
                    </HelperToggleIcon>
                    <HelperToggleLabel>
                      {language === "fi" ? "Viestin ydin" : "Core Message"}
                      {brandCoreMessage && (
                        <HelperActiveTag>
                          {CORE_MESSAGE_LABELS[
                            brandCoreMessage as CoreMessageChip
                          ]?.[language] ?? brandCoreMessage}
                        </HelperActiveTag>
                      )}
                    </HelperToggleLabel>
                  </HelperToggle>
                  {brandCoreMsgOpen && (
                    <HelperBody>
                      <HelperDesc>
                        {language === "fi"
                          ? "Jos joku näkee tämän 0,8 sekunnissa — mitä hän muistaa?"
                          : "If someone sees this for 0.8 seconds — what do they remember?"}
                      </HelperDesc>
                      <ToneRow>
                        {(
                          Object.keys(CORE_MESSAGE_LABELS) as CoreMessageChip[]
                        ).map((key) => {
                          const label = CORE_MESSAGE_LABELS[key];
                          return (
                            <ToneChip
                              key={key}
                              $active={brandCoreMessage === key}
                              onClick={() =>
                                onBrandCoreMessageChange?.(
                                  brandCoreMessage === key ? null : key,
                                )
                              }
                              disabled={generatingText}
                            >
                              {language === "fi" ? label.fi : label.en}
                            </ToneChip>
                          );
                        })}
                      </ToneRow>
                    </HelperBody>
                  )}
                </HelperSection>

                {/* Atmosphere (Tunnelma) */}
                <HelperSection>
                  <HelperToggle
                    onClick={() => setBrandAtmosphereOpen(!brandAtmosphereOpen)}
                  >
                    <HelperToggleIcon $open={brandAtmosphereOpen}>
                      {brandAtmosphereOpen ? "▼" : "▶"}
                    </HelperToggleIcon>
                    <HelperToggleLabel>
                      {language === "fi" ? "Tunnelma" : "Atmosphere"}
                      {brandAtmosphere.length > 0 && (
                        <HelperActiveTag>
                          {brandAtmosphere.length}{" "}
                          {language === "fi" ? "valittu" : "selected"}
                        </HelperActiveTag>
                      )}
                    </HelperToggleLabel>
                  </HelperToggle>
                  {brandAtmosphereOpen && (
                    <HelperBody>
                      <HelperDesc>
                        {language === "fi"
                          ? "Mitä lukijan pitäisi tuntea? Valitse yksi tai useampi tunnelma."
                          : "What should the reader feel? Select one or more atmospheres."}
                      </HelperDesc>
                      <ToneRow>
                        {(
                          Object.keys(ATMOSPHERE_LABELS) as AtmosphereChip[]
                        ).map((key) => {
                          const label = ATMOSPHERE_LABELS[key];
                          const isSelected = brandAtmosphere.includes(key);
                          return (
                            <ToneChip
                              key={key}
                              $active={isSelected}
                              onClick={() => {
                                const next = isSelected
                                  ? brandAtmosphere.filter((a) => a !== key)
                                  : [...brandAtmosphere, key];
                                onBrandAtmosphereChange?.(next);
                              }}
                              disabled={generatingText}
                            >
                              {language === "fi" ? label.fi : label.en}
                            </ToneChip>
                          );
                        })}
                      </ToneRow>
                    </HelperBody>
                  )}
                </HelperSection>

                {/* Image World (Kuvamaailma) */}
                <HelperSection>
                  <HelperToggle
                    onClick={() => setBrandImageWorldOpen(!brandImageWorldOpen)}
                  >
                    <HelperToggleIcon $open={brandImageWorldOpen}>
                      {brandImageWorldOpen ? "▼" : "▶"}
                    </HelperToggleIcon>
                    <HelperToggleLabel>
                      {language === "fi" ? "Kuvamaailma" : "Image World"}
                      {brandImageWorld && brandImageWorld !== "venue" && (
                        <HelperActiveTag>
                          {CREATIVE_IMAGE_WORLD_LABELS[
                            brandImageWorld as ImageWorldChip
                          ]?.[language] ?? brandImageWorld}
                        </HelperActiveTag>
                      )}
                    </HelperToggleLabel>
                  </HelperToggle>
                  {brandImageWorldOpen && (
                    <HelperBody>
                      <HelperDesc>
                        {language === "fi"
                          ? "Mitä kuva esittää? Baari, tunnelma, luonto vai jotain muuta?"
                          : "What does the image show? The bar, a mood, nature, or something else?"}
                      </HelperDesc>
                      <ToneRow>
                        {(
                          Object.keys(
                            CREATIVE_IMAGE_WORLD_LABELS,
                          ) as ImageWorldChip[]
                        ).map((key) => {
                          const label = CREATIVE_IMAGE_WORLD_LABELS[key];
                          return (
                            <ToneChip
                              key={key}
                              $active={brandImageWorld === key}
                              onClick={() => onBrandImageWorldChange?.(key)}
                              disabled={generatingText}
                            >
                              {language === "fi" ? label.fi : label.en}
                            </ToneChip>
                          );
                        })}
                      </ToneRow>
                    </HelperBody>
                  )}
                </HelperSection>

                {/* Copy Structure (Rakenne) */}
                <HelperSection>
                  <HelperToggle
                    onClick={() => setBrandCopyStructOpen(!brandCopyStructOpen)}
                  >
                    <HelperToggleIcon $open={brandCopyStructOpen}>
                      {brandCopyStructOpen ? "▼" : "▶"}
                    </HelperToggleIcon>
                    <HelperToggleLabel>
                      {language === "fi" ? "Rakenne" : "Structure"}
                      {brandCopyStructure && (
                        <HelperActiveTag>
                          {COPY_STRUCTURE_LABELS[
                            brandCopyStructure as CopyStructureChip
                          ]?.[language]?.split(" ")[0] ?? brandCopyStructure}
                        </HelperActiveTag>
                      )}
                    </HelperToggleLabel>
                  </HelperToggle>
                  {brandCopyStructOpen && (
                    <HelperBody>
                      <HelperDesc>
                        {language === "fi"
                          ? "Miten teksti rakentuu? Suora on usein paras suomalaiselle yleisölle."
                          : "How should the text be structured? Direct is often best for Finnish audiences."}
                      </HelperDesc>
                      <ToneRow>
                        {(
                          Object.keys(
                            COPY_STRUCTURE_LABELS,
                          ) as CopyStructureChip[]
                        ).map((key) => {
                          const label = COPY_STRUCTURE_LABELS[key];
                          return (
                            <ToneChip
                              key={key}
                              $active={brandCopyStructure === key}
                              onClick={() => onBrandCopyStructureChange?.(key)}
                              disabled={generatingText}
                            >
                              {language === "fi" ? label.fi : label.en}
                            </ToneChip>
                          );
                        })}
                      </ToneRow>
                    </HelperBody>
                  )}
                </HelperSection>
              </>
            )}

            {/* Active selections summary */}
            {(activeTone ||
              activeTemplate ||
              selectedContexts.length > 0 ||
              brandAudience.length > 0 ||
              brandCoreMessage ||
              brandAtmosphere.length > 0 ||
              (brandImageWorld && brandImageWorld !== "venue") ||
              (brandCopyStructure && brandCopyStructure !== "direct")) && (
              <IngredientsSummary>
                <IngredientsLabel>
                  {language === "fi"
                    ? "Valitut ainekset:"
                    : "Selected ingredients:"}
                </IngredientsLabel>
                <IngredientsTags>
                  {activeTone && (
                    <IngredientTag $kind="tone">
                      {toneLabel?.label}
                    </IngredientTag>
                  )}
                  {activeTemplateLabel && (
                    <IngredientTag $kind="template">
                      {activeTemplateLabel}
                    </IngredientTag>
                  )}
                  {selectedContexts.map((ctx, i) => (
                    <IngredientTag
                      key={i}
                      $kind="context"
                      onClick={() => handleRemoveContext(ctx)}
                      style={{ cursor: "pointer" }}
                      title={getContextValueMap(scoredContexts, language).get(ctx) || ctx}
                    >
                      {ctx} ✕
                    </IngredientTag>
                  ))}
                  {/* Brand ingredients */}
                  {brandAudience.map((a) => (
                    <IngredientTag
                      key={`aud-${a}`}
                      $kind="brand"
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        onBrandAudienceChange?.(
                          brandAudience.filter((x) => x !== a),
                        )
                      }
                    >
                      {language === "fi"
                        ? AUDIENCE_LABELS[a as AudienceChip]?.fi
                        : AUDIENCE_LABELS[a as AudienceChip]?.en}{" "}
                      ✕
                    </IngredientTag>
                  ))}
                  {brandCoreMessage && (
                    <IngredientTag
                      $kind="brand"
                      style={{ cursor: "pointer" }}
                      onClick={() => onBrandCoreMessageChange?.(null)}
                    >
                      {language === "fi"
                        ? CORE_MESSAGE_LABELS[
                            brandCoreMessage as CoreMessageChip
                          ]?.fi
                        : CORE_MESSAGE_LABELS[
                            brandCoreMessage as CoreMessageChip
                          ]?.en}{" "}
                      ✕
                    </IngredientTag>
                  )}
                  {brandAtmosphere.map((a) => (
                    <IngredientTag
                      key={`atm-${a}`}
                      $kind="brand"
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        onBrandAtmosphereChange?.(
                          brandAtmosphere.filter((x) => x !== a),
                        )
                      }
                    >
                      {language === "fi"
                        ? ATMOSPHERE_LABELS[a as AtmosphereChip]?.fi
                        : ATMOSPHERE_LABELS[a as AtmosphereChip]?.en}{" "}
                      ✕
                    </IngredientTag>
                  ))}
                  {brandImageWorld && brandImageWorld !== "venue" && (
                    <IngredientTag
                      $kind="brand"
                      style={{ cursor: "pointer" }}
                      onClick={() => onBrandImageWorldChange?.("venue")}
                    >
                      {language === "fi"
                        ? CREATIVE_IMAGE_WORLD_LABELS[
                            brandImageWorld as ImageWorldChip
                          ]?.fi
                        : CREATIVE_IMAGE_WORLD_LABELS[
                            brandImageWorld as ImageWorldChip
                          ]?.en}{" "}
                      ✕
                    </IngredientTag>
                  )}
                  {brandCopyStructure && brandCopyStructure !== "direct" && (
                    <IngredientTag
                      $kind="brand"
                      style={{ cursor: "pointer" }}
                      onClick={() => onBrandCopyStructureChange?.("direct")}
                    >
                      {COPY_STRUCTURE_LABELS[
                        brandCopyStructure as CopyStructureChip
                      ]?.[language]?.split(" ")[0] ?? brandCopyStructure}{" "}
                      ✕
                    </IngredientTag>
                  )}
                </IngredientsTags>
              </IngredientsSummary>
            )}

            {/* Live preview of the combined prompt — hidden for campaign mode (has its own preview) */}
            {creationMode !== "campaign" && (
              !hasIngredients ? (
                <PreviewSection>
                  <PreviewBody>
                    <PreviewPlaceholder>
                      {language === "fi"
                        ? "Valitse malli tai äänensävy nähdäksesi esikatselun."
                        : "Select a template or tone to see a preview."}
                    </PreviewPlaceholder>
                  </PreviewBody>
                </PreviewSection>
              ) : (
                <PreviewSection>
                <PreviewToggle onClick={() => setPreviewOpen(!previewOpen)}>
                  <PreviewToggleIcon $open={previewOpen}>
                    {previewOpen ? "▼" : "▶"}
                  </PreviewToggleIcon>
                  <PreviewToggleLabel>
                    {language === "fi" ? "Esikatselu" : "Preview prompt"}
                  </PreviewToggleLabel>
                  <PreviewToggleHint>
                    {language === "fi"
                      ? "— mitä generoidaan"
                      : "— what will be generated"}
                  </PreviewToggleHint>
                </PreviewToggle>
                {previewOpen && (
                  <PreviewBody>
                    {buildPreviewPrompt(
                      barName,
                      barType,
                      text,
                      activeTemplate,
                      activeTone,
                      selectedContexts.map(
                        (label) =>
                          getContextValueMap(scoredContexts, language).get(label) || label,
                      ),
                      templateFieldValues,
                      language,
                    )
                      .split("\n")
                      .map((line, i) => (
                        <PreviewLine key={i}>{line || " "}</PreviewLine>
                      ))}
                  </PreviewBody>
                )}
              </PreviewSection>
            )
          )}

            {/* Compliance pre-check blocked */}
            {complianceBlocked && (
              <ComplianceBlockedBox>
                <ComplianceBlockedTitle>
                  {language === "fi"
                    ? "Prompt hylättiin sääntöjen vuoksi"
                    : "Prompt blocked by compliance"}
                </ComplianceBlockedTitle>
                {complianceBlocked.reasons.map((reason, i) => (
                  <ComplianceBlockedReason key={i}>
                    {reason}
                  </ComplianceBlockedReason>
                ))}
                <ComplianceBlockedHint>
                  {language === "fi"
                    ? "Muokkaa promptiasi ja yritä uudelleen."
                    : "Edit your prompt and try again."}
                </ComplianceBlockedHint>
              </ComplianceBlockedBox>
            )}

            <Divider />

            {/* AI synthesis — enrich the brief by weaving ingredients together */}
            {hasIngredients && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 14px",
                  background: "linear-gradient(135deg, rgba(99, 102, 241, 0.10) 0%, rgba(139, 92, 246, 0.06) 100%)",
                  border: "1px solid rgba(99, 102, 241, 0.18)",
                  borderRadius: "10px",
                  marginTop: "2px",
                }}
              >
                <span
                  style={{
                    fontSize: "15px",
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                >
                  ✦
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#c4b5fd",
                      fontFamily: "inherit",
                      marginBottom: "2px",
                    }}
                  >
                    {language === "fi"
                      ? "Tekoäly rikastaa briefin"
                      : "AI enriches your brief"}
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#6b7280",
                      fontFamily: "inherit",
                    }}
                  >
                    {language === "fi"
                      ? "Punoo ainekset yhteen ammattimaiseksi luovaksi briefiksi — jokainen lause ankkuroituu baariisi"
                      : "Weaves your ingredients into a professional creative brief — every sentence anchored to your bar"}
                  </div>
                </div>
                <button
                  onClick={handleSynthesizeBrief}
                  disabled={synthesizingBrief || generatingText}
                  style={{
                    padding: "8px 18px",
                    background:
                      synthesizingBrief || generatingText
                        ? "rgba(99, 102, 241, 0.15)"
                        : "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)",
                    color:
                      synthesizingBrief || generatingText ? "#6b7280" : "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor:
                      synthesizingBrief || generatingText ? "default" : "pointer",
                    fontFamily: "inherit",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    transition: "all 0.15s ease",
                    boxShadow:
                      synthesizingBrief || generatingText
                        ? "none"
                        : "0 1px 3px rgba(99, 102, 241, 0.3)",
                  }}
                >
                  {synthesizingBrief
                    ? language === "fi"
                      ? "Yhdistellään..."
                      : "Synthesizing..."
                    : language === "fi"
                      ? "Rikasta tekoälyllä"
                      : "Enrich with AI"}
                </button>
                {aiBrief && (
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#86efac",
                      fontFamily: "inherit",
                      flexShrink: 0,
                      fontWeight: 500,
                    }}
                  >
                    {language === "fi"
                      ? "Brief päivitetty"
                      : "Brief enriched"}
                  </span>
                )}
              </div>
            )}

            {/* Generate button — campaign mode */}
            {creationMode === "campaign" ? (
              <>
                <GenerateRow>
                  <FormatNote>
                    {language === "fi"
                      ? `Luo ${campaignBeats.length} postausta — teaserista seurantaan. Yhtenäinen luova linja.`
                      : `Generates ${campaignBeats.length} posts — teaser through follow-up. Unified creative direction.`}
                  </FormatNote>
                  <GenerateButton
                    onClick={handleCampaignGenerate}
                    disabled={campaignGenerating || generatingText || !campaignName.trim()}
                  >
                    {campaignGenerating ? (
                      <span
                        style={{ display: "flex", alignItems: "center", gap: 8 }}
                      >
                        <Spinner /> {GENERATING_MESSAGES[language]}
                      </span>
                    ) : language === "fi" ? (
                      "Luo kampanja"
                    ) : (
                      "Generate campaign"
                    )}
                  </GenerateButton>
                </GenerateRow>

                {/* Validation hint */}
                {!campaignName.trim() && (
                  <FieldHint style={{ marginTop: 10, color: "#f59e0b" }}>
                    {language === "fi"
                      ? "Anna kampanjalle nimi ennen generointia."
                      : "Enter a campaign name before generating."}
                  </FieldHint>
                )}

                {/* Campaign generation status */}
                {campaignGenerationStatus && (
                  <GenerationStatusBanner>
                    <Spinner />
                    {campaignGenerationStatus}
                  </GenerationStatusBanner>
                )}

                <HintRow>
                  <HintKey>{language === "fi" ? "⌘+Enter" : "⌘+Enter"}</HintKey>
                  <HintText>
                    {" "}
                    {language === "fi" ? " generoidaksesi" : " to generate"}
                  </HintText>
                </HintRow>
              </>
            ) : (
              <>
                {/* Generate button — standard / brand */}
                <GenerateRow>
                  <FormatNote>
                    {creationMode === "brand"
                      ? language === "fi"
                        ? "Luo brändisisältöä valinnoistasi — otsikko, leipäteksti ja toimintakehote. Ei hintoja."
                        : "Generates brand content from your selections — headline, body, and CTA. No prices."
                      : contentType === "event" || contentType === "pass"
                        ? language === "fi"
                          ? "Luo sisältöä valinnoistasi. Voit muokata tulosta ennen julkaisua."
                          : "Generates content from your selections. You can edit the result before publishing."
                        : language === "fi"
                          ? "Luo 3 tekstivarianttia valinnoistasi. Kuvat generoidaan erikseen."
                          : "Generates 3 text variants from your selections. Images are separate."}
                  </FormatNote>
                  <GenerateButton
                    onClick={handleGenerateText}
                    disabled={generatingText}
                  >
                    {generatingText ? (
                      <span
                        style={{ display: "flex", alignItems: "center", gap: 8 }}
                      >
                        <Spinner /> {GENERATING_MESSAGES[language]}
                      </span>
                    ) : creationMode === "brand" ? (
                      language === "fi" ? (
                        "Luo brändisisältö"
                      ) : (
                        "Generate brand content"
                      )
                    ) : contentType === "event" || contentType === "pass" ? (
                      language === "fi" ? (
                        "Luo sisältö"
                      ) : (
                        "Generate content"
                      )
                    ) : (
                      "Generate 3 options"
                    )}
                  </GenerateButton>
                </GenerateRow>
                <HintRow>
                  <HintKey>{language === "fi" ? "⌘+Enter" : "⌘+Enter"}</HintKey>
                  <HintText>
                    {" "}
                    {language === "fi" ? " generoidaksesi" : " to generate"}
                  </HintText>
                </HintRow>
              </>
            )}

            {error && <ErrorBox>{error}</ErrorBox>}
            <BackLink onClick={goBack}>
              {language === "fi" ? "← Vaihda tyyppi" : "← Change type"}
            </BackLink>
          </div>
        )}

        {/* ===== STEP 3: REFINE — Campaign Beat Timeline ===== */}
        {step === "refine" && creationMode === "campaign" && campaignResults.length > 0 && (
          <div>
            <SectionLabel>
              {language === "fi"
                ? `Kampanja: ${campaignName}`
                : `Campaign: ${campaignName}`}
            </SectionLabel>
            <FieldHint style={{ marginTop: 0, marginBottom: 16 }}>
              {language === "fi"
                ? `${campaignResults.length} postausta — jokaisella oma tehtävänsä kampanjan kaaressa`
                : `${campaignResults.length} posts — each with a defined job in the campaign arc`}
            </FieldHint>

            <CampaignTimeline>
              {campaignResults.map((beat, i) => {
                const def = BEAT_DEFS[beat.job];
                const label = language === "fi" ? def.label.fi : def.label.en;
                const objective = language === "fi" ? def.objective.fi : def.objective.en;
                const isEditing = editingCampaignBeat === i;
                const isActive = activeCampaignBeatIndex === i;
                const annotation = getHookAnnotation(beat.headline, beat.hookPattern);

                return (
                  <CampaignBeatCard
                    key={i}
                    $job={beat.job}
                    $active={isActive}
                    onClick={() => {
                      setActiveCampaignBeatIndex(i);
                      onFieldChange("title", beat.headline);
                      onFieldChange("description", beat.body);
                      onFieldChange("brandHeadline", beat.headline);
                      onFieldChange("brandBody", beat.body);
                      onFieldChange("brandCta", beat.cta);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Beat header with job label */}
                    <CampaignBeatHeader>
                      <CampaignBeatDot $job={beat.job} />
                      <CampaignBeatJobLabel $job={beat.job}>
                        {i + 1}. {label}
                      </CampaignBeatJobLabel>
                      <CampaignBeatOffset>
                        {def.dayOffset < 0
                          ? `${Math.abs(def.dayOffset)}d ${language === "fi" ? "ennen" : "before"}`
                          : def.dayOffset === 0
                            ? language === "fi" ? "tapahtumapäivä" : "event day"
                            : `+${def.dayOffset}d`}
                      </CampaignBeatOffset>
                      <CampaignBeatObjective>
                        {objective}
                      </CampaignBeatObjective>
                      {isActive && (
                        <span style={{
                          fontSize: "9px",
                          color: "#a78bfa",
                          fontWeight: 600,
                          marginLeft: "auto",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}>
                          {language === "fi" ? "Esikatselussa" : "Previewing"}
                        </span>
                      )}
                    </CampaignBeatHeader>

                    {/* Editable beat content */}
                    <CampaignBeatContent>
                      <FieldInput
                        value={beat.headline}
                        onChange={(e) => {
                          const updated = [...campaignResults];
                          updated[i] = { ...updated[i], headline: e.target.value };
                          setCampaignResults(updated);
                          if (i === activeCampaignBeatIndex) {
                            onFieldChange("title", e.target.value);
                            onFieldChange("brandHeadline", e.target.value);
                          }
                        }}
                        onFocus={() => {
                          setActiveCampaignBeatIndex(i);
                          onFieldChange("title", beat.headline);
                          onFieldChange("description", beat.body);
                          onFieldChange("brandHeadline", beat.headline);
                          onFieldChange("brandBody", beat.body);
                          onFieldChange("brandCta", beat.cta);
                        }}
                        placeholder={language === "fi" ? "Otsikko" : "Headline"}
                        $compliance={
                          complianceWarnings?.length
                            ? "warning"
                            : complianceBlocked
                              ? "error"
                              : "clean"
                        }
                      />
                      {/* Hook annotation */}
                      {annotation && (
                        <HookAnnotation>
                          <HookBadge $confidence={annotation.confidence} title={annotation.explanation}>
                            {language === "fi" ? annotation.labelFi : annotation.label}
                          </HookBadge>
                          <HookExplanation>
                            {language === "fi" ? annotation.explanationFi : annotation.explanation}
                          </HookExplanation>
                        </HookAnnotation>
                      )}
                      <FieldTextarea
                        rows={3}
                        value={beat.body}
                        onChange={(e) => {
                          const updated = [...campaignResults];
                          updated[i] = { ...updated[i], body: e.target.value };
                          setCampaignResults(updated);
                          if (i === activeCampaignBeatIndex) {
                            onFieldChange("description", e.target.value);
                            onFieldChange("brandBody", e.target.value);
                          }
                        }}
                        onFocus={() => {
                          setActiveCampaignBeatIndex(i);
                          onFieldChange("title", beat.headline);
                          onFieldChange("description", beat.body);
                          onFieldChange("brandHeadline", beat.headline);
                          onFieldChange("brandBody", beat.body);
                          onFieldChange("brandCta", beat.cta);
                        }}
                        placeholder={language === "fi" ? "Leipäteksti" : "Body text"}
                        $compliance={
                          complianceWarnings?.length
                            ? "warning"
                            : complianceBlocked
                              ? "error"
                              : "clean"
                        }
                      />
                      <FieldInput
                        value={beat.cta}
                        onChange={(e) => {
                          const updated = [...campaignResults];
                          updated[i] = { ...updated[i], cta: e.target.value };
                          setCampaignResults(updated);
                          if (i === activeCampaignBeatIndex) {
                            onFieldChange("brandCta", e.target.value);
                          }
                        }}
                        onFocus={() => {
                          setActiveCampaignBeatIndex(i);
                          onFieldChange("title", beat.headline);
                          onFieldChange("description", beat.body);
                          onFieldChange("brandHeadline", beat.headline);
                          onFieldChange("brandBody", beat.body);
                          onFieldChange("brandCta", beat.cta);
                        }}
                        placeholder={language === "fi" ? "Toimintakehotus" : "Call to action"}
                        style={{ fontSize: "0.8125rem" }}
                      />
                    </CampaignBeatContent>
                  </CampaignBeatCard>
                );
              })}
            </CampaignTimeline>

            {/* ---- Social card previews: every beat rendered as it would appear on IG/FB ---- */}
            <SocialPreviewLabel>
              {language === "fi"
                ? "Näin postaukset näyttävät somessa"
                : "How your posts will look on social media"}
            </SocialPreviewLabel>
            <SocialPreviewGrid>
              {campaignResults.map((beat, i) => {
                const imageUrl = campaignBeatImages[i] || "";
                return (
                  <SocialCard key={i} $job={beat.job}>
                    <SocialCardCover
                      $job={beat.job}
                      $hasImage={!!imageUrl}
                      style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
                    >
                      <SocialCardSponsored>
                        {language === "fi" ? "Sisältöyhteistyö" : "Sponsored Content"}
                      </SocialCardSponsored>
                      <SocialCardJobBadge $job={beat.job}>
                        {i + 1}/{campaignResults.length}
                      </SocialCardJobBadge>
                      {!imageUrl && (
                        <SocialCardPlaceholderIcon>
                          {beat.job === "teaser" ? "🔮"
                            : beat.job === "announcement" ? "📣"
                            : beat.job === "reminder" ? "🔔"
                            : beat.job === "day_of" ? "🎉"
                            : "💌"}
                        </SocialCardPlaceholderIcon>
                      )}
                    </SocialCardCover>
                    <SocialCardBody>
                      <SocialCardTitle>{beat.headline}</SocialCardTitle>
                      <SocialCardText>
                        {beat.body.length > 140
                          ? beat.body.slice(0, 137) + "..."
                          : beat.body}
                      </SocialCardText>
                      <SocialCardCta>
                        {beat.cta} <span style={{ fontWeight: 400 }}>→</span>
                      </SocialCardCta>
                    </SocialCardBody>
                  </SocialCard>
                );
              })}
            </SocialPreviewGrid>

            <ButtonRow style={{ marginTop: 24 }}>
              <ButtonSecondary onClick={() => setStep("brief")}>
                ← {language === "fi" ? "Takaisin" : "Back"}
              </ButtonSecondary>
              <ButtonPrimary
                onClick={() => {
                  // Collect all campaign beats into a single payload for submission
                  const campaignPayload: Record<string, unknown> = {
                    campaignName,
                    mode: "campaign",
                    beats: campaignResults.map((b) => ({
                      job: b.job,
                      headline: b.headline,
                      body: b.body,
                      cta: b.cta,
                      hookPattern: b.hookPattern,
                      imagePrompt: b.imagePrompt,
                    })),
                  };
                  onGenerated(campaignPayload);
                  setStep("images");
                }}
              >
                {language === "fi" ? "Jatka kuviin" : "Continue to Images"} →
              </ButtonPrimary>
            </ButtonRow>
          </div>
        )}

        {/* ===== STEP 3: REFINE (Review & Edit Text) — Standard ===== */}
        {step === "refine" && creationMode !== "campaign" && variants.length > 0 && (
          <div>
            <BriefRecap>
              <BriefLabel>{language === "fi" ? "Brief:" : "Brief:"}</BriefLabel>{" "}
              {text.length > 120 ? text.slice(0, 117) + "…" : text}
              {creationMode === "brand" && brandImageWorld && (
                <>
                  {" · "}
                  <BriefLabel>
                    {CREATIVE_IMAGE_WORLD_LABELS[
                      brandImageWorld as ImageWorldChip
                    ]?.[language] ?? brandImageWorld}
                  </BriefLabel>
                  {brandCoreMessage && (
                    <>
                      {" · "}
                      {CORE_MESSAGE_LABELS[
                        brandCoreMessage as CoreMessageChip
                      ]?.[language] ?? brandCoreMessage}
                    </>
                  )}
                </>
              )}
            </BriefRecap>

            <RefineGrid>
              {variants.map((v, i) => (
                <VariantCard key={i}>
                  <VariantCardHeader>
                    <VariantNumber>
                      {language === "fi" ? "Vaihtoehto" : "Option"} {i + 1}
                    </VariantNumber>
                    {v.strategy && STRATEGY_LABELS[v.strategy] && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          color: STRATEGY_LABELS[v.strategy].color,
                          background: `${STRATEGY_LABELS[v.strategy].color}18`,
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontFamily: "inherit",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          flexShrink: 0,
                        }}
                      >
                        {STRATEGY_LABELS[v.strategy][language]}
                      </span>
                    )}
                    {variants.length > 1 && (
                      <DeleteButton
                        onClick={() => deleteVariant(i)}
                        title={
                          language === "fi"
                            ? "Poista tämä variantti"
                            : "Remove this variant"
                        }
                      >
                        {language === "fi" ? "Poista" : "Delete"}
                      </DeleteButton>
                    )}
                  </VariantCardHeader>

                  <FieldGroup>
                    <FieldLabel>
                      {creationMode === "brand"
                        ? language === "fi"
                          ? "Otsikko"
                          : "Headline"
                        : language === "fi"
                          ? "Otsikko"
                          : "Title"}
                    </FieldLabel>
                    <FieldInput
                      value={v.title}
                      onChange={(e) =>
                        updateVariant(i, "title", e.target.value)
                      }
                      placeholder={
                        creationMode === "brand"
                          ? language === "fi"
                            ? "Brändiotsikko"
                            : "Brand headline"
                          : contentType === "event"
                            ? language === "fi"
                              ? "Tapahtuman nimi"
                              : "Event title"
                            : contentType === "pass"
                              ? language === "fi"
                                ? "Passin nimi"
                                : "Pass title"
                              : language === "fi"
                                ? "Tarjouksen otsikko"
                                : "Promotion title"
                      }
                    />
                    {/* Hook pattern teaching annotation — real-time classification */}
                    {(() => {
                      const annotation = getHookAnnotation(v.title, v.hookPattern);
                      if (!annotation) return null;
                      const isFi = language === "fi";
                      return (
                        <HookAnnotation>
                          <HookBadge
                            $confidence={annotation.confidence}
                            title={
                              annotation.confidence === "ai"
                                ? (isFi ? "AI:n merkitsemä" : "Labeled by AI")
                                : annotation.confidence === "classified"
                                  ? (isFi ? "Tunnistettu otsikosta" : "Detected from headline")
                                  : (isFi ? "Epävarma luokitus" : "Uncertain classification")
                            }
                          >
                            {isFi ? annotation.labelFi : annotation.label}
                          </HookBadge>
                          <HookExplanation>
                            {isFi ? annotation.explanationFi : annotation.explanation}
                          </HookExplanation>
                        </HookAnnotation>
                      );
                    })()}
                  </FieldGroup>

                  <FieldGroup>
                    <FieldLabel>
                      {creationMode === "brand"
                        ? language === "fi"
                          ? "Leipäteksti"
                          : "Body"
                        : language === "fi"
                          ? "Kuvaus"
                          : "Description"}
                    </FieldLabel>
                    <FieldTextarea
                      value={v.description}
                      onChange={(e) =>
                        updateVariant(i, "description", e.target.value)
                      }
                      placeholder={
                        creationMode === "brand"
                          ? language === "fi"
                            ? "Leipäteksti"
                            : "Body copy"
                          : language === "fi"
                            ? "Kuvaus"
                            : "Description"
                      }
                      rows={2}
                    />
                  </FieldGroup>

                  {/* Platform-aware validation — character limits + readability */}
                  {(() => {
                    const pv = validatePlatform(v.title, v.description, v.callToAction);
                    const warnings = getPlatformWarnings(pv);
                    const titleLen = v.title.length;
                    const descLen = v.description.length;
                    const ctaLen = v.callToAction.length;

                    return (
                      <PlatformCheckRow>
                        {/* Character counts — with AI rephrase buttons on over-limit fields */}
                        <PlatformCounts>
                          <CharCount $over={titleLen > 40}>
                            <span>T</span> {titleLen}<CharUnit>/40</CharUnit>
                            {titleLen > 40 && (
                              <RephraseButton
                                onClick={(e) => { e.stopPropagation(); handleRephraseField(i, "title", 40); }}
                                disabled={rephrasingField === `${i}-title`}
                              >
                                {rephrasingField === `${i}-title` ? "…" : "AI"}
                              </RephraseButton>
                            )}
                          </CharCount>
                          <CharCount $over={descLen > 120}>
                            <span>D</span> {descLen}<CharUnit>/120</CharUnit>
                            {descLen > 120 && (
                              <RephraseButton
                                onClick={(e) => { e.stopPropagation(); handleRephraseField(i, "description", 120); }}
                                disabled={rephrasingField === `${i}-description`}
                              >
                                {rephrasingField === `${i}-description` ? "…" : "AI"}
                              </RephraseButton>
                            )}
                          </CharCount>
                          <CharCount $over={ctaLen > 25}>
                            <span>C</span> {ctaLen}<CharUnit>/25</CharUnit>
                            {ctaLen > 25 && (
                              <RephraseButton
                                onClick={(e) => { e.stopPropagation(); handleRephraseField(i, "cta", 25); }}
                                disabled={rephrasingField === `${i}-cta`}
                              >
                                {rephrasingField === `${i}-cta` ? "…" : "AI"}
                              </RephraseButton>
                            )}
                          </CharCount>
                        </PlatformCounts>

                        {/* Platform fit chips + readability in one row */}
                        <PlatformMetaRow>
                          <PlatformChips>
                            {PLATFORM_LIMITS.filter((l) =>
                              ["instagram-card-title", "instagram-caption", "push-ios", "email-subject"].includes(l.id),
                            ).map((limit) => {
                              const check = pv.checks.find((c) => c.platform.id === limit.id);
                              if (!check) return null;
                              const color = getLimitStatusColor(check.status);
                              const compact = limit.id === "instagram-card-title" ? "IG"
                                : limit.id === "instagram-caption" ? "CAP"
                                : limit.id === "push-ios" ? "PUSH"
                                : "MAIL";
                              return (
                                <PlatformChip key={limit.id} $color={color} $active={check.status !== "ok"}>
                                  <PlatformDot $color={color} />
                                  {compact}
                                </PlatformChip>
                              );
                            })}
                          </PlatformChips>

                          {/* Readability badge */}
                          {pv.readability && (
                            <ReadabilityBadge
                              $color={getReadabilityColor(pv.readability)}
                              title={`Flesch Reading Ease: ${pv.readability.fleschReadingEase} — Grade ${pv.readability.gradeLevel}`}
                            >
                              {pv.readability.label}
                            </ReadabilityBadge>
                          )}
                        </PlatformMetaRow>

                        {/* Warning tooltips */}
                        {warnings.length > 0 && (
                          <PlatformWarnings>
                            {warnings.slice(0, 2).map((w, wi) => {
                              const fmt = formatPlatformWarning(w);
                              return (
                                <PlatformWarningItem key={wi} $status={w.status}>
                                  {fmt.label}: {fmt.message}
                                </PlatformWarningItem>
                              );
                            })}
                            {warnings.length > 2 && (
                              <PlatformWarningItem $status="soft">
                                +{warnings.length - 2} more platform warnings
                              </PlatformWarningItem>
                            )}
                          </PlatformWarnings>
                        )}
                      </PlatformCheckRow>
                    );
                  })()}

                  <FieldRow>
                    <FieldGroup style={{ flex: 1 }}>
                      <FieldLabel>CTA</FieldLabel>
                      <FieldInput
                        value={v.callToAction}
                        onChange={(e) =>
                          updateVariant(i, "callToAction", e.target.value)
                        }
                        placeholder={
                          creationMode === "brand"
                            ? language === "fi"
                              ? "Toimintakehote"
                              : "Call to action"
                            : contentType === "event"
                              ? "Get Tickets"
                              : contentType === "pass"
                                ? "Buy Pass"
                                : "View Offer"
                        }
                      />
                      {/* CTA Options — clickable chips from AI */}
                      {v.ctaOptions && v.ctaOptions.length > 0 && (
                        <div style={{ display: "flex", gap: "0.375rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                          {v.ctaOptions.map((opt, oi) => (
                            <button
                              key={oi}
                              type="button"
                              onClick={() => updateVariant(i, "callToAction", opt)}
                              style={{
                                fontSize: "0.6875rem",
                                padding: "3px 10px",
                                borderRadius: "12px",
                                border: v.callToAction === opt
                                  ? "1px solid #7c3aed"
                                  : "1px solid #333",
                                background: v.callToAction === opt
                                  ? "rgba(124, 58, 237, 0.15)"
                                  : "transparent",
                                color: v.callToAction === opt ? "#a78bfa" : "#6b7280",
                                cursor: "pointer",
                                fontWeight: v.callToAction === opt ? 600 : 400,
                                transition: "all 0.15s",
                              }}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                    </FieldGroup>
                    {/* Conditions field — hidden in brand mode (no pricing/terms) */}
                    {creationMode !== "brand" && (
                      <FieldGroup style={{ flex: 1 }}>
                        <FieldLabel>
                          {language === "fi" ? "Ehdot" : "Conditions"}
                        </FieldLabel>
                        <FieldInput
                          value={v.conditions}
                          onChange={(e) =>
                            updateVariant(i, "conditions", e.target.value)
                          }
                          placeholder={
                            language === "fi" ? "Ehdot" : "Conditions"
                          }
                        />
                      </FieldGroup>
                    )}
                  </FieldRow>

                  {/* Image mood — quick customization for backgrounds & atmosphere */}
                  <FieldRow style={{ marginTop: "6px" }}>
                    <FieldLabel>
                      {language === "fi"
                        ? "Kuvan tunnelma / teema"
                        : "Image mood / theme"}
                    </FieldLabel>
                    <FieldInput
                      value={v.imageMood || ""}
                      onChange={(e) =>
                        updateVariant(i, "imageMood", e.target.value)
                      }
                      placeholder={
                        language === "fi"
                          ? "esim. joulutunnelma, kesäterassi, kultainen hetki, ranta..."
                          : "e.g. Christmas party, summer beach, golden hour, candlelit..."
                      }
                    />
                    <span style={{
                      fontSize: "10px",
                      color: "#6b7280",
                      fontFamily: "inherit",
                      marginTop: "2px",
                    }}>
                      {language === "fi"
                        ? "Lisää vuodenaika, tunnelma tai teema kuvagenerointiin. Yhdistetään Flux-promptiin automaattisesti."
                        : "Add a season, mood, or theme to the image. Automatically blended into the Flux prompt."}
                    </span>
                  </FieldRow>

                  {/* Flux prompt editor — collapsible */}
                  <FluxSection>
                    <FluxToggle
                      onClick={() => {
                        const el = document.getElementById(`flux-editor-${i}`);
                        if (el)
                          el.style.display =
                            el.style.display === "none" ? "block" : "none";
                      }}
                    >
                      <FluxToggleLabel>
                        {language === "fi"
                          ? "Muokkaa kuvapromptia"
                          : "Edit image prompt"}
                      </FluxToggleLabel>
                      <FluxToggleHint>
                        {language === "fi" ? "(Flux)" : "(Flux)"}
                      </FluxToggleHint>
                    </FluxToggle>
                    <FluxEditor id={`flux-editor-${i}`}>
                      <FluxEditorHint>
                        {language === "fi"
                          ? "Tämä prompt lähetetään Flux-kuvageneraattorille. Muokkaa sitä suoraan — kuvaile mitä kuvassa pitäisi näkyä."
                          : "This prompt is sent to the Flux image generator. Edit it directly — describe what should appear in the image."}
                      </FluxEditorHint>
                      <FieldTextarea
                        value={v.fluxPrompt}
                        onChange={(e) =>
                          updateVariant(i, "fluxPrompt", e.target.value)
                        }
                        rows={6}
                        placeholder={
                          language === "fi"
                            ? "Flux-prompt..."
                            : "Flux prompt..."
                        }
                      />
                    </FluxEditor>
                  </FluxSection>

                  {/* Inline compliance violations per variant */}
                  {variantViolations[i] && variantViolations[i].length > 0 && (
                    <ViolationList>
                      {variantViolations[i].map((v, vi) => (
                        <ViolationItem key={vi} $severity={v.severity}>
                          <ViolationBadge $severity={v.severity}>
                            {v.severity === "high"
                              ? "BLOCKED"
                              : v.severity === "medium"
                                ? "WARNING"
                                : "ADVISORY"}
                          </ViolationBadge>
                          <ViolationText>
                            <strong>"{v.keyword}"</strong> — {v.message}
                            {v.suggestion && (
                              <ViolationSuggestion>
                                {language === "fi"
                                  ? "Korjausehdotus"
                                  : "Suggestion"}
                                : {v.suggestion}
                              </ViolationSuggestion>
                            )}
                          </ViolationText>
                        </ViolationItem>
                      ))}
                      <FixVariantButton
                        onClick={() => handleFixVariant(i)}
                        disabled={fixingVariant === i}
                      >
                        {fixingVariant === i
                          ? language === "fi"
                            ? "Korjataan..."
                            : "Fixing..."
                          : language === "fi"
                            ? "Korjaa automaattisesti"
                            : "Fix automatically"}
                      </FixVariantButton>
                    </ViolationList>
                  )}

                  {/* ---- Iterative refinement bar ---- */}
                  <RefineBar>
                    {refiningVariant === i ? (
                      <RefineChipRow>
                        <RefineSpinner />
                        <span style={{ fontSize: "0.625rem", color: "#71717a" }}>
                          {language === "fi" ? "Muokataan..." : "Refining..."}
                        </span>
                      </RefineChipRow>
                    ) : (
                      <>
                        <RefineLabel>
                          {language === "fi" ? "Pikamuokkaus" : "Quick refine"}
                        </RefineLabel>
                        <RefineChipRow>
                          <RefineChip
                            onClick={() => handleRefine(i, language === "fi" ? "Lyhyempi" : "Shorter")}
                            disabled={refiningVariant !== null}
                          >
                            {language === "fi" ? "Lyhyempi" : "Shorter"}
                          </RefineChip>
                          <RefineChip
                            onClick={() => handleRefine(i, language === "fi" ? "Rohkeampi" : "Bolder")}
                            disabled={refiningVariant !== null}
                          >
                            {language === "fi" ? "Rohkeampi" : "Bolder"}
                          </RefineChip>
                          <RefineChip
                            onClick={() => handleRefine(i, language === "fi" ? "Eri koukku" : "Different hook")}
                            disabled={refiningVariant !== null}
                          >
                            {language === "fi" ? "Eri koukku" : "Different hook"}
                          </RefineChip>
                          <RefineChip
                            onClick={() => handleRefine(i, language === "fi" ? "Lisää kiirettä" : "More urgency")}
                            disabled={refiningVariant !== null}
                          >
                            {language === "fi" ? "Lisää kiirettä" : "More urgency"}
                          </RefineChip>
                          <RefineChip
                            onClick={() => handleRefine(i, language === "fi" ? "Yksinkertaisempi" : "Simpler")}
                            disabled={refiningVariant !== null}
                          >
                            {language === "fi" ? "Yksinkertaisempi" : "Simpler"}
                          </RefineChip>
                          <RefineChip
                            onClick={() => handleRefine(i, language === "fi" ? "Leikkisämpi" : "More playful")}
                            disabled={refiningVariant !== null}
                          >
                            {language === "fi" ? "Leikkisämpi" : "More playful"}
                          </RefineChip>
                        </RefineChipRow>
                        <RefineInputRow>
                          <RefineInput
                            value={refineInputs[i] || ""}
                            onChange={(e) =>
                              setRefineInputs((prev) => ({
                                ...prev,
                                [i]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && refineInputs[i]?.trim()) {
                                handleRefine(i, refineInputs[i].trim());
                              }
                            }}
                            placeholder={
                              language === "fi"
                                ? "Kirjoita oma muokkaus... (esim. \"tee tästä ylellisempi\")"
                                : "Type a custom edit... (e.g. \"make it sound premium\")"
                            }
                            disabled={refiningVariant !== null}
                          />
                          <RefineSubmit
                            onClick={() => {
                              if (refineInputs[i]?.trim()) {
                                handleRefine(i, refineInputs[i].trim());
                              }
                            }}
                            disabled={refiningVariant !== null || !refineInputs[i]?.trim()}
                          >
                            {language === "fi" ? "Muokkaa" : "Refine"}
                          </RefineSubmit>
                        </RefineInputRow>
                      </>
                    )}
                  </RefineBar>
                </VariantCard>
              ))}
            </RefineGrid>

            {error && <ErrorBox>{error}</ErrorBox>}

            {usingFallback && (
              <FallbackWarningBox>
                {language === "fi"
                  ? "Luontipalvelu ei ole käytettävissä — näytetään valmiit mallipohjat. Yritä myöhemmin uudelleen."
                  : "Generation service is unavailable — showing template-based options instead. Please try again later."}
              </FallbackWarningBox>
            )}

            {complianceWarnings && complianceWarnings.length > 0 && (
              <ComplianceWarningBox>
                <ComplianceWarningTitle>
                  {language === "fi"
                    ? "Huomioita sisällöstä:"
                    : "Compliance notes:"}
                </ComplianceWarningTitle>
                {complianceWarnings.map((w, i) => (
                  <ComplianceWarningItem key={i}>{w}</ComplianceWarningItem>
                ))}
              </ComplianceWarningBox>
            )}

            <GenerateRow>
              <FormatNote>
                {language === "fi"
                  ? `${variants.length} varianttia — kuvat generoidaan jokaiselle erikseen.`
                  : `${variants.length} variants — images will be generated for each.`}
              </FormatNote>
              <GenerateButton
                onClick={handleGenerateImages}
                disabled={generatingImages || variants.length === 0}
              >
                {generatingImages ? (
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Spinner /> {GENERATING_IMAGES_MSG[language]}
                  </span>
                ) : (
                  "Generate Images"
                )}
              </GenerateButton>
            </GenerateRow>

            <BackLink onClick={goBack}>
              {language === "fi" ? "← Takaisin briefiin" : "← Back to brief"}
            </BackLink>
          </div>
        )}

        {/* ===== STEP 4: IMAGES ===== */}
        {step === "images" && variants.length > 0 && (
          <div>
            <ImageGrid>
              {variants.map((v, i) => (
                <ImageCard key={i}>
                  <ImageCardBadge>
                    {language === "fi" ? "Vaihtoehto" : "Option"} {i + 1}
                  </ImageCardBadge>

                  {/* Image or placeholder */}
                  <ImagePreview>
                    {variantImagesLoading[i] ? (
                      <ImageLoading>
                        <Spinner />
                        <span>
                          {language === "fi" ? "Luodaan..." : "Generating..."}
                        </span>
                      </ImageLoading>
                    ) : variantImages[i] ? (
                      <CardImage src={variantImages[i]} alt={v.title} />
                    ) : (
                      <ImagePlaceholder>
                        {language === "fi" ? "Ei kuvaa" : "No image"}
                      </ImagePlaceholder>
                    )}
                  </ImagePreview>

                  {/* Variant text summary */}
                  <ImageCardTitle>{v.title}</ImageCardTitle>
                  <ImageCardDesc>{v.description}</ImageCardDesc>

                  {/* Layout selector */}
                  <LayoutLabel>
                    {language === "fi" ? "Asettelu" : "Layout"}
                  </LayoutLabel>
                  <LayoutRow>
                    {LAYOUT_HINTS.map((layout) => (
                      <LayoutChip
                        key={layout.template}
                        $active={variantLayouts[i] === layout.template}
                        onClick={() => {
                          setVariantLayouts((prev) => {
                            const next = [...prev];
                            next[i] = layout.template;
                            return next;
                          });
                        }}
                      >
                        {layout.label}
                      </LayoutChip>
                    ))}
                  </LayoutRow>

                  {/* Subject selector (brand mode — changes based on image world) */}
                  {creationMode === "brand" &&
                    availableBrandSubjects.length > 0 && (
                      <>
                        <SubjectLabel>
                          {language === "fi" ? "Aihe" : "Subject"}
                        </SubjectLabel>
                        <SubjectRow>
                          {availableBrandSubjects.map((subjectId) => (
                            <SubjectChip
                              key={subjectId}
                              $active={variantSubjects[i] === subjectId}
                              onClick={() => {
                                // Update state
                                setVariantSubjects((prev) => {
                                  const next = [...prev];
                                  next[i] = subjectId;
                                  return next;
                                });
                                // Regenerate with new subject
                                handleRegenerateImage(i, subjectId);
                              }}
                            >
                              {subjectLabelMap[subjectId] || subjectId}
                            </SubjectChip>
                          ))}
                        </SubjectRow>
                      </>
                    )}

                  {/* Actions */}
                  <ImageActionsRow>
                    <ImageActionBtn
                      onClick={() => handleRegenerateImage(i)}
                      disabled={variantImagesLoading[i]}
                    >
                      {language === "fi" ? "↻ Arvo uusi" : "↻ Regenerate"}
                    </ImageActionBtn>

                    <FluxToggleSmall
                      onClick={() => {
                        const el = document.getElementById(
                          `flux-img-editor-${i}`,
                        );
                        if (el)
                          el.style.display =
                            el.style.display === "none" ? "block" : "none";
                      }}
                    >
                      {language === "fi" ? "Muokkaa promptia" : "Edit prompt"}
                    </FluxToggleSmall>
                  </ImageActionsRow>

                  {/* Hidden Flux prompt editor */}
                  <FluxImgEditor
                    id={`flux-img-editor-${i}`}
                    style={{ display: "none" }}
                  >
                    <FieldTextarea
                      value={v.fluxPrompt}
                      onChange={(e) =>
                        updateVariant(i, "fluxPrompt", e.target.value)
                      }
                      rows={2}
                      placeholder={
                        language === "fi" ? "Flux-prompt..." : "Flux prompt..."
                      }
                    />
                    <ImageActionBtn
                      onClick={() => handleRegenerateImage(i)}
                      disabled={variantImagesLoading[i]}
                      style={{ marginTop: 6 }}
                    >
                      {language === "fi"
                        ? "Generoi uudelleen"
                        : "Regenerate with new prompt"}
                    </ImageActionBtn>
                  </FluxImgEditor>

                  {/* Upload alternative */}
                  <ImageUploadWrapper>
                    <ImageUploader
                      value={variantImages[i] || ""}
                      onChange={(url) => {
                        const images = [...variantImages];
                        images[i] = url;
                        setVariantImages(images);
                      }}
                      contentType={contentType}
                      barId={barId}
                      dark
                    />
                  </ImageUploadWrapper>

                  {/* Select button */}
                  <SelectVariantBtn onClick={() => handleSelectVariant(i)}>
                    {language === "fi" ? "Valitse tämä" : "Use this one"}
                  </SelectVariantBtn>
                </ImageCard>
              ))}
            </ImageGrid>

            {error && <ErrorBox>{error}</ErrorBox>}

            <BackLink onClick={goBack}>
              {language === "fi" ? "← Takaisin muokkaukseen" : "← Back to edit"}
            </BackLink>
          </div>
        )}

        {/* ===== STEP 4: IMAGES — Campaign mode ===== */}
        {step === "images" && creationMode === "campaign" && campaignResults.length > 0 && (
          <div>
            <SectionLabel>
              {language === "fi"
                ? `Kuvat kampanjaan: ${campaignName}`
                : `Images for: ${campaignName}`}
            </SectionLabel>
            <FieldHint style={{ marginTop: 0, marginBottom: 14 }}>
              {language === "fi"
                ? "Luo kuvat jokaiselle postaukselle tai lataa omasi. AI käyttää jokaisen postauksen omaa kuvapromptia."
                : "Generate images for each post or upload your own. AI uses each post's own image prompt."}
            </FieldHint>

            {/* Generate all */}
            <GenerateRow>
              <GenerateButton
                onClick={handleCampaignAllImages}
                disabled={campaignBeatImagesLoading.some(Boolean)}
              >
                {campaignBeatImagesLoading.some(Boolean) ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Spinner /> {GENERATING_MESSAGES[language]}
                  </span>
                ) : language === "fi" ? (
                  "Luo kaikki kuvat"
                ) : (
                  "Generate all images"
                )}
              </GenerateButton>
            </GenerateRow>

            <ImageGrid>
              {campaignResults.map((beat, i) => {
                const def = BEAT_DEFS[beat.job];
                const jobLabel = language === "fi" ? def.label.fi : def.label.en;

                return (
                  <ImageCard key={i}>
                    <ImageCardBadge
                      style={{
                        background: `${CAMPAIGN_JOB_COLORS[beat.job]}22`,
                        color: CAMPAIGN_JOB_COLORS[beat.job],
                        border: `1px solid ${CAMPAIGN_JOB_COLORS[beat.job]}33`,
                      }}
                    >
                      {i + 1}. {jobLabel}
                    </ImageCardBadge>

                    {/* Image or placeholder */}
                    <ImagePreview>
                      {campaignBeatImagesLoading[i] ? (
                        <ImageLoading>
                          <Spinner />
                          <span>
                            {language === "fi" ? "Luodaan..." : "Generating..."}
                          </span>
                        </ImageLoading>
                      ) : campaignBeatImages[i] ? (
                        <CardImage
                          src={campaignBeatImages[i]}
                          alt={beat.headline}
                        />
                      ) : (
                        <ImagePlaceholder>
                          {language === "fi" ? "Ei kuvaa" : "No image"}
                        </ImagePlaceholder>
                      )}
                    </ImagePreview>

                    {/* Beat summary */}
                    <ImageCardTitle>{beat.headline}</ImageCardTitle>
                    <ImageCardDesc>
                      {beat.body.length > 80
                        ? beat.body.slice(0, 77) + "…"
                        : beat.body}
                    </ImageCardDesc>

                    {/* Image prompt */}
                    <FluxToggleSmall
                      onClick={() => {
                        const el = document.getElementById(
                          `campaign-flux-editor-${i}`,
                        );
                        if (el)
                          el.style.display =
                            el.style.display === "none" ? "block" : "none";
                      }}
                    >
                      {language === "fi"
                        ? "Muokkaa kuvapromptia"
                        : "Edit image prompt"}
                    </FluxToggleSmall>

                    <FluxImgEditor
                      id={`campaign-flux-editor-${i}`}
                      style={{ display: "none" }}
                    >
                      <FieldTextarea
                        value={beat.imagePrompt}
                        onChange={(e) => {
                          const updated = [...campaignResults];
                          updated[i] = {
                            ...updated[i],
                            imagePrompt: e.target.value,
                          };
                          setCampaignResults(updated);
                        }}
                        rows={2}
                        placeholder={
                          language === "fi"
                            ? "Kuvaprompt..."
                            : "Image prompt..."
                        }
                      />
                    </FluxImgEditor>

                    {/* Actions */}
                    <ImageActionsRow>
                      <ImageActionBtn
                        onClick={() => handleCampaignImageGenerate(i)}
                        disabled={campaignBeatImagesLoading[i]}
                      >
                        {campaignBeatImages[i]
                          ? language === "fi"
                            ? "↻ Arvo uusi"
                            : "↻ Regenerate"
                          : language === "fi"
                            ? "Luo kuva"
                            : "Generate image"}
                      </ImageActionBtn>
                    </ImageActionsRow>

                    {/* Upload alternative */}
                    <ImageUploadWrapper>
                      <ImageUploader
                        value={campaignBeatImages[i] || ""}
                        onChange={(url) => {
                          setCampaignBeatImages((prev) => {
                            const next = [...prev];
                            next[i] = url || "";
                            return next;
                          });
                          // Sync to formState for live preview
                          if (i === activeCampaignBeatIndex) {
                            onFieldChange("imageUrl", url || "");
                          }
                        }}
                        contentType="campaign"
                        barId={barId}
                        dark
                      />
                    </ImageUploadWrapper>
                  </ImageCard>
                );
              })}
            </ImageGrid>

            {/* Social card previews with generated images */}
            {campaignBeatImages.some((url) => !!url) && (
              <>
                <SocialPreviewLabel>
                  {language === "fi"
                    ? "Näin postaukset näyttävät somessa"
                    : "How your posts will look on social media"}
                </SocialPreviewLabel>
                <SocialPreviewGrid>
                  {campaignResults.map((beat, i) => {
                    const imageUrl = campaignBeatImages[i] || "";
                    return (
                      <SocialCard key={i} $job={beat.job}>
                        <SocialCardCover
                          $job={beat.job}
                          $hasImage={!!imageUrl}
                          style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
                        >
                          <SocialCardSponsored>
                            {language === "fi" ? "Sisältöyhteistyö" : "Sponsored Content"}
                          </SocialCardSponsored>
                          <SocialCardJobBadge $job={beat.job}>
                            {i + 1}/{campaignResults.length}
                          </SocialCardJobBadge>
                          {!imageUrl && (
                            <SocialCardPlaceholderIcon>
                              {beat.job === "teaser" ? "🔮"
                                : beat.job === "announcement" ? "📣"
                                : beat.job === "reminder" ? "🔔"
                                : beat.job === "day_of" ? "🎉"
                                : "💌"}
                            </SocialCardPlaceholderIcon>
                          )}
                        </SocialCardCover>
                        <SocialCardBody>
                          <SocialCardTitle>{beat.headline}</SocialCardTitle>
                          <SocialCardText>
                            {beat.body.length > 140
                              ? beat.body.slice(0, 137) + "..."
                              : beat.body}
                          </SocialCardText>
                          <SocialCardCta>
                            {beat.cta} <span style={{ fontWeight: 400 }}>→</span>
                          </SocialCardCta>
                        </SocialCardBody>
                      </SocialCard>
                    );
                  })}
                </SocialPreviewGrid>
              </>
            )}

            {error && <ErrorBox>{error}</ErrorBox>}

            <ButtonRow style={{ marginTop: 24 }}>
              <ButtonSecondary onClick={() => setStep("refine")}>
                ← {language === "fi" ? "Takaisin" : "Back"}
              </ButtonSecondary>
              <ButtonPrimary
                onClick={() => {
                  // Collect all campaign data into submission payload
                  const campaignPayload: Record<string, unknown> = {
                    campaignName,
                    mode: "campaign",
                    beats: campaignResults.map((b, idx) => ({
                      job: b.job,
                      headline: b.headline,
                      body: b.body,
                      cta: b.cta,
                      hookPattern: b.hookPattern,
                      imagePrompt: b.imagePrompt,
                      imageUrl: campaignBeatImages[idx] || "",
                    })),
                  };
                  onGenerated(campaignPayload);
                  setStep("schedule");
                }}
              >
                {language === "fi" ? "Jatka aikatauluun" : "Continue to Schedule"} →
              </ButtonPrimary>
            </ButtonRow>
          </div>
        )}

        {/* ===== STEP 5: SCHEDULE ===== */}
        {step === "schedule" && (
          <ScheduleStep
            contentType={contentType}
            formState={formState}
            barId={barId}
            barName={barName}
            onFieldChange={onFieldChange}
            onBack={goBack}
            onContinue={() => setStep("publish")}
          />
        )}

        {/* ===== STEP 6: PUBLISH ===== */}
        {step === "publish" && (
          <ReviewSection>
            <FieldGroup>
              <FieldLabel>Title</FieldLabel>
              <FieldInput
                value={formState.title}
                onChange={(e) => onFieldChange("title", e.target.value)}
                placeholder="Promotion title"
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel>Description</FieldLabel>
              <FieldTextarea
                value={formState.description}
                onChange={(e) => onFieldChange("description", e.target.value)}
                placeholder="Description"
                rows={3}
              />
            </FieldGroup>

            {/* Brand mode: CTA field + dates + generated image */}
            {contentType === "brand" && (
              <>
                <FieldRow>
                  <FieldGroup style={{ flex: 1 }}>
                    <FieldLabel>
                      {language === "fi" ? "Alkamispäivä" : "Start Date"}
                    </FieldLabel>
                    <FieldInput
                      type="date"
                      value={formState.startDate}
                      onChange={(e) => onFieldChange("startDate", e.target.value)}
                    />
                  </FieldGroup>
                  <FieldGroup style={{ flex: 1 }}>
                    <FieldLabel>
                      {language === "fi" ? "Päättymispäivä" : "End Date"}
                    </FieldLabel>
                    <FieldInput
                      type="date"
                      value={formState.endDate}
                      onChange={(e) => onFieldChange("endDate", e.target.value)}
                    />
                  </FieldGroup>
                </FieldRow>
                <FieldGroup>
                  <FieldLabel>
                    {language === "fi" ? "Toimintakehote (CTA)" : "Call to Action"}
                  </FieldLabel>
                  <FieldInput
                    value={formState.brandCta}
                    onChange={(e) => onFieldChange("brandCta", e.target.value)}
                    placeholder={
                      language === "fi"
                        ? "esim. Lava on auki joka ilta."
                        : "e.g. The stage is open every night."
                    }
                  />
                </FieldGroup>
                <ImageUploader
                  value={formState.imageUrl}
                  onChange={(url) => onFieldChange("imageUrl", url)}
                  contentType={contentType}
                  barId={barId}
                  dark
                />
              </>
            )}

            {contentType !== "brand" && contentType === "promotion" && (
              <>
                <FieldRow>
                  <FieldGroup style={{ flex: 1 }}>
                    <FieldLabel>Type</FieldLabel>
                    <SelectField
                      value={formState.promotionType}
                      onChange={(e) =>
                        onFieldChange("promotionType", e.target.value)
                      }
                    >
                      {PROMOTION_TYPES.map((pt) => (
                        <option key={pt.value} value={pt.value}>
                          {pt.label}
                        </option>
                      ))}
                    </SelectField>
                  </FieldGroup>
                  <FieldGroup style={{ flex: 1 }}>
                    <FieldLabel>Discount (%)</FieldLabel>
                    <FieldInput
                      type="number"
                      value={formState.discountValue ?? ""}
                      onChange={(e) =>
                        onFieldChange(
                          "discountValue",
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                      placeholder="e.g. 20"
                    />
                  </FieldGroup>
                </FieldRow>
                <FieldRow>
                  <FieldGroup style={{ flex: 1 }}>
                    <FieldLabel>Start date</FieldLabel>
                    <FieldInput
                      type="date"
                      value={formState.startDate?.slice(0, 10) || ""}
                      onChange={(e) =>
                        onFieldChange("startDate", e.target.value)
                      }
                    />
                  </FieldGroup>
                  <FieldGroup style={{ flex: 1 }}>
                    <FieldLabel>End date</FieldLabel>
                    <FieldInput
                      type="date"
                      value={formState.endDate?.slice(0, 10) || ""}
                      onChange={(e) => onFieldChange("endDate", e.target.value)}
                    />
                  </FieldGroup>
                </FieldRow>
                <FieldGroup>
                  <FieldLabel>Conditions / fine print</FieldLabel>
                  <FieldInput
                    value={formState.conditions}
                    onChange={(e) =>
                      onFieldChange("conditions", e.target.value)
                    }
                    placeholder="e.g. Valid on Fridays 16:00–19:00"
                  />
                </FieldGroup>
                <CheckboxRow>
                  <input
                    type="checkbox"
                    checked={formState.createMatchingEvent}
                    onChange={(e) =>
                      onFieldChange("createMatchingEvent", e.target.checked)
                    }
                    id="createMatchingEvent"
                  />
                  <CheckboxLabel htmlFor="createMatchingEvent">
                    Also create a matching event
                  </CheckboxLabel>
                </CheckboxRow>
              </>
            )}

            {contentType === "event" && (
              <>
                <FieldRow>
                  <FieldGroup style={{ flex: 1 }}>
                    <FieldLabel>Start time</FieldLabel>
                    <FieldInput
                      type="datetime-local"
                      value={formState.startTime?.slice(0, 16) || ""}
                      onChange={(e) =>
                        onFieldChange("startTime", e.target.value)
                      }
                    />
                  </FieldGroup>
                  <FieldGroup style={{ flex: 1 }}>
                    <FieldLabel>End time</FieldLabel>
                    <FieldInput
                      type="datetime-local"
                      value={formState.endTime?.slice(0, 16) || ""}
                      onChange={(e) => onFieldChange("endTime", e.target.value)}
                    />
                  </FieldGroup>
                </FieldRow>
                <FieldGroup>
                  <FieldLabel>Max attendees</FieldLabel>
                  <FieldInput
                    type="number"
                    value={formState.maxAttendees ?? ""}
                    onChange={(e) =>
                      onFieldChange(
                        "maxAttendees",
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    placeholder="Leave empty for unlimited"
                  />
                </FieldGroup>
              </>
            )}

            {contentType === "campaign" && (
              <>
                <FieldGroup>
                  <FieldLabel>Campaign type</FieldLabel>
                  <SelectField
                    value={formState.campaignType}
                    onChange={(e) =>
                      onFieldChange("campaignType", e.target.value)
                    }
                  >
                    <option value="FEATURED_LISTING">Featured Listing</option>
                    <option value="BANNER_AD">Banner Ad</option>
                    <option value="PUSH_NOTIFICATION">Push Notification</option>
                  </SelectField>
                </FieldGroup>
                <FieldGroup>
                  <FieldLabel>Budget (EUR)</FieldLabel>
                  <FieldInput
                    type="number"
                    value={formState.campaignBudget}
                    onChange={(e) =>
                      onFieldChange(
                        "campaignBudget",
                        e.target.value ? Number(e.target.value) : 0,
                      )
                    }
                    placeholder="e.g. 50"
                  />
                </FieldGroup>
                <FieldRow>
                  <FieldGroup style={{ flex: 1 }}>
                    <FieldLabel>Start date</FieldLabel>
                    <FieldInput
                      type="date"
                      value={formState.campaignStartDate?.slice(0, 10) || ""}
                      onChange={(e) =>
                        onFieldChange("campaignStartDate", e.target.value)
                      }
                    />
                  </FieldGroup>
                  <FieldGroup style={{ flex: 1 }}>
                    <FieldLabel>End date</FieldLabel>
                    <FieldInput
                      type="date"
                      value={formState.campaignEndDate?.slice(0, 10) || ""}
                      onChange={(e) =>
                        onFieldChange("campaignEndDate", e.target.value)
                      }
                    />
                  </FieldGroup>
                </FieldRow>
              </>
            )}

            {/* ---- Campaign beats summary (publish step) ---- */}
            {contentType === "campaign" && campaignResults.length > 0 && (
              <>
                <Divider />
                <SectionLabel>
                  {language === "fi"
                    ? `Kampanjapostaukset (${campaignResults.length})`
                    : `Campaign posts (${campaignResults.length})`}
                </SectionLabel>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "16px",
                    marginBottom: "16px",
                  }}
                >
                  {campaignResults.map((beat, i) => {
                    const def = BEAT_DEFS[beat.job];
                    const label = language === "fi" ? def.label.fi : def.label.en;
                    const imageUrl = campaignBeatImages[i] || "";
                    return (
                      <div
                        key={i}
                        style={{
                          background: "#12122a",
                          border: `1px solid ${(CAMPAIGN_JOB_COLORS[beat.job] || "#2d2d4a")}33`,
                          borderLeft: `3px solid ${CAMPAIGN_JOB_COLORS[beat.job] || "#7c3aed"}`,
                          borderRadius: "8px",
                          overflow: "hidden",
                        }}
                      >
                        {/* Cover image */}
                        <div
                          style={{
                            height: "140px",
                            background: imageUrl
                              ? `url(${imageUrl}) center/cover`
                              : `linear-gradient(135deg, ${CAMPAIGN_JOB_COLORS[beat.job] || "#7c3aed"}22 0%, ${CAMPAIGN_JOB_COLORS[beat.job] || "#7c3aed"}08 100%)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                          }}
                        >
                          {!imageUrl && (
                            <span style={{ fontSize: "2rem", opacity: 0.3 }}>
                              {beat.job === "teaser" ? "🔮" : beat.job === "announcement" ? "📣" : beat.job === "reminder" ? "🔔" : beat.job === "day_of" ? "🎉" : "💌"}
                            </span>
                          )}
                          <span
                            style={{
                              position: "absolute",
                              top: "8px",
                              left: "8px",
                              background: `${CAMPAIGN_JOB_COLORS[beat.job] || "#7c3aed"}cc`,
                              color: "white",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "10px",
                              fontWeight: 600,
                            }}
                          >
                            {i + 1}. {label}
                          </span>
                          <span
                            style={{
                              position: "absolute",
                              top: "8px",
                              right: "8px",
                              background: "rgba(0,0,0,0.6)",
                              color: "#a5b4fc",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "9px",
                              fontWeight: 600,
                              textTransform: "uppercase",
                            }}
                          >
                            {language === "fi" ? "Sponsoroitu" : "Sponsored"}
                          </span>
                        </div>

                        {/* Content */}
                        <div style={{ padding: "12px" }}>
                          <div
                            style={{
                              fontSize: "13px",
                              fontWeight: 700,
                              color: "#f9fafb",
                              marginBottom: "4px",
                              lineHeight: 1.3,
                            }}
                          >
                            {beat.headline}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#9ca3af",
                              lineHeight: 1.4,
                              marginBottom: "8px",
                            }}
                          >
                            {beat.body.length > 120
                              ? beat.body.slice(0, 117) + "..."
                              : beat.body}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              paddingTop: "8px",
                              borderTop: "1px solid #262626",
                              fontSize: "11px",
                            }}
                          >
                            <span style={{ color: "#6b7280" }}>
                              {def.dayOffset < 0
                                ? `${Math.abs(def.dayOffset)}d ${language === "fi" ? "ennen" : "before"}`
                                : def.dayOffset === 0
                                  ? language === "fi" ? "tapahtumapäivä" : "event day"
                                  : `+${def.dayOffset}d`}
                            </span>
                            <span style={{ color: "#6366f1", fontWeight: 600 }}>
                              {beat.cta} →
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {contentType === "pass" && (
              <FieldRow>
                <FieldGroup style={{ flex: 1 }}>
                  <FieldLabel>Price (EUR)</FieldLabel>
                  <FieldInput
                    value={formState.priceEuros}
                    onChange={(e) =>
                      onFieldChange("priceEuros", e.target.value)
                    }
                    placeholder="e.g. 9.90"
                  />
                </FieldGroup>
                <FieldGroup style={{ flex: 1 }}>
                  <FieldLabel>Pass type</FieldLabel>
                  <SelectField
                    value={formState.passType}
                    onChange={(e) => onFieldChange("passType", e.target.value)}
                  >
                    <option value="SKIP_LINE">Skip Line</option>
                    <option value="VIP_ACCESS">VIP Access</option>
                    <option value="COVER_CHARGE">Cover Charge</option>
                  </SelectField>
                </FieldGroup>
              </FieldRow>
            )}

            {/* ---- Campaign social card export (downloadable images) ---- */}
            {contentType === "campaign" && campaignResults.length > 0 && (
              <>
                <Divider />
                <SectionLabel>
                  {language === "fi"
                    ? "Ladattavat somekortit"
                    : "Social cards ready to post"}
                </SectionLabel>
                <FieldHint style={{ marginTop: 0, marginBottom: 12 }}>
                  {language === "fi"
                    ? "Lataa kukin kortti erikseen ja jaa haluamassasi somekanavassa"
                    : "Download each card individually and post to your preferred social channel"}
                </FieldHint>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: "12px",
                    marginBottom: "16px",
                  }}
                >
                  {campaignResults.map((beat, i) => (
                    <DownloadCard key={i}>
                      <DownloadCardPreview $job={beat.job}>
                        {/* Thumbnail */}
                        <div
                          style={{
                            width: "100%",
                            height: "100px",
                            borderRadius: "6px",
                            overflow: "hidden",
                            marginBottom: "8px",
                            background: campaignBeatImages[i]
                              ? `url(${campaignBeatImages[i]}) center/cover`
                              : `linear-gradient(135deg, ${CAMPAIGN_JOB_COLORS[beat.job] || "#7c3aed"}22, ${CAMPAIGN_JOB_COLORS[beat.job] || "#7c3aed"}08)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {!campaignBeatImages[i] && (
                            <span style={{ fontSize: "1.5rem", opacity: 0.3 }}>
                              {beat.job === "teaser" ? "🔮"
                                : beat.job === "announcement" ? "📣"
                                : beat.job === "reminder" ? "🔔"
                                : beat.job === "day_of" ? "🎉"
                                : "💌"}
                            </span>
                          )}
                        </div>
                        <DownloadCardLabel $job={beat.job}>
                          {i + 1}. {language === "fi"
                            ? BEAT_DEFS[beat.job].label.fi
                            : BEAT_DEFS[beat.job].label.en}
                        </DownloadCardLabel>
                        <DownloadCardTitle>{beat.headline}</DownloadCardTitle>
                      </DownloadCardPreview>
                      <DownloadCardBtn
                        data-download-index={i}
                        onClick={async () => {
                          // Construct a full-size social card image from beat data
                          try {
                            const canvas = document.createElement("canvas");
                            canvas.width = 1200;
                            canvas.height = 630;
                            const ctx = canvas.getContext("2d")!;

                            // Background gradient
                            const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
                            const jobColor = CAMPAIGN_JOB_COLORS[beat.job] || "#7c3aed";
                            gradient.addColorStop(0, "#1a1a2e");
                            gradient.addColorStop(0.5, jobColor + "22");
                            gradient.addColorStop(1, "#0f0f1a");
                            ctx.fillStyle = gradient;
                            ctx.fillRect(0, 0, 1200, 630);

                            // Draw image if available
                            if (campaignBeatImages[i]) {
                              try {
                                const img = new Image();
                                img.crossOrigin = "anonymous";
                                await new Promise<void>((resolve, reject) => {
                                  img.onload = () => resolve();
                                  img.onerror = () => reject();
                                  img.src = campaignBeatImages[i];
                                });
                                // Draw image with dark overlay
                                ctx.drawImage(img, 0, 0, 1200, 630);
                                ctx.fillStyle = "rgba(0,0,0,0.55)";
                                ctx.fillRect(0, 0, 1200, 630);
                              } catch { /* continue without image */ }
                            }

                            // "Sponsored Content" badge
                            ctx.fillStyle = "rgba(0,0,0,0.5)";
                            const badgeText = language === "fi" ? "Sisältöyhteistyö" : "Sponsored Content";
                            ctx.font = "600 14px Inter, system-ui, sans-serif";
                            const badgeW = ctx.measureText(badgeText).width + 24;
                            roundRect(ctx, 32, 32, badgeW, 32, 6);
                            ctx.fill();
                            ctx.fillStyle = "#a5b4fc";
                            ctx.fillText(badgeText, 44, 53);

                            // Hoppr watermark
                            ctx.fillStyle = "rgba(255,255,255,0.3)";
                            ctx.font = "600 18px Inter, system-ui, sans-serif";
                            ctx.textAlign = "right";
                            ctx.fillText("HOPPR", 1168, 55);
                            ctx.textAlign = "left";

                            // Headline
                            ctx.fillStyle = "#ffffff";
                            ctx.font = "800 44px Inter, system-ui, sans-serif";
                            ctx.shadowColor = "rgba(0,0,0,0.6)";
                            ctx.shadowBlur = 12;
                            wrapText(ctx, beat.headline, 64, 450, 1072, 52);

                            // Body
                            ctx.shadowBlur = 8;
                            ctx.fillStyle = "rgba(255,255,255,0.85)";
                            ctx.font = "400 20px Inter, system-ui, sans-serif";
                            const bodyText = beat.body.length > 200
                              ? beat.body.slice(0, 197) + "..."
                              : beat.body;
                            wrapText(ctx, bodyText, 64, 510, 1072, 28);
                            ctx.shadowBlur = 0;

                            // CTA pill
                            const ctaText = `${beat.cta}  →`;
                            ctx.font = "600 18px Inter, system-ui, sans-serif";
                            const ctaW = ctx.measureText(ctaText).width + 36;
                            roundRect(ctx, 64, 570, ctaW, 42, 21);
                            ctx.fillStyle = "rgba(99, 102, 241, 0.2)";
                            ctx.fill();
                            ctx.strokeStyle = "rgba(99, 102, 241, 0.35)";
                            ctx.lineWidth = 1;
                            ctx.stroke();
                            ctx.fillStyle = "#818cf8";
                            ctx.fillText(ctaText, 82, 597);

                            // Trigger download
                            canvas.toBlob((blob) => {
                              if (!blob) return;
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `${campaignName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${beat.job}.png`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }, "image/png");
                          } catch (err) {
                            console.error("Failed to generate card:", err);
                          }
                        }}
                      >
                        ⬇ {language === "fi" ? "Lataa" : "Download"}
                      </DownloadCardBtn>
                    </DownloadCard>
                  ))}
                </div>

                {/* Download all button */}
                <DownloadAllBtn
                  onClick={async () => {
                    for (let i = 0; i < campaignResults.length; i++) {
                      const btn = document.querySelector(
                        `[data-download-index="${i}"]`,
                      ) as HTMLButtonElement | null;
                      if (btn) {
                        btn.click();
                        await new Promise((r) => setTimeout(r, 600));
                      }
                    }
                  }}
                >
                  ⬇ {language === "fi"
                    ? `Lataa kaikki ${campaignResults.length} korttia`
                    : `Download all ${campaignResults.length} cards`}
                </DownloadAllBtn>
              </>
            )}

            {/* ---- Schedule Summary ---- */}
            <ScheduleSummaryBox>
              <SummaryTitle>
                {language === "fi"
                  ? "Julkaisuaikataulu"
                  : "Publishing schedule"}
              </SummaryTitle>
              <SummaryGrid>
                <SummaryItem>
                  <SummaryLabel>
                    {language === "fi" ? "Julkaistaan" : "Goes live"}
                  </SummaryLabel>
                  <SummaryValue $highlight>
                    {formState.scheduledPublishAt
                      ? new Date(formState.scheduledPublishAt).toLocaleString(
                          language === "fi" ? "fi-FI" : "en-US",
                          { dateStyle: "medium", timeStyle: "short" },
                        )
                      : language === "fi"
                        ? "Heti"
                        : "Immediately"}
                  </SummaryValue>
                </SummaryItem>
                <SummaryItem>
                  <SummaryLabel>
                    {language === "fi"
                      ? "Ilmoita seuraajille"
                      : "Notify followers"}
                  </SummaryLabel>
                  <SummaryValue>
                    {formState.notifyFollowers
                      ? language === "fi"
                        ? "Kyllä"
                        : "Yes"
                      : language === "fi"
                        ? "Ei"
                        : "No"}
                  </SummaryValue>
                </SummaryItem>
                {formState.notifyFollowers && !formState.scheduledPublishAt && (
                  <SummaryItem>
                    <SummaryLabel>
                      {language === "fi"
                        ? "Ilmoituksen ajankohta"
                        : "Notification timing"}
                    </SummaryLabel>
                    <SummaryValue>
                      {formState.notifyTiming === "now"
                        ? language === "fi"
                          ? "Heti"
                          : "Now"
                        : formState.notifyTiming === "optimal"
                          ? language === "fi"
                            ? "Optimaalinen aika"
                            : "Optimal time"
                          : formState.notifyCustomTime
                            ? new Date(
                                formState.notifyCustomTime,
                              ).toLocaleString(
                                language === "fi" ? "fi-FI" : "en-US",
                                { dateStyle: "medium", timeStyle: "short" },
                              )
                            : "—"}
                    </SummaryValue>
                  </SummaryItem>
                )}
                {formState.scheduledPublishAt && formState.notifyFollowers && (
                  <SummaryItem>
                    <SummaryLabel>
                      {language === "fi"
                        ? "Ilmoituksen ajankohta"
                        : "Notification timing"}
                    </SummaryLabel>
                    <SummaryValue>
                      {language === "fi"
                        ? "Julkaisun yhteydessä"
                        : "At publish time"}
                    </SummaryValue>
                  </SummaryItem>
                )}
                {contentType === "event" && formState.remindBeforeEvent && (
                  <SummaryItem>
                    <SummaryLabel>
                      {language === "fi"
                        ? "Muistutus ennen tapahtumaa"
                        : "Reminder before event"}
                    </SummaryLabel>
                    <SummaryValue>
                      {formState.remindMinutesBefore >= 1440
                        ? language === "fi"
                          ? `${Math.round(formState.remindMinutesBefore / 1440)} päivää ennen`
                          : `${Math.round(formState.remindMinutesBefore / 1440)} day(s) before`
                        : formState.remindMinutesBefore >= 60
                          ? language === "fi"
                            ? `${Math.round(formState.remindMinutesBefore / 60)} tuntia ennen`
                            : `${Math.round(formState.remindMinutesBefore / 60)} hour(s) before`
                          : `${formState.remindMinutesBefore} min before`}
                    </SummaryValue>
                  </SummaryItem>
                )}
              </SummaryGrid>
            </ScheduleSummaryBox>

            {/* Retargeting section — only for promos and events */}
            {(contentType === "promotion" || contentType === "event") && (
              <RetargetingBox>
                <RetargetingTitle>
                  {language === "fi"
                    ? "Uudelleenkohdennus"
                    : "Follow-up retargeting"}
                </RetargetingTitle>
                <CheckboxRow style={{ marginTop: "0.75rem" }}>
                  <input
                    type="checkbox"
                    checked={formState.retargetViewers}
                    onChange={(e) =>
                      onFieldChange("retargetViewers", e.target.checked)
                    }
                    id="retargetViewers"
                  />
                  <CheckboxLabel htmlFor="retargetViewers">
                    {contentType === "promotion"
                      ? language === "fi"
                        ? "Lähetä muistutus käyttäjille, jotka katsovat mutta eivät lunasta tarjousta"
                        : "Follow up with people who view but don't redeem this deal"
                      : language === "fi"
                        ? "Lähetä muistutus käyttäjille, jotka katsovat mutta eivät ilmoittaudu"
                        : "Follow up with people who view but don't RSVP"}
                  </CheckboxLabel>
                </CheckboxRow>
                {formState.retargetViewers && (
                  <div style={{ marginTop: "0.75rem", marginLeft: "1.5rem" }}>
                    <FieldLabel style={{ marginBottom: "0.35rem" }}>
                      {language === "fi" ? "Seurantaviive" : "Follow-up delay"}
                    </FieldLabel>
                    <SelectField
                      value={formState.retargetDelayHours}
                      onChange={(e) =>
                        onFieldChange(
                          "retargetDelayHours",
                          Number(e.target.value),
                        )
                      }
                      style={{ width: "auto", minWidth: "160px" }}
                    >
                      <option value={24}>
                        {language === "fi" ? "24 tuntia" : "24 hours"}
                      </option>
                      <option value={48}>
                        {language === "fi" ? "48 tuntia" : "48 hours"}
                      </option>
                      <option value={72}>
                        {language === "fi" ? "72 tuntia" : "72 hours"}
                      </option>
                    </SelectField>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#9ca3af",
                        marginTop: "0.35rem",
                      }}
                    >
                      {language === "fi"
                        ? `Käyttäjät jotka katsoivat mutta eivät toimineet saavat push-ilmoituksen ${formState.retargetDelayHours} tunnin kuluttua.`
                        : `Users who viewed but didn't act will get a push notification after ${formState.retargetDelayHours} hours.`}
                    </div>
                  </div>
                )}
              </RetargetingBox>
            )}

            <SubmitRow>
              <BackLink onClick={goBack} style={{ marginBottom: 0 }}>
                {language === "fi"
                  ? "← Takaisin aikatauluun"
                  : "← Back to schedule"}
              </BackLink>
              <SubmitButton
                onClick={onSubmit}
                disabled={submitting || !formState.title.trim()}
              >
                {submitting
                  ? "Publishing..."
                  : contentType === "campaign"
                    ? "Launch campaign"
                    : "Publish"}
              </SubmitButton>
            </SubmitRow>
          </ReviewSection>
        )}
      </StepBody>
    </Container>
  );
}

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16162a 100%);
  border: 1px solid #2d2d4a;
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 16px;
`;

// ---- Progress ----

const ProgressBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 16px;
`;

const ProgressStep = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

const ProgressDot = styled.div<{ $active: boolean; $done: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
  transition: all 0.2s;
  background: ${({ $active, $done }) =>
    $active ? "#7c3aed" : $done ? "#10b981" : "#2d2d4a"};
  color: ${({ $active, $done }) => ($active || $done ? "white" : "#6b7280")};
`;

const ProgressLabel = styled.span<{ $active: boolean; $done: boolean }>`
  font-size: 9px;
  font-weight: 600;
  margin-left: 6px;
  color: ${({ $active, $done }) =>
    $active ? "#a78bfa" : $done ? "#6ee7b7" : "#4b5563"};
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.04em;

  @media (max-width: 480px) {
    display: none;
  }
`;

const ProgressLine = styled.div<{ $done: boolean }>`
  flex: 1;
  height: 1px;
  min-width: 8px;
  margin: 0 6px;
  background: ${({ $done }) => ($done ? "#10b981" : "#2d2d4a")};
  transition: background 0.3s;
`;

// ---- Shared ----

const StepBody = styled.div`
  padding: 20px;

  @media (max-width: 480px) {
    padding: 14px 10px;
  }
`;

const StepTitle = styled.h2`
  font-size: 16px;
  font-weight: 700;
  color: #f9fafb;
  margin: 0 0 16px;
  display: flex;
  align-items: center;
  gap: 6px;

  @media (max-width: 480px) {
    font-size: 14px;
    margin-bottom: 12px;
  }
`;

const StepNum = styled.span`
  color: #7c3aed;
  font-size: 14px;
`;

const SectionLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: #a78bfa;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
`;

const Divider = styled.div`
  height: 1px;
  background: #2d2d4a;
  margin: 16px 0;
`;

const FieldHint = styled.div`
  font-size: 10px;
  color: #6b7280;
  font-style: italic;
  line-height: 1.4;
`;

// ---- Campaign-specific styled components ----

const CAMPAIGN_JOB_COLORS: Record<string, string> = {
  teaser: "#8b5cf6",
  announcement: "#3b82f6",
  reminder: "#f59e0b",
  day_of: "#ef4444",
  follow_up: "#10b981",
};

const CampaignConfigPanel = styled.div`
  background: #12122a;
  border: 1px solid #2d2d4a;
  border-radius: 12px;
  padding: 18px;
  margin-bottom: 16px;
`;

const CampaignNameInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
  border: 1px solid #2d2d4a;
  border-radius: 8px;
  background: #0d0d1a;
  color: #e5e7eb;
  font-size: 13px;
  font-family: inherit;
  &:focus {
    outline: none;
    border-color: #7c3aed;
  }
  &::placeholder {
    color: #4b5563;
  }
`;

const BeatCheckRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const BeatCheckChip = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid ${({ $active }) => ($active ? "#7c3aed" : "#2d2d4a")};
  background: ${({ $active }) => ($active ? "rgba(124, 58, 237, 0.15)" : "transparent")};
  color: ${({ $active }) => ($active ? "#e5e7eb" : "#6b7280")};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  &:hover:not(:disabled) {
    border-color: #7c3aed;
    color: #e5e7eb;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DateRow = styled.div`
  display: flex;
  gap: 10px;
`;

const DateInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  background: #0d0d1a;
  border: 1px solid #2d2d4a;
  border-radius: 8px;
  color: #e5e7eb;
  font-size: 13px;
  font-family: inherit;
  &:focus {
    outline: none;
    border-color: #7c3aed;
  }
  &::placeholder {
    color: #4b5563;
  }
`;

const TimeInput = styled(DateInput)`
  flex: 0.6;
`;

const CampaignTimeline = styled.div`
  position: relative;
  padding-left: 20px;

  &::before {
    content: "";
    position: absolute;
    left: 7px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(
      to bottom,
      ${CAMPAIGN_JOB_COLORS.teaser},
      ${CAMPAIGN_JOB_COLORS.announcement} 25%,
      ${CAMPAIGN_JOB_COLORS.reminder} 50%,
      ${CAMPAIGN_JOB_COLORS.day_of} 75%,
      ${CAMPAIGN_JOB_COLORS.follow_up}
    );
    border-radius: 1px;
  }
`;

const CampaignBeatCard = styled.div<{ $job: string; $active?: boolean }>`
  position: relative;
  margin-bottom: 20px;
  padding: 16px;
  background: ${({ $active }) => ($active ? "#1a1a3e" : "#12122a")};
  border: 1px solid ${({ $job, $active }) =>
    $active
      ? `${CAMPAIGN_JOB_COLORS[$job] || "#7c3aed"}66`
      : `${CAMPAIGN_JOB_COLORS[$job] || "#2d2d4a"}33`};
  border-left: 3px solid ${({ $job }) => CAMPAIGN_JOB_COLORS[$job] || "#7c3aed"};
  border-radius: 8px;
  transition: background 0.15s, border-color 0.15s;
`;

const CampaignBeatHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
`;

const CampaignBeatDot = styled.div<{ $job: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ $job }) => CAMPAIGN_JOB_COLORS[$job] || "#7c3aed"};
  flex-shrink: 0;
`;

const CampaignBeatJobLabel = styled.span<{ $job: string }>`
  font-size: 13px;
  font-weight: 700;
  color: ${({ $job }) => CAMPAIGN_JOB_COLORS[$job] || "#e5e7eb"};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const CampaignBeatOffset = styled.span`
  font-size: 10px;
  font-weight: 600;
  color: #6b7280;
  background: rgba(107, 114, 128, 0.12);
  padding: 2px 8px;
  border-radius: 4px;
  margin-left: auto;
`;

const CampaignBeatObjective = styled.span`
  font-size: 11px;
  color: #6b7280;
  font-style: italic;
  width: 100%;
  margin-top: 2px;
`;

const CampaignBeatContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

// ---- Campaign social card previews (refine step) ----

const SocialPreviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #2d2d4a;
`;

const SocialPreviewLabel = styled.div`
  font-size: 10px;
  font-weight: 700;
  color: #6366f1;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 10px;
`;

const SocialCard = styled.div<{ $job: string }>`
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid ${({ $job }) => `${CAMPAIGN_JOB_COLORS[$job] || "#7c3aed"}33`};
  background: #12122a;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  transition: transform 0.15s;
  &:hover {
    transform: translateY(-2px);
  }
`;

const SocialCardCover = styled.div<{ $job: string; $hasImage: boolean }>`
  height: 160px;
  background: ${({ $job, $hasImage }) =>
    $hasImage
      ? "center/cover"
      : `linear-gradient(135deg, ${CAMPAIGN_JOB_COLORS[$job] || "#7c3aed"}22 0%, ${CAMPAIGN_JOB_COLORS[$job] || "#7c3aed"}08 100%)`};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const SocialCardSponsored = styled.span`
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(4px);
  color: #a5b4fc;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const SocialCardJobBadge = styled.span<{ $job: string }>`
  position: absolute;
  top: 8px;
  right: 8px;
  background: ${({ $job }) => `${CAMPAIGN_JOB_COLORS[$job] || "#7c3aed"}cc`};
  color: white;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 600;
`;

const SocialCardPlaceholderIcon = styled.span`
  font-size: 2.5rem;
  opacity: 0.25;
`;

const SocialCardBody = styled.div`
  padding: 14px;
`;

const SocialCardTitle = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #f9fafb;
  line-height: 1.35;
  margin-bottom: 6px;
`;

const SocialCardText = styled.div`
  font-size: 11px;
  color: #9ca3af;
  line-height: 1.45;
  margin-bottom: 10px;
`;

const SocialCardCta = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  color: #818cf8;
`;

// ---- Action buttons ----

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const ButtonPrimary = styled.button`
  padding: 10px 22px;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  &:hover:not(:disabled) {
    background: #6d28d9;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ButtonSecondary = styled.button`
  padding: 10px 18px;
  background: transparent;
  color: #9ca3af;
  border: 1px solid #2d2d4a;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-color: #4b5563;
    color: #e5e7eb;
  }
`;

const BackLink = styled.button`
  display: block;
  margin-top: 12px;
  background: none;
  border: none;
  color: #6b7280;
  font-size: 12px;
  cursor: pointer;
  font-weight: 500;
  padding: 0;
  &:hover {
    color: #a78bfa;
  }
`;

// ---- Campaign social card download components ----

const DownloadCard = styled.div`
  background: #12122a;
  border: 1px solid #2d2d4a;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
`;

const DownloadCardPreview = styled.div<{ $job: string }>`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const DownloadCardLabel = styled.div<{ $job: string }>`
  font-size: 10px;
  font-weight: 600;
  color: ${({ $job }) => CAMPAIGN_JOB_COLORS[$job] || "#7c3aed"};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
`;

const DownloadCardTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #e5e7eb;
  line-height: 1.3;
  margin-bottom: 10px;
`;

const DownloadCardBtn = styled.button`
  width: 100%;
  padding: 8px 12px;
  background: rgba(124, 58, 237, 0.15);
  border: 1px solid rgba(124, 58, 237, 0.3);
  border-radius: 8px;
  color: #a78bfa;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  &:hover {
    background: rgba(124, 58, 237, 0.25);
    border-color: rgba(124, 58, 237, 0.5);
    color: #c4b5fd;
  }
`;

const DownloadAllBtn = styled.button`
  width: 100%;
  padding: 12px 20px;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(99, 102, 241, 0.15));
  border: 1px solid rgba(124, 58, 237, 0.35);
  border-radius: 10px;
  color: #c4b5fd;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  margin-bottom: 8px;
  &:hover {
    background: linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(99, 102, 241, 0.25));
    border-color: rgba(124, 58, 237, 0.5);
  }
`;

const ErrorBox = styled.div`
  margin-top: 10px;
  font-size: 12px;
  color: #ef4444;
  padding: 8px 12px;
  background: rgba(239, 68, 68, 0.08);
  border-radius: 8px;
  border: 1px solid rgba(239, 68, 68, 0.2);
`;

// ---- Step 1: Type ----

const TypeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;

  @media (max-width: 480px) {
    gap: 8px;
  }
`;

const TypeCard = styled.button<{ $selected: boolean }>`
  padding: 16px;
  border: 1px solid ${({ $selected }) => ($selected ? "#7c3aed" : "#2d2d4a")};
  border-radius: 10px;
  background: ${({ $selected }) =>
    $selected ? "rgba(124, 58, 237, 0.1)" : "#0d0d1a"};
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
  display: flex;
  flex-direction: column;
  gap: 6px;
  &:hover {
    border-color: #7c3aed;
    background: rgba(124, 58, 237, 0.06);
  }

  @media (max-width: 480px) {
    padding: 12px;
  }
`;

const TypeCardEmoji = styled.span`
  font-size: 24px;
  line-height: 1;
`;
const TypeCardLabel = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: #f9fafb;
`;
const TypeCardDesc = styled.span`
  font-size: 11px;
  color: #6b7280;
  line-height: 1.4;
`;

const TextareaHint = styled.div`
  font-size: 10px;
  color: #6b7280;
  font-style: italic;
`;

// ---- Example cards (replaces free-text textarea) ----

const ExampleCardsRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 8px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const ExampleCard = styled.div<{ $tone?: string | null }>`
  padding: 14px;
  border-radius: 10px;
  border: 1px solid #2d2d4a;
  background: ${({ $tone }) => {
    switch ($tone) {
      case "BOLD_ENERGETIC":
        return "rgba(239, 68, 68, 0.06)";
      case "WARM_INVITING":
        return "rgba(245, 158, 11, 0.06)";
      case "EDGY_IRREVERENT":
        return "rgba(168, 85, 247, 0.06)";
      case "ELEGANT_PREMIUM":
        return "rgba(59, 130, 246, 0.06)";
      case "PLAYFUL_FUN":
        return "rgba(34, 197, 94, 0.06)";
      default:
        return "#0d0d1a";
    }
  }};
  border-color: ${({ $tone }) => {
    switch ($tone) {
      case "BOLD_ENERGETIC":
        return "rgba(239, 68, 68, 0.25)";
      case "WARM_INVITING":
        return "rgba(245, 158, 11, 0.25)";
      case "EDGY_IRREVERENT":
        return "rgba(168, 85, 247, 0.25)";
      case "ELEGANT_PREMIUM":
        return "rgba(59, 130, 246, 0.25)";
      case "PLAYFUL_FUN":
        return "rgba(34, 197, 94, 0.25)";
      default:
        return "#2d2d4a";
    }
  }};
  transition: all 0.2s;
`;

const ExampleCardTitle = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: #e5e7eb;
  margin-bottom: 6px;
  line-height: 1.3;
`;

const ExampleCardDesc = styled.div`
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.45;
`;

const ExampleLabel = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: #7c3aed;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
`;

// ---- Preview prompt ----

const PreviewSection = styled.div`
  margin-top: 12px;
  border: 1px solid #2d2d4a;
  border-radius: 8px;
  overflow: hidden;
`;

const PreviewToggle = styled.button`
  width: 100%;
  padding: 8px 12px;
  background: #0d0d1a;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
  &:hover {
    background: #1a1a2e;
  }
`;

const PreviewToggleIcon = styled.span<{ $open: boolean }>`
  font-size: 10px;
  color: ${({ $open }) => ($open ? "#60a5fa" : "#6b7280")};
`;

const PreviewToggleLabel = styled.span`
  font-size: 12px;
  font-weight: 700;
  color: #f9fafb;
`;

const PreviewToggleHint = styled.span`
  font-size: 10px;
  color: #6b7280;
  font-style: italic;
`;

const PreviewBody = styled.div`
  padding: 12px;
  background: #060610;
  border-top: 1px solid #2d2d4a;
  font-family: "SF Mono", "Fira Code", monospace;
`;

const PreviewLine = styled.div`
  font-size: 11px;
  color: #d1d5db;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
`;

const PreviewPlaceholder = styled.div`
  font-size: 12px;
  color: #6b7280;
  text-align: center;
  padding: 16px 8px;
  line-height: 1.5;
`;

const BriefActionsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  margin-bottom: 2px;
  gap: 12px;

  @media (max-width: 480px) {
    flex-wrap: wrap;
  }
`;

const RegenerateBriefButton = styled.button`
  padding: 5px 12px;
  border: 1px solid #2d2d4a;
  border-radius: 6px;
  background: #0d0d1a;
  color: #a78bfa;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
  flex-shrink: 0;
  &:hover:not(:disabled) {
    border-color: #7c3aed;
    background: rgba(124, 58, 237, 0.1);
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

// ---- Helpers (collapsible) ----

const HelperSection = styled.div`
  margin-top: 12px;
  border: 1px solid #2d2d4a;
  border-radius: 8px;
  overflow: hidden;
`;

const HelperToggle = styled.button`
  width: 100%;
  padding: 8px 12px;
  background: #0d0d1a;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
  &:hover {
    background: #1a1a2e;
  }
`;

const HelperToggleIcon = styled.span<{ $open: boolean }>`
  font-size: 10px;
  color: ${({ $open }) => ($open ? "#a78bfa" : "#6b7280")};
  transition: transform 0.15s;
`;

const HelperToggleLabel = styled.span`
  font-size: 12px;
  font-weight: 700;
  color: #f9fafb;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const HelperActiveTag = styled.span`
  font-size: 10px;
  font-weight: 500;
  color: #a78bfa;
  background: rgba(124, 58, 237, 0.15);
  padding: 1px 6px;
  border-radius: 3px;
`;

const HelperHint = styled.span`
  font-size: 10px;
  color: #4b5563;
  margin-left: auto;
`;

const HelperBody = styled.div`
  padding: 10px 12px 12px;
  background: rgba(124, 58, 237, 0.04);
  border-top: 1px solid #2d2d4a;
`;

const HelperDesc = styled.div`
  font-size: 11px;
  color: #9ca3af;
  margin-bottom: 10px;
  line-height: 1.4;
`;

// ---- Tone chips ----

const ToneRow = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const ToneChip = styled.button<{
  $active: boolean;
  $recommended?: boolean;
  $cautionary?: boolean;
}>`
  padding: 6px 12px;
  border: 1px solid
    ${({ $active, $recommended }) =>
      $active
        ? "#7c3aed"
        : $recommended
          ? "rgba(16, 185, 129, 0.4)"
          : "#2d2d4a"};
  border-radius: 8px;
  background: ${({ $active, $recommended }) =>
    $active
      ? "rgba(124, 58, 237, 0.12)"
      : $recommended
        ? "rgba(16, 185, 129, 0.06)"
        : "#0d0d1a"};
  color: ${({ $active, $cautionary }) =>
    $active ? "#ffffff" : $cautionary ? "#6b7280" : "#d1d5db"};
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: ${({ $cautionary }) => ($cautionary ? 0.65 : 1)};
  &:hover:not(:disabled) {
    border-color: #7c3aed;
    color: #ffffff;
    opacity: 1;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const ToneRecommendTag = styled.span`
  font-size: 9px;
  font-weight: 600;
  color: #10b981;
  background: rgba(16, 185, 129, 0.12);
  padding: 1px 5px;
  border-radius: 3px;
  margin-left: 2px;
  white-space: nowrap;
`;

// ---- Templates ----

const TemplateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 6px;

  @media (max-width: 480px) {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
`;

const TemplateCard = styled.button<{ $active: boolean }>`
  padding: 10px 12px;
  border: 1px solid ${({ $active }) => ($active ? "#7c3aed" : "#2d2d4a")};
  border-radius: 8px;
  background: ${({ $active }) =>
    $active ? "rgba(124, 58, 237, 0.12)" : "#0d0d1a"};
  cursor: pointer;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: all 0.15s;
  ${({ $active }) =>
    $active && "box-shadow: 0 0 0 1px rgba(124, 58, 237, 0.3);"}
  &:hover:not(:disabled) {
    border-color: #7c3aed;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const TemplateName = styled.span`
  font-size: 12px;
  font-weight: 700;
  color: #f9fafb;
  line-height: 1.2;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const WizardBadge = styled.span`
  font-size: 9px;
  font-weight: 500;
  color: #a78bfa;
  background: rgba(124, 58, 237, 0.15);
  padding: 0 4px;
  border-radius: 3px;
`;

const TemplateDesc = styled.span`
  font-size: 10px;
  color: #9ca3af;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

// ---- Wizard ----

const WizardPanel = styled.div`
  margin-top: 14px;
  padding: 16px;
  background: rgba(124, 58, 237, 0.06);
  border: 1px solid rgba(124, 58, 237, 0.25);
  border-radius: 10px;
  animation: wizardSlideIn 0.2s ease-out;
  @keyframes wizardSlideIn {
    from {
      opacity: 0;
      transform: translateY(-6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const WizardProgress = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 600;
  color: #a78bfa;
  margin-bottom: 12px;
`;

const WizardStepPips = styled.div`
  display: flex;
  gap: 4px;
`;

const WizardPip = styled.div<{ $active: boolean; $done: boolean }>`
  width: ${({ $active }) => ($active ? "20px" : "6px")};
  height: 6px;
  border-radius: 3px;
  background: ${({ $active, $done }) =>
    $active ? "#a78bfa" : $done ? "#7c3aed" : "#2d2d4a"};
  transition: all 0.2s;
`;

const WizardQuestion = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #e5e7eb;
  margin-bottom: 12px;
  line-height: 1.4;
`;

const WizardChipRow = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const WizardChip = styled.button`
  padding: 8px 14px;
  border: 1px solid #2d2d4a;
  border-radius: 8px;
  background: #0d0d1a;
  color: #f9fafb;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  line-height: 1.3;
  flex: 1 1 140px;
  min-width: 120px;
  max-width: 220px;
  &:hover:not(:disabled) {
    border-color: #7c3aed;
    background: rgba(124, 58, 237, 0.1);
    color: #ffffff;
  }
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const WizardActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #2d2d4a;
`;

const WizardBackButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  &:hover {
    color: #a78bfa;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const WizardSkipButton = styled.button`
  background: none;
  border: none;
  color: #4b5563;
  font-size: 11px;
  cursor: pointer;
  padding: 0;
  font-style: italic;
  &:hover {
    color: #6b7280;
  }
`;

// ---- Context chips ----

const SuggestionRow = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const SuggestionChip = styled.button<{ $selected?: boolean }>`
  padding: 5px 12px;
  border: 1px solid ${({ $selected }) => ($selected ? "#7c3aed" : "#2d2d4a")};
  border-radius: 14px;
  background: ${({ $selected }) =>
    $selected ? "rgba(124, 58, 237, 0.12)" : "#0d0d1a"};
  color: ${({ $selected }) => ($selected ? "#ffffff" : "#d1d5db")};
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  &:hover:not(:disabled) {
    border-color: #7c3aed;
    color: #ffffff;
    background: #1a1a2e;
  }
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

// ---- Controls ----

const ControlsRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 16px;
  margin-top: 14px;
`;

const ControlGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ControlLabel = styled.span`
  font-size: 10px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const PillGroup = styled.div`
  display: flex;
  gap: 2px;
  background: #0d0d1a;
  border-radius: 8px;
  padding: 2px;
  border: 1px solid #2d2d4a;
`;

const Pill = styled.button<{ $active: boolean }>`
  padding: 5px 12px;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  background: ${({ $active }) => ($active ? "#7c3aed" : "transparent")};
  color: ${({ $active }) => ($active ? "white" : "#6b7280")};
  transition: all 0.15s;
  &:hover {
    color: ${({ $active }) => ($active ? "white" : "#d1d5db")};
  }
`;

const GenerateRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 14px;

  @media (max-width: 480px) {
    flex-wrap: wrap;
    gap: 10px;
  }
`;

const FormatNote = styled.span`
  font-size: 10px;
  color: #6b7280;
  font-style: italic;
  flex: 1;
  text-align: center;
`;

const GenerationStatusBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%);
  border: 1px solid rgba(124, 58, 237, 0.25);
  border-radius: 10px;
  margin-top: 12px;
  color: #c4b5fd;
  font-size: 13px;
  font-weight: 500;
  animation: pulse 2s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
`;

const GenerateButton = styled.button`
  padding: 10px 22px;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  &:hover:not(:disabled) {
    background: #6d28d9;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Spinner = styled.span`
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.7s linear infinite;
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const HintRow = styled.div`
  margin-top: 10px;
  text-align: center;
`;

const HintKey = styled.span`
  font-size: 11px;
  color: #4b5563;
  background: #1a1a2e;
  padding: 1px 6px;
  border-radius: 3px;
  border: 1px solid #2d2d4a;
`;

const HintText = styled.span`
  font-size: 11px;
  color: #4b5563;
`;

// ---- Step 3: Refine ----

const BriefRecap = styled.div`
  font-size: 12px;
  color: #6b7280;
  padding: 8px 12px;
  background: #0d0d1a;
  border-radius: 8px;
  margin-bottom: 12px;
  border: 1px solid #2d2d4a;
  line-height: 1.4;
`;

const BriefLabel = styled.span`
  font-weight: 600;
  color: #9ca3af;
`;

const RefineGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const VariantCard = styled.div`
  padding: 16px;
  border: 1px solid #2d2d4a;
  border-radius: 10px;
  background: #0d0d1a;

  @media (max-width: 480px) {
    padding: 12px;
  }
`;

const VariantCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const VariantNumber = styled.span`
  font-size: 12px;
  font-weight: 700;
  color: #a78bfa;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const DeleteButton = styled.button`
  padding: 3px 8px;
  border: 1px solid #2d2d4a;
  border-radius: 6px;
  background: transparent;
  color: #ef4444;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: #ef4444;
  }
`;

// ---- Flux prompt editor (Step 3) ----

const FluxSection = styled.div`
  margin-top: 12px;
  border: 1px solid #2d2d4a;
  border-radius: 6px;
  overflow: hidden;
`;

const FluxToggle = styled.button`
  width: 100%;
  padding: 6px 10px;
  background: #0a0a14;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  &:hover {
    background: #111122;
  }
`;

const FluxToggleLabel = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
`;

const FluxToggleHint = styled.span`
  font-size: 9px;
  color: #4b5563;
  text-transform: uppercase;
`;

const FluxEditor = styled.div`
  display: flex;
  flex-direction: column;
  padding: 8px 10px 10px;
  border-top: 1px solid #2d2d4a;
  background: #060610;
`;

const FluxEditorHint = styled.div`
  font-size: 10px;
  color: #4b5563;
  margin-bottom: 6px;
  line-height: 1.4;
`;

// ---- Step 4: Images ----

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 10px;
  }
`;

const ImageCard = styled.div`
  padding: 14px;
  border: 1px solid #2d2d4a;
  border-radius: 10px;
  background: #0d0d1a;
  display: flex;
  flex-direction: column;

  @media (max-width: 480px) {
    padding: 10px;
  }
`;

const ImageCardBadge = styled.span`
  font-size: 10px;
  font-weight: 700;
  color: #a78bfa;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
`;

const ImagePreview = styled.div`
  width: 100%;
  height: 160px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #2d2d4a;
  margin-bottom: 10px;
  background: #0a0a14;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CardImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #0a0a14;
`;

const ImagePlaceholder = styled.div`
  font-size: 12px;
  color: #4b5563;
`;

const ImageLoading = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #6b7280;
`;

const ImageCardTitle = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: #f9fafb;
  margin-bottom: 4px;
`;

const ImageCardDesc = styled.div`
  font-size: 11px;
  color: #6b7280;
  line-height: 1.4;
  margin-bottom: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const LayoutLabel = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: #4b5563;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
  margin-top: 6px;
`;

const LayoutRow = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
`;

const LayoutChip = styled.button<{ $active: boolean }>`
  padding: 3px 8px;
  border: 1px solid ${({ $active }) => ($active ? "#7c3aed" : "#2d2d4a")};
  border-radius: 5px;
  background: ${({ $active }) =>
    $active ? "rgba(124, 58, 237, 0.15)" : "transparent"};
  color: ${({ $active }) => ($active ? "#f9fafb" : "#6b7280")};
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    border-color: #7c3aed;
  }
`;

const SubjectLabel = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: #4b5563;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
  margin-top: 6px;
`;

const SubjectRow = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
  flex-wrap: wrap;
`;

const SubjectChip = styled.button<{ $active: boolean }>`
  padding: 3px 8px;
  border: 1px solid ${({ $active }) => ($active ? "#10b981" : "#2d2d4a")};
  border-radius: 5px;
  background: ${({ $active }) =>
    $active ? "rgba(16, 185, 129, 0.15)" : "transparent"};
  color: ${({ $active }) => ($active ? "#34d399" : "#6b7280")};
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    border-color: #10b981;
  }
`;

const ImageActionsRow = styled.div`
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
`;

const ImageActionBtn = styled.button`
  padding: 4px 10px;
  border: 1px solid #2d2d4a;
  border-radius: 6px;
  background: transparent;
  color: #a78bfa;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  &:hover:not(:disabled) {
    border-color: #7c3aed;
    background: rgba(124, 58, 237, 0.1);
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const FluxToggleSmall = styled.button`
  padding: 4px 10px;
  border: 1px solid #2d2d4a;
  border-radius: 6px;
  background: transparent;
  color: #6b7280;
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
  &:hover {
    color: #9ca3af;
    border-color: #4b5563;
  }
`;

const FluxImgEditor = styled.div`
  padding: 8px;
  border: 1px solid #2d2d4a;
  border-radius: 6px;
  margin-bottom: 8px;
  background: #060610;
`;

const ImageUploadWrapper = styled.div`
  margin-bottom: 8px;
`;

const SelectVariantBtn = styled.button`
  width: 100%;
  padding: 8px;
  border: none;
  border-radius: 8px;
  background: #7c3aed;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: auto;
  &:hover {
    background: #6d28d9;
  }
`;

// ---- Step 5: Publish ----

const ReviewSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FieldLabel = styled.label`
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const inputStyles = `
  width: 100%; box-sizing: border-box;
  padding: 8px 12px; border: 1px solid #2d2d4a; border-radius: 8px;
  background: #0d0d1a; color: #e5e7eb; font-size: 13px; font-family: inherit;
  &:focus { outline: none; border-color: #7c3aed; }
  &::placeholder { color: #4b5563; }
`;

const FieldInput = styled.input<{ $compliance?: string }>`
  ${inputStyles}
`;
const FieldTextarea = styled.textarea<{ $compliance?: string }>`
  ${inputStyles} resize: vertical;
`;
const SelectField = styled.select`
  ${inputStyles}
`;

const FieldRow = styled.div`
  display: flex;
  gap: 10px;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 8px;
  }
`;

const CheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;

  input[type="checkbox"] {
    accent-color: #7c3aed;
    width: 15px;
    height: 15px;
    cursor: pointer;
  }
`;

const CheckboxLabel = styled.label`
  font-size: 13px;
  color: #9ca3af;
  user-select: none;
  cursor: pointer;
`;

const SubmitRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid #2d2d4a;

  @media (max-width: 480px) {
    flex-wrap: wrap;
    gap: 8px;
  }
`;

// ---- Schedule summary in review step ----

const ScheduleSummaryBox = styled.div`
  margin-top: 14px;
  padding: 12px 14px;
  background: rgba(16, 185, 129, 0.06);
  border: 1px solid rgba(16, 185, 129, 0.18);
  border-radius: 10px;
`;

const SummaryTitle = styled.div`
  font-size: 10px;
  font-weight: 700;
  color: #6ee7b7;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 10px;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 6px;
  }
`;

const SummaryItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const SummaryLabel = styled.span`
  font-size: 10px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

const SummaryValue = styled.span<{ $highlight?: boolean }>`
  font-size: 13px;
  font-weight: 600;
  color: ${({ $highlight }) => ($highlight ? "#6ee7b7" : "#d1d5db")};
`;

const RetargetingBox = styled.div`
  margin-top: 16px;
  padding: 14px 16px;
  background: rgba(16, 185, 129, 0.06);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 10px;
`;

const RetargetingTitle = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: #6ee7b7;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

// ---- Ingredients summary ----

const IngredientsSummary = styled.div`
  margin-top: 14px;
  padding: 10px 12px;
  background: rgba(124, 58, 237, 0.05);
  border: 1px solid rgba(124, 58, 237, 0.15);
  border-radius: 8px;
`;

const IngredientsLabel = styled.div`
  font-size: 10px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
`;

const IngredientsTags = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

// ---- Custom context input ----

const CustomContextRow = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #2d2d4a;
`;

const CustomContextInput = styled.input`
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #2d2d4a;
  border-radius: 6px;
  background: #0d0d1a;
  color: #e5e7eb;
  font-size: 11px;
  font-family: inherit;
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
  &::placeholder {
    color: #4b5563;
  }
  &:disabled {
    opacity: 0.4;
  }
`;

const CustomContextAddBtn = styled.button`
  padding: 6px 12px;
  border: 1px solid #3b82f6;
  border-radius: 6px;
  background: rgba(59, 130, 246, 0.12);
  color: #60a5fa;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
  &:hover:not(:disabled) {
    background: rgba(59, 130, 246, 0.2);
  }
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const IngredientTag = styled.span<{
  $kind: "tone" | "template" | "context" | "brand";
}>`
  padding: 3px 8px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 600;
  background: ${({ $kind }) =>
    $kind === "tone"
      ? "rgba(245, 158, 11, 0.12)"
      : $kind === "template"
        ? "rgba(124, 58, 237, 0.15)"
        : $kind === "brand"
          ? "rgba(16, 185, 129, 0.12)"
          : "rgba(59, 130, 246, 0.12)"};
  color: ${({ $kind }) =>
    $kind === "tone"
      ? "#f59e0b"
      : $kind === "template"
        ? "#a78bfa"
        : $kind === "brand"
          ? "#34d399"
          : "#60a5fa"};
  border: 1px solid
    ${({ $kind }) =>
      $kind === "tone"
        ? "rgba(245, 158, 11, 0.25)"
        : $kind === "template"
          ? "rgba(124, 58, 237, 0.25)"
          : $kind === "brand"
            ? "rgba(16, 185, 129, 0.25)"
            : "rgba(59, 130, 246, 0.25)"};
`;

// ---- Compliance blocked ----

const ComplianceBlockedBox = styled.div`
  margin-top: 14px;
  padding: 12px;
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 8px;
`;

const ComplianceBlockedTitle = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: #ef4444;
  margin-bottom: 8px;
`;

const ComplianceBlockedReason = styled.div`
  font-size: 11px;
  color: #fca5a5;
  margin-bottom: 4px;
  padding-left: 8px;
  border-left: 2px solid rgba(239, 68, 68, 0.3);
  line-height: 1.4;
`;

const ComplianceBlockedHint = styled.div`
  font-size: 10px;
  color: #6b7280;
  margin-top: 8px;
  font-style: italic;
`;

// ---- Platform-aware validation display ----

const PlatformCheckRow = styled.div`
  margin-top: 0.5rem;
  padding: 0.375rem 0.5rem;
  background: #0d0d0d;
  border-radius: 6px;
  border: 1px solid #1f1f1f;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const PlatformMetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
`;

const PlatformCounts = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.375rem;
`;

const CharCount = styled.span<{ $over?: boolean }>`
  font-size: 0.625rem;
  color: ${({ $over }) => ($over ? "#f59e0b" : "#52525b")};
  font-weight: ${({ $over }) => ($over ? 600 : 400)};
  span {
    color: ${({ $over }) => ($over ? "#f59e0b" : "#6b7280")};
    font-weight: 700;
    margin-right: 2px;
  }
`;

const CharUnit = styled.span`
  color: #3f3f46 !important;
  font-weight: 400 !important;
  font-size: 0.5625rem;
`;

const PlatformChips = styled.div`
  display: flex;
  gap: 0.375rem;
  align-items: center;
`;

const PlatformChip = styled.div<{ $color: string; $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 0.5625rem;
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  color: ${({ $color, $active }) => ($active ? $color : "#52525b")};
  padding: 1px 6px;
  border-radius: 3px;
  background: ${({ $color, $active }) =>
    $active ? `${$color}15` : "transparent"};
  border: 1px solid ${({ $color, $active }) =>
    $active ? `${$color}30` : "transparent"};
`;

const PlatformDot = styled.span<{ $color: string }>`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`;

const ReadabilityBadge = styled.span<{ $color: string }>`
  font-size: 0.5625rem;
  font-weight: 600;
  color: ${({ $color }) => $color};
  padding: 1px 6px;
  border-radius: 3px;
  background: ${({ $color }) => `${$color}15`};
  border: 1px solid ${({ $color }) => `${$color}30`};
  margin-left: auto;
  cursor: help;
`;

const PlatformWarnings = styled.div`
  margin-top: 0.375rem;
  padding-top: 0.375rem;
  border-top: 1px solid #1f1f1f;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const PlatformWarningItem = styled.div<{ $status: string }>`
  font-size: 0.5625rem;
  color: ${({ $status }) => ($status === "hard" ? "#fca5a5" : "#fcd34d")};
  line-height: 1.4;
`;

const RephraseButton = styled.button`
  margin-left: 0.375rem;
  padding: 1px 7px;
  font-size: 0.5625rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #c4b5fd;
  background: rgba(124, 58, 237, 0.18);
  border: 1px solid rgba(124, 58, 237, 0.35);
  border-radius: 3px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  line-height: 1.5;
  white-space: nowrap;
  transition: background 0.15s, border-color 0.15s;

  &:hover {
    background: rgba(124, 58, 237, 0.28);
    border-color: rgba(124, 58, 237, 0.5);
    color: #ddd6fe;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

// ---- Iterative refinement bar ----

const RefineBar = styled.div`
  margin-top: 0.625rem;
  padding: 0.5rem;
  background: #0a0a0a;
  border-radius: 6px;
  border: 1px solid #1a1a1a;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

const RefineLabel = styled.span`
  font-size: 0.5625rem;
  font-weight: 600;
  color: #52525b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const RefineChipRow = styled.div`
  display: flex;
  gap: 0.3125rem;
  flex-wrap: wrap;
  align-items: center;
`;

const RefineChip = styled.button<{ $active?: boolean }>`
  font-size: 0.625rem;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid ${({ $active }) => ($active ? "rgba(124, 58, 237, 0.4)" : "#2a2a2a")};
  background: ${({ $active }) => ($active ? "rgba(124, 58, 237, 0.12)" : "transparent")};
  color: ${({ $active }) => ($active ? "#c4b5fd" : "#71717a")};
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;

  &:hover {
    border-color: rgba(124, 58, 237, 0.35);
    color: #a1a1aa;
    background: rgba(124, 58, 237, 0.06);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const RefineInputRow = styled.div`
  display: flex;
  gap: 0.375rem;
  align-items: center;
`;

const RefineInput = styled.input`
  flex: 1;
  font-size: 0.6875rem;
  padding: 4px 8px;
  background: #0d0d0d;
  border: 1px solid #1f1f1f;
  border-radius: 4px;
  color: #d4d4d4;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;

  &::placeholder {
    color: #3f3f46;
  }

  &:focus {
    border-color: rgba(124, 58, 237, 0.35);
  }
`;

const RefineSubmit = styled.button`
  font-size: 0.625rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid rgba(124, 58, 237, 0.3);
  background: rgba(124, 58, 237, 0.15);
  color: #c4b5fd;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;

  &:hover {
    background: rgba(124, 58, 237, 0.25);
    border-color: rgba(124, 58, 237, 0.45);
    color: #ddd6fe;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const RefineSpinner = styled.span`
  display: inline-block;
  width: 10px;
  height: 10px;
  border: 1.5px solid rgba(124, 58, 237, 0.3);
  border-top-color: #c4b5fd;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// ---- Hook pattern annotation ----

const HookAnnotation = styled.div`
  margin-top: 0.3125rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
`;

const HookBadge = styled.span<{ $confidence: string }>`
  font-size: 0.5625rem;
  font-weight: 600;
  padding: 1px 7px;
  border-radius: 3px;
  background: ${({ $confidence }) =>
    $confidence === "ai" ? "rgba(139, 92, 246, 0.15)" : "rgba(113, 113, 122, 0.1)"};
  border: 1px solid ${({ $confidence }) =>
    $confidence === "ai" ? "rgba(139, 92, 246, 0.3)" : "rgba(113, 113, 122, 0.2)"};
  color: ${({ $confidence }) =>
    $confidence === "ai" ? "#c4b5fd" : "#a1a1aa"};
  cursor: help;
  white-space: nowrap;
`;

const HookExplanation = styled.span`
  font-size: 0.5625rem;
  color: #52525b;
  line-height: 1.3;
  flex: 1;
  min-width: 0;
`;

// ---- Voice profile indicator (Brand Voice Memory) ----

const VoiceIndicator = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.625rem;
  color: #a1a1aa;
  margin-left: 4px;
`;

const VoiceLabel = styled.span`
  color: #71717a;
`;

const VoiceToneChip = styled.span<{ $override?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 0.5625rem;
  font-weight: 500;
  background: ${({ $override }) =>
    $override ? "rgba(245,158,11,0.1)" : "rgba(139,92,246,0.08)"};
  color: ${({ $override }) => ($override ? "#b45309" : "#7c3aed")};
`;

const VoiceOverrideLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: 0.5625rem;
  color: #a1a1aa;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover {
    color: #71717a;
  }
`;

// ---- Inline per-variant violation display ----

const ViolationList = styled.div`
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ViolationItem = styled.div<{ $severity: string }>`
  display: flex;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  background: ${({ $severity }) =>
    $severity === "high"
      ? "rgba(239,68,68,0.06)"
      : $severity === "medium"
        ? "rgba(245,158,11,0.06)"
        : "rgba(59,130,246,0.04)"};
  border: 1px solid
    ${({ $severity }) =>
      $severity === "high"
        ? "rgba(239,68,68,0.25)"
        : $severity === "medium"
          ? "rgba(245,158,11,0.25)"
          : "rgba(59,130,246,0.15)"};
`;

const ViolationBadge = styled.span<{ $severity: string }>`
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 5px;
  border-radius: 3px;
  white-space: nowrap;
  height: fit-content;
  color: ${({ $severity }) =>
    $severity === "high"
      ? "#ef4444"
      : $severity === "medium"
        ? "#f59e0b"
        : "#3b82f6"};
  background: ${({ $severity }) =>
    $severity === "high"
      ? "rgba(239,68,68,0.15)"
      : $severity === "medium"
        ? "rgba(245,158,11,0.15)"
        : "rgba(59,130,246,0.1)"};
`;

const ViolationText = styled.div`
  font-size: 11px;
  color: #d1d5db;
  line-height: 1.4;
`;

const ViolationSuggestion = styled.div`
  margin-top: 3px;
  font-size: 10px;
  color: #fbbf24;
  font-style: italic;
`;

const FixVariantButton = styled.button`
  margin-top: 4px;
  padding: 5px 10px;
  font-size: 10px;
  font-weight: 600;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.08);
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-radius: 5px;
  cursor: pointer;
  align-self: flex-start;
  &:hover {
    background: rgba(251, 191, 36, 0.15);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// ---- Compliance warning (post-check) ----

const ComplianceWarningBox = styled.div`
  margin-top: 10px;
  padding: 10px 12px;
  background: rgba(245, 158, 11, 0.06);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 8px;
`;

const FallbackWarningBox = styled.div`
  margin-top: 10px;
  padding: 10px 12px;
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  color: #f87171;
  line-height: 1.4;
`;

const ComplianceWarningTitle = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: #f59e0b;
  margin-bottom: 6px;
`;

const ComplianceWarningItem = styled.div`
  font-size: 10px;
  color: #fcd34d;
  margin-bottom: 3px;
  padding-left: 6px;
  border-left: 2px solid rgba(245, 158, 11, 0.3);
  line-height: 1.4;
`;

const SubmitButton = styled.button`
  padding: 10px 28px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover:not(:disabled) {
    background: #059669;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// ---- Mode Selector (Brand vs Promotional) ----

const ModeGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 8px;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const ModeCard = styled.button<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 20px;
  background: ${({ $active }) =>
    $active ? "rgba(124, 58, 237, 0.12)" : "rgba(255, 255, 255, 0.03)"};
  border: 2px solid ${({ $active }) => ($active ? "#7c3aed" : "#2d2d4a")};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  color: inherit;

  &:hover {
    border-color: ${({ $active }) => ($active ? "#7c3aed" : "#4a4a6a")};
    background: ${({ $active }) =>
      $active ? "rgba(124, 58, 237, 0.16)" : "rgba(255, 255, 255, 0.06)"};
  }
`;

const ModeCardEmoji = styled.span`
  font-size: 28px;
  margin-bottom: 4px;
`;

const ModeCardLabel = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: #e5e7eb;
`;

const ModeCardDesc = styled.span`
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.5;
`;

// ---- Categorized template sections (new tone-adaptive system) ----

const CategorySection = styled.div`
  margin-bottom: 14px;
  &:last-child {
    margin-bottom: 0;
  }
`;

const CategoryHeader = styled.div`
  font-size: 10px;
  font-weight: 700;
  color: #7c3aed;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 6px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(124, 58, 237, 0.2);
`;

const CategoryTemplateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 6px;

  @media (max-width: 480px) {
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  }
`;

const CategoryTemplateCard = styled.button<{ $active: boolean }>`
  padding: 8px 10px;
  border: 1px solid ${({ $active }) => ($active ? "#7c3aed" : "#2d2d4a")};
  border-radius: 6px;
  background: ${({ $active }) =>
    $active ? "rgba(124, 58, 237, 0.12)" : "#0d0d1a"};
  cursor: pointer;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 3px;
  transition: all 0.15s;
  ${({ $active }) =>
    $active && "box-shadow: 0 0 0 1px rgba(124, 58, 237, 0.3);"}
  &:hover:not(:disabled) {
    border-color: #7c3aed;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;
