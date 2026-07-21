// src/lib/calendar/finnish-calendar.ts
// ============================================================================
// FINNISH CALENDAR — Public holidays, cultural events, and sports seasons.
//
// Replaces the hardcoded month-range getSeasonalContext() with a comprehensive
// calendar that knows: Finnish public holidays (including Easter-based movable
// dates), cultural events (Flow, Design Week, Restaurant Day), sports seasons
// (ice hockey playoffs, World Championships), and local happenings.
//
// Each event carries:
//   - Date range with lead-in windows
//   - Thematic hooks (what makes this event matter for a bar)
//   - Competitive differentiator angles (how to stand out when everyone posts)
//   - Lead-time phases (tease → build → celebrate → recovery)
// ============================================================================

// ---- Types ----

export type EventPhase = "tease" | "build" | "celebrate" | "recovery" | "dormant";

export interface CalendarEvent {
  /** Unique identifier */
  id: string;
  /** Bilingual display name */
  name: { en: string; fi: string };
  /** Category for filtering */
  category: "public-holiday" | "cultural" | "sports" | "seasonal" | "local";
  /** Date range — for single-day events, start === end */
  dateRange: {
    /** Month+day — year-independent for recurring events */
    start: { month: number; day: number };
    /** End date, inclusive. For Easter-based, set after computeEaster() */
    end: { month: number; day: number };
  };
  /** Number of days before the event starts to enter tease phase */
  teaseDaysBefore: number;
  /** Number of days before to enter build phase */
  buildDaysBefore: number;
  /** Number of days after to stay in recovery phase */
  recoveryDaysAfter: number;
  /** How this event matters for bar marketing — prompts for content generation */
  hooks: {
    en: string[];
    fi: string[];
  };
  /** Competitive differentiator — what angle to take when everyone posts */
  differentiators: {
    en: string[];
    fi: string[];
  };
  /** Template suggestions for this event */
  suggestedTemplates: string[];
  /** Audience segments that engage with this event */
  audienceBoost: string[];
  /** Atmosphere chips that pair naturally */
  atmospherePair: string[];
}

export interface CalendarEventWithPhases extends CalendarEvent {
  /** Current phase relative to `now` */
  phase: EventPhase;
  /** Days until the event starts (negative = event has started, positive = upcoming) */
  daysUntil: number;
  /** Whether this event is currently active (celebrate phase) */
  isActive: boolean;
  /** Human-readable lead-time description */
  leadTimeHint: { en: string; fi: string };
}

export interface CalendarContext {
  /** Events in active phases (tease, build, celebrate, recovery) */
  active: CalendarEventWithPhases[];
  /** Short context block for injecting into AI system prompts */
  systemPromptBlock: { en: string; fi: string };
  /** Single highest-priority event right now */
  topEvent: CalendarEventWithPhases | null;
  /** Human-friendly seasonal override (replaces the old hardcoded strings) */
  seasonalBrief: { en: string; fi: string };
}

// ---- Easter calculation (Gauss algorithm, Gregorian) ----

function computeEaster(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=March, 4=April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month: month - 1, day }; // 0-indexed month
}

function addDays(date: { month: number; day: number }, days: number): { month: number; day: number } {
  const months = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let { month, day } = date;
  day += days;
  while (day > months[month]) {
    day -= months[month];
    month++;
    if (month > 11) month = 0;
  }
  while (day <= 0) {
    month--;
    if (month < 0) month = 11;
    day += months[month];
  }
  return { month, day };
}

function dateToYearless(date: Date): { month: number; day: number } {
  return { month: date.getMonth(), day: date.getDate() };
}

function yearlessToDate(y: { month: number; day: number }, year: number): Date {
  return new Date(year, y.month, y.day);
}

/**
 * Days between two yearless dates, assuming date1 is before date2 within
 * a 365-day window anchored around date1. Handles Dec→Jan wrapping.
 */
function daysBetween(d1: { month: number; day: number }, d2: { month: number; day: number }): number {
  const ref = new Date(2024, d1.month, d1.day);
  const target = new Date(2024, d2.month, d2.day);
  if (target < ref) target.setFullYear(2025);
  return Math.round((target.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24));
}

// ---- Holiday date computation ----

interface HolidayDates {
  newYear: { month: number; day: number };
  epiphany: { month: number; day: number };
  goodFriday: { month: number; day: number };
  easterSunday: { month: number; day: number };
  easterMonday: { month: number; day: number };
  vappu: { month: number; day: number };
  ascensionDay: { month: number; day: number };
  pentecost: { month: number; day: number };
  midsummerEve: { month: number; day: number };
  midsummerDay: { month: number; day: number };
  allSaints: { month: number; day: number };
  independenceDay: { month: number; day: number };
  christmasEve: { month: number; day: number };
  christmasDay: { month: number; day: number };
  boxingDay: { month: number; day: number };
  newYearsEve: { month: number; day: number };
}

