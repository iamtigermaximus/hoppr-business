// src/lib/prompts/build-image-prompt.ts
// Converts structured user selections (style + subject + composition +
// image world + time/season/energy context) into a complete AI image prompt.
//
// No free-text typing required. The user picks from dropdowns/chips.
// This function assembles the prompt and runs it through the compliance
// filter before returning.
//
// Extended for the advertising hub (2026-07-18): image world switching,
// time-of-day / season / room-energy injection, per-generation uniqueness.

import {
  checkPromptCompliance,
  type StylePreset,
  type SubjectPreset,
  type CompositionPreset,
  type ImageWorld,
  imageWorldContainsAlcohol,
  subjectsForImageWorld,
  stylesForImageWorld,
  STYLE_PRESETS,
  SUBJECT_PRESETS,
  COMPOSITION_PRESETS,
} from "@/lib/compliance/image-compliance";
import type { ContentType } from "@/components/bar/create/types";

// ---- Public API ----

export interface VisualDirection {
  description: string;
  keyElements: string[];
  styleNotes: string;
}

export interface PromptSelections {
  styleId: string;
  subjectId: string;
  compositionId: string;
  /** Additional context from the form (bar name, promo title, description) */
  context: string;
  /** AI-generated visual scene description — when provided, becomes the
   *  primary prompt content. Style/subject/composition act as framing. */
  visualDirection?: VisualDirection;
  // ---- New (advertising hub) ----
  /** Which image world (Kuvamaailma) — controls subject availability and
   *  whether alcohol-specific compliance checks run. */
  imageWorld?: ImageWorld;
  /** Time of day for lighting/atmosphere injection. */
  timeOfDay?: TimeOfDay;
  /** Season for seasonal atmosphere and weather context. */
  season?: SeasonContext;
  /** Room energy / crowd density for people-presence guidance. */
  roomEnergy?: RoomEnergy;
  /** Bar focal point — what aspect of the bar to emphasize (baari world only). */
  focalPoint?: FocalPoint;
  /** Per-generation uniqueness seed. Each call with a different nonce
   *  produces a subtly different image even with identical other params.
   *  Use a counter, timestamp, or UUID. */
  nonce?: number;
}

export interface BuiltPrompt {
  /** The final prompt, compliance-wrapped and ready for the image API */
  finalPrompt: string;
  /** Human-readable summary shown in the UI before generation */
  preview: string;
  /** The raw selections (for display) */
  selections: {
    style: StylePreset;
    subject: SubjectPreset;
    composition: CompositionPreset;
  };
  /** Compliance check result */
  compliance: {
    passed: boolean;
    blockedReasons: string[];
    warnings: string[];
  };
}

// ---- Time of day ----

export type TimeOfDay =
  | "morning"
  | "midday"
  | "afternoon"
  | "golden_hour"
  | "dusk"
  | "evening"
  | "late_night"
  | "midnight";

const TIME_OF_DAY_PROMPTS: Record<TimeOfDay, string> = {
  morning: "Early morning light, soft dawn glow, dew and freshness, low-angle sun casting long shadows",
  midday: "Bright midday sun, crisp shadows, clear sky, vibrant colors at full saturation",
  afternoon: "Warm afternoon light, gentle shadows lengthening, relaxed daytime atmosphere",
  golden_hour: "Golden hour light, warm amber glow, long dramatic shadows, rich color temperature, the magic hour before sunset",
  dusk: "Blue hour transition, sky shifting from gold to deep blue, first lights appearing, atmospheric twilight",
  evening: "Evening atmosphere, artificial lights dominating, warm interior glow contrasting with dark exterior",
  late_night: "Deep night, ambient lighting only, intimate darkness with selective illumination, quiet hours energy",
  midnight: "Midnight darkness, deep shadows, minimal light sources, mysterious and still, the world asleep",
};

