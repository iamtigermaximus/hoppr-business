// src/lib/ai/fallback-templates.ts
// ============================================================================
// DEEPSEEK FALLBACK TEMPLATES
// ============================================================================
//
// When DeepSeek API is unavailable (key missing, rate limited, or network
// error), these pre-written templates ensure bars can still create promotions
// instead of seeing a dead error screen.
//
// Every template passes Finnish alcohol marketing compliance. They are
// categorized by promotion type and bar type so the selected template
// feels relevant to the bar's actual character.
// ============================================================================

export type PromotionType =
  | "HAPPY_HOUR"
  | "DRINK_SPECIAL"
  | "FOOD_SPECIAL"
  | "LADIES_NIGHT"
  | "THEME_NIGHT"
  | "VIP_OFFER"
  | "COVER_DISCOUNT"
  | "LIVE_MUSIC_EVENT"
  | "GAME_NIGHT"
  | "SEASONAL";

export type ContentType = "event" | "promotion" | "pass" | "campaign";

interface PromotionTemplate {
  title: string;
  description: string;
  type: PromotionType;
  discount: number | null;
  callToAction: string;
  accentColor: string;
  conditions: string;
  visual?: {
    template: "split" | "centered" | "card";
    mood: "warm" | "cool" | "vibrant" | "dark" | "minimal";
    overlayOpacity: number;
  };
}

interface SuggestionTemplate {
  inferredType: ContentType;
  confidence: number;
  title: string;
  description: string;
  reasoning: string;
  imageSuggestion: string;
  // Promotion-specific
  promotionType?: string;
  discountValue?: number | null;
  startDate?: string;
  endDate?: string;
  conditions?: string;
  targetAudience?: string;
  // Event-specific
  startTime?: string | null;
  endTime?: string | null;
  maxAttendees?: number | null;
  isPrivate?: boolean;
  // Pass-specific
  passType?: string;
  priceEuros?: string | null;
  originalPriceEuros?: string | null;
  benefits?: string[];
  totalQuantity?: number | null;
  // Campaign-specific
  campaignType?: string;
  campaignBudget?: number;
}

// ---------------------------------------------------------------------------
// Promotion Templates by Type
// ---------------------------------------------------------------------------

