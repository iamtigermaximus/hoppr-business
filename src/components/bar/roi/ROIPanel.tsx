"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import { SkeletonBox, SkeletonCard } from "@/components/ui/Skeleton";

// ---- Types ----

interface AttributionItem {
  id: string;
  name: string;
  type: "promotion" | "event" | "campaign" | "pass";
  redemptions?: number;
  joins?: number;
  scans?: number;
  spend?: number;
  impressions?: number;
  clicks?: number;
  estimatedVisits: number;
  estimatedRevenue: number;
}

interface ROIDayPoint {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  promoRedemptions: number;
  eventJoins: number;
  passScans: number;
  estimatedVisits: number;
  estimatedRevenue: number;
}

interface ROIData {
  success: boolean;
  bar: { name: string };
  period: { start: string; end: string; days: number; label: string };
  summary: {
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    promoRedemptions: number;
    eventJoins: number;
    passScans: number;
    estimatedVisits: number;
    estimatedRevenue: number;
    roi: number;
    avgCustomerSpend: number;
  };
  trend: ROIDayPoint[];
  attribution: {
    promotions: AttributionItem[];
    events: AttributionItem[];
    campaigns: AttributionItem[];
    passes: AttributionItem[];
  };
  previousPeriod?: {
    totalSpend: number;
    estimatedRevenue: number;
    roi: number;
  };
}

interface ROIPanelProps {
  barId: string;
}

// ---- Helpers ----

/** Format cents to euros */
function euros(cents: number): string {
  return `€${(cents / 100).toFixed(0)}`;
}

function eurosDecimal(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

/** ROI color: green if making money, amber if breaking even, red if losing */
function roiColor(roi: number): "green" | "amber" | "red" {
  if (roi >= 2) return "green";
  if (roi >= 1) return "amber";
  return "red";
}

/** Plain-language ROI description */
function roiDescription(roi: number, spend: number, revenue: number): string {
  if (roi === 0 && spend === 0) return "No campaign spend this period. Start a campaign to see your return.";
  if (roi === 0) return `You spent ${euros(spend)} with no confirmed visits yet. Try boosting your promos.`;
  if (roi >= 5) return `Outstanding. For every €1 you spent, you got back about €${roi.toFixed(1)} in estimated customer spend.`;
  if (roi >= 2) return `Solid returns. You're getting about €${roi.toFixed(1)} back for every €1 spent.`;
  if (roi >= 1) return `Breaking even — you're getting about as much back as you put in. A few more promos could tip this into profit.`;
  return `You're spending more than you're getting back. Focus on promos and events that bring people through the door.`;
}

/** Format date label */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fi-FI", { day: "numeric", month: "short" });
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

// ---- Hero ROI card ----

const HeroCard = styled.div<{ $roiColor: "green" | "amber" | "red" }>`
  background: white;
  border: 2px solid
    ${({ $roiColor }) =>
      $roiColor === "green" ? "#bbf7d0" : $roiColor === "amber" ? "#fde68a" : "#fecaca"};
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
  @media (max-width: 480px) { padding: 1.125rem 1rem; }
`;

const ROINumber = styled.div<{ $roiColor: "green" | "amber" | "red" }>`
  font-size: 3.5rem;
  font-weight: 800;
  color: ${({ $roiColor }) =>
    $roiColor === "green" ? "#059669" : $roiColor === "amber" ? "#d97706" : "#dc2626"};
  line-height: 1;
  margin-bottom: 0.25rem;
  @media (max-width: 768px) { font-size: 2.75rem; }
  @media (max-width: 480px) { font-size: 2.25rem; }
`;

const ROILabel = styled.div`
  font-size: 0.8125rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
  @media (max-width: 480px) { font-size: 0.75rem; }
`;

const ROIEquation = styled.div`
  font-size: 0.875rem;
  color: #9ca3af;
  margin-bottom: 0.25rem;
  @media (max-width: 480px) { font-size: 0.8125rem; }
`;

const ROIDescription = styled.p`
  font-size: 0.875rem;
  color: #4b5563;
  line-height: 1.5;
  margin: 0;
  max-width: 480px;
  margin: 0 auto;
  @media (max-width: 480px) { font-size: 0.8125rem; }
`;

// ---- Summary grid ----

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.625rem;
  margin-bottom: 1.5rem;
  @media (max-width: 768px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 480px) { grid-template-columns: 1fr 1fr; gap: 0.5rem; }
`;

const SummaryCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.625rem;
  padding: 1rem;
  @media (max-width: 480px) { padding: 0.75rem; text-align: center; }
`;

const SummaryLabel = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
  margin-bottom: 0.25rem;
  @media (max-width: 480px) { font-size: 0.6875rem; }
`;

const SummaryValue = styled.div<{ $color?: string }>`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ $color }) => $color || "#1f2937"};
  line-height: 1.2;
  @media (max-width: 480px) { font-size: 1.25rem; }
