"use client";

import styled from "styled-components";

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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  background: #f8fafc;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
`;

const StatSubtext = styled.div`
  font-size: 0.7rem;
  color: #9ca3af;
`;

const WarningCard = styled(StatCard)`
  background: #fef2f2;
  border-color: #fecaca;
`;

const WarningValue = styled(StatValue)`
  color: #dc2626;
`;

interface BarEngagementSummaryProps {
  totalProfileViews: number;
  avgViewsPerBar: number;
  barsWithZeroViews: number;
  totalBars: number;
}

const BarEngagementSummary = ({
  totalProfileViews,
  avgViewsPerBar,
  barsWithZeroViews,
  totalBars,
}: BarEngagementSummaryProps) => {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toLocaleString();
  };

  const zeroViewPercentage =
    totalBars > 0 ? Math.round((barsWithZeroViews / totalBars) * 100) : 0;

  return (
    <Section>
      <SectionTitle>📈 Bar Engagement Summary</SectionTitle>
      <StatsGrid>
        <StatCard>
          <StatValue>{formatNumber(totalProfileViews)}</StatValue>
          <StatLabel>Total Profile Views</StatLabel>
          <StatSubtext>All-time across all bars</StatSubtext>
        </StatCard>

        <StatCard>
          <StatValue>{avgViewsPerBar}</StatValue>
          <StatLabel>Average Views Per Bar</StatLabel>
          <StatSubtext>Views ÷ Total bars</StatSubtext>
        </StatCard>

        <WarningCard>
          <WarningValue>{barsWithZeroViews}</WarningValue>
          <StatLabel>Bars with Zero Views</StatLabel>
          <StatSubtext>{zeroViewPercentage}% of total bars</StatSubtext>
        </WarningCard>

        <StatCard>
          <StatValue>{formatNumber(totalProfileViews)}</StatValue>
          <StatLabel>Total Engagement</StatLabel>
          <StatSubtext>Views + Clicks + Shares</StatSubtext>
        </StatCard>
      </StatsGrid>
    </Section>
  );
};

export default BarEngagementSummary;
