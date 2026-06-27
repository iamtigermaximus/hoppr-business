// src/components/bar/intelligence/BarIntelligenceHub.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";

const Container = styled.div`
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;

  @media (max-width: 768px) {
    margin-bottom: 2rem;
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #1f2937;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;

  @media (max-width: 768px) {
    font-size: 2rem;
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const Subtitle = styled.p`
  color: #6b7280;
  font-size: 1.25rem;
  max-width: 600px;
  margin: 0 auto;

  @media (max-width: 768px) {
    font-size: 1.125rem;
  }
`;

const OverviewGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  margin-bottom: 3rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Section = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
`;

const StatusIndicator = styled.div<{
  $status: "excellent" | "good" | "warning" | "critical" | "no-data";
}>`
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  font-size: 0.875rem;
  font-weight: 600;
  background: ${(props) =>
    props.$status === "excellent"
      ? "#dcfce7"
      : props.$status === "good"
      ? "#dbeafe"
      : props.$status === "warning"
      ? "#fef3c7"
      : props.$status === "critical"
      ? "#fecaca"
      : "#f3f4f6"};
  color: ${(props) =>
    props.$status === "excellent"
      ? "#166534"
      : props.$status === "good"
      ? "#1e40af"
      : props.$status === "warning"
      ? "#92400e"
      : props.$status === "critical"
      ? "#dc2626"
      : "#6b7280"};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const StatCard = styled.div<{ $isEmpty?: boolean }>`
  background: ${(props) => (props.$isEmpty ? "#f8fafc" : "#ffffff")};
  padding: 1.25rem;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  text-align: center;
  position: relative;
  ${(props) =>
    props.$isEmpty &&
    `
    border-style: dashed;
    border-color: #cbd5e1;
  `}
`;

const StatValue = styled.div<{ $isEmpty?: boolean }>`
  font-size: 2rem;
  font-weight: 700;
  color: ${(props) => (props.$isEmpty ? "#cbd5e1" : "#1e293b")};
  margin-bottom: 0.25rem;
  ${(props) =>
    props.$isEmpty &&
    `
    font-style: italic;
  `}
`;

const StatLabel = styled.div<{ $isEmpty?: boolean }>`
  color: ${(props) => (props.$isEmpty ? "#94a3b8" : "#64748b")};
  font-size: 0.875rem;
  font-weight: 500;
`;

const StatTrend = styled.div<{ $positive: boolean; $isEmpty?: boolean }>`
  font-size: 0.75rem;
  color: ${(props) =>
    props.$isEmpty ? "#94a3b8" : props.$positive ? "#10b981" : "#ef4444"};
  margin-top: 0.25rem;
  ${(props) =>
    props.$isEmpty &&
    `
    font-style: italic;
  `}
`;

const QuickActions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const ActionCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  border: 2px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;

  &:hover {
    border-color: #3b82f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  }
`;

const ActionIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 0.75rem;
`;

const ActionTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.5rem;
`;

const ActionDescription = styled.p`
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.4;
`;

const SuggestionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SuggestionCard = styled.div<{
  $type?: "setup" | "optimization" | "maintenance" | "growth";
}>`
  background: ${(props) =>
    props.$type === "setup"
      ? "#f0f9ff"
      : props.$type === "optimization"
      ? "#f0fdf4"
      : props.$type === "maintenance"
      ? "#fffbeb"
      : "#faf5ff"};
  padding: 1.25rem;
  border-radius: 0.75rem;
  border-left: 4px solid
    ${(props) =>
      props.$type === "setup"
        ? "#3b82f6"
        : props.$type === "optimization"
        ? "#10b981"
        : props.$type === "maintenance"
        ? "#f59e0b"
        : "#8b5cf6"};
`;

const SuggestionHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`;

const SuggestionIcon = styled.div`
  font-size: 1.25rem;
  flex-shrink: 0;
`;

const SuggestionContent = styled.div`
  flex: 1;
`;

const SuggestionTitle = styled.h4`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
`;

const SuggestionDescription = styled.p`
  color: #475569;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
`;

const AlertCard = styled.div<{
  $type: "info" | "warning" | "success" | "error" | "setup";
}>`
  background: ${(props) =>
    props.$type === "info"
      ? "#f0f9ff"
      : props.$type === "warning"
      ? "#fffbeb"
      : props.$type === "success"
      ? "#f0fdf4"
      : props.$type === "error"
      ? "#fef2f2"
      : "#f8fafc"};
  border: 1px solid
    ${(props) =>
      props.$type === "info"
        ? "#bae6fd"
        : props.$type === "warning"
        ? "#fed7aa"
        : props.$type === "success"
        ? "#bbf7d0"
        : props.$type === "error"
        ? "#fecaca"
        : "#e2e8f0"};
  padding: 1rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
