"use client";

import { useState, useEffect, useCallback } from "react";
import styled from "styled-components";

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

const RefreshButton = styled.button`
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  transition: all 0.2s;

  &:hover {
    background: #e5e7eb;
  }
`;

// Overall status banner
const OverallBanner = styled.div<{ $status: string }>`
  padding: 1.25rem 1.5rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  ${({ $status }) => {
    switch ($status) {
      case "HEALTHY":
        return "background: #dcfce7; border: 1px solid #86efac;";
      case "DEGRADED":
        return "background: #fef3c7; border: 1px solid #fcd34d;";
      case "DOWN":
        return "background: #fef2f2; border: 1px solid #fecaca;";
      default:
        return "background: #f3f4f6; border: 1px solid #e5e7eb;";
    }
  }}
`;

const OverallIcon = styled.div<{ $status: string }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
  ${({ $status }) => {
    switch ($status) {
      case "HEALTHY":
        return "background: #16a34a; color: white;";
      case "DEGRADED":
        return "background: #f59e0b; color: white;";
      case "DOWN":
        return "background: #dc2626; color: white;";
      default:
        return "background: #9ca3af; color: white;";
    }
  }}
`;

const OverallText = styled.div`
  flex: 1;
`;

const OverallStatus = styled.div<{ $status: string }>`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${({ $status }) => {
    switch ($status) {
      case "HEALTHY": return "#166534";
      case "DEGRADED": return "#92400e";
      case "DOWN": return "#dc2626";
      default: return "#374151";
    }
  }};
`;

const OverallSubtext = styled.div`
  font-size: 0.8125rem;
  color: #6b7280;
  margin-top: 0.125rem;
`;

// Component cards grid
const ComponentsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const ComponentCard = styled.div<{ $status: string }>`
  background: white;
  border-radius: 0.75rem;
  padding: 1.25rem;
  border: 1px solid #e5e7eb;
  border-left: 4px solid ${({ $status }) => {
    switch ($status) {
      case "HEALTHY": return "#16a34a";
      case "DEGRADED": return "#f59e0b";
      case "DOWN": return "#dc2626";
      default: return "#9ca3af";
    }
  }};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
`;

const ComponentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const ComponentName = styled.div`
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1f2937;
`;

const StatusDot = styled.span<{ $status: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  background: ${({ $status }) => {
    switch ($status) {
      case "HEALTHY": return "#16a34a";
      case "DEGRADED": return "#f59e0b";
      case "DOWN": return "#dc2626";
      default: return "#9ca3af";
    }
  }};
`;

const ComponentMessage = styled.div`
  font-size: 0.8125rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
`;

const ComponentLatency = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LatencyBadge = styled.span<{ $latency: number }>`
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.6875rem;
  font-weight: 600;
  background: ${({ $latency }) => {
    if ($latency <= 50) return "#dcfce7";
    if ($latency <= 100) return "#fef3c7";
    return "#fef2f2";
  }};
  color: ${({ $latency }) => {
    if ($latency <= 50) return "#166534";
    if ($latency <= 100) return "#92400e";
    return "#dc2626";
  }};
`;

// Metrics section
const SectionTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const MetricCard = styled.div`
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  text-align: center;
`;

const MetricValue = styled.div`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
`;

const MetricLabel = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

// Error graph
const GraphCard = styled.div`
  background: white;
  border-radius: 0.75rem;
  padding: 1.25rem;
  border: 1px solid #e5e7eb;
  margin-bottom: 1.5rem;
`;

const GraphHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const GraphTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const GraphSubtitle = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
`;

const BarChart = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 120px;
  padding: 0 0.25rem;
`;

const BarContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  min-width: 0;
`;

const Bar = styled.div<{ $height: number; $hasErrors: boolean }>`
  width: 100%;
  max-width: 24px;
  height: ${({ $height }) => Math.max($height, 2)}px;
  background: ${({ $hasErrors }) => ($hasErrors ? "#ef4444" : "#e5e7eb")};
  border-radius: 2px 2px 0 0;
  transition: height 0.3s ease;
  min-height: 2px;
`;

const BarLabel = styled.span`
  font-size: 0.5625rem;
  color: #9ca3af;
  white-space: nowrap;