export const TIME_OF_DAY_LABELS: Record<TimeOfDay, { fi: string; en: string }> = {
  morning: { fi: "Aamu", en: "Morning" },
  midday: { fi: "Keskipäivä", en: "Midday" },
  afternoon: { fi: "Iltapäivä", en: "Afternoon" },
  golden_hour: { fi: "Kultainen tunti", en: "Golden Hour" },
  dusk: { fi: "Iltahämärä", en: "Dusk" },
  evening: { fi: "Ilta", en: "Evening" },
  late_night: { fi: "Myöhäisilta", en: "Late Night" },
  midnight: { fi: "Keskiyö", en: "Midnight" },
};

// ---- Season ----

export type SeasonContext =
  | "early_spring"
  | "spring"
  | "late_spring"
  | "vappu"
  | "early_summer"
  | "midsummer"
  | "juhannus"
  | "high_summer"
  | "late_summer"
  | "early_autumn"
  | "autumn"
  | "late_autumn"
  | "early_winter"
  | "deep_winter";

const SEASON_PROMPTS: Record<SeasonContext, string> = {
  early_spring: "Early spring, melting snow, first patches of bare ground, pale sunlight, buds appearing on branches",
  spring: "Spring in Finland, fresh green growth, longer days, bright clean light, nature waking up",
  late_spring: "Late spring, full greenery returning, warm days beginning, outdoor energy, everything in bloom",
  vappu: "Vappu season, May Day celebration atmosphere, spring at its peak, carnival energy, balloons and streamers, festive urban scene",
  early_summer: "Early summer, fresh green everywhere, long daylight, the promise of the season ahead, lush and vibrant",
  midsummer: "Midsummer, the longest days of the year, endless twilight, nature at full power, warm evenings",
  juhannus: "Juhannus, the height of Finnish summer celebration, bonfires by the water, white nights, cottage season, the most magical time of year",
  high_summer: "High summer, hot days, deep green landscape, golden evening light that lasts until midnight, peak outdoor living",
  late_summer: "Late summer, harvest gold tones, warm days cooling toward evening, the season turning, bittersweet beauty",
  early_autumn: "Early autumn, first yellow leaves, crisp air, golden afternoon light, ruska beginning, the most photogenic Finnish season",
  autumn: "Autumn in full ruska, brilliant reds and golds, low warm sun, the landscape on fire with color, cozy energy returning",
  late_autumn: "Late autumn, bare branches, grey skies, first frost, the quiet before winter, stark and beautiful",
  early_winter: "Early winter, first snow, clean white landscape, pale low light, the world transformed overnight, magical stillness",
  deep_winter: "Deep winter, heavy snow, dark days with short blue twilight, extreme cold beauty, ice and stillness, the heart of Nordic winter",
};

export const SEASON_LABELS: Record<SeasonContext, { fi: string; en: string }> = {
  early_spring: { fi: "Alkukevät", en: "Early Spring" },
  spring: { fi: "Kevät", en: "Spring" },
  late_spring: { fi: "Myöhäiskevät", en: "Late Spring" },
  vappu: { fi: "Vappu", en: "Vappu" },
  early_summer: { fi: "Alkukesä", en: "Early Summer" },
  midsummer: { fi: "Keskikesä", en: "Midsummer" },
  juhannus: { fi: "Juhannus", en: "Juhannus" },
  high_summer: { fi: "Korkea kesä", en: "High Summer" },
  late_summer: { fi: "Loppukesä", en: "Late Summer" },
  early_autumn: { fi: "Alkusyksy", en: "Early Autumn" },
  autumn: { fi: "Syksy", en: "Autumn" },
  late_autumn: { fi: "Myöhäissyksy", en: "Late Autumn" },
  early_winter: { fi: "Alkutalvi", en: "Early Winter" },
  deep_winter: { fi: "Sydäntalvi", en: "Deep Winter" },
};

// ---- Room energy / crowd density ----

export type RoomEnergy =
  | "opening"
  | "quiet_hours"
  | "building_up"
  | "steady_hum"
  | "buzzing"
  | "packed"
  | "peak";

