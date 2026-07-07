"use client";

import { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { SkeletonBox, SkeletonCard } from "@/components/ui/Skeleton";

// ---- Styled Components ----

const Container = styled.div`
  padding: 1.5rem;
  max-width: 1000px;
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
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const CountBadge = styled.span<{ $hasItems: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  border-radius: 14px;
  font-size: 0.875rem;
  font-weight: 700;
  padding: 0 0.5rem;
  background: ${({ $hasItems }) => ($hasItems ? "#fef3c7" : "#f3f4f6")};
  color: ${({ $hasItems }) => ($hasItems ? "#92400e" : "#9ca3af")};
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

// Section
const Section = styled.div`
  margin-bottom: 2rem;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.0625rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const SectionCount = styled.span`
  font-size: 0.8125rem;
  color: #6b7280;
  font-weight: 500;
`;

// Approval cards
const ApprovalList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
`;

const ApprovalCard = styled.div`
  background: white;
  border-radius: 0.5rem;
  padding: 1rem 1.25rem;
  border: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  transition: box-shadow 0.2s, opacity 0.3s, transform 0.3s;
  flex-wrap: wrap;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
`;

const ItemInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ItemTitle = styled.div`
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
`;

const ItemMeta = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const typeBadgeStyle = ($type: string) => {
  switch ($type) {
    case "promotion":
      return { bg: "#dbeafe", color: "#1e40af" };
    case "event":
      return { bg: "#ede9fe", color: "#7c3aed" };
    case "pass":
      return { bg: "#d1fae5", color: "#065f46" };
    case "ad":
      return { bg: "#fef3c7", color: "#92400e" };
    default:
      return { bg: "#f3f4f6", color: "#6b7280" };
  }
};

const ItemTypeBadge = styled.span<{ $type: string }>`
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  background: ${({ $type }) => typeBadgeStyle($type).bg};
  color: ${({ $type }) => typeBadgeStyle($type).color};
`;

const ActionGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
`;

const ApproveButton = styled.button`
  padding: 0.5rem 1rem;
  background: #16a34a;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: #15803d;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const RejectButton = styled.button`
  padding: 0.5rem 1rem;
  background: white;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: #fef2f2;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Empty state
const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #9ca3af;
`;

const EmptyIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
`;

const EmptyText = styled.div`
  font-size: 0.9375rem;
  margin-bottom: 0.25rem;
`;

const EmptySubtext = styled.div`
  font-size: 0.8125rem;
`;

// Loading / Error
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
  padding: 1rem 1.25rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
`;

// Toast
const Toast = styled.div<{ $type: "success" | "error" }>`
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  z-index: 3000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease;
  background: ${({ $type }) => ($type === "success" ? "#dcfce7" : "#fef2f2")};
  color: ${({ $type }) => ($type === "success" ? "#166534" : "#dc2626")};
  border: 1px solid ${({ $type }) => ($type === "success" ? "#86efac" : "#fecaca")};

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

// ---- Types ----

interface PendingItem {
  id: string;
  title: string;
  description: string | null;
  itemType: "promotion" | "event" | "pass" | "ad";
  // promotion-specific
  type?: string;
  discount?: number | null;
  // pass-specific
  priceCents?: number;
  totalQuantity?: number;
  soldCount?: number;
  // event-specific
  startTime?: string;
  endTime?: string | null;
  maxAttendees?: number | null;
  attendeeCount?: number;
  // ad-specific
  budgetCents?: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

interface ApprovalData {
  promotions: PendingItem[];
  events: PendingItem[];
  passes: PendingItem[];
  campaigns: PendingItem[];
}

interface ApprovalCounts {
  promotions: number;
  events: number;
  passes: number;
  campaigns: number;
  total: number;
}

// ---- Helpers ----

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ---- Component ----

interface PendingApprovalsProps {
  barId: string;
  userRole: string;
}

const PendingApprovals = ({ barId, userRole }: PendingApprovalsProps) => {
  const [approvals, setApprovals] = useState<ApprovalData | null>(null);
  const [counts, setCounts] = useState<ApprovalCounts>({ promotions: 0, events: 0, passes: 0, campaigns: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioning, setActioning] = useState<string | null>(null); // id of item being acted on
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("hoppr_token") : null;

  const fetchApprovals = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/bar/${barId}/approvals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data = await res.json();
      setApprovals(data.approvals);
      setCounts(data.counts ?? { promotions: 0, events: 0, total: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load approvals");
    } finally {
      setLoading(false);
    }
  }, [barId, token]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getItemKey = (itemType: string): keyof ApprovalData => {
    switch (itemType) {
      case "promotion": return "promotions";
      case "event": return "events";
      case "pass": return "passes";
      case "ad": return "campaigns";
      default: return "promotions";
    }
  };

  const getCountKey = (itemType: string): keyof ApprovalCounts => {
    switch (itemType) {
      case "promotion": return "promotions";
      case "event": return "events";
      case "pass": return "passes";
      case "ad": return "campaigns";
      default: return "promotions";
    }
  };

  const removeItem = (item: PendingItem) => {
    if (!approvals) return;
    const itemKey = getItemKey(item.itemType);
    const countKey = getCountKey(item.itemType);
    setApprovals({
      ...approvals,
      [itemKey]: (approvals[itemKey] as PendingItem[]).filter((p) => p.id !== item.id),
    });
    setCounts((prev) => ({
      ...prev,
      [countKey]: Math.max(0, prev[countKey] - 1),
      total: Math.max(0, prev.total - 1),
    }));
  };

  const handleApprove = async (item: PendingItem) => {
    if (!token) return;
    setActioning(item.id);
    try {
      let res: Response;
      switch (item.itemType) {
        case "promotion":
          res = await fetch(`/api/auth/bar/${barId}/promotions/${item.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ isApproved: true }),
          });
          break;
        case "event":
          res = await fetch(`/api/auth/bar/${barId}/events/${item.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ action: "approve" }),
          });
          break;
        case "pass":
          res = await fetch(`/api/auth/bar/${barId}/passes/${item.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ isApproved: true, isActive: true }),
          });
          break;
        case "ad":
          res = await fetch(`/api/auth/bar/${barId}/campaigns/${item.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: "ACTIVE" }),
          });
          break;
        default:
          throw new Error("Unknown item type");
      }

      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      removeItem(item);
      showToast(`"${item.title}" approved`, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to approve", "error");
    } finally {
      setActioning(null);
    }
  };

  const handleReject = async (item: PendingItem) => {
    if (!token) return;
    setActioning(item.id);
    try {
      let res: Response;
      switch (item.itemType) {
        case "promotion":
          res = await fetch(`/api/auth/bar/${barId}/promotions/${item.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ isApproved: false }),
          });
          break;
        case "event":
          res = await fetch(`/api/auth/bar/${barId}/events/${item.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ action: "reject" }),
          });
          break;
        case "pass":
          res = await fetch(`/api/auth/bar/${barId}/passes/${item.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ isApproved: false }),
          });
          break;
        case "ad":
          res = await fetch(`/api/auth/bar/${barId}/campaigns/${item.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: "DRAFT" }),
          });
          break;
        default:
          throw new Error("Unknown item type");
      }

      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      removeItem(item);
      showToast(`"${item.title}" rejected`, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to reject", "error");
    } finally {
      setActioning(null);
    }
  };

  const isManager = userRole === "OWNER" || userRole === "MANAGER";

  if (!isManager) {
    return (
      <Container>
        <Header>
          <Title>Approvals</Title>
        </Header>
        <EmptyState>
          <EmptyIcon>🔒</EmptyIcon>
          <EmptyText>Manager-only access</EmptyText>
          <EmptySubtext>Only owners and managers can review pending approvals</EmptySubtext>
        </EmptyState>
      </Container>
    );
  }

  const allItems: PendingItem[] = approvals
    ? [
        ...approvals.promotions,
        ...approvals.events,
        ...(approvals.passes || []),
        ...(approvals.campaigns || []),
      ].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
    : [];

  return (
    <Container>
      <Header>
        <Title>
          Approvals
          {approvals && (
            <CountBadge $hasItems={counts.total > 0}>
              {counts.total}
            </CountBadge>
          )}
        </Title>
        <RefreshButton onClick={fetchApprovals}>
          {loading ? "⟳ Loading..." : "⟳ Refresh"}
        </RefreshButton>
      </Header>

      {error && (
        <ErrorBox>
          {error}
          <button onClick={fetchApprovals} style={{ marginLeft: "1rem", background: "none", border: "none", color: "#dc2626", cursor: "pointer", textDecoration: "underline" }}>
            Retry
          </button>
        </ErrorBox>
      )}

      {loading ? (
        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            padding: "1rem 0",
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
      ) : allItems.length === 0 ? (
        <EmptyState>
          <EmptyIcon>✅</EmptyIcon>
          <EmptyText>All caught up!</EmptyText>
          <EmptySubtext>No pending items waiting for approval</EmptySubtext>
        </EmptyState>
      ) : (
        <>
          {/* Promotions Section */}
          {approvals && approvals.promotions.length > 0 && (
            <Section>
              <SectionHeader>
                <SectionTitle>Promotions</SectionTitle>
                <SectionCount>({counts.promotions} pending)</SectionCount>
              </SectionHeader>
              <ApprovalList>
                {approvals.promotions.map((item) => (
                  <ApprovalCard key={item.id}>
                    <ItemInfo>
                      <ItemTitle>{item.title}</ItemTitle>
                      <ItemMeta>
                        <ItemTypeBadge $type="promotion">Promo</ItemTypeBadge>
                        <span>{item.type?.replace(/_/g, " ")}</span>
                        {item.discount && <span>{item.discount}% off</span>}
                        <span>Created {timeAgo(item.createdAt)}</span>
                      </ItemMeta>
                      {item.description && (
                        <div style={{ fontSize: "0.8125rem", color: "#6b7280", marginTop: "0.25rem" }}>
                          {item.description.slice(0, 120)}
                          {item.description.length > 120 && "..."}
                        </div>
                      )}
                    </ItemInfo>
                    <ActionGroup>
                      <RejectButton
                        onClick={() => handleReject(item)}
                        disabled={actioning === item.id}
                      >
                        {actioning === item.id ? "..." : "Reject"}
                      </RejectButton>
                      <ApproveButton
                        onClick={() => handleApprove(item)}
                        disabled={actioning === item.id}
                      >
                        {actioning === item.id ? "..." : "✓ Approve"}
                      </ApproveButton>
                    </ActionGroup>
                  </ApprovalCard>
                ))}
              </ApprovalList>
            </Section>
          )}

          {/* Events Section */}
          {approvals && approvals.events.length > 0 && (
            <Section>
              <SectionHeader>
                <SectionTitle>Events</SectionTitle>
                <SectionCount>({counts.events} pending)</SectionCount>
              </SectionHeader>
              <ApprovalList>
                {approvals.events.map((item) => (
                  <ApprovalCard key={item.id}>
                    <ItemInfo>
                      <ItemTitle>{item.title}</ItemTitle>
                      <ItemMeta>
                        <ItemTypeBadge $type="event">Event</ItemTypeBadge>
                        {item.startTime && <span>{formatDateTime(item.startTime)}</span>}
                        {item.attendeeCount !== undefined && (
                          <span>{item.attendeeCount} attending</span>
                        )}
                        <span>Created {timeAgo(item.createdAt)}</span>
                      </ItemMeta>
                      {item.description && (
                        <div style={{ fontSize: "0.8125rem", color: "#6b7280", marginTop: "0.25rem" }}>
                          {item.description.slice(0, 120)}
                          {item.description.length > 120 && "..."}
                        </div>
                      )}
                    </ItemInfo>
                    <ActionGroup>
                      <RejectButton
                        onClick={() => handleReject(item)}
                        disabled={actioning === item.id}
                      >
                        {actioning === item.id ? "..." : "Reject"}
                      </RejectButton>
                      <ApproveButton
                        onClick={() => handleApprove(item)}
                        disabled={actioning === item.id}
                      >
                        {actioning === item.id ? "..." : "✓ Approve"}
                      </ApproveButton>
                    </ActionGroup>
                  </ApprovalCard>
                ))}
              </ApprovalList>
            </Section>
          )}

          {/* Passes Section */}
          {approvals && (approvals.passes || []).length > 0 && (
            <Section>
              <SectionHeader>
                <SectionTitle>Passes</SectionTitle>
                <SectionCount>({counts.passes} pending)</SectionCount>
              </SectionHeader>
              <ApprovalList>
                {(approvals.passes || []).map((item) => (
                  <ApprovalCard key={item.id}>
                    <ItemInfo>
                      <ItemTitle>{item.title}</ItemTitle>
                      <ItemMeta>
                        <ItemTypeBadge $type="pass">Pass</ItemTypeBadge>
                        <span>{item.type?.replace(/_/g, " ")}</span>
                        {item.priceCents && <span>€{(item.priceCents / 100).toFixed(2)}</span>}
                        {item.totalQuantity && <span>{item.totalQuantity} qty</span>}
                        <span>Created {timeAgo(item.createdAt)}</span>
                      </ItemMeta>
                      {item.description && (
                        <div style={{ fontSize: "0.8125rem", color: "#6b7280", marginTop: "0.25rem" }}>
                          {item.description.slice(0, 120)}
                          {item.description.length > 120 && "..."}
                        </div>
                      )}
                    </ItemInfo>
                    <ActionGroup>
                      <RejectButton
                        onClick={() => handleReject(item)}
                        disabled={actioning === item.id}
                      >
                        {actioning === item.id ? "..." : "Reject"}
                      </RejectButton>
                      <ApproveButton
                        onClick={() => handleApprove(item)}
                        disabled={actioning === item.id}
                      >
                        {actioning === item.id ? "..." : "✓ Approve"}
                      </ApproveButton>
                    </ActionGroup>
                  </ApprovalCard>
                ))}
              </ApprovalList>
            </Section>
          )}

          {/* Ad Campaigns Section */}
          {approvals && (approvals.campaigns || []).length > 0 && (
            <Section>
              <SectionHeader>
                <SectionTitle>Ad Campaigns</SectionTitle>
                <SectionCount>({counts.campaigns} pending)</SectionCount>
              </SectionHeader>
              <ApprovalList>
                {(approvals.campaigns || []).map((item) => (
                  <ApprovalCard key={item.id}>
                    <ItemInfo>
                      <ItemTitle>{item.title}</ItemTitle>
                      <ItemMeta>
                        <ItemTypeBadge $type="ad">Ad</ItemTypeBadge>
                        <span>{item.type?.replace(/_/g, " ")}</span>
                        {item.budgetCents && <span>€{(item.budgetCents / 100).toFixed(0)} budget</span>}
                        {item.startDate && <span>{formatDate(item.startDate)} – {item.endDate ? formatDate(item.endDate) : ""}</span>}
                        <span>Created {timeAgo(item.createdAt)}</span>
                      </ItemMeta>
                      {item.description && (
                        <div style={{ fontSize: "0.8125rem", color: "#6b7280", marginTop: "0.25rem" }}>
                          {item.description.slice(0, 120)}
                          {item.description.length > 120 && "..."}
                        </div>
                      )}
                    </ItemInfo>
                    <ActionGroup>
                      <RejectButton
                        onClick={() => handleReject(item)}
                        disabled={actioning === item.id}
                      >
                        {actioning === item.id ? "..." : "Reject"}
                      </RejectButton>
                      <ApproveButton
                        onClick={() => handleApprove(item)}
                        disabled={actioning === item.id}
                      >
                        {actioning === item.id ? "..." : "✓ Approve"}
                      </ApproveButton>
                    </ActionGroup>
                  </ApprovalCard>
                ))}
              </ApprovalList>
            </Section>
          )}
        </>
      )}

      {/* Toast notification */}
      {toast && <Toast $type={toast.type}>{toast.message}</Toast>}
    </Container>
  );
};

export default PendingApprovals;