`;

const BarCount = styled.span`
  font-size: 0.5625rem;
  color: #6b7280;
  font-weight: 500;
`;

// Thresholds
const ThresholdsCard = styled.div`
  background: white;
  border-radius: 0.75rem;
  padding: 1.25rem;
  border: 1px solid #e5e7eb;
`;

const ThresholdRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.625rem 0;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }
`;

const ThresholdLabel = styled.span`
  font-size: 0.875rem;
  color: #374151;
`;

const ThresholdValue = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  background: #f3f4f6;
  padding: 0.25rem 0.625rem;
  border-radius: 0.25rem;
`;

const EmptyGraph = styled.div`
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 0.875rem;
`;

// Loading/Error states
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
  margin: 2rem 0;
`;

// ---- Types ----

type HealthStatus = "HEALTHY" | "DEGRADED" | "DOWN";

interface ComponentHealth {
  name: string;
  status: HealthStatus;
  latencyMs: number;
  message: string;
  checkedAt: string;
}

interface ErrorBucket {
  hour: string;
  count: number;
}

interface SystemHealth {
  overall: HealthStatus;
  components: ComponentHealth[];
  metrics: {
    totalBars: number;
    totalUsers: number;
    totalClaims: number;
    totalOutreachLogs: number;
    errorsLast24h: number;
    avgDbQueryMs: number;
  };
  errorsByHour: ErrorBucket[];
  thresholds: {
    dbLatencyMs: number;
    errorRate: number;
  };
}

interface HealthResponse {
  success: boolean;
  health: SystemHealth;
}

// ---- Helpers ----

const STATUS_ICON: Record<string, string> = {
  HEALTHY: "✓",
  DEGRADED: "⚠",
  DOWN: "✕",
};

const STATUS_LABEL: Record<string, string> = {
  HEALTHY: "All Systems Operational",
  DEGRADED: "Some Systems Degraded",
  DOWN: "System Outage Detected",
};

// ---- Component ----