const PROMO_TEMPLATES: Record<PromotionType, PromotionTemplate[]> = {
  HAPPY_HOUR: [
    {
      title: "After-Work Unwind",
      description:
        "Join us for an early evening with great vibes and good company. The perfect way to wrap up your work day in a relaxed setting.",
      type: "HAPPY_HOUR",
      discount: 15,
      callToAction: "Join Us Today",
      accentColor: "#f59e0b",
      conditions: "Weekdays 16-19. Valid with ID. 20+ only.",
    },
    {
      title: "Sunset Social Hour",
      description:
        "Catch the evening glow with us. Great atmosphere, curated music, and the best crowd in town to start your night right.",
      type: "HAPPY_HOUR",
      discount: 20,
      callToAction: "Start Your Evening",
      accentColor: "#f97316",
      conditions: "Daily 17-20. Terms apply. 20+ only.",
    },
  ],
  DRINK_SPECIAL: [
    {
      title: "House Pour Selection",
      description:
        "Discover our carefully selected house pours this week. A chance to explore quality drinks in great surroundings.",
      type: "DRINK_SPECIAL",
      discount: 10,
      callToAction: "View Menu",
      accentColor: "#8b5cf6",
      conditions: "Valid all week. One per customer. 20+ only.",
    },
    {
      title: "Signature Sips Night",
      description:
        "Our bartenders have crafted something special. Come taste our latest creations in an atmosphere built for conversation.",
      type: "DRINK_SPECIAL",
      discount: null,
      callToAction: "Taste Something New",
      accentColor: "#6366f1",
      conditions: "Available Thursday-Saturday. 20+ only.",
    },
  ],
  FOOD_SPECIAL: [
    {
      title: "Kitchen Takeover Menu",
      description:
        "Our kitchen team is showcasing a limited-time menu. Perfect for groups looking to share great food and good times.",
      type: "FOOD_SPECIAL",
      discount: 20,
      callToAction: "See The Menu",
      accentColor: "#10b981",
      conditions: "Available all evening. Groups welcome. Dine-in only.",
    },
    {
      title: "Plates to Share",
      description:
        "Elevate your night out with our sharing menu. Designed to bring people together over exceptional food in a vibrant setting.",
      type: "FOOD_SPECIAL",
      discount: 15,
      callToAction: "Book Your Table",
      accentColor: "#059669",
      conditions: "Evenings from 18:00. Booking recommended.",
    },
  ],
  LADIES_NIGHT: [
    {
      title: "Girls' Night Out",
      description:
        "Gather your crew for a night of great music and memorable moments. Premium experience in a welcoming atmosphere.",
      type: "LADIES_NIGHT",
      discount: null,
      callToAction: "Round Up The Crew",
      accentColor: "#ec4899",
      conditions: "Every Friday. Guest list recommended. 20+ only.",
    },
    {
      title: "Sister Social Evening",
      description:
        "An evening celebrating good friends and good times. Music, ambiance, and a crowd that knows how to enjoy the night.",
      type: "LADIES_NIGHT",
      discount: null,
      callToAction: "Make It A Night",
      accentColor: "#d946ef",
      conditions: "Wednesdays from 20:00. 20+ only.",
    },
  ],
  THEME_NIGHT: [
    {
      title: "Retro Rewind Night",
      description:
        "Step back in time with us. Classic tracks, vintage vibes, and an atmosphere that takes you somewhere special.",
      type: "THEME_NIGHT",
      discount: null,
      callToAction: "Dress The Part",
      accentColor: "#f43f5e",
      conditions: "Saturday from 21:00. Theme attire encouraged. 20+ only.",
    },
    {
      title: "Around The World Evening",
      description:
        "Travel without leaving your seat. A curated journey through music and atmosphere from across the globe.",
      type: "THEME_NIGHT",
      discount: null,
      callToAction: "Join The Journey",
      accentColor: "#06b6d4",
      conditions: "Friday from 20:00. 20+ only.",
    },
  ],
  VIP_OFFER: [
    {
      title: "Premium Experience Pass",
      description:
        "Skip the line and step into our exclusive area. Priority entry and reserved seating for you and your guests.",
      type: "VIP_OFFER",
      discount: null,
      callToAction: "Go Premium",
      accentColor: "#eab308",
      conditions: "Advance booking required. Subject to availability. 20+ only.",
    },
    {
      title: "Elevated Evening Access",
      description:
        "Enjoy the best seats in the house. Priority service, exclusive area access, and a night that's a step above.",
      type: "VIP_OFFER",
      discount: null,
      callToAction: "Reserve Your Spot",
      accentColor: "#d4af37",
      conditions: "Minimum spend applies. Reservation required. 20+ only.",
    },
  ],
  COVER_DISCOUNT: [
    {
      title: "Early Entry Special",
      description:
        "Arrive early and enjoy a reduced entry fee. Beat the queue and settle in before the crowd arrives.",
      type: "COVER_DISCOUNT",
      discount: 50,
      callToAction: "Come Early",
      accentColor: "#22c55e",
      conditions: "Before 22:00 on weekends. Valid ID required. 20+ only.",
    },
    {
      title: "Guest List Entry",
      description:
        "Sign up for our guest list and enjoy priority entry at a reduced rate. Your night, made easier.",
      type: "COVER_DISCOUNT",
      discount: 30,
      callToAction: "Get On The List",
      accentColor: "#4ade80",
      conditions: "Register by 18:00 on the day. 20+ only.",
    },
  ],
  LIVE_MUSIC_EVENT: [
    {
      title: "Live & Unplugged",
      description:
        "An evening of live music in an intimate setting. Great acoustics, talented artists, and the perfect backdrop for your night.",
      type: "LIVE_MUSIC_EVENT",
      discount: null,
      callToAction: "Hear It Live",
      accentColor: "#a855f7",
      conditions: "Music starts at 21:00. Limited capacity. 20+ only.",
    },
    {
      title: "Acoustic Sessions",
      description:
        "Discover local talent in our cozy venue. A relaxed evening with handpicked musicians and great atmosphere.",
      type: "LIVE_MUSIC_EVENT",
      discount: null,
      callToAction: "Discover Talent",
      accentColor: "#7c3aed",
      conditions: "Every Thursday. Free entry before 20:00. 20+ only.",
    },
  ],
  GAME_NIGHT: [
    {
      title: "Game On Social Night",
      description:
        "Bring your competitive spirit. An evening of games, laughs, and friendly rivalry in a buzzing atmosphere.",
      type: "GAME_NIGHT",
      discount: null,
      callToAction: "Play With Us",
      accentColor: "#ef4444",
      conditions: "Tuesday from 19:00. Teams welcome. 20+ only.",
    },
    {
      title: "Quiz & Sip Evening",
      description:
        "Test your knowledge, challenge friends, and enjoy a night of brain-teasing fun in great company.",
      type: "GAME_NIGHT",
      discount: null,
      callToAction: "Form Your Team",
      accentColor: "#f97316",
      conditions: "Teams of 2-6. Register by 19:30. 20+ only.",
    },
  ],
  SEASONAL: [
    {
      title: "Summer Terrace Sessions",
      description:
        "Make the most of the season on our terrace. Long evenings, great atmosphere, and the best spot in town to soak up the summer vibes.",
      type: "SEASONAL",
      discount: null,
      callToAction: "Join Us Outside",
      accentColor: "#f59e0b",
      conditions: "Weather permitting. Limited terrace seating. 20+ only.",
    },
    {
      title: "Winter Warmers Evening",
      description:
        "Escape the cold and settle into our cosy winter atmosphere. Warm lighting, seasonal flavours, and a welcoming escape from the chill.",
      type: "SEASONAL",
      discount: null,
      callToAction: "Get Cosy",
      accentColor: "#6366f1",
      conditions: "Available throughout the winter season. 20+ only.",
    },
  ],
};