`;

const AlertIcon = styled.div`
  font-size: 1.25rem;
  flex-shrink: 0;
`;

const AlertContent = styled.div`
  flex: 1;
`;

const AlertTitle = styled.h5`
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
`;

const AlertDescription = styled.p`
  color: #475569;
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.5;
`;

const TrendCard = styled.div`
  background: white;
  padding: 1.25rem;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
`;

const TrendItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f1f5f9;

  &:last-child {
    border-bottom: none;
  }
`;

const TrendLabel = styled.div<{ $isPlaceholder?: boolean }>`
  color: ${(props) => (props.$isPlaceholder ? "#94a3b8" : "#475569")};
  font-weight: 500;
  ${(props) =>
    props.$isPlaceholder &&
    `
    font-style: italic;
  `}
`;

const TrendValue = styled.div<{
  $positive?: boolean;
  $isPlaceholder?: boolean;
}>`
  color: ${(props) =>
    props.$isPlaceholder
      ? "#cbd5e1"
      : props.$positive
      ? "#10b981"
      : props.$positive === false
      ? "#ef4444"
      : "#1e293b"};
  font-weight: 600;
  ${(props) =>
    props.$isPlaceholder &&
    `
    font-style: italic;
  `}
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #64748b;
  text-align: center;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  color: #64748b;
`;

const EmptyStateIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
`;

const EmptyStateTitle = styled.h3`
  font-size: 1.5rem;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const EmptyStateDescription = styled.p`
  font-size: 1rem;
  margin-bottom: 2rem;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
`;

const SetupButton = styled.button`
  background: #3b82f6;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: #2563eb;
  }
`;

interface BarIntelligenceHubProps {
  barId: string;
}

interface BarStatus {
  overall: "excellent" | "good" | "warning" | "critical" | "no-data";
  profileViews: number | null;
  uniqueVisitors: number | null;
  viewsTrend: number | null;
  visitorsTrend: number | null;
  promoConversion: number | null;
  eventConversion: number | null;
  campaignImpressions: number | null;
  campaignClicks: number | null;
  campaignCTR: number | null;
  campaignSpentCents: number | null;
  campaignBudgetCents: number | null;
  activeCampaigns: number;
  profileScore: number;
  hasData: boolean;
}

interface QuickSuggestion {
  id: string;
  icon: string;
  title: string;
  description: string;
  action: string;
  type: "setup" | "optimization" | "maintenance" | "growth";
}

interface Alert {
  id: string;
  type: "info" | "warning" | "success" | "error" | "setup";
  title: string;
  description: string;
  icon: string;
}

interface Trend {
  label: string;
  value: string;
  positive?: boolean;
  isPlaceholder?: boolean;
}

interface IntelligenceResponse {
  success: boolean;
  hasData: boolean;
  status: BarStatus;
  suggestions: QuickSuggestion[];
  alerts: Alert[];
  trends: Trend[];
  quickStats: {
    bestDay: string;
    topPromotion: string;
    profileScore: string;
  };
}