const HealthDashboard = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string>("");

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("hoppr_token");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      const res = await fetch("/api/auth/admin/health", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Failed: ${res.status}`);

      const data: HealthResponse = await res.json();
      setHealth(data.health);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch health data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchHealth, 60000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const maxErrorCount = health?.errorsByHour?.length
    ? Math.max(1, ...health.errorsByHour.map((b) => b.count))
    : 1;

  if (loading && !health) {
    return (
      <Container>
        <Header>
          <Title>Platform Health</Title>
        </Header>
        <LoadingOverlay>Checking system health...</LoadingOverlay>
      </Container>
    );
  }

  if (error && !health) {
    return (
      <Container>
        <Header>
          <Title>Platform Health</Title>
        </Header>
        <ErrorBox>
          <p>{error}</p>
          <RefreshButton onClick={fetchHealth} style={{ margin: "1rem auto 0" }}>
            Try Again
          </RefreshButton>
        </ErrorBox>
      </Container>
    );
  }

  if (!health) return null;

  return (
    <Container>
      <Header>
        <Title>Platform Health</Title>
        <RefreshButton onClick={fetchHealth}>
          {loading ? "⟳ Checking..." : "⟳ Refresh"}
        </RefreshButton>
      </Header>

      {/* Overall Status Banner */}
      <OverallBanner $status={health.overall}>
        <OverallIcon $status={health.overall}>
          {STATUS_ICON[health.overall]}
        </OverallIcon>
        <OverallText>
          <OverallStatus $status={health.overall}>
            {STATUS_LABEL[health.overall]}
          </OverallStatus>
          <OverallSubtext>
            Last checked: {lastChecked || "just now"} · Auto-refreshes every 60s
          </OverallSubtext>
        </OverallText>
      </OverallBanner>

      {/* Component Status Cards */}
      <SectionTitle>Component Status</SectionTitle>
      <ComponentsGrid>
        {health.components.map((comp) => (
          <ComponentCard key={comp.name} $status={comp.status}>
            <ComponentHeader>
              <ComponentName>{comp.name}</ComponentName>
              <StatusDot $status={comp.status} title={comp.status} />
            </ComponentHeader>
            <ComponentMessage>{comp.message}</ComponentMessage>
            <ComponentLatency>
              <LatencyBadge $latency={comp.latencyMs}>
                {comp.latencyMs}ms
              </LatencyBadge>
              {comp.status !== "HEALTHY" && (
                <span style={{ color: "#dc2626", fontSize: "0.75rem" }}>
                  {comp.status}
                </span>
              )}
            </ComponentLatency>
          </ComponentCard>
        ))}
      </ComponentsGrid>

      {/* Platform Metrics */}
      <SectionTitle>Platform Metrics</SectionTitle>
      <MetricsGrid>
        <MetricCard>
          <MetricValue>{health.metrics.totalBars >= 0 ? health.metrics.totalBars.toLocaleString() : "—"}</MetricValue>
          <MetricLabel>Total Bars</MetricLabel>
        </MetricCard>
        <MetricCard>
          <MetricValue>{health.metrics.totalUsers >= 0 ? health.metrics.totalUsers.toLocaleString() : "—"}</MetricValue>
          <MetricLabel>Total Users</MetricLabel>
        </MetricCard>
        <MetricCard>
          <MetricValue>{health.metrics.totalClaims >= 0 ? health.metrics.totalClaims.toLocaleString() : "—"}</MetricValue>
          <MetricLabel>Claims</MetricLabel>
        </MetricCard>
        <MetricCard>
          <MetricValue>{health.metrics.totalOutreachLogs >= 0 ? health.metrics.totalOutreachLogs.toLocaleString() : "—"}</MetricValue>
          <MetricLabel>Outreach Logs</MetricLabel>
        </MetricCard>
        <MetricCard>
          <MetricValue style={{ color: health.metrics.errorsLast24h > 0 ? "#dc2626" : "#16a34a" }}>
            {health.metrics.errorsLast24h}
          </MetricValue>
          <MetricLabel>Errors (24h)</MetricLabel>
        </MetricCard>
        <MetricCard>
          <MetricValue>{health.metrics.avgDbQueryMs}ms</MetricValue>
          <MetricLabel>Avg Query Time</MetricLabel>
        </MetricCard>
      </MetricsGrid>

      {/* 24-Hour Error Graph */}
      <GraphCard>
        <GraphHeader>
          <GraphTitle>Errors — Last 24 Hours</GraphTitle>
          <GraphSubtitle>
            {health.metrics.errorsLast24h} total · threshold: {health.thresholds.errorRate}/hr
          </GraphSubtitle>
        </GraphHeader>
        {health.errorsByHour.every((b) => b.count === 0) ? (
          <EmptyGraph>No errors in the last 24 hours 🎉</EmptyGraph>
        ) : (
          <BarChart>
            {health.errorsByHour.map((bucket, i) => (
              <BarContainer key={i}>
                <BarCount>{bucket.count > 0 ? bucket.count : ""}</BarCount>
                <Bar
                  $height={(bucket.count / maxErrorCount) * 100}
                  $hasErrors={bucket.count > 0}
                />
                <BarLabel>{i % 4 === 0 ? bucket.hour : ""}</BarLabel>
              </BarContainer>
            ))}
          </BarChart>
        )}
      </GraphCard>

      {/* Alert Thresholds */}
      <SectionTitle>Alert Thresholds</SectionTitle>
      <ThresholdsCard>
        <ThresholdRow>
          <ThresholdLabel>Database latency warning</ThresholdLabel>
          <ThresholdValue>{health.thresholds.dbLatencyMs}ms</ThresholdValue>
        </ThresholdRow>
        <ThresholdRow>
          <ThresholdLabel>Error rate warning</ThresholdLabel>
          <ThresholdValue>{health.thresholds.errorRate} errors/hr</ThresholdValue>
        </ThresholdRow>
        <ThresholdRow>
          <ThresholdLabel>Connection pool warning</ThresholdLabel>
          <ThresholdValue>50 connections</ThresholdValue>
        </ThresholdRow>
        <ThresholdRow>
          <ThresholdLabel>Auto-refresh interval</ThresholdLabel>
          <ThresholdValue>60 seconds</ThresholdValue>
        </ThresholdRow>
      </ThresholdsCard>
    </Container>
  );
};

export default HealthDashboard;
