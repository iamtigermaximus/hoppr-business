"use client";

import { useState } from "react";
import styled from "styled-components";
import type { ContentType, FormState } from "./types";
import EventPreviewCard from "./previews/EventPreviewCard";
import PromotionPreviewCard from "./previews/PromotionPreviewCard";
import PassPreviewCard from "./previews/PassPreviewCard";
import AdCampaignPreviewCard from "./previews/AdCampaignPreviewCard";
import { PromotionImage } from "@/lib/og-templates/generate";
import type { PromotionImageInput } from "@/lib/og-templates/generate";
import type { ContentTone } from "./ToneSelector";
import { TONE_OPTIONS, TONE_DEFAULT_VISUAL } from "./ToneSelector";

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
    if (discountValue != null && discountValue > 0) parts.push(`${discountValue}% off`);
    if (startDate) {
      try {
        const sd = new Date(startDate);
        const ed = endDate ? new Date(endDate) : null;
        parts.push(ed ? `${fmtDate(sd)} – ${fmtDate(ed)}` : fmtDate(sd));
      } catch { /* skip */ }
    }
  }
  if (conditions && conditions !== "Valid with ID. Terms apply.") parts.push(conditions);
  return parts.join(" · ");
}

// ---- Styled ----

const Wrapper = styled.div`
  background: #0a0a0a;
  border-radius: 0.75rem;
  border: 1px solid #262626;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #262626;
`;

const HeaderTitle = styled.span`
  font-size: 0.75rem;
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
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
`;

// ---- Toggle tabs ----

const ToggleBar = styled.div`
  display: flex;
  border-bottom: 1px solid #262626;
  background: #0f0f0f;
`;

const ToggleTab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 0.5rem 0.75rem;
  font-size: 0.6875rem;
  font-weight: ${({ $active }) => ($active ? 600 : 500)};
  color: ${({ $active }) => ($active ? "#f9fafb" : "#6b7280")};
  background: ${({ $active }) => ($active ? "#1a1a1a" : "transparent")};
  border: none;
  border-bottom: 2px solid ${({ $active }) => ($active ? "#7c3aed" : "transparent")};
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;

  &:hover {
    color: ${({ $active }) => ($active ? "#f9fafb" : "#d1d5db")};
  }
`;

const TabBadge = styled.span<{ $variant: "social" | "app" }>`
  font-size: 0.5625rem;
  padding: 1px 5px;
  border-radius: 2px;
  font-weight: 700;
  letter-spacing: 0.03em;
  background: ${({ $variant }) => ($variant === "social" ? "rgba(124, 58, 237, 0.2)" : "rgba(16, 185, 129, 0.15)")};
  color: ${({ $variant }) => ($variant === "social" ? "#a78bfa" : "#10b981")};
`;

// ---- Preview body ----

const PreviewBody = styled.div`
  padding: 0.75rem;
`;

const DeviceFrame = styled.div`
  max-width: 340px;
  margin: 0 auto;
`;

const OGImageWrap = styled.div<{ $format?: "square" | "wide" | "banner" }>`
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #262626;
  box-shadow: 0 2px 16px rgba(0,0,0,0.3);
  position: relative;
  aspect-ratio: ${({ $format }) =>
    $format === "square" ? "1080 / 1080" :
    $format === "banner" ? "1200 / 400" :
    "1200 / 630"};
  width: 100%;
`;

const ScaledOgContainer = styled.div<{ $format?: "square" | "wide" | "banner" }>`
  position: absolute;
  top: 0;
  left: 0;
  ${({ $format }) => {
    if ($format === "square") {
      // 1080×1080 rendered at 1:1 — no scaling needed, just fill the container
      return `width: 100%; height: 100%;`;
    }
    if ($format === "banner") {
      // 1200×400 rendered at ~3x scale-down
      return `width: 300%; height: 300%; transform: scale(0.333); transform-origin: top left;`;
    }
    // wide (default): 1200×630 at 0.33 scale
    return `width: 300%; height: 300%; transform: scale(0.333); transform-origin: top left;`;
  }}
