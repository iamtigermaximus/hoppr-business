// src/components/bar/analytics/FollowersAnalytics.tsx

"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import { SkeletonBox, SkeletonCard } from "@/components/ui/Skeleton";

// ── Styled Components ──────────────────────────────────────────

const Container = styled.div`
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;

  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  font-size: 0.875rem;
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
  margin-bottom: 0.25rem;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const StatLabel = styled.div`
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
`;

const StatSubtext = styled.div<{ $positive?: boolean }>`
  font-size: 0.75rem;
  color: ${({ $positive }) => ($positive ? "#10b981" : "#6b7280")};
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
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #1f2937;
`;

const BarChartWrapper = styled.div`
  display: flex;
  align-items: end;
  gap: 4px;
  height: 180px;
  padding: 0.5rem 0;

  @media (max-width: 768px) {
    gap: 2px;
  }
`;

const BarColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  height: 100%;
  justify-content: end;
`;

const Bar = styled.div<{ $height: number; $isEmpty: boolean }>`
  width: 100%;
  max-width: 32px;
  background: ${({ $isEmpty }) => ($isEmpty ? "#e5e7eb" : "#7c3aed")};
  height: ${({ $height }) => Math.max($height, 2)}%;
  border-radius: 4px 4px 0 0;
  transition: height 0.3s;

  @media (max-width: 768px) {
    max-width: 24px;
  }
`;

const BarDate = styled.div`
  font-size: 0.6rem;
  color: #9ca3af;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: 768px) {
    font-size: 0.5rem;
  }
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Table = styled.table`
  width: 100%;
  min-width: 400px;
  border-collapse: collapse;
  background: white;
`;

const TableHeader = styled.th`
  background: #f8f9fa;
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;
`;

const TableCell = styled.td`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  color: #6b7280;
  font-size: 0.875rem;
`;

const UserCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const UserAvatar = styled.div<{ $src?: string | null }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ $src }) =>
    $src ? `url(${$src}) center/cover` : "#7c3aed15"};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7c3aed;
  font-weight: 700;
  font-size: 0.75rem;
  overflow: hidden;
  flex-shrink: 0;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  color: #6b7280;
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 0.75rem;
`;

const LoadingContainer = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #7c3aed;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorState = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  color: #ef4444;
`;

const RetryButton = styled.button`
  margin-top: 1rem;
  padding: 0.5rem 1.5rem;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #6d28d9;
  }
`;

// ── Types ───────────────────────────────────────────────────────

interface FollowerRecord {
  id: string;
  userId: string;
  userName: string;
  userImage: string | null;
  followedAt: string;
}

interface GrowthPoint {
  date: string;
  count: number;
  total: number;
}

interface FollowerData {
  totalFollowers: number;
  newFollowers: number;
  retentionRate: number;
  growthData: GrowthPoint[];
  recentFollowers: FollowerRecord[];
}

// ── Component ───────────────────────────────────────────────────

interface FollowersAnalyticsProps {
  barId: string;
}

export default function FollowersAnalytics({ barId }: FollowersAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const [data, setData] = useState<FollowerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getToken = (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("hoppr_token");
    }
    return null;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) throw new Error("No authentication token found");

      const res = await fetch(
        `/api/auth/bar/${barId}/followers?range=${timeRange}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

      const json: FollowerData = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [barId, timeRange]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatTimeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <Container>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", padding: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            {Array.from({ length: 3 }).map((_, i) => (
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

  if (error) {
    return (
      <ErrorState>
        <p>⚠️ {error}</p>
        <RetryButton onClick={fetchData}>Retry</RetryButton>
      </ErrorState>
    );
  }

  if (!data) {
    return (
      <EmptyState>
        <EmptyIcon>👥</EmptyIcon>
        <p>No follower data available yet.</p>
      </EmptyState>
    );
  }

  const maxGrowth = Math.max(...data.growthData.map((g) => g.count), 1);

  return (
    <Container>
      <Header>
        <Title>Follower Analytics</Title>
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
      </Header>

      {/* Stats cards */}
      <StatsGrid>
        <StatCard>
          <StatValue>{data.totalFollowers}</StatValue>
          <StatLabel>Total Followers</StatLabel>
          <StatSubtext>All-time</StatSubtext>
        </StatCard>
        <StatCard>
          <StatValue>+{data.newFollowers}</StatValue>
          <StatLabel>New Followers</StatLabel>
          <StatSubtext $positive>
            Last {timeRange === "7d" ? "7" : timeRange === "30d" ? "30" : "90"} days
          </StatSubtext>
        </StatCard>
        <StatCard>
          <StatValue>{data.retentionRate}%</StatValue>
          <StatLabel>Retention Rate</StatLabel>
          <StatSubtext>Following &gt; 30 days</StatSubtext>
        </StatCard>
      </StatsGrid>

      {/* Growth chart */}
      <ChartContainer>
        <ChartTitle>Follower Growth</ChartTitle>
        {data.growthData.length > 0 ? (
          <BarChartWrapper>
            {data.growthData.map((point, i) => (
              <BarColumn key={i}>
                <Bar
                  $height={(point.count / maxGrowth) * 100}
                  $isEmpty={point.count === 0}
                  title={`${point.date}: +${point.count} (${point.total} total)`}
                />
                {/* Show every Nth label to avoid crowding */}
                {data.growthData.length <= 14 ||
                i % Math.ceil(data.growthData.length / 10) === 0 ? (
                  <BarDate>
                    {new Date(point.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </BarDate>
                ) : null}
              </BarColumn>
            ))}
          </BarChartWrapper>
        ) : (
          <EmptyState style={{ padding: "2rem" }}>
            <p>No growth data for this period.</p>
          </EmptyState>
        )}
      </ChartContainer>

      {/* Recent followers */}
      <ChartContainer>
        <ChartTitle>Recent Followers</ChartTitle>
        {data.recentFollowers.length > 0 ? (
          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <TableHeader>User</TableHeader>
                  <TableHeader>Followed</TableHeader>
                </tr>
              </thead>
              <tbody>
                {data.recentFollowers.map((f) => (
                  <tr key={f.id}>
                    <TableCell>
                      <UserCell>
                        <UserAvatar $src={f.userImage}>
                          {!f.userImage &&
                            f.userName.charAt(0).toUpperCase()}
                        </UserAvatar>
                        {f.userName}
                      </UserCell>
                    </TableCell>
                    <TableCell>{formatTimeAgo(f.followedAt)}</TableCell>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrapper>
        ) : (
          <EmptyState style={{ padding: "2rem" }}>
            <EmptyIcon>👤</EmptyIcon>
            <p>No followers yet. Share your bar to attract followers!</p>
          </EmptyState>
        )}
      </ChartContainer>
    </Container>
  );
}
