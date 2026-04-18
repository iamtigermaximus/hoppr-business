// src/components/bar/analytics/PerformanceDashboard.tsx

"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";

const Container = styled.div`
  padding: 1rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: white;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
`;

const Section = styled.div`
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  margin-bottom: 1.5rem;
  overflow: hidden;
`;

const SectionHeader = styled.div`
  background: #f8f9fa;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 600;
  font-size: 1rem;
  color: #1f2937;
`;

const SectionContent = styled.div`
  padding: 1rem;
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  padding: 0.75rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
`;

const Td = styled.td`
  padding: 0.75rem;
  font-size: 0.875rem;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
`;

const Badge = styled.span<{ $status: string }>`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
  font-weight: 600;
  background: ${(props) =>
    props.$status === "active"
      ? "#dcfce7"
      : props.$status === "pending"
        ? "#fef3c7"
        : "#fee2e2"};
  color: ${(props) =>
    props.$status === "active"
      ? "#166534"
      : props.$status === "pending"
        ? "#92400e"
        : "#dc2626"};
`;

const ProgressBar = styled.div<{ $percentage: number }>`
  width: ${(props) => props.$percentage}%;
  height: 6px;
  background: #3b82f6;
  border-radius: 3px;
`;

const InsightCard = styled.div`
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1rem;
  font-size: 0.875rem;
  color: #1e40af;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  color: #6b7280;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6b7280;
`;

interface BarStats {
  profileViews: number;
  directionClicks: number;
  callClicks: number;
  websiteClicks: number;
  shareCount: number;
}

interface TopUser {
  userId: string;
  usageCount: number;
  firstUsedAt: string;
  lastUsedAt: string;
}

interface PromotionStats {
  id: string;
  title: string;
  type: string;
  discount: number | null;
  isActive: boolean;
  isApproved: boolean;
  startDate: string;
  endDate: string;
  totalCardViews: number;
  totalRedemptions: number;
  uniqueUsers: number;
  totalUsageCount: number;
  averageUsesPerUser: number;
  conversionRate: number;
  topUsers: TopUser[];
}

interface ApiResponse {
  success: boolean;
  barStats: BarStats;
  promotions: PromotionStats[];
  totalScans: number;
}

interface PerformanceDashboardProps {
  barId: string;
}

