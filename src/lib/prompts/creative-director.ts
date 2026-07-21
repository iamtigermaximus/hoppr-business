// src/lib/prompts/creative-director.ts
// ============================================================================
// CREATIVE DIRECTOR — The intelligence layer that pre-fills ingredients, rotates
// creative decisions, and avoids repetition. Acts like a senior marketing
// professional who knows the bar's identity, the calendar, and what worked before.
//
// Called once when the creation hub opens. Returns a complete set of pre-filled
// ingredients + rotation decisions. The user can override anything.
// ============================================================================

// ---------------------------------------------------------------------------
// Ingredient type definitions
// ---------------------------------------------------------------------------

/** Content creation mode — determines the entire pipeline behavior */
export type CreationMode = "brand" | "promotional";

/** Audience — who the content is speaking to */
export type AudienceChip =
  | "friend-groups"
  | "couples"
  | "work-colleagues"
  | "music-lovers"
  | "food-focused"
  | "neighborhood-locals"
  | "celebrants"
  | "city-explorers"
  | "casual-evening"
  | "premium-seekers"
  | "seasonal-celebrants"
  | "meeting-people";

/** Core message — the single takeaway */
export type CoreMessageChip =
  | "something-new"
  | "night-is-special"
  | "best-place"
  | "did-you-know"
  | "come-as-you-are"
  | "your-place"
  | "one-night-one-experience"
  | "season-is-now";

/** Atmosphere / emotional register — what should they feel */
export type AtmosphereChip =
  | "warm-homey"
  | "energetic-pulsating"
  | "calm-serene"
  | "curious-discovering"
  | "polished-considered"
  | "authentic-honest"
  | "joyful-lighthearted"
  | "intimate-personal"
  | "celebratory-meaningful"
  | "bold-distinctive"
  | "playful-surprising"
  | "nostalgic-storied"
  | "easy-carefree";

/** Image world — is the image of the bar or conceptual */
export type ImageWorldChip =
  | "venue"
  | "mood"
  | "craft"
  | "nature"
  | "graphic"
  | "city"
  | "celebration"
  | "abstract";

/** Time of day — controls image lighting */
export type TimeOfDayChip =
  | "morning"
  | "midday"
  | "afternoon"
  | "golden-hour"
  | "dusk"
  | "evening"
  | "late-night"
  | "midnight";

/** Season — controls seasonal atmosphere in images */
export type SeasonChip =
  | "early-spring"
  | "spring"
  | "early-summer"
  | "high-summer"
  | "late-summer"
  | "early-autumn"
  | "autumn"
  | "november"
  | "early-winter"
  | "christmas"
  | "deep-winter"
  | "deep-freeze"
  | "vappu"
  | "midsummer";

/** Room energy — controls crowd density in images */
export type RoomEnergyChip =
  | "just-opening"
  | "first-arrivals"
  | "quiet-company"
  | "steady-hum"
  | "busy-hour"
  | "full-house"
  | "peak-night";

/** Bar focal point — what aspect of the venue to emphasize */
export type FocalPointChip =
  | "bar-counter"
  | "seating"
  | "terrace"
  | "details"
  | "lighting"
  | "stage"
  | "entrance"
  | "people"
  | "in-the-glass"
  | "walls-stories";

/** Copywriting structure pattern */
export type CopyStructureChip = "fab" | "aida" | "pas" | "direct";

// ---------------------------------------------------------------------------
// Chip labels — bilingual display names
// ---------------------------------------------------------------------------