// ---------------------------------------------------------------------------
// Bar-type modifiers — tweak templates slightly to match bar character
// ---------------------------------------------------------------------------

const BAR_TYPE_TONE: Record<string, { atmosphere: string; crowd: string }> = {
  PUB: {
    atmosphere: "cosy and welcoming setting",
    crowd: "friendly locals",
  },
  CLUB: {
    atmosphere: "high-energy atmosphere",
    crowd: "the best party crowd",
  },
  LOUNGE: {
    atmosphere: "sophisticated and relaxed lounge",
    crowd: "a stylish crowd",
  },
  SPORTS_BAR: {
    atmosphere: "lively sports bar setting",
    crowd: "fellow fans",
  },
  KARAOKE: {
    atmosphere: "entertaining karaoke bar",
    crowd: "a crowd that loves to sing",
  },
  COCKTAIL_BAR: {
    atmosphere: "intimate cocktail atmosphere",
    crowd: "discerning guests",
  },
  WINE_BAR: {
    atmosphere: "elegant wine bar setting",
    crowd: "those who appreciate quality",
  },
  ROOFTOP: {
    atmosphere: "stunning rooftop setting",
    crowd: "a vibrant crowd with a view",
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get a fallback promotion template when DeepSeek is unavailable.
 *
 * Selects a template matching the requested promotion type, rotating through
 * variants deterministically based on the bar name (so the same bar gets
 * the same template each call — avoids jarring changes on retry).
 */
export function getFallbackPromotion(
  barContext: { name: string; type: string; cityName?: string; district?: string },
  promoType: PromotionType,
  targetAudience?: string,
): PromotionTemplate {
  const templates = PROMO_TEMPLATES[promoType] ?? PROMO_TEMPLATES["DRINK_SPECIAL"];

  // Deterministic rotation: pick template based on bar name hash
  const hash = simpleHash(barContext.name);
  const index = hash % templates.length;
  const template = templates[index];

  // Inject bar name and local flavor into the template
  const tone = BAR_TYPE_TONE[barContext.type] ?? BAR_TYPE_TONE["PUB"];
  const location = barContext.district
    ? `${barContext.district}, ${barContext.cityName || ""}`
    : barContext.cityName || "";

  const localPhrase = location ? ` in ${location}` : "";

  // Compute visual params from promotion type
  const visual = computeVisualParams(promoType, tone.atmosphere);

  return {
    title: personalizeTitle(template.title, barContext.name),
    description: template.description.replace(
      "a vibrant setting",
      `our ${tone.atmosphere}`,
    ),
    type: template.type,
    discount: template.discount,
    callToAction: template.callToAction,
    accentColor: template.accentColor,
    conditions: `At ${barContext.name}${localPhrase}. ${template.conditions}`,
    visual,
  };
}

// Compute sensible visual params for fallback templates
function computeVisualParams(
  promoType: PromotionType,
  _atmosphere: string,
): PromotionTemplate["visual"] {
  switch (promoType) {
    case "LIVE_MUSIC_EVENT":
    case "THEME_NIGHT":
      return { template: "centered", mood: "cool", overlayOpacity: 0.45 };
    case "FOOD_SPECIAL":
      return { template: "split", mood: "warm", overlayOpacity: 0.35 };
    case "HAPPY_HOUR":
      return { template: "card", mood: "vibrant", overlayOpacity: 0.4 };
    case "VIP_OFFER":
    case "LADIES_NIGHT":
      return { template: "card", mood: "vibrant", overlayOpacity: 0.4 };
    case "SEASONAL":
      return { template: "split", mood: "warm", overlayOpacity: 0.35 };
    default:
      return { template: "card", mood: "dark", overlayOpacity: 0.4 };
  }
}

/**
 * Get a fallback suggestion when DeepSeek is unavailable for the
 * create/suggest endpoint. Returns a reasonable inferred suggestion
 * based on keyword matching in the user's text.
 */
export function getFallbackSuggestion(
  barContext: { name: string; type: string },
  userText: string,
): SuggestionTemplate {
  const lower = userText.toLowerCase();
  const today = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // Keyword-based inference
  const isEvent = /event|party|dj|band|music|live|concert|karaoke|quiz/i.test(lower);
  const isCampaign = /advertise|boost|feature|promote.*bar|campaign|banner/i.test(lower);
  const isPass = /pass|skip.*line|vip.*entry|cover.*included|ticket/i.test(lower);

  const inferredType: ContentType = isCampaign
    ? "campaign"
    : isPass
      ? "pass"
      : isEvent
        ? "event"
        : "promotion";

  const tone = BAR_TYPE_TONE[barContext.type] ?? BAR_TYPE_TONE["PUB"];

  const base: SuggestionTemplate = {
    inferredType,
    confidence: 0.6,
    title: `${barContext.name} Special`,
    description: `Something new at ${barContext.name}. Join us in our ${tone.atmosphere} for a memorable experience.`,
    reasoning: `This appears to be a ${inferredType} based on your description. I've pre-filled the fields below — you can edit anything before publishing.`,
    imageSuggestion: "bar-ambiance",
  };

  // Type-specific defaults
  if (inferredType === "event") {
    base.startTime = null;
    base.endTime = null;
    base.maxAttendees = null;
    base.isPrivate = false;
    base.title = extractTitle(userText, barContext.name);
  } else if (inferredType === "promotion") {
    base.promotionType = "DRINK_SPECIAL";
    base.discountValue = null;
    base.startDate = today;
    base.endDate = nextWeek;
    base.conditions = "Valid with ID. Terms apply. 20+ only.";
    base.targetAudience = "EVERYONE";
    base.title = extractTitle(userText, barContext.name);
  } else if (inferredType === "campaign") {
    base.campaignType = "FEATURED_LISTING";
    base.campaignBudget = 50;
    base.startDate = today;
    base.endDate = nextWeek;
  } else if (inferredType === "pass") {
    base.passType = "SKIP_LINE";
    base.priceEuros = null;
    base.originalPriceEuros = null;
    base.benefits = ["Priority entry"];
    base.totalQuantity = null;
  }

  return base;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simple deterministic hash from a string — used for template rotation. */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash + chr) | 0;
  }
  return Math.abs(hash);
}

/** Blend the bar name into the title if it doesn't already contain it. */
function personalizeTitle(title: string, barName: string): string {
  if (title.toLowerCase().includes(barName.toLowerCase())) return title;
  // Keep titles concise — if adding the bar name makes it too long, leave it
  if (title.length + barName.length + 3 > 60) return title;
  return `${title} at ${barName}`;
}

/** Try to extract a usable title from user text; fall back to bar name. */
function extractTitle(text: string, barName: string): string {
  // Take first 50 chars, strip special chars, use as placeholder
  const cleaned = text
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
    .slice(0, 50);
  return cleaned || `${barName} Special`;
}
