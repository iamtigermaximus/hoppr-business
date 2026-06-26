// src/components/bar/analytics/AnalyticsDashboard.tsx
// Rewritten — all data from BarDailyStats, no VIP/revenue/fake data.

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import FollowersAnalytics from "./FollowersAnalytics";
import PerformanceDashboard from "./PerformanceDashboard";
import CrowdAnalytics from "./CrowdAnalytics";

// ── Styled Components (kept from original) ──────────────────────

const Container = styled.div`
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  @media (max-width: 768px) { padding: 1rem; }
`;

const Title = styled.h1`
  font-size: 2rem; font-weight: 700; margin-bottom: 0.25rem; color: #1f2937;
  @media (max-width: 768px) { font-size: 1.5rem; }
`;

const Subtitle = styled.p`
  color: #6b7280; font-size: 0.9rem; margin-bottom: 1.5rem;
`;

const DateFilter = styled.div`
  display: flex; gap: 1rem; margin-bottom: 1.5rem;
  flex-wrap: wrap; align-items: center;
  @media (max-width: 768px) { flex-direction: column; align-items: stretch; }
`;

const Select = styled.select`
  padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: white;
`;

const StatsGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem; margin-bottom: 1.5rem;
  @media (max-width: 768px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`;

const StatCard = styled.div<{ $isEmpty?: boolean }>`
  background: white; padding: 1.25rem; border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb;
  text-align: center; opacity: ${(p) => (p.$isEmpty ? 0.6 : 1)};
`;

const StatValue = styled.div<{ $isEmpty?: boolean }>`
  font-size: 1.75rem; font-weight: 700;
  color: ${(p) => (p.$isEmpty ? "#9ca3af" : "#1f2937")}; margin-bottom: 0.25rem;
`;

const StatLabel = styled.div` color: #6b7280; font-size: 0.85rem; `;

const ChartContainer = styled.div`
  background: white; padding: 1.5rem; border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb;
  margin-bottom: 1.5rem;
`;

const ChartTitle = styled.h3`
  font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem; color: #1f2937;
`;

const SimpleBarChart = styled.div`
  display: flex; align-items: end; gap: 0.5rem; height: 160px; padding: 0.5rem 0;
`;

const Bar = styled.div<{ $height: number; $isEmpty?: boolean }>`
  flex: 1; background: ${(p) => (p.$isEmpty ? "#e5e7eb" : "#3b82f6")};
  height: ${(p) => Math.max(p.$height, 2)}%;
  border-radius: 0.25rem 0.25rem 0 0; position: relative; min-height: 4px;
`;

const BarValue = styled.div`
  position: absolute; top: -18px; left: 0; right: 0; text-align: center;
  font-size: 0.65rem; color: #6b7280; font-weight: 600;
`;

const BarLabel = styled.div`
  position: absolute; bottom: -20px; left: 0; right: 0; text-align: center;
  font-size: 0.7rem; color: #9ca3af;
`;

const Tabs = styled.div`
  display: flex; gap: 0.5rem; margin-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb; padding-bottom: 0.5rem; overflow-x: auto;
`;

interface TabProps { $active: boolean; }
const Tab = styled.button<TabProps>`
  padding: 0.6rem 1.25rem;
  background: ${(p) => (p.$active ? "#3b82f6" : "transparent")};
  color: ${(p) => (p.$active ? "white" : "#6b7280")};
  border: none; border-radius: 0.375rem; cursor: pointer;
  font-weight: 600; font-size: 0.85rem; white-space: nowrap;
  &:hover { background: ${(p) => (p.$active ? "#2563eb" : "#f3f4f6")}; }
`;

const TableWrapper = styled.div`
  overflow-x: auto; border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const Table = styled.table`
  width: 100%; min-width: 400px; border-collapse: collapse; background: white;
`;

const TableHeader = styled.th`
  background: #f8f9fa; padding: 0.75rem 1rem; text-align: left;
  font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;
`;

const TableCell = styled.td`
  padding: 0.75rem 1rem; border-bottom: 1px solid #e5e7eb; color: #6b7280;
`;

const EmptyState = styled.div`
  text-align: center; padding: 3rem 2rem; background: white;
  border-radius: 0.5rem; border: 1px solid #e5e7eb; margin-bottom: 1.5rem;
`;

const EmptyStateIcon = styled.div` font-size: 3rem; margin-bottom: 0.75rem; `;
const EmptyStateTitle = styled.h3`
  font-size: 1.15rem; font-weight: 600; color: #1f2937; margin-bottom: 0.5rem;
`;
const EmptyStateDesc = styled.p`
  color: #6b7280; margin-bottom: 1rem; max-width: 400px; margin-left: auto; margin-right: auto;
`;
const EmptyButton = styled.button`
  background: #3b82f6; color: white; padding: 0.6rem 1.25rem;
  border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer;
  &:hover { background: #2563eb; }
`;

const LoadingState = styled.div`
  text-align: center; padding: 3rem; color: #6b7280;
`;

const Spinner = styled.div`
  width: 36px; height: 36px; border: 3px solid #f3f4f6; border-top: 3px solid #3b82f6;
  border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;
  @keyframes spin { to { transform: rotate(360deg); } }
`;

// ── Types ──────────────────────────────────────────────────────

interface DailyPoint {
  date: string;
  profileViews: number;
  uniqueVisitors: number;
  promoViews: number;
  promoClicks: number;
  promoRedemptions: number;
  eventViews: number;
  eventJoins: number;
  directionClicks: number;
  shareCount: number;
}

interface AnalyticsData {
  period: string;
  days: number;
  profileViews: number;
  directionClicks: number;
  websiteClicks: number;
  callClicks: number;
  shareCount: number;
  promoViews: number;
  promoClicks: number;
  promoRedemptions: number;
  eventViews: number;
  eventJoins: number;
  uniqueVisitors: number;
  activePromos: number;
  activeEvents: number;
  dailyBreakdown: DailyPoint[];
  hasData: boolean;
}

type TabType = "overview" | "engagement" | "promotions" | "events" | "followers" | "performance" | "crowd";

// ── Helpers ────────────────────────────────────────────────────

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString();
};

const formatDayLabel = (dateStr: string): string => {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
};

// ── Chart helper ───────────────────────────────────────────────

function DailyChart({
  data,
  field,
  color = "#3b82f6",
  label,
}: {
  data: DailyPoint[];
  field: keyof DailyPoint;
  color?: string;
  label: string;
}) {
  const values = data.map((d) => Number(d[field]) || 0);
  const maxVal = Math.max(...values, 1);

  return (
    <ChartContainer>
      <ChartTitle>{label}</ChartTitle>
      {maxVal === 0 ? (
        <EmptyState style={{ padding: "1.5rem", margin: 0 }}>
          <EmptyStateDesc style={{ marginBottom: 0 }}>
            No {label.toLowerCase()} data yet for this period.
          </EmptyStateDesc>
        </EmptyState>
      ) : (
        <SimpleBarChart>
          {data.map((d, i) => {
            const val = Number(d[field]) || 0;
            const height = (val / maxVal) * 100;
            return (
              <Bar key={i} $height={height} style={{ background: color }}>
                {val > 0 && <BarValue>{val}</BarValue>}
                <BarLabel>{formatDayLabel(d.date)}</BarLabel>
              </Bar>
            );
          })}
        </SimpleBarChart>
      )}
    </ChartContainer>
  );
}

// ── Component ──────────────────────────────────────────────────

interface Props { barId: string; }

const AnalyticsDashboard = ({ barId }: Props) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("hoppr_token") : null;

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getToken();
        if (!token) throw new Error("No auth token");
        const res = await fetch(
          `/api/auth/bar/${barId}/analytics?range=${timeRange}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [barId, timeRange]);

  // ── Loading / Error / Empty ──────────────────────────────────

  if (loading) {
    return (
      <Container>
        <LoadingState>
          <Spinner />
          <p>Loading analytics...</p>
        </LoadingState>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <EmptyState>
          <EmptyStateIcon>⚠️</EmptyStateIcon>
          <EmptyStateTitle>Unable to load analytics</EmptyStateTitle>
          <EmptyStateDesc>{error}</EmptyStateDesc>
          <EmptyButton onClick={() => window.location.reload()}>Retry</EmptyButton>
        </EmptyState>
      </Container>
    );
  }

  if (!data) {
    return (
      <Container>
        <EmptyState>
          <EmptyStateIcon>📊</EmptyStateIcon>
          <EmptyStateTitle>No analytics data yet</EmptyStateTitle>
          <EmptyStateDesc>
            Your analytics will appear here once people start discovering your bar on Hoppr.
          </EmptyStateDesc>
        </EmptyState>
      </Container>
    );
  }

  // ── Tab content renderers ────────────────────────────────────

  const renderOverview = () => (
    <>
      <StatsGrid>
        <StatCard $isEmpty={!data.hasData}>
          <StatValue $isEmpty={!data.hasData}>{formatNumber(data.profileViews)}</StatValue>
          <StatLabel>Profile Views</StatLabel>
        </StatCard>
        <StatCard $isEmpty={!data.hasData}>
          <StatValue $isEmpty={!data.hasData}>{formatNumber(data.uniqueVisitors)}</StatValue>
          <StatLabel>Unique Visitors</StatLabel>
        </StatCard>
        <StatCard $isEmpty={!data.hasData}>
          <StatValue $isEmpty={!data.hasData}>{data.activePromos}</StatValue>
          <StatLabel>Active Promos</StatLabel>
        </StatCard>
        <StatCard $isEmpty={!data.hasData}>
          <StatValue $isEmpty={!data.hasData}>{data.activeEvents}</StatValue>
          <StatLabel>Upcoming Events</StatLabel>
        </StatCard>
      </StatsGrid>

      <DailyChart data={data.dailyBreakdown} field="profileViews" label="Profile Views per Day" />
      <DailyChart data={data.dailyBreakdown} field="uniqueVisitors" color="#10b981" label="Unique Visitors per Day" />
    </>
  );

  const renderEngagement = () => (
    <>
      <StatsGrid>
        <StatCard $isEmpty={!data.hasData}>
          <StatValue $isEmpty={!data.hasData}>{formatNumber(data.directionClicks)}</StatValue>
          <StatLabel>Directions</StatLabel>
        </StatCard>
        <StatCard $isEmpty={!data.hasData}>
          <StatValue $isEmpty={!data.hasData}>{formatNumber(data.websiteClicks)}</StatValue>
          <StatLabel>Website Visits</StatLabel>
        </StatCard>
        <StatCard $isEmpty={!data.hasData}>
          <StatValue $isEmpty={!data.hasData}>{formatNumber(data.callClicks)}</StatValue>
          <StatLabel>Phone Calls</StatLabel>
        </StatCard>
        <StatCard $isEmpty={!data.hasData}>
          <StatValue $isEmpty={!data.hasData}>{formatNumber(data.shareCount)}</StatValue>
          <StatLabel>Shares</StatLabel>
        </StatCard>
      </StatsGrid>

      <DailyChart data={data.dailyBreakdown} field="directionClicks" color="#f59e0b" label="Directions per Day" />
      <DailyChart data={data.dailyBreakdown} field="shareCount" color="#8b5cf6" label="Shares per Day" />
    </>
  );

  const renderPromotions = () => (
    <>
      <StatsGrid>
        <StatCard $isEmpty={!data.hasData}>
          <StatValue $isEmpty={!data.hasData}>{formatNumber(data.promoViews)}</StatValue>
          <StatLabel>Promo Views</StatLabel>
        </StatCard>
        <StatCard $isEmpty={!data.hasData}>
          <StatValue $isEmpty={!data.hasData}>{formatNumber(data.promoClicks)}</StatValue>
          <StatLabel>Promo Clicks</StatLabel>
        </StatCard>
        <StatCard $isEmpty={!data.hasData}>
          <StatValue $isEmpty={!data.hasData}>{formatNumber(data.promoRedemptions)}</StatValue>
          <StatLabel>Redemptions</StatLabel>
        </StatCard>
        <StatCard $isEmpty={!data.hasData}>
          <StatValue $isEmpty={!data.hasData}>{data.activePromos}</StatValue>
          <StatLabel>Active Promos</StatLabel>
        </StatCard>
      </StatsGrid>

      <DailyChart data={data.dailyBreakdown} field="promoViews" color="#3b82f6" label="Promo Views per Day" />
      <DailyChart data={data.dailyBreakdown} field="promoRedemptions" color="#10b981" label="Promo Redemptions per Day" />

      {!data.hasData && (
        <EmptyState>
          <EmptyStateIcon>🎯</EmptyStateIcon>
          <EmptyStateTitle>No promotion data yet</EmptyStateTitle>
          <EmptyStateDesc>Create your first promotion to start tracking performance.</EmptyStateDesc>
          <EmptyButton onClick={() => router.push(`/bar/${barId}/promotions`)}>
            Create Promotion
          </EmptyButton>
        </EmptyState>
      )}
    </>
  );

  const renderEvents = () => (
    <>
      <StatsGrid>
        <StatCard $isEmpty={!data.hasData}>
          <StatValue $isEmpty={!data.hasData}>{formatNumber(data.eventViews)}</StatValue>
          <StatLabel>Event Views</StatLabel>
        </StatCard>
        <StatCard $isEmpty={!data.hasData}>
          <StatValue $isEmpty={!data.hasData}>{formatNumber(data.eventJoins)}</StatValue>
          <StatLabel>Event Joins</StatLabel>
        </StatCard>
        <StatCard $isEmpty={!data.hasData}>
          <StatValue $isEmpty={!data.hasData}>{data.activeEvents}</StatValue>
          <StatLabel>Upcoming Events</StatLabel>
        </StatCard>
        <StatCard $isEmpty={!data.hasData}>
          <StatValue $isEmpty={!data.hasData}>
            {data.eventViews > 0 ? Math.round((data.eventJoins / data.eventViews) * 100) + "%" : "—"}
          </StatValue>
          <StatLabel>Join Rate</StatLabel>
        </StatCard>
      </StatsGrid>

      <DailyChart data={data.dailyBreakdown} field="eventViews" color="#7c3aed" label="Event Views per Day" />
      <DailyChart data={data.dailyBreakdown} field="eventJoins" color="#10b981" label="Event Joins per Day" />

      {!data.hasData && (
        <EmptyState>
          <EmptyStateIcon>📅</EmptyStateIcon>
          <EmptyStateTitle>No event data yet</EmptyStateTitle>
          <EmptyStateDesc>Schedule your first event to start tracking attendance.</EmptyStateDesc>
          <EmptyButton onClick={() => router.push(`/bar/${barId}/events`)}>
            Create Event
          </EmptyButton>
        </EmptyState>
      )}
    </>
  );

  // ── Render ───────────────────────────────────────────────────

  return (
    <Container>
      <Title>Analytics</Title>
      <Subtitle>
        {data.hasData
          ? `Showing data for the last ${data.days} days`
          : "No data yet — analytics will populate once people discover your bar"}
      </Subtitle>

      <DateFilter>
        <label>
          Time Range:{" "}
          <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value as "7d" | "30d" | "90d")}>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </Select>
        </label>
      </DateFilter>

      <Tabs>
        {(["overview", "engagement", "promotions", "events", "followers", "performance", "crowd"] as TabType[]).map(
          (t) => (
            <Tab key={t} $active={activeTab === t} onClick={() => setActiveTab(t)}>
              {t === "overview" && "Overview"}
              {t === "engagement" && "Engagement"}
              {t === "promotions" && "Promotions"}
              {t === "events" && "Events"}
              {t === "followers" && "Followers"}
              {t === "performance" && "Performance"}
              {t === "crowd" && "Crowd"}
            </Tab>
          ),
        )}
      </Tabs>

      {activeTab === "overview" && renderOverview()}
      {activeTab === "engagement" && renderEngagement()}
      {activeTab === "promotions" && renderPromotions()}
      {activeTab === "events" && renderEvents()}
      {activeTab === "followers" && <FollowersAnalytics barId={barId} />}
      {activeTab === "performance" && <PerformanceDashboard barId={barId} />}
      {activeTab === "crowd" && <CrowdAnalytics barId={barId} />}
    </Container>
  );
};

export default AnalyticsDashboard;