`;

const ToneIndicator = styled.div`
  font-size: 0.5625rem;
  color: #6b7280;
  text-align: center;
  margin-top: 0.5rem;
  font-style: italic;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem 1rem;
  color: #4b5563;
  font-size: 0.75rem;
`;

const VisualStyleMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const StyleLabel = styled.span`
  font-size: 0.5625rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 500;
`;

const StyleValue = styled.span`
  font-size: 0.5625rem;
  color: #a78bfa;
  font-weight: 600;
`;

// ---- Component ----

interface ConsumerPreviewPanelProps {
  contentType: ContentType;
  formState: FormState;
  collapsed?: boolean;
  barCoverImage?: string | null;
  barLogoUrl?: string | null;
  barName?: string | null;
  aiVisual?: Record<string, unknown> | null;
  contentTone?: ContentTone | null;
  cardFormat?: "square" | "wide" | "banner";
}

type PreviewTab = "social" | "app";

// ---- Brand preview card (for creationMode === "brand") ----

export interface BrandPreviewCardProps {
  title: string;
  description: string;
  imageUrl: string | null;
  cta?: string;
  barCoverImage?: string | null;
}

export function BrandPreviewCard({ title, description, imageUrl, cta, barCoverImage }: BrandPreviewCardProps) {
  const bgImage = imageUrl || barCoverImage;
  return (
    <div
      style={{
        borderRadius: "12px",
        overflow: "hidden",
        background: bgImage
          ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${bgImage}) center/cover`
          : "linear-gradient(135deg, #1a1a2e, #2d1f4e)",
        minHeight: "220px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: "20px",
        position: "relative",
      }}
    >
      <div style={{ position: "relative", zIndex: 1 }}>
        {title ? (
          <div style={{ color: "#fff", fontWeight: 800, fontSize: "18px", lineHeight: 1.3, marginBottom: "6px" }}>
            {title}
          </div>
        ) : null}
        {description ? (
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px", lineHeight: 1.5, marginBottom: cta ? "10px" : 0 }}>
            {description}
          </div>
        ) : null}
        {cta ? (
          <div
            style={{
              display: "inline-block",
              background: "rgba(255,255,255,0.15)",
              color: "#fff",
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 600,
              backdropFilter: "blur(4px)",
            }}
          >
            {cta}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function ConsumerPreviewPanel({
  contentType,
  formState,
  collapsed,
  barCoverImage,
  barLogoUrl,
  barName,
  aiVisual,
  contentTone,
  cardFormat = "wide",
}: ConsumerPreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<PreviewTab>("social");

  const toneLabel = contentTone
    ? TONE_OPTIONS.find((o) => o.value === contentTone)?.label
    : null;

  // Only promos and events have social cards
  const hasSocialCard = contentType === "promotion" || contentType === "event" || contentType === "brand";
  const showTabs = hasSocialCard && !!formState.title;

  return (
    <Wrapper>
      <Header>
        <LiveDot />
        <HeaderTitle>Live Preview</HeaderTitle>
        {contentTone && (
          <span style={{ fontSize: "0.625rem", color: "#a78bfa", marginLeft: "auto", fontWeight: 600 }}>
            {TONE_OPTIONS.find((o) => o.value === contentTone)?.label}
          </span>
        )}
      </Header>

      {/* Tab toggle — only shown when there's content and a social card type */}
      {showTabs && (
        <ToggleBar>
          <ToggleTab
            $active={activeTab === "social"}
            onClick={() => setActiveTab("social")}
          >
            📱 Social Card
            <TabBadge $variant="social">IG/FB</TabBadge>
          </ToggleTab>
          <ToggleTab
            $active={activeTab === "app"}
            onClick={() => setActiveTab("app")}
          >
            📲 App View
            <TabBadge $variant="app">HOPPR</TabBadge>
          </ToggleTab>
        </ToggleBar>
      )}

      <PreviewBody>
        {/* ---- SOCIAL CARD PREVIEW ---- */}
        {(activeTab === "social" || !showTabs) && hasSocialCard && formState.title && contentType !== "brand" && (
          <div>
            <VisualStyleMeta>
              <StyleLabel>Visual Style</StyleLabel>
              <StyleValue>
                {(() => {
                  if (aiVisual) return `${aiVisual.template} · ${aiVisual.mood}`;
                  if (contentTone) {
                    const v = TONE_DEFAULT_VISUAL[contentTone];
                    return `${v.template} · ${v.mood}`;
                  }
                  return "default";
                })()}
                {toneLabel && ` · ${toneLabel}`}
              </StyleValue>
            </VisualStyleMeta>
            <OGImageWrap $format={cardFormat}>
              <ScaledOgContainer $format={cardFormat}>
                <PromotionImage
                  input={{
                    barName: barName || "Your Bar",
                    barType: "PUB",
                    promotionTitle: formState.title,
                    promotionDescription: formState.description || (contentType === "event" ? "Live event — come experience it." : "Special offer — come check it out."),
                    promotionType: (contentType === "event" ? "LIVE_MUSIC_EVENT" : (formState.promotionType || "DRINK_SPECIAL")) as PromotionImageInput["promotionType"],
                    callToAction: contentType === "event"
                      ? eventPreviewCta(formState.startTime)
                      : promoPreviewCta(formState.promotionType, formState.discountValue, formState.conditions),
                    accentColor: (aiVisual?.accentColor as string) || (contentTone ? TONE_DEFAULT_VISUAL[contentTone].accentColor : "#8b5cf6"),
                    discount: formState.discountValue ?? null,
                    conditions: buildPreviewConditions(
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
                    visual: aiVisual
                      ? {
                          template: (aiVisual.template as "split" | "centered" | "card") || (contentType === "event" ? "centered" : "card"),
                          mood: (aiVisual.mood as "warm" | "cool" | "vibrant" | "dark" | "minimal") || "dark",
                          overlayOpacity: (aiVisual.overlayOpacity as number) || 0.4,
                        }
                      : contentTone
                        ? TONE_DEFAULT_VISUAL[contentTone]
                        : contentType === "event"
                          ? { template: "centered", mood: "cool", overlayOpacity: 0.45 }
                          : undefined,
                  }}
                  format={cardFormat}
                />
              </ScaledOgContainer>
            </OGImageWrap>
            {toneLabel && (
              <ToneIndicator>
                Card styled with {toneLabel.toLowerCase()} voice
              </ToneIndicator>
            )}
          </div>
        )}

        {/* Brand social card preview — uses BrandPreviewCard inside OG-style frame */}
        {(activeTab === "social" || !showTabs) && contentType === "brand" && formState.title && (
          <div>
            <VisualStyleMeta>
              <StyleLabel>Visual Style</StyleLabel>
              <StyleValue>
                {toneLabel ? `brand · ${toneLabel}` : "brand · identity"}
              </StyleValue>
            </VisualStyleMeta>
            <OGImageWrap $format="wide">
              <BrandPreviewCard
                title={formState.brandHeadline || formState.title}
                description={formState.brandBody || formState.description}
                imageUrl={formState.imageUrl}
                cta={formState.brandCta}
                barCoverImage={barCoverImage}
              />
            </OGImageWrap>
            {toneLabel && (
              <ToneIndicator>
                Brand card styled with {toneLabel.toLowerCase()} voice
              </ToneIndicator>
            )}
          </div>
        )}

        {/* ---- CONSUMER APP CARD PREVIEW ---- */}
        {(activeTab === "app" || !showTabs) && (
          <DeviceFrame>
            {!formState.title && !formState.description ? (
              <EmptyState>
                <div>
                  {contentTone
                    ? "Your promotion card will appear here as you build it"
                    : "Fill in your promotion details to see a live preview"}
                </div>
                <div style={{ fontSize: "0.6875rem", marginTop: "0.375rem", color: "#374151" }}>
                  {contentTone
                    ? `Tone: ${toneLabel} · ${contentType}`
                    : "Choose a template or describe your promotion to get started"}
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
            ) : contentType === "brand" ? (
              <BrandPreviewCard
                title={formState.brandHeadline || formState.title}
                description={formState.brandBody || formState.description}
                imageUrl={formState.imageUrl}
                cta={formState.brandCta}
                barCoverImage={barCoverImage}
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
        )}
      </PreviewBody>
    </Wrapper>
  );
}
