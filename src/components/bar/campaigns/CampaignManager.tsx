"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";

// ── Types ──

interface Campaign {
  id: string;
  barId: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  budgetCents: number;
  spentCents: number;
  impressions: number;
  clicks: number;
  conversions: number;
  startDate: string;
  endDate: string;
  imageUrl?: string;
  targetUrl?: string;
  promotedItemId?: string;
  complianceStatus: string;
  createdAt: string;
  updatedAt: string;
}

const typeLabels: Record<string, string> = {
  FEATURED_LISTING: "Featured Listing",
  BANNER_AD: "Banner Ad",
  BOOSTED_PROMO: "Boosted Promo",
  SPONSORED_EVENT: "Sponsored Event",
};

const statusConfig: Record<string, { color: string; bg: string }> = {
  DRAFT: { color: "#737373", bg: "rgba(115,115,115,0.15)" },
  PENDING_REVIEW: { color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  ACTIVE: { color: "#10b981", bg: "rgba(16,185,129,0.15)" },
  PAUSED: { color: "#f97316", bg: "rgba(249,115,22,0.15)" },
  COMPLETED: { color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
  CANCELLED: { color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
};

// ── Styled ──

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

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const FilterBar = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
`;

const FilterChip = styled.button<{ $active: boolean }>`
  padding: 0.5rem 0.875rem;
  border-radius: 0.375rem;
  border: 1px solid ${({ $active }) => ($active ? "#10b981" : "#e5e7eb")};
  background: ${({ $active }) => ($active ? "#d1fae5" : "white")};
  color: ${({ $active }) => ($active ? "#065f46" : "#6b7280")};
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: #10b981;
    background: ${({ $active }) => ($active ? "#d1fae5" : "#f0fdf4")};
  }
`;

const CardGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const CampaignCard = styled.div<{ $active?: boolean }>`
  background: ${({ $active }) => ($active ? "#f0fdf4" : "white")};
  border: 1px solid ${({ $active }) => ($active ? "#a7f3d0" : "#e5e7eb")};
  border-radius: 0.75rem;
  padding: 1.25rem;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
`;

const CardTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
`;

const CardTitle = styled.div`
  color: #1f2937;
  font-weight: 700;
  font-size: 0.9375rem;
`;

const CardType = styled.span`
  color: #6b7280;
  font-size: 0.75rem;
`;

const StatusBadge = styled.span<{ $color: string; $bg: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0.25rem 0.625rem;
  border-radius: 0.375rem;
  font-size: 0.6875rem;
  font-weight: 600;
  color: ${({ $color }) => $color};
  background: ${({ $bg }) => $bg};
`;

const BudgetBar = styled.div`
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  margin-bottom: 0.75rem;
  overflow: hidden;
`;

const BudgetFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => Math.min($pct, 100)}%;
  background: #10b981;
  border-radius: 2px;
  transition: width 0.3s;
`;

const StatsRow = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
`;

const Stat = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  span { color: #374151; font-weight: 600; }
`;

const Actions = styled.div`
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
`;

const ActionBtn = styled.button<{ $variant?: "primary" | "danger" }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid ${({ $variant }) => ($variant === "danger" ? "#fecaca" : "#e5e7eb")};
  background: ${({ $variant }) => ($variant === "primary" ? "#10b981" : "white")};
  color: ${({ $variant }) => ($variant === "primary" ? "#fff" : $variant === "danger" ? "#dc2626" : "#374151")};
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  &:hover:not(:disabled) {
    border-color: ${({ $variant }) => ($variant === "danger" ? "#ef4444" : "#10b981")};
    background: ${({ $variant }) => ($variant === "primary" ? "#059669" : "#f0fdf4")};
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// ── Modal ──

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 100;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 60px;
  overflow-y: auto;
`;

const ModalCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  width: 100%;
  max-width: 520px;
  margin-bottom: 60px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
`;

const ModalTitle = styled.h2`
  color: #1f2937;
  font-weight: 700;
  font-size: 1.125rem;
  margin: 0 0 1.25rem;
`;

const FormGroup = styled.div`
  margin-bottom: 0.875rem;
`;

const Label = styled.label`
  display: block;
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const inputStyles = `
  width: 100%;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  background: white;
  color: #1f2937;
  font-size: 0.875rem;
  box-sizing: border-box;
  &:focus { outline: none; border-color: #10b981; }
`;

const Input = styled.input`
  ${inputStyles}
`;

const Select = styled.select`
  ${inputStyles}
`;

const Textarea = styled.textarea`
  ${inputStyles}
  resize: vertical;
  min-height: 60px;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1.25rem;
`;

// ── Helpers ──

function getToken(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("hoppr_token") || "";
  }
  return "";
}

// ── Component ──

export default function CampaignManager({ barId, userRole }: { barId: string; userRole: string }) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("FEATURED_LISTING");
  const [budgetCents, setBudgetCents] = useState(5000);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [targetUrl, setTargetUrl] = useState("");

  const canManage = ["OWNER", "MANAGER"].includes(userRole);

  const fetchCampaigns = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("status", filter);
      if (search) params.set("search", search);
      if (typeFilter) params.set("type", typeFilter);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      params.set("page", String(page));
      params.set("limit", "12");

      const res = await fetch(
        `/api/auth/bar/${barId}/campaigns?${params.toString()}`,
        { headers: { authorization: `Bearer ${token}` } },
      );
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
        if (data.pagination) setPagination(data.pagination);
      }
    } catch (e) {
      console.error("Fetch campaigns error:", e);
    } finally {
      setLoading(false);
    }
  }, [barId, filter, search, typeFilter, sortBy, sortOrder, page]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const openCreate = () => {
    // Redirect to the unified creation hub with campaign tab pre-selected
    router.push(`/bar/${barId}/create?type=campaign`);
  };

  const openEdit = (c: Campaign) => {
    setEditingId(c.id);
    setTitle(c.title);
    setDescription(c.description || "");
    setType(c.type);
    setBudgetCents(c.budgetCents);
    setStartDate(c.startDate.slice(0, 10));
    setEndDate(c.endDate.slice(0, 10));
    setImageUrl(c.imageUrl || "");
    setTargetUrl(c.targetUrl || "");
    setShowModal(true);
  };

  const save = async () => {
    if (!title || !startDate || !endDate) return;
    setSaving(true);
    const token = getToken();
    if (!token) return;
    try {
      const url = editingId
        ? `/api/auth/bar/${barId}/campaigns/${editingId}`
        : `/api/auth/bar/${barId}/campaigns`;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description: description || null,
          type,
          budgetCents,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          imageUrl: imageUrl || null,
          targetUrl: targetUrl || null,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        fetchCampaigns();
      } else {
        const err = await res.json();
        alert(err.error || "Save failed");
      }
    } catch (e) {
      console.error("Save campaign error:", e);
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (id: string, newStatus: string) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`/api/auth/bar/${barId}/campaigns/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchCampaigns();
      } else {
        const err = await res.json();
        alert(err.error || "Status change failed");
      }
    } catch (e) {
      console.error("Status change error:", e);
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm("Delete this draft campaign?")) return;
    const token = getToken();
    if (!token) return;
    try {
      await fetch(`/api/auth/bar/${barId}/campaigns/${id}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${token}` },
      });
      fetchCampaigns();
    } catch (e) {
      console.error("Delete campaign error:", e);
    }
  };

  const formatBudget = (cents: number) => `€${(cents / 100).toFixed(0)}`;
  const ctr = (c: Campaign) => (c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(1) : "0.0");

  if (loading) return <Container><div style={{ color: "#6b7280", padding: "2rem", textAlign: "center" }}>Loading campaigns...</div></Container>;

  return (
    <Container>
      <Header>
        <Title>Ad Campaigns</Title>
        {canManage && (
          <ActionBtn $variant="primary" onClick={openCreate}>
            + New Campaign
          </ActionBtn>
        )}
      </Header>

      <FilterBar>
        {["all", "active", "draft", "ended"].map((f) => (
          <FilterChip key={f} $active={filter === f} onClick={() => { setFilter(f); setPage(1); }}>
            {f === "all" ? "All" : f === "draft" ? "Drafts" : f === "ended" ? "Ended" : "Active"}
          </FilterChip>
        ))}
      </FilterBar>

      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Search campaigns..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{
            flex: 1,
            minWidth: "200px",
            padding: "0.5rem 0.75rem",
            border: "1px solid #d1d5db",
            borderRadius: "0.375rem",
            fontSize: "0.8125rem",
          }}
        />
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          style={{
            padding: "0.5rem 0.75rem",
            border: "1px solid #d1d5db",
            borderRadius: "0.375rem",
            fontSize: "0.8125rem",
            background: "white",
          }}
        >
          <option value="">All Types</option>
          {Object.entries(typeLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button
          onClick={() => {
            setSortBy("title");
            setSortOrder(sortBy === "title" && sortOrder === "desc" ? "asc" : "desc");
            setPage(1);
          }}
          style={{
            padding: "0.5rem 0.75rem",
            border: `1px solid ${sortBy === "title" ? "#10b981" : "#d1d5db"}`,
            borderRadius: "0.375rem",
            background: sortBy === "title" ? "#f0fdf4" : "white",
            color: sortBy === "title" ? "#065f46" : "#6b7280",
            fontSize: "0.75rem",
            cursor: "pointer",
          }}
        >
          Name {sortBy === "title" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
        </button>
        <button
          onClick={() => {
            setSortBy("createdAt");
            setSortOrder(sortBy === "createdAt" && sortOrder === "desc" ? "asc" : "desc");
            setPage(1);
          }}
          style={{
            padding: "0.5rem 0.75rem",
            border: `1px solid ${sortBy === "createdAt" ? "#10b981" : "#d1d5db"}`,
            borderRadius: "0.375rem",
            background: sortBy === "createdAt" ? "#f0fdf4" : "white",
            color: sortBy === "createdAt" ? "#065f46" : "#6b7280",
            fontSize: "0.75rem",
            cursor: "pointer",
          }}
        >
          Date {sortBy === "createdAt" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#9ca3af" }}>
          <p style={{ fontSize: "0.9375rem", marginBottom: "0.25rem" }}>No campaigns yet</p>
          <p style={{ fontSize: "0.8125rem" }}>Create your first ad campaign to promote your venue.</p>
        </div>
      ) : (
        <CardGrid>
          {campaigns.map((c) => {
            const sc = statusConfig[c.status] || statusConfig.DRAFT;
            const tp = typeLabels[c.type] || c.type;
            const spentPct = c.budgetCents > 0 ? (c.spentCents / c.budgetCents) * 100 : 0;
            return (
              <CampaignCard key={c.id} $active={c.status === "ACTIVE"}>
                <CardTop>
                  <div>
                    <CardTitle>{c.title}</CardTitle>
                    <CardType>{tp}</CardType>
                  </div>
                  <StatusBadge $color={sc.color} $bg={sc.bg}>
                    {c.status.replace(/_/g, " ")}
                  </StatusBadge>
                </CardTop>

                <BudgetBar>
                  <BudgetFill $pct={spentPct} />
                </BudgetBar>

                <StatsRow>
                  <Stat>Budget: <span>{formatBudget(c.budgetCents)}</span></Stat>
                  <Stat>Spent: <span>{formatBudget(c.spentCents)}</span></Stat>
                  <Stat>Impressions: <span>{c.impressions.toLocaleString()}</span></Stat>
                  <Stat>Clicks: <span>{c.clicks.toLocaleString()}</span></Stat>
                  <Stat>CTR: <span>{ctr(c)}%</span></Stat>
                </StatsRow>

                <StatsRow>
                  <Stat>
                    {new Date(c.startDate).toLocaleDateString()} – {new Date(c.endDate).toLocaleDateString()}
                  </Stat>
                </StatsRow>

                {canManage && (
                  <Actions>
                    {(c.status === "DRAFT" || c.status === "PENDING_REVIEW") && (
                      <ActionBtn onClick={() => openEdit(c)}>Edit</ActionBtn>
                    )}
                    {c.status === "DRAFT" && (
                      <>
                        <ActionBtn onClick={() => changeStatus(c.id, "PENDING_REVIEW")}>Submit</ActionBtn>
                        <ActionBtn onClick={() => deleteCampaign(c.id)} $variant="danger">Delete</ActionBtn>
                      </>
                    )}
                    {c.status === "PENDING_REVIEW" && (
                      <ActionBtn $variant="primary" onClick={() => changeStatus(c.id, "ACTIVE")}>
                        Approve
                      </ActionBtn>
                    )}
                    {c.status === "ACTIVE" && (
                      <>
                        <ActionBtn onClick={() => changeStatus(c.id, "PAUSED")}>Pause</ActionBtn>
                        <ActionBtn onClick={() => changeStatus(c.id, "COMPLETED")}>Complete</ActionBtn>
                      </>
                    )}
                    {c.status === "PAUSED" && (
                      <ActionBtn $variant="primary" onClick={() => changeStatus(c.id, "ACTIVE")}>
                        Resume
                      </ActionBtn>
                    )}
                    {(c.status === "ACTIVE" || c.status === "PAUSED") && (
                      <ActionBtn $variant="danger" onClick={() => changeStatus(c.id, "CANCELLED")}>
                        Cancel
                      </ActionBtn>
                    )}
                  </Actions>
                )}
              </CampaignCard>
            );
          })}
        </CardGrid>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "1rem",
            fontSize: "0.8125rem",
            color: "#6b7280",
          }}
        >
          <span>
            Showing {(pagination.page - 1) * pagination.limit + 1}
            &ndash;
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} campaigns
          </span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              style={{
                padding: "0.375rem 0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.375rem",
                background: "white",
                cursor: page <= 1 ? "not-allowed" : "pointer",
                opacity: page <= 1 ? 0.5 : 1,
              }}
            >
              Previous
            </button>
            <button
              disabled={page >= pagination.pages}
              onClick={() => setPage(page + 1)}
              style={{
                padding: "0.375rem 0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.375rem",
                background: "white",
                cursor: page >= pagination.pages ? "not-allowed" : "pointer",
                opacity: page >= pagination.pages ? 0.5 : 1,
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <ModalOverlay onClick={() => setShowModal(false)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalTitle>{editingId ? "Edit Campaign" : "New Campaign"}</ModalTitle>

            <FormGroup>
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Campaign title" />
            </FormGroup>

            <FormGroup>
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description (optional)" />
            </FormGroup>

            <FormGroup>
              <Label>Type</Label>
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                {Object.entries(typeLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Budget (EUR)</Label>
              <Input
                type="number"
                value={budgetCents / 100}
                onChange={(e) => setBudgetCents(Math.max(0, Math.round(parseFloat(e.target.value || "0") * 100)))}
                placeholder="50"
              />
            </FormGroup>

            <div style={{ display: "flex", gap: "12px" }}>
              <FormGroup style={{ flex: 1 }}>
                <Label>Start Date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </FormGroup>
              <FormGroup style={{ flex: 1 }}>
                <Label>End Date</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </FormGroup>
            </div>

            <FormGroup>
              <Label>Image URL (optional)</Label>
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
            </FormGroup>

            <FormGroup>
              <Label>Target URL (optional)</Label>
              <Input value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="Deep link or website URL" />
            </FormGroup>

            <ModalActions>
              <ActionBtn onClick={() => setShowModal(false)}>Cancel</ActionBtn>
              <ActionBtn $variant="primary" onClick={save} disabled={saving}>
                {saving ? "Saving..." : editingId ? "Save Changes" : "Create Campaign"}
              </ActionBtn>
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      )}
    </Container>
  );
}
