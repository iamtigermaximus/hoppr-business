"use client";

import styled from "styled-components";
import type { ContentType, FormState } from "./types";
import EventPreviewCard from "./previews/EventPreviewCard";
import PromotionPreviewCard from "./previews/PromotionPreviewCard";
import PassPreviewCard from "./previews/PassPreviewCard";
import AdCampaignPreviewCard from "./previews/AdCampaignPreviewCard";
import { PromotionImage } from "@/lib/og-templates/generate";
import type { PromotionImageInput } from "@/lib/og-templates/generate";

// ---- CTA helpers for social media cards ----

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

function promoPreviewCta(promotionType?: string, discountValue?: number | null, conditions?: string): string {
  if (discountValue != null && discountValue > 0) return `${discountValue}% OFF`;
  if (promotionType && PROMO_TYPE_LABELS[promotionType]) return PROMO_TYPE_LABELS[promotionType];
  return conditions || "SPECIAL OFFER";
}

function eventPreviewCta(startTime?: string): string {
  if (startTime) {
    try {
      return new Date(startTime).toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric",
      }).toUpperCase();
    } catch { /* fall through */ }
  }
  return "LIVE EVENT";
}

function fmtDate(d: Date, short?: boolean): string {
  return d.toLocaleDateString("en-US", short
    ? { weekday: "short", month: "short", day: "numeric" }
    : { month: "short", day: "numeric" });
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "numeric", hour12: true }).replace(":00", "");
}

function buildPreviewConditions(
  contentType: ContentType,
  discountValue?: number | null,
  startDate?: string,
  endDate?: string,
  startTime?: string,
  endTime?: string,
  conditions?: string,
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

  if (conditions && conditions !== "Valid with ID. Terms apply.") {
    parts.push(conditions);
  }

  return parts.join(" · ");
}

// ---- Styled ----

const Wrapper = styled.div`
  background: #0a0a0a;
  border-radius: 0.75rem;
  padding: 1rem;
  border: 1px solid #262626;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #262626;
`;

const HeaderTitle = styled.span`
  font-size: 0.8125rem;
  font-weight: 600;
  color: #d1d5db;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const LiveDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }
`;

const DeviceFrame = styled.div`
  max-width: 380px;
  margin: 0 auto;
`;

const SectionLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SectionBadge = styled.span<{ $variant: "social" | "app" }>`
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 600;
  letter-spacing: 0.03em;
  background: ${({ $variant }) => ($variant === "social" ? "rgba(124, 58, 237, 0.15)" : "rgba(16, 185, 129, 0.12)")};
  color: ${({ $variant }) => ($variant === "social" ? "#a78bfa" : "#10b981")};
`;

const OGImageWrap = styled.div`
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #262626;
  box-shadow: 0 2px 16px rgba(0,0,0,0.3);
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem 1rem;
  color: #4b5563;
  font-size: 0.8125rem;
`;

// ---- Component ----

interface ConsumerPreviewPanelProps {
  contentType: ContentType;
  formState: FormState;
  collapsed?: boolean;
  barCoverImage?: string | null;
  barLogoUrl?: string | null;
  barName?: string | null;
  /** AI-selected visual params — override the per-type defaults when available */
  aiVisual?: Record<string, unknown> | null;
}