export const AUDIENCE_LABELS: Record<AudienceChip, { fi: string; en: string }> = {
  "friend-groups": { fi: "Ystäväporukat", en: "Friend groups" },
  "couples": { fi: "Pariskunnat", en: "Couples" },
  "work-colleagues": { fi: "Työporukat", en: "Work colleagues" },
  "music-lovers": { fi: "Musiikin ystävät", en: "Music lovers" },
  "food-focused": { fi: "Ruokailijat", en: "Food-focused" },
  "neighborhood-locals": { fi: "Kortteliväki", en: "Neighborhood locals" },
  "celebrants": { fi: "Juhlijat", en: "Celebrants" },
  "city-explorers": { fi: "Kaupunkilaiset", en: "City explorers" },
  "casual-evening": { fi: "Rennon illan etsijät", en: "Casual evening seekers" },
  "premium-seekers": { fi: "Premium-kokijat", en: "Premium seekers" },
  "seasonal-celebrants": { fi: "Sesonkijuhlijat", en: "Seasonal celebrants" },
  "meeting-people": { fi: "Sinkut & tutustujat", en: "Meeting new people" },
};

export const CORE_MESSAGE_LABELS: Record<CoreMessageChip, { fi: string; en: string }> = {
  "something-new": { fi: "Uutta baarissa", en: "Something new at the bar" },
  "night-is-special": { fi: "Tämä ilta on erityinen", en: "This night is special" },
  "best-place": { fi: "Paras paikka tähän hetkeen", en: "The best place for this moment" },
  "did-you-know": { fi: "Tiesitkö tästä?", en: "Did you know about this?" },
  "come-as-you-are": { fi: "Tule sellaisena kuin olet", en: "Come as you are" },
  "your-place": { fi: "Tämä on sinun paikkasi", en: "This is your place" },
  "one-night-one-experience": { fi: "Yksi ilta, yksi kokemus", en: "One night, one experience" },
  "season-is-now": { fi: "Kausi on nyt", en: "The season is now" },
};

export const ATMOSPHERE_LABELS: Record<AtmosphereChip, { fi: string; en: string }> = {
  "warm-homey": { fi: "Lämmin & kotoisa", en: "Warm & homey" },
  "energetic-pulsating": { fi: "Energinen & sykkivä", en: "Energetic & pulsating" },
  "calm-serene": { fi: "Rauhallinen & seesteinen", en: "Calm & serene" },
  "curious-discovering": { fi: "Utelias & löytävä", en: "Curious & discovering" },
  "polished-considered": { fi: "Tyylikäs & hiottu", en: "Polished & considered" },
  "authentic-honest": { fi: "Aito & rehellinen", en: "Authentic & honest" },
  "joyful-lighthearted": { fi: "Iloinen & kepeä", en: "Joyful & lighthearted" },
  "intimate-personal": { fi: "Intiimi & läheinen", en: "Intimate & personal" },
  "celebratory-meaningful": { fi: "Juhlava & merkityksellinen", en: "Celebratory & meaningful" },
  "bold-distinctive": { fi: "Rohkea & omaleimainen", en: "Bold & distinctive" },
  "playful-surprising": { fi: "Leikkisä & yllättävä", en: "Playful & surprising" },
  "nostalgic-storied": { fi: "Nostalginen & tarinallinen", en: "Nostalgic & storied" },
  "easy-carefree": { fi: "Rento & huoleton", en: "Easy & carefree" },
};

export const IMAGE_WORLD_LABELS: Record<ImageWorldChip, { fi: string; en: string }> = {
  "venue": { fi: "Baari", en: "The venue" },
  "mood": { fi: "Tunnelma", en: "Mood / atmosphere" },
  "craft": { fi: "Käsityö", en: "Craft detail" },
  "nature": { fi: "Kausi & luonto", en: "Season & nature" },
  "graphic": { fi: "Graafinen", en: "Graphic / typographic" },
  "city": { fi: "Kaupunki", en: "City context" },
  "celebration": { fi: "Juhlakausi", en: "Seasonal celebration" },
  "abstract": { fi: "Abstrakti", en: "Abstract / textural" },
};

export const TIME_OF_DAY_LABELS: Record<TimeOfDayChip, { fi: string; en: string }> = {
  "morning": { fi: "Aamu", en: "Morning" },
  "midday": { fi: "Keskipäivä", en: "Midday" },
  "afternoon": { fi: "Iltapäivä", en: "Afternoon" },
  "golden-hour": { fi: "Kultainen tunti", en: "Golden hour" },
  "dusk": { fi: "Iltahämärä", en: "Dusk" },
  "evening": { fi: "Ilta", en: "Evening" },
  "late-night": { fi: "Myöhäisilta", en: "Late night" },
  "midnight": { fi: "Keskiyö", en: "Midnight" },
};

