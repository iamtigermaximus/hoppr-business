"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import { scanCompliance } from "@/lib/compliance-engine";
import type { ComplianceViolation } from "@/lib/compliance-engine";
import type { ContentType, FormState } from "./types";
import { EMPTY_FORM, supportsBoost } from "./types";
import UnifiedCreationFlow from "./UnifiedCreationFlow";
import ComplianceBar from "./ComplianceBar";
import SuggestionPanel from "./SuggestionPanel";
import ComplianceReferencePanel from "./ComplianceReferencePanel";
import ConsumerPreviewPanel from "./ConsumerPreviewPanel";
import { generateCaption } from "./ShareCard";
import { PromotionImagePreview } from "./PromotionImagePreview";
import type { PromotionImageInput } from "@/lib/og-templates/generate";
import type { ContentTone } from "./ToneSelector";

// ---- Styled Components ----

const HubLayout = styled.div`
  display: flex;
  gap: 1.5rem;
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;

  @media (max-width: 1023px) {
    flex-direction: column;
  }
`;

const FormPanel = styled.div`
  flex: 1;
  min-width: 0;
`;

const PreviewPanel = styled.div`
  width: 400px;
  flex-shrink: 0;
  position: sticky;
  top: 1rem;
  align-self: flex-start;

  @media (max-width: 1023px) {
    width: 100%;
    position: static;
    order: -1;
  }
`;

const PageHeader = styled.div`
  margin-bottom: 1.25rem;
`;

const Title = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.25rem;
`;

const Subtitle = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
`;

const ToastContainer = styled.div`
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 5000;
`;

const Toast = styled.div<{ $type: "success" | "error" }>`
  padding: 0.75rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background: ${({ $type }) => ($type === "success" ? "#dcfce7" : "#fef2f2")};
  color: ${({ $type }) => ($type === "success" ? "#166534" : "#dc2626")};
  border: 1px solid ${({ $type }) => ($type === "success" ? "#86efac" : "#fecaca")};
  animation: slideUp 0.3s ease;

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// ---- Success State ----

const SuccessCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
`;

const SuccessHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const SuccessIcon = styled.span`
  font-size: 1.5rem;
`;

const SuccessTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const SuccessMeta = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
`;

const MetaChip = styled.span<{ $variant?: "green" | "amber" | "gray" }>`
  padding: 0.25rem 0.625rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${({ $variant }) =>
    $variant === "green" ? "#d1fae5" : $variant === "amber" ? "#fef3c7" : "#f3f4f6"};
  color: ${({ $variant }) =>
    $variant === "green" ? "#065f46" : $variant === "amber" ? "#92400e" : "#6b7280"};
`;

const ActionRow = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
`;

const ActionButton = styled.button<{ $variant: "primary" | "secondary" | "outline" }>`
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid ${({ $variant }) => ($variant === "outline" ? "#d1d5db" : "transparent")};
  background: ${({ $variant }) =>
    $variant === "primary" ? "#7c3aed" : $variant === "secondary" ? "#10b981" : "white"};
  color: ${({ $variant }) => ($variant === "outline" ? "#374151" : "white")};

  &:hover {
    background: ${({ $variant }) =>
      $variant === "primary" ? "#6d28d9" : $variant === "secondary" ? "#059669" : "#f3f4f6"};
  }
`;

// ---- Social posting styled components ----

const SocialPostSection = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
`;

const SocialPostLabel = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 0.75rem;
`;

const SocialPostButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const SocialPostBtn = styled.button<{ $variant: "instagram" | "facebook" | "both" }>`
  padding: 0.625rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  color: white;
  transition: all 0.15s;
  background: ${({ $variant }) =>
    $variant === "instagram"
      ? "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)"
      : $variant === "facebook"
      ? "#1877f2"
      : "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)"};

  &:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SocialConnectBtn = styled.button`
  padding: 0.625rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px dashed #d1d5db;
  background: #f9fafb;
  color: #6b7280;
  transition: all 0.15s;

  &:hover {
    border-color: #3b82f6;
    color: #3b82f6;
    background: #eff6ff;
  }
