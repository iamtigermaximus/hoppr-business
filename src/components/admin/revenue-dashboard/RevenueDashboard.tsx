"use client";

import { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { SkeletonBox, SkeletonCard } from "@/components/ui/Skeleton";

// ---- Styled Components ----

const Container = styled.div`
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;

  @media (min-width: 768px) {
    padding: 1.5rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;

  @media (min-width: 768px) {
    font-size: 2rem;
  }
`;

const RangeSelector = styled.div`
  display: flex;
  gap: 0.375rem;
  background: #f3f4f6;
  border-radius: 0.5rem;
  padding: 0.25rem;
`;

const RangeButton = styled.button<{ $active: boolean }>`
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  background: ${({ $active }) => ($active ? "white" : "transparent")};
  color: ${({ $active }) => ($active ? "#1f2937" : "#6b7280")};
  box-shadow: ${({ $active }) => ($active ? "0 1px 3px rgba(0,0,0,0.1)" : "none")};

  &:hover {
    color: #1f2937;
  }
`;

// Summary cards
const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const SummaryCard = styled.div`
  background: white;
  border-radius: 0.75rem;
  padding: 1.25rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
`;

const SummaryLabel = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.375rem;
`;

const SummaryValue = styled.div`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
`;

const SummarySubtext = styled.div<{ $positive?: boolean }>`
  font-size: 0.75rem;
  color: ${({ $positive }) => ($positive ? "#16a34a" : "#dc2626")};
  margin-top: 0.25rem;
  font-weight: 500;
`;

// Two-column layout
const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;

  @media (min-width: 1024px) {
    grid-template-columns: 1fr 1fr;
  }
`;

// Cards
const Card = styled.div`
  background: white;
  border-radius: 0.75rem;
  padding: 1.25rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  margin-bottom: 1.5rem;
`;

const CardTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
`;

// Table
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: 0.5rem 0.75rem;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e5e7eb;
`;

const Td = styled.td`
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
`;

const Tr = styled.tr`
  &:last-child td {
    border-bottom: none;
  }
`;

// Horizontal bar chart for types
const BarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.625rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const BarLabel = styled.div`
  width: 100px;
  font-size: 0.75rem;
  color: #374151;
  font-weight: 500;
  text-align: right;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const BarTrack = styled.div`
  flex: 1;
  height: 20px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
`;

const BarFill = styled.div<{ $width: number; $index: number }>`
  height: 100%;
  width: ${({ $width }) => $width}%;
  border-radius: 4px;
  background: ${({ $index }) => {
    const colors = ["#7c3aed", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#6366f1"];
    return colors[$index % colors.length];
  }};
  transition: width 0.5s ease;
`;

const BarValue = styled.div`
  width: 80px;
  font-size: 0.75rem;
  color: #374151;
  font-weight: 600;
  flex-shrink: 0;
`;

// Monthly trend bars
const TrendChart = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 140px;
  padding-top: 0.5rem;
`;

const TrendBarContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
`;

const TrendBar = styled.div<{ $height: number; $isMax: boolean }>`
  width: 100%;
  max-width: 40px;
  height: ${({ $height }) => Math.max($height, 2)}px;
  background: ${({ $isMax }) => ($isMax ? "#7c3aed" : "#c4b5fd")};
  border-radius: 3px 3px 0 0;
  transition: height 0.5s ease;
  min-height: 2px;
`;

const TrendValue = styled.span`
  font-size: 0.625rem;
  color: #6b7280;
  font-weight: 500;
`;

const TrendMonth = styled.span`
  font-size: 0.625rem;
  color: #9ca3af;
`;

// Loading/Error
const LoadingOverlay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #6b7280;
  font-size: 1rem;
`;

const ErrorBox = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 1.5rem;
  border-radius: 0.5rem;
  text-align: center;
`;

// ---- Types ----

type RangeKey = "7d" | "30d" | "90d" | "1y";

interface RevenueByBarType {
  type: string;
  revenue: number;
  passCount: number;
  barCount: number;
}

interface RevenueByCity {
  city: string;
  revenue: number;
  passCount: number;
  barCount: number;
}

interface TopBarRevenue {
  barId: string;
  barName: string;
  barType: string;
  city: string | null;
  revenue: number;
  passesSold: number;
}

interface MonthlyTrend {
  month: string;
  revenue: number;
  passesSold: number;
}

interface RevenueData {
  totalRevenue: number;
  totalPassesSold: number;
  totalPassQuantity: number;
  vipEnabledBars: number;
  totalBars: number;
  vipAdoptionRate: number;
  averageRevenuePerBar: number;
  revenueByType: RevenueByBarType[];
  revenueByCity: RevenueByCity[];
  topBars: TopBarRevenue[];
  monthlyTrends: MonthlyTrend[];
  periodComparison: {
    currentPeriod: string;
    currentRevenue: number;
    previousRevenue: number;
    growthPercent: number;
  };
}

interface RevenueResponse {
  success: boolean;
  revenue: RevenueData;
}

// ---- Helpers ----

function formatEuro(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ---- Component ----

const RevenueDashboard = () => {
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeKey>("30d");

  const fetchRevenue = useCallback(async (r: RangeKey) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("hoppr_token");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      const res = await fetch(`/api/auth/admin/revenue?range=${r}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Failed: ${res.status}`);

      const data: RevenueResponse = await res.json();
      setRevenue(data.revenue);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch revenue data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRevenue(range);
  }, [range, fetchRevenue]);

  const handleRangeChange = (r: RangeKey) => {
    setRange(r);
  };

  if (loading && !revenue) {
    return (
      <Container>
        <Header>
          <Title>Revenue Dashboard</Title>
        </Header>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i}>
              <SkeletonBox $width="50%" $height="0.75rem" />
              <SkeletonBox $width="35%" $height="1.25rem" />
            </SkeletonCard>
          ))}
        </div>
        <SkeletonCard>
          <SkeletonBox $width="30%" $height="0.75rem" />
          <SkeletonBox $width="100%" $height="250px" $radius="0.5rem" />
        </SkeletonCard>
      </Container>
    );
  }

  if (error && !revenue) {
    return (
      <Container>
        <Header>
          <Title>Revenue Dashboard</Title>
        </Header>
        <ErrorBox>
          <p>{error}</p>
          <button onClick={() => fetchRevenue(range)} style={{ marginTop: "1rem" }}>
            Try Again
          </button>
        </ErrorBox>
      </Container>
    );
  }

  if (!revenue) return null;

  const maxTypeRevenue = Math.max(1, ...revenue.revenueByType.map((t) => t.revenue));
  const maxMonthlyRevenue = Math.max(1, ...revenue.monthlyTrends.map((t) => t.revenue));

  return (
    <Container>
      <Header>
        <Title>Revenue Dashboard</Title>
        <RangeSelector>
          {(["7d", "30d", "90d", "1y"] as RangeKey[]).map((r) => (
            <RangeButton
              key={r}
              $active={range === r}
              onClick={() => handleRangeChange(r)}
            >
              {r === "1y" ? "1 Year" : r}
            </RangeButton>
          ))}
        </RangeSelector>
      </Header>

      {/* Revenue Overview */}
      <SummaryGrid>
        <SummaryCard>
          <SummaryLabel>Total Revenue (Lifetime)</SummaryLabel>
          <SummaryValue>{formatEuro(revenue.totalRevenue)}</SummaryValue>
          <SummarySubtext $positive={revenue.periodComparison.growthPercent >= 0}>
            {revenue.periodComparison.growthPercent >= 0 ? "↑" : "↓"}{" "}
            {Math.abs(revenue.periodComparison.growthPercent)}% vs previous period
          </SummarySubtext>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>{revenue.periodComparison.currentPeriod} Revenue</SummaryLabel>
          <SummaryValue>{formatEuro(revenue.periodComparison.currentRevenue)}</SummaryValue>
          <SummarySubtext $positive={revenue.periodComparison.growthPercent >= 0}>
            vs {formatEuro(revenue.periodComparison.previousRevenue)} previous
          </SummarySubtext>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>Total Passes Sold</SummaryLabel>
          <SummaryValue>{revenue.totalPassesSold.toLocaleString()}</SummaryValue>
          <SummarySubtext>
            {revenue.totalPassQuantity.toLocaleString()} total inventory
          </SummarySubtext>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>VIP Adoption</SummaryLabel>
          <SummaryValue>{revenue.vipAdoptionRate}%</SummaryValue>
          <SummarySubtext>
            {revenue.vipEnabledBars} of {revenue.totalBars} bars
          </SummarySubtext>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>Avg Revenue Per Bar</SummaryLabel>
          <SummaryValue>{formatEuro(revenue.averageRevenuePerBar)}</SummaryValue>
          <SummarySubtext>Across all {revenue.totalBars} bars</SummarySubtext>
        </SummaryCard>
      </SummaryGrid>

      <ContentGrid>
        {/* Revenue by Bar Type */}
        <Card>
          <CardTitle>Revenue by Bar Type</CardTitle>
          {revenue.revenueByType.length === 0 ? (
            <div style={{ color: "#9ca3af", fontSize: "0.875rem", padding: "1rem 0" }}>
              No revenue data yet
            </div>
          ) : (
            revenue.revenueByType.map((item, i) => (
              <BarRow key={item.type}>
                <BarLabel>{item.type}</BarLabel>
                <BarTrack>
                  <BarFill $width={(item.revenue / maxTypeRevenue) * 100} $index={i} />
                </BarTrack>
                <BarValue>{formatEuro(item.revenue)}</BarValue>
              </BarRow>
            ))
          )}
        </Card>

        {/* Top Bars by Revenue */}
        <Card>
          <CardTitle>Top Bars by Revenue</CardTitle>
          {revenue.topBars.length === 0 ? (
            <div style={{ color: "#9ca3af", fontSize: "0.875rem", padding: "1rem 0" }}>
              No bar revenue data yet
            </div>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>#</Th>
                  <Th>Bar</Th>
                  <Th>Type</Th>
                  <Th>Revenue</Th>
                  <Th>Sold</Th>
                </tr>
              </thead>
              <tbody>
                {revenue.topBars.map((bar, i) => (
                  <Tr key={bar.barId}>
                    <Td style={{ fontWeight: 600, color: "#6b7280" }}>{i + 1}</Td>
                    <Td style={{ fontWeight: 500 }}>{bar.barName}</Td>
                    <Td style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                      {(bar.barType || "").replace(/_/g, " ")}
                    </Td>
                    <Td style={{ fontWeight: 600 }}>{formatEuro(bar.revenue)}</Td>
                    <Td>{bar.passesSold}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        {/* Revenue by City */}
        <Card>
          <CardTitle>Revenue by City</CardTitle>
          {revenue.revenueByCity.length === 0 ? (
            <div style={{ color: "#9ca3af", fontSize: "0.875rem", padding: "1rem 0" }}>
              No city revenue data yet
            </div>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>City</Th>
                  <Th>Bars</Th>
                  <Th>Passes</Th>
                  <Th>Revenue</Th>
                </tr>
              </thead>
              <tbody>
                {revenue.revenueByCity.map((city) => (
                  <Tr key={city.city}>
                    <Td style={{ fontWeight: 500 }}>{city.city}</Td>
                    <Td>{city.barCount}</Td>
                    <Td>{city.passCount.toLocaleString()}</Td>
                    <Td style={{ fontWeight: 600 }}>{formatEuro(city.revenue)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardTitle>Monthly Revenue Trends</CardTitle>
          {revenue.monthlyTrends.every((t) => t.revenue === 0) ? (
            <div style={{ color: "#9ca3af", fontSize: "0.875rem", padding: "1rem 0" }}>
              No monthly data yet
            </div>
          ) : (
            <TrendChart>
              {revenue.monthlyTrends.map((trend) => (
                <TrendBarContainer key={trend.month}>
                  <TrendValue>
                    {trend.revenue > 0 ? formatEuro(trend.revenue) : ""}
                  </TrendValue>
                  <TrendBar
                    $height={(trend.revenue / maxMonthlyRevenue) * 100}
                    $isMax={trend.revenue === maxMonthlyRevenue}
                  />
                  <TrendMonth>{trend.month}</TrendMonth>
                </TrendBarContainer>
              ))}
            </TrendChart>
          )}
        </Card>
      </ContentGrid>
    </Container>
  );
};

export default RevenueDashboard;
