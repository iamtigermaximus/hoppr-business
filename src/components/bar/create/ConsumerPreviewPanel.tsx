"use client";

import styled from "styled-components";
import EventPreviewCard from "./previews/EventPreviewCard";
import PromotionPreviewCard from "./previews/PromotionPreviewCard";
import PassPreviewCard from "./previews/PassPreviewCard";

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

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem 1rem;
  color: #4b5563;
  font-size: 0.8125rem;
`;

// ---- Component ----

type ContentType = "event" | "promotion" | "pass";

interface FormState {
  title: string;
  description: string;
  imageUrl: string | null;
  // Event
  startTime: string;
  endTime: string;
  maxAttendees: number | null;
  isPrivate: boolean;
  // Promotion
  promotionType: string;
  discountValue: number | null;
  startDate: string;
  endDate: string;
  conditions: string;
  // Pass
  passType: string;
  priceEuros: string;
  originalPriceEuros: string;
  benefits: string[];
  totalQuantity: number | null;
}

interface ConsumerPreviewPanelProps {
  contentType: ContentType;
  formState: FormState;
  collapsed?: boolean;
}

export default function ConsumerPreviewPanel({
  contentType,
  formState,
  collapsed,
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

      {!collapsed && (
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
    </Wrapper>
  );
}