const BarIntelligenceHub = ({ barId }: BarIntelligenceHubProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState<boolean | null>(null);
  const [barStatus, setBarStatus] = useState<BarStatus | null>(null);
  const [suggestions, setSuggestions] = useState<QuickSuggestion[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [quickStats, setQuickStats] = useState<IntelligenceResponse["quickStats"] | null>(null);

  useEffect(() => {
    fetchIntelligenceData();
  }, [barId]);

  const fetchIntelligenceData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("hoppr_token");
      const res = await fetch(`/api/auth/bar/${barId}/intelligence`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch intelligence data");

      const json: IntelligenceResponse = await res.json();

      setHasData(json.hasData);
      setBarStatus(json.status);
      setSuggestions(json.suggestions);
      setAlerts(json.alerts);
      setTrends(json.trends);
      setQuickStats(json.quickStats);
    } catch (error) {
      console.error("Failed to fetch intelligence data:", error);
      setHasData(false);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    if (action.startsWith("/bar/")) {
      router.push(action);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "excellent":
        return "Excellent Performance";
      case "good":
        return "Good Performance";
      case "warning":
        return "Needs Attention";
      case "critical":
        return "Immediate Action Needed";
      case "no-data":
        return "Setup Required";
      default:
        return "Unknown Status";
    }
  };

  const formatStatValue = (
    value: number | null,
    format: "number" | "percentage" = "number"
  ) => {
    if (value === null) return "No data";

    switch (format) {
      case "percentage":
        return `${value}%`;
      default:
        return value.toLocaleString();
    }
  };

  if (loading) {
    return (
      <Container>
        <LoadingState>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📊</div>
          <h2 style={{ marginBottom: "0.5rem", color: "#1e293b" }}>
            Analyzing Your Bar Data
          </h2>
          <p style={{ color: "#64748b" }}>
            Checking for available insights and recommendations...
          </p>
        </LoadingState>
      </Container>
    );
  }

  if (hasData === false) {
    return (
      <Container>
        <EmptyState>
          <EmptyStateIcon>📊</EmptyStateIcon>
          <EmptyStateTitle>No Data Available Yet</EmptyStateTitle>
          <EmptyStateDescription>
            Your bar intelligence hub is ready, but we need some data to provide
            insights. Start by setting up your systems and tracking customer
            activity to unlock powerful analytics.
          </EmptyStateDescription>
          <SetupButton onClick={() => router.push(`/bar/${barId}/profile`)}>Complete Your Profile</SetupButton>
        </EmptyState>

        {/* Show setup suggestions even when no data */}
        <Section>
          <SectionHeader>
            <SectionTitle>🚀 Get Started</SectionTitle>
          </SectionHeader>

          <QuickActions>
            {suggestions.map((suggestion) => (
              <ActionCard
                key={suggestion.id}
                onClick={() => handleQuickAction(suggestion.action)}
              >
                <ActionIcon>{suggestion.icon}</ActionIcon>
                <ActionTitle>{suggestion.title}</ActionTitle>
                <ActionDescription>{suggestion.description}</ActionDescription>
              </ActionCard>
            ))}
          </QuickActions>
        </Section>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          <span style={{ fontSize: "3rem" }}></span>
          Bar Intelligence Hub
        </Title>
        <Subtitle>
          {barStatus?.hasData
            ? "Smart insights and actionable recommendations for your bar"
            : "Setting up your bar intelligence system"}
        </Subtitle>
      </Header>

      <OverviewGrid>
        <MainContent>
          {/* Current Status Section */}
          <Section>
            <SectionHeader>
              <SectionTitle>📈 Current Status</SectionTitle>
              <StatusIndicator $status={barStatus?.overall || "no-data"}>
                {getStatusText(barStatus?.overall || "no-data")}
              </StatusIndicator>
            </SectionHeader>

            <StatsGrid>
              <StatCard $isEmpty={!barStatus?.profileViews}>
                <StatValue $isEmpty={!barStatus?.profileViews}>
                  {formatStatValue(barStatus?.profileViews || null)}
                </StatValue>
                <StatLabel $isEmpty={!barStatus?.profileViews}>
                  Profile Views (7d)
                </StatLabel>
                <StatTrend
                  $positive={(barStatus?.viewsTrend ?? 0) >= 0}
                  $isEmpty={!barStatus?.profileViews}
                >
                  {barStatus?.viewsTrend != null
                    ? `${(barStatus?.viewsTrend ?? 0) >= 0 ? "+" : ""}${barStatus?.viewsTrend}% vs last week`
                    : "No traffic data"}
                </StatTrend>
              </StatCard>

              <StatCard $isEmpty={!barStatus?.uniqueVisitors}>
                <StatValue $isEmpty={!barStatus?.uniqueVisitors}>
                  {formatStatValue(barStatus?.uniqueVisitors || null)}
                </StatValue>
                <StatLabel $isEmpty={!barStatus?.uniqueVisitors}>
                  Unique Visitors (7d)
                </StatLabel>
                <StatTrend
                  $positive={(barStatus?.visitorsTrend ?? 0) >= 0}
                  $isEmpty={!barStatus?.uniqueVisitors}
                >
                  {barStatus?.visitorsTrend != null
                    ? `${(barStatus?.visitorsTrend ?? 0) >= 0 ? "+" : ""}${barStatus?.visitorsTrend}% vs last week`
                    : "Awaiting visitor data"}
                </StatTrend>
              </StatCard>

              <StatCard $isEmpty={!barStatus?.promoConversion}>
                <StatValue $isEmpty={!barStatus?.promoConversion}>
                  {formatStatValue(barStatus?.promoConversion || null, "percentage")}
                </StatValue>
                <StatLabel $isEmpty={!barStatus?.promoConversion}>
                  Promo Click Rate
                </StatLabel>
                <StatTrend
                  $positive={(barStatus?.promoConversion || 0) >= 30}
                  $isEmpty={!barStatus?.promoConversion}
                >
                  {barStatus?.promoConversion != null
                    ? `${barStatus?.promoConversion}% of views → clicks`
                    : "Create promotions"}
                </StatTrend>
              </StatCard>

              <StatCard $isEmpty={barStatus?.profileScore === 0}>
                <StatValue $isEmpty={barStatus?.profileScore === 0}>
                  {formatStatValue(barStatus?.profileScore || null, "percentage")}
                </StatValue>
                <StatLabel $isEmpty={barStatus?.profileScore === 0}>
                  Profile Complete
                </StatLabel>
                <StatTrend
                  $positive={(barStatus?.profileScore || 0) >= 50}
                  $isEmpty={barStatus?.profileScore === 0}
                >
                  {barStatus?.profileScore != null
                    ? `${barStatus?.profileScore}% complete`
                    : "Setup required"}
                </StatTrend>
              </StatCard>

              <StatCard $isEmpty={!barStatus?.campaignImpressions}>
                <StatValue $isEmpty={!barStatus?.campaignImpressions}>
                  {formatStatValue(barStatus?.campaignImpressions || null)}
                </StatValue>
                <StatLabel $isEmpty={!barStatus?.campaignImpressions}>
                  Ad Impressions
                </StatLabel>
                <StatTrend
                  $positive={(barStatus?.campaignCTR || 0) >= 3}
                  $isEmpty={!barStatus?.campaignImpressions}
                >
                  {barStatus?.campaignCTR != null
                    ? `${barStatus?.campaignCTR}% CTR`
                    : (barStatus?.activeCampaigns ?? 0) > 0
                    ? "No clicks yet"
                    : "Launch a campaign"}
                </StatTrend>
              </StatCard>
            </StatsGrid>

            <QuickActions>
              {suggestions.map((suggestion) => (
                <ActionCard
                  key={suggestion.id}
                  onClick={() => handleQuickAction(suggestion.action)}
                >
                  <ActionIcon>{suggestion.icon}</ActionIcon>
                  <ActionTitle>{suggestion.title}</ActionTitle>
                  <ActionDescription>
                    {suggestion.description}
                  </ActionDescription>
                </ActionCard>
              ))}
            </QuickActions>
          </Section>

          {/* Smart Suggestions Section */}
          <Section>
            <SectionHeader>
              <SectionTitle>💡 Smart Suggestions</SectionTitle>
            </SectionHeader>

            <SuggestionList>
              {suggestions.slice(0, 4).map((suggestion) => (
                <SuggestionCard key={suggestion.id} $type={suggestion.type}>
                  <SuggestionHeader>
                    <SuggestionIcon>{suggestion.icon}</SuggestionIcon>
                    <SuggestionContent>
                      <SuggestionTitle>{suggestion.title}</SuggestionTitle>
                      <SuggestionDescription>
                        {suggestion.description}
                      </SuggestionDescription>
                    </SuggestionContent>
                  </SuggestionHeader>
                </SuggestionCard>
              ))}
            </SuggestionList>
          </Section>
        </MainContent>

        <Sidebar>
          {/* Alerts & Notifications */}
          <Section>
            <SectionHeader>
              <SectionTitle>⚠️ Alerts</SectionTitle>
            </SectionHeader>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {alerts.map((alert) => (
                <AlertCard key={alert.id} $type={alert.type}>
                  <AlertIcon>{alert.icon}</AlertIcon>
                  <AlertContent>
                    <AlertTitle>{alert.title}</AlertTitle>
                    <AlertDescription>{alert.description}</AlertDescription>
                  </AlertContent>
                </AlertCard>
              ))}
            </div>
          </Section>

          {/* Recent Trends */}
          <Section>
            <SectionHeader>
              <SectionTitle>
                📊 {barStatus?.hasData ? "Trends" : "What to Expect"}
              </SectionTitle>
            </SectionHeader>

            <TrendCard>
              {trends.map((trend, index) => (
                <TrendItem key={index}>
                  <TrendLabel $isPlaceholder={trend.isPlaceholder}>
                    {trend.label}
                  </TrendLabel>
                  <TrendValue
                    $positive={trend.positive}
                    $isPlaceholder={trend.isPlaceholder}
                  >
                    {trend.value}
                  </TrendValue>
                </TrendItem>
              ))}
            </TrendCard>
          </Section>

          {/* Quick Stats */}
          <Section>
            <SectionHeader>
              <SectionTitle>⚡ Quick Stats</SectionTitle>
            </SectionHeader>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ color: "#64748b" }}>Best Day:</span>
                <strong style={{ color: "#1e293b" }}>
                  {quickStats?.bestDay || "No data"}
                </strong>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ color: "#64748b" }}>Top Promotion:</span>
                <strong style={{ color: "#1e293b" }}>
                  {quickStats?.topPromotion || "None"}
                </strong>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ color: "#64748b" }}>Profile Score:</span>
                <strong style={{ color: "#10b981" }}>
                  {quickStats?.profileScore || "N/A"}
                </strong>
              </div>
            </div>
          </Section>
        </Sidebar>
      </OverviewGrid>
    </Container>
  );
};

export default BarIntelligenceHub;