const ROOM_ENERGY_PROMPTS: Record<RoomEnergy, string> = {
  opening: "Just opening, quiet and pristine, the calm before guests arrive, fresh and ready, anticipation in the air",
  quiet_hours: "Quiet hours, early evening calm, a few early guests, relaxed and unhurried, intimate atmosphere",
  building_up: "Building up, the energy rising, more guests arriving, the room coming alive, the transition from calm to lively",
  steady_hum: "Steady comfortable buzz, the room at its natural rhythm, lively but not crowded, conversation flowing, the sweet spot",
  buzzing: "Buzzing with energy, the room full and vibrant, lively conversations everywhere, the place is happening",
  packed: "Packed house, standing room only, maximum energy, the crowd moving as one, electric atmosphere",
  peak: "Peak of the night, the highest energy moment, everyone present, the unforgettable climax, this is what they came for",
};

export const ROOM_ENERGY_LABELS: Record<RoomEnergy, { fi: string; en: string }> = {
  opening: { fi: "Avautumassa", en: "Just Opening" },
  quiet_hours: { fi: "Hiljaiset tunnit", en: "Quiet Hours" },
  building_up: { fi: "Täyttymässä", en: "Building Up" },
  steady_hum: { fi: "Tasainen hyrinä", en: "Steady Hum" },
  buzzing: { fi: "Vilkas", en: "Buzzing" },
  packed: { fi: "Täynnä", en: "Packed" },
  peak: { fi: "Illan huippu", en: "Peak" },
};

// ---- Bar focal point ----

export type FocalPoint =
  | "bar_counter"
  | "seating"
  | "terrace"
  | "details"
  | "lighting"
  | "stage"
  | "entrance"
  | "people"
  | "in_the_glass"
  | "walls_stories";

const FOCAL_POINT_PROMPTS: Record<FocalPoint, string> = {
  bar_counter: "The bar counter as focal point — bottles, taps, the bartender's workspace, the heart of the operation",
  seating: "The seating area as focal point — tables, chairs, booths, the space where guests settle in and stay",
  terrace: "The terrace as focal point — outdoor seating, the boundary between inside and outside, fresh air and city views",
  details: "The small details as focal point — textures, materials, craftsmanship, the things you notice when you stay a while",
  lighting: "The lighting as focal point — lamps, candles, neon, the fixtures that create the atmosphere, light as architecture",
  stage: "The stage or performance area as focal point — where the music happens, the spotlight, the performer's domain",
  entrance: "The entrance as focal point — the threshold, the first impression, the moment of arrival, the door that promises what's inside",
  people: "The people as focal point — the crowd, the energy, the social fabric, faces in soft focus, the human element without identifying individuals",
  in_the_glass: "The drink itself as focal point — the pour, the garnish, the condensation on the glass, the craft in liquid form",
  walls_stories: "The walls and their stories as focal point — art, photographs, memorabilia, the visual history of the place, what the walls have seen",
};

export const FOCAL_POINT_LABELS: Record<FocalPoint, { fi: string; en: string }> = {
  bar_counter: { fi: "Baaritiski", en: "Bar Counter" },
  seating: { fi: "Istumapaikat", en: "Seating" },
  terrace: { fi: "Terassi", en: "Terrace" },
  details: { fi: "Yksityiskohdat", en: "Details" },
  lighting: { fi: "Valaistus", en: "Lighting" },
  stage: { fi: "Lavalla", en: "Stage" },
  entrance: { fi: "Sisäänkäynti", en: "Entrance" },
  people: { fi: "Ihmiset", en: "People" },
  in_the_glass: { fi: "Lasissa", en: "In the Glass" },
  walls_stories: { fi: "Seinät & tarinat", en: "Walls & Stories" },
};

// ---- Uniqueness modifiers ----

