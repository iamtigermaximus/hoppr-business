"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { ArrowUpDown, Eye, MousePointerClick, CheckCircle, ExternalLink, Flame, Trophy, Download } from "lucide-react";
import { downloadCSV } from "@/lib/csv-export";

// ── Styled Components ────────────────────────────────────────────

const Panel = styled.div`
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const PanelHeader = styled.div`
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const PanelTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const FilterRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
`;

const FilterSelect = styled.select`
  padding: 0.4rem 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  font-size: 0.8rem;
  color: #374151;
`;

const InsightsBox = styled.div`
  margin: 0 1.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%);
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  margin-top: 1rem;
`;

const InsightLine = styled.div`
  font-size: 0.85rem;
  color: #1e40af;
  line-height: 1.5;
  & + & {
    margin-top: 0.25rem;
  }
`;

const TableWrapper = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  min-width: 700px;
  border-collapse: collapse;
`;

const Th = styled.th<{ $sortable?: boolean }>`
  background: #f8f9fa;
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.8rem;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
  ${(p) => p.$sortable && "cursor: pointer; user-select: none;"}
  &:hover {
    ${(p) => p.$sortable && "background: #f1f5f9;"}
  }
`;

const Td = styled.td`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
  font-size: 0.85rem;
  vertical-align: middle;
`;

const ContentTitle = styled.div`
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

const ContentMeta = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.15rem;
`;

const TypeBadge = styled.span<{ $type: string }>`
  display: inline-block;
  padding: 0.15rem 0.4rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  background: ${(p) =>
    p.$type === "promotion" ? "#dbeafe" : p.$type === "event" ? "#fce7f3" : "#d1fae5"};
  color: ${(p) =>
    p.$type === "promotion" ? "#1e40af" : p.$type === "event" ? "#9d174d" : "#065f46"};
`;

const TopBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.15rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
  font-weight: 700;
  background: #fef3c7;
  color: #92400e;
`;

const ConversionBadge = styled.span<{ $high: boolean }>`
  font-weight: 700;
  color: ${(p) => (p.$high ? "#059669" : "#6b7280")};
`;

const ResurfaceButton = styled.button`
  padding: 0.3rem 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 0.3rem;
  background: white;
  color: #374151;
  font-size: 0.75rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  white-space: nowrap;
  &:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
  }
`;

const SortIcon = styled.span`
  display: inline-block;
  margin-left: 0.25rem;
  font-size: 0.7rem;
  opacity: 0.5;
`;

const ExportButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 0.3rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  &:hover { background: #059669; }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 2rem;
`;

const EmptyTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const EmptyDesc = styled.p`
  color: #6b7280;
  font-size: 0.85rem;
  max-width: 400px;
  margin: 0 auto;
`;

const Spinner = styled.div`
  width: 28px;
  height: 28px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
`;

// ── Types ────────────────────────────────────────────────────────

interface ContentItem {
  contentId: string;
  contentType: "promotion" | "event" | "pass";
  title: string;
  publishedAt: string | null;
  endDate: string | null;
  imageUrl: string | null;
  category: string | null;
  isActive: boolean;
  views: number;
  clicks: number;
  redemptions: number;
  conversionRate: number;
  engagementRate: number;
  uniqueUsers: number;
  retargetingSent?: number;
  retargetingConfigured?: boolean;
  retargetingRule?: string | null;
}

interface ContentData {
  cachedAt: string;
  period: string;
  days: number;
  contentType: string;
  totalItems: number;
  topPerformer: string | null;
  items: ContentItem[];
}

type SortField = "views" | "clicks" | "redemptions" | "conversionRate" | "engagementRate" | "publishedAt";
type SortDir = "asc" | "desc";

// ── Helpers ──────────────────────────────────────────────────────

