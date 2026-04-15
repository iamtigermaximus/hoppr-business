"use client";

import styled from "styled-components";
import Link from "next/link";

const Section = styled.section`
  background: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e5e7eb;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  overflow: hidden;
`;

const CardHeader = styled.div`
  padding: 0.75rem 1rem;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 600;
  font-size: 0.875rem;
  color: #1f2937;
`;

const BarList = styled.div`
  padding: 0.5rem;
`;

const BarRow = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  text-decoration: none;
  border-bottom: 1px solid #e2e8f0;
  transition: background 0.2s;

  &:hover {
    background: #f1f5f9;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const BarInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const BarName = styled.span`
  font-weight: 600;
  color: #3b82f6;
  font-size: 0.875rem;
`;

const BarMeta = styled.div`
  display: flex;
  gap: 0.5rem;
  font-size: 0.7rem;
  color: #6b7280;
`;

const Rank = styled.div<{ $rank: number }>`
  width: 28px;
  height: 28px;
  background: ${(props) => {
    if (props.$rank === 1) return "#fbbf24";
    if (props.$rank === 2) return "#9ca3af";
    if (props.$rank === 3) return "#cd7f32";
    return "#e5e7eb";
  }};
  color: ${(props) => (props.$rank <= 3 ? "#1f2937" : "#6b7280")};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.75rem;
`;

const Stats = styled.div`
  text-align: right;
`;

const StatValue = styled.div`
  font-weight: 700;
  font-size: 0.875rem;
  color: #1f2937;
`;

const StatLabel = styled.div`
  font-size: 0.7rem;
  color: #6b7280;
`;

const Badge = styled.span<{ $score: number }>`
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  font-size: 0.625rem;
  font-weight: 500;
  background: ${(props) => {
    if (props.$score >= 80) return "#d1fae5";
    if (props.$score >= 50) return "#fef3c7";
    return "#fee2e2";
  }};
  color: ${(props) => {
    if (props.$score >= 80) return "#065f46";
    if (props.$score >= 50) return "#92400e";
    return "#991b1b";
  }};
`;

interface TopBar {
  id: string;
  name: string;
  type: string;
  city: string;
  district: string | null;
  profileViews?: number;
  completionScore?: number;
}

interface TopPerformingBarsProps {
  topByViews: TopBar[];
  topByCompletion: TopBar[];
}

const TopPerformingBars = ({
  topByViews,
  topByCompletion,
}: TopPerformingBarsProps) => {
  return (
    <Section>
      <SectionTitle>🏆 Top Performing Bars</SectionTitle>
      <Grid>
        <Card>
          <CardHeader>👁️ Most Viewed Bars</CardHeader>
          <BarList>
            {topByViews.length > 0 ? (
              topByViews.slice(0, 5).map((bar, index) => (
                <BarRow key={bar.id} href={`/admin/bars/${bar.id}`}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                    }}
                  >
                    <Rank $rank={index + 1}>{index + 1}</Rank>
                    <BarInfo>
                      <BarName>{bar.name}</BarName>
                      <BarMeta>
                        <span>{bar.type}</span>
                        <span>{bar.city}</span>
                        {bar.district && <span>{bar.district}</span>}
                      </BarMeta>
                    </BarInfo>
                  </div>
                  <Stats>
                    <StatValue>
                      {bar.profileViews?.toLocaleString() || 0}
                    </StatValue>
                    <StatLabel>views</StatLabel>
                  </Stats>
                </BarRow>
              ))
            ) : (
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  color: "#6b7280",
                }}
              >
                No view data yet
              </div>
            )}
          </BarList>
        </Card>

        <Card>
          <CardHeader>✅ Most Complete Profiles</CardHeader>
          <BarList>
            {topByCompletion.length > 0 ? (
              topByCompletion.slice(0, 5).map((bar, index) => (
                <BarRow key={bar.id} href={`/admin/bars/${bar.id}`}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                    }}
                  >
                    <Rank $rank={index + 1}>{index + 1}</Rank>
                    <BarInfo>
                      <BarName>{bar.name}</BarName>
                      <BarMeta>
                        <span>{bar.type}</span>
                        <span>{bar.city}</span>
                        {bar.district && <span>{bar.district}</span>}
                      </BarMeta>
                    </BarInfo>
                  </div>
                  <Stats>
                    <Badge $score={bar.completionScore || 0}>
                      {bar.completionScore || 0}% complete
                    </Badge>
                  </Stats>
                </BarRow>
              ))
            ) : (
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  color: "#6b7280",
                }}
              >
                No completion data yet
              </div>
            )}
          </BarList>
        </Card>
      </Grid>
    </Section>
  );
};

export default TopPerformingBars;
