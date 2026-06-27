// src/components/bar/create/types.ts
// ============================================================================
// SHARED TYPES — Single source of truth for ContentType & FormState
// ============================================================================
//
// Every component in the creation hub imports from here instead of defining
// its own local ContentType / FormState types. This keeps all files in sync
// when new content types are added.
// ============================================================================

export type ContentType = "event" | "promotion" | "pass" | "campaign";

export interface FormState {
  title: string;
  description: string;
  imageUrl: string | null;
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
}

export const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  imageUrl: null,
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
};

/** Which content types support boost (creates a linked AdCampaign as side effect) */
export function supportsBoost(ct: ContentType): boolean {
  return ct === "promotion" || ct === "event";
}

/** Which content types are standalone campaigns (they ARE the ad, no boost needed) */
export function isStandaloneCampaign(ct: ContentType): boolean {
  return ct === "campaign";
}
