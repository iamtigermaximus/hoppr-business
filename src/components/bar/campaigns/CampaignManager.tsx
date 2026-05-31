"use client";
import { useState, useEffect, useCallback } from "react";
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

const typeLabels: Record<string, { label: string; icon: string }> = {
  FEATURED_LISTING: { label: "Featured Listing", icon: "📌" },
  BANNER_AD: { label: "Banner Ad", icon: "🎯" },
  BOOSTED_PROMO: { label: "Boosted Promo", icon: "📢" },
  SPONSORED_EVENT: { label: "Sponsored Event", icon: "⭐" },
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
  max-width: 680px;
  margin: 0 auto;
  padding: 16px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  color: #fff;
  font-weight: 800;
  font-size: 22px;
  margin: 0;
`;

const FilterBar = styled.div`
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const FilterChip = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid ${({ $active }) => ($active ? "#7c3aed" : "#262626")};
  background: ${({ $active }) => ($active ? "rgba(124,58,237,0.15)" : "transparent")};
  color: ${({ $active }) => ($active ? "#a78bfa" : "#737373")};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
`;

const CardGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const CampaignCard = styled.div<{ $active?: boolean }>`
  background: ${({ $active }) => ($active ? "rgba(16,185,129,0.04)" : "#1a1a1a")};
  border: 1px solid ${({ $active }) => ($active ? "rgba(16,185,129,0.2)" : "#262626")};
  border-radius: 14px;
  padding: 16px;
`;

const CardTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
`;

const CardTitle = styled.div`
  color: #fff;
  font-weight: 700;
  font-size: 15px;
`;

const CardType = styled.span`
  color: #a3a3a3;
  font-size: 11px;
`;

const StatusBadge = styled.span<{ $color: string; $bg: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
  color: ${({ $color }) => $color};
  background: ${({ $bg }) => $bg};
`;

const BudgetBar = styled.div`
  height: 4px;
  background: #262626;
  border-radius: 2px;
  margin-bottom: 8px;
  overflow: hidden;
`;

const BudgetFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => Math.min($pct, 100)}%;
  background: #7c3aed;
  border-radius: 2px;
  transition: width 0.3s;
`;

const StatsRow = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
  flex-wrap: wrap;
`;

const Stat = styled.div`
  font-size: 11px;
  color: #737373;
  span { color: #a3a3a3; font-weight: 600; }
`;

const Actions = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const ActionBtn = styled.button<{ $variant?: "primary" | "danger" }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 7px;
  border: 1px solid ${({ $variant }) => ($variant === "danger" ? "rgba(239,68,68,0.3)" : "#262626")};
  background: ${({ $variant }) => ($variant === "primary" ? "#7c3aed" : "transparent")};
  color: ${({ $variant }) => ($variant === "primary" ? "#fff" : $variant === "danger" ? "#ef4444" : "#a3a3a3")};
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    border-color: ${({ $variant }) => ($variant === "danger" ? "#ef4444" : "#7c3aed")};
    background: ${({ $variant }) => ($variant === "primary" ? "#6d28d9" : "rgba(124,58,237,0.1)")};
  }
`;

// ── Modal ──

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  z-index: 100;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 60px;
  overflow-y: auto;
`;

const ModalCard = styled.div`
  background: #1a1a1a;
  border: 1px solid #262626;
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 520px;
  margin-bottom: 60px;
`;

const ModalTitle = styled.h2`
  color: #fff;
  font-weight: 700;
  font-size: 18px;
  margin: 0 0 20px;
`;

const FormGroup = styled.div`
  margin-bottom: 14px;
`;

const Label = styled.label`
  display: block;
  color: #a3a3a3;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #262626;
  background: #0a0a0a;
  color: #fff;
  font-size: 14px;
  box-sizing: border-box;
  &:focus { outline: none; border-color: #7c3aed; }
`;

const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #262626;
  background: #0a0a0a;
  color: #fff;
  font-size: 14px;
  box-sizing: border-box;
  &:focus { outline: none; border-color: #7c3aed; }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #262626;
  background: #0a0a0a;
  color: #fff;
  font-size: 14px;
  resize: vertical;
  min-height: 60px;
  box-sizing: border-box;
  &:focus { outline: none; border-color: #7c3aed; }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 20px;
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
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
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
    try {
      const res = await fetch(`/api/auth/bar/${barId}/campaigns?status=${filter}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (e) {
      console.error("Fetch campaigns error:", e);
    } finally {
      setLoading(false);
    }
  }, [barId, filter]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const openCreate = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setType("FEATURED_LISTING");
    setBudgetCents(5000);
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
    setImageUrl("");
    setTargetUrl("");
    setShowModal(true);
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

  if (loading) return <Container><div style={{ color: "#737373" }}>Loading...</div></Container>;

  return (
    <Container>
      <Header>
        <Title>📢 Ad Campaigns</Title>
        {canManage && (
          <ActionBtn $variant="primary" onClick={openCreate}>
            + New Campaign
          </ActionBtn>
        )}
      </Header>

      <FilterBar>
        {["all", "active", "draft", "ended"].map((f) => (
          <FilterChip key={f} $active={filter === f} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : f === "draft" ? "Drafts" : f === "ended" ? "Ended" : "Active"}
          </FilterChip>
        ))}
      </FilterBar>

      {campaigns.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 16px", color: "#737373" }}>
          <p style={{ fontSize: "14px" }}>No campaigns yet.</p>
          <p style={{ fontSize: "12px", marginTop: "4px" }}>Create your first ad campaign to promote your venue.</p>
        </div>
      ) : (
        <CardGrid>
          {campaigns.map((c) => {
            const sc = statusConfig[c.status] || statusConfig.DRAFT;
            const tp = typeLabels[c.type] || { label: c.type, icon: "📌" };
            const spentPct = c.budgetCents > 0 ? (c.spentCents / c.budgetCents) * 100 : 0;
            return (
              <CampaignCard key={c.id} $active={c.status === "ACTIVE"}>
                <CardTop>
                  <div>
                    <CardTitle>{c.title}</CardTitle>
                    <CardType>{tp.icon} {tp.label}</CardType>
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
                  <Stat>👁 <span>{c.impressions.toLocaleString()}</span></Stat>
                  <Stat>🎯 <span>{c.clicks.toLocaleString()}</span></Stat>
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
                      <ActionBtn onClick={() => openEdit(c)}>✏️ Edit</ActionBtn>
                    )}
                    {c.status === "DRAFT" && (
                      <>
                        <ActionBtn onClick={() => changeStatus(c.id, "PENDING_REVIEW")}>✅ Submit</ActionBtn>
                        <ActionBtn onClick={() => deleteCampaign(c.id)} $variant="danger">🗑 Delete</ActionBtn>
                      </>
                    )}
                    {c.status === "PENDING_REVIEW" && (
                      <ActionBtn $variant="primary" onClick={() => changeStatus(c.id, "ACTIVE")}>
                        ▶ Approve
                      </ActionBtn>
                    )}
                    {c.status === "ACTIVE" && (
                      <>
                        <ActionBtn onClick={() => changeStatus(c.id, "PAUSED")}>⏸ Pause</ActionBtn>
                        <ActionBtn onClick={() => changeStatus(c.id, "COMPLETED")}>✅ Complete</ActionBtn>
                      </>
                    )}
                    {c.status === "PAUSED" && (
                      <ActionBtn $variant="primary" onClick={() => changeStatus(c.id, "ACTIVE")}>
                        ▶ Resume
                      </ActionBtn>
                    )}
                    {(c.status === "ACTIVE" || c.status === "PAUSED") && (
                      <ActionBtn $variant="danger" onClick={() => changeStatus(c.id, "CANCELLED")}>
                        ❌ Cancel
                      </ActionBtn>
                    )}
                  </Actions>
                )}
              </CampaignCard>
            );
          })}
        </CardGrid>
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
                  <option key={k} value={k}>{v.icon} {v.label}</option>
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