function computeHolidayDates(year: number): HolidayDates {
  const easter = computeEaster(year);

  // Juhannus: Saturday between June 20-26. Juhannusaatto is the Friday before.
  const june20 = new Date(year, 5, 20); // June 20
  const june20dow = june20.getDay(); // 0=Sun
  const midsummerDay = { month: 5, day: 20 + (6 - june20dow) };
  // If June 20 is already Saturday, that's the day
  const midsummerEve = addDays(midsummerDay, -1);

  // Pyhäinpäivä: Saturday between Oct 31 and Nov 6
  const oct31 = new Date(year, 9, 31);
  const oct31dow = oct31.getDay();
  const allSaints = { month: 9, day: 31 + (6 - oct31dow) };

  return {
    newYear: { month: 0, day: 1 },
    epiphany: { month: 0, day: 6 },
    goodFriday: addDays(easter, -2),
    easterSunday: easter,
    easterMonday: addDays(easter, 1),
    vappu: { month: 4, day: 1 },
    ascensionDay: addDays(easter, 39),
    pentecost: addDays(easter, 49),
    midsummerEve,
    midsummerDay,
    allSaints,
    independenceDay: { month: 11, day: 6 },
    christmasEve: { month: 11, day: 24 },
    christmasDay: { month: 11, day: 25 },
    boxingDay: { month: 11, day: 26 },
    newYearsEve: { month: 11, day: 31 },
  };
}

// ---- Calendar events database ----

let _calendarCache: { year: number; events: CalendarEvent[] } | null = null;