export const SEASON_LABELS: Record<SeasonChip, { fi: string; en: string }> = {
  "early-spring": { fi: "Alkukevät", en: "Early spring" },
  "spring": { fi: "Kevät", en: "Spring" },
  "early-summer": { fi: "Alkukesä", en: "Early summer" },
  "high-summer": { fi: "Keskikesä", en: "High summer" },
  "late-summer": { fi: "Loppukesä", en: "Late summer" },
  "early-autumn": { fi: "Alkusyksy", en: "Early autumn" },
  "autumn": { fi: "Syksy", en: "Autumn" },
  "november": { fi: "Marraskuu", en: "November" },
  "early-winter": { fi: "Alkutalvi", en: "Early winter" },
  "christmas": { fi: "Joulun aika", en: "Christmas season" },
  "deep-winter": { fi: "Sydäntalvi", en: "Deep winter" },
  "deep-freeze": { fi: "Pakkastalvi", en: "Deep freeze" },
  "vappu": { fi: "Vappu", en: "May Day" },
  "midsummer": { fi: "Juhannus", en: "Midsummer" },
};

export const ROOM_ENERGY_LABELS: Record<RoomEnergyChip, { fi: string; en: string }> = {
  "just-opening": { fi: "Avautumassa", en: "Just opening" },
  "first-arrivals": { fi: "Ensimmäiset saapuvat", en: "First arrivals" },
  "quiet-company": { fi: "Rauhallinen seura", en: "Quiet company" },
  "steady-hum": { fi: "Tasainen hyrinä", en: "Steady hum" },
  "busy-hour": { fi: "Vilkkain tunti", en: "Busy hour" },
  "full-house": { fi: "Täysi talo", en: "Full house" },
  "peak-night": { fi: "Illan huippu", en: "Peak of the night" },
};

export const FOCAL_POINT_LABELS: Record<FocalPointChip, { fi: string; en: string }> = {
  "bar-counter": { fi: "Baaritiski", en: "The bar counter" },
  "seating": { fi: "Istumapaikat", en: "The seating" },
  "terrace": { fi: "Terassi", en: "The terrace" },
  "details": { fi: "Yksityiskohdat", en: "The details" },
  "lighting": { fi: "Valaistus", en: "The lighting" },
  "stage": { fi: "Lavalla", en: "The stage" },
  "entrance": { fi: "Sisäänkäynti", en: "The entrance" },
  "people": { fi: "Ihmiset", en: "The people" },
  "in-the-glass": { fi: "Lasissa", en: "In the glass" },
  "walls-stories": { fi: "Seinät & tarinat", en: "Walls & stories" },
};

export const COPY_STRUCTURE_LABELS: Record<CopyStructureChip, { fi: string; en: string }> = {
  "fab": { fi: "FAB (Ominaisuus → Hyöty → Arvo)", en: "FAB (Feature → Advantage → Benefit)" },
  "aida": { fi: "AIDA (Huomio → Kiinnostus → Halu → Toimi)", en: "AIDA (Attention → Interest → Desire → Action)" },
  "pas": { fi: "PAS (Ongelma → Kärjistys → Ratkaisu)", en: "PAS (Problem → Agitation → Solution)" },
  "direct": { fi: "Suora (Yksi lause, yksi toiminto)", en: "Direct (One statement, one action)" },
};

// ---------------------------------------------------------------------------
// Bar profile → ingredient mappings
// ---------------------------------------------------------------------------

interface BarIdentity {
  type: string;
  district?: string | null;
  amenities?: string | null;
  priceRange?: string | null;
  musicTags?: string | null;
}

/**
 * Map bar type to default atmosphere chip.
 * COCKTAIL_BAR → polished, PUB → warm, NIGHTCLUB → energetic, etc.
 */