function formatNum(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toLocaleString();
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function getRedemptionLabel(contentType: string): string {
  switch (contentType) {
    case "promotion":
      return "Redemptions";
    case "event":
      return "RSVPs";
    case "pass":
      return "Purchases";
    default:
      return "Conversions";
  }
}

function getContentTypeLabel(type: string): string {
  switch (type) {
    case "promotion":
      return "Promo";
    case "event":
      return "Event";
    case "pass":
      return "Pass";
    default:
      return type;
  }
}

// ── Insights Generator ───────────────────────────────────────────

function generateInsights(items: ContentItem[]): string[] {
  if (items.length < 2) return [];

  const insights: string[] = [];
  const sorted = [...items].sort((a, b) => b.conversionRate - a.conversionRate);
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];

  // Top performer insight
  if (top.conversionRate > 0) {
    insights.push(
      `"${top.title}" is your top performer with a ${top.conversionRate}% conversion rate — ${Math.round(top.conversionRate / (bottom.conversionRate || 1) * 10) / 10}x more than your lowest.`,
    );
  }

  // Content type comparison
  const promos = items.filter((i) => i.contentType === "promotion");
  const events = items.filter((i) => i.contentType === "event");
  if (promos.length > 0 && events.length > 0) {
    const avgPromoRate =
      promos.reduce((s, i) => s + i.conversionRate, 0) / promos.length;
    const avgEventRate =
      events.reduce((s, i) => s + i.conversionRate, 0) / events.length;
    if (avgPromoRate > avgEventRate * 1.2 && promos.length >= 2) {
      insights.push(
        `Your promotions average ${Math.round(avgPromoRate * 10) / 10}% conversion vs ${Math.round(avgEventRate * 10) / 10}% for events — promos drive more action.`,
      );
    } else if (avgEventRate > avgPromoRate * 1.2 && events.length >= 2) {
      insights.push(
        `Your events average ${Math.round(avgEventRate * 10) / 10}% RSVP rate vs ${Math.round(avgPromoRate * 10) / 10}% promo conversion — events drive more engagement.`,
      );
    }
  }

  // Volume leader
  const mostViewed = [...items].sort((a, b) => b.views - a.views)[0];
  if (mostViewed && mostViewed.contentId !== top.contentId) {
    insights.push(
      `"${mostViewed.title}" gets the most views (${formatNum(mostViewed.views)}) but converts at ${mostViewed.conversionRate}% — consider refreshing its copy or image.`,
    );
  }

  return insights;
}

// ── Component ────────────────────────────────────────────────────

interface Props {
  barId: string;
}