`;

const SummaryHint = styled.div`
  font-size: 0.6875rem;
  color: #d1d5db;
  margin-top: 0.125rem;
  @media (max-width: 480px) { display: none; }
`;

// ---- Section ----

const SectionTitle = styled.h2`
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.75rem;
`;

// ---- Trend mini-chart ----

const TrendCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1rem 1rem 0.5rem 1rem;
  margin-bottom: 1.5rem;
`;

const TrendBars = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 120px;
  margin-bottom: 0.5rem;
  @media (max-width: 480px) { height: 80px; }
`;

const TrendBar = styled.div<{ $height: number; $color: string }>`
  flex: 1;
  min-width: 4px;
  background: ${({ $color }) => $color};
  border-radius: 2px 2px 0 0;
  height: ${({ $height }) => Math.max($height, 2)}%;
  transition: height 0.3s;
  position: relative;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;

const TrendLabels = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.625rem;
  color: #d1d5db;
`;

// ---- Attribution ----

const AttributionCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.625rem;
  padding: 0.875rem 1rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  @media (max-width: 480px) { padding: 0.75rem; gap: 0.5rem; }
`;

const AttributionLeft = styled.div`
  flex: 1;
  min-width: 0;
`;

const AttributionName = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  @media (max-width: 480px) { font-size: 0.8125rem; }
`;

const AttributionType = styled.div`
  font-size: 0.6875rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  @media (max-width: 480px) { font-size: 0.625rem; }
`;

const AttributionRight = styled.div`
  text-align: right;
  flex-shrink: 0;
`;

const AttributionVisits = styled.div`
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1f2937;
  @media (max-width: 480px) { font-size: 0.8125rem; }
`;

const AttributionRevenue = styled.div`
  font-size: 0.75rem;
  color: #059669;
  @media (max-width: 480px) { font-size: 0.6875rem; }
`;

const AttributionEmpty = styled.div`
  font-size: 0.8125rem;
  color: #d1d5db;
  padding: 1rem;
  text-align: center;
  @media (max-width: 480px) { font-size: 0.75rem; }
`;

// ---- Config section ----

const ConfigRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  @media (max-width: 480px) { gap: 0.5rem; margin-bottom: 1rem; }
`;

const ConfigLabel = styled.label`
  font-size: 0.8125rem;
  color: #4b5563;
  font-weight: 500;
  white-space: nowrap;
  @media (max-width: 480px) { font-size: 0.75rem; }
`;

const ConfigInput = styled.input`
  width: 80px;
  padding: 0.375rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  text-align: center;
  color: #1f2937;

  &:focus {
    outline: none;
    border-color: #7c3aed;
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1);
  }
`;

const PeriodButton = styled.button<{ $active: boolean }>`
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid ${({ $active }) => ($active ? "#7c3aed" : "#d1d5db")};
  background: ${({ $active }) => ($active ? "#f5f3ff" : "white")};
  color: ${({ $active }) => ($active ? "#7c3aed" : "#6b7280")};
  transition: all 0.15s;

  &:hover {
    border-color: #7c3aed;
  }

  @media (max-width: 480px) { flex: 1; text-align: center; }
`;

// ---- Empty / loading states ----

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

