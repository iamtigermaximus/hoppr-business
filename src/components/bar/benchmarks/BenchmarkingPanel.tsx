"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";

// ---- Types ----

interface MetricComparison {
  metric: string;
  label: string;
  yourValue: number;
  peerAverage: number;
  peerMedian: number;
  peerTop20: number;
  percentile: number;
  direction: "higher-is-better" | "lower-is-better";
}

interface Recommendation {
  metric: string;
  severity: "warning" | "opportunity" | "strength";
  message: string;
  actionLabel: string;
  actionRoute: string;
}

interface BenchmarkData {
  success: boolean;
  bar: {
    name: string;
    type: string;
    district: string;
    priceRange: string;
  };
  peerGroup: {
    totalBars: number;
    segmentBy: string[];
  };
  comparisons: MetricComparison[];
  recommendations: Recommendation[];
}

interface BenchmarkingPanelProps {
  barId: string;
}

// ---- Helpers ----

/** Convert percentile to plain language */
function plainRank(percentile: number, totalBars: number): string {
  if (percentile >= 90) return `Better than ${totalBars - 1} out of ${totalBars} bars`;
  if (percentile >= 80) return `Better than ${Math.floor(totalBars * 0.8)} out of ${totalBars} bars`;
  if (percentile >= 60) return `Above most bars in your area`;
  if (percentile >= 40) return `About average for your area`;
  if (percentile >= 20) return `A bit below most bars nearby`;
  return `Behind most bars in your area`;
}

/** Traffic light category */
function light(percentile: number): "green" | "amber" | "red" {
  if (percentile >= 70) return "green";
  if (percentile >= 30) return "amber";
  return "red";
}

/** Real-world translation of the number */
function humanTranslation(metric: string, value: number, avg: number): string {
  if (value === 0 && avg > 0) {
    if (metric === "activeEvents") return "You have no upcoming events. Most bars have at least 1.";
    if (metric === "followerGrowth") return "No new followers this week. Time to post something.";
    if (metric === "eventJoins") return "Nobody has joined your events. Try promoting them earlier.";
    return "Nothing yet. Get started and you'll see results.";
  }
  switch (metric) {
    case "promoViews":
      return value > avg
        ? `Your promos get seen ${Math.round((value / avg) * 10) / 10}x more than a typical bar. That's like having a line outside on a Tuesday.`
        : `About ${value} views — that's like ${Math.round(value / 30)} people checking your promos every day.`;
    case "eventJoins":
      return value > avg
        ? `That's about ${value} people coming to your events. A solid crowd.`
        : `That's about ${Math.round(value)} people per event. Post events earlier to fill more seats.`;
    case "barViews":
      return `About ${Math.round(value / 30)} people view your profile daily — that's your digital storefront traffic.`;
    case "followerGrowth":
      return value >= 5
        ? `+${value} new followers this week. These are people who want to hear from you.`
        : value > 0
        ? `+${value} this week. Regular posting usually brings +${Math.round(avg) || 5}+ weekly.`
        : "No growth this week. Followers come when you post events and promos regularly.";
    case "activeEvents":
      return value === 0
        ? "You have nothing upcoming. Even 1 event per week doubles your visibility."
        : value === 1
        ? "1 event live. Bars with 2+ events get 3x more profile visits."
        : `${value} events live — you're keeping your bar top of mind.`;
    default:
      return "";
  }
}

// ---- Styled Components ----

const Container = styled.div`
  padding: 1.5rem 0;
  max-width: 820px;
  margin: 0 auto;
  width: 100%;
  @media (max-width: 768px) { padding: 1.25rem 1rem; }
  @media (max-width: 480px) { padding: 1rem 0.75rem; }
`;

const Header = styled.div`
  margin-bottom: 1.5rem;
`;

const Title = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
  @media (max-width: 480px) { font-size: 1.375rem; }
`;

const Subtitle = styled.p`
  color: #6b7280;
  font-size: 0.9375rem;
  margin: 0;
  @media (max-width: 480px) { font-size: 0.8125rem; }
`;

// ---- Summary strip ----

const SummaryStrip = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

const SummaryPill = styled.div<{ $light: "green" | "amber" | "red" }>`
  padding: 0.5rem 0.875rem;
  border-radius: 2rem;
  font-size: 0.8125rem;
  font-weight: 600;
  background: ${({ $light }) =>
    $light === "green" ? "#dcfce7" : $light === "amber" ? "#fef3c7" : "#fee2e2"};
  color: ${({ $light }) =>
    $light === "green" ? "#166534" : $light === "amber" ? "#92400e" : "#991b1b"};
  @media (max-width: 480px) { font-size: 0.75rem; padding: 0.375rem 0.625rem; }
