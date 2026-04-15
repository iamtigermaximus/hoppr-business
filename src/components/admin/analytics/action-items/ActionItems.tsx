"use client";

import { useState } from "react";
import styled from "styled-components";
import ListModal from "./ListModal";

const Section = styled.section`
  background: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e5e7eb;
`;

const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ActionCard = styled.div<{ $priority: "high" | "medium" | "low" }>`
  padding: 1rem;
  border-radius: 0.5rem;
  border-left: 4px solid
    ${(props) => {
      switch (props.$priority) {
        case "high":
          return "#ef4444";
        case "medium":
          return "#f59e0b";
        default:
          return "#10b981";
      }
    }};
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateX(4px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
`;

const ActionTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
`;

const ActionValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
`;

const ActionDescription = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
`;

const Badge = styled.span<{ $type: string }>`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
  font-weight: 500;
  background: ${(props) => {
    switch (props.$type) {
      case "missing":
        return "#fee2e2";
      case "exists":
        return "#d1fae5";
      default:
        return "#f3f4f6";
    }
  }};
  color: ${(props) => {
    switch (props.$type) {
      case "missing":
        return "#dc2626";
      case "exists":
        return "#065f46";
      default:
        return "#374151";
    }
  }};
`;

const OpportunitiesContainer = styled.div`
  margin-top: 1rem;
`;

const OpportunitiesTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #374151;
`;

const BadgeContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

interface ActionItemsProps {
  barCompletionScore: number;
  barsWithNoStaff: number;
  barsInactiveOver30Days: number;
  topDistricts: Array<{ district: string; count: number }>;
  citiesWithoutBars: string[];
  helsinkiDistrictsWithZeroBars: string[];
  barTypeGaps: Array<{ type: string; count: number; status: string }>;
  onNavigate: (path: string) => void;
}

const ActionItems = ({
  barCompletionScore,
  barsWithNoStaff,
  barsInactiveOver30Days,
  topDistricts,
  citiesWithoutBars,
  helsinkiDistrictsWithZeroBars,
  barTypeGaps,
  onNavigate,
}: ActionItemsProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<
    "no-staff" | "inactive" | "completion-scores"
  >("no-staff");
  const [modalTitle, setModalTitle] = useState("");

  const handleViewDetails = (
    type: "no-staff" | "inactive" | "completion-scores",
    title: string,
  ) => {
    setModalType(type);
    setModalTitle(title);
    setModalOpen(true);
  };

  return (
    <>
      <Section>
        <SectionTitle>⚡ Action Items</SectionTitle>
        <ActionGrid>
          {/* Data Quality - Bar Completion Score */}
          <ActionCard
            $priority={
              barCompletionScore < 70
                ? "high"
                : barCompletionScore < 85
                  ? "medium"
                  : "low"
            }
            onClick={() =>
              handleViewDetails("completion-scores", "Bar Completion Scores")
            }
          >
            <ActionTitle>Data Quality</ActionTitle>
            <ActionValue>{barCompletionScore}%</ActionValue>
            <ActionDescription>
              Bar profile completion score
              {barCompletionScore < 70 && " - Needs improvement"}
            </ActionDescription>
          </ActionCard>

          {/* Bars with No Staff */}
          <ActionCard
            $priority={barsWithNoStaff > 0 ? "high" : "low"}
            onClick={() => handleViewDetails("no-staff", "Bars with No Staff")}
          >
            <ActionTitle>Unclaimed Bars</ActionTitle>
            <ActionValue>{barsWithNoStaff}</ActionValue>
            <ActionDescription>
              Bars with no staff assigned - Click to see list
            </ActionDescription>
          </ActionCard>

          {/* Inactive Bars (>30 days) */}
          <ActionCard
            $priority={barsInactiveOver30Days > 0 ? "medium" : "low"}
            onClick={() =>
              handleViewDetails("inactive", "Inactive Bars (>30 days)")
            }
          >
            <ActionTitle>Inactive Bars</ActionTitle>
            <ActionValue>{barsInactiveOver30Days}</ActionValue>
            <ActionDescription>
              Bars not updated in 30+ days - Click to see list
            </ActionDescription>
          </ActionCard>

          {/* Top Districts */}
          <ActionCard
            $priority="medium"
            onClick={() => onNavigate("/admin/analytics?tab=market")}
          >
            <ActionTitle>Top Districts</ActionTitle>
            <ActionValue>
              {topDistricts
                .slice(0, 3)
                .map((d) => d.district)
                .join(", ")}
            </ActionValue>
            <ActionDescription>
              Highest bar concentration - Sales focus areas
            </ActionDescription>
          </ActionCard>
        </ActionGrid>

        {/* Opportunity Areas */}
        {(citiesWithoutBars.length > 0 ||
          helsinkiDistrictsWithZeroBars.length > 0 ||
          barTypeGaps.length > 0) && (
          <OpportunitiesContainer>
            <OpportunitiesTitle>📍 Growth Opportunities</OpportunitiesTitle>
            <BadgeContainer>
              {/* Cities without bars */}
              {citiesWithoutBars.map((city) => (
                <Badge key={city} $type="missing">
                  No bars in {city}
                </Badge>
              ))}

              {/* Helsinki districts without bars (show top 5) */}
              {helsinkiDistrictsWithZeroBars.slice(0, 5).map((district) => (
                <Badge key={district} $type="missing">
                  No bars in {district} (Helsinki)
                </Badge>
              ))}

              {/* Bar type gaps */}
              {barTypeGaps.map((gap) => (
                <Badge
                  key={gap.type}
                  $type={gap.status === "missing" ? "missing" : "exists"}
                >
                  {gap.type.replace("_", " ")}: only {gap.count} bar
                  {gap.count !== 1 ? "s" : ""}
                </Badge>
              ))}
            </BadgeContainer>
          </OpportunitiesContainer>
        )}
      </Section>

      {/* Modal for displaying lists */}
      <ListModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        type={modalType}
      />
    </>
  );
};

export default ActionItems;