export default function ContentPerformancePanel({ barId }: Props) {
  const router = useRouter();
  const [data, setData] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contentFilter, setContentFilter] = useState<"all" | "promotion" | "event" | "pass">("all");
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const [sortField, setSortField] = useState<SortField>("conversionRate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

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
          `/api/auth/bar/${barId}/analytics/content?range=${timeRange}&type=${contentFilter}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [barId, timeRange, contentFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const handleResurface = (item: ContentItem) => {
    const type = item.contentType;
    // Navigate to the creation flow with the content type and a resurface param
    // The creation flow would need to handle ?resurface=contentId to pre-fill
    router.push(`/bar/${barId}/create?type=${encodeURIComponent(type)}&resurface=${encodeURIComponent(item.contentId)}`);
  };

  const sortedItems = data?.items
    ? [...data.items].sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortDir === "desc"
            ? bVal.localeCompare(aVal)
            : aVal.localeCompare(bVal);
        }
        const aNum = typeof aVal === "number" ? aVal : 0;
        const bNum = typeof bVal === "number" ? bVal : 0;
        return sortDir === "desc" ? bNum - aNum : aNum - bNum;
      })
    : [];

  const insights = data?.items ? generateInsights(data.items) : [];

  const handleExport = () => {
    if (!sortedItems.length) return;
    downloadCSV(`hoppr-content-performance-${timeRange}`, [
      {
        name: "Content Performance",
        headers: ["Content", "Type", "Views", "Clicks", getRedemptionLabel(contentFilter), "Conv. Rate", "Published", "Status"],
        rows: sortedItems.map((item) => [
          item.title,
          item.contentType,
          item.views,
          item.clicks,
          item.redemptions,
          item.conversionRate + "%",
          item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("en-GB") : "—",
          item.isActive ? "Active" : "Ended",
        ]),
      },
    ]);
  };

  // ── Render ────────────────────────────────────────────────────

  if (loading) {
    return (
      <Panel>
        <LoadingState>
          <Spinner />
          <span>Loading content performance...</span>
        </LoadingState>
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel>
        <EmptyState>
          <EmptyTitle>Unable to load content analytics</EmptyTitle>
          <EmptyDesc>{error}</EmptyDesc>
        </EmptyState>
      </Panel>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <Panel>
        <PanelHeader>
          <PanelTitle>Content Performance</PanelTitle>
          <FilterRow>
            <FilterSelect
              value={contentFilter}
              onChange={(e) =>
                setContentFilter(e.target.value as "all" | "promotion" | "event" | "pass")
              }
            >
              <option value="all">All Content</option>
              <option value="promotion">Promotions</option>
              <option value="event">Events</option>
              <option value="pass">Passes</option>
            </FilterSelect>
            <FilterSelect
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as "7d" | "30d" | "90d")}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </FilterSelect>
            <ExportButton onClick={handleExport}>
              <Download size={13} />
              CSV
            </ExportButton>
          </FilterRow>
        </PanelHeader>
        <EmptyState>
          <EmptyTitle>No content performance data yet</EmptyTitle>
          <EmptyDesc>
            Performance data will appear here once your content starts getting views, clicks, and conversions from users on Hoppr.
          </EmptyDesc>
        </EmptyState>
      </Panel>
    );
  }

  const SortHeader = ({
    field,
    label,
  }: {
    field: SortField;
    label: string;
  }) => (
    <Th $sortable onClick={() => handleSort(field)}>
      {label}
      <SortIcon>
        {sortField === field ? (sortDir === "desc" ? "▾" : "▴") : "▿"}
      </SortIcon>
    </Th>
  );

  return (
    <div>
      <Panel>
        <PanelHeader>
          <PanelTitle>Content Performance</PanelTitle>
          <FilterRow>
            <FilterSelect
              value={contentFilter}
              onChange={(e) =>
                setContentFilter(e.target.value as "all" | "promotion" | "event" | "pass")
              }
            >
              <option value="all">All Content</option>
              <option value="promotion">Promotions</option>
              <option value="event">Events</option>
              <option value="pass">Passes</option>
            </FilterSelect>
            <FilterSelect
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as "7d" | "30d" | "90d")}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </FilterSelect>
            <ExportButton onClick={handleExport}>
              <Download size={13} />
              CSV
            </ExportButton>
          </FilterRow>
        </PanelHeader>

        {insights.length > 0 && (
          <InsightsBox>
            <div style={{ fontWeight: 700, fontSize: "0.8rem", marginBottom: "0.4rem", color: "#1e40af" }}>
              What&apos;s working
            </div>
            {insights.map((insight, i) => (
              <InsightLine key={i}>{insight}</InsightLine>
            ))}
          </InsightsBox>
        )}

        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <Th>Content</Th>
                <Th>Type</Th>
                <SortHeader field="views" label="Views" />
                <SortHeader field="clicks" label="Clicks" />
                <SortHeader field="redemptions" label={getRedemptionLabel(contentFilter)} />
                <SortHeader field="conversionRate" label="Conv. Rate" />
                <SortHeader field="publishedAt" label="Published" />
                <Th>Retargeting</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item) => (
                <tr key={item.contentId}>
                  <Td>
                    <ContentTitle>
                      {item.contentId === data.topPerformer && (
                        <TopBadge>
                          <Trophy size={10} /> Top
                        </TopBadge>
                      )}
                      {item.title}
                      {!item.isActive && (
                        <span style={{ color: "#9ca3af", fontSize: "0.7rem" }}>(ended)</span>
                      )}
                    </ContentTitle>
                    <ContentMeta>
                      {item.category && `${item.category} · `}
                      {formatDate(item.publishedAt)}
                      {item.endDate && ` → ${formatDate(item.endDate)}`}
                    </ContentMeta>
                  </Td>
                  <Td>
                    <TypeBadge $type={item.contentType}>
                      {getContentTypeLabel(item.contentType)}
                    </TypeBadge>
                  </Td>
                  <Td>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <Eye size={12} style={{ color: "#9ca3af" }} />
                      {formatNum(item.views)}
                    </span>
                  </Td>
                  <Td>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <MousePointerClick size={12} style={{ color: "#9ca3af" }} />
                      {item.clicks || "—"}
                    </span>
                  </Td>
                  <Td>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <CheckCircle size={12} style={{ color: "#9ca3af" }} />
                      {formatNum(item.redemptions)}
                    </span>
                  </Td>
                  <Td>
                    <ConversionBadge $high={item.conversionRate >= 10}>
                      {item.conversionRate}%
                    </ConversionBadge>
                  </Td>
                  <Td style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                    {formatDate(item.publishedAt)}
                  </Td>
                  <Td>
                    {item.retargetingConfigured ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <span style={{
                          display: "inline-block",
                          width: 8, height: 8,
                          borderRadius: "50%",
                          background: (item.retargetingSent ?? 0) > 0 ? "#10b981" : "#f59e0b",
                        }} />
                        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}>
                          {item.retargetingSent} sent
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>—</span>
                    )}
                  </Td>
                  <Td>
                    <ResurfaceButton onClick={() => handleResurface(item)}>
                      <ExternalLink size={12} />
                      Resurface
                    </ResurfaceButton>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrapper>
      </Panel>

    </div>
  );
}
