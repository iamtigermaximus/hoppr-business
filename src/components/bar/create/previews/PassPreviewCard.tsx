"use client";

import styled from "styled-components";
import { getImageUrl } from "@/lib/cloudinary-url";

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

const TypeBadge = styled.span`
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  background: #7c3aed;
  color: white;
  padding: 0.25rem 0.625rem;
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
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const PriceRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const Price = styled.span`
  font-size: 1.25rem;
  font-weight: 700;
  color: #f9fafb;
`;

const OriginalPrice = styled.span`
  font-size: 0.8125rem;
  color: #6b7280;
  text-decoration: line-through;
`;

const Benefits = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-bottom: 0.5rem;
`;

const BenefitChip = styled.span`
  font-size: 0.625rem;
  padding: 0.1875rem 0.5rem;
  background: #262626;
  color: #d1d5db;
  border-radius: 0.25rem;
  border: 1px solid #374151;
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.6875rem;
  color: #6b7280;
`;

const QuantityBar = styled.div`
  margin-top: 0.5rem;
`;

const ProgressTrack = styled.div`
  height: 4px;
  background: #262626;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 0.25rem;
`;

const ProgressFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => Math.min(100, $pct)}%;
  background: #7c3aed;
  border-radius: 2px;
`;

// ---- Component ----

interface PassPreviewProps {
  title: string;
  description: string;
  imageUrl: string | null;
  passType: string;
  priceEuros: string;
  originalPriceEuros: string;
  benefits: string[];
  totalQuantity: number | null;
}

function formatType(type: string): string {
  return type.replace(/_/g, " ");
}

export default function PassPreviewCard({
  title,
  description,
  imageUrl,
  passType,
  priceEuros,
  originalPriceEuros,
  benefits,
  totalQuantity,
}: PassPreviewProps) {
  return (
    <Card>
      <CoverArea>
        {imageUrl && <img src={getImageUrl(imageUrl, 600)} alt={title} />}
        {!imageUrl && "🎟️"}
        {passType && <TypeBadge>{formatType(passType)}</TypeBadge>}
      </CoverArea>
      <Content>
        <Title>{title || "Untitled Pass"}</Title>
        <PriceRow>
          {priceEuros && <Price>€{priceEuros}</Price>}
          {originalPriceEuros && (
            <OriginalPrice>€{originalPriceEuros}</OriginalPrice>
          )}
          {!priceEuros && <Price>€--</Price>}
        </PriceRow>
        {benefits.length > 0 && (
          <Benefits>
            {benefits.slice(0, 4).map((b, i) => (
              <BenefitChip key={i}>{b}</BenefitChip>
            ))}
          </Benefits>
        )}
        {description && (
          <div
            style={{
              fontSize: "0.75rem",
              color: "#9ca3af",
              marginBottom: "0.5rem",
            }}
          >
            {description.slice(0, 100)}
          </div>
        )}
        <Footer>
          <span>{benefits.length} benefits</span>
          {totalQuantity && <span>{totalQuantity} available</span>}
        </Footer>
        {totalQuantity && totalQuantity > 0 && (
          <QuantityBar>
            <ProgressTrack>
              <ProgressFill $pct={0} />
            </ProgressTrack>
          </QuantityBar>
        )}
      </Content>
    </Card>
  );
}
