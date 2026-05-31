// src/components/bar/analytics/CrowdAnalytics.tsx

"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";

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

const LevelButtonBar = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const LevelButton = styled.button<{ $color: string; $active: boolean }>`
  flex: 1;
  min-width: 100px;
  padding: 1rem 0.75rem;
  border: 2px solid ${({ $active, $color }) => ($active ? $color : "#e5e7eb")};
  border-radius: 0.75rem;
  background: ${({ $active, $color }) => ($active ? `${$color}15` : "white")};
  color: ${({ $color }) => $color};
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;

  &:hover {
    border-color: ${({ $color }) => $color};
    background: ${({ $color }) => `${$color}08`};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const LevelDot = styled.span<{ $color: string; $pulse?: boolean }>`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  ${({ $pulse }) =>
    $pulse
      ? "animation: pulse 1.5s ease-in-out infinite;"
      : ""}

  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
    50% { box-shadow: 0 0 0 8px rgba(220, 38, 38, 0); }
  }
`;

const LevelPercent = styled.span`
  font-size: 0.65rem;
  color: #9ca3af;
  font-weight: 400;
`;

const CurrentCard = styled.div<{ $color: string }>`
  background: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 2px solid ${({ $color }) => $color}44;
  margin-bottom: 2rem;
  text-align: center;
`;

const CurrentLabel = styled.div`
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
`;

const CurrentLevel = styled.div<{ $color: string }>`
  font-size: 2rem;
  font-weight: 700;
  color: ${({ $color }) => $color};
