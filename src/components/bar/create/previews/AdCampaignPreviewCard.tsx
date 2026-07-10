"use client";

import styled from "styled-components";
import { getImageUrl } from "@/lib/cloudinary-url";

// ── Image fallback hierarchy (same logic as all preview cards) ──
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

function relevanceLabel(type: string): string {
  switch (type) {
    case "FEATURED_LISTING": return "Featured";
    case "SPONSORED_EVENT": return "Trending event";
    case "BOOSTED_PROMO": return "Popular offer";
    case "BANNER_AD": return "Discover";
    default: return "New";
  }
}

// ── Styled ──────────────────────────────────────────────────────

const Card = styled.div<{ $hasContent: boolean }>`
  background: #1a1a1a;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid #262626;
  border-left: 3px solid #6366f1;
  position: relative;
  ${({ $hasContent }) => !$hasContent && "opacity: 0.6;"}
`;

const CoverArea = styled.div<{ $mode: "image" | "logo" | "gradient" }>`
  height: 160px;
  background: ${({ $mode }) =>
    $mode === "gradient"
      ? "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)"
      : "#1a1a1a"};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a5b4fc;
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

const RelevanceBadge = styled.span`
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  background: rgba(99, 102, 241, 0.85);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-weight: 600;
  z-index: 3;
`;

const TypeBadge = styled.span`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: rgba(0, 0, 0, 0.65);
  color: #a5b4fc;
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
  color: #6366f1;
  font-weight: 600;
`;

const CtaChevron = styled.span`
  font-size: 0.75rem;
  color: #6366f1;
`;

const SponsoredRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.375rem;
`;

const SponsoredDot = styled.span`
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #6366f1;
  opacity: 0.6;
`;

const SponsoredLabel = styled.span`
  font-size: 0.5625rem;
  color: #4b5563;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
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

// ── Component ───────────────────────────────────────────────────

interface AdCampaignPreviewProps {
  title: string;
  description: string;
  imageUrl: string | null;
  campaignType: string;
  campaignBudget: number;
  campaignStartDate: string;
  campaignEndDate: string;
  barCoverImage?: string | null;
  barLogoUrl?: string | null;
}

export default function AdCampaignPreviewCard({
  title,
  description,
  imageUrl,
  campaignType,
  campaignBudget: _campaignBudget,
  campaignStartDate,
  campaignEndDate,
  barCoverImage,
  barLogoUrl,
}: AdCampaignPreviewProps) {
  const image = resolveImage(imageUrl, barCoverImage ?? null, barLogoUrl ?? null);
  const hasContent = !!title;

  return (
    <Card $hasContent={hasContent}>
      <CoverArea $mode={image.mode}>
        {image.src && <img src={getImageUrl(image.src, 600)} alt={title || "Campaign"} />}
        {!image.src && "📢"}

        <RelevanceBadge>{relevanceLabel(campaignType)}</RelevanceBadge>
        {campaignType && (
          <TypeBadge>{campaignType.replace(/_/g, " ")}</TypeBadge>
        )}
      </CoverArea>

      <Content>
        <SponsoredRow>
          <SponsoredDot />
          <SponsoredLabel>Sponsored</SponsoredLabel>
        </SponsoredRow>

        <Title>{title || "Untitled Campaign"}</Title>
        <Body>
          {description ||
            "Your ad needs a compelling headline and description. Good ads highlight what makes your bar worth visiting."}
        </Body>

        <Footer>
          <DateRange>
            {campaignStartDate || campaignEndDate
              ? formatDateRange(campaignStartDate, campaignEndDate)
              : "Set campaign dates"}
          </DateRange>
        </Footer>

        <CtaRow>
          <CtaLabel>Learn more</CtaLabel>
          <CtaChevron>→</CtaChevron>
        </CtaRow>
      </Content>
    </Card>
  );
}