export default function ROIPanel({ barId }: ROIPanelProps) {
  const [data, setData] = useState<ROIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [customerSpend, setCustomerSpend] = useState(15); // euros

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("hoppr_token")
      : null;

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    const customerSpendCents = customerSpend * 100;
    fetch(
      `/api/auth/bar/${barId}/roi?days=${days}&customerSpend=${customerSpendCents}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load ROI data");
        return r.json();
      })
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [barId, token, days, customerSpend]);

  if (loading) {
    return (
      <Container>
        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          }}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i}>
              <SkeletonBox $width="70%" $height="1.25rem" />
              <SkeletonBox $width="100%" $height="0.75rem" />
              <SkeletonBox $width="50%" $height="0.75rem" />
            </SkeletonCard>
          ))}
        </div>
      </Container>
    );
  }

  if (error || !data) {
    return (
      <Container>
        <ErrorState>
          {error || "Could not load ROI data. Try again later."}
        </ErrorState>
      </Container>
    );
  }

  const { summary, trend, attribution } = data;
  const rc = roiColor(summary.roi);

  // Max revenue for trend bar scaling
  const maxRevenue = Math.max(...trend.map((p) => p.estimatedRevenue), 1);

  return (
    <Container>
      <Header>
        <Title>Return on investment</Title>
        <Subtitle>
          {data.bar.name} · {data.period.label}
        </Subtitle>
      </Header>

      {/* Period selector */}
      <ConfigRow>
        <PeriodButton $active={days === 7} onClick={() => setDays(7)}>
          7 days
        </PeriodButton>
        <PeriodButton $active={days === 30} onClick={() => setDays(30)}>
          30 days
        </PeriodButton>
        <PeriodButton $active={days === 90} onClick={() => setDays(90)}>
          90 days
        </PeriodButton>
      </ConfigRow>

      {/* Hero ROI card */}
      <HeroCard $roiColor={rc}>
        <ROILabel>Your ROI</ROILabel>
        <ROINumber $roiColor={rc}>
          {summary.roi === 0 && summary.totalSpend === 0
            ? "—"
            : `${summary.roi}x`}
        </ROINumber>
        <ROIEquation>
          {euros(summary.totalSpend)} spent → {euros(summary.estimatedRevenue)} est. revenue
        </ROIEquation>
        <ROIDescription>
          {roiDescription(summary.roi, summary.totalSpend, summary.estimatedRevenue)}
        </ROIDescription>
      </HeroCard>

      {/* Summary grid */}
      <SummaryGrid>
        <SummaryCard>
          <SummaryLabel>Total spend</SummaryLabel>
          <SummaryValue>{euros(summary.totalSpend)}</SummaryValue>
          <SummaryHint>Campaign costs</SummaryHint>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>Est. revenue</SummaryLabel>
          <SummaryValue $color="#059669">
            {euros(summary.estimatedRevenue)}
          </SummaryValue>
          <SummaryHint>
            {summary.estimatedVisits} visits × {euros(summary.avgCustomerSpend)}/visit
          </SummaryHint>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>Confirmed visits</SummaryLabel>
          <SummaryValue>{summary.estimatedVisits}</SummaryValue>
          <SummaryHint>
            {summary.promoRedemptions} redemptions · {summary.eventJoins} event joins ·{" "}
            {summary.passScans} pass scans
          </SummaryHint>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>Impressions</SummaryLabel>
          <SummaryValue>
            {summary.totalImpressions > 999
              ? `${(summary.totalImpressions / 1000).toFixed(1)}k`
              : summary.totalImpressions}
          </SummaryValue>
          <SummaryHint>
            {summary.totalClicks} clicks
          </SummaryHint>
        </SummaryCard>
      </SummaryGrid>

      {/* Customer spend config */}
      <ConfigRow>
        <ConfigLabel htmlFor="customerSpend">
          Average customer spend:
        </ConfigLabel>
        <ConfigInput
          id="customerSpend"
          type="number"
          min={1}
          max={200}
          value={customerSpend}
          onChange={(e) => setCustomerSpend(parseInt(e.target.value) || 15)}
        />
        <span style={{ fontSize: "0.8125rem", color: "#9ca3af" }}>
          € per person (default: Helsinki bar avg)
        </span>
      </ConfigRow>

      {/* Revenue trend chart */}
      <SectionTitle>Daily estimated revenue</SectionTitle>
      <TrendCard>
        <TrendBars>
          {trend.map((point) => {
            const height = maxRevenue > 0
              ? (point.estimatedRevenue / maxRevenue) * 100
              : 0;
            const color =
              point.estimatedRevenue > 0 ? "#7c3aed" : "#e5e7eb";
            return (
              <TrendBar
                key={point.date}
                $height={height}
                $color={color}
                title={`${formatDate(point.date)}: ${euros(point.estimatedRevenue)}`}
              />
            );
          })}
        </TrendBars>
        <TrendLabels>
          <span>{formatDate(trend[0]?.date || "")}</span>
          <span>{formatDate(trend[trend.length - 1]?.date || "")}</span>
        </TrendLabels>
      </TrendCard>

      {/* Attribution: what drove the results */}
      <SectionTitle>What drove your results</SectionTitle>

      {attribution.campaigns.length > 0 && (
        <>
          <AttributionType>Campaigns</AttributionType>
          {attribution.campaigns.map((c) => (
            <AttributionCard key={c.id}>
              <AttributionLeft>
                <AttributionName>{c.name}</AttributionName>
                <AttributionType>
                  {c.clicks ?? 0} clicks · {c.impressions ?? 0} impressions ·{" "}
                  {euros(c.spend ?? 0)} spent
                </AttributionType>
              </AttributionLeft>
              <AttributionRight>
                <AttributionVisits>{c.estimatedVisits} visits</AttributionVisits>
                <AttributionRevenue>
                  {euros(c.estimatedRevenue)} est.
                </AttributionRevenue>
              </AttributionRight>
            </AttributionCard>
          ))}
        </>
      )}

      {attribution.promotions.length > 0 && (
        <>
          <AttributionType style={{ marginTop: "1rem" }}>Promotions</AttributionType>
          {attribution.promotions.map((p) => (
            <AttributionCard key={p.id}>
              <AttributionLeft>
                <AttributionName>{p.name}</AttributionName>
                <AttributionType>
                  {p.redemptions ?? 0} redemptions
                </AttributionType>
              </AttributionLeft>
              <AttributionRight>
                <AttributionVisits>{p.estimatedVisits} visits</AttributionVisits>
                <AttributionRevenue>
                  {euros(p.estimatedRevenue)} est.
                </AttributionRevenue>
              </AttributionRight>
            </AttributionCard>
          ))}
        </>
      )}

      {attribution.events.length > 0 && (
        <>
          <AttributionType style={{ marginTop: "1rem" }}>Events</AttributionType>
          {attribution.events.map((e) => (
            <AttributionCard key={e.id}>
              <AttributionLeft>
                <AttributionName>{e.name}</AttributionName>
                <AttributionType>
                  {e.joins ?? 0} joined
                </AttributionType>
              </AttributionLeft>
              <AttributionRight>
                <AttributionVisits>{e.estimatedVisits} visits</AttributionVisits>
                <AttributionRevenue>
                  {euros(e.estimatedRevenue)} est.
                </AttributionRevenue>
              </AttributionRight>
            </AttributionCard>
          ))}
        </>
      )}

      {attribution.passes.length > 0 && (
        <>
          <AttributionType style={{ marginTop: "1rem" }}>VIP Passes</AttributionType>
          {attribution.passes.map((p) => (
            <AttributionCard key={p.id}>
              <AttributionLeft>
                <AttributionName>{p.name}</AttributionName>
                <AttributionType>
                  {p.scans ?? 0} scans
                </AttributionType>
              </AttributionLeft>
              <AttributionRight>
                <AttributionVisits>{p.estimatedVisits} visits</AttributionVisits>
                <AttributionRevenue>
                  {euros(p.estimatedRevenue)} est.
                </AttributionRevenue>
              </AttributionRight>
            </AttributionCard>
          ))}
        </>
      )}

      {attribution.promotions.length === 0 &&
        attribution.events.length === 0 &&
        attribution.campaigns.length === 0 &&
        attribution.passes.length === 0 && (
          <AttributionEmpty>
            No attributed visits yet. When customers redeem promos, join events,
            or scan passes, you'll see a breakdown here.
          </AttributionEmpty>
        )}
    </Container>
  );
}
