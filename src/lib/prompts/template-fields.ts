// src/lib/prompts/template-fields.ts
// ============================================================================
// TEMPLATE DETAIL FIELDS — Per-category input fields that appear below the
// selected template in step 2, capturing bar-specific details the AI uses
// to generate more unique, venue-anchored content.
// ============================================================================

import { PROMOTION_TEMPLATES, type TemplateCategory } from "./promotion-templates";

// ---- Types ----

export interface TemplateField {
  id: string;
  type: "text" | "textarea";
  label: { en: string; fi: string };
  placeholder: { en: string; fi: string };
}

interface CategoryFieldConfig {
  category: TemplateCategory;
  fields: TemplateField[];
}

// ---- Shared "additional details" field (appended to every category) ----

const NOTES_FIELD: TemplateField = {
  id: "notes",
  type: "textarea",
  label: {
    en: "Anything else the AI should know?",
    fi: "Mitä muuta tekoälyn tulisi tietää?",
  },
  placeholder: {
    en: "e.g. special menu items, a guest performer's name, a theme you have in mind, a specific atmosphere you want to capture",
    fi: "esim. erikoismenu, vierailijan nimi, teema mielessä, tietty tunnelma jonka haluat vangita",
  },
};

// ---- Per-category field definitions ----
//
// Each category gets 2 focused text inputs. The "notes" field is
// automatically appended to every category.

const CATEGORY_FIELD_CONFIGS: CategoryFieldConfig[] = [
  // =========================================================================
  // UNIVERSAL — after-work, weekend-special, seasonal-special, regulars-night
  // =========================================================================
  {
    category: "universal",
    fields: [
      {
        id: "draw",
        type: "text",
        label: {
          en: "What's the special draw or offer?",
          fi: "Mikä on erityinen houkutin tai tarjous?",
        },
        placeholder: {
          en: "e.g. extended happy hour, a guest bartender, a limited menu",
          fi: "esim. pidennetty happy hour, vieraileva baarimikko, rajoitettu menu",
        },
      },
      {
        id: "timing",
        type: "text",
        label: {
          en: "Timing or schedule details?",
          fi: "Ajankohta tai aikataulu?",
        },
        placeholder: {
          en: "e.g. every Friday 5-8pm, all weekend, first Thursday of the month",
          fi: "esim. joka perjantai klo 17-20, koko viikonloppu, kuun ensimmäinen torstai",
        },
      },
    ],
  },

  // =========================================================================
  // SOCIAL — quiz-night, karaoke-night, group-celebration, industry-night
  // =========================================================================
  {
    category: "social",
    fields: [
      {
        id: "social_detail",
        type: "text",
        label: {
          en: "What makes this social event unique?",
          fi: "Mikä tekee tästä sosiaalisesta tapahtumasta ainutlaatuisen?",
        },
        placeholder: {
          en: "e.g. movie-themed quiz, 90s karaoke, birthday package with reserved tables, hospitality industry mixer",
          fi: "esim. elokuvateemainen visa, 90-luvun karaoke, syntymäpäiväpaketti varatuin pöydin, ravintola-alan verkostoitumistilaisuus",
        },
      },
      {
        id: "format",
        type: "text",
        label: {
          en: "Format or structure?",
          fi: "Tapahtuman muoto tai rakenne?",
        },
        placeholder: {
          en: "e.g. teams of 4-6, open sign-up, hosted by a local personality, come-and-go format",
          fi: "esim. 4-6 hengen joukkueet, avoin ilmoittautuminen, paikallisen persoonan juontama, vapaa saapuminen",
        },
      },
    ],
  },

  // =========================================================================
  // FOOD — tasting-menu, food-drink-pairing, chefs-special, brunch-service
  // =========================================================================
  {
    category: "food",
    fields: [
      {
        id: "cuisine",
        type: "text",
        label: {
          en: "What's the cuisine or food focus?",
          fi: "Mikä on keittiön tai ruoan painotus?",
        },
        placeholder: {
          en: "e.g. Nordic tasting menu, wine & cheese pairings, chef's signature ramen, fusion brunch",
          fi: "esim. pohjoismainen tasting-menu, viini-juusto -pairingit, kokin signature-ramen, fuusio-brunssi",
        },
      },
      {
        id: "service_style",
        type: "text",
        label: {
          en: "Service style or format?",
          fi: "Tarjoilutyyli tai muoto?",
        },
        placeholder: {
          en: "e.g. 5-course seated, roaming canapés, build-your-own station, buffet with live cooking",
          fi: "esim. 5 ruokalajin illallinen, kiertävät canapét, build-your-own -piste, buffet elävällä kokkauksella",
        },
      },
    ],
  },

  // =========================================================================
  // ENTERTAINMENT — live-music, dj-night, sports-screening, open-mic
  // =========================================================================
  {
    category: "entertainment",
    fields: [
      {
        id: "entertainment_detail",
        type: "text",
        label: {
          en: "Who or what is performing?",
          fi: "Kuka tai mitä esiintyy?",
        },
        placeholder: {
          en: "e.g. acoustic jazz trio, local DJ collective, Champions League final, poetry + comedy open mic",
          fi: "esim. akustinen jazz-trio, paikallinen DJ-kollektiivi, Mestarien liigan finaali, runous + komedia open mic",
        },
      },
      {
        id: "schedule",
        type: "text",
        label: {
          en: "Schedule or timing?",
          fi: "Aikataulu?",
        },
        placeholder: {
          en: "e.g. doors 7pm, music from 8pm, kickoff at 9pm, sign-up from 6pm, show at 7pm",
          fi: "esim. ovet klo 19, musiikki klo 20 alkaen, aloitus klo 21, ilmoittautuminen klo 18, esitys klo 19",
        },
      },
    ],
  },

  // =========================================================================
  // PREMIUM — cocktail-masterclass, meet-the-maker, private-tasting, rare-release
  // =========================================================================
  {
    category: "premium",
    fields: [
      {
        id: "exclusivity",
        type: "text",
        label: {
          en: "What makes this exclusive or premium?",
          fi: "Mikä tekee tästä eksklusiivisen?",
        },
        placeholder: {
          en: "e.g. limited to 12 guests, a rare single-barrel release, the distiller flying in from Scotland, library of vintage Chartreuse",
          fi: "esim. rajoitettu 12 vieraalle, harvinainen single-barrel -julkaisu, tislaaja saapuu Skotlannista, vintage-Chartreusen kirjasto",
        },
      },
      {
        id: "capacity",
        type: "text",
        label: {
          en: "Capacity, price, or access details?",
          fi: "Kapasiteetti, hinta tai pääsyn yksityiskohdat?",
        },
        placeholder: {
          en: "e.g. 20 seats, €45/person, members first then public, pre-booking required",
          fi: "esim. 20 paikkaa, 45 €/hlö, jäsenet ensin sitten yleisö, ennakkovaraus pakollinen",
        },
      },
    ],
  },

  // =========================================================================
  // COMMUNITY — neighbourhood-night, local-artist, charity-fundraiser, new-in-town
  // =========================================================================
  {
    category: "community",
    fields: [
      {
        id: "community_angle",
        type: "text",
        label: {
          en: "What's the community connection?",
          fi: "Mikä on yhteisöllinen kytkös?",
        },
        placeholder: {
          en: "e.g. Kallio locals' discount, showcasing a Töölö painter, fundraiser for the local animal shelter, welcoming new students",
          fi: "esim. Kallion paikallisten alennus, Töölöläisen taidemaalarin näyttely, keräys paikalliselle eläinsuojalle, uusien opiskelijoiden tervetulotoivotus",
        },
      },
      {
        id: "partner",
        type: "text",
        label: {
          en: "Partner, cause, or special element?",
          fi: "Kumppani, kohde tai erityiselementti?",
        },
        placeholder: {
          en: "e.g. partnering with a neighbourhood bakery, proceeds to charity, the artist will be present, welcome drink included",
          fi: "esim. yhteistyö alueen leipomon kanssa, tuotto hyväntekeväisyyteen, taiteilija on paikalla, tervetulojuoma sisältyy",
        },
      },
    ],
  },
];

