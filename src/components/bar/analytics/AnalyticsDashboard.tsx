// src/components/bar/analytics/AnalyticsDashboard.tsx
"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";

const Container = styled.div`
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #1f2937;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const DateFilter = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  color: #6b7280;
  font-size: 0.875rem;
`;

const StatChange = styled.div<{ $positive: boolean }>`
  font-size: 0.75rem;
  color: ${(props) => (props.$positive ? "#10b981" : "#ef4444")};
  margin-top: 0.25rem;
`;

const ChartContainer = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  margin-bottom: 2rem;
`;

const ChartTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #1f2937;
`;

const SimpleBarChart = styled.div`
  display: flex;
  align-items: end;
  gap: 0.5rem;
  height: 200px;
  padding: 1rem 0;
`;

const Bar = styled.div<{ $height: number }>`
  flex: 1;
  background: #3b82f6;
  height: ${(props) => props.$height}%;
  border-radius: 0.25rem 0.25rem 0 0;
  position: relative;
  min-height: 20px;
`;

const BarLabel = styled.div`
  position: absolute;
  bottom: -25px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 0.75rem;
  color: #6b7280;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const TableHeader = styled.th`
  background: #f8f9fa;
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
`;

const TableCell = styled.td`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  color: #6b7280;
`;

const Tabs = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.5rem;
  overflow-x: auto;
`;

interface TabProps {
  $active: boolean;
}

const Tab = styled.button<TabProps>`
  padding: 0.75rem 1.5rem;
  background: ${(props) => (props.$active ? "#3b82f6" : "transparent")};
  color: ${(props) => (props.$active ? "white" : "#6b7280")};
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 600;
  white-space: nowrap;

  &:hover {
    background: ${(props) => (props.$active ? "#2563eb" : "#f3f4f6")};
  }
`;

interface AnalyticsDashboardProps {
  barId: string;
}

interface TopPromotion {
  name: string;
  usage: number;
  revenue: number;
}

interface CustomerDemographics {
  newCustomers: number;
  returningCustomers: number;
  vipCustomers: number;
}

interface AnalyticsData {
  period: string;
  profileViews: number;
  vipPassSales: number;
  revenue: number;
  promotionClicks: number;
  socialCheckins: number;
  topPromotions: TopPromotion[];
  customerDemographics: CustomerDemographics;
}

const AnalyticsDashboard = ({ barId }: AnalyticsDashboardProps) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "promotions" | "customers"
  >("overview");
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getToken = (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("hoppr_token");
    }
    return null;
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [barId, timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `/api/bar/${barId}/analytics?range=${timeRange}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }

      const data: AnalyticsData = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load analytics",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Container>Loading analytics...</Container>;
  }

  if (error) {
    return (
      <Container>
        <div style={{ color: "#ef4444", textAlign: "center", padding: "2rem" }}>
          Error: {error}
          <button
            onClick={fetchAnalyticsData}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      </Container>
    );
  }

  if (!analyticsData) {
    return <Container>No data available</Container>;
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toLocaleString();
  };

  return (
    <Container>
      <Title>Analytics Dashboard</Title>

      <DateFilter>
        <div>
          <label>Time Range: </label>
          <Select
            value={timeRange}
            onChange={(e) =>
              setTimeRange(e.target.value as "7d" | "30d" | "90d")
            }
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </Select>
        </div>
      </DateFilter>

      <Tabs>
        <Tab
          $active={activeTab === "overview"}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </Tab>
        <Tab
          $active={activeTab === "promotions"}
          onClick={() => setActiveTab("promotions")}
        >
          Promotions
        </Tab>
        <Tab
          $active={activeTab === "customers"}
          onClick={() => setActiveTab("customers")}
        >
          Customers
        </Tab>
      </Tabs>

      {activeTab === "overview" && (
        <>
          <StatsGrid>
            <StatCard>
              <StatValue>{formatNumber(analyticsData.vipPassSales)}</StatValue>
              <StatLabel>VIP Pass Sales</StatLabel>
            </StatCard>

            <StatCard>
              <StatValue>€{formatNumber(analyticsData.revenue)}</StatValue>
              <StatLabel>Revenue</StatLabel>
            </StatCard>

            <StatCard>
              <StatValue>{formatNumber(analyticsData.profileViews)}</StatValue>
              <StatLabel>Profile Views</StatLabel>
            </StatCard>

            <StatCard>
              <StatValue>
                {formatNumber(analyticsData.promotionClicks)}
              </StatValue>
              <StatLabel>Promotion Clicks</StatLabel>
            </StatCard>
          </StatsGrid>

          <ChartContainer>
            <ChartTitle>Revenue Trend</ChartTitle>
            <SimpleBarChart>
              {[65, 80, 75, 90, 85, 95, 100].map((height, index) => (
                <Bar key={index} $height={height}>
                  <BarLabel>Day {index + 1}</BarLabel>
                </Bar>
              ))}
            </SimpleBarChart>
          </ChartContainer>
        </>
      )}

      {activeTab === "promotions" && (
        <ChartContainer>
          <ChartTitle>Top Performing Promotions</ChartTitle>
          <Table>
            <thead>
              <tr>
                <TableHeader>Promotion Name</TableHeader>
                <TableHeader>Usage</TableHeader>
                <TableHeader>Revenue</TableHeader>
              </tr>
            </thead>
            <tbody>
              {analyticsData.topPromotions.map((promotion, index) => (
                <tr key={index}>
                  <TableCell>{promotion.name}</TableCell>
                  <TableCell>{promotion.usage} times</TableCell>
                  <TableCell>€{formatNumber(promotion.revenue)}</TableCell>
                </tr>
              ))}
            </tbody>
          </Table>
        </ChartContainer>
      )}

      {activeTab === "customers" && (
        <ChartContainer>
          <ChartTitle>Customer Demographics</ChartTitle>
          <StatsGrid>
            <StatCard>
              <StatValue>
                {formatNumber(analyticsData.customerDemographics.newCustomers)}
              </StatValue>
              <StatLabel>New Customers</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>
                {formatNumber(
                  analyticsData.customerDemographics.returningCustomers,
                )}
              </StatValue>
              <StatLabel>Returning Customers</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>
                {formatNumber(analyticsData.customerDemographics.vipCustomers)}
              </StatValue>
              <StatLabel>VIP Customers</StatLabel>
            </StatCard>
          </StatsGrid>
        </ChartContainer>
      )}
    </Container>
  );
};

export default AnalyticsDashboard;
