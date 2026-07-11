"use client";

import { useState } from "react";
import { PromotionImage } from "@/lib/og-templates/generate";
import type { PromotionImageInput } from "@/lib/og-templates/generate";
import type { TitleFontStyle } from "@/lib/og-templates/fonts";
import type { InferredChips } from "@/lib/prompts/infer-image-chips";

// ---- Types ----

export interface PromotionVariant {
  title: string;
  description: string;
  type: string;
  discount: number | null;
  callToAction: string;
  accentColor: string;
  /** Title font style chosen by AI based on bar positioning */
  titleFontStyle?: TitleFontStyle | null;
  conditions: string;
  /** AI-inferred image generation chips — used to auto-generate background images */
  imageChips?: InferredChips;
  visual?: {
    template: "split" | "centered" | "card";
    mood: "warm" | "cool" | "vibrant" | "dark" | "minimal";
    overlayOpacity: number;
  };
}

type CardFormat = "square" | "wide" | "banner";

interface VariantPickerProps {
  variants: PromotionVariant[];
  barName: string;
  barCoverImage?: string | null;
  /** AI-generated background image — shared across all variant cards */
  sharedBgImage?: string | null;
  venueLocation?: string;
  cardFormat?: CardFormat;
  onSelect: (variant: PromotionVariant) => void;
  onRegenerate?: () => void;
  loading?: boolean;
}

// ---- Format-aware preview sizing ----
// Each social card format has a different native resolution and aspect ratio.
// We scale to fit a 300px-wide container so the preview looks like the real post.

const FORMAT_DIMS: Record<CardFormat, { nativeW: number; nativeH: number }> = {
  wide:   { nativeW: 1200, nativeH: 630 },
  square: { nativeW: 1080, nativeH: 1080 },
  banner: { nativeW: 1200, nativeH: 400 },
};

function previewScale(format: CardFormat): number {
  return 300 / FORMAT_DIMS[format].nativeW;
}

function previewHeight(format: CardFormat): number {
  const s = previewScale(format);
  return Math.round(FORMAT_DIMS[format].nativeH * s);
}

// ---- Labels ----

const TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  HAPPY_HOUR: { label: "After-Work", emoji: "🍺" },
  DRINK_SPECIAL: { label: "Drink Special", emoji: "🍹" },
  FOOD_SPECIAL: { label: "Food Special", emoji: "🍕" },
  LADIES_NIGHT: { label: "Ladies Night", emoji: "💃" },
  THEME_NIGHT: { label: "Theme Night", emoji: "🎭" },
  VIP_OFFER: { label: "VIP Offer", emoji: "✨" },
  COVER_DISCOUNT: { label: "Cover Discount", emoji: "🎫" },
  LIVE_MUSIC_EVENT: { label: "Live Music", emoji: "🎸" },
  GAME_NIGHT: { label: "Game Night", emoji: "🎮" },
  SEASONAL: { label: "Seasonal", emoji: "🌸" },
};

// ---- Helpers ----

function mapVariantToImageInput(
  v: PromotionVariant,
  barName: string,
  barCoverImage: string | null | undefined,
  venueLocation: string,
  bgImage?: string | null,
): PromotionImageInput {
  return {
    barName: barName || "Your Bar",
    barType: "PUB",
    promotionTitle: v.title,
    promotionDescription: v.description || "Special offer — come check it out.",
    promotionType: (v.type as PromotionImageInput["promotionType"]) || "DRINK_SPECIAL",
    callToAction: v.callToAction || "View Offer",
    accentColor: v.accentColor || "#8b5cf6",
    discount: v.discount ?? null,
    conditions: v.conditions || "Valid with ID. Terms apply.",
    photoUrl: bgImage || null,
    venueLocation: venueLocation || "Helsinki",
    visual: v.visual,
    titleFontStyle: v.titleFontStyle || null,
  };
}

// ---- Component ----

