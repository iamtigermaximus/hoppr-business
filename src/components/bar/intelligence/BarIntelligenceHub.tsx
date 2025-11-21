// src/components/bar/intelligence/BarIntelligenceHub.tsx
"use client";

import { useState, useEffect } from "react";
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
  revenue: number | null;
  customers: number | null;
  vipEngagement: number | null;
  promotionPerformance: number | null;
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
  action?: string;
}

interface Trend {
  label: string;
  value: string;
  positive?: boolean;
  isPlaceholder?: boolean;
}

const BarIntelligenceHub = ({ barId }: BarIntelligenceHubProps) => {
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState<boolean | null>(null);
  const [barStatus, setBarStatus] = useState<BarStatus | null>(null);
  const [suggestions, setSuggestions] = useState<QuickSuggestion[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);

  useEffect(() => {
    fetchIntelligenceData();
  }, [barId]);

  const fetchIntelligenceData = async () => {
    setLoading(true);
    try {
      // Simulate API call to check for data
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Check if bar has any data (customers, sales, promotions, etc.)
      const barHasData = await checkIfBarHasData(barId);

      setHasData(barHasData);

      if (barHasData) {
        // Load real data
        await loadRealData(barId);
      } else {
        // Show setup state
        await loadSetupData();
      }
    } catch (error) {
      console.error("Failed to fetch intelligence data:", error);
      setHasData(false);
      await loadSetupData();
    } finally {
      setLoading(false);
    }
  };

  const checkIfBarHasData = async (barId: string): Promise<boolean> => {
    // In real implementation, check your database for:
    // - Customer visits
    // - Sales transactions
    // - Promotion usage
    // - Staff activity
    // For now, we'll simulate a check
    return Math.random() > 0.3; // 70% chance of having data for demo
  };

  const loadRealData = async (barId: string) => {
    // Mock real data
    const mockStatus: BarStatus = {
      overall: "good",
      revenue: 12540,
      customers: 324,
      vipEngagement: 72,
      promotionPerformance: 65,
      hasData: true,
    };

    const mockSuggestions: QuickSuggestion[] = [
      {
        id: "1",
        icon: "🎯",
        title: "Boost Weekend Sales",
        description:
          "Create exclusive weekend packages to increase VIP spending",
        action: "create_promotion",
        type: "optimization",
      },
      {
        id: "2",
        icon: "👥",
        title: "Staff Optimization",
        description: "Adjust staff schedule based on peak hours analysis",
        action: "manage_staff",
        type: "optimization",
      },
      {
        id: "3",
        icon: "📊",
        title: "Performance Review",
        description: "View detailed analytics for last month",
        action: "view_analytics",
        type: "maintenance",
      },
      {
        id: "4",
        icon: "🎪",
        title: "Plan Event",
        description: "Set up a themed night to attract new customers",
        action: "create_event",
        type: "growth",
      },
    ];

    const mockAlerts: Alert[] = [
      {
        id: "1",
        type: "warning",
        title: "Low Tuesday Traffic",
        description:
          "Tuesday evenings are 45% below average. Consider adding themed events.",
        icon: "📉",
      },
      {
        id: "2",
        type: "success",
        title: "VIP Engagement High",
        description:
          "VIP customers are spending 35% more this month. Great job!",
        icon: "👑",
      },
      {
        id: "3",
        type: "info",
        title: "Promotion Ending Soon",
        description:
          "Friday Night Special ends in 2 days. Consider extending or replacing.",
        icon: "⏰",
      },
    ];

    const mockTrends: Trend[] = [
      { label: "Weekend Revenue", value: "+18%", positive: true },
      { label: "New Customers", value: "+12%", positive: true },
      { label: "Staff Efficiency", value: "+8%", positive: true },
      { label: "Promotion Clicks", value: "-5%", positive: false },
      { label: "Average Spend", value: "$68", positive: undefined },
    ];

    setBarStatus(mockStatus);
    setSuggestions(mockSuggestions);
    setAlerts(mockAlerts);
    setTrends(mockTrends);
  };

  const loadSetupData = async () => {
    const setupStatus: BarStatus = {
      overall: "no-data",
      revenue: null,
      customers: null,
      vipEngagement: null,
      promotionPerformance: null,
      hasData: false,
    };

    const setupSuggestions: QuickSuggestion[] = [
      {
        id: "1",
        icon: "📱",
        title: "Set Up QR Scanner",
        description:
          "Configure your QR code scanner to start tracking customer visits",
        action: "setup_scanner",
        type: "setup",
      },
      {
        id: "2",
        icon: "🎯",
        title: "Create First Promotion",
        description: "Launch your first promotion to attract customers",
        action: "create_promotion",
        type: "setup",
      },
      {
        id: "3",
        icon: "👥",
        title: "Add Staff Members",
        description: "Invite your team members to help manage the bar",
        action: "manage_staff",
        type: "setup",
      },
      {
        id: "4",
        icon: "📊",
        title: "Connect Your POS",
        description:
          "Link your point-of-sale system to track sales automatically",
        action: "setup_pos",
        type: "setup",
      },
    ];

    const setupAlerts: Alert[] = [
      {
        id: "1",
        type: "setup",
        title: "Welcome to Bar Intelligence!",
        description:
          "Get started by setting up your bar systems to unlock powerful insights.",
        icon: "👋",
      },
      {
        id: "2",
        type: "info",
        title: "No Data Yet",
        description:
          "Start by scanning some QR codes or creating promotions to see insights.",
        icon: "📈",
      },
      {
        id: "3",
        type: "success",
        title: "Ready to Begin",
        description: "Your bar is set up and ready to start collecting data.",
        icon: "✅",
      },
    ];

    const setupTrends: Trend[] = [
      { label: "Customer Visits", value: "No data yet", isPlaceholder: true },
      { label: "Revenue Tracking", value: "Setup needed", isPlaceholder: true },
      {
        label: "Promotion Performance",
        value: "Not started",
        isPlaceholder: true,
      },
      { label: "VIP Engagement", value: "Awaiting data", isPlaceholder: true },
    ];

    setBarStatus(setupStatus);
    setSuggestions(setupSuggestions);
    setAlerts(setupAlerts);
    setTrends(setupTrends);
  };

  const handleQuickAction = (action: string) => {
    console.log("Quick action:", action);
    // Navigate to appropriate page based on action
    // router.push(`/bar/${barId}/${action}`)
  };

  const handleSetupBar = () => {
    console.log("Starting bar setup...");
    // Navigate to setup wizard
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
    format: "currency" | "number" | "percentage" = "number"
  ) => {
    if (value === null) return "No data";

    switch (format) {
      case "currency":
        return `$${value.toLocaleString()}`;
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
          <SetupButton onClick={handleSetupBar}>Start Setup Wizard</SetupButton>
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
              <StatCard $isEmpty={!barStatus?.revenue}>
                <StatValue $isEmpty={!barStatus?.revenue}>
                  {formatStatValue(barStatus?.revenue || null, "currency")}
                </StatValue>
                <StatLabel $isEmpty={!barStatus?.revenue}>
                  Monthly Revenue
                </StatLabel>
                <StatTrend $positive={true} $isEmpty={!barStatus?.revenue}>
                  {barStatus?.revenue
                    ? "+12% from last month"
                    : "Start tracking sales"}
                </StatTrend>
              </StatCard>

              <StatCard $isEmpty={!barStatus?.customers}>
                <StatValue $isEmpty={!barStatus?.customers}>
                  {formatStatValue(barStatus?.customers || null)}
                </StatValue>
                <StatLabel $isEmpty={!barStatus?.customers}>
                  Active Customers
                </StatLabel>
                <StatTrend $positive={true} $isEmpty={!barStatus?.customers}>
                  {barStatus?.customers
                    ? "+8% growth"
                    : "Awaiting customer data"}
                </StatTrend>
              </StatCard>

              <StatCard $isEmpty={!barStatus?.vipEngagement}>
                <StatValue $isEmpty={!barStatus?.vipEngagement}>
                  {formatStatValue(
                    barStatus?.vipEngagement || null,
                    "percentage"
                  )}
                </StatValue>
                <StatLabel $isEmpty={!barStatus?.vipEngagement}>
                  VIP Engagement
                </StatLabel>
                <StatTrend
                  $positive={(barStatus?.vipEngagement || 0) > 70}
                  $isEmpty={!barStatus?.vipEngagement}
                >
                  {barStatus?.vipEngagement ? "On target" : "No VIP data yet"}
                </StatTrend>
              </StatCard>

              <StatCard $isEmpty={!barStatus?.promotionPerformance}>
                <StatValue $isEmpty={!barStatus?.promotionPerformance}>
                  {formatStatValue(
                    barStatus?.promotionPerformance || null,
                    "percentage"
                  )}
                </StatValue>
                <StatLabel $isEmpty={!barStatus?.promotionPerformance}>
                  Promotion Performance
                </StatLabel>
                <StatTrend
                  $positive={(barStatus?.promotionPerformance || 0) > 60}
                  $isEmpty={!barStatus?.promotionPerformance}
                >
                  {barStatus?.promotionPerformance
                    ? "Good"
                    : "Create promotions"}
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
              {barStatus?.hasData ? (
                <>
                  <SuggestionCard $type="optimization">
                    <SuggestionHeader>
                      <SuggestionIcon>🚀</SuggestionIcon>
                      <SuggestionContent>
                        <SuggestionTitle>
                          Weekend VIP Experience
                        </SuggestionTitle>
                        <SuggestionDescription>
                          Create exclusive VIP packages for Friday and Saturday
                          nights. VIP customers spend 45% more on weekends and
                          current utilization is only 60%.
                        </SuggestionDescription>
                      </SuggestionContent>
                    </SuggestionHeader>
                  </SuggestionCard>

                  <SuggestionCard $type="growth">
                    <SuggestionHeader>
                      <SuggestionIcon>🎪</SuggestionIcon>
                      <SuggestionContent>
                        <SuggestionTitle>Themed Tuesday Events</SuggestionTitle>
                        <SuggestionDescription>
                          Launch trivia or live music nights on Tuesdays.
                          Current Tuesday traffic is 65% below average but has
                          40% higher spend per customer.
                        </SuggestionDescription>
                      </SuggestionContent>
                    </SuggestionHeader>
                  </SuggestionCard>
                </>
              ) : (
                <>
                  <SuggestionCard $type="setup">
                    <SuggestionHeader>
                      <SuggestionIcon>📱</SuggestionIcon>
                      <SuggestionContent>
                        <SuggestionTitle>
                          Set Up QR Code Scanning
                        </SuggestionTitle>
                        <SuggestionDescription>
                          Start by configuring your QR code scanner. This will
                          track customer visits and help us provide personalized
                          insights about your bar traffic.
                        </SuggestionDescription>
                      </SuggestionContent>
                    </SuggestionHeader>
                  </SuggestionCard>

                  <SuggestionCard $type="setup">
                    <SuggestionHeader>
                      <SuggestionIcon>🎯</SuggestionIcon>
                      <SuggestionContent>
                        <SuggestionTitle>
                          Create Your First Promotion
                        </SuggestionTitle>
                        <SuggestionDescription>
                          Launch a simple promotion to attract customers.
                          We&apos;ll track its performance and suggest
                          optimizations based on real data.
                        </SuggestionDescription>
                      </SuggestionContent>
                    </SuggestionHeader>
                  </SuggestionCard>
                </>
              )}
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
                <span
                  style={{ color: barStatus?.hasData ? "#64748b" : "#94a3b8" }}
                >
                  {barStatus?.hasData ? "Best Performing Day:" : "First Step:"}
                </span>
                <strong
                  style={{ color: barStatus?.hasData ? "#1e293b" : "#3b82f6" }}
                >
                  {barStatus?.hasData ? "Saturday" : "Setup Scanner"}
                </strong>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{ color: barStatus?.hasData ? "#64748b" : "#94a3b8" }}
                >
                  {barStatus?.hasData ? "Top Promotion:" : "Next Step:"}
                </span>
                <strong
                  style={{ color: barStatus?.hasData ? "#1e293b" : "#3b82f6" }}
                >
                  {barStatus?.hasData
                    ? "Friday Night Special"
                    : "Create Promotion"}
                </strong>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{ color: barStatus?.hasData ? "#64748b" : "#94a3b8" }}
                >
                  {barStatus?.hasData
                    ? "Customer Satisfaction:"
                    : "Data Status:"}
                </span>
                <strong
                  style={{ color: barStatus?.hasData ? "#10b981" : "#f59e0b" }}
                >
                  {barStatus?.hasData ? "4.8/5 ⭐" : "Awaiting Data"}
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
