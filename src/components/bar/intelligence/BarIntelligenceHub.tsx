// src/components/bar/intelligence/BarIntelligenceHub.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { SkeletonBox, SkeletonCard } from "@/components/ui/Skeleton";

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

/** AI-powered intelligence analysis report */
interface AIReport {
  narrativeSummary: string;
  competitiveAnalysis: string;
  contentAnalysis: string;
  calendarOpportunities: string[];
  recommendations: Array<{
    priority: "high" | "medium";
    action: string;
    rationale: string;
  }>;
}

interface TierStats {
  userCount: number;
  percentageOfTotal: number;
  averageEventsPerUser: number;
  topContentType: string;
  topContentTypePercentage: number;
  contentBreakdown: Record<string, number>;
}

interface CustomerInsights {
  totalUsers: number;
  totalEvents: number;
  regulars: TierStats;
  occasionals: TierStats;
  oneTimers: TierStats;
  averageEventsPerUser: number;
  repeatVisitRate: number;
  newVisitors30d: number;
  returningVisitors30d: number;
  newVisitorPercentage: number;
  regularContentPreference: Record<string, number>;
  newVisitorContentPreference: Record<string, number>;
  topCustomerCounts: number[];
  lookbackDays: number;
  computedAt: string;
}

interface AIAnalysisResponse {
  success: boolean;
  aiGenerated: boolean;
  cached?: boolean;
  cachedAt?: string;
  promptVersion?: string;
  warning?: string;
  narrativeSummary: string;
  competitiveAnalysis: string;
  contentAnalysis: string;
  calendarOpportunities: string[];
  recommendations: Array<{
    priority: "high" | "medium";
    action: string;
    rationale: string;
  }>;
  customerInsights?: CustomerInsights | null;
}

// ── AI Analysis Panel Styles ──────────────────────────────────────

const AIPanel = styled.div`
  background: linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%);
  border: 1px solid #c7d2fe;
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const AIPanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
`;

const AIPanelTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: #3730a3;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
`;

const AIRegenerateButton = styled.button`
  background: #4f46e5;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;

  &:hover {
    background: #4338ca;
  }

  &:disabled {
    background: #a5b4fc;
    cursor: not-allowed;
  }
`;

const AISection = styled.div`
  margin-bottom: 1.25rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const AISectionLabel = styled.h3`
  font-size: 0.875rem;
  font-weight: 700;
  color: #6366f1;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const AISectionText = styled.p`
  color: #374151;
  font-size: 1rem;
  line-height: 1.6;
  margin: 0;
`;

const AIRecommendationCard = styled.div<{ $priority: "high" | "medium" }>`
  background: ${(props) => (props.$priority === "high" ? "#eef2ff" : "#f9fafb")};
  border-left: 4px solid ${(props) => (props.$priority === "high" ? "#4f46e5" : "#a5b4fc")};
  padding: 0.75rem 1rem;
  border-radius: 0 0.5rem 0.5rem 0;
  margin-bottom: 0.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const AIRecAction = styled.div`
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
  font-size: 0.9375rem;
`;

const AIRecRationale = styled.div`
  color: #64748b;
  font-size: 0.8125rem;
  line-height: 1.4;
`;

const AIOpportunityChip = styled.span`
  display: inline-block;
  background: #e0e7ff;
  color: #4338ca;
  padding: 0.375rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8125rem;
  font-weight: 500;
  margin: 0 0.375rem 0.375rem 0;
`;

const AILoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #6366f1;
  gap: 0.75rem;
`;

const AILoadingSpinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid #e0e7ff;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const AIErrorBox = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.5;
`;

const AICachedBadge = styled.span`
  background: #e0e7ff;
  color: #6366f1;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
`;

// ── Audience Panel Styles ──────────────────────────────────────────

const AudiencePanel = styled.div`
  background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
  border: 1px solid #d8b4fe;
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const AudienceHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
`;

const AudienceTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: #6b21a8;
  margin: 0;
`;

const AudienceTopStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.25rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const AudienceStatCard = styled.div`
  background: white;
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid #e9d5ff;
  text-align: center;
`;

const AudienceStatValue = styled.div`
  font-size: 1.75rem;
  font-weight: 700;
  color: #6b21a8;