const PerformanceDashboard = ({ barId }: PerformanceDashboardProps) => {
  const [loading, setLoading] = useState(true);
  const [barStats, setBarStats] = useState<BarStats | null>(null);
  const [promotions, setPromotions] = useState<PromotionStats[]>([]);
  const [totalScans, setTotalScans] = useState(0);

  useEffect(() => {
    fetchData();
  }, [barId]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("hoppr_token");
      const response = await fetch(`/api/auth/bar/${barId}/promotions/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: ApiResponse = await response.json();

      if (data.success) {
        setBarStats(data.barStats);
        setPromotions(data.promotions);
        setTotalScans(data.totalScans);
      }
    } catch (error) {
      console.error("Failed to fetch performance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (
    promo: PromotionStats,
  ): "active" | "pending" | "inactive" => {
    if (!promo.isApproved) return "pending";
    if (!promo.isActive) return "inactive";
    return "active";
  };

  if (loading) {
    return <LoadingState>Loading performance data...</LoadingState>;
  }

  const totalCardViews = promotions.reduce(
    (sum, p) => sum + p.totalCardViews,
    0,
  );
  const totalRedemptions = promotions.reduce(
    (sum, p) => sum + p.totalRedemptions,
    0,
  );
  const totalUniqueUsers = promotions.reduce(
    (sum, p) => sum + p.uniqueUsers,
    0,
  );
  const overallConversion =
    totalCardViews > 0 ? (totalRedemptions / totalCardViews) * 100 : 0;

  if (promotions.length === 0) {
    return (
      <Container>
        <EmptyState>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎯</div>
          <p>No promotions yet</p>
          <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
            Create your first promotion to start tracking performance
          </p>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      {/* Overview Stats */}
      <StatsGrid>
        <StatCard>
          <StatValue>{barStats?.profileViews?.toLocaleString() || 0}</StatValue>
          <StatLabel>Profile Views</StatLabel>
        </StatCard>

        <StatCard>
          <StatValue>{totalScans.toLocaleString()}</StatValue>
          <StatLabel>Total VIP Scans</StatLabel>
        </StatCard>

        <StatCard>
          <StatValue>{totalCardViews.toLocaleString()}</StatValue>
          <StatLabel>Digital Card Views</StatLabel>
        </StatCard>

        <StatCard>
          <StatValue>{totalRedemptions.toLocaleString()}</StatValue>
          <StatLabel>Redemptions</StatLabel>
        </StatCard>

        <StatCard>
          <StatValue>{overallConversion.toFixed(1)}%</StatValue>
          <StatLabel>Conversion Rate</StatLabel>
        </StatCard>

        <StatCard>
          <StatValue>{totalUniqueUsers.toLocaleString()}</StatValue>
          <StatLabel>Unique Customers</StatLabel>
        </StatCard>
      </StatsGrid>

      {/* Promotions Table */}
      <Section>
        <SectionHeader>📊 Promotion Performance</SectionHeader>
        <SectionContent>
          <Table>
            <thead>
              <tr>
                <Th>Promotion</Th>
                <Th>Status</Th>
                <Th>Card Views</Th>
                <Th>Redemptions</Th>
                <Th>Conversion</Th>
                <Th>Unique Users</Th>
                <Th>Avg Uses/User</Th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((promo) => {
                const status = getStatus(promo);
                return (
                  <tr key={promo.id}>
                    <Td>
                      <strong>{promo.title}</strong>
                      {promo.discount && (
                        <div style={{ fontSize: "0.7rem", color: "#10b981" }}>
                          {promo.discount}% OFF
                        </div>
                      )}
                    </Td>
                    <Td>
                      <Badge $status={status}>
                        {status === "active"
                          ? "Active"
                          : status === "pending"
                            ? "Pending"
                            : "Inactive"}
                      </Badge>
                    </Td>
                    <Td>{promo.totalCardViews.toLocaleString()}</Td>
                    <Td>
                      <strong>{promo.totalRedemptions.toLocaleString()}</strong>
                    </Td>
                    <Td>
                      {promo.conversionRate.toFixed(1)}%
                      <ProgressBar $percentage={promo.conversionRate} />
                    </Td>
                    <Td>{promo.uniqueUsers.toLocaleString()}</Td>
                    <Td>{promo.averageUsesPerUser.toFixed(1)}x</Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </SectionContent>
      </Section>

      {/* Top Customers Section */}
      <Section>
        <SectionHeader>👥 Most Loyal Customers</SectionHeader>
        <SectionContent>
          <Table>
            <thead>
              <tr>
                <Th>Customer ID</Th>
                <Th>Times Used</Th>
                <Th>First Used</Th>
                <Th>Last Used</Th>
              </tr>
            </thead>
            <tbody>
              {promotions.flatMap((promo) =>
                promo.topUsers.map((user, idx) => (
                  <tr key={`${promo.id}-${idx}`}>
                    <Td>
                      {user.userId.slice(0, 8)}...
                      <div style={{ fontSize: "0.7rem", color: "#9ca3af" }}>
                        for {promo.title}
                      </div>
                    </Td>
                    <Td>
                      <strong>{user.usageCount} times</strong>
                    </Td>
                    <Td>{new Date(user.firstUsedAt).toLocaleDateString()}</Td>
                    <Td>{new Date(user.lastUsedAt).toLocaleDateString()}</Td>
                  </tr>
                )),
              )}
            </tbody>
          </Table>
        </SectionContent>
      </Section>

      {/* Insights */}
      <InsightCard>
        💡 <strong>Key Insights:</strong>
        <ul
          style={{
            marginTop: "0.5rem",
            marginBottom: 0,
            paddingLeft: "1.25rem",
          }}
        >
          <li>
            Overall conversion rate:{" "}
            <strong>{overallConversion.toFixed(1)}%</strong> of card views
            become redemptions
          </li>
          <li>
            Average customer uses promotions{" "}
            <strong>
              {(totalRedemptions / totalUniqueUsers).toFixed(1)} times
            </strong>
          </li>
          {promotions[0] && (
            <li>
              Best performing: <strong>{promotions[0].title}</strong> with{" "}
              {promotions[0].totalRedemptions} redemptions
            </li>
          )}
        </ul>
      </InsightCard>
    </Container>
  );
};

export default PerformanceDashboard;
