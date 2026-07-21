"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";

// ---- Types ----

interface PerformanceInsight {
  type: "top_performer" | "underperformer" | "rising_trend" | "untapped_opportunity";
  category: string;
  ingredient: string;
  label: string;
  multiplier: number;
  sampleSize: number;
  recommendation: string;
}

interface InsightsResponse {
  insights: PerformanceInsight[];
  meta: {
    lookbackDays: number;
    insightCount: number;
    hasSufficientData: boolean;
  };
}

// ---- Styled Components ----

const Panel = styled.div`
  background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
  border: 1px solid #bbf7d0;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  margin-top: 0.5rem;
  font-size: 0.8125rem;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const Title = styled.span`
  font-weight: 700;
  color: #065f46;
  font-size: 0.8125rem;
`;

const Badge = styled.span`
  background: #d1fae5;
  color: #047857;
  padding: 0.125rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.6875rem;
  font-weight: 600;
`;

const InsightCard = styled.div`
  background: white;
  border: 1px solid #d1fae5;
  border-radius: 0.375rem;
  padding: 0.5rem 0.625rem;
  margin-bottom: 0.375rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const InsightLabel = styled.div`
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.125rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
`;

const InsightTag = styled.span<{ $type: string }>`
  font-size: 0.625rem;
  padding: 0.0625rem 0.375rem;
  border-radius: 0.25rem;
  font-weight: 600;
  text-transform: uppercase;
  background: ${({ $type }) =>
    $type === "top_performer" ? "#dcfce7" :
    $type === "underperformer" ? "#fef2f2" :
    $type === "rising_trend" ? "#dbeafe" :
    "#fef9c3"};
  color: ${({ $type }) =>
    $type === "top_performer" ? "#166534" :
    $type === "underperformer" ? "#991b1b" :
    $type === "rising_trend" ? "#1e40af" :
    "#854d0e"};
`;

const Multiplier = styled.span<{ $value: number }>`
  font-size: 0.6875rem;
  font-weight: 700;
  color: ${({ $value }) => ($value > 1 ? "#059669" : "#dc2626")};
`;

const InsightMeta = styled.div`
  font-size: 0.6875rem;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Recommendation = styled.div`
  font-size: 0.75rem;
  color: #374151;
  margin-top: 0.25rem;
  line-height: 1.35;
`;

const LoadingText = styled.div`
  color: #6b7280;
  font-size: 0.75rem;
  text-align: center;
  padding: 0.5rem;
`;

// ---- Type labels ----

const TYPE_LABELS: Record<string, string> = {
  top_performer: "Best",
  underperformer: "Avoid",
  rising_trend: "Trending",
  untapped_opportunity: "Try",
};

// ---- Component ----

interface PerformanceInsightsPanelProps {
  barId: string;
  token: string;
}

export default function PerformanceInsightsPanel({
  barId,
  token,
}: PerformanceInsightsPanelProps) {
  const [insights, setInsights] = useState<PerformanceInsight[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchInsights() {
      try {
        const res = await fetch(
          `/api/auth/bar/${barId}/create/performance-insights?lookbackDays=90`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok || cancelled) return;
        const data: InsightsResponse = await res.json();
        if (!cancelled) {
          setInsights(data.insights ?? []);
        }
      } catch {
        // Silently fail — insights are non-critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchInsights();
    return () => { cancelled = true; };
  }, [barId, token]);

  // Don't render anything if loading or no data
  if (loading) return null;
  if (!insights || insights.length === 0) return null;

  return (
    <Panel>
      <Header>
        <Title>
          Performance Insights
        </Title>
        <Badge>
          {insights.length} signal{insights.length !== 1 ? "s" : ""}
        </Badge>
      </Header>
      {insights.slice(0, 3).map((insight, i) => (
        <InsightCard key={`${insight.category}-${insight.ingredient}-${i}`}>
          <InsightLabel>
            {insight.label}
            <InsightTag $type={insight.type}>
              {TYPE_LABELS[insight.type] ?? insight.type}
            </InsightTag>
          </InsightLabel>
          <InsightMeta>
            <Multiplier $value={insight.multiplier}>
              {insight.multiplier.toFixed(2)}x
            </Multiplier>
            <span>{insight.sampleSize} sample{insight.sampleSize !== 1 ? "s" : ""}</span>
          </InsightMeta>
          <Recommendation>
            {insight.recommendation}
          </Recommendation>
        </InsightCard>
      ))}
    </Panel>
  );
}
