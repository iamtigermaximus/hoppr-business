"use client";

import styled from "styled-components";

// Consumer-app dark theme
const Card = styled.div`
  background: #1a1a1a;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid #262626;
  position: relative;
`;

const CoverArea = styled.div`
  height: 140px;
  background: #262626;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4b5563;
  font-size: 2rem;
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

const DiscountRibbon = styled.div`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: #ef4444;
  color: white;
  padding: 0.375rem 0.625rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 700;
  z-index: 1;
`;

const TypeBadge = styled.span`
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  z-index: 1;
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

const Conditions = styled.div`
  font-size: 0.6875rem;
  color: #6b7280;
  margin-top: 0.375rem;
  font-style: italic;
`;

// ---- Component ----

interface PromotionPreviewProps {
  title: string;
  description: string;
  imageUrl: string | null;
  promotionType: string;
  discountValue: number | null;
  startDate: string;
  endDate: string;
  conditions: string;
}

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

function formatType(type: string): string {
  return type.replace(/_/g, " ");
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
}: PromotionPreviewProps) {
  return (
    <Card>
      <CoverArea>
        {imageUrl && <img src={imageUrl} alt={title} />}
        {!imageUrl && "🎁"}
        {promotionType && <TypeBadge>{formatType(promotionType)}</TypeBadge>}
        {discountValue != null && discountValue > 0 && (
          <DiscountRibbon>{discountValue}% OFF</DiscountRibbon>
        )}
      </CoverArea>
      <Content>
        <Title>{title || "Untitled Promotion"}</Title>
        <Body>{description || "No description yet..."}</Body>
        <Footer>
          <DateRange>
            {startDate || endDate
              ? formatDateRange(startDate, endDate)
              : "Valid until further notice"}
          </DateRange>
        </Footer>
        {conditions && <Conditions>{conditions}</Conditions>}
      </Content>
    </Card>
  );
}