`;

const SocialStatus = styled.div`
  margin-top: 0.75rem;
  font-size: 0.8125rem;
  color: #6b7280;
  font-style: italic;
`;

const SocialResults = styled.div`
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const SocialResultItem = styled.div<{ $success: boolean }>`
  font-size: 0.8125rem;
  font-weight: 500;
  color: ${({ $success }) => ($success ? "#059669" : "#dc2626")};
`;

const SocialCardWrapper = styled.div`
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  margin-bottom: 0.75rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
`;

const DownloadButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #7c3aed;
  color: white;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: #6d28d9;
  }
`;

const SocialLoadingHint = styled.div`
  font-size: 0.8125rem;
  color: #6b7280;
  font-style: italic;
  text-align: center;
  padding: 1rem;
`;

interface CreatedItem {
  id: string;
  type: string;
  title: string;
  boosted: boolean;
}

// ---- CTA builder for social media cards ----

const PROMO_TYPE_LABELS: Record<string, string> = {
  HAPPY_HOUR: "HAPPY HOUR",
  DRINK_SPECIAL: "DRINK SPECIAL",
  FOOD_SPECIAL: "FOOD SPECIAL",
  LADIES_NIGHT: "LADIES NIGHT",
  THEME_NIGHT: "THEME NIGHT",
  VIP_OFFER: "VIP OFFER",
  COVER_DISCOUNT: "COVER DISCOUNT",
  LIVE_MUSIC_EVENT: "LIVE MUSIC",
  GAME_NIGHT: "GAME NIGHT",
  SEASONAL: "SEASONAL",
};

/** Build a social-media-appropriate CTA — not "View Offer" but actual promo details */
function buildSocialCta(
  contentType: "event" | "promotion",
  promotionType?: string,
  discountValue?: number | null,
  conditions?: string,
  startTime?: string,
): string {
  if (contentType === "promotion") {
    if (discountValue != null && discountValue > 0) {
      return `${discountValue}% OFF`;
    }
    if (promotionType && PROMO_TYPE_LABELS[promotionType]) {
      return PROMO_TYPE_LABELS[promotionType];
    }
    return conditions || "SPECIAL OFFER";
  }

  // Events — show the date
  if (startTime) {
    try {
      const d = new Date(startTime);
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }).toUpperCase();
    } catch {
      // fall through
    }
  }
  return "LIVE EVENT";
}

/** Format a date for social card display: "Jul 3 – Jul 10" or "Thu, Jul 10" */
function fmtDate(d: Date, short?: boolean): string {
  return d.toLocaleDateString("en-US", short
    ? { weekday: "short", month: "short", day: "numeric" }
    : { month: "short", day: "numeric" });
}

/** Format time for social card display: "9 PM" or "9 PM – 2 AM" */
function fmtTime(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "numeric", hour12: true }).replace(":00", "");
}

/** Build the conditions line — shows the key marketing details that matter on social media */
function buildSocialConditions(
  contentType: string,
  discountValue?: number | null,
  startDate?: string,
  endDate?: string,
  startTime?: string,
  endTime?: string,
  userConditions?: string,
): string {
  const parts: string[] = [];

  if (contentType === "event" && startTime) {
    try {
      const s = new Date(startTime);
      parts.push(`${fmtDate(s, true)} · ${fmtTime(s)}${endTime ? ` – ${fmtTime(new Date(endTime))}` : ""}`);
    } catch { /* skip */ }
  }

  if (contentType === "promotion") {
    if (discountValue != null && discountValue > 0) {
      parts.push(`${discountValue}% off`);
    }
    if (startDate) {
      try {
        const sd = new Date(startDate);
        const ed = endDate ? new Date(endDate) : null;
        parts.push(ed ? `${fmtDate(sd)} – ${fmtDate(ed)}` : fmtDate(sd));
      } catch { /* skip */ }
    }
  }

  // Append user-written conditions if they contain real info (not the default placeholder)
  if (userConditions && userConditions !== "Valid with ID. Terms apply.") {
    parts.push(userConditions);
  }

  return parts.join(" · ");
}

// ---- Component ----

interface CreateHubClientProps {
  barId: string;
  userRole: string;
  barName: string;
  barCoverImage: string | null;
  barLogoUrl: string | null;
  contentTone?: ContentTone | null;
}

export default function CreateHubClient({ barId, userRole, barName, barCoverImage, barLogoUrl, contentTone }: CreateHubClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Allow pre-selecting content type via ?type= query param
  const initialType = useMemo(() => {
    const typeParam = searchParams.get("type");
    const validTypes: ContentType[] = ["event", "promotion", "campaign", "pass"];
    return validTypes.includes(typeParam as ContentType)
      ? (typeParam as ContentType)
      : "promotion";
  }, [searchParams]);

  const [contentType, setContentType] = useState<ContentType>(initialType);
  const [formState, setFormState] = useState<FormState>(EMPTY_FORM);
  const [aiInferred, setAiInferred] = useState(false);
  const [aiVisual, setAiVisual] = useState<Record<string, unknown> | null>(null);
  const [complianceExpanded, setComplianceExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewCollapsed, setPreviewCollapsed] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [createdItem, setCreatedItem] = useState<CreatedItem | null>(null);
  const [activeTone, setActiveTone] = useState<ContentTone | null | undefined>(contentTone);
  const [cardFormat, setCardFormat] = useState<"square" | "wide" | "banner">("wide");
  // Preserve AI visual params across the submit → success state transition
  const savedAiVisual = useRef<Record<string, unknown> | null>(null);
  const [ogImageDataUrl, setOgImageDataUrl] = useState<string | null>(null);

  // Preserve type-specific state when switching tabs
  const perTypeState = useRef<Map<ContentType, Partial<FormState>>>(new Map());

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("hoppr_token")
      : null;

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ---- Social posting (One-Tap Social Export) ----

  const [socialConnections, setSocialConnections] = useState<
    Array<{ platform: string; igUsername?: string | null; pageName?: string | null; isActive: boolean }>
  >([]);
  const [socialPosting, setSocialPosting] = useState<string | null>(null);
  const [socialResults, setSocialResults] = useState<
    Array<{ platform: string; status: string; postUrl?: string; error?: string }> | null
  >(null);

  // Fetch social connections on mount
  useEffect(() => {
    if (!token || !barId) return;
    fetch(`/api/auth/bar/${barId}/social/status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.connections) setSocialConnections(data.connections);
      })
      .catch(() => {});
  }, [token, barId]);

  const handleConnectSocial = async (platform: "instagram" | "facebook") => {
    if (!token) return;
    try {
      const res = await fetch(`/api/auth/bar/${barId}/social/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ platform }),
      });
      const data = await res.json();
      if (data.oauthUrl) {
        window.location.href = data.oauthUrl;
      }
    } catch {
      showToast("Failed to start connection. Try again.", "error");
    }
  };

  const handleSocialPost = async (platforms: ("instagram" | "facebook")[]) => {
    if (!token || !ogImageDataUrl) return;
    const platformLabel = platforms.join(" & ");
    setSocialPosting(platformLabel);
    setSocialResults(null);

    try {
      const dataUrl = ogImageDataUrl;
      const caption = generateCaption(
        {
          contentType: createdItem!.type as "event" | "promotion",
          title: createdItem!.title,
          description: formState.description,
          barName,
          barLogo: barLogoUrl,
          date:
            createdItem!.type === "promotion"
              ? formState.startDate
              : formState.startTime,
          time:
            createdItem!.type === "event" && formState.startTime
              ? new Date(formState.startTime).toLocaleTimeString("fi-FI", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : undefined,
          consumerUrl: process.env.NEXT_PUBLIC_CONSUMER_URL || "hoppr.fi",
          discountValue: formState.discountValue,
          promotionType: formState.promotionType,
        },
        "fi",
      );

      const res = await fetch(`/api/auth/bar/${barId}/social/post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageDataUrl: dataUrl,
          caption,
          platforms,
          contentType: createdItem!.type,
          contentId: createdItem!.id,
          contentTitle: createdItem!.title,
        }),
      });

      const data = await res.json();
      setSocialResults(data.results || []);
    } catch {
      showToast("Posting failed. Try downloading and posting manually.", "error");
    } finally {
      setSocialPosting(null);
    }
  };

  const instagramConnected = socialConnections.some(
    (c) => c.platform === "INSTAGRAM" && c.isActive,
  );
  const facebookConnected = socialConnections.some(
    (c) => c.platform === "FACEBOOK" && c.isActive,
  );

  const handleFieldChange = useCallback(
    (field: string, value: unknown) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        setPreviewCollapsed(true);
      }
    },
    [],
  );

  const handleTypeChange = useCallback(
    (newType: ContentType) => {
      perTypeState.current.set(contentType, { ...formState });
      const saved = perTypeState.current.get(newType);
      if (saved) {
        setFormState((prev) => ({
          ...EMPTY_FORM,
          title: prev.title,
          description: prev.description,
          imageUrl: prev.imageUrl,
          ...saved,
        }));
      } else {
        setFormState((prev) => ({
          ...EMPTY_FORM,
          title: prev.title,
          description: prev.description,
          imageUrl: prev.imageUrl,
        }));
      }
      setContentType(newType);
    },
    [contentType, formState],
  );

  const handleAIGenerated = useCallback(
    (data: Record<string, unknown>) => {
      setAiLoading(true);

      // Never switch the content type — the user chose it explicitly on stepper step 0.
      // The AI's inferredType is a hint for field values, not a type override.
      const effectiveType = contentType;

      // _previewOnly: variant picker is seeding the side preview — skip per-type
      // state save since the user hasn't committed to this variant yet.
      if (data._previewOnly !== true) {
        perTypeState.current.set(contentType, { ...formState });
      }
      setAiInferred(true);

      // Store AI-selected visual params for OG image rendering
      if (data.visual) {
        setAiVisual(data.visual as Record<string, unknown>);
      }

      // Store the card format the user chose for preview rendering
      if (data.cardFormat) {
        setCardFormat(data.cardFormat as "square" | "wide" | "banner");
      }

      const updates: Partial<FormState> = {
        title: (data.title as string) || formState.title,
        description: (data.description as string) || formState.description,
      };

      if (effectiveType === "event") {
        const now = new Date();
        updates.startTime = (data.startTime as string) || new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
        updates.endTime = (data.endTime as string) || new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString();
        updates.maxAttendees = (data.maxAttendees as number) || null;
      } else if (effectiveType === "promotion") {
        updates.promotionType = (data.promotionType as string) || "DRINK_SPECIAL";
        updates.discountValue = (data.discountValue as number) || null;
        updates.startDate = (data.startDate as string) || new Date().toISOString().split("T")[0];
        updates.endDate = (data.endDate as string) || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        updates.conditions = (data.conditions as string) || "";
        updates.targetAudience = (data.targetAudience as string) || "EVERYONE";
      } else if (effectiveType === "campaign") {
        updates.campaignType = (data.campaignType as string) || "FEATURED_LISTING";
        updates.campaignBudget = (data.campaignBudget as number) || 50;
        updates.campaignStartDate = (data.campaignStartDate as string) || new Date().toISOString().split("T")[0];
        updates.campaignEndDate = (data.campaignEndDate as string) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      } else if (effectiveType === "pass") {
        updates.passType = (data.passType as string) || "SKIP_LINE";
        updates.priceEuros = (data.priceEuros as string) || "";
        updates.originalPriceEuros = (data.originalPriceEuros as string) || "";
        updates.benefits = (data.benefits as string[]) || [];
        updates.totalQuantity = (data.totalQuantity as number) || null;
      }

      setFormState((prev) => ({ ...prev, ...updates }));
      setAiLoading(false);
      setComplianceExpanded(true);
    },
    [contentType, formState],
  );

  const handleAcceptFix = useCallback(
    (newTitle: string, newDescription: string) => {
      setFormState((prev) => ({
        ...prev,
        title: newTitle,
        description: newDescription,
      }));
      setComplianceExpanded(false);
    },
    [],
  );

  // Map content/promotion types to sensible default images for the consumer app
  const getDefaultImageForContent = (
    ct: ContentType,
    promoType?: string,
  ): string => {
    const promoMap: Record<string, string> = {
      HAPPY_HOUR: "/defaults/cocktails.svg",
      DRINK_SPECIAL: "/defaults/cocktails.svg",
      FOOD_SPECIAL: "/defaults/brunch.svg",
      LADIES_NIGHT: "/defaults/cocktails.svg",
      THEME_NIGHT: "/defaults/party.svg",
      VIP_OFFER: "/defaults/vip.svg",
      COVER_DISCOUNT: "/defaults/special-offer.svg",
      LIVE_MUSIC_EVENT: "/defaults/live-music.svg",
      GAME_NIGHT: "/defaults/game-night.svg",
      STUDENT_DISCOUNT: "/defaults/party.svg",
      SEASONAL: "/defaults/bar-ambiance.svg",
    };
    if (promoType && promoMap[promoType]) return promoMap[promoType];
    if (ct === "event") return "/defaults/live-music.svg";
    if (ct === "pass") return "/defaults/vip.svg";
    if (ct === "campaign") return "/defaults/bar-ambiance.svg";
    return "/defaults/bar-ambiance.svg";
  };

  const handleSubmit = async () => {
    if (!token) return;
    setSubmitting(true);
    // Preserve the AI-chosen visual params for the social share card
    savedAiVisual.current = aiVisual;

    try {
      // Fallback: when no image is uploaded/picked, assign a sensible default
      // so the consumer app always has a visual and never shows a blank card.
      const effectiveImageUrl =
        formState.imageUrl && formState.imageUrl.trim().length > 0
          ? formState.imageUrl
          : getDefaultImageForContent(contentType, formState.promotionType);

      const body: Record<string, unknown> = {
        contentType,
        title: formState.title,
        description: formState.description,
        imageUrl: effectiveImageUrl,
      };

      if (contentType === "event") {
        body.startTime = formState.startTime;
        body.endTime = formState.endTime;
        body.maxAttendees = formState.maxAttendees;
        body.isPrivate = formState.isPrivate;
      } else if (contentType === "promotion") {
        body.promotionType = formState.promotionType;
        body.discountValue = formState.discountValue;
        body.startDate = formState.startDate;
        body.endDate = formState.endDate;
        body.conditions = formState.conditions;
        body.targetAudience = formState.targetAudience;
      } else if (contentType === "campaign") {
        body.campaignType = formState.campaignType;
        body.campaignBudget = formState.campaignBudget;
        body.campaignStartDate = formState.campaignStartDate;
        body.campaignEndDate = formState.campaignEndDate;
        body.promotedItemId = formState.promotedItemId;
        body.targetUrl = formState.targetUrl;
      } else if (contentType === "pass") {
        body.passType = formState.passType;
        body.priceEuros = formState.priceEuros;
        body.originalPriceEuros = formState.originalPriceEuros;
        body.benefits = formState.benefits;
        body.validDays = formState.validDays;
        body.totalQuantity = formState.totalQuantity;
        body.maxPerUser = formState.maxPerUser;
        body.redemptionMode = formState.redemptionMode;
        body.maxRedemptions = formState.maxRedemptions;
        body.skipLinePriority = formState.skipLinePriority;
        body.coverFeeIncluded = formState.coverFeeIncluded;
        body.coverFeeAmount = formState.coverFeeAmount;
      }

      // Boost only for promotions and events (campaigns ARE the ad)
      if (supportsBoost(contentType) && formState.boostEnabled) {
        body.boostEnabled = true;
        body.boostBudget = formState.boostBudget;
        body.boostMultiplier = formState.boostMultiplier;
        body.boostStartDate = formState.boostStartDate || formState.startDate || formState.startTime;
        body.boostEndDate = formState.boostEndDate || formState.endDate || formState.endTime;
      }

      const res = await fetch(
        `/api/auth/bar/${barId}/create/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        const errorMsg = data.blocked && data.message ? data.message : data.error || "Failed to create";
        throw new Error(errorMsg);
      }

      const data = await res.json();
      setCreatedItem({
        id: data.record?.id ?? "",
        type: contentType,
        title: formState.title,
        boosted: formState.boostEnabled || contentType === "campaign",
      });
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to create",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setCreatedItem(null);
    setFormState(EMPTY_FORM);
    setAiInferred(false);
    setAiVisual(null);
    setComplianceExpanded(false);
    setOgImageDataUrl(null);
    savedAiVisual.current = null;
  };

  // Compute violations client-side for compliance bar
  const violations: ComplianceViolation[] = formState.title
    ? scanCompliance(formState.title, formState.description).violations
    : [];

  const typeLabel = contentType === "campaign"
    ? "Ad Campaign"
    : contentType.charAt(0).toUpperCase() + contentType.slice(1);

  return (
    <div style={{ padding: "1.5rem" }}>
      <PageHeader>
        <Title>Create Content</Title>
        <Subtitle>
          Describe what you want to create and let AI handle the rest. All content is
          checked for Finnish alcohol marketing compliance.
        </Subtitle>
      </PageHeader>

      {createdItem ? (
        /* ---- Success State ---- */
        <div>
          <SuccessCard>
            <SuccessHeader>
              <SuccessIcon>✅</SuccessIcon>
              <div>
                <SuccessTitle>{typeLabel} created</SuccessTitle>
                <div style={{ fontSize: "0.8125rem", color: "#6b7280", marginTop: "0.125rem" }}>
                  &ldquo;{createdItem.title}&rdquo;
                </div>
              </div>
            </SuccessHeader>

            <SuccessMeta>
              <MetaChip $variant="green">Live in Hoppr</MetaChip>
              {createdItem.boosted && (
                <MetaChip $variant="amber">Boosted</MetaChip>
              )}
              <MetaChip $variant="gray">{typeLabel}</MetaChip>
            </SuccessMeta>

            <ActionRow>
              {!createdItem.boosted && supportsBoost(contentType) && (
                <ActionButton
                  $variant="primary"
                  onClick={() => {
                    setCreatedItem(null);
                    setFormState((prev) => ({ ...prev, boostEnabled: true }));
                  }}
                >
                  🚀 Boost this
                </ActionButton>
              )}
              {!formState.imageUrl && (
                <ActionButton
                  $variant="secondary"
                  onClick={() => {
                    setCreatedItem(null);
                  }}
                >
                  🖼️ Add image
                </ActionButton>
              )}
              <ActionButton
                $variant="outline"
                onClick={() => router.push(`/bar/${barId}/${contentType === "campaign" ? "campaigns" : contentType + "s"}`)}
              >
                View all {contentType === "campaign" ? "campaigns" : contentType + "s"}
              </ActionButton>
              <ActionButton $variant="outline" onClick={handleReset}>
                + Create another
              </ActionButton>
            </ActionRow>
          </SuccessCard>

          {/* ---- Visible OG social media card (downloadable) ---- */}
          {(createdItem.type === "event" || createdItem.type === "promotion") && (
            <SuccessCard>
              <SuccessHeader>
                <SuccessIcon>🎨</SuccessIcon>
                <div>
                  <SuccessTitle>Your Social Media Card</SuccessTitle>
                  <div style={{ fontSize: "0.8125rem", color: "#6b7280", marginTop: "0.125rem" }}>
                    Ready to share on Instagram, Facebook, or download
                  </div>
                </div>
              </SuccessHeader>

              {ogImageDataUrl ? (
                <>
                  <SocialCardWrapper>
                    <img
                      src={ogImageDataUrl}
                      alt="Social media promo card"
                      style={{ width: "100%", display: "block" }}
                    />
                  </SocialCardWrapper>
                  <DownloadButton
                    href={ogImageDataUrl}
                    download={`${createdItem.title.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "").toLowerCase()}-social-card.png`}
                  >
                    ⬇ Download Image
                  </DownloadButton>
                </>
              ) : (
                <SocialLoadingHint>
                  Generating your social media card...
                </SocialLoadingHint>
              )}
            </SuccessCard>
          )}

          {/* Hidden OG image capturer — generates the social media image matching the chosen variant */}
          {(createdItem.type === "event" || createdItem.type === "promotion") && savedAiVisual.current && (() => {
            const template = (savedAiVisual.current.template as "split" | "centered" | "card") || (createdItem.type === "event" ? "centered" : "card");
            // Match format to template's native aspect ratio:
            // - card:     1080×1080 square → Instagram feed (1:1), Facebook feed
            // - split:    1200×630  wide → Instagram feed (1.91:1), Facebook link share
            // - centered: 1200×630  wide → Instagram feed (1.91:1), Facebook link share
            const format = template === "card" ? "square" : "wide";

            return (
            <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
              <PromotionImagePreview
                input={{
                  barName: barName || "Your Bar",
                  barType: "PUB",
                  promotionTitle: createdItem.title,
                  promotionDescription: formState.description || "Special offer — come check it out.",
                  promotionType: (formState.promotionType || (createdItem.type === "event" ? "LIVE_MUSIC_EVENT" : "DRINK_SPECIAL")) as PromotionImageInput["promotionType"],
                  callToAction: buildSocialCta(
                    createdItem.type as "event" | "promotion",
                    formState.promotionType,
                    formState.discountValue,
                    formState.conditions,
                    formState.startTime,
                  ),
                  accentColor: (savedAiVisual.current.accentColor as string) || "#8b5cf6",
                  discount: formState.discountValue ?? null,
                  conditions: buildSocialConditions(
                    createdItem.type,
                    formState.discountValue,
                    formState.startDate,
                    formState.endDate,
                    formState.startTime,
                    formState.endTime,
                    formState.conditions,
                  ) || "Helsinki",
                  photoUrl: formState.imageUrl || null,
                  venueLocation: "Helsinki",
                  visual: {
                    template,
                    mood: (savedAiVisual.current.mood as "warm" | "cool" | "vibrant" | "dark" | "minimal") || "dark",
                    overlayOpacity: (savedAiVisual.current.overlayOpacity as number) || 0.4,
                  },
                }}
                format={format}
                captureMode
                onCapture={(dataUrl) => setOgImageDataUrl(dataUrl)}
              />
            </div>
            );
          })()}

          {/* One-tap social posting buttons */}
          {(createdItem.type === "event" || createdItem.type === "promotion") && (
            <SocialPostSection>
              <SocialPostLabel>📤 Post directly to</SocialPostLabel>
              <SocialPostButtons>
                {instagramConnected ? (
                  <SocialPostBtn
                    $variant="instagram"
                    disabled={socialPosting !== null || !ogImageDataUrl}
                    onClick={() => handleSocialPost(["instagram"])}
                  >
                    {socialPosting === "instagram" ? "⏳ Posting..." : !ogImageDataUrl ? "⏳ Preparing..." : "📸 Instagram"}
                  </SocialPostBtn>
                ) : (
                  <SocialConnectBtn
                    onClick={() => handleConnectSocial("instagram")}
                  >
                    🔗 Connect Instagram
                  </SocialConnectBtn>
                )}

                {facebookConnected ? (
                  <SocialPostBtn
                    $variant="facebook"
                    disabled={socialPosting !== null || !ogImageDataUrl}
                    onClick={() => handleSocialPost(["facebook"])}
                  >
                    {socialPosting === "facebook" ? "⏳ Posting..." : !ogImageDataUrl ? "⏳ Preparing..." : "📘 Facebook"}
                  </SocialPostBtn>
                ) : (
                  <SocialConnectBtn
                    onClick={() => handleConnectSocial("facebook")}
                  >
                    🔗 Connect Facebook
                  </SocialConnectBtn>
                )}

                {instagramConnected && facebookConnected && (
                  <SocialPostBtn
                    $variant="both"
                    disabled={socialPosting !== null || !ogImageDataUrl}
                    onClick={() => handleSocialPost(["instagram", "facebook"])}
                  >
                    {socialPosting === "instagram & facebook"
                      ? "⏳ Posting..."
                      : !ogImageDataUrl
                        ? "⏳ Preparing..."
                        : "📸📘 Post to both"}
                  </SocialPostBtn>
                )}
              </SocialPostButtons>

              {!ogImageDataUrl && !socialPosting && (
                <SocialStatus>
                  Preparing social image from your chosen style...
                </SocialStatus>
              )}
              {socialPosting && (
                <SocialStatus>
                  Posting to {socialPosting}...
                </SocialStatus>
              )}

              {socialResults && (
                <SocialResults>
                  {socialResults.map((r, i) => (
                    <SocialResultItem key={i} $success={r.status === "published"}>
                      {r.status === "published"
                        ? `✅ ${r.platform}: Posted${r.postUrl ? ` — view post` : ""}`
                        : `❌ ${r.platform}: ${r.error || "Failed"}`}
                      {r.postUrl && r.status === "published" && (
                        <a
                          href={r.postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ marginLeft: "0.5rem", color: "#3b82f6" }}
                        >
                          Open ↗
                        </a>
                      )}
                    </SocialResultItem>
                  ))}
                </SocialResults>
              )}
            </SocialPostSection>
          )}
        </div>
      ) : (
        /* ---- Creation Form ---- */
        <>
          <HubLayout>
              <FormPanel>
                <UnifiedCreationFlow
                  barId={barId}
                  barName={barName}
                  barCoverImage={barCoverImage}
                  contentType={contentType}
                  formState={formState}
                  contentTone={contentTone}
                  onGenerated={handleAIGenerated}
                  onFieldChange={handleFieldChange}
                  onTypeChange={handleTypeChange}
                  onSubmit={handleSubmit}
                  submitting={submitting}
                />

                <ComplianceBar
                  title={formState.title}
                  description={formState.description}
                  expanded={complianceExpanded}
                  onToggle={() => setComplianceExpanded((prev) => !prev)}
                />

                {complianceExpanded && violations.length > 0 && (
                  <SuggestionPanel
                    violations={violations}
                    title={formState.title}
                    description={formState.description}
                    contentType={contentType}
                    barId={barId}
                    onAcceptFix={handleAcceptFix}
                  />
                )}
              </FormPanel>

              <PreviewPanel>
                <ConsumerPreviewPanel
                  contentType={contentType}
                  formState={formState}
                  collapsed={false}
                  barCoverImage={barCoverImage}
                  barLogoUrl={barLogoUrl}
                  barName={barName}
                  aiVisual={aiVisual}
                  contentTone={activeTone}
                  cardFormat={cardFormat}
                />
              </PreviewPanel>
            </HubLayout>
        </>
      )}

      {toast && (
        <ToastContainer>
          <Toast $type={toast.type}>{toast.message}</Toast>
        </ToastContainer>
      )}
    </div>
  );
}
