"use client";

import styled from "styled-components";
import { getImageUrl } from "@/lib/cloudinary-url";

// ── Image fallback hierarchy ────────────────────────────────────
// 1. Content-specific image (imageUrl) — bar uploaded for this promo
// 2. Bar cover image (barCoverImage) — profile photo, auto-inherited
// 3. Bar logo on gradient (barLogoUrl) — centered logo on brand colour
// 4. Emoji on gradient (green) — platform default, never a gray box

function resolveImage(
  imageUrl: string | null,
  barCoverImage: string | null,
  barLogoUrl: string | null,
): { src: string | null; mode: "image" | "logo" | "gradient" } {
  if (imageUrl) return { src: imageUrl, mode: "image" };
  if (barCoverImage) return { src: barCoverImage, mode: "image" };
  if (barLogoUrl) return { src: barLogoUrl, mode: "logo" };
  return { src: null, mode: "gradient" };
}

// ── Styled ──────────────────────────────────────────────────────

const Card = styled.div<{ $hasContent: boolean }>`
  background: #1a1a1a;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid #262626;
  border-left: 3px solid #059669;
  position: relative;
  transition: border-color 0.2s;
  ${({ $hasContent }) => !$hasContent && "opacity: 0.6;"}
`;

const CoverArea = styled.div<{ $mode: "image" | "logo" | "gradient" }>`
  height: 160px;
  background: ${({ $mode }) =>
    $mode === "gradient"
      ? "linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 100%)"
      : "#1a1a1a"};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6ee7b7;
  font-size: 3rem;
  position: relative;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: absolute;
    inset: 0;
  }
`;

const DiscountHero = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 1rem;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, transparent 60%);
  z-index: 2;
  pointer-events: none;
`;

const DiscountValue = styled.div`
  font-size: 2.25rem;
  font-weight: 800;
  color: #f9fafb;
  line-height: 1;
  margin-bottom: 0.125rem;
`;

const DiscountLabel = styled.div`
  font-size: 0.6875rem;
  color: #6ee7b7;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const TypeBadge = styled.span`
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  background: rgba(0, 0, 0, 0.65);
  color: #d1d5db;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  z-index: 3;
`;

const TimeRemaining = styled.span<{ $urgent?: boolean }>`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: ${({ $urgent }) => ($urgent ? "rgba(239,68,68,0.9)" : "rgba(0,0,0,0.65)")};
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-weight: 600;
  z-index: 3;
`;

const Content = styled.div`
  padding: 0.875rem;
`;

const Title = styled.div`
  font-size: 0.9375rem;
  font-weight: 700;
  color: #f9fafb;
  margin-bottom: 0.25rem;
  line-height: 1.3;
`;

const Body = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
  line-height: 1.4;
  margin-bottom: 0.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.6875rem;
  color: #6b7280;
`;

const DateRange = styled.div`
  color: #6b7280;
`;

const SocialProof = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #059669;
  font-size: 0.6875rem;
  font-weight: 600;
`;

const CtaRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #262626;
`;

const CtaLabel = styled.span`
  font-size: 0.6875rem;
  color: #059669;
  font-weight: 600;
`;

const CtaChevron = styled.span`
  font-size: 0.75rem;
  color: #059669;
`;

// ── Helpers ─────────────────────────────────────────────────────

function formatDateRange(start: string, end: string): string {
  if (!start && !end) return "Ongoing";
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  return start ? `From ${fmt(start)}` : `Until ${fmt(end)}`;
}

function getTimeRemaining(endDate: string): { text: string; urgent: boolean } | null {
  if (!endDate) return null;
  const now = Date.now();
  const end = new Date(endDate).getTime();
  const diff = end - now;
  if (diff <= 0) return { text: "Ended", urgent: true };
  const daysLeft = Math.ceil(diff / 86400000);
  if (daysLeft <= 1) return { text: "Ends today", urgent: true };
  if (daysLeft <= 3) return { text: `${daysLeft}d left`, urgent: true };
  if (daysLeft <= 7) return { text: `${daysLeft}d left`, urgent: false };
  return null;
}

function formatType(type: string): string {
  return type.replace(/_/g, " ");
}

// ── Component ───────────────────────────────────────────────────

interface PromotionPreviewProps {
  title: string;
  description: string;
  imageUrl: string | null;
  promotionType: string;
  discountValue: number | null;
  startDate: string;
  endDate: string;
  conditions: string;
  barCoverImage?: string | null;
  barLogoUrl?: string | null;
  /** Hide in-app UI elements (time remaining, CTA, social proof) — for share images */
  hideInAppUI?: boolean;
}

export default function PromotionPreviewCard({
  title,
  description,
  imageUrl,
  promotionType,
  discountValue,
  startDate,
  endDate,
  conditions,
  barCoverImage,
  barLogoUrl,
  hideInAppUI = false,
}: PromotionPreviewProps) {
  const image = resolveImage(imageUrl, barCoverImage ?? null, barLogoUrl ?? null);
  const timeRemaining = getTimeRemaining(endDate);
  const hasDiscount = discountValue != null && discountValue > 0;
  const hasContent = !!title;

  return (
    <Card $hasContent={hasContent}>
      <CoverArea $mode={image.mode}>
        {image.src && <img src={getImageUrl(image.src, 600)} alt={title || "Promotion"} />}
        {!image.src && "🎁"}

        {promotionType && <TypeBadge>{formatType(promotionType)}</TypeBadge>}
        {timeRemaining && !hideInAppUI && (
          <TimeRemaining $urgent={timeRemaining.urgent}>
            {timeRemaining.text}
          </TimeRemaining>
        )}

        {/* Discount value as hero element */}
        {hasDiscount && !image.src && (
          <DiscountHero>
            <DiscountValue>{discountValue}%</DiscountValue>
            <DiscountLabel>Off</DiscountLabel>
          </DiscountHero>
        )}
        {hasDiscount && image.src && (
          <DiscountHero>
            <DiscountValue>{discountValue}%</DiscountValue>
            <DiscountLabel>Off</DiscountLabel>
          </DiscountHero>
        )}
      </CoverArea>

      <Content>
        <Title>{title || "Untitled Promotion"}</Title>
        <Body
          style={hideInAppUI ? { WebkitLineClamp: "unset", display: "block" } : undefined}
        >
          {description || "Add a description to show how this will look to customers"}
        </Body>

        <Footer>
          <DateRange>
            {startDate || endDate
              ? formatDateRange(startDate, endDate)
              : "Set a date range"}
          </DateRange>
          {!hideInAppUI && (
            <SocialProof>
              <span>↗</span>
              <span>{hasDiscount ? "Offer live soon" : "Promo ready"}</span>
            </SocialProof>
          )}
        </Footer>

        {conditions && (
          <div
            style={{
              fontSize: "0.625rem",
              color: hideInAppUI ? "#6b7280" : "#4b5563",
              marginTop: "0.375rem",
              lineHeight: 1.4,
            }}
          >
            {conditions}
          </div>
        )}

        {!hideInAppUI && (
          <CtaRow>
            <CtaLabel>View promo</CtaLabel>
            <CtaChevron>→</CtaChevron>
          </CtaRow>
        )}
      </Content>
    </Card>
  );
}