/** Small per-generation variations to ensure each image is distinct.
 *  Indexed by nonce % array length so different nonces produce different
 *  angle/emphasis choices. */
const ANGLE_VARIATIONS = [
  "Slightly low angle, looking slightly upward, emphasizing height and presence",
  "Slightly high angle, looking slightly downward, emphasizing the full scene",
  "Eye-level perspective, natural and immersive, as if the viewer is standing there",
  "Dutch angle, subtle tilt, dynamic and editorial, breaking the horizontal for energy",
  "Straight-on, centered, symmetrical, architectural and deliberate",
];

const EMPHASIS_VARIATIONS = [
  "Emphasize the foreground with shallow depth of field on the background",
  "Emphasize depth, with layers from foreground to background all in focus",
  "Emphasize texture and material — what things feel like, not just what they look like",
  "Emphasize light and shadow — the drama of illumination, not the objects themselves",
  "Emphasize color — the palette, the saturation, the emotional temperature of the scene",
];

const MOOD_VARIATIONS = [
  "The dominant mood: calm and serene",
  "The dominant mood: warm and inviting",
  "The dominant mood: mysterious and intriguing",
  "The dominant mood: vibrant and energetic",
  "The dominant mood: nostalgic and romantic",
];

// ---- Build prompt ----

/** Build a compliance-safe prompt from user selections.
 *  Extended with image world, time/season/energy context, and uniqueness. */
export function buildImagePrompt(
  selections: PromptSelections,
  contentType: ContentType,
): BuiltPrompt {
  const style = STYLE_PRESETS.find((s) => s.id === selections.styleId);
  const subject = SUBJECT_PRESETS.find((s) => s.id === selections.subjectId);
  const composition = COMPOSITION_PRESETS.find((c) => c.id === selections.compositionId);

  if (!style || !subject || !composition) {
    throw new Error("Invalid selection: style, subject, or composition not found.");
  }

  const imageWorld = selections.imageWorld ?? "baari";

  // ---- Assemble raw prompt ----

  let rawPrompt: string;

  if (selections.visualDirection) {
    // AI-generated visual scene — use as primary content with framing
    const vd = selections.visualDirection;
    const elements = vd.keyElements?.length ? `Featuring: ${vd.keyElements.join(", ")}.` : "";
    const notes = vd.styleNotes ? `Photographic style: ${vd.styleNotes}.` : "";
    rawPrompt = [
      vd.description,
      elements,
      notes,
      style.visualPrompt,
      selections.context || "",
    ]
      .filter(Boolean)
      .join(". ");
  } else {
    rawPrompt = [
      style.visualPrompt,
      subject.visualPrompt,
      composition.visualPrompt,
      selections.context || "",
    ]
      .filter(Boolean)
      .join(". ");
  }

  // ---- Inject time-of-day atmosphere ----
  if (selections.timeOfDay) {
    const todPrompt = TIME_OF_DAY_PROMPTS[selections.timeOfDay];
    if (todPrompt) {
      rawPrompt = `${todPrompt}. ${rawPrompt}`;
    }
  }

  // ---- Inject season context ----
  if (selections.season) {
    const seasonPrompt = SEASON_PROMPTS[selections.season];
    if (seasonPrompt) {
      rawPrompt = `${seasonPrompt}. ${rawPrompt}`;
    }
  }

  // ---- Inject room energy (only for venue worlds) ----
  if (selections.roomEnergy && imageWorldContainsAlcohol(imageWorld)) {
    const energyPrompt = ROOM_ENERGY_PROMPTS[selections.roomEnergy];
    if (energyPrompt) {
      rawPrompt = `${energyPrompt}. ${rawPrompt}`;
    }
  }

  // ---- Inject focal point (only for baari world) ----
  if (selections.focalPoint && imageWorld === "baari") {
    const focalPrompt = FOCAL_POINT_PROMPTS[selections.focalPoint];
    if (focalPrompt) {
      rawPrompt = `${focalPrompt}. ${rawPrompt}`;
    }
  }

  // ---- Per-generation uniqueness via nonce ----
  // Each different nonce produces subtly different angle/emphasis/mood
  // even when all other parameters are identical.
  if (selections.nonce !== undefined) {
    const n = selections.nonce;
    const angle = ANGLE_VARIATIONS[n % ANGLE_VARIATIONS.length];
    const emphasis = EMPHASIS_VARIATIONS[(n * 7 + 3) % EMPHASIS_VARIATIONS.length];
    const mood = MOOD_VARIATIONS[(n * 13 + 5) % MOOD_VARIATIONS.length];
    rawPrompt = `${rawPrompt}. ${angle}. ${emphasis}. ${mood}.`;
  }

  // ---- Non-venue worlds: explicitly prevent alcohol in image ----
  if (!imageWorldContainsAlcohol(imageWorld)) {
    // For mood/nature/abstract worlds, instruct the model that alcohol
    // should not appear — the image is about feeling, not drinking.
    rawPrompt = `${rawPrompt}. No alcohol, no bar setting, no drinks visible. This is a mood/atmosphere image, not a venue photograph.`;
  }

  // ---- Run compliance check with image world context ----
  const contentTypeLabel = contentTypeLabelMap[contentType] || "hospitality venue";
  const compliance = checkPromptCompliance(rawPrompt, contentTypeLabel, imageWorld);

  // ---- Build preview for the UI ----
  const previewParts: string[] = [];
  if (imageWorld !== "baari") {
    const worldLabel = imageWorld === "tunnelma" ? "Mood" :
      imageWorld === "kasityo" ? "Craft" :
      imageWorld === "kausi_luonto" ? "Nature" :
      imageWorld === "graafinen" ? "Graphic" :
      imageWorld === "kaupunki" ? "City" : "Abstract";
    previewParts.push(worldLabel);
  }
  previewParts.push(style.label, subject.label, composition.label);
  const preview = previewParts.join(" · ");

  return {
    finalPrompt: compliance.sanitizedPrompt,
    preview,
    selections: { style, subject, composition },
    compliance: {
      passed: compliance.passed,
      blockedReasons: compliance.blockedPatterns,
      warnings: compliance.warnings,
    },
  };
}