export default function VariantPicker({
  variants,
  barName,
  barCoverImage,
  sharedBgImage,
  venueLocation = "Helsinki",
  cardFormat = "wide",
  onSelect,
  loading,
}: VariantPickerProps) {
  const scale = previewScale(cardFormat);
  const imgHeight = previewHeight(cardFormat);
  const innerPct = Math.round(100 / scale); // imageInner width/height as % of container
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);

  const handleSelect = (idx: number) => {
    setSelectedIdx(idx);
    setConfirming(true);
    setTimeout(() => {
      onSelect(variants[idx]);
    }, 300);
  };

  const typeInfo = (t: string) => TYPE_LABELS[t] || { label: t, emoji: "🎯" };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingInner}>
          <div style={styles.spinner} />
          <div style={styles.loadingTitle}>Creating your options</div>
          <div style={styles.loadingSub}>
            Our AI is crafting {variants.length || 3} unique concepts with
            compliant copy and visual design — just like an agency would.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          <span style={styles.headerIcon}>✦</span>
          Choose your favorite — you can refine it after
        </div>
        <div style={styles.headerSub}>
          Same background, different text and layout. Pick the copy that best
          fits your bar, then tweak the details.
        </div>
      </div>

      <div style={styles.grid}>
        {variants.map((v, i) => {
          const info = typeInfo(v.type);
          const isSelected = selectedIdx === i;

          return (
            <div
              key={i}
              style={{
                ...styles.card,
                ...(isSelected ? styles.cardSelected : {}),
                ...(confirming ? styles.cardDisabled : {}),
              }}
              onClick={() => !confirming && handleSelect(i)}
            >
              {/* Image area — OG social card with shared AI background + variant text layout */}
              <div style={{ ...styles.imageWrap, height: imgHeight }}>
                <div style={{
                  ...styles.imageInner,
                  width: `${innerPct}%`,
                  height: `${innerPct}%`,
                  transform: `scale(${scale})`,
                }}>
                  <PromotionImage
                    input={mapVariantToImageInput(v, barName, barCoverImage, venueLocation, sharedBgImage)}
                    format={cardFormat}
                  />
                </div>
                {/* Selection overlay */}
                <div style={styles.imageOverlay}>
                  <div style={styles.selectButton}>
                    {isSelected ? "✓ Selected" : "Choose this one"}
                  </div>
                </div>
              </div>

              {/* Metadata row — type, discount, option number (not duplicate of card text) */}
              <div style={styles.cardBody}>
                <div style={styles.typeRow}>
                  <span style={styles.typeBadge}>
                    {info.emoji} {info.label}
                  </span>
                  {v.discount != null && v.discount > 0 && (
                    <span style={styles.discountBadge}>
                      {v.discount}% off
                    </span>
                  )}
                  <span style={styles.optionNumber}>Option {i + 1}</span>
                </div>
              </div>

              {/* Visual tag */}
              {v.visual && (
                <div style={styles.visualTag}>
                  {v.visual.template} · {v.visual.mood}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={styles.footer}>
        <span style={styles.footerHint}>
          Not what you're looking for? Go back and refine your brief for different results.
        </span>
      </div>
    </div>
  );
}

// ---- Styles ----

const styles: Record<string, React.CSSProperties> = {
  container: {
    marginTop: 8,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#f9fafb",
    marginBottom: 4,
  },
  headerIcon: {
    color: "#a78bfa",
    marginRight: 6,
  },
  headerSub: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 1.5,
  },
  grid: {
    display: "flex",
    gap: 12,
    overflowX: "auto",
    paddingBottom: 8,
    scrollSnapType: "x mandatory",
  },
  card: {
    flex: "0 0 300px",
    background: "#1a1a1a",
    borderRadius: 12,
    border: "1px solid #262626",
    overflow: "hidden",
    cursor: "pointer",
    transition: "all 0.2s ease",
    scrollSnapAlign: "start",
    position: "relative" as const,
  },
  cardSelected: {
    border: "2px solid #7c3aed",
    boxShadow: "0 0 0 4px rgba(124, 58, 237, 0.15)",
    transform: "scale(1.01)",
  },
  cardDisabled: {
    opacity: 0.7,
    pointerEvents: "none" as const,
  },
  imageWrap: {
    width: "100%",
    overflow: "hidden",
    position: "relative" as const,
    background: "#0a0a0a",
  },
  imageInner: {
    transformOrigin: "top left",
  },
  imageOverlay: {
    position: "absolute" as const,
    inset: 0,
    background: "rgba(0,0,0,0)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.2s",
  },
  selectButton: {
    padding: "8px 18px",
    background: "#7c3aed",
    color: "white",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    opacity: 0,
    transform: "translateY(4px)",
    transition: "all 0.2s",
  },
  cardBody: {
    padding: "12px 14px 10px",
  },
  typeRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  typeBadge: {
    fontSize: 10,
    fontWeight: 600,
    color: "#a78bfa",
    background: "rgba(124, 58, 237, 0.12)",
    padding: "2px 8px",
    borderRadius: 4,
  },
  discountBadge: {
    fontSize: 10,
    fontWeight: 700,
    color: "#10b981",
    background: "rgba(16, 185, 129, 0.12)",
    padding: "2px 8px",
    borderRadius: 4,
  },
  optionNumber: {
    fontSize: 10,
    color: "#4b5563",
    marginLeft: "auto",
  },
  visualTag: {
    position: "absolute" as const,
    top: 8,
    right: 8,
    fontSize: 9,
    color: "#6b7280",
    background: "rgba(0,0,0,0.6)",
    padding: "2px 6px",
    borderRadius: 4,
    backdropFilter: "blur(4px)",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginTop: 16,
    paddingTop: 12,
    borderTop: "1px solid #262626",
  },
  footerHint: {
    fontSize: 11,
    color: "#4b5563",
  },
  loadingContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
  },
  loadingInner: {
    textAlign: "center" as const,
  },
  spinner: {
    width: 36,
    height: 36,
    border: "3px solid #262626",
    borderTop: "3px solid #7c3aed",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    margin: "0 auto 16px",
  },
  loadingTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: "#f9fafb",
    marginBottom: 6,
  },
  loadingSub: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 1.5,
    maxWidth: 360,
    margin: "0 auto",
  },
};

// Inject spin keyframe for loading spinner
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  if (!document.head.querySelector("[data-variant-styles]")) {
    style.setAttribute("data-variant-styles", "true");
    document.head.appendChild(style);
  }
}
