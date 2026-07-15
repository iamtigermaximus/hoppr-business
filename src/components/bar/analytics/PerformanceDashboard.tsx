// src/components/bar/analytics/PerformanceDashboard.tsx

"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import { Download } from "lucide-react";
import { downloadCSV } from "@/lib/csv-export";
import { SkeletonBox, SkeletonCard } from "@/components/ui/Skeleton";

const Container = styled.div`
  padding: 1rem;

  @media (max-width: 480px) {
    padding: 0.5rem;
  }
`;

const DateFilter = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  align-items: center;
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
  gap: 1rem;
  margin-bottom: 2rem;

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
`;

const StatCard = styled.div`
  background: white;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  text-align: center;

  @media (max-width: 480px) {
    padding: 0.75rem 0.5rem;
  }
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }

  @media (max-width: 480px) {
    font-size: 1.25rem;
  }
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;

  @media (max-width: 480px) {
    font-size: 0.65rem;
  }
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

  @media (max-width: 480px) {
    padding: 0.75rem;
    font-size: 0.875rem;
  }
`;

const SectionContent = styled.div`
  padding: 1rem;
  overflow-x: auto;

  @media (max-width: 480px) {
    padding: 0.5rem;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
`;

const Th = styled.th`
  padding: 0.75rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;

  @media (max-width: 480px) {
    padding: 0.5rem;
    font-size: 0.65rem;
  }
`;

const Td = styled.td`
  padding: 0.75rem;
  font-size: 0.875rem;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;

  @media (max-width: 480px) {
    padding: 0.5rem;
    font-size: 0.75rem;
  }
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

  @media (max-width: 480px) {
    padding: 1.5rem 1rem;
  }
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6b7280;

  @media (max-width: 480px) {
    padding: 1rem;
    font-size: 0.875rem;
  }
`;

const ExportButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 0.3rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  &:hover { background: #059669; }
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
  totalClicks: number;
  totalRedemptions: number;
  uniqueUsers: number;
  uniqueEventUsers: number;
  totalUsageCount: number;
  averageUsesPerUser: number;
  conversionRate: number;
  topUsers: TopUser[];
}

interface ApiResponse {
  success: boolean;
  period: string;
  days: number;
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
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("hoppr_token");
        const response = await fetch(
          `/api/auth/bar/${barId}/promotions/stats?range=${timeRange}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data: ApiResponse = await response.json();

        if (!cancelled && data.success) {
          setBarStats(data.barStats);
          setPromotions(data.promotions);
          setTotalScans(data.totalScans);
        }
      } catch (error) {
        console.error("Failed to fetch performance data:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [barId, timeRange]);

  const handleExport = () => {
    if (promotions.length === 0) return;
    downloadCSV(`hoppr-performance-${timeRange}`, [
      {
        name: "Summary",
        headers: ["Metric", "Value"],
        rows: [
          ["Profile Views", barStats?.profileViews || 0],
          ["Total VIP Scans", totalScans],
          ["Total Card Views", totalCardViews],
          ["Total Redemptions", totalRedemptions],
          ["Overall Conversion Rate", overallConversion.toFixed(1) + "%"],
          ["Unique Customers", totalUniqueUsers],
        ],
      },
      {
        name: "Promotion Performance",
        headers: ["Promotion", "Status", "Card Views", "Clicks", "Redemptions", "Conversion Rate", "Unique Users", "Avg Uses/User"],
        rows: promotions.map((p) => [
          p.title,
          getStatus(p),
          p.totalCardViews,
          p.totalClicks,
          p.totalRedemptions,
          p.conversionRate.toFixed(1) + "%",
          p.uniqueUsers,
          p.averageUsesPerUser.toFixed(1) + "x",
        ]),
      },
      {
        name: "Top Customers",
        headers: ["Customer ID", "Times Used", "First Used", "Last Used", "For Promotion"],
        rows: promotions.flatMap((p) =>
          p.topUsers.map((u) => [
            u.userId,
            u.usageCount,
            new Date(u.firstUsedAt).toLocaleDateString("en-GB"),
            new Date(u.lastUsedAt).toLocaleDateString("en-GB"),
            p.title,
          ])
        ),
      },
    ]);
  };

  const getStatus = (
    promo: PromotionStats,
  ): "active" | "pending" | "inactive" => {
    if (!promo.isApproved) return "pending";
    if (!promo.isActive) return "inactive";
    return "active";
  };

  if (loading) {
    return (
      <Container>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", padding: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i}>
                <SkeletonBox $width="50%" $height="0.75rem" />
                <SkeletonBox $width="30%" $height="1.25rem" />
              </SkeletonCard>
            ))}
          </div>
          <SkeletonCard>
            <SkeletonBox $width="40%" $height="0.75rem" />
            <SkeletonBox $width="100%" $height="200px" $radius="0.5rem" />
          </SkeletonCard>
        </div>
      </Container>
    );
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
      <DateFilter>
        <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value as "7d" | "30d" | "90d")}>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </Select>
        <ExportButton onClick={handleExport}>
          <Download size={13} />
          Export CSV
        </ExportButton>
      </DateFilter>

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