function defaultAtmosphereForBar(bar: BarIdentity): AtmosphereChip[] {
  const typeMap: Record<string, AtmosphereChip[]> = {
    COCKTAIL_BAR: ["polished-considered", "intimate-personal"],
    NIGHTCLUB: ["energetic-pulsating", "bold-distinctive"],
    PUB: ["warm-homey", "authentic-honest"],
    SPORTS_BAR: ["energetic-pulsating", "joyful-lighthearted"],
    WINE_BAR: ["polished-considered", "calm-serene"],
    LOUNGE: ["calm-serene", "intimate-personal"],
    KARAOKE: ["joyful-lighthearted", "playful-surprising"],
    LIVE_MUSIC: ["intimate-personal", "energetic-pulsating"],
    TERRACE_BAR: ["easy-carefree", "joyful-lighthearted"],
    BEER_HALL: ["warm-homey", "authentic-honest"],
    BEER_GARDEN: ["easy-carefree", "warm-homey"],
    ROOFTOP_BAR: ["polished-considered", "curious-discovering"],
    RESTAURANT: ["polished-considered", "authentic-honest"],
  };
  return typeMap[bar.type?.toUpperCase()] ?? ["warm-homey", "authentic-honest"];
}

/**
 * Map bar type to default audience chips.
 */
function defaultAudienceForBar(bar: BarIdentity): AudienceChip[] {
  const upper = bar.type?.toUpperCase() ?? "";
  if (["COCKTAIL_BAR", "WINE_BAR", "ROOFTOP_BAR"].includes(upper)) {
    return ["premium-seekers", "couples"];
  }
  if (["NIGHTCLUB"].includes(upper)) {
    return ["friend-groups", "meeting-people"];
  }
  if (["PUB", "SPORTS_BAR", "BEER_HALL"].includes(upper)) {
    return ["neighborhood-locals", "friend-groups"];
  }
  if (["LIVE_MUSIC", "KARAOKE"].includes(upper)) {
    return ["music-lovers", "friend-groups"];
  }
  if (["RESTAURANT"].includes(upper)) {
    return ["food-focused", "couples"];
  }
  return ["neighborhood-locals", "casual-evening"];
}

/**
 * Map bar type to default image world.
 */
function defaultImageWorld(bar: BarIdentity, season: SeasonChip): ImageWorldChip {
  const amenities = bar.amenities?.toLowerCase() ?? "";
  // Bars with terraces get mood images in summer
  if (amenities.includes("terrace") && ["early-summer", "high-summer", "late-summer"].includes(season)) {
    return "mood";
  }
  // Craft-forward bars get craft detail imagery
  if (["COCKTAIL_BAR", "WINE_BAR"].includes(bar.type?.toUpperCase() ?? "")) {
    return "craft";
  }
  return "venue";
}

/**
 * Map bar type to default focal point.
 */
function defaultFocalPoint(bar: BarIdentity): FocalPointChip {
  const amenities = bar.amenities?.toLowerCase() ?? "";
  if (amenities.includes("terrace") && isSummerMonth(new Date().getMonth())) return "terrace";
  if (amenities.includes("live music") || amenities.includes("stage")) return "stage";
  if (bar.type?.toUpperCase() === "COCKTAIL_BAR") return "in-the-glass";
  if (bar.type?.toUpperCase() === "NIGHTCLUB") return "lighting";
  return "bar-counter";
}

// ---------------------------------------------------------------------------
// Time-of-day from current hour
// ---------------------------------------------------------------------------

function defaultTimeOfDay(hour: number): TimeOfDayChip {
  if (hour < 8) return "morning";
  if (hour < 12) return "midday";
  if (hour < 16) return "afternoon";
  if (hour < 19) return "golden-hour";
  if (hour < 21) return "dusk";
  if (hour < 23) return "evening";
  if (hour < 2) return "late-night";
  return "midnight";
}

// ---------------------------------------------------------------------------
// Season from month + Finnish holiday detection
// ---------------------------------------------------------------------------

