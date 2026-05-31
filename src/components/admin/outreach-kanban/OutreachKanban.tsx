"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";

// ---- Styled Components ----

const Container = styled.div`
  padding: 1rem;
  max-width: 1600px;
  margin: 0 auto;
  min-height: 100vh;

  @media (min-width: 768px) {
    padding: 1.5rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;

  @media (min-width: 768px) {
    margin-bottom: 1.5rem;
  }
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;

  @media (min-width: 768px) {
    font-size: 2rem;
  }
`;

const Board = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  min-height: 60vh;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Column = styled.div<{ $isDragOver?: boolean }>`
  background: ${({ $isDragOver }) => ($isDragOver ? "#f0fdf4" : "#f9fafb")};
  border-radius: 0.75rem;
  border: 2px dashed ${({ $isDragOver }) => ($isDragOver ? "#16a34a" : "#e5e7eb")};
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  min-height: 300px;
  transition: background 0.2s, border-color 0.2s;
`;

const ColumnHeader = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.75rem;
  background: white;
  border-radius: 0.5rem;
  border-left: 4px solid ${({ $color }) => $color};
`;

const ColumnTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const ColumnCount = styled.span`
  background: #e5e7eb;
  color: #374151;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 1rem;
`;

const Card = styled.div`
  background: white;
  border-radius: 0.5rem;
  padding: 0.875rem;
  margin-bottom: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
  cursor: grab;
  transition: transform 0.15s, box-shadow 0.15s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
  }

  &:active {
    cursor: grabbing;
  }
`;

const CardBarName = styled.div`
  font-weight: 600;
  font-size: 0.875rem;
  color: #1f2937;
  margin-bottom: 0.25rem;
`;

const CardMeta = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const MiniBadge = styled.span<{ $variant: string }>`
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-weight: 600;
  ${({ $variant }) => {
    switch ($variant) {
      case "ACTIVE":
        return "background: #dcfce7; color: #166534;";
      case "GROWING":
        return "background: #dbeafe; color: #1e40af;";
      case "STAGNANT":
        return "background: #fef3c7; color: #92400e;";
      case "DEAD":
        return "background: #fef2f2; color: #dc2626;";
      case "NEW":
        return "background: #f3e8ff; color: #7c3aed;";
      default:
        return "background: #f3f4f6; color: #6b7280;";
    }
  }}
`;

const ScoreMini = styled.span<{ $score: number }>`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ $score }) => {
    if ($score >= 70) return "#16a34a";
    if ($score >= 50) return "#f59e0b";
    if ($score >= 30) return "#f97316";
    return "#dc2626";
  }};
`;

const LogButton = styled.button`
  padding: 0.25rem 0.5rem;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;

  &:hover {
    background: #6d28d9;
  }
`;

const ViewButton = styled.button`
  padding: 0.25rem 0.5rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: #e5e7eb;
  }
`;

const EmptyColumn = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 0.75rem;
  padding: 2rem 0;
`;

// Modal
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  width: 90%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  color: #1f2937;
`;

const ModalSubtitle = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0 0 1rem 0;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.375rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  color: #1f2937;

  &:focus {
    outline: none;
    border-color: #7c3aed;
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1);
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #7c3aed;
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1);
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #7c3aed;
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1);
  }
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
`;

const ModalButton = styled.button<{ $variant?: "primary" | "secondary" }>`
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  ${({ $variant }) =>
    $variant === "primary"
      ? "background: #7c3aed; color: white; &:hover { background: #6d28d9; }"
      : "background: #f3f4f6; color: #374151; &:hover { background: #e5e7eb; }"}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #6b7280;
  font-size: 1rem;
`;

const ErrorState = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 1.5rem;
  border-radius: 0.5rem;
  text-align: center;
  margin: 2rem 0;
`;

const LastContact = styled.div`
  font-size: 0.625rem;
  color: #9ca3af;
  margin-top: 0.25rem;
`;

const FollowUpBadge = styled.span`
  font-size: 0.625rem;
  padding: 0.125rem 0.375rem;
  background: #fef3c7;
  color: #92400e;
  border-radius: 0.25rem;
  white-space: nowrap;
