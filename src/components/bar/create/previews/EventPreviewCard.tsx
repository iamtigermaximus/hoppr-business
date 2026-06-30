"use client";

import styled from "styled-components";

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

// ── Styled ──────────────────────────────────────────────────────

const Card = styled.div<{ $hasContent: boolean }>`
  background: #1a1a1a;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid #262626;
  border-left: 3px solid #7c3aed;
  position: relative;
  ${({ $hasContent }) => !$hasContent && "opacity: 0.6;"}
`;

const CoverArea = styled.div<{ $mode: "image" | "logo" | "gradient" }>`
  height: 160px;
  background: ${({ $mode }) =>
    $mode === "gradient"
      ? "linear-gradient(135deg, #4c1d95 0%, #5b21b6 40%, #6d28d9 100%)"
      : "#1a1a1a"};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c4b5fd;
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

// Calendar date block — dominant on-image element
const DateBlock = styled.div`
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  background: rgba(0, 0, 0, 0.75);
  border-radius: 0.5rem;
  padding: 0.5rem 0.625rem;
  text-align: center;
  min-width: 52px;
  z-index: 3;
  backdrop-filter: blur(4px);
`;

const DateMonth = styled.div`
  font-size: 0.5625rem;
  font-weight: 700;
  color: #c4b5fd;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1;
`;

const DateDay = styled.div`
  font-size: 1.375rem;
  font-weight: 800;
  color: #f9fafb;
  line-height: 1.2;
`;

const DateDayOfWeek = styled.div`
  font-size: 0.5625rem;
  font-weight: 600;
  color: #a78bfa;
  text-transform: uppercase;
  line-height: 1;
  margin-top: 0.125rem;
`;

const PriceTag = styled.div<{ $free?: boolean }>`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: ${({ $free }) =>
    $free ? "rgba(16,185,129,0.9)" : "rgba(0,0,0,0.65)"};
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-weight: 700;
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
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
`;

const TimeChip = styled.span`
  font-size: 0.625rem;
  color: #c4b5fd;
  background: rgba(124, 58, 237, 0.15);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-weight: 500;
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.6875rem;
  color: #6b7280;
`;

const AttendeeCount = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #7c3aed;
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
  color: #7c3aed;
  font-weight: 600;
`;

const CtaChevron = styled.span`
  font-size: 0.75rem;
  color: #7c3aed;
`;

// ── Helpers ─────────────────────────────────────────────────────

function formatCalDate(iso: string): {
  month: string;
  day: string;
  dow: string;
} | null {
  if (!iso) return null;
  const d = new Date(iso);
  return {
    month: d.toLocaleDateString("en-US", { month: "short" }),
    day: String(d.getDate()),
    dow: d.toLocaleDateString("en-US", { weekday: "short" }),
  };
}

function formatTime(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Component ───────────────────────────────────────────────────

interface EventPreviewProps {
  title: string;
  description: string;
  imageUrl: string | null;
  startTime: string;
  endTime: string;
  maxAttendees: number | null;
  barCoverImage?: string | null;
  barLogoUrl?: string | null;
  /** Hide in-app UI elements (attendee count, CTA) — for share images */
  hideInAppUI?: boolean;
}

export default function EventPreviewCard({
  title,
  description,
  imageUrl,
  startTime,
  endTime,
  maxAttendees,
  barCoverImage,
  barLogoUrl,
  hideInAppUI = false,
}: EventPreviewProps) {
  const image = resolveImage(imageUrl, barCoverImage ?? null, barLogoUrl ?? null);
  const cal = formatCalDate(startTime);
  const timeStr = formatTime(startTime);
  const endTimeStr = formatTime(endTime);
  const hasContent = !!title;

  return (
    <Card $hasContent={hasContent}>
      <CoverArea $mode={image.mode}>
        {image.src && <img src={image.src} alt={title || "Event"} />}
        {!image.src && "📅"}

        {/* Calendar date block — dominant visual */}
        {cal && (
          <DateBlock>
            <DateMonth>{cal.month}</DateMonth>
            <DateDay>{cal.day}</DateDay>
            <DateDayOfWeek>{cal.dow}</DateDayOfWeek>
          </DateBlock>
        )}

        {/* Price tag — default "FREE" for events without a price field */}
        <PriceTag $free>FREE</PriceTag>
      </CoverArea>

      <Content>
        <Title>{title || "Untitled Event"}</Title>

        {/* Time + optional end-time chips */}
        {timeStr && (
          <MetaRow>
            <TimeChip>{timeStr}</TimeChip>
            {endTimeStr && <TimeChip>– {endTimeStr}</TimeChip>}
          </MetaRow>
        )}

        <Body
          style={hideInAppUI ? { WebkitLineClamp: "unset", display: "block" } : undefined}
        >
          {description || "Add a description — event cards get 3 lines to give customers enough context"}
        </Body>

        {!hideInAppUI && (
          <Footer>
            <AttendeeCount>
              <span>👥</span>
              <span>
                {maxAttendees != null && maxAttendees > 0
                  ? `0 / ${maxAttendees} spots`
                  : "Be the first"}
              </span>
            </AttendeeCount>
          </Footer>
        )}

        {!hideInAppUI && (
          <CtaRow>
            <CtaLabel>See event</CtaLabel>
            <CtaChevron>→</CtaChevron>
          </CtaRow>
        )}
      </Content>
    </Card>
  );
}
