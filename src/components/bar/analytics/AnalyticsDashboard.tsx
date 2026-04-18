// src/components/bar/analytics/AnalyticsDashboard.tsx

"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import PerformanceDashboard from "./PerformanceDashboard";

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

const StatCard = styled.div<{ $isEmpty?: boolean }>`
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  text-align: center;
  opacity: ${(props) => (props.$isEmpty ? 0.6 : 1)};
`;

const StatValue = styled.div<{ $isEmpty?: boolean }>`
  font-size: 2rem;
  font-weight: 700;
  color: ${(props) => (props.$isEmpty ? "#9ca3af" : "#1f2937")};
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

const Bar = styled.div<{ $height: number; $isEmpty?: boolean }>`
  flex: 1;
  background: ${(props) => (props.$isEmpty ? "#e5e7eb" : "#3b82f6")};
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

// Empty State Components
const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  margin-bottom: 2rem;
`;

const EmptyStateIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const EmptyStateTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const EmptyStateDescription = styled.p`
  color: #6b7280;
  margin-bottom: 1.5rem;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
`;

const CreateButton = styled.button`
  background: #3b82f6;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #2563eb;
    transform: translateY(-1px);
  }
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

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

interface AnalyticsDashboardProps {
  barId: string;
}

type TabType = "overview" | "promotions" | "customers" | "performance";