function isSummerMonth(month: number): boolean {
  return month >= 4 && month <= 8;
}

/**
 * Determine the current Finnish season, including holiday overrides.
 */
function currentSeason(now: Date): SeasonChip {
  const month = now.getMonth(); // 0-11
  const day = now.getDate();

  // Vappu: April 28 - May 1
  if (month === 3 && day >= 28) return "vappu";
  if (month === 4 && day <= 1) return "vappu";

  // Juhannus: June 19-25 (Friday-Saturday around Midsummer)
  if (month === 5 && day >= 19 && day <= 25) return "midsummer";

  // Christmas season: December
  if (month === 11) return "christmas";

  // Standard seasonal mapping
  if (month === 0 || month === 1) return "deep-winter";
  if (month === 2) return "early-spring";
  if (month === 3) return "spring";
  if (month === 4) return "early-summer";
  if (month === 5) return "early-summer";
  if (month === 6) return "high-summer";
  if (month === 7) return "late-summer";
  if (month === 8) return "early-autumn";
  if (month === 9) return "autumn";
  if (month === 10) return "november";
  // month === 11 is christmas (handled above), but this catches early December
  return "deep-winter";
}

// ---------------------------------------------------------------------------
// Room energy from day of week + time
// ---------------------------------------------------------------------------

function defaultRoomEnergy(dayOfWeek: number, hour: number): RoomEnergyChip {
  // dayOfWeek: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  if (hour < 16) return "quiet-company";
  if (dayOfWeek === 5 || dayOfWeek === 6) {
    // Friday, Saturday
    if (hour >= 22) return "peak-night";
    if (hour >= 19) return "busy-hour";
    return "steady-hum";
  }
  if (dayOfWeek === 4) {
    // Thursday
    if (hour >= 20) return "busy-hour";
    return "steady-hum";
  }
  // Sunday-Wednesday
  if (hour >= 20) return "steady-hum";
  return "quiet-company";
}

// ---------------------------------------------------------------------------
// Rotation engine — avoids repetition
// ---------------------------------------------------------------------------

interface ContentHistoryEntry {
  headline?: string;
  template?: string;
  imageSubject?: string;
  copyStructure?: CopyStructureChip;
  generatedAt: string; // ISO timestamp
}

/**
 * Simple seeded rotation using week number + bar identity.
 * Returns a deterministic-but-changing index for a pool.
 */
function poolRotation(
  barId: string,
  poolSize: number,
  shift: number = 0,
): number {
  const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const seed = barId.length + weekNumber + shift;
  return Math.abs(hashString(String(seed))) % poolSize;
}

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}

/**
 * Rotate copy structure — never repeat the last used one.
 */