/** Build a context string from the current form state for richer prompts. */
export function buildContextFromForm(form: {
  title?: string;
  description?: string;
  promotionType?: string;
  barName?: string;
}): string {
  const parts: string[] = [];

  if (form.barName) {
    parts.push(`${form.barName}`);
  }
  if (form.promotionType) {
    const typeLabel = formatPromotionType(form.promotionType);
    if (typeLabel) parts.push(typeLabel);
  }
  if (form.title) {
    parts.push(form.title);
  }
  if (form.description) {
    const short = form.description.slice(0, 100);
    parts.push(short);
  }

  return parts.join(" — ");
}

// ---- Helpers ----

const contentTypeLabelMap: Record<ContentType, string> = {
  promotion: "bar or nightlife promotion",
  event: "bar event or live music night",
  pass: "VIP bar experience or premium nightlife pass",
  campaign: "bar advertising campaign",
};

function formatPromotionType(type: string): string {
  const map: Record<string, string> = {
    HAPPY_HOUR: "happy hour promotion",
    DRINK_SPECIAL: "drink special",
    FOOD_SPECIAL: "food special",
    LADIES_NIGHT: "ladies night event",
    THEME_NIGHT: "theme night event",
    VIP_OFFER: "VIP exclusive offer",
    COVER_DISCOUNT: "cover discount offer",
    LIVE_MUSIC_EVENT: "live music event",
    GAME_NIGHT: "game night event",
    SEASONAL: "seasonal special",
  };
  return map[type] || "";
}

export { STYLE_PRESETS, SUBJECT_PRESETS, COMPOSITION_PRESETS };
export { subjectsForImageWorld, stylesForImageWorld, imageWorldContainsAlcohol };