function buildCalendarEvents(year: number): CalendarEvent[] {
  // Return cached if same year
  if (_calendarCache?.year === year) return _calendarCache.events;

  const h = computeHolidayDates(year);

  // Helper to create date range from a start date and duration
  const range = (start: { month: number; day: number }, durationDays: number = 1) => ({
    start,
    end: durationDays === 1 ? start : addDays(start, durationDays - 1),
  });

  const events: CalendarEvent[] = [
    // ── PUBLIC HOLIDAYS ────────────────────────────────────────────
    {
      id: "new-year",
      name: { en: "New Year", fi: "Uusivuosi" },
      category: "public-holiday",
      dateRange: range(h.newYearsEve, 2),
      teaseDaysBefore: 14,
      buildDaysBefore: 7,
      recoveryDaysAfter: 1,
      hooks: {
        en: ["New Year's Eve — the biggest party night of the year", "New Year's Day recovery brunch", "Start the year at the bar"],
        fi: ["Uudenvuodenaatto — vuoden suurin juhlayö", "Uudenvuodenpäivän recovery-brunssi", "Aloita vuosi baarissa"],
      },
      differentiators: {
        en: ["Everyone offers a NYE party. Your angle: the recovery brunch on Jan 1.", "Skip the midnight chaos — offer a 'First Toast of the Year' afternoon cocktail."],
        fi: ["Kaikki tarjoavat uudenvuodenbileet. Sinun kulmasi: recovery-brunssi 1.1.", "Ohita keskiyön kaaos — tarjoa 'Vuoden ensimmäinen malja' iltapäiväcocktail."],
      },
      suggestedTemplates: ["weekend-special", "group-celebration", "chefs-special"],
      audienceBoost: ["celebrants", "friend-groups", "seasonal-celebrants"],
      atmospherePair: ["celebratory-meaningful", "energetic-pulsating", "bold-distinctive"],
    },
    {
      id: "vappu",
      name: { en: "Vappu (May Day)", fi: "Vappu" },
      category: "public-holiday",
      dateRange: { start: { month: 3, day: 28 }, end: h.vappu },
      teaseDaysBefore: 21,
      buildDaysBefore: 10,
      recoveryDaysAfter: 2,
      hooks: {
        en: ["Vappu — Finland's biggest carnival, the city explodes with energy", "Pre-Vappu warm-up — the smart crowd gets ready early", "Post-Vappu comedown — the city needs a quiet drink"],
        fi: ["Vappu — kaupungin suurin karnevaali, energia räjähtää", "Vapun etkot — fiksu väki valmistautuu ajoissa", "Vapun jälkilöylyt — kaupunki kaipaa hiljaista juomaa"],
      },
      differentiators: {
        en: ["Every bar does a Vappu party. Your angle: the pre-Vappu 'gentleman's Vappu' for those who want the vibe without the chaos.", "Post-Vappu recovery: 'You survived Vappu. Come decompress.'"],
        fi: ["Joka baarissa on Vappu-bileet. Sinun kulmasi: 'herrasmiesvappu' niille, jotka haluavat tunnelmaa ilman kaaosta.", "Vapun jälkeinen palautuminen: 'Selvisit vapusta. Tule rentoutumaan.'"],
      },
      suggestedTemplates: ["weekend-special", "group-celebration", "theme-night", "seasonal-special"],
      audienceBoost: ["celebrants", "friend-groups", "seasonal-celebrants", "city-explorers"],
      atmospherePair: ["playful-surprising", "energetic-pulsating", "celebratory-meaningful"],
    },
    {
      id: "easter",
      name: { en: "Easter (Pääsiäinen)", fi: "Pääsiäinen" },
      category: "public-holiday",
      dateRange: range(h.goodFriday, 4),
      teaseDaysBefore: 14,
      buildDaysBefore: 7,
      recoveryDaysAfter: 1,
      hooks: {
        en: ["Easter long weekend — the city empties, the regulars stay behind", "Easter brunch — the holiday meal that happens in a bar", "Good Friday calm — the quietest bar night of spring"],
        fi: ["Pääsiäisen pitkä viikonloppu — kaupunki tyhjenee, kanta-asiakkaat jäävät", "Pääsiäisbrunssi — juhlaruoka baarissa", "Pitkäperjantain rauha — kevään hiljaisin baari-ilta"],
      },
      differentiators: {
        en: ["Most bars close or go quiet. Your angle: 'We're open. And we have mämmi cocktails.'", "Easter isn't just chocolate eggs — it's the long weekend for people who stayed in town."],
        fi: ["Useimmat baarit sulkeutuvat tai hiljenevät. Sinun kulmasi: 'Me olemme auki. Ja meillä on mämmicocktaileja.'", "Pääsiäinen ei ole vain suklaamunia — se on pitkä viikonloppu kaupunkilaisille."],
      },
      suggestedTemplates: ["brunch-service", "seasonal-special", "neighbourhood-night"],
      audienceBoost: ["neighborhood-locals", "casual-evening", "food-focused"],
      atmospherePair: ["warm-homey", "nostalgic-storied", "authentic-honest"],
    },
    {
      id: "juhannus",
      name: { en: "Juhannus (Midsummer)", fi: "Juhannus" },
      category: "public-holiday",
      dateRange: range(h.midsummerEve, 2),
      teaseDaysBefore: 21,
      buildDaysBefore: 10,
      recoveryDaysAfter: 3,
      hooks: {
        en: ["Juhannus — the city empties, cottages fill up, the longest day of the year", "Pre-Juhannus — the last night out before everyone disappears", "Post-Juhannus — the city is quiet, the regulars return, the recovery begins"],
        fi: ["Juhannus — kaupunki tyhjenee, mökit täyttyvät, vuoden pisin päivä", "Juhannuksen aatto — viimeinen ilta ennen kuin kaikki katoavat", "Juhannuksen jälkeen — kaupunki hiljenee, kanta-asiakkaat palaavat"],
      },
      differentiators: {
        en: ["Every bar posts a terrace photo for Juhannus. Your angle: 'Staying in the city? We're your Juhannus cottage.'", "'Back from the cottage? Recovery brunch Sunday.' — the post-Juhannus play is underused.", "The Juhannus after-party: everyone comes back Sunday. Be the Sunday night spot."],
        fi: ["Jokainen baari postaa terassikuvan juhannukseksi. Sinun kulmasi: 'Jäitkö kaupunkiin? Me olemme juhannusmökkisi.'", "'Takaisin mökiltä? Recovery-brunssi sunnuntaina.' — Juhannuksen jälkeinen veto on alikäytetty.", "Juhannuksen jatkot: kaikki palaavat sunnuntaina. Ole sunnuntai-illan paikka."],
      },
      suggestedTemplates: ["seasonal-special", "weekend-special", "brunch-service", "group-celebration"],
      audienceBoost: ["friend-groups", "celebrants", "city-explorers", "seasonal-celebrants"],
      atmospherePair: ["easy-carefree", "celebratory-meaningful", "joyful-lighthearted"],
    },
    {
      id: "independence-day",
      name: { en: "Independence Day", fi: "Itsenäisyyspäivä" },
      category: "public-holiday",
      dateRange: range(h.independenceDay, 1),
      teaseDaysBefore: 14,
      buildDaysBefore: 7,
      recoveryDaysAfter: 1,
      hooks: {
        en: ["Independence Day — Finland's most solemn celebration, candles in windows", "Pre-Independence Day — the last night out before the quietest day of the year", "Post-Independence Day — bars reopen, the city comes back to life"],
        fi: ["Itsenäisyyspäivä — Suomen juhlallisin juhla, kynttilät ikkunoissa", "Itsenäisyyspäivän aatto — viimeinen ilta ennen vuoden hiljaisinta päivää", "Itsenäisyyspäivän jälkeen — baarit avautuvat, kaupunki herää henkiin"],
      },
      differentiators: {
        en: ["Independence Day is quiet — bars close early or stay closed. The play is Dec 5: 'The last proper night out before the silence.'", "Dec 7: everyone's ready to socialize again. Be the first bar they think of."],
        fi: ["Itsenäisyyspäivä on hiljainen — baarit sulkeutuvat ajoissa. Peli on 5.12.: 'Viimeinen kunnon ilta ennen hiljaisuutta.'", "7.12.: kaikki ovat valmiita sosiaalistumaan taas. Ole ensimmäinen baari, jota he ajattelevat."],
      },
      suggestedTemplates: ["neighbourhood-night", "regulars-night", "seasonal-special"],
      audienceBoost: ["neighborhood-locals", "premium-seekers", "casual-evening"],
      atmospherePair: ["polished-considered", "nostalgic-storied", "intimate-personal"],
    },
    {
      id: "christmas",
      name: { en: "Christmas season", fi: "Joulun aika" },
      category: "public-holiday",
      dateRange: range(h.christmasEve, 3),
      teaseDaysBefore: 30,
      buildDaysBefore: 14,
      recoveryDaysAfter: 5,
      hooks: {
        en: ["Christmas party season — every company, friend group, and sports team needs a venue", "Christmas Eve calm — the one night the bar is truly still", "Boxing Day return — the city comes back to life after Christmas", "New Year's build-up — between Christmas and NYE, the bar is the living room away from family"],
        fi: ["Pikkujoulukausi — jokainen firma, kaveriporukka ja urheilujoukkue tarvitsee tilan", "Jouluaaton rauha — ainoa ilta jolloin baari on oikeasti hiljainen", "Tapaninpäivän paluu — kaupunki herää henkiin joulun jälkeen", "Uudenvuoden nousu — joulun ja uudenvuoden välissä baari on olohuone pois perheen luota"],
      },
      differentiators: {
        en: ["Every bar runs 'pikkujoulu' packages. Differentiate: 'The pikkujoulu for people who actually like their colleagues.'", "Christmas week is dead for nightlife but alive for afternoon drinks. 'Hiding from family? We understand.'"],
        fi: ["Joka baari tarjoaa pikkujoulupaketteja. Erottaudu: 'Pikkujoulut ihmisille, jotka oikeasti pitävät työkavereistaan.'", "Jouluviikko on kuollut yöelämälle mutta elossa iltapäiväjuomille. 'Piilossa perheeltä? Ymmärrämme.'"],
      },
      suggestedTemplates: ["group-celebration", "seasonal-special", "weekend-special", "neighbourhood-night"],
      audienceBoost: ["friend-groups", "work-colleagues", "celebrants", "seasonal-celebrants"],
      atmospherePair: ["warm-homey", "celebratory-meaningful", "nostalgic-storied"],
    },

    // ── CULTURAL EVENTS ────────────────────────────────────────────
    {
      id: "flow-festival",
      name: { en: "Flow Festival", fi: "Flow Festival" },
      category: "cultural",
      dateRange: { start: { month: 7, day: 7 }, end: { month: 7, day: 10 } },
      teaseDaysBefore: 28,
      buildDaysBefore: 14,
      recoveryDaysAfter: 3,
      hooks: {
        en: ["Flow Festival weekend — Helsinki's biggest music+arts event, 80k+ visitors", "Pre-Flow warm-up — the festival crowd is in town early", "Post-Flow afterparty — the official festival ends at 23:00, your bar doesn't"],
        fi: ["Flow Festival -viikonloppu — Helsingin suurin musiikki+taidetapahtuma, 80 000+ kävijää", "Flow'n etkot — festarikansa saapuu kaupunkiin ajoissa", "Flow'n jatkot — virallinen festari loppuu klo 23, sinun baarisi ei"],
      },
      differentiators: {
        en: ["Flow ends at 23:00. 80,000 people need somewhere to go. 'The after-Flow spot' is a positioning play.", "Flow is about discovery. Program a 'festival recovery' cocktail menu with unusual ingredients."],
        fi: ["Flow loppuu klo 23. 80 000 ihmistä tarvitsee paikan minne mennä. 'Flow'n jatkopaikka' on positiointipeli.", "Flow on löytöretkeä. Luo 'festarirecovery' -cocktailmenu epätavallisilla ainesosilla."],
      },
      suggestedTemplates: ["weekend-special", "dj-night", "live-music", "theme-night"],
      audienceBoost: ["music-lovers", "city-explorers", "friend-groups"],
      atmospherePair: ["energetic-pulsating", "curious-discovering", "bold-distinctive"],
    },
    {
      id: "helsinki-design-week",
      name: { en: "Helsinki Design Week", fi: "Helsinki Design Week" },
      category: "cultural",
      dateRange: { start: { month: 8, day: 5 }, end: { month: 8, day: 14 } },
      teaseDaysBefore: 21,
      buildDaysBefore: 10,
      recoveryDaysAfter: 2,
      hooks: {
        en: ["Design Week — the design-conscious crowd is out, aesthetics matter", "Design Week after-hours — the networking happens after the talks", "The design crowd drinks differently — craft cocktails, considered spaces"],
        fi: ["Design Week — design-tietoinen yleisö liikkeellä, estetiikalla on väliä", "Design Week after-hours — verkostoituminen tapahtuu puheiden jälkeen", "Design-yleisö juo eri tavalla — käsityöcocktaileja, harkittuja tiloja"],
      },
      differentiators: {
        en: ["Design Week crowd values craft and aesthetics. Lean into premium positioning: 'The cocktail as designed object.'", "Your bar's design IS the content. Use design language: 'Considered lighting. Intentional acoustics. Drinks as art.'"],
        fi: ["Design Week -yleisö arvostaa käsityötä ja estetiikkaa. Nojaa premium-asemointiin: 'Cocktail suunniteltuna esineenä.'", "Baarisi design ON sisältö. Käytä design-kieltä: 'Harkittu valaistus. Tarkoituksellinen akustiikka. Juomat taiteena.'"],
      },
      suggestedTemplates: ["private-tasting", "cocktail-masterclass", "meet-the-maker"],
      audienceBoost: ["premium-seekers", "city-explorers", "couples"],
      atmospherePair: ["polished-considered", "intimate-personal", "curious-discovering"],
    },
    {
      id: "restaurant-day",
      name: { en: "Restaurant Day", fi: "Ravintolapäivä" },
      category: "cultural",
      // Quarterly: Feb, May, Aug, Nov — roughly the 3rd Saturday
      dateRange: { start: { month: 7, day: 15 }, end: { month: 7, day: 17 } },
      teaseDaysBefore: 10,
      buildDaysBefore: 5,
      recoveryDaysAfter: 1,
      hooks: {
        en: ["Restaurant Day — pop-up restaurants everywhere, the city becomes a food carnival", "Everyone's a restaurateur today. Your bar is the post-pop-up drink spot.", "Restaurant Day after-party — the pop-up chefs need a drink"],
        fi: ["Ravintolapäivä — pop-up-ravintoloita kaikkialla, kaupunki muuttuu ruokakarnevaaliksi", "Jokainen on ravintoloitsija tänään. Baarisi on pop-upin jälkeinen juomapaikka.", "Ravintolapäivän jatkot — pop-up-kokit tarvitsevat juoman"],
      },
      differentiators: {
        en: ["Don't compete with pop-ups — collaborate. 'Bring your Restaurant Day haul to our bar. We'll pair it with drinks.'", "The post-Restaurant Day drink is the unclaimed territory. Position: 'You cooked all day. Let us pour.'"],
        fi: ["Älä kilpaile pop-upien kanssa — tee yhteistyötä. 'Tuo Ravintolapäivän saaliisi baariimme. Me yhdistämme sen juomiin.'", "Ravintolapäivän jälkeinen juoma on valtaamatonta aluetta. Asemoi: 'Sinä kokkasit koko päivän. Anna meidän kaataa.'"],
      },
      suggestedTemplates: ["food-drink-pairing", "chefs-special", "neighbourhood-night"],
      audienceBoost: ["food-focused", "neighborhood-locals", "city-explorers"],
      atmospherePair: ["authentic-honest", "joyful-lighthearted", "easy-carefree"],
    },
    {
      id: "helsinki-pride",
      name: { en: "Helsinki Pride", fi: "Helsinki Pride" },
      category: "cultural",
      dateRange: { start: { month: 5, day: 24 }, end: { month: 5, day: 30 } },
      teaseDaysBefore: 14,
      buildDaysBefore: 7,
      recoveryDaysAfter: 1,
      hooks: {
        en: ["Pride week — the city celebrates, the bar is a safe and joyful space", "Pride after-party — the parade ends, the party continues at the bar", "Pride isn't just one weekend — it's a week of celebration"],
        fi: ["Pride-viikko — kaupunki juhlii, baari on turvallinen ja iloinen tila", "Priden jatkot — paraati päättyy, bileet jatkuvat baarissa", "Pride ei ole vain yksi viikonloppu — se on viikon juhla"],
      },
      differentiators: {
        en: ["Pride marketing should feel genuine, not opportunistic. Lead with atmosphere and welcome, not discounts.", "The Pride after-party positioning: 'The parade ends at 16:00. We start at 16:01.'"],
        fi: ["Pride-markkinoinnin tulee tuntua aidolta, ei opportunistiselta. Johda tunnelmalla ja tervetulotoivotuksella, ei alennuksilla.", "Priden jatkobileiden positiointi: 'Paraati päättyy klo 16. Me aloitamme klo 16.01.'"],
      },
      suggestedTemplates: ["group-celebration", "theme-night", "weekend-special"],
      audienceBoost: ["celebrants", "friend-groups", "city-explorers"],
      atmospherePair: ["joyful-lighthearted", "bold-distinctive", "celebratory-meaningful"],
    },

    // ── SPORTS EVENTS ──────────────────────────────────────────────
    {
      id: "ice-hockey-worlds",
      name: { en: "Ice Hockey World Championships", fi: "Jääkiekon MM-kisat" },
      category: "sports",
      dateRange: { start: { month: 4, day: 10 }, end: { month: 4, day: 25 } },
      teaseDaysBefore: 14,
      buildDaysBefore: 7,
      recoveryDaysAfter: 3,
      hooks: {
        en: ["IIHF Worlds — Finland stops for hockey, bars are the living rooms of the nation", "Game night: every screen matters, every goal is a communal moment", "The 'torille' energy — when Finland wins, the streets fill. Your bar is torille."],
        fi: ["MM-kisat — Suomi pysähtyy jääkiekkoon, baarit ovat kansan olohuoneita", "Peliyö: jokainen ruutu merkitsee, jokainen maali on yhteinen hetki", "Torille-energia — kun Suomi voittaa, kadut täyttyvät. Baarisi on torille."],
      },
      differentiators: {
        en: ["Every sports bar shows the game. Differentiate: 'We don't just show the game — we have a hockey cocktail menu.'", "The gold medal game after-party. 'If we win, drinks are on us until midnight. If we lose, drinks are DEFINITELY on us.'"],
        fi: ["Jokainen urheilubaari näyttää pelin. Erottaudu: 'Me emme vain näytä peliä — meillä on lätkäcocktailmenu.'", "Kultapelin jatkot. 'Jos voitamme, juomat talon piikkiin keskiyöhön. Jos häviämme, juomat EHDO TTOMASTI talon piikkiin.'"],
      },
      suggestedTemplates: ["sports-screening", "group-celebration", "weekend-special"],
      audienceBoost: ["friend-groups", "neighborhood-locals", "celebrants"],
      atmospherePair: ["energetic-pulsating", "bold-distinctive", "joyful-lighthearted"],
    },
    {
      id: "liiga-playoffs",
      name: { en: "Liiga Playoffs", fi: "Liigan pudotuspelit" },
      category: "sports",
      dateRange: { start: { month: 2, day: 15 }, end: { month: 3, day: 30 } },
      teaseDaysBefore: 7,
      buildDaysBefore: 3,
      recoveryDaysAfter: 1,
      hooks: {
        en: ["Liiga playoffs — every game is do-or-die, the bar tension is electric", "Local team pride — when HIFK or Jokerit plays, the neighborhood belongs to hockey", "Playoff watch parties — the bar as the second arena"],
        fi: ["Liigan pudotuspelit — jokainen peli on elämästä ja kuolemasta, baarin jännitys on sähköinen", "Paikallinen seuraylpeys — kun HIFK tai Jokerit pelaa, kortteli kuuluu lätkälle", "Pudotuspelien kisakatsomot — baari toisena areenana"],
      },
      differentiators: {
        en: ["Local team allegiance is tribal. Know which team your neighborhood supports and lean in.", "Playoff 'survival kits': a beer and a shot combo named after the opposing team's worst player."],
        fi: ["Paikallisen joukkueen kannatus on heimollista. Tiedä mitä joukkuetta korttelisi kannattaa ja nojaa siihen.", "Pudotuspelien 'selviytymispakkaus': olut ja shotti -kombo nimettynä vastustajan huonoimman pelaajan mukaan."],
      },
      suggestedTemplates: ["sports-screening", "regulars-night", "weekend-special"],
      audienceBoost: ["neighborhood-locals", "friend-groups"],
      atmospherePair: ["energetic-pulsating", "bold-distinctive"],
    },
    {
      id: "eurovision",
      name: { en: "Eurovision", fi: "Euroviisut" },
      category: "cultural",
      dateRange: { start: { month: 4, day: 10 }, end: { month: 4, day: 15 } },
      teaseDaysBefore: 14,
      buildDaysBefore: 7,
      recoveryDaysAfter: 1,
      hooks: {
        en: ["Eurovision — the world's most gloriously unhinged music night. Finland takes this VERY seriously.", "Eurovision watch party — costumes encouraged, scoring paddles mandatory", "The post-Eurovision debate: 'Norway was robbed.' 'No, Finland was.'"],
        fi: ["Euroviisut — maailman loistavimman överi musiikki-ilta. Suomi ottaa tämän ERITTÄIN vakavasti.", "Euroviisujen kisakatsomo — asut kannustettuja, pistetaulut pakollisia", "Euroviisujen jälkipuinti: 'Norja ryöstettiin.' 'Ei, Suomi ryöstettiin.'"],
      },
      differentiators: {
        en: ["Eurovision is pure camp. Lean ALL the way in. Costume contest. National drink for each country. Judge's panel.", "'Eurovision bingo' — take a drink every time there's a wind machine, key change, or pyro curtain."],
        fi: ["Euroviisut on puhdasta campia. Nojaa TÄYSILLÄ mukaan. Asukilpailu. Maakohtainen drinkki. Tuomaripaneeli.", "'Euroviisubingo' — ota drinkki aina kun on tuulikone, sävellajin vaihto tai pyroverho."],
      },
      suggestedTemplates: ["theme-night", "group-celebration", "weekend-special"],
      audienceBoost: ["friend-groups", "music-lovers", "celebrants"],
      atmospherePair: ["playful-surprising", "joyful-lighthearted", "bold-distinctive"],
    },

    // ── SEASONAL MARKERS ───────────────────────────────────────────
    {
      id: "terrace-season",
      name: { en: "Terrace season opens", fi: "Terassikausi avautuu" },
      category: "seasonal",
      dateRange: { start: { month: 3, day: 15 }, end: { month: 4, day: 30 } },
      teaseDaysBefore: 14,
      buildDaysBefore: 5,
      recoveryDaysAfter: 0,
      hooks: {
        en: ["First terrace day — the most important bar holiday that isn't on any calendar", "Terrace season opening — when the chairs go out, the city comes alive", "The first warm Friday of spring — the terrace is the only place to be"],
        fi: ["Ensimmäinen terassipäivä — tärkein kalentereista puuttuva baaripyhä", "Terassikauden avaus — kun tuolit tulevat ulos, kaupunki herää eloon", "Kevään ensimmäinen lämmin perjantai — terassi on ainoa oikea paikka"],
      },
      differentiators: {
        en: ["Weather-dependent. Watch the forecast. When the first 15°C day hits, be the first bar to post 'Terrace is open.'", "Don't wait for May. The first terrace day can be in March. Be ready."],
        fi: ["Sääriippuvainen. Seuraa ennustetta. Kun ensimmäinen 15°C päivä osuu, ole ensimmäinen baari joka postaa 'Terassi on auki.'", "Älä odota toukokuuta. Ensimmäinen terassipäivä voi olla maaliskuussa. Ole valmis."],
      },
      suggestedTemplates: ["seasonal-special", "after-work", "neighbourhood-night"],
      audienceBoost: ["city-explorers", "casual-evening", "friend-groups"],
      atmospherePair: ["easy-carefree", "joyful-lighthearted"],
    },
    {
      id: "back-to-school",
      name: { en: "Back to School / Student season", fi: "Opiskelijat palaavat" },
      category: "seasonal",
      dateRange: { start: { month: 7, day: 25 }, end: { month: 8, day: 31 } },
      teaseDaysBefore: 7,
      buildDaysBefore: 3,
      recoveryDaysAfter: 0,
      hooks: {
        en: ["Students return — the city's energy shifts, the nightlife calendar resets", "Orientation week — thousands of new students looking for 'their' bar", "Freshman season — first impressions that last four years"],
        fi: ["Opiskelijat palaavat — kaupungin energia muuttuu, yöelämän kalenteri nollautuu", "Orientaatioviikko — tuhannet uudet opiskelijat etsivät 'omaa' baariaan", "Fuksi-sesonki — ensivaikutelmia jotka kestävät neljä vuotta"],
      },
      differentiators: {
        en: ["Students are looking for their regular spot. 'First drink on us for new students' creates loyalty that lasts years.", "University-specific nights: 'Aalto students Tuesday, UH Wednesday.' Own a night."],
        fi: ["Opiskelijat etsivät kanta-paikkaansa. 'Ensimmäinen juoma talon piikkiin uusille opiskelijoille' luo vuosien uskollisuutta.", "Yliopistokohtaiset illat: 'Aalto tiistaina, HY keskiviikkona.' Omista ilta."],
      },
      suggestedTemplates: ["student-night", "regulars-night", "neighbourhood-night"],
      audienceBoost: ["friend-groups", "meeting-people", "neighborhood-locals"],
      atmospherePair: ["energetic-pulsating", "easy-carefree", "joyful-lighthearted"],
    },
  ];

  _calendarCache = { year, events };
  return events;
}

