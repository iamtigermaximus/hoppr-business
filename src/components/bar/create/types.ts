// src/components/bar/create/types.ts
// ============================================================================
// SHARED TYPES — Single source of truth for ContentType & FormState
// ============================================================================
//
// Every component in the creation hub imports from here instead of defining
// its own local ContentType / FormState types. This keeps all files in sync
// when new content types are added.
// ============================================================================

export type ContentType = "event" | "promotion" | "pass" | "campaign" | "brand";

/** Creation mode — "brand" = advertising/brand building, "promotional" = deals/offers */
export type CreationMode = "brand" | "promotional";

// ---- Advertising hub ingredient types (re-exported from creative-director for UI use) ----

export type AudienceChip =
  | "friend-groups" | "couples" | "work-colleagues" | "music-lovers"
  | "food-focused" | "neighborhood-locals" | "celebrants" | "city-explorers"
  | "casual-evening" | "premium-seekers" | "seasonal-celebrants" | "meeting-people";

export type CoreMessageChip =
  | "something-new" | "night-is-special" | "best-place" | "did-you-know"
  | "come-as-you-are" | "your-place" | "one-night-one-experience" | "season-is-now";

export type AtmosphereChip =
  | "warm-homey" | "energetic-pulsating" | "calm-serene" | "curious-discovering"
  | "polished-considered" | "authentic-honest" | "joyful-lighthearted"
  | "intimate-personal" | "celebratory-meaningful" | "bold-distinctive"
  | "playful-surprising" | "nostalgic-storied" | "easy-carefree";

export type ImageWorldChip =
  | "venue" | "mood" | "craft" | "nature" | "graphic" | "city" | "celebration" | "abstract";

export type CopyStructureChip = "fab" | "aida" | "pas" | "direct";

// ---- Canonical promotion types — single source of truth for all dropdowns ----

export interface PromotionTypeOption {
  value: string;
  label: string;
}

export const PROMOTION_TYPES: PromotionTypeOption[] = [
  { value: "HAPPY_HOUR", label: "After-Work (Happy Hour)" },
  { value: "DRINK_SPECIAL", label: "Drink Special" },
  { value: "FOOD_SPECIAL", label: "Food Special" },
  { value: "LADIES_NIGHT", label: "Ladies Night" },
  { value: "THEME_NIGHT", label: "Theme Night" },
  { value: "VIP_OFFER", label: "VIP Offer" },
  { value: "COVER_DISCOUNT", label: "Cover Discount" },
  { value: "LIVE_MUSIC_EVENT", label: "Live Music Event" },
  { value: "GAME_NIGHT", label: "Game Night" },
  { value: "SEASONAL", label: "Seasonal" },
];

export interface FormState {
  title: string;
  description: string;
  imageUrl: string | null;
  // Creation mode — "brand" or "promotional"
  creationMode: CreationMode;
  // Brand mode output fields (no price/discount)
  brandHeadline: string;
  brandBody: string;
  brandCta: string;
  // Brand ingredient selections
  audienceChips: AudienceChip[];
  coreMessageChip: CoreMessageChip | null;
  atmosphereChips: AtmosphereChip[];
  imageWorldChip: ImageWorldChip;
  copyStructureChip: CopyStructureChip;
  timeOfDayChip: string;
  seasonChip: string;
  roomEnergyChip: string;
  focalPointChip: string;
  templateName: string;
  // Event
  startTime: string;
  endTime: string;
  maxAttendees: number | null;
  isPrivate: boolean;
  // Promotion
  promotionType: string;
  discountValue: number | null;
  startDate: string;
  endDate: string;
  conditions: string;
  targetAudience: string;
  // Pass
  passType: string;
  priceEuros: string;
  originalPriceEuros: string;
  benefits: string[];
  validDays: string[];
  totalQuantity: number | null;
  maxPerUser: number;
  redemptionMode: string;
  maxRedemptions: number | null;
  skipLinePriority: boolean;
  coverFeeIncluded: boolean;
  coverFeeAmount: number;
  // Boost fields
  boostEnabled: boolean;
  boostBudget: number;
  boostMultiplier: number;
  boostStartDate: string;
  boostEndDate: string;
  // Ad Campaign fields (standalone campaigns, not boost-linked)
  campaignType: string;
  campaignBudget: number;
  campaignStartDate: string;
  campaignEndDate: string;
  promotedItemId: string;
  targetUrl: string;
  // Matching content (promotion → also create an event)
  createMatchingEvent: boolean;

  // Schedule fields
  notifyFollowers: boolean;
  notifyTiming: "now" | "optimal" | "custom";
  notifyCustomTime: string;
  remindBeforeEvent: boolean;
  remindMinutesBefore: number;
  scheduledPublishAt: string;
  // Retargeting
  retargetViewers: boolean;
  retargetDelayHours: number;
}

export const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  imageUrl: null,
  creationMode: "brand",
  brandHeadline: "",
  brandBody: "",
  brandCta: "",
  audienceChips: [],
  coreMessageChip: null,
  atmosphereChips: [],
  imageWorldChip: "venue",
  copyStructureChip: "direct",
  timeOfDayChip: "evening",
  seasonChip: "high-summer",
  roomEnergyChip: "steady-hum",
  focalPointChip: "bar-counter",
  templateName: "",
  startTime: "",
  endTime: "",
  maxAttendees: null,
  isPrivate: false,
  promotionType: "",
  discountValue: null,
  startDate: "",
  endDate: "",
  conditions: "",
  targetAudience: "",
  passType: "",
  priceEuros: "",
  originalPriceEuros: "",
  benefits: [],
  validDays: [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ],
  totalQuantity: null,
  maxPerUser: 1,
  redemptionMode: "SINGLE_USE",
  maxRedemptions: null,
  skipLinePriority: true,
  coverFeeIncluded: false,
  coverFeeAmount: 0,
  boostEnabled: false,
  boostBudget: 20,
  boostMultiplier: 1.5,
  boostStartDate: "",
  boostEndDate: "",
  campaignType: "",
  campaignBudget: 50,
  campaignStartDate: "",
  campaignEndDate: "",
  promotedItemId: "",
  targetUrl: "",
  notifyFollowers: true,
  notifyTiming: "now",
  notifyCustomTime: "",
  remindBeforeEvent: false,
  remindMinutesBefore: 120,
  scheduledPublishAt: "",
  createMatchingEvent: false,
  retargetViewers: false,
  retargetDelayHours: 48,
};

/** Which content types support boost (creates a linked AdCampaign as side effect) */
export function supportsBoost(ct: ContentType): boolean {
  return ct === "promotion" || ct === "event";
}

/** Which content types are standalone campaigns (they ARE the ad, no boost needed) */
export function isStandaloneCampaign(ct: ContentType): boolean {
  return ct === "campaign";
}
