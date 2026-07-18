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

// ---- Types ----

type Language = "fi" | "en";
type FlowStep = "type" | "brief" | "refine" | "images" | "schedule" | "publish";

interface UnifiedCreationFlowProps {
  barId: string;
  barName?: string;
  barCoverImage?: string | null;
  contentType: ContentType;
  creationMode?: "brand" | "promotional";
  onModeChange?: (mode: "brand" | "promotional") => void;
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
}

// ---- Constants ----

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

/** Builds a label→value lookup map from the current suggestion set. */
function getContextValueMap(language: Language): Map<string, string> {
  return new Map(
    getContextualSuggestions(language).map((s) => [s.label, s.value]),
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

// ---- Build live preview of the combined prompt from ingredients ----

function buildPreviewPrompt(
  barName: string,
  prompt: string,
  template: string | null,
  tone: ContentTone | null,
  contexts: string[],
  language: Language,
): string {
  const parts: string[] = [];
  const isFi = language === "fi";

  if (template) {
    const chars = TEMPLATE_CHARACTERISTICS[template];
    const traits = chars ? (isFi ? chars.fi : chars.en) : null;
    parts.push(
      isFi
        ? `Mallipohja: ${template}${traits ? ` — ${traits}` : ""}`
        : `Template: ${template}${traits ? ` — ${traits}` : ""}`,
    );
  }

  if (tone) {
    const toneLabel = TONE_OPTIONS.find((t) => t.value === tone)?.label || tone;
    parts.push(isFi ? `Äänensävy: ${toneLabel}` : `Tone: ${toneLabel}`);
  }

  if (contexts.length > 0) {
    parts.push(
      isFi
        ? `Konteksti: ${contexts.join(", ")}`
        : `Context: ${contexts.join(", ")}`,
    );
  }

  if (prompt.trim()) {
    parts.push(
      isFi ? `\nKuvaus:\n${prompt.trim()}` : `\nBrief:\n${prompt.trim()}`,
    );
  }

  if (parts.length === 0) return "";

  parts.push(
    isFi
      ? `\n\n→ Näistä aineksista luodaan 3 uniikkia varianttia baarille "${barName}".`
      : `\n\n→ From these ingredients, 3 unique variants will be created for "${barName}".`,
  );

  return parts.join("\n");
}

// ---- Component ----

export default function UnifiedCreationFlow({
  barId,
  barName = "Your Bar",
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

  // Derive templates based on content type
  const activeTemplates = useMemo(() => {
    if (contentType === "event") return EVENT_TEMPLATES[language];
    if (contentType === "pass") return PASS_TEMPLATES[language];
    return TEMPLATES[language];
  }, [contentType, language]);

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

  // Text generation state
  const [variants, setVariants] = useState<EditableVariant[]>([]);
  const [generatingText, setGeneratingText] = useState(false);

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

  const token =
    typeof window !== "undefined" ? localStorage.getItem("hoppr_token") : null;

  // ---- Tone ----

  const handleToneSelect = (tone: ContentTone) => {
    const newTone = activeTone === tone ? null : tone;
    setActiveTone(newTone);

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
      return;
    }

    setActiveTemplate(label);
    const wizard = getWizardForTemplate(label);

    if (wizard) {
      setWizardActive(true);
      setWizardStep(0);
      setWizardAnswers({});
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

    if (wizardStep < wizardSteps.length - 1) {
      setWizardStep(wizardStep + 1);
      setText(assembleWizardPrompt(updated, barName, language));
    } else {
      // Wizard complete — close templates, open context
      setWizardActive(false);
      setTemplatesOpen(false);
      setContextOpen(true);
      setText(assembleWizardPrompt(updated, barName, language));
    }
  };

  const handleWizardBack = () => {
    if (wizardStep > 0) {
      const currentStepLabel = wizardSteps[wizardStep].label;
      const updated = { ...wizardAnswers };
      delete updated[currentStepLabel];
      setWizardAnswers(updated);
      setWizardStep(wizardStep - 1);
      setText(assembleWizardPrompt(updated, barName, language));
    }
  };

  const handleWizardDismiss = () => {
    setWizardActive(false);
    setTemplatesOpen(false);
    setContextOpen(true);
  };

  // ---- Regenerate brief — re-calls AI with new nonce for guaranteed different output ----

  const handleRegenerateBrief = () => {
    nonceRef.current += 1;
    handleGenerateText();
  };

  // ---- Toggle context tag ----

  const handleToggleContext = (suggestion: ContextSuggestion) => {
    setSelectedContexts((prev) => {
      if (prev.includes(suggestion.label)) {
        return prev.filter((s) => s !== suggestion.label);
      }
      return [...prev, suggestion.label];
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
      };
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
            accentColor: "#7c3aed",
            titleFontStyle: null,
            conditions: "",
            visualDirection: null,
            fluxPrompt: (bv.imagePrompt as string) || "",
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
                    (label) => getContextValueMap(language).get(label) || label,
                  )
                : undefined,
            language,
            numVariants: 3,
            nonce: nonceRef.current,
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
        const editableVariants: EditableVariant[] = rawVariants.map((v) => {
          const vd = v.visualDirection as
            | EditableVariant["visualDirection"]
            | undefined;
          return {
            title: (v.title as string) || "",
            description: (v.description as string) || "",
            type: (v.type as string) || type,
            discount: (v.discount as number) ?? null,
            callToAction: (v.callToAction as string) || "",
            accentColor: (v.accentColor as string) || "#7c3aed",
            titleFontStyle: (v.titleFontStyle as string) || null,
            conditions: (v.conditions as string) || "",
            visualDirection: vd || null,
            fluxPrompt: buildInitialFluxPrompt(vd),
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

      const variantVDs = variants.map((v, i) => ({
        visualDirection: {
          description: v.fluxPrompt || v.visualDirection?.description || "",
          keyElements: v.visualDirection?.keyElements || [],
          styleNotes: v.visualDirection?.styleNotes || "",
        },
        formContext: {
          title: v.title,
          description: v.description,
          promotionType: v.type,
          barName,
        },
      }));

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
                  description:
                    v.fluxPrompt || v.visualDirection?.description || "",
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
                onClick={() => onModeChange?.("brand")}
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
            </ModeGrid>

            <SectionLabel style={{ marginTop: 20 }}>
              {language === "fi"
                ? "Valitse sisältötyyppi"
                : "Choose content type"}
            </SectionLabel>
            <TypeGrid>
              {TYPE_OPTIONS.filter((opt) => {
                // Brand mode: hide Promotion (brand content has no prices/deals)
                if (creationMode === "brand" && opt.value === "promotion")
                  return false;
                return true;
              }).map((opt) => (
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

        {/* ===== STEP 2: BRIEF ===== */}
        {step === "brief" && (
          <div>
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
                      {toneLabel?.emoji} {toneLabel?.label}
                    </HelperActiveTag>
                  )}
                </HelperToggleLabel>
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
                          <span>{opt.emoji}</span> {opt.label}
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
                  {activeTemplate && (
                    <HelperActiveTag>{activeTemplate}</HelperActiveTag>
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
                      ? "Klikkaa mallia täyttääksesi briefin. Mallit joissa on ohjattu toiminto auttavat rakentamaan briefin vaihe vaiheelta."
                      : "Click a template to fill your brief. Templates with a wizard guide you step by step."}
                  </HelperDesc>
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
                    {language === "fi"
                      ? "Kausiluonteiset vinkit"
                      : "Seasonal hooks"}
                  </HelperHint>
                )}
              </HelperToggle>
              {contextOpen && (
                <HelperBody>
                  <HelperDesc>
                    {language === "fi"
                      ? "Lisää ajankohtainen konteksti briefiin yhdellä klikkauksella."
                      : "Add timely context to your brief with one click."}
                  </HelperDesc>
                  <SuggestionRow>
                    {getContextualSuggestions(language).map((suggestion, i) => {
                      const isSelected = selectedContexts.includes(
                        suggestion.label,
                      );
                      return (
                        <SuggestionChip
                          key={i}
                          $selected={isSelected}
                          onClick={() => handleToggleContext(suggestion)}
                          disabled={generatingText}
                          title={suggestion.value}
                        >
                          {isSelected ? "✓ " : ""}
                          {suggestion.label}
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
                      {toneLabel?.emoji} {toneLabel?.label}
                    </IngredientTag>
                  )}
                  {activeTemplate && (
                    <IngredientTag $kind="template">
                      {activeTemplate}
                    </IngredientTag>
                  )}
                  {selectedContexts.map((ctx, i) => (
                    <IngredientTag
                      key={i}
                      $kind="context"
                      onClick={() => handleRemoveContext(ctx)}
                      style={{ cursor: "pointer" }}
                      title={getContextValueMap(language).get(ctx) || ctx}
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

            {/* Live preview of the combined prompt */}
            {!hasIngredients ? (
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
                      text,
                      activeTemplate,
                      activeTone,
                      selectedContexts.map(
                        (label) =>
                          getContextValueMap(language).get(label) || label,
                      ),
                      language,
                    )
                      .split("\n")
                      .map((line, i) => (
                        <PreviewLine key={i}>{line || " "}</PreviewLine>
                      ))}
                  </PreviewBody>
                )}
              </PreviewSection>
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

            {/* Generate button */}
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

            {error && <ErrorBox>{error}</ErrorBox>}
            <BackLink onClick={goBack}>
              {language === "fi" ? "← Vaihda tyyppi" : "← Change type"}
            </BackLink>
          </div>
        )}

        {/* ===== STEP 3: REFINE (Review & Edit Text) ===== */}
        {step === "refine" && variants.length > 0 && (
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

            {contentType === "promotion" && (
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
  object-fit: cover;
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

const FieldInput = styled.input`
  ${inputStyles}
`;
const FieldTextarea = styled.textarea`
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