// ---- Phase computation ----

function computePhase(
  event: CalendarEvent,
  now: Date,
): { phase: EventPhase; daysUntil: number; isActive: boolean } {
  const year = now.getFullYear();
  const today = dateToYearless(now);

  // Determine the event year — if the event is in the past relative to now,
  // check if it's within recovery window (event from this year) or we're in
  // tease window for next year's occurrence
  const eventStart = event.dateRange.start;
  const eventEnd = event.dateRange.end;

  // Normalize: choose the closest occurrence (this year or last year)
  const thisYearStart = yearlessToDate(eventStart, year);
  const thisYearEnd = yearlessToDate(eventEnd, year);

  let refYear = year;
  // If the event is over and we're past recovery, use last year's for day counting
  const recoveryEnd = yearlessToDate(
    addDays(eventEnd, event.recoveryDaysAfter),
    year,
  );
  const teaseStart = yearlessToDate(
    addDays(eventStart, -event.teaseDaysBefore),
    year,
  );

  // If we're past recovery and before next tease, this event is dormant
  if (now > recoveryEnd && now < teaseStart) {
    // Check if we should look at the event as upcoming (tease hasn't started yet)
    // Skip ahead to next occurrence
    refYear = year + 1;
  }

  const refStart = yearlessToDate(eventStart, refYear);
  const refEnd = yearlessToDate(eventEnd, refYear);

  const daysUntilStart = Math.round(
    (refStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  const isActive =
    now >= yearlessToDate(addDays(eventStart, -(event.teaseDaysBefore - 1)), refYear) &&
    now <= yearlessToDate(addDays(eventEnd, event.recoveryDaysAfter), refYear);

  let phase: EventPhase = "dormant";
  if (!isActive) {
    phase = "dormant";
  } else if (daysUntilStart >= event.buildDaysBefore) {
    phase = "tease";
  } else if (daysUntilStart >= 0) {
    phase = "build";
  } else if (daysUntilStart >= -(
    daysBetween(eventStart, eventEnd) + event.recoveryDaysAfter
  )) {
    phase = daysUntilStart < daysBetween(eventStart, eventEnd)
      ? "celebrate"
      : "recovery";
  }

  // Override: if within tease window but before event start
  if (phase === "dormant" && daysUntilStart <= event.teaseDaysBefore && daysUntilStart > 0) {
    return computePhase(event, now); // Recurse — shouldn't happen, safety
  }

  return { phase, daysUntil: daysUntilStart, isActive };
}

function leadTimeHint(phase: EventPhase, daysUntil: number, isFi: boolean): string {
  const hints: Record<EventPhase, { en: string; fi: string }> = {
    tease: {
      en: `${daysUntil} days away — start teasing. Plant the idea, don't hard-sell.`,
      fi: `${daysUntil} päivää — aloita kiusoittelu. Istuta idea, älä kovamyy.`,
    },
    build: {
      en: `${daysUntil} days away — build excitement. Specifics now, urgency later.`,
      fi: `${daysUntil} päivää — rakenna odotusta. Yksityiskohdat nyt, kiire myöhemmin.`,
    },
    celebrate: {
      en: daysUntil < 0
        ? `Happening now — celebrate. Real-time energy, FOMO, live moments.`
        : `Starting today — full celebration mode.`,
      fi: daysUntil < 0
        ? `Käynnissä nyt — juhli. Reaaliaikaista energiaa, FOMO, eläviä hetkiä.`
        : `Alkaa tänään — täysi juhlamoodi.`,
    },
    recovery: {
      en: `Just passed — recovery mode. The 'morning after' content.`,
      fi: `Juuri ohi — palautumismoodi. 'Aamun jälkeen' -sisältöä.`,
    },
    dormant: {
      en: "",
      fi: "",
    },
  };
  return isFi ? hints[phase].fi : hints[phase].en;
}

// ---- Public API ----

/**
 * Get all events with their current phase information relative to `now`.
 * Events in "dormant" phase are excluded by default.
 */
export function getCalendarEvents(
  now: Date = new Date(),
  includeDormant = false,
): CalendarEventWithPhases[] {
  const year = now.getFullYear();
  const events = buildCalendarEvents(year);

  const phased = events.map((event) => {
    const { phase, daysUntil, isActive } = computePhase(event, now);
    return {
      ...event,
      phase,
      daysUntil,
      isActive,
      leadTimeHint: {
        en: leadTimeHint(phase, Math.abs(daysUntil), false),
        fi: leadTimeHint(phase, Math.abs(daysUntil), true),
      },
    };
  });

  if (includeDormant) return phased;
  return phased.filter((e) => e.phase !== "dormant");
}

/**
 * Get a complete calendar context — active events, system prompt block,
 * seasonal brief, and the top-priority event right now.
 */
export function getCalendarContext(
  now: Date = new Date(),
  language: "en" | "fi" = "en",
): CalendarContext {
  const all = getCalendarEvents(now, false);
  const active = all.filter((e) => e.isActive);

  // Sort by phase priority: celebrate > build > tease > recovery
  const phaseOrder: Record<EventPhase, number> = {
    celebrate: 0,
    build: 1,
    tease: 2,
    recovery: 3,
    dormant: 4,
  };
  const sorted = [...active].sort(
    (a, b) => phaseOrder[a.phase] - phaseOrder[b.phase],
  );

  const topEvent = sorted[0] ?? null;
  const isFi = language === "fi";

  // Build the system prompt block
  const promptLines: string[] = [];
  const seasonalLines: string[] = [];

  if (sorted.length > 0) {
    if (isFi) {
      promptLines.push("AJANKOHTAISET TAPAHTUMAT — huomioi sisällössä:");
    } else {
      promptLines.push("UPCOMING & CURRENT EVENTS — factor into content:");
    }

    for (const event of sorted.slice(0, 3)) {
      const phaseLabel =
        event.phase === "celebrate"
          ? isFi ? "KÄYNNISSÄ" : "ACTIVE"
          : event.phase === "build"
            ? isFi ? "PIAN" : "UPCOMING"
            : event.phase === "tease"
              ? isFi ? "TULOSSA" : "APPROACHING"
              : isFi ? "JUURI OLI" : "JUST PASSED";

      promptLines.push(
        `\n[${phaseLabel}] ${event.name[language]} (${Math.abs(event.daysUntil)}d ${
          event.daysUntil <= 0 ? (isFi ? "sitten" : "ago") : (isFi ? "päästä" : "away")
        })`,
      );
      promptLines.push(`  ${event.leadTimeHint[language]}`);
      if (event.hooks[language].length > 0) {
        promptLines.push(`  Hook: ${event.hooks[language][0]}`);
      }
      if (event.differentiators[language].length > 0) {
        promptLines.push(`  Differentiator: ${event.differentiators[language][0]}`);
      }
    }

    // Seasonal brief — highest-priority event
    if (topEvent) {
      const top = topEvent;
      seasonalLines.push(top.leadTimeHint[language]);
      if (top.hooks[language].length > 1) {
        seasonalLines.push(top.hooks[language][1]);
      }
      if (top.differentiators[language].length > 0) {
        seasonalLines.push(top.differentiators[language][0]);
      }
    }
  }

  // Fallback if no events are active
  if (seasonalLines.length === 0) {
    const month = now.getMonth();
    if (month >= 5 && month <= 7) {
      seasonalLines.push(
        isFi
          ? "Keskikesän rauhallinen kausi — terassit avoinna, pitkät illat, rento tunnelma"
          : "Midsummer quiet season — terraces open, long evenings, easygoing atmosphere",
      );
    } else if (month >= 8 && month <= 10) {
      seasonalLines.push(
        isFi
          ? "Syksyn paluu arkeen — opiskelijat palaavat, sisätilojen kausi alkaa"
          : "Autumn return to routine — students are back, indoor season begins",
      );
    } else if (month >= 11 || month <= 1) {
      seasonalLines.push(
        isFi
          ? "Talven juhlakausi — pikkujoulut, glögi, sisätilojen lämpö"
          : "Winter celebration season — Christmas parties, mulled wine, indoor warmth",
      );
    } else {
      seasonalLines.push(
        isFi
          ? "Kevät herää — terassikausi lähestyy, energia nousee"
          : "Spring awakening — terrace season approaches, energy rises",
      );
    }
  }

  return {
    active: sorted,
    systemPromptBlock: {
      en: promptLines.join("\n"),
      fi: promptLines.join("\n"),
    },
    topEvent,
    seasonalBrief: {
      en: seasonalLines.join(" "),
      fi: seasonalLines.join(" "),
    },
  };
}

/**
 * Get a compact one-line seasonal context — replaces the old hardcoded
 * `getSeasonalContext()` with calendar-aware output.
 */
export function getSeasonalBrief(now: Date = new Date(), language: "en" | "fi" = "en"): string {
  const ctx = getCalendarContext(now, language);
  return ctx.seasonalBrief[language];
}
