"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import { scanCompliance } from "@/lib/compliance-engine";
import type { ComplianceViolation } from "@/lib/compliance-engine";
import type { ContentType, FormState, CreationMode, AudienceChip, CoreMessageChip, AtmosphereChip, ImageWorldChip, CopyStructureChip } from "./types";
import { EMPTY_FORM, supportsBoost } from "./types";
import UnifiedCreationFlow from "./UnifiedCreationFlow";
import ComplianceBar from "./ComplianceBar";
import SuggestionPanel from "./SuggestionPanel";
import ComplianceReferencePanel from "./ComplianceReferencePanel";
import ConsumerPreviewPanel from "./ConsumerPreviewPanel";
import { generateCaption } from "./ShareCard";
import { PromotionImagePreview } from "./PromotionImagePreview";
import { BrandCardCapture } from "./BrandCardCapture";
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

  @media (max-width: 640px) {
    font-size: 1.25rem;
  }
`;

const Subtitle = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
`;

const OuterWrapper = styled.div`
  padding: 1.5rem;

  @media (max-width: 640px) {
    padding: 0.75rem;
  }
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

  @media (max-width: 480px) {
    padding: 1rem;
  }
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

  @media (max-width: 480px) {
    padding: 1rem;
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

  @media (max-width: 480px) {
    font-size: 1.0625rem;
  }
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
  matchingEvent?: {
    id: string;
    type: string;
    title: string;
  };
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

  // Handle ?resurface=contentId query param — fetch content and pre-fill form.
  // Extract stable string values to avoid infinite re-renders (useSearchParams
  // returns a new object on every render in Next.js App Router, so we use
  // the individual param strings as effect dependencies instead).
  const resurfaceId = searchParams.get("resurface");
  const typeParam = searchParams.get("type");
  const validTypes: ContentType[] = ["event", "promotion", "campaign", "pass"];
  const contentTypeForResurface = validTypes.includes(typeParam as ContentType)
    ? (typeParam as ContentType)
    : null;

  // When a resurface param is present, hold off rendering the creation flow
  // until the resurface API has responded (success or failure). This avoids
  // flashing step 1 before jumping to the publish step.
  const [resurfaceReady, setResurfaceReady] = useState(!resurfaceId);

  useEffect(() => {
    if (!resurfaceId || !contentTypeForResurface || contentTypeForResurface === "campaign") {
      // No resurface param, or invalid — mark ready immediately
      setResurfaceReady(true);
      return;
    }

    // Reset ready flag if the params change (e.g. user navigates back and
    // clicks Resurface on a different item)
    setResurfaceReady(false);

    const token =
      typeof window !== "undefined" ? localStorage.getItem("hoppr_token") : null;
    if (!token) {
      console.warn("[Resurface] No auth token found in localStorage");
      setResurfaceReady(true);
      return;
    }

    let cancelled = false;
    const fetchUrl = `/api/auth/bar/${barId}/create/resurface?contentId=${encodeURIComponent(resurfaceId)}&contentType=${contentTypeForResurface}`;

    (async () => {
      try {
        const res = await fetch(fetchUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const errBody = await res.text().catch(() => "");
          console.warn(`[Resurface] API returned ${res.status}: ${errBody}`);
          if (!cancelled) {
            setResurfaceReady(true);
            // 404 = content was deleted; 401/403 = auth issue. Surface to the user
            // so they understand why the form isn't pre-filled.
            if (res.status === 404) {
              showToast("This content no longer exists — it may have been deleted.", "error");
            } else if (res.status === 401 || res.status === 403) {
              showToast("You don't have permission to resurface this content.", "error");
            } else {
              showToast("Couldn't load the original content. You can still create from scratch.", "error");
            }
          }
          return;
        }

        const data = await res.json();
        if (cancelled) return;

        if (!data || !data.title) {
          console.warn("[Resurface] API returned empty data:", data);
          if (!cancelled) {
            setResurfaceReady(true);
            showToast("Couldn't load the original content. You can still create from scratch.", "error");
          }
          return;
        }

        // Store source title for the banner
        setResurfaceSourceTitle(data.sourceTitle || data.title);
        // Ensure the content type matches
        setContentType(contentTypeForResurface);

        // Pre-fill form state with resurfaced content data.
        // Build a fresh FormState object — only dates are reset, everything
        // else comes from the original content.
        const fresh: FormState = {
          ...EMPTY_FORM,
          title: data.title || "",
          description: data.description || "",
          imageUrl: data.imageUrl || null,
          conditions: Array.isArray(data.conditions)
            ? data.conditions.join(", ")
            : data.conditions || "",
          promotionType: data.type || "",
          passType: data.type || "",
          benefits: Array.isArray(data.conditions) ? data.conditions : [],
        };

        // Set appropriate dates based on content type
        if (contentTypeForResurface === "promotion") {
          fresh.startDate = new Date().toISOString().slice(0, 10);
          fresh.endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        } else if (contentTypeForResurface === "event") {
          fresh.startTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
          fresh.endTime = new Date(Date.now() + 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString().slice(0, 16);
        } else if (contentTypeForResurface === "pass") {
          fresh.startDate = new Date().toISOString().slice(0, 10);
          fresh.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        }

        setFormState(fresh);

        // Seed AI visual params with sensible defaults so the social media
        // card capture pipeline has what it needs. Without this, resurfaced
        // content skips card generation entirely and shows "Generating your
        // social media card..." forever.
        setAiVisual({
          template: contentTypeForResurface === "event" ? "centered" : "card",
          mood: contentTypeForResurface === "event" ? "vibrant" : "dark",
          overlayOpacity: 0.4,
          accentColor: "#8b5cf6",
        });

        setResurfaceReady(true);

        console.log(`[Resurface] Pre-filled form with "${data.title}" (${contentTypeForResurface})`);
      } catch (err) {
        if (!cancelled) {
          console.error("[Resurface] Fetch failed:", err);
          setResurfaceReady(true);
          showToast("Network error while loading content. You can still create from scratch.", "error");
        }
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resurfaceId, contentTypeForResurface, barId]);

  const [contentType, setContentType] = useState<ContentType>(initialType);
  const [creationMode, setCreationMode] = useState<CreationMode>("brand");
  const [formState, setFormState] = useState<FormState>(EMPTY_FORM);
  // Brand ingredient state — pre-filled by CreativeDirector on mount
  const [brandAudience, setBrandAudience] = useState<AudienceChip[]>([]);
  const [brandCoreMessage, setBrandCoreMessage] = useState<CoreMessageChip | null>(null);
  const [brandAtmosphere, setBrandAtmosphere] = useState<AtmosphereChip[]>([]);
  const [brandImageWorld, setBrandImageWorld] = useState<ImageWorldChip>("venue");
  const [brandCopyStructure, setBrandCopyStructure] = useState<CopyStructureChip>("direct");
  const [brandTemplateName, setBrandTemplateName] = useState<string>("");
  const [resurfaceSourceTitle, setResurfaceSourceTitle] = useState<string | null>(null);
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
  const submitAbortRef = useRef<AbortController | null>(null);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  /** setTimeout wrapper that tracks timers for cleanup on unmount */
  const setSafeTimeout = useCallback(
    (fn: () => void, ms: number): ReturnType<typeof setTimeout> => {
      const id = setTimeout(() => {
        timersRef.current.delete(id);
        fn();
      }, ms);
      timersRef.current.add(id);
      return id;
    },
    [],
  );

  // Abort in-flight submission + clear timers when component unmounts
  useEffect(() => {
    return () => {
      submitAbortRef.current?.abort();
      for (const id of timersRef.current) clearTimeout(id);
      timersRef.current.clear();
    };
  }, []);
  const [ogImageDataUrl, setOgImageDataUrl] = useState<string | null>(null);

  // Pre-submit card capture: renders PromotionImagePreview offscreen, waits for
  // html2canvas to capture, then uploads to Cloudinary BEFORE the submit API call.
  // This ensures the composed social card URL is stored atomically during creation.
  const [capturingCard, setCapturingCard] = useState(false);
  const cardCaptureResolver = useRef<((dataUrl: string) => void) | null>(null);

  const handleCardCaptured = useCallback((dataUrl: string) => {
    if (cardCaptureResolver.current) {
      cardCaptureResolver.current(dataUrl);
      cardCaptureResolver.current = null;
    }
  }, []);

  // Preserve type-specific state when switching tabs
  const perTypeState = useRef<Map<ContentType, Partial<FormState>>>(new Map());

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("hoppr_token")
      : null;

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setSafeTimeout(() => setToast(null), 4000);
  };

  const [sharingOg, setSharingOg] = useState(false);


  // Pre-built caption used by share handlers — computed once, reused
  const shareCaption = useMemo(() => {
    if (!createdItem) return "";
    return generateCaption(
      {
        contentType: createdItem.type as "event" | "promotion" | "brand",
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
    const base = process.env.NEXT_PUBLIC_CONSUMER_URL || "https://hoppr.fi";
    if (createdItem?.type === "brand") {
      return `${base}/venues/${barId}`;
    }
    return `${base}/${createdItem?.type ?? "promotion"}s/${createdItem?.id ?? ""}`;
  }, [createdItem, barId]);

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
      setSafeTimeout(() => {
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
  /** Share the card image to Facebook.
   *  Mobile: native share sheet with the image file (Facebook accepts image shares on iOS/Android).
   *  Desktop: downloads the image, copies caption, opens Facebook in a new tab —
   *  user drags the downloaded image into the post composer and pastes the caption. */
  const handleShareFacebook = async () => {
    if (!ogImageDataUrl || !createdItem) return;
    setSharingOg(true);
    try {
      const res = await fetch(ogImageDataUrl);
      const blob = await res.blob();
      const safeName = createdItem.title.slice(0, 30).replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "");
      const file = new File([blob], `hoppr-${createdItem.type}-${safeName}.png`, { type: "image/png" });

      // Mobile: native share sheet — Facebook appears as an image share target
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: createdItem.title,
          text: shareCaption,
          files: [file],
        });
        return;
      }

      // Desktop: download image + copy caption + open Facebook in new tab
      await navigator.clipboard.writeText(shareCaption);
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.download = file.name;
      a.href = downloadUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      window.open("https://www.facebook.com/", "_blank");
    } catch (err) {
      if (err instanceof DOMException && (err.name === "AbortError" || err.name === "CancelError")) {
        return;
      }
      console.error("Facebook share failed:", err);
      showToast("Couldn't share to Facebook. Try downloading and posting manually.", "error");
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

      // Brand mode uses headline/body/cta instead of title/description
      const isBrandMode = data.mode === "brand" || creationMode === "brand";

      const updates: Partial<FormState> = isBrandMode
        ? {
            title: (data.headline as string) || (data.title as string) || formState.title,
            description: (data.body as string) || (data.description as string) || formState.description,
            brandHeadline: (data.headline as string) || "",
            brandBody: (data.body as string) || "",
            brandCta: (data.cta as string) || "",
            imageUrl: data.imageUrl ? (data.imageUrl as string) : formState.imageUrl,
          }
        : {
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

    // Cancel any in-flight previous submission
    submitAbortRef.current?.abort();
    const controller = new AbortController();
    submitAbortRef.current = controller;

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
        body.createMatchingEvent = formState.createMatchingEvent;
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
      } else if (contentType === "brand") {
        body.brandCta = formState.brandCta;
        body.startDate = formState.startDate;
        body.endDate = formState.endDate;
      }

      // Boost only for promotions and events (campaigns ARE the ad)
      if (supportsBoost(contentType) && formState.boostEnabled) {
        body.boostEnabled = true;
        body.boostBudget = formState.boostBudget;
        body.boostMultiplier = formState.boostMultiplier;
        body.boostStartDate = formState.boostStartDate || formState.startDate || formState.startTime;
        body.boostEndDate = formState.boostEndDate || formState.endDate || formState.endTime;
      }

      // Schedule fields
      body.notifyFollowers = formState.notifyFollowers;
      body.notifyTiming = formState.notifyTiming;
      if (formState.notifyTiming === "custom" && formState.notifyCustomTime) {
        body.notifyCustomTime = formState.notifyCustomTime;
      }
      if (contentType === "event") {
        body.remindBeforeEvent = formState.remindBeforeEvent;
        body.remindMinutesBefore = formState.remindMinutesBefore;
      }
      if (formState.scheduledPublishAt) {
        body.scheduledPublishAt = formState.scheduledPublishAt;
      }

      // Retargeting fields
      if (formState.retargetViewers && (contentType === "promotion" || contentType === "event")) {
        body.retargetViewers = true;
        body.retargetDelayHours = formState.retargetDelayHours || 48;
      }

      // Duplicate lineage — track that this content was created from existing content
      if (resurfaceId) {
        body.duplicatedFrom = resurfaceId;
      }

      // ── Pre-submit card capture ──
      // Capture the composed social card via html2canvas BEFORE the API call
      // so the card URL can be stored atomically during creation.
      // Promos/events need AI visual params; brand content captures regardless.
      const shouldCapture =
        ((contentType === "promotion" || contentType === "event") && savedAiVisual.current) ||
        (contentType === "brand" && !!formState.title);

      if (shouldCapture) {
        try {
          const dataUrl = await new Promise<string>((resolve) => {
            cardCaptureResolver.current = resolve;
            setCapturingCard(true);
          });

          // Upload the captured card to Cloudinary
          const blobRes = await fetch(dataUrl);
          const blob = await blobRes.blob();
          const fd = new FormData();
          fd.append("file", blob, `social-card-${Date.now()}.png`);
          const uploadRes = await fetch(
            `/api/auth/bar/${barId}/upload`,
            { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd },
          );

          if (uploadRes.ok) {
            const { url: cardUrl } = await uploadRes.json();
            if (cardUrl) {
              body.cardImageUrl = cardUrl;
            }
          }

          setCapturingCard(false);
          // Store the data URL for the success share UI (avoids a second capture)
          setOgImageDataUrl(dataUrl);
        } catch (err) {
          console.warn("[CardCapture] Pre-submit capture failed:", err);
          setCapturingCard(false);
          // Continue with submission — the promotion still works, just without the card image
        }
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
          signal: controller.signal,
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
        ...(data.matchingEvent ? { matchingEvent: data.matchingEvent as CreatedItem["matchingEvent"] } : {}),
      });
    } catch (err) {
      // Don't show toast if the request was aborted (user navigated away)
      if (err instanceof DOMException && err.name === "AbortError") return;
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
    ? scanCompliance(formState.title, formState.description, { barName }).violations
    : [];

  const typeLabel = contentType === "campaign"
    ? "Ad Campaign"
    : contentType.charAt(0).toUpperCase() + contentType.slice(1);

  return (
    <OuterWrapper>
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

            {createdItem.matchingEvent && (
              <div style={{
                marginTop: "0.5rem",
                padding: "0.625rem 0.75rem",
                background: "#f0fdf4",
                border: "1px solid #a7f3d0",
                borderRadius: "0.5rem",
                fontSize: "0.8125rem",
                color: "#065f46",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}>
                <span>📅</span>
                <span>
                  A matching event was also created: <strong>&ldquo;{createdItem.matchingEvent.title}&rdquo;</strong>
                </span>
              </div>
            )}

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
                onClick={() => {
                  const route = contentType === "campaign" || contentType === "brand"
                    ? "campaigns"
                    : contentType + "s";
                  router.push(`/bar/${barId}/${route}`);
                }}
              >
                View all {contentType === "campaign" || contentType === "brand" ? "campaigns" : contentType + "s"}
              </ActionButton>
              <ActionButton $variant="outline" onClick={handleReset}>
                + Create another
              </ActionButton>
            </ActionRow>
          </SuccessCard>

          {/* ---- Share to social media (Option 1: Web Share API) — prominent, no OAuth needed ---- */}
          {(createdItem.type === "event" || createdItem.type === "promotion" || createdItem.type === "brand") && (
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

        </div>
      ) : !resurfaceReady ? (
        /* ---- Resurface Loading State ---- */
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "4rem 2rem",
          textAlign: "center",
        }}>
          <div style={{
            width: 40,
            height: 40,
            border: "3px solid #e5e7eb",
            borderTopColor: "#7c3aed",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            marginBottom: "1rem",
          }} />
          <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#374151", marginBottom: "0.25rem" }}>
            Loading resurfaced content…
          </div>
          <div style={{ fontSize: "0.8125rem", color: "#6b7280" }}>
            Fetching the original promotion details so you can republish with fresh dates.
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        /* ---- Creation Form ---- */
        <>
          <HubLayout>
              <FormPanel>
                {resurfaceSourceTitle && (
                  <div style={{
                    padding: "0.625rem 0.875rem",
                    margin: "0 0 0.75rem 0",
                    background: "linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%)",
                    border: "1px solid #fcd34d",
                    borderRadius: "0.5rem",
                    fontSize: "0.8125rem",
                    color: "#92400e",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}>
                    <span style={{ fontSize: "1rem" }}>♻️</span>
                    <span>
                      <strong>Resurfacing:</strong> &ldquo;{resurfaceSourceTitle}&rdquo; — edit anything before publishing.
                    </span>
                  </div>
                )}
                <UnifiedCreationFlow
                  barId={barId}
                  barName={barName}
                  barCoverImage={barCoverImage}
                  contentType={contentType}
                  creationMode={creationMode}
                  onModeChange={setCreationMode}
                  formState={formState}
                  contentTone={contentTone}
                  initialStep={resurfaceSourceTitle ? "publish" : undefined}
                  onGenerated={handleAIGenerated}
                  onFieldChange={handleFieldChange}
                  onTypeChange={handleTypeChange}
                  onSubmit={handleSubmit}
                  submitting={submitting}
                  // Brand ingredient props
                  brandAudience={brandAudience}
                  onBrandAudienceChange={(chips) => setBrandAudience(chips as AudienceChip[])}
                  brandCoreMessage={brandCoreMessage}
                  onBrandCoreMessageChange={(chip) => setBrandCoreMessage(chip as CoreMessageChip | null)}
                  brandAtmosphere={brandAtmosphere}
                  onBrandAtmosphereChange={(chips) => setBrandAtmosphere(chips as AtmosphereChip[])}
                  brandImageWorld={brandImageWorld}
                  onBrandImageWorldChange={(chip) => setBrandImageWorld(chip as ImageWorldChip)}
                  brandCopyStructure={brandCopyStructure}
                  onBrandCopyStructureChange={(chip) => setBrandCopyStructure(chip as CopyStructureChip)}
                  brandTemplateName={brandTemplateName}
                  onBrandTemplateNameChange={setBrandTemplateName}
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

            {/* Pre-submit card capture — renders offscreen, captures via html2canvas,
                uploads to Cloudinary, and includes the URL in the submit body. */}
            {capturingCard && savedAiVisual.current && contentType !== "brand" && (() => {
              const template = (savedAiVisual.current.template as "split" | "centered" | "card") || (contentType === "event" ? "centered" : "card");
              const format = template === "card" ? "square" : "wide";
              return (
                <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
                  <PromotionImagePreview
                    input={{
                      barName: barName || "Your Bar",
                      barType: "PUB",
                      promotionTitle: formState.title,
                      promotionDescription: formState.description || "Special offer — come check it out.",
                      promotionType: (formState.promotionType || (contentType === "event" ? "LIVE_MUSIC_EVENT" : "DRINK_SPECIAL")) as PromotionImageInput["promotionType"],
                      callToAction: buildSocialCta(
                        contentType as "event" | "promotion",
                        formState.promotionType,
                        formState.discountValue,
                        formState.conditions,
                        formState.startTime,
                      ),
                      accentColor: (savedAiVisual.current.accentColor as string) || "#8b5cf6",
                      discount: formState.discountValue ?? null,
                      conditions: buildSocialConditions(
                        contentType,
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
                    onCapture={handleCardCaptured}
                  />
                </div>
              );
            })()}

            {/* Brand card capture — renders BrandPreviewCard offscreen for html2canvas */}
            {capturingCard && contentType === "brand" && formState.title && (
              <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
                <BrandCardCapture
                  title={formState.brandHeadline || formState.title}
                  description={formState.brandBody || formState.description}
                  imageUrl={formState.imageUrl}
                  cta={formState.brandCta}
                  barCoverImage={barCoverImage}
                  onCapture={handleCardCaptured}
                />
              </div>
            )}
        </>
      )}

      {toast && (
        <ToastContainer>
          <Toast $type={toast.type}>{toast.message}</Toast>
        </ToastContainer>
      )}
    </OuterWrapper>
  );
}
