"use client";

import { useState } from "react";
import { PromotionImage } from "@/lib/og-templates/generate";
import type { PromotionImageInput } from "@/lib/og-templates/generate";

// ---- Types ----

export interface PromotionVariant {
  title: string;
  description: string;
  type: string;
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

interface VariantPickerProps {
  variants: PromotionVariant[];
  barName: string;
  barCoverImage?: string | null;
  venueLocation?: string;
  onSelect: (variant: PromotionVariant) => void;
  onRegenerate: () => void;
  loading?: boolean;
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
    photoUrl: null, // no default — user picks a background separately
    venueLocation: venueLocation || "Helsinki",
    visual: v.visual,
  };
}

// ---- Component ----

export default function VariantPicker({
  variants,
  barName,
  barCoverImage,
  venueLocation = "Helsinki",
  onSelect,
  onRegenerate,
  loading,
}: VariantPickerProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);

  const handleSelect = (idx: number) => {
    setSelectedIdx(idx);
    setConfirming(true);
    // Brief delay so the user sees the selection highlight before the transition
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
          Each option uses a different angle and visual style. Pick the one that
          best fits your bar, then tweak the details.
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
              {/* OG Image preview */}
              <div style={styles.imageWrap}>
                <div style={styles.imageInner}>
                  <PromotionImage
                    input={mapVariantToImageInput(v, barName, barCoverImage, venueLocation)}
                    format="wide"
                  />
                </div>
                {/* Selection overlay on hover */}
                <div style={styles.imageOverlay}>
                  <div style={styles.selectButton}>
                    {isSelected ? "✓ Selected" : "Choose this one"}
                  </div>
                </div>
              </div>

              {/* Card info */}
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

                <div style={styles.cardTitle}>{v.title}</div>
                <div style={styles.cardDesc}>
                  {v.description.length > 100
                    ? v.description.slice(0, 100) + "…"
                    : v.description}
                </div>

                <div style={styles.cardCta}>{v.callToAction}</div>
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
        <button
          style={styles.regenerateButton}
          onClick={onRegenerate}
          disabled={confirming}
        >
          🔄 Generate 3 more options
        </button>
        <span style={styles.footerHint}>
          Or type a new brief above for different results
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
    height: 157,
    overflow: "hidden",
    position: "relative" as const,
    background: "#0a0a0a",
  },
  imageInner: {
    transform: "scale(0.35)",
    transformOrigin: "top left",
    width: "286%",
    height: "286%",
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
  cardTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#f9fafb",
    marginBottom: 4,
    lineHeight: 1.3,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  cardDesc: {
    fontSize: 11,
    color: "#6b7280",
    lineHeight: 1.4,
    marginBottom: 8,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  cardCta: {
    fontSize: 10,
    fontWeight: 600,
    color: "#7c3aed",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
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
  regenerateButton: {
    padding: "8px 16px",
    background: "transparent",
    color: "#a78bfa",
    border: "1px solid #374151",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
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

// Inject spin keyframe
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .variant-card:hover .variant-select-btn {
      opacity: 1;
      transform: translateY(0);
    }
    .variant-card:hover .variant-overlay {
      background: rgba(0,0,0,0.4);
    }
  `;
  if (!document.head.querySelector("[data-variant-styles]")) {
    style.setAttribute("data-variant-styles", "true");
    document.head.appendChild(style);
  }
}