function rotateCopyStructure(
  barId: string,
  history?: ContentHistoryEntry[],
): CopyStructureChip {
  const pool: CopyStructureChip[] = ["direct", "fab", "aida", "pas"];
  const lastUsed = history?.[0]?.copyStructure;
  if (!lastUsed) {
    const idx = poolRotation(barId, pool.length);
    return pool[idx];
  }
  // Remove last used, pick from remaining
  const available = pool.filter((s) => s !== lastUsed);
  const idx = poolRotation(barId, available.length);
  return available[idx];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface BarProfileForDirector {
  id: string;
  type: string;
  district?: string | null;
  amenities?: string | null;
  priceRange?: string | null;
  musicTags?: string | null;
  description?: string | null;
  cityName?: string | null;
  vipEnabled?: boolean;
}

/** Performance weightings — optional creative ingredient boosts/dampens */
export interface PerformanceWeightingsInput {
  tone?: Record<string, number>;
  template?: Record<string, number>;
  audience?: Record<string, number>;
  coreMessage?: Record<string, number>;
  atmosphere?: Record<string, number>;
  imageWorld?: Record<string, number>;
  copyStructure?: Record<string, number>;
  hookPattern?: Record<string, number>;
}

export interface DirectorDecision {
  /** All pre-filled ingredient selections */
  mode: CreationMode;
  audience: AudienceChip[];
  coreMessage: CoreMessageChip;
  atmosphere: AtmosphereChip[];
  imageWorld: ImageWorldChip;
  timeOfDay: TimeOfDayChip;
  season: SeasonChip;
  roomEnergy: RoomEnergyChip;
  focalPoint: FocalPointChip;
  copyStructure: CopyStructureChip;

  /** Avoid repeating these patterns from recent history */
  avoidHeadlinePatterns: string[];

  /** Suggested template based on bar type + time context */
  suggestTemplate: string;

  /** Human-readable seasonal context for the LLM prompt */
  seasonalContext: string;

  /** Whether this is a special date (Vappu, Juhannus, Christmas, etc.) */
  isSpecialDate: boolean;

  /** Performance weightings attached to the decision (for caller reference) */
  weightings?: PerformanceWeightingsInput;

  /** Human-readable performance insights (one-liners for the UI) */
  performanceNotes?: string[];
}

/**
 * The main entry point. Called once when the creation hub opens.
 * Pre-fills every ingredient with a smart default based on:
 * 1. Bar profile (type, district, amenities, price range)
 * 2. Current date, time, day of week, season, holidays
 * 3. Content history (what was recently generated)
 *
 * The returned decision feeds directly into the ingredient UI and the
 * suggest API. Users can override any field.
 */
export function direct(
  bar: BarProfileForDirector,
  now: Date = new Date(),
  history?: ContentHistoryEntry[],
  explicitMode?: CreationMode,
  weightings?: PerformanceWeightingsInput,
): DirectorDecision {
  const dayOfWeek = now.getDay();
  const hour = now.getHours();
  const month = now.getMonth();
  const day = now.getDate();

  const barIdentity: BarIdentity = {
    type: bar.type,
    district: bar.district,
    amenities: bar.amenities,
    priceRange: bar.priceRange,
    musicTags: bar.musicTags,
  };

  // --- Pre-fill every ingredient ---
  const season = currentSeason(now);
  const mode = explicitMode ?? "brand";

  const audience = defaultAudienceForBar(barIdentity);
  const atmosphere = defaultAtmosphereForBar(barIdentity);
  const imageWorld = defaultImageWorld(barIdentity, season);
  const timeOfDay = defaultTimeOfDay(hour);
  const roomEnergy = defaultRoomEnergy(dayOfWeek, hour);
  const focalPoint = defaultFocalPoint(barIdentity);
  const copyStructure = rotateCopyStructure(bar.id, history);

  // --- Core message rotation ---
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
  const coreMessage: CoreMessageChip =
    season === "vappu" || season === "midsummer" || season === "christmas"
      ? "season-is-now"
      : isWeekend
        ? "night-is-special"
        : "best-place";

  // --- Seasonal context for LLM ---
  const seasonalFi: Record<SeasonChip, string> = {
    "early-spring": "Alkukevät — lumi sulaa, ensimmäinen valo, toiveikas",
    "spring": "Kevät — silmut puhkeavat, terassit avautuvat, energia palaa",
    "early-summer": "Alkukesä — pitkät valoisat illat, sireenit kukkivat",
    "high-summer": "Keskikesä — vehreää, lämmintä, terassit parhaimmillaan, valoa klo 23 asti",
    "late-summer": "Loppukesä — kultaisia sävyjä, lämmin mutta haikea, viimeiset terassi-illat",
    "early-autumn": "Alkusyksy — ensimmäiset oranssit, raikas ilma, kynttiläkausi alkaa",
    "autumn": "Syksy — syviä oransseja ja punaisia, sadetta ikkunoilla, sisällä kodikasta",
    "november": "Marraskuu — pimeää, märkää, kontrasti kylmän ulkopuolen ja lämpimän sisäpuolen välillä on tarina",
    "early-winter": "Alkutalvi — ensilumi, juhlava odotus, tuikkivat valot, lämpimiä juomia",
    "christmas": "Joulun aika — lämpimiä punaisia ja kultaisia sävyjä, kynttilänvaloa, lunta ikkunan takana, pohjoismaista joululämpöä",
    "deep-winter": "Sydäntalvi — paksu lumi ulkona, äärimmäinen lämpö sisällä, huuruiset ikkunat, turvapaikka",
    "deep-freeze": "Pakkastalvi — kirpeä pakkasilma näkyvissä, huurretta ikkunoissa, sisätilojen hehku on magneettinen",
    "vappu": "Vappu — karnevaalienergiaa, kevään valkoista, ilmapalloja, katuruokaa, kaupungin suurin juhla",
    "midsummer": "Juhannus — yötön yö, kokon tuli, saariston rauha, kesän taika huipussaan",
  };

  // --- Avoid headline patterns from history ---
  const avoidHeadlinePatterns: string[] = [];
  if (history && history.length > 0) {
    const recent = history.slice(0, 3);
    for (const entry of recent) {
      if (entry.headline) {
        avoidHeadlinePatterns.push(entry.headline);
      }
    }
  }

  // --- Suggest template based on bar type + time context ---
  const templateMap: Record<string, string[]> = {
    COCKTAIL_BAR: ["Musiikkihetki", "Baarin taika", "Kesäilta"],
    NIGHTCLUB: ["Lauantai-illan rituaali", "Kutsu", "Baarin taika"],
    PUB: ["Hiljaiset tunnit", "Lauantai-illan rituaali", "Kutsu"],
    LIVE_MUSIC: ["Musiikkihetki", "Baarin taika", "Kesäilta"],
    WINE_BAR: ["Baarin taika", "Hiljaiset tunnit", "Kesäilta"],
    RESTAURANT: ["Baarin taika", "Kesäilta", "Kutsu"],
  };
  const tmplPool = templateMap[bar.type?.toUpperCase()] ?? ["Kesäilta", "Baarin taika", "Kutsu"];

  // Apply template performance weightings to boost/dampen the pool selection
  let suggestTemplate = tmplPool[poolRotation(bar.id, tmplPool.length)];
  if (weightings?.template) {
    // Build a weighted pool — prefer templates with high multipliers
    const templateScores = tmplPool.map((t) => ({
      name: t,
      score: weightings.template?.[t] ?? 1.0,
    }));
    const topTemplate = templateScores.sort((a, b) => b.score - a.score)[0];
    if (topTemplate && topTemplate.score > 1.15) {
      suggestTemplate = topTemplate.name; // Override rotation for proven winners
    }
  }

  // --- Build performance notes for UI display ---
  const performanceNotes: string[] = [];
  if (weightings) {
    const topEntries = Object.entries(weightings)
      .flatMap(([category, scores]) => {
        if (!scores || typeof scores !== "object") return [];
        return Object.entries(scores as Record<string, number>)
          .map(([name, multiplier]) => ({ category, name, multiplier }))
          .filter((e) => e.multiplier > 1.1 || e.multiplier < 0.9);
      })
      .sort((a, b) => Math.abs(b.multiplier - 1) - Math.abs(a.multiplier - 1))
      .slice(0, 3);

    for (const entry of topEntries) {
      const dir = entry.multiplier > 1 ? "boost" : "dampen";
      const pct = Math.round(Math.abs(entry.multiplier - 1) * 100);
      performanceNotes.push(
        `${entry.category}:${entry.name} → ${dir} ${pct}% (${entry.multiplier.toFixed(2)}x)`
      );
    }
  }

  const isSpecialDate = ["vappu", "midsummer", "christmas"].includes(season);

  return {
    mode,
    audience,
    coreMessage,
    atmosphere,
    imageWorld,
    timeOfDay,
    season,
    roomEnergy,
    focalPoint,
    copyStructure,
    avoidHeadlinePatterns,
    suggestTemplate,
    seasonalContext: seasonalFi[season],
    isSpecialDate,
    weightings,
    performanceNotes: performanceNotes.length > 0 ? performanceNotes : undefined,
  };
}

/**
 * Build a human-readable summary of the director's decisions for the LLM prompt.
 */
export function buildDirectorContext(
  decision: DirectorDecision,
  language: "en" | "fi" = "fi",
): string {
  const isFi = language === "fi";

  const audienceStr = decision.audience
    .map((a) => AUDIENCE_LABELS[a]?.[language] ?? a)
    .join(", ");
  const atmosphereStr = decision.atmosphere
    .map((a) => ATMOSPHERE_LABELS[a]?.[language] ?? a)
    .join(", ");

  const lines: string[] = [];

  if (isFi) {
    lines.push(`YLEISÖ: ${audienceStr}`);
    lines.push(`YDINVIESTI: ${CORE_MESSAGE_LABELS[decision.coreMessage].fi}`);
    lines.push(`TUNNELMA: ${atmosphereStr}`);
    lines.push(`KUVAILMAPIIRI: ${IMAGE_WORLD_LABELS[decision.imageWorld].fi}`);
    lines.push(`KELLONAIKA: ${TIME_OF_DAY_LABELS[decision.timeOfDay].fi}`);
    lines.push(`VUODENAIKA: ${SEASON_LABELS[decision.season].fi} — ${decision.seasonalContext}`);
    lines.push(`TILAN ENERGIA: ${ROOM_ENERGY_LABELS[decision.roomEnergy].fi}`);
    lines.push(`KESKITTYMISPISTE: ${FOCAL_POINT_LABELS[decision.focalPoint].fi}`);
    lines.push(`RAKENNE: ${COPY_STRUCTURE_LABELS[decision.copyStructure].fi}`);
  } else {
    lines.push(`AUDIENCE: ${audienceStr}`);
    lines.push(`CORE MESSAGE: ${CORE_MESSAGE_LABELS[decision.coreMessage].en}`);
    lines.push(`ATMOSPHERE: ${atmosphereStr}`);
    lines.push(`IMAGE WORLD: ${IMAGE_WORLD_LABELS[decision.imageWorld].en}`);
    lines.push(`TIME OF DAY: ${TIME_OF_DAY_LABELS[decision.timeOfDay].en}`);
    lines.push(`SEASON: ${SEASON_LABELS[decision.season].en} — ${decision.seasonalContext}`);
    lines.push(`ROOM ENERGY: ${ROOM_ENERGY_LABELS[decision.roomEnergy].en}`);
    lines.push(`FOCAL POINT: ${FOCAL_POINT_LABELS[decision.focalPoint].en}`);
    lines.push(`STRUCTURE: ${COPY_STRUCTURE_LABELS[decision.copyStructure].en}`);
  }

  if (decision.avoidHeadlinePatterns.length > 0) {
    const avoidList = decision.avoidHeadlinePatterns.join('", "');
    lines.push(
      isFi
        ? `VÄLTÄ TOISTOA: Älä käytä näitä otsikoita uudelleen: "${avoidList}"`
        : `AVOID REPETITION: Do not reuse these headlines: "${avoidList}"`,
    );
  }

  if (decision.isSpecialDate) {
    lines.push(
      isFi
        ? "ERITYISPÄIVÄ: Tämä on suomalainen juhlapäivä. Sisällytä juhlan henki luontevasti — ei väkisin, ei kliseisesti."
        : "SPECIAL DATE: This is a Finnish holiday. Include the holiday spirit naturally — not forced, not clichéd.",
    );
  }

  // Performance feedback — only included when data is available
  if (decision.performanceNotes && decision.performanceNotes.length > 0) {
    lines.push(
      isFi
        ? `\nSUORITUSTIEDOT (luovat valinnat, jotka ovat toimineet parhaiten tälle baarille):\n${decision.performanceNotes.map((n) => `• ${n}`).join("\n")}`
        : `\nPERFORMANCE DATA (creative choices that have worked best for this venue):\n${decision.performanceNotes.map((n) => `• ${n}`).join("\n")}`,
    );
  }

  return lines.join("\n");
}

export { poolRotation, currentSeason, defaultTimeOfDay };