// ---- Public API ----

/**
 * Return the input fields for a given template ID.
 * Returns category-specific fields + the shared notes field.
 */
export function getFieldsForTemplate(templateId: string): TemplateField[] {
  const template = PROMOTION_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return [];
  const config = CATEGORY_FIELD_CONFIGS.find(
    (c) => c.category === template.category,
  );
  if (!config) return [NOTES_FIELD];
  return [...config.fields, NOTES_FIELD];
}

/**
 * Format template field values as a readable string for prompt injection.
 * Skips empty values. Language selects which labels to use.
 */
export function formatTemplateFieldValues(
  values: Record<string, string>,
  language: "en" | "fi",
): string {
  // Build a label map from all field configs
  const labelMap: Record<string, { en: string; fi: string }> = {};
  for (const config of CATEGORY_FIELD_CONFIGS) {
    for (const field of config.fields) {
      labelMap[field.id] = field.label;
    }
  }
  labelMap[NOTES_FIELD.id] = NOTES_FIELD.label;

  const entries = Object.entries(values).filter(
    ([, v]) => v.trim().length > 0,
  );
  if (entries.length === 0) return "";

  const isFi = language === "fi";
  const lines = entries.map(
    ([key, value]) =>
      `- ${labelMap[key]?.[language] || key}: ${value.trim()}`,
  );

  return isFi
    ? `\n\nLISÄTIEDOT:\n${lines.join("\n")}`
    : `\n\nADDITIONAL DETAILS:\n${lines.join("\n")}`;
}
