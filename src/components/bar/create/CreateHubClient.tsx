"use client";

import { useState, useRef, useCallback, useMemo } from "react";
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

const SocialCardWrapper = styled.div`
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  margin-bottom: 0.75rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
`;

const SocialLoadingHint = styled.div`
  font-size: 0.8125rem;
  color: #6b7280;
  font-style: italic;
  text-align: center;
  padding: 1rem;
`;

// ── Prominent sharing hero section (Option 1: Web Share API) ──

const ShareHero = styled.div`
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #e0e7ff 100%);
  border: 2px solid #c4b5fd;
  border-radius: 1rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: -40px;
    right: -40px;
    width: 120px;
    height: 120px;
    background: linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%);
    border-radius: 50%;
    pointer-events: none;
  }
`;

const ShareHeroBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: linear-gradient(135deg, #7c3aed, #3b82f6);
  color: white;
  margin-bottom: 0.75rem;
`;

const ShareHeroTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ShareHeroSubtitle = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1rem;
  line-height: 1.5;
`;

// ── Share icon bar (react-share style) ──

const ShareBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;
`;

const ShareIconBtn = styled.button<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background: white;
  color: ${({ $color }) => $color};
  font-size: 1rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  transition: all 0.15s;
  position: relative;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.18);
  }

  &:disabled {
    opacity: 0.5;
    cursor: wait;
  }
`;

const ShareIconLabel = styled.span`
  font-size: 0.6875rem;
  color: #6b7280;
  margin-top: 0.25rem;
  text-align: center;
`;

const ShareIconWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
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

  const [sharingOg, setSharingOg] = useState(false);


  // Pre-built caption used by share handlers — computed once, reused
  const shareCaption = useMemo(() => {
    if (!createdItem) return "";
    return generateCaption(
      {
        contentType: createdItem.type as "event" | "promotion",
        title: createdItem.title,
        description: formState.description,
        barName,
        barLogo: barLogoUrl,
        date:
          createdItem.type === "promotion"
            ? formState.startDate
            : formState.startTime,
        time:
          createdItem.type === "event" && formState.startTime
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
  }, [createdItem, formState, barName, barLogoUrl]);

  const consumerUrl = useMemo(() => {
    return (process.env.NEXT_PUBLIC_CONSUMER_URL || "https://hoppr.fi") +
      `/${createdItem?.type ?? "promotion"}s/${createdItem?.id ?? ""}`;
  }, [createdItem]);

  /** Share to Instagram: copy image to clipboard → open Instagram app */
  const handleShareInstagram = async () => {
    if (!ogImageDataUrl || !createdItem) return;
    setSharingOg(true);
    try {
      const res = await fetch(ogImageDataUrl);
      const blob = await res.blob();

      // Copy image to clipboard (supported in Chrome/Edge; Safari needs fallback)
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
      } catch {
        // Clipboard.write with images not supported — fall through to download
      }

      // Copy caption text too
      await navigator.clipboard.writeText(shareCaption);

      // Open Instagram app (falls back to Instagram web if app not installed)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const instagramUrl = isIOS
        ? "instagram://"
        : "intent://instagram.com/#Intent;package=com.instagram.android;end";
      window.location.href = instagramUrl;

      // If Instagram didn't open within 2s, it's not installed — show instructions
      setTimeout(() => {
        if (document.hidden) return; // app opened successfully
        showToast(
          "Image & caption copied! Open Instagram and paste into a new post or story.",
          "success",
        );
      }, 2000);
    } catch (err) {
      console.error("Instagram share failed:", err);
      showToast("Couldn't open Instagram. Try downloading and posting manually.", "error");
    } finally {
      setSharingOg(false);
    }
  };

  /** Share to Facebook: uses Web Share API with URL (Facebook reliably appears for URL/text shares) */
  const handleShareFacebook = async () => {
    if (!createdItem) return;
    setSharingOg(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: createdItem.title,
          text: shareCaption,
          url: consumerUrl,
        });
        return;
      }
      // Desktop fallback: open Facebook Share Dialog
      const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(consumerUrl)}&quote=${encodeURIComponent(shareCaption)}`;
      window.open(fbUrl, "_blank", "width=600,height=400");
    } catch (err) {
      if (
        err instanceof DOMException &&
        (err.name === "AbortError" || err.name === "CancelError")
      ) {
        return;
      }
      // Final fallback: copy caption + open Facebook
      await navigator.clipboard.writeText(shareCaption);
      const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(consumerUrl)}`;
      window.open(fbUrl, "_blank", "width=600,height=400");
    } finally {
      setSharingOg(false);
    }
  };

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
        imageUrl: data.imageUrl ? (data.imageUrl as string) : formState.imageUrl,
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

          {/* ---- Share to social media (Option 1: Web Share API) — prominent, no OAuth needed ---- */}
          {(createdItem.type === "event" || createdItem.type === "promotion") && (
            <ShareHero>
              <ShareHeroBadge>✨ One-Tap Share</ShareHeroBadge>
              <ShareHeroTitle>
                📱 Share to Instagram & Facebook
              </ShareHeroTitle>
              <ShareHeroSubtitle>
                Your card is ready. Share to social media with a tap.
              </ShareHeroSubtitle>

              {ogImageDataUrl ? (
                <>
                  <SocialCardWrapper>
                    <img
                      src={ogImageDataUrl}
                      alt="Social media promo card"
                      style={{ width: "100%", display: "block" }}
                    />
                  </SocialCardWrapper>

                  <ShareBar>
                    <ShareIconWrap>
                      <ShareIconBtn
                        onClick={handleShareFacebook}
                        disabled={sharingOg}
                        $color="#1877f2"
                        title="Share to Facebook"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </ShareIconBtn>
                      <ShareIconLabel>Facebook</ShareIconLabel>
                    </ShareIconWrap>

                    <ShareIconWrap>
                      <ShareIconBtn
                        onClick={handleShareInstagram}
                        disabled={sharingOg}
                        $color="#E4405F"
                        title="Share to Instagram"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                        </svg>
                      </ShareIconBtn>
                      <ShareIconLabel>Instagram</ShareIconLabel>
                    </ShareIconWrap>

                    <ShareIconWrap>
                      <ShareIconBtn
                        onClick={() => {
                          if (navigator.share && ogImageDataUrl) {
                            fetch(ogImageDataUrl)
                              .then(r => r.blob())
                              .then(blob => {
                                const file = new File([blob], "share.png", { type: "image/png" });
                                navigator.share({
                                  title: createdItem.title,
                                  text: shareCaption,
                                  files: [file],
                                });
                              })
                              .catch(() => {});
                          } else {
                            handleShareFacebook(); // fallback
                          }
                        }}
                        disabled={sharingOg}
                        $color="#25D366"
                        title="Share via..."
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="18" cy="5" r="3"/>
                          <circle cx="6" cy="12" r="3"/>
                          <circle cx="18" cy="19" r="3"/>
                          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                        </svg>
                      </ShareIconBtn>
                      <ShareIconLabel>Share</ShareIconLabel>
                    </ShareIconWrap>

                    <ShareIconWrap>
                      <ShareIconBtn
                        as="a"
                        href={ogImageDataUrl}
                        download={`${createdItem.title.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "").toLowerCase()}-social-card.png`}
                        $color="#374151"
                        title="Download image"
                        style={{ textDecoration: "none" }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </ShareIconBtn>
                      <ShareIconLabel>Download</ShareIconLabel>
                    </ShareIconWrap>
                  </ShareBar>
                </>
              ) : (
                <SocialLoadingHint>
                  Generating your social media card...
                </SocialLoadingHint>
              )}
            </ShareHero>
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
