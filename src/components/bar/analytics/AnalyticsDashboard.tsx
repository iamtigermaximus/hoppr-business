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
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [barId, timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("hoppr_token");
      const response = await fetch(
        `/api/bar/${barId}/analytics?range=${timeRange}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data: AnalyticsData = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const mockData: AnalyticsData = {
    period: timeRange,
    profileViews: 1234,
    vipPassSales: 89,
    revenue: 2225,
    promotionClicks: 456,
    socialCheckins: 342,
    topPromotions: [
      { name: "Friday Night Special", usage: 156, revenue: 780 },
      { name: "VIP Lounge Access", usage: 89, revenue: 890 },
      { name: "Happy Hour", usage: 203, revenue: 455 },
    ],
    customerDemographics: {
      newCustomers: 45,
      returningCustomers: 67,
      vipCustomers: 22,
    },
  };

  const data = analyticsData || mockData;

  if (loading) {
    return <Container>Loading analytics...</Container>;
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
      </Tabs>

      {activeTab === "overview" && (
        <>
          <StatsGrid>
            <StatCard>
              <StatValue>{data.vipPassSales}</StatValue>
              <StatLabel>VIP Pass Sales</StatLabel>
              <StatChange $positive={true}>
                +12% from previous period
              </StatChange>
            </StatCard>

            <StatCard>
              <StatValue>€{data.revenue}</StatValue>
              <StatLabel>Revenue</StatLabel>
              <StatChange $positive={true}>+8% from previous period</StatChange>
            </StatCard>

            <StatCard>
              <StatValue>{data.profileViews}</StatValue>
              <StatLabel>Profile Views</StatLabel>
              <StatChange $positive={true}>
                +15% from previous period
              </StatChange>
            </StatCard>

            <StatCard>
              <StatValue>{data.promotionClicks}</StatValue>
              <StatLabel>Promotion Clicks</StatLabel>
              <StatChange $positive={false}>
                -3% from previous period
              </StatChange>
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
              {data.topPromotions.map((promotion, index) => (
                <tr key={index}>
                  <TableCell>{promotion.name}</TableCell>
                  <TableCell>{promotion.usage} times</TableCell>
                  <TableCell>€{promotion.revenue}</TableCell>
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
              <StatValue>{data.customerDemographics.newCustomers}</StatValue>
              <StatLabel>New Customers</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>
                {data.customerDemographics.returningCustomers}
              </StatValue>
              <StatLabel>Returning Customers</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{data.customerDemographics.vipCustomers}</StatValue>
              <StatLabel>VIP Customers</StatLabel>
            </StatCard>
          </StatsGrid>
        </ChartContainer>
      )}
    </Container>
  );
};

export default AnalyticsDashboard;