`;

const PeerContext = styled.div`
  font-size: 0.8125rem;
  color: #9ca3af;
  margin-bottom: 1.5rem;
  @media (max-width: 480px) { font-size: 0.75rem; margin-bottom: 1rem; }
`;

// ---- Primary recommendation ----

const PrimaryRec = styled.div<{ $severity: "warning" | "opportunity" | "strength" }>`
  padding: 1.25rem 1.5rem;
  border-radius: 0.875rem;
  margin-bottom: 1.5rem;
  border: 1px solid
    ${({ $severity }) =>
      $severity === "warning" ? "#fecaca" : $severity === "opportunity" ? "#fde68a" : "#bbf7d0"};
  background: ${({ $severity }) =>
    $severity === "warning" ? "#fef2f2" : $severity === "opportunity" ? "#fffbeb" : "#f0fdf4"};
  @media (max-width: 480px) { padding: 1rem 1.125rem; }
`;

const PrimaryRecLabel = styled.div<{ $severity: string }>`
  font-size: 0.8125rem;
  font-weight: 700;
  margin-bottom: 0.375rem;
  color: ${({ $severity }) =>
    $severity === "warning" ? "#dc2626" : $severity === "opportunity" ? "#d97706" : "#059669"};
  @media (max-width: 480px) { font-size: 0.75rem; }
`;

const PrimaryRecText = styled.p`
  font-size: 0.9375rem;
  color: #1f2937;
  line-height: 1.5;
  margin: 0 0 0.875rem 0;
  @media (max-width: 480px) { font-size: 0.8125rem; margin-bottom: 0.75rem; }
`;

const PrimaryRecBtn = styled.button<{ $severity: string }>`
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  background: ${({ $severity }) =>
    $severity === "warning" ? "#dc2626" : $severity === "opportunity" ? "#d97706" : "#059669"};
  color: white;
  transition: all 0.15s;

  &:hover {
    opacity: 0.9;
  }

  @media (max-width: 480px) { width: 100%; text-align: center; }
`;

// ---- Metric cards ----

const SectionTitle = styled.h2`
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.75rem;
`;

const MetricsGrid = styled.div`
  display: grid;
  gap: 0.5rem;
`;

const MetricCard = styled.div<{ $light: "green" | "amber" | "red" }>`
  background: white;
  border: 1px solid
    ${({ $light }) =>
      $light === "green" ? "#bbf7d0" : $light === "amber" ? "#fde68a" : "#fecaca"};
  border-left: 4px solid
    ${({ $light }) =>
      $light === "green" ? "#16a34a" : $light === "amber" ? "#d97706" : "#dc2626"};
  border-radius: 0.625rem;
  padding: 0.875rem 1rem;
  @media (max-width: 480px) { padding: 0.75rem; }
`;

const MetricHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  @media (max-width: 480px) { flex-direction: column; align-items: flex-start; gap: 0.25rem; }
`;

const MetricName = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  @media (max-width: 480px) { font-size: 0.8125rem; }
`;

const MetricRank = styled.div<{ $light: "green" | "amber" | "red" }>`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ $light }) =>
    $light === "green" ? "#166534" : $light === "amber" ? "#92400e" : "#991b1b"};
  @media (max-width: 480px) { font-size: 0.6875rem; }
`;

const MetricNumbers = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
  flex-wrap: wrap;
`;

const MetricYourNumber = styled.span<{ $light: string }>`
  font-size: 1.5rem;
  font-weight: 800;
  color: ${({ $light }) =>
    $light === "green" ? "#16a34a" : $light === "amber" ? "#d97706" : "#dc2626"};
  line-height: 1;
  @media (max-width: 480px) { font-size: 1.25rem; }
`;

const MetricVs = styled.span`
  font-size: 0.75rem;
  color: #9ca3af;
`;

const MetricAvgNumber = styled.span`
  font-size: 0.9375rem;
  font-weight: 600;
  color: #6b7280;
  @media (max-width: 480px) { font-size: 0.8125rem; }
`;

const MetricTranslation = styled.p`
  font-size: 0.8125rem;
  color: #6b7280;
  line-height: 1.4;
  margin: 0;
  @media (max-width: 480px) { font-size: 0.75rem; }
`;