const AnalyticsDashboard = ({ barId }: AnalyticsDashboardProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
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
        `/api/auth/bar/${barId}/analytics?range=${timeRange}`,
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

  const hasRealData = (data: AnalyticsData): boolean => {
    return (
      data.profileViews > 0 ||
      data.vipPassSales > 0 ||
      data.revenue > 0 ||
      data.promotionClicks > 0 ||
      data.topPromotions.length > 0
    );
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toLocaleString();
  };

  const renderOverviewTab = (data: AnalyticsData) => {
    const hasData = hasRealData(data);

    return (
      <>
        <StatsGrid>
          <StatCard $isEmpty={!hasData}>
            <StatValue $isEmpty={!hasData}>
              {hasData ? formatNumber(data.vipPassSales) : "—"}
            </StatValue>
            <StatLabel>VIP Pass Sales</StatLabel>
            {!hasData && <StatChange $positive={false}>No data yet</StatChange>}
          </StatCard>

          <StatCard $isEmpty={!hasData}>
            <StatValue $isEmpty={!hasData}>
              {hasData ? `€${formatNumber(data.revenue)}` : "—"}
            </StatValue>
            <StatLabel>Revenue</StatLabel>
            {!hasData && <StatChange $positive={false}>No data yet</StatChange>}
          </StatCard>

          <StatCard $isEmpty={!hasData}>
            <StatValue $isEmpty={!hasData}>
              {hasData ? formatNumber(data.profileViews) : "—"}
            </StatValue>
            <StatLabel>Profile Views</StatLabel>
            {!hasData && <StatChange $positive={false}>No data yet</StatChange>}
          </StatCard>

          <StatCard $isEmpty={!hasData}>
            <StatValue $isEmpty={!hasData}>
              {hasData ? formatNumber(data.promotionClicks) : "—"}
            </StatValue>
            <StatLabel>Promotion Clicks</StatLabel>
            {!hasData && <StatChange $positive={false}>No data yet</StatChange>}
          </StatCard>
        </StatsGrid>

        <ChartContainer>
          <ChartTitle>Revenue Trend</ChartTitle>
          {hasData ? (
            <SimpleBarChart>
              {[65, 80, 75, 90, 85, 95, 100].map((height, index) => (
                <Bar key={index} $height={height}>
                  <BarLabel>Day {index + 1}</BarLabel>
                </Bar>
              ))}
            </SimpleBarChart>
          ) : (
            <EmptyState style={{ padding: "2rem", margin: 0 }}>
              <EmptyStateIcon>📈</EmptyStateIcon>
              <EmptyStateDescription style={{ marginBottom: 0 }}>
                Revenue data will appear here once you start making sales
              </EmptyStateDescription>
            </EmptyState>
          )}
        </ChartContainer>
      </>
    );
  };

  const renderPromotionsTab = (data: AnalyticsData) => {
    const hasData = data.topPromotions.length > 0;

    return (
      <ChartContainer>
        <ChartTitle>Top Performing Promotions</ChartTitle>
        {hasData ? (
          <Table>
            <thead>
              <tr>
                <TableHeader>Promotion Name</TableHeader>
                <TableHeader>Usage</TableHeader>
                <TableHeader>Revenue</TableHeader>
              </tr>
            </thead>
            <tbody>
              {data.topPromotions.map((promotion, index) => (
                <tr key={index}>
                  <TableCell>{promotion.name}</TableCell>
                  <TableCell>{promotion.usage} times</TableCell>
                  <TableCell>€{formatNumber(promotion.revenue)}</TableCell>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState style={{ padding: "2rem", margin: 0 }}>
            <EmptyStateIcon>🎯</EmptyStateIcon>
            <EmptyStateDescription style={{ marginBottom: "1rem" }}>
              No promotion data available yet
            </EmptyStateDescription>
            <CreateButton
              onClick={() =>
                (window.location.href = `/bar/${barId}/promotions`)
              }
            >
              Create Your First Promotion
            </CreateButton>
          </EmptyState>
        )}
      </ChartContainer>
    );
  };

  const renderCustomersTab = (data: AnalyticsData) => {
    const demographics = data.customerDemographics;
    const hasCustomerData =
      demographics.newCustomers > 0 ||
      demographics.returningCustomers > 0 ||
      demographics.vipCustomers > 0;

    return (
      <ChartContainer>
        <ChartTitle>Customer Demographics</ChartTitle>
        {hasCustomerData ? (
          <StatsGrid>
            <StatCard>
              <StatValue>{formatNumber(demographics.newCustomers)}</StatValue>
              <StatLabel>New Customers</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>
                {formatNumber(demographics.returningCustomers)}
              </StatValue>
              <StatLabel>Returning Customers</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{formatNumber(demographics.vipCustomers)}</StatValue>
              <StatLabel>VIP Customers</StatLabel>
            </StatCard>
          </StatsGrid>
        ) : (
          <EmptyState style={{ padding: "2rem", margin: 0 }}>
            <EmptyStateIcon>👥</EmptyStateIcon>
            <EmptyStateDescription style={{ marginBottom: 0 }}>
              Customer data will appear here once customers start engaging with
              your bar
            </EmptyStateDescription>
          </EmptyState>
        )}
      </ChartContainer>
    );
  };

  const renderEmptyStateComponent = () => (
    <EmptyState>
      <EmptyStateIcon>📊</EmptyStateIcon>
      <EmptyStateTitle>No Analytics Data Yet</EmptyStateTitle>
      <EmptyStateDescription>
        Start collecting data by creating promotions, selling VIP passes, and
        engaging with customers. Your analytics will appear here once you have
        activity.
      </EmptyStateDescription>
      <CreateButton
        onClick={() => (window.location.href = `/bar/${barId}/promotions`)}
      >
        🎯 Create Your First Promotion
      </CreateButton>
    </EmptyState>
  );

  if (loading) {
    return (
      <Container>
        <LoadingState>
          <LoadingSpinner />
          <p>Loading analytics data...</p>
        </LoadingState>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <EmptyState>
          <EmptyStateIcon>⚠️</EmptyStateIcon>
          <EmptyStateTitle>Unable to Load Analytics</EmptyStateTitle>
          <EmptyStateDescription>{error}</EmptyStateDescription>
          <CreateButton onClick={fetchAnalyticsData}>🔄 Try Again</CreateButton>
        </EmptyState>
      </Container>
    );
  }

  if (!analyticsData) {
    return renderEmptyStateComponent();
  }

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
        <Tab
          $active={activeTab === "performance"}
          onClick={() => setActiveTab("performance")}
        >
          📊 Performance
        </Tab>
      </Tabs>

      {activeTab === "overview" && renderOverviewTab(analyticsData)}
      {activeTab === "promotions" && renderPromotionsTab(analyticsData)}
      {activeTab === "customers" && renderCustomersTab(analyticsData)}
      {activeTab === "performance" && <PerformanceDashboard barId={barId} />}
    </Container>
  );
};

export default AnalyticsDashboard;
