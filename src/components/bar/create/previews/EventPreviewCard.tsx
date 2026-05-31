"use client";

import styled from "styled-components";

// Consumer-app dark theme (#0a0a0a, #1a1a1a, #262626, #7c3aed)
const Card = styled.div`
  background: #1a1a1a;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid #262626;
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

const DateBadge = styled.div`
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  background: #7c3aed;
  color: white;
  padding: 0.375rem 0.625rem;
  border-radius: 0.375rem;
  font-size: 0.6875rem;
  font-weight: 700;
  text-align: center;
  line-height: 1.2;
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

const VenueName = styled.span`
  color: #7c3aed;
  font-weight: 500;
`;

const AttendeeCount = styled.span`
  color: #6b7280;
`;

// ---- Component ----

interface EventPreviewProps {
  title: string;
  description: string;
  imageUrl: string | null;
  startTime: string;
  endTime: string;
  maxAttendees: number | null;
}

function formatDate(iso: string): string {
  if (!iso) return "TBA";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDateLong(iso: string): string {
  if (!iso) return "TBA";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EventPreviewCard({
  title,
  description,
  imageUrl,
  startTime,
  endTime,
  maxAttendees,
}: EventPreviewProps) {
  return (
    <Card>
      <CoverArea>
        {imageUrl && <img src={imageUrl} alt={title} />}
        {!imageUrl && "📅"}
        {startTime && <DateBadge>{formatDate(startTime)}</DateBadge>}
      </CoverArea>
      <Content>
        <Title>{title || "Untitled Event"}</Title>
        <Body>{description || "No description yet..."}</Body>
        <Footer>
          <div>
            <div style={{ marginBottom: "0.125rem" }}>
              {startTime ? formatDateLong(startTime) : "Date TBA"}
            </div>
            {endTime && (
              <div>Ends: {formatDateLong(endTime)}</div>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <AttendeeCount>
              {maxAttendees ? `0 / ${maxAttendees}` : "0 attending"}
            </AttendeeCount>
          </div>
        </Footer>
      </Content>
    </Card>
  );
}