export default function ConsumerPreviewPanel({
  contentType,
  formState,
  collapsed,
  barCoverImage,
  barLogoUrl,
  barName,
  aiVisual,
}: ConsumerPreviewPanelProps) {
  return (
    <Wrapper>
      <Header>
        <LiveDot />
        <HeaderTitle>Consumer Preview</HeaderTitle>
        <span style={{ fontSize: "0.6875rem", color: "#6b7280", marginLeft: "auto" }}>
          {collapsed ? "▼ Show" : "Live"}
        </span>
      </Header>

      {/* OG Image — social media marketing card (uses AI-chosen visual style) */}
      {!collapsed && contentType === "promotion" && formState.title && (
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>
            <span>Promo Card</span>
            <SectionBadge $variant="social">SOCIAL</SectionBadge>
            <span style={{ fontSize: 9, color: "#4b5563", marginLeft: "auto" }}>
              {aiVisual ? `${aiVisual.template} · ${aiVisual.mood}` : "default"}
            </span>
          </SectionLabel>
          <OGImageWrap>
            <div style={{ transform: "scale(0.33)", transformOrigin: "top left", width: "300%", height: "300%" }}>
              <PromotionImage
                input={{
                  barName: barName || "Your Bar",
                  barType: "PUB",
                  promotionTitle: formState.title,
                  promotionDescription: formState.description || "Special offer — come check it out.",
                  promotionType: formState.promotionType || "DRINK_SPECIAL",
                  callToAction: promoPreviewCta(formState.promotionType, formState.discountValue, formState.conditions),
                  accentColor: (aiVisual?.accentColor as string) || "#8b5cf6",
                  discount: formState.discountValue ?? null,
                  conditions: buildPreviewConditions("promotion", formState.discountValue, formState.startDate, formState.endDate, undefined, undefined, formState.conditions) || "Helsinki",
                  // Only show user-uploaded image — no bar cover fallback so the preview
                  // starts blank and the user knows they need to pick a background.
                  photoUrl: formState.imageUrl || null,
                  venueLocation: "Helsinki",
                  visual: aiVisual
                    ? {
                        template: (aiVisual.template as "split" | "centered" | "card") || "card",
                        mood: (aiVisual.mood as "warm" | "cool" | "vibrant" | "dark" | "minimal") || "dark",
                        overlayOpacity: (aiVisual.overlayOpacity as number) || 0.4,
                      }
                    : undefined,
                }}
                format="wide"
              />
            </div>
          </OGImageWrap>
        </div>
      )}

      {!collapsed && contentType === "event" && formState.title && (
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>
            <span>Event Card</span>
            <SectionBadge $variant="social">SOCIAL</SectionBadge>
            <span style={{ fontSize: 9, color: "#4b5563", marginLeft: "auto" }}>
              {aiVisual ? `${aiVisual.template} · ${aiVisual.mood}` : "centered · cool"}
            </span>
          </SectionLabel>
          <OGImageWrap>
            <div style={{ transform: "scale(0.33)", transformOrigin: "top left", width: "300%", height: "300%" }}>
              <PromotionImage
                input={{
                  barName: barName || "Your Bar",
                  barType: "PUB",
                  promotionTitle: formState.title,
                  promotionDescription: formState.description || "Live event — come experience it.",
                  promotionType: "LIVE_MUSIC_EVENT",
                  callToAction: eventPreviewCta(formState.startTime),
                  accentColor: (aiVisual?.accentColor as string) || "#3b82f6",
                  discount: null,
                  conditions: buildPreviewConditions("event", null, undefined, undefined, formState.startTime, formState.endTime, undefined) || "Helsinki · Free entry",
                  photoUrl: formState.imageUrl || null,
                  venueLocation: "Helsinki",
                  visual: aiVisual
                    ? {
                        template: (aiVisual.template as "split" | "centered" | "card") || "centered",
                        mood: (aiVisual.mood as "warm" | "cool" | "vibrant" | "dark" | "minimal") || "cool",
                        overlayOpacity: (aiVisual.overlayOpacity as number) || 0.45,
                      }
                    : { template: "centered", mood: "cool", overlayOpacity: 0.45 },
                }}
                format="wide"
              />
            </div>
          </OGImageWrap>
        </div>
      )}

      {!collapsed && (
        <div>
          <SectionLabel style={{ marginBottom: 8 }}>
            <span>Consumer App View</span>
            <SectionBadge $variant="app">APP</SectionBadge>
          </SectionLabel>
          <DeviceFrame>
          {!formState.title && !formState.description ? (
            <EmptyState>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
                👁️
              </div>
              <div>Start typing or use AI to see a live preview</div>
              <div style={{ fontSize: "0.6875rem", marginTop: "0.375rem", color: "#374151" }}>
                Updates as you type — no API calls
              </div>
            </EmptyState>
          ) : contentType === "event" ? (
            <EventPreviewCard
              title={formState.title}
              description={formState.description}
              imageUrl={formState.imageUrl}
              startTime={formState.startTime}
              endTime={formState.endTime}
              maxAttendees={formState.maxAttendees}
              barCoverImage={null}
              barLogoUrl={barLogoUrl}
            />
          ) : contentType === "promotion" ? (
            <PromotionPreviewCard
              title={formState.title}
              description={formState.description}
              imageUrl={formState.imageUrl}
              promotionType={formState.promotionType}
              discountValue={formState.discountValue}
              startDate={formState.startDate}
              endDate={formState.endDate}
              conditions={formState.conditions}
              barCoverImage={null}
              barLogoUrl={barLogoUrl}
            />
          ) : contentType === "campaign" ? (
            <AdCampaignPreviewCard
              title={formState.title}
              description={formState.description}
              imageUrl={formState.imageUrl}
              campaignType={formState.campaignType}
              campaignBudget={formState.campaignBudget}
              campaignStartDate={formState.campaignStartDate}
              campaignEndDate={formState.campaignEndDate}
              barCoverImage={null}
              barLogoUrl={barLogoUrl}
            />
          ) : (
            <PassPreviewCard
              title={formState.title}
              description={formState.description}
              imageUrl={formState.imageUrl}
              passType={formState.passType}
              priceEuros={formState.priceEuros}
              originalPriceEuros={formState.originalPriceEuros}
              benefits={formState.benefits}
              totalQuantity={formState.totalQuantity}
            />
          )}
          </DeviceFrame>
        </div>
      )}
    </Wrapper>
  );
}