`;

const AudienceStatLabel = styled.div`
  color: #7c3aed;
  font-size: 0.8125rem;
  font-weight: 500;
  margin-top: 0.25rem;
`;

const AudienceTierGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.25rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const AudienceTierCard = styled.div<{ $tier: "regulars" | "occasionals" | "oneTimers" }>`
  background: white;
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid
    ${(props) =>
      props.$tier === "regulars"
        ? "#c4b5fd"
        : props.$tier === "occasionals"
        ? "#d8b4fe"
        : "#ede9fe"};
  text-align: center;
`;

const AudienceTierCount = styled.div<{ $tier: "regulars" | "occasionals" | "oneTimers" }>`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${(props) =>
    props.$tier === "regulars"
      ? "#6d28d9"
      : props.$tier === "occasionals"
      ? "#7c3aed"
      : "#8b5cf6"};
`;

const AudienceTierLabel = styled.div`
  font-size: 0.8125rem;
  font-weight: 600;
  color: #4c1d95;
  margin: 0.25rem 0;
`;

const AudienceTierDetail = styled.div`
  font-size: 0.75rem;
  color: #7c3aed;
  line-height: 1.4;
`;

const AudienceSplitSection = styled.div`
  background: white;
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid #e9d5ff;
  margin-bottom: 1rem;
`;

const AudienceSplitLabel = styled.div`
  font-size: 0.8125rem;
  font-weight: 600;
  color: #4c1d95;
  margin-bottom: 0.5rem;
`;

const AudienceSplitBar = styled.div`
  height: 1.5rem;
  background: #ede9fe;
  border-radius: 0.75rem;
  overflow: hidden;
  display: flex;
  margin-bottom: 0.5rem;
`;

const AudienceSplitSegment = styled.div<{
  $width: number;
  $color: string;
}>`
  width: ${(props) => props.$width}%;
  background: ${(props) => props.$color};
  transition: width 0.3s ease;
`;

const AudienceSplitLegend = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #7c3aed;
`;

const AudiencePrefGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const AudiencePrefCard = styled.div`
  background: white;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid #e9d5ff;
`;

const AudiencePrefTitle = styled.div`
  font-size: 0.8125rem;
  font-weight: 600;
  color: #4c1d95;
  margin-bottom: 0.5rem;
`;

const AudiencePrefBar = styled.div`
  height: 0.5rem;
  background: #ede9fe;
  border-radius: 0.25rem;
  overflow: hidden;
  margin-bottom: 0.25rem;
`;

const AudiencePrefFill = styled.div<{ $width: number }>`
  height: 100%;
  width: ${(props) => props.$width}%;
  background: #8b5cf6;
  border-radius: 0.25rem;
  transition: width 0.3s ease;
`;

const AudiencePrefRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #7c3aed;
  margin-bottom: 0.375rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const BarIntelligenceHub = ({ barId }: BarIntelligenceHubProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState<boolean | null>(null);
  const [barStatus, setBarStatus] = useState<BarStatus | null>(null);
  const [suggestions, setSuggestions] = useState<QuickSuggestion[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [quickStats, setQuickStats] = useState<IntelligenceResponse["quickStats"] | null>(null);

  // AI-powered analysis state
  const [aiReport, setAIReport] = useState<AIReport | null>(null);
  const [aiLoading, setAILoading] = useState(false);
  const [aiError, setAIError] = useState<string | null>(null);
  const [aiCached, setAiCached] = useState(false);
  const [aiCachedAt, setAiCachedAt] = useState<string | null>(null);

  // Customer insights (audience analytics)
  const [customerInsights, setCustomerInsights] = useState<CustomerInsights | null>(null);

  useEffect(() => {
    fetchIntelligenceData();
    fetchAIAnalysis(false); // use cache if available
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

  const fetchAIAnalysis = async (refresh = false) => {
    setAILoading(true);
    setAIError(null);
    try {
      const token = localStorage.getItem("hoppr_token");
      const res = await fetch(`/api/auth/bar/${barId}/intelligence/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ language: "en", refresh }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setAIError(errData.error || `Failed to load AI analysis (${res.status})`);
        return;
      }

      const json: AIAnalysisResponse = await res.json();

      if (json.warning && !json.aiGenerated) {
        // AI not configured or failed — show warning but don't treat as error
        setAIError(json.warning);
        return;
      }

      setAiCached(!!json.cached);
      setAiCachedAt(json.cachedAt || null);
      setCustomerInsights(json.customerInsights || null);
      setAIReport({
        narrativeSummary: json.narrativeSummary,
        competitiveAnalysis: json.competitiveAnalysis,
        contentAnalysis: json.contentAnalysis,
        calendarOpportunities: json.calendarOpportunities || [],
        recommendations: json.recommendations || [],
      });
    } catch (error) {
      console.error("Failed to fetch AI analysis:", error);
      setAIError("Could not load intelligence analysis. Please try again.");
    } finally {
      setAILoading(false);
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
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i}>
                <SkeletonBox $width="50%" $height="0.75rem" />
                <SkeletonBox $width="80%" $height="1rem" />
                <SkeletonBox $width="100%" $height="3rem" $radius="0.375rem" />
              </SkeletonCard>
            ))}
          </div>
        </div>
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

      {/* AI-Powered Intelligence Report */}
      <AIPanel>
        <AIPanelHeader>
          <AIPanelTitle>
            Hoppr Intelligence Report
            {aiCached && (
              <AICachedBadge>
                {aiCachedAt
                  ? `Cached ${new Date(aiCachedAt).toLocaleTimeString()}`
                  : "Cached"}
              </AICachedBadge>
            )}
          </AIPanelTitle>
          <AIRegenerateButton
            onClick={() => fetchAIAnalysis(true)}
            disabled={aiLoading}
          >
            {aiLoading ? "Analyzing..." : "🔄 Regenerate"}
          </AIRegenerateButton>
        </AIPanelHeader>

        {aiLoading && !aiReport && (
          <AILoadingContainer>
            <AILoadingSpinner />
            <span>Analyzing your bar's performance...</span>
            <span style={{ fontSize: "0.8125rem", color: "#a5b4fc" }}>
              This may take a few seconds
            </span>
          </AILoadingContainer>
        )}

        {aiError && !aiReport && (
          <AIErrorBox>
            <strong>Analysis unavailable</strong>
            <br />
            {aiError}
          </AIErrorBox>
        )}

        {aiReport && (
          <>
            <AISection>
              <AISectionLabel>Summary</AISectionLabel>
              <AISectionText>{aiReport.narrativeSummary}</AISectionText>
            </AISection>

            {aiReport.competitiveAnalysis && (
              <AISection>
                <AISectionLabel>Competitive Landscape</AISectionLabel>
                <AISectionText>{aiReport.competitiveAnalysis}</AISectionText>
              </AISection>
            )}

            {aiReport.contentAnalysis && (
              <AISection>
                <AISectionLabel>Content Performance</AISectionLabel>
                <AISectionText>{aiReport.contentAnalysis}</AISectionText>
              </AISection>
            )}

            {aiReport.calendarOpportunities.length > 0 && (
              <AISection>
                <AISectionLabel>Calendar Opportunities</AISectionLabel>
                <div>
                  {aiReport.calendarOpportunities.map((opp, i) => (
                    <AIOpportunityChip key={i}>{opp}</AIOpportunityChip>
                  ))}
                </div>
              </AISection>
            )}

            {aiReport.recommendations.length > 0 && (
              <AISection>
                <AISectionLabel>
                  Strategic Recommendations
                </AISectionLabel>
                {aiReport.recommendations.map((rec, i) => (
                  <AIRecommendationCard key={i} $priority={rec.priority}>
                    <AIRecAction>
                      {rec.priority === "high" ? "🔴 " : "🟡 "}
                      {rec.action}
                    </AIRecAction>
                    <AIRecRationale>{rec.rationale}</AIRecRationale>
                  </AIRecommendationCard>
                ))}
              </AISection>
            )}
          </>
        )}
      </AIPanel>

      {/* Your Audience — Customer-Level Analytics */}
      {customerInsights && (
        <AudiencePanel>
          <AudienceHeader>
            <AudienceTitle>
              <span>👥</span> Your Audience
            </AudienceTitle>
          </AudienceHeader>

          {/* Top-line stats */}
          <AudienceTopStats>
            <AudienceStatCard>
              <AudienceStatValue>
                {customerInsights.totalUsers.toLocaleString()}
              </AudienceStatValue>
              <AudienceStatLabel>
                Unique Visitors ({customerInsights.lookbackDays}d)
              </AudienceStatLabel>
            </AudienceStatCard>
            <AudienceStatCard>
              <AudienceStatValue>
                {customerInsights.averageEventsPerUser}
              </AudienceStatValue>
              <AudienceStatLabel>Avg Events per Visitor</AudienceStatLabel>
            </AudienceStatCard>
            <AudienceStatCard>
              <AudienceStatValue>
                {customerInsights.repeatVisitRate}%
              </AudienceStatValue>
              <AudienceStatLabel>Repeat Visit Rate (2+ events)</AudienceStatLabel>
            </AudienceStatCard>
          </AudienceTopStats>

          {/* Engagement tiers */}
          <AudienceTierGrid>
            {(
              [
                { key: "regulars" as const, data: customerInsights.regulars, label: "Regulars", desc: "4+ events" },
                { key: "occasionals" as const, data: customerInsights.occasionals, label: "Occasionals", desc: "2-3 events" },
                { key: "oneTimers" as const, data: customerInsights.oneTimers, label: "One-timers", desc: "1 event" },
              ] as const
            ).map((tier) => (
              <AudienceTierCard key={tier.key} $tier={tier.key}>
                <AudienceTierCount $tier={tier.key}>
                  {tier.data.userCount}
                </AudienceTierCount>
                <AudienceTierLabel>
                  {tier.label} ({tier.data.percentageOfTotal}%)
                </AudienceTierLabel>
                <AudienceTierDetail>
                  {tier.desc}
                  {tier.data.userCount > 0 && (
                    <>
                      <br />
                      Top: {tier.data.topContentType}
                      {tier.data.topContentType !== "mixed" &&
                        ` (${tier.data.topContentTypePercentage}%)`}
                    </>
                  )}
                </AudienceTierDetail>
              </AudienceTierCard>
            ))}
          </AudienceTierGrid>

          {/* New vs returning split */}
          <AudienceSplitSection>
            <AudienceSplitLabel>
              New vs Returning Visitors (last 30d)
            </AudienceSplitLabel>
            <AudienceSplitBar>
              <AudienceSplitSegment
                $width={customerInsights.newVisitorPercentage}
                $color="#a78bfa"
              />
              <AudienceSplitSegment
                $width={100 - customerInsights.newVisitorPercentage}
                $color="#7c3aed"
              />
            </AudienceSplitBar>
            <AudienceSplitLegend>
              <span>
                {customerInsights.newVisitors30d} New (
                {customerInsights.newVisitorPercentage}%)
              </span>
              <span>
                {customerInsights.returningVisitors30d} Returning (
                {100 - customerInsights.newVisitorPercentage}%)
              </span>
            </AudienceSplitLegend>
          </AudienceSplitSection>

          {/* Content preferences: regulars vs new visitors */}
          <AudiencePrefGrid>
            <AudiencePrefCard>
              <AudiencePrefTitle>
                Regulars' Content Preference
              </AudiencePrefTitle>
              {(["promotions", "events", "passes", "profile"] as const).map(
                (key) => {
                  const pct =
                    customerInsights.regularContentPreference[key] || 0;
                  if (pct === 0) return null;
                  return (
                    <div key={key}>
                      <AudiencePrefRow>
                        <span>
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </span>
                        <span>{pct}%</span>
                      </AudiencePrefRow>
                      <AudiencePrefBar>
                        <AudiencePrefFill $width={pct} />
                      </AudiencePrefBar>
                    </div>
                  );
                }
              )}
            </AudiencePrefCard>
            <AudiencePrefCard>
              <AudiencePrefTitle>
                New Visitors' Content Preference
              </AudiencePrefTitle>
              {(["promotions", "events", "passes", "profile"] as const).map(
                (key) => {
                  const pct =
                    customerInsights.newVisitorContentPreference[key] || 0;
                  if (pct === 0) return null;
                  return (
                    <div key={key}>
                      <AudiencePrefRow>
                        <span>
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </span>
                        <span>{pct}%</span>
                      </AudiencePrefRow>
                      <AudiencePrefBar>
                        <AudiencePrefFill $width={pct} />
                      </AudiencePrefBar>
                    </div>
                  );
                }
              )}
            </AudiencePrefCard>
          </AudiencePrefGrid>
        </AudiencePanel>
      )}

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