// ---- Empty state ----

const LoadingState = styled.div`
  text-align: center;
  padding: 4rem 1rem;
  color: #9ca3af;
  font-size: 0.9375rem;
`;

const ErrorState = styled.div`
  text-align: center;
  padding: 4rem 1rem;
  color: #dc2626;
  font-size: 0.9375rem;
`;

// ---- Component ----

export default function BenchmarkingPanel({ barId }: BenchmarkingPanelProps) {
  const router = useRouter();
  const [data, setData] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("hoppr_token")
      : null;

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`/api/auth/bar/${barId}/benchmarks`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load benchmarks");
        return r.json();
      })
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [barId, token]);

  if (loading) {
    return (
      <Container>
        <LoadingState>Loading your benchmarks...</LoadingState>
      </Container>
    );
  }

  if (error || !data) {
    return (
      <Container>
        <ErrorState>
          {error || "Could not load benchmarking data. Try again later."}
        </ErrorState>
      </Container>
    );
  }

  // Sort comparisons: red first, then amber, then green
  const sorted = [...data.comparisons].sort((a, b) => {
    const order = { red: 0, amber: 1, green: 2 };
    return order[light(a.percentile)] - order[light(b.percentile)];
  });

  // Count by traffic light
  const counts = {
    green: data.comparisons.filter((c) => light(c.percentile) === "green").length,
    amber: data.comparisons.filter((c) => light(c.percentile) === "amber").length,
    red: data.comparisons.filter((c) => light(c.percentile) === "red").length,
  };

  // Primary recommendation: the first warning, or first opportunity, or first strength
  const primaryRec = data.recommendations[0] ?? null;

  return (
    <Container>
      <Header>
        <Title>How {data.bar.name} compares</Title>
        <Subtitle>
          Measured against {data.peerGroup.totalBars} similar bars in{" "}
          {data.bar.district || "your area"}
        </Subtitle>
      </Header>

      {/* Traffic light summary */}
      <SummaryStrip>
        {counts.green > 0 && (
          <SummaryPill $light="green">🟢 {counts.green} doing well</SummaryPill>
        )}
        {counts.amber > 0 && (
          <SummaryPill $light="amber">🟡 {counts.amber} about average</SummaryPill>
        )}
        {counts.red > 0 && (
          <SummaryPill $light="red">🔴 {counts.red} need work</SummaryPill>
        )}
      </SummaryStrip>

      <PeerContext>
        Compared to bars with similar {data.peerGroup.segmentBy.map((s) => s.toLowerCase()).join(", ")}
      </PeerContext>

      {/* Primary recommendation — the one thing to do */}
      {primaryRec && (
        <PrimaryRec $severity={primaryRec.severity}>
          <PrimaryRecLabel $severity={primaryRec.severity}>
            {primaryRec.severity === "warning"
              ? "🔴 The one thing to fix"
              : primaryRec.severity === "opportunity"
              ? "💡 Your best opportunity"
              : "✅ Your biggest strength"}
          </PrimaryRecLabel>
          <PrimaryRecText>{primaryRec.message}</PrimaryRecText>
          <PrimaryRecBtn
            $severity={primaryRec.severity}
            onClick={() =>
              router.push(`/bar/${barId}${primaryRec.actionRoute}`)
            }
          >
            {primaryRec.actionLabel} →
          </PrimaryRecBtn>
        </PrimaryRec>
      )}

      {/* Metric cards — sorted by urgency */}
      <SectionTitle>Your numbers vs bars nearby</SectionTitle>
      <MetricsGrid>
        {sorted.map((c) => {
          const l = light(c.percentile);
          const rank = plainRank(c.percentile, data.peerGroup.totalBars);
          const translation = humanTranslation(c.metric, c.yourValue, c.peerAverage);

          return (
            <MetricCard key={c.metric} $light={l}>
              <MetricHead>
                <MetricName>{c.label}</MetricName>
                <MetricRank $light={l}>{rank}</MetricRank>
              </MetricHead>

              <MetricNumbers>
                <MetricYourNumber $light={l}>
                  {c.yourValue === 0 ? "—" : c.yourValue}
                </MetricYourNumber>
                <MetricVs>vs</MetricVs>
                <MetricAvgNumber>
                  {c.peerAverage} avg
                </MetricAvgNumber>
              </MetricNumbers>

              <MetricTranslation>{translation}</MetricTranslation>
            </MetricCard>
          );
        })}
      </MetricsGrid>
    </Container>
  );
}