`;

// ---- Types ----

interface OutreachBar {
  id: string;
  name: string;
  type: string;
  cityName: string | null;
  district: string | null;
  status: string;
  qualityScore: number | null;
  performanceTier: string | null;
  latestOutreach: {
    id: string;
    method: string;
    status: string;
    notes: string | null;
    followUpAt: string | null;
    createdAt: string;
    userName: string | null;
  } | null;
}

interface KanbanColumn {
  status: string;
  label: string;
  bars: OutreachBar[];
}

interface KanbanResponse {
  success: boolean;
  columns: KanbanColumn[];
}

// ---- Column config ----

const COLUMN_COLORS: Record<string, string> = {
  NOT_CONTACTED: "#9ca3af",
  EMAILED: "#3b82f6",
  CALLED: "#f59e0b",
  IN_DISCUSSION: "#16a34a",
};

const METHOD_LABELS: Record<string, string> = {
  EMAIL: "Email",
  PHONE_CALL: "Phone Call",
  IN_PERSON: "In Person",
  SOCIAL_MEDIA: "Social Media",
};

const STATUS_LABELS: Record<string, string> = {
  NOT_CONTACTED: "Not Contacted",
  EMAILED: "Emailed",
  CALLED: "Called",
  IN_DISCUSSION: "In Discussion",
  CLAIMED: "Claimed",
  DECLINED: "Declined",
};

const STATUS_OPTIONS = [
  "NOT_CONTACTED",
  "EMAILED",
  "CALLED",
  "IN_DISCUSSION",
  "CLAIMED",
  "DECLINED",
];

const METHOD_OPTIONS = ["EMAIL", "PHONE_CALL", "IN_PERSON", "SOCIAL_MEDIA"];

// ---- Component ----

const OutreachKanban = () => {
  const router = useRouter();
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalBar, setModalBar] = useState<OutreachBar | null>(null);
  const [modalMethod, setModalMethod] = useState("EMAIL");
  const [modalStatus, setModalStatus] = useState("EMAILED");
  const [modalNotes, setModalNotes] = useState("");
  const [modalFollowUpAt, setModalFollowUpAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Drag state
  const [dragBarId, setDragBarId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  useEffect(() => {
    fetchOutreach();
  }, []);

  const fetchOutreach = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("hoppr_token");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      const res = await fetch("/api/auth/admin/outreach", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

      const data: KanbanResponse = await res.json();
      setColumns(data.columns);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load outreach data");
    } finally {
      setLoading(false);
    }
  };

  const openLogModal = (bar: OutreachBar) => {
    setModalBar(bar);
    // Suggest next status based on current
    const currentStatus = bar.latestOutreach?.status ?? "NOT_CONTACTED";
    const statusIndex = STATUS_OPTIONS.indexOf(currentStatus);
    const nextStatus = statusIndex >= 0 && statusIndex < STATUS_OPTIONS.length - 1
      ? STATUS_OPTIONS[statusIndex + 1]
      : currentStatus;
    setModalStatus(nextStatus);
    setModalMethod("EMAIL");
    setModalNotes("");
    setModalFollowUpAt("");
    setModalOpen(true);
  };

  const handleLogContact = async () => {
    if (!modalBar) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem("hoppr_token");
      if (!token) return;

      const res = await fetch("/api/auth/admin/outreach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          barId: modalBar.id,
          method: modalMethod,
          status: modalStatus,
          notes: modalNotes || null,
          followUpAt: modalFollowUpAt || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to log contact");
      }

      setModalOpen(false);
      fetchOutreach(); // Refresh board
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to log contact");
    } finally {
      setSubmitting(false);
    }
  };

  // Drag-and-drop handlers
  const handleDragStart = (barId: string) => {
    setDragBarId(barId);
  };

  const handleDragOver = (e: React.DragEvent, columnStatus: string) => {
    e.preventDefault();
    setDragOverColumn(columnStatus);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (columnStatus: string) => {
    setDragOverColumn(null);
    if (!dragBarId) return;

    // Find the bar being dragged
    let draggedBar: OutreachBar | null = null;
    for (const col of columns) {
      const found = col.bars.find((b) => b.id === dragBarId);
      if (found) {
        draggedBar = found;
        break;
      }
    }

    if (!draggedBar || draggedBar.latestOutreach?.status === columnStatus) return;

    // Log contact to move the bar to the new column
    try {
      const token = localStorage.getItem("hoppr_token");
      if (!token) return;

      await fetch("/api/auth/admin/outreach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          barId: dragBarId,
          method: "EMAIL", // Default method for drag
          status: columnStatus,
          notes: null,
          followUpAt: null,
        }),
      });

      fetchOutreach(); // Refresh board
    } catch (err) {
      console.error("Drag update error:", err);
    }

    setDragBarId(null);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const isFollowUpDue = (followUpAt: string | null) => {
    if (!followUpAt) return false;
    return new Date(followUpAt) <= new Date();
  };

  if (loading) {
    return (
      <Container>
        <Header>
          <Title>Outreach Pipeline</Title>
        </Header>
        <LoadingState>Loading outreach data...</LoadingState>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Header>
          <Title>Outreach Pipeline</Title>
        </Header>
        <ErrorState>
          <p>{error}</p>
          <ModalButton $variant="primary" onClick={fetchOutreach} style={{ marginTop: "1rem" }}>
            Try Again
          </ModalButton>
        </ErrorState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Outreach Pipeline</Title>
      </Header>

      <Board>
        {columns.map((col) => (
          <Column
            key={col.status}
            $isDragOver={dragOverColumn === col.status}
            onDragOver={(e) => handleDragOver(e, col.status)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(col.status)}
          >
            <ColumnHeader $color={COLUMN_COLORS[col.status] || "#9ca3af"}>
              <ColumnTitle>{col.label}</ColumnTitle>
              <ColumnCount>{col.bars.length}</ColumnCount>
            </ColumnHeader>

            {col.bars.length === 0 ? (
              <EmptyColumn>No bars in this stage</EmptyColumn>
            ) : (
              col.bars.map((bar) => (
                <Card
                  key={bar.id}
                  draggable
                  onDragStart={() => handleDragStart(bar.id)}
                >
                  <CardBarName>{bar.name}</CardBarName>
                  <CardMeta>
                    {bar.cityName || "Unknown"} · {(bar.type || "").replace(/_/g, " ")}
                  </CardMeta>

                  <CardFooter>
                    {bar.qualityScore !== null ? (
                      <ScoreMini $score={bar.qualityScore}>
                        {bar.qualityScore}/100
                      </ScoreMini>
                    ) : (
                      <MiniBadge $variant="none">No score</MiniBadge>
                    )}
                    {bar.performanceTier && (
                      <MiniBadge $variant={bar.performanceTier}>
                        {bar.performanceTier}
                      </MiniBadge>
                    )}
                    <ViewButton onClick={() => router.push(`/admin/bars/${bar.id}`)}>
                      View
                    </ViewButton>
                    <LogButton onClick={() => openLogModal(bar)}>
                      + Log
                    </LogButton>
                  </CardFooter>

                  {bar.latestOutreach && (
                    <LastContact>
                      Last: {METHOD_LABELS[bar.latestOutreach.method] || bar.latestOutreach.method}{" "}
                      by {bar.latestOutreach.userName || "Admin"} ·{" "}
                      {formatDate(bar.latestOutreach.createdAt)}
                      {bar.latestOutreach.followUpAt &&
                        isFollowUpDue(bar.latestOutreach.followUpAt) && (
                          <FollowUpBadge style={{ marginLeft: "0.25rem" }}>
                            ⏰ Follow-up due
                          </FollowUpBadge>
                        )}
                    </LastContact>
                  )}
                </Card>
              ))
            )}
          </Column>
        ))}
      </Board>

      {/* Log Contact Modal */}
      {modalOpen && modalBar && (
        <ModalOverlay onClick={() => !submitting && setModalOpen(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Log Contact</ModalTitle>
            <ModalSubtitle>
              {modalBar.name} — {modalBar.cityName || "Unknown"}
            </ModalSubtitle>

            <FormGroup>
              <Label>Contact Method</Label>
              <Select value={modalMethod} onChange={(e) => setModalMethod(e.target.value)}>
                {METHOD_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {METHOD_LABELS[m]}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>New Status</Label>
              <Select value={modalStatus} onChange={(e) => setModalStatus(e.target.value)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Notes</Label>
              <Textarea
                placeholder="What was discussed? Any next steps?"
                value={modalNotes}
                onChange={(e) => setModalNotes(e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <Label>Follow-up Date (optional)</Label>
              <Input
                type="date"
                value={modalFollowUpAt}
                onChange={(e) => setModalFollowUpAt(e.target.value)}
              />
            </FormGroup>

            <ModalButtons>
              <ModalButton
                $variant="secondary"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </ModalButton>
              <ModalButton
                $variant="primary"
                onClick={handleLogContact}
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Log Contact"}
              </ModalButton>
            </ModalButtons>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default OutreachKanban;