`;

const CurrentMeta = styled.div`
  color: #9ca3af;
  font-size: 0.8rem;
  margin-top: 0.5rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  background: white;
  padding: 1.25rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;

  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const StatLabel = styled.div`
  color: #6b7280;
  font-size: 0.875rem;
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
  height: 160px;
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

const Bar = styled.div<{ $height: number; $color: string }>`
  width: 100%;
  max-width: 28px;
  background: ${({ $color }) => $color};
  height: ${({ $height }) => Math.max($height, 3)}%;
  border-radius: 4px 4px 0 0;
  transition: height 0.3s;

  @media (max-width: 768px) {
    max-width: 20px;
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

const LevelBadge = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 20px;
  background: ${({ $color }) => `${$color}15`};
  color: ${({ $color }) => $color};
  font-weight: 600;
  font-size: 0.75rem;
`;

const LevelBadgeDot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`;

const SubmittedToast = styled.div`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: #10b981;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  animation: fadeInOut 2.5s ease-in-out forwards;

  @keyframes fadeInOut {
    0% { opacity: 0; transform: translateY(10px); }
    15% { opacity: 1; transform: translateY(0); }
    85% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-10px); }
  }
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

// ── Config ──────────────────────────────────────────────────────

const levelConfig: Record<
  string,
  { color: string; label: string; percent: string; pulse?: boolean }
> = {
  QUIET: {
    color: "#10b981",
    label: "Quiet",
    percent: "0-30%",
  },
  GETTING_BUSY: {
    color: "#f59e0b",
    label: "Getting Busy",
    percent: "30-50%",
  },
  BUSY: { color: "#f97316", label: "Busy", percent: "50-80%" },
  PACKED: { color: "#ef4444", label: "Packed", percent: "80-100%" },
  AT_CAPACITY: {
    color: "#dc2626",
    label: "At Capacity",
    percent: "100%+",
    pulse: true,
  },
};

const levelOrder = ["QUIET", "GETTING_BUSY", "BUSY", "PACKED", "AT_CAPACITY"];

// Map level to numeric score for averaging
const levelScore: Record<string, number> = {
  QUIET: 1,
  GETTING_BUSY: 2,
  BUSY: 3,
  PACKED: 4,
  AT_CAPACITY: 5,
};

function scoreToLevel(avg: number): string {
  if (avg <= 1.5) return "QUIET";
  if (avg <= 2.5) return "GETTING_BUSY";
  if (avg <= 3.5) return "BUSY";
  if (avg <= 4.5) return "PACKED";
  return "AT_CAPACITY";
}

// ── Types ───────────────────────────────────────────────────────

interface CrowdReportRecord {
  id: string;
  level: string;
  reportedAt: string;
  reportedBy: string;
}

interface CrowdData {
  current: {
    id: string;
    level: string;
    reportedAt: string;
    expiresAt: string;
    reportedBy: string;
  } | null;
  history: CrowdReportRecord[];
  reportsToday: number;
}

// ── Component ───────────────────────────────────────────────────

interface CrowdAnalyticsProps {
  barId: string;
}

export default function CrowdAnalytics({ barId }: CrowdAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d");
  const [data, setData] = useState<CrowdData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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
        `/api/auth/bar/${barId}/crowd-report?range=${timeRange}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

      const json: CrowdData = await res.json();
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

  const submitLevel = async (level: string) => {
    try {
      setSubmitting(true);
      const token = getToken();
      if (!token) throw new Error("No authentication token");

      const res = await fetch(`/api/auth/bar/${barId}/crowd-report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ level }),
      });

      if (!res.ok) throw new Error(`Failed: ${res.status}`);

      setToast(`Crowd level set to "${levelConfig[level].label}"`);
      setTimeout(() => setToast(null), 2500);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatTimeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Compute peak hour from history
  const peakHour = (() => {
    if (!data?.history.length) return null;
    const hourCounts = new Map<number, number>();
    for (const r of data.history) {
      const h = new Date(r.reportedAt).getHours();
      hourCounts.set(h, (hourCounts.get(h) || 0) + 1);
    }
    let maxH = 0;
    let maxC = 0;
    for (const [h, c] of hourCounts) {
      if (c > maxC) {
        maxC = c;
        maxH = h;
      }
    }
    return maxH;
  })();

  // Average crowd score from history
  const avgScore = (() => {
    if (!data?.history.length) return null;
    const total = data.history.reduce(
      (sum, r) => sum + (levelScore[r.level] || 0),
      0,
    );
    return total / data.history.length;
  })();

  // Bucket history by day for chart
  const dailyBuckets = (() => {
    if (!data?.history.length) return [];
    const buckets = new Map<
      string,
      { date: string; avgScore: number; count: number }
    >();

    for (const r of data.history) {
      const dateKey = new Date(r.reportedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const existing = buckets.get(dateKey);
      const score = levelScore[r.level] || 0;
      if (existing) {
        existing.avgScore =
          (existing.avgScore * existing.count + score) / (existing.count + 1);
        existing.count++;
      } else {
        buckets.set(dateKey, { date: dateKey, avgScore: score, count: 1 });
      }
    }

    return Array.from(buckets.values()).reverse().slice(0, 30);
  })();

  const maxChartHeight = 5; // max possible score

  if (loading) {
    return (
      <LoadingContainer>
        <Spinner />
        <p>Loading crowd data...</p>
      </LoadingContainer>
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

  return (
    <Container>
      {toast && <SubmittedToast>{toast}</SubmittedToast>}

      <Header>
        <Title>Crowd Report</Title>
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

      {/* Self-report buttons */}
      <LevelButtonBar>
        {levelOrder.map((level) => {
          const cfg = levelConfig[level];
          const isActive = data?.current?.level === level;
          return (
            <LevelButton
              key={level}
              $color={cfg.color}
              $active={!!isActive}
              disabled={submitting}
              onClick={() => submitLevel(level)}
            >
              <LevelDot $color={cfg.color} $pulse={cfg.pulse} />
              {cfg.label}
              <LevelPercent>{cfg.percent}</LevelPercent>
            </LevelButton>
          );
        })}
      </LevelButtonBar>

      {/* Current crowd status */}
      {data?.current ? (
        <CurrentCard $color={levelConfig[data.current.level]?.color || "#6b7280"}>
          <CurrentLabel>Current Crowd Level</CurrentLabel>
          <CurrentLevel
            $color={levelConfig[data.current.level]?.color || "#6b7280"}
          >
            {levelConfig[data.current.level]?.label || data.current.level}
          </CurrentLevel>
          <CurrentMeta>
            Reported {formatTimeAgo(data.current.reportedAt)} by{" "}
            {data.current.reportedBy}
            {" · "}Expires in{" "}
            {(() => {
              const mins = Math.floor(
                (new Date(data.current.expiresAt).getTime() - Date.now()) /
                  60000,
              );
              return mins > 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
            })()}
          </CurrentMeta>
        </CurrentCard>
      ) : (
        <CurrentCard $color="#d1d5db">
          <CurrentLabel>Current Crowd Level</CurrentLabel>
          <CurrentLevel $color="#6b7280">No report</CurrentLevel>
          <CurrentMeta>
            Tap a level above to report how busy your bar is right now.
          </CurrentMeta>
        </CurrentCard>
      )}

      {/* Stats cards */}
      <StatsGrid>
        <StatCard>
          <StatValue>{data?.reportsToday ?? 0}</StatValue>
          <StatLabel>Reports Today</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>
            {peakHour !== null
              ? `${String(peakHour).padStart(2, "0")}:00`
              : "—"}
          </StatValue>
          <StatLabel>Peak Hour</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>
            {avgScore !== null
              ? levelConfig[scoreToLevel(avgScore)]?.label || "—"
              : "—"}
          </StatValue>
          <StatLabel>Average Crowd</StatLabel>
        </StatCard>
      </StatsGrid>

      {/* Crowd history chart */}
      <ChartContainer>
        <ChartTitle>Crowd History</ChartTitle>
        {dailyBuckets.length > 0 ? (
          <BarChartWrapper>
            {dailyBuckets.map((bucket, i) => {
              const cfg =
                levelConfig[scoreToLevel(bucket.avgScore)] || levelConfig.QUIET;
              return (
                <BarColumn key={i}>
                  <Bar
                    $height={(bucket.avgScore / maxChartHeight) * 100}
                    $color={cfg.color}
                    title={`${bucket.date}: ${cfg.label} (${bucket.count} reports)`}
                  />
                  {dailyBuckets.length <= 14 ||
                  i % Math.ceil(dailyBuckets.length / 10) === 0 ? (
                    <BarDate>
                      {bucket.date}
                    </BarDate>
                  ) : null}
                </BarColumn>
              );
            })}
          </BarChartWrapper>
        ) : (
          <EmptyState style={{ padding: "2rem" }}>
            <p>No crowd data for this period.</p>
          </EmptyState>
        )}
      </ChartContainer>

      {/* History table */}
      <ChartContainer>
        <ChartTitle>Recent Reports</ChartTitle>
        {data?.history && data.history.length > 0 ? (
          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <TableHeader>Time</TableHeader>
                  <TableHeader>Level</TableHeader>
                  <TableHeader>Reported By</TableHeader>
                </tr>
              </thead>
              <tbody>
                {data.history.slice(0, 50).map((r) => {
                  const cfg = levelConfig[r.level] || levelConfig.QUIET;
                  return (
                    <tr key={r.id}>
                      <TableCell>{formatTime(r.reportedAt)}</TableCell>
                      <TableCell>
                        <LevelBadge $color={cfg.color}>
                          <LevelBadgeDot $color={cfg.color} />
                          {cfg.label}
                        </LevelBadge>
                      </TableCell>
                      <TableCell>{r.reportedBy}</TableCell>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrapper>
        ) : (
          <EmptyState style={{ padding: "2rem" }}>
            <EmptyIcon>📊</EmptyIcon>
            <p>No reports yet. Start by tapping a crowd level above!</p>
          </EmptyState>
        )}
      </ChartContainer>
    </Container>
  );
}
