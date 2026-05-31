"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";

// ---- Styled Components ----

const Container = styled.div`
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;

  @media (min-width: 768px) {
    padding: 2rem;
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
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;

  @media (min-width: 768px) {
    font-size: 2rem;
  }
`;

const Tabs = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #e5e7eb;
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 0.75rem 1.25rem;
  background: none;
  border: none;
  border-bottom: 2px solid ${({ $active }) => ($active ? "#7c3aed" : "transparent")};
  color: ${({ $active }) => ($active ? "#7c3aed" : "#6b7280")};
  font-weight: ${({ $active }) => ($active ? "600" : "500")};
  font-size: 0.875rem;
  cursor: pointer;
  margin-bottom: -2px;
  transition: all 0.2s;

  &:hover {
    color: #374151;
  }
`;

const TabBadge = styled.span<{ $variant: string }>`
  margin-left: 0.5rem;
  padding: 0.125rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${({ $variant }) =>
    $variant === "CLAIMED" ? "#dbeafe" : $variant === "VERIFIED" ? "#dcfce7" : "#fef2f2"};
  color: ${({ $variant }) =>
    $variant === "CLAIMED" ? "#1e40af" : $variant === "VERIFIED" ? "#166534" : "#dc2626"};
`;

const Card = styled.div`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  padding: 0.875rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
`;

const Td = styled.td`
  padding: 0.875rem 1rem;
  font-size: 0.875rem;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
`;

const Tr = styled.tr`
  &:hover {
    background: #f9fafb;
  }

  &:last-child td {
    border-bottom: none;
  }
`;

const BarName = styled.div`
  font-weight: 600;
  color: #1f2937;
`;

const BarMeta = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.125rem;
`;

const UserName = styled.div`
  font-weight: 500;
  color: #1f2937;
`;

const UserEmail = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
`;

const StatusBadge = styled.span<{ $status: string }>`
  padding: 0.25rem 0.625rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  ${({ $status }) => {
    switch ($status) {
      case "CLAIMED":
        return "background: #dbeafe; color: #1e40af;";
      case "VERIFIED":
        return "background: #dcfce7; color: #166534;";
      case "REJECTED":
        return "background: #fef2f2; color: #dc2626;";
      default:
        return "background: #f3f4f6; color: #6b7280;";
    }
  }}
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ApproveButton = styled.button`
  padding: 0.5rem 0.75rem;
  background: #16a34a;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;

  &:hover {
    background: #15803d;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const RejectButton = styled.button`
  padding: 0.5rem 0.75rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;

  &:hover {
    background: #dc2626;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ViewDocsButton = styled.button`
  padding: 0.5rem 0.75rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: #e5e7eb;
  }
`;

const DocumentsList = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const DocLink = styled.a`
  padding: 0.25rem 0.5rem;
  background: #eff6ff;
  color: #1d4ed8;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    background: #dbeafe;
    text-decoration: underline;
  }
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
`;

const ModalTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  color: #1f2937;
`;

const ModalText = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1rem 0;
`;

const ModalTextarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  resize: vertical;
  min-height: 80px;
  margin-bottom: 1rem;
  font-family: inherit;

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
`;

const ModalButton = styled.button<{ $variant?: "danger" | "primary" | "secondary" }>`
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  ${({ $variant }) => {
    switch ($variant) {
      case "danger":
        return "background: #ef4444; color: white; &:hover { background: #dc2626; }";
      case "primary":
        return "background: #16a34a; color: white; &:hover { background: #15803d; }";
      default:
        return "background: #f3f4f6; color: #374151; &:hover { background: #e5e7eb; }";
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 2rem auto;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
`;

const PageButton = styled.button<{ $active?: boolean }>`
  padding: 0.375rem 0.75rem;
  border: 1px solid ${({ $active }) => ($active ? "#7c3aed" : "#d1d5db")};
  border-radius: 0.25rem;
  background: ${({ $active }) => ($active ? "#7c3aed" : "white")};
  color: ${({ $active }) => ($active ? "white" : "#374151")};
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: ${({ $active }) => ($active ? "#7c3aed" : "#f3f4f6")};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

// ---- Types ----

interface ClaimBar {
  id: string;
  name: string;
  cityName: string | null;
  district: string | null;
  type: string;
  coverImage: string | null;
  status: string;
}

interface ClaimUser {
  id: string;
  name: string | null;
  email: string;
}

interface Claim {
  id: string;
  barId: string;
  userId: string;
  documentUrls: string[];
  notes: string | null;
  status: string;
  reviewedById: string | null;
  reviewedAt: string | null;
  createdAt: string;
  bar: ClaimBar;
  user: ClaimUser;
  reviewedBy: ClaimUser | null;
}

interface ClaimsResponse {
  success: boolean;
  claims: Claim[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

type TabType = "CLAIMED" | "VERIFIED" | "REJECTED";

// ---- Component ----

const ClaimsList = () => {
  const [activeTab, setActiveTab] = useState<TabType>("CLAIMED");
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalClaim, setModalClaim] = useState<Claim | null>(null);
  const [modalAction, setModalAction] = useState<"VERIFIED" | "REJECTED" | null>(null);
  const [modalNotes, setModalNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchClaims(activeTab, page);
  }, [activeTab, page]);

  const fetchClaims = async (status: TabType, pageNum: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("hoppr_token");
      if (!token) return;

      const params = new URLSearchParams({ status, page: String(pageNum), limit: "15" });
      const res = await fetch(`/api/auth/admin/claims?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch claims");

      const data: ClaimsResponse = await res.json();
      setClaims(data.claims);
      setTotalPages(data.pagination.pages);
      setTotal(data.pagination.total);
    } catch (err) {
      console.error("Fetch claims error:", err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (claim: Claim, action: "VERIFIED" | "REJECTED") => {
    setModalClaim(claim);
    setModalAction(action);
    setModalNotes("");
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!modalClaim || !modalAction) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem("hoppr_token");
      if (!token) return;

      const res = await fetch(`/api/auth/admin/claims/${modalClaim.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: modalAction,
          notes: modalNotes || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update claim");
      }

      setModalOpen(false);
      fetchClaims(activeTab, page);
    } catch (err) {
      console.error("Update claim error:", err);
      alert(err instanceof Error ? err.message : "Failed to update claim");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTabCount = (status: TabType) => {
    // When viewing that tab, show actual total from API
    if (activeTab === status) return total;
    return null; // Only show count for active tab to avoid extra fetches
  };

  const tabCounts: Record<TabType, number | null> = {
    CLAIMED: activeTab === "CLAIMED" ? total : null,
    VERIFIED: activeTab === "VERIFIED" ? total : null,
    REJECTED: activeTab === "REJECTED" ? total : null,
  };

  return (
    <Container>
      <Header>
        <Title>Bar Claiming Approvals</Title>
      </Header>

      <Tabs>
        {(["CLAIMED", "VERIFIED", "REJECTED"] as TabType[]).map((tab) => (
          <Tab
            key={tab}
            $active={activeTab === tab}
            onClick={() => {
              setActiveTab(tab);
              setPage(1);
            }}
          >
            {tab === "CLAIMED" ? "Pending" : tab === "VERIFIED" ? "Approved" : "Rejected"}
            {tabCounts[tab] !== null && tabCounts[tab]! > 0 && (
              <TabBadge $variant={tab}>{tabCounts[tab]}</TabBadge>
            )}
          </Tab>
        ))}
      </Tabs>

      <Card>
        {loading ? (
          <LoadingSpinner />
        ) : claims.length === 0 ? (
          <EmptyState>
            <p style={{ fontWeight: 600, fontSize: "1rem", marginBottom: "0.5rem" }}>
              No {activeTab.toLowerCase()} claims
            </p>
            <p style={{ fontSize: "0.875rem" }}>
              {activeTab === "CLAIMED"
                ? "All claim requests have been processed."
                : `No ${activeTab.toLowerCase()} claims yet.`}
            </p>
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Bar</Th>
                <Th>Claimed By</Th>
                <Th>Date</Th>
                <Th>Documents</Th>
                {activeTab !== "CLAIMED" && <Th>Reviewed By</Th>}
                <Th>Status</Th>
                {activeTab === "CLAIMED" && <Th>Actions</Th>}
              </tr>
            </thead>
            <tbody>
              {claims.map((claim) => (
                <Tr key={claim.id}>
                  <Td>
                    <BarName>{claim.bar.name}</BarName>
                    <BarMeta>
                      {claim.bar.cityName || "Unknown"} ·{" "}
                      {(claim.bar.type || "").replace(/_/g, " ")}
                    </BarMeta>
                  </Td>
                  <Td>
                    <UserName>{claim.user.name || "Unknown"}</UserName>
                    <UserEmail>{claim.user.email}</UserEmail>
                  </Td>
                  <Td>{formatDate(claim.createdAt)}</Td>
                  <Td>
                    {claim.documentUrls.length > 0 ? (
                      <DocumentsList>
                        {claim.documentUrls.map((url, i) => (
                          <DocLink key={i} href={url} target="_blank" rel="noopener noreferrer">
                            Doc {i + 1}
                          </DocLink>
                        ))}
                      </DocumentsList>
                    ) : (
                      <span style={{ color: "#9ca3af", fontSize: "0.75rem" }}>
                        No documents
                      </span>
                    )}
                  </Td>
                  {activeTab !== "CLAIMED" && (
                    <Td>
                      {claim.reviewedBy ? (
                        <div>
                          <UserName>{claim.reviewedBy.name || "Unknown"}</UserName>
                          <BarMeta>
                            {claim.reviewedAt ? formatDate(claim.reviewedAt) : ""}
                          </BarMeta>
                        </div>
                      ) : (
                        <span style={{ color: "#9ca3af", fontSize: "0.75rem" }}>N/A</span>
                      )}
                    </Td>
                  )}
                  <Td>
                    <StatusBadge $status={claim.status}>{claim.status}</StatusBadge>
                  </Td>
                  {activeTab === "CLAIMED" && (
                    <Td>
                      <ActionButtons>
                        <ViewDocsButton
                          onClick={() => {
                            if (claim.documentUrls.length > 0) {
                              claim.documentUrls.forEach((url) =>
                                window.open(url, "_blank")
                              );
                            }
                          }}
                          disabled={claim.documentUrls.length === 0}
                        >
                          📄 Docs
                        </ViewDocsButton>
                        <ApproveButton onClick={() => openModal(claim, "VERIFIED")}>
                          ✓ Approve
                        </ApproveButton>
                        <RejectButton onClick={() => openModal(claim, "REJECTED")}>
                          ✕ Reject
                        </RejectButton>
                      </ActionButtons>
                    </Td>
                  )}
                </Tr>
              ))}
            </tbody>
          </Table>
        )}

        {totalPages > 1 && (
          <Pagination>
            <PageButton disabled={page <= 1} onClick={() => setPage(page - 1)}>
              ← Previous
            </PageButton>
            <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
              Page {page} of {totalPages}
            </span>
            <PageButton disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              Next →
            </PageButton>
          </Pagination>
        )}
      </Card>

      {/* Approval / Rejection Modal */}
      {modalOpen && modalClaim && modalAction && (
        <ModalOverlay onClick={() => !submitting && setModalOpen(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>
              {modalAction === "VERIFIED" ? "✓ Approve Claim" : "✕ Reject Claim"}
            </ModalTitle>
            <ModalText>
              {modalAction === "VERIFIED"
                ? `Approve the claim for "${modalClaim.bar.name}" by ${modalClaim.user.name || modalClaim.user.email}? The bar will be verified and the owner will gain access to the bar dashboard.`
                : `Reject the claim for "${modalClaim.bar.name}" by ${modalClaim.user.name || modalClaim.user.email}? The bar will remain unclaimed and the owner will not gain dashboard access.`}
            </ModalText>
            <ModalTextarea
              placeholder={
                modalAction === "VERIFIED"
                  ? "Optional: Add a note for the bar owner..."
                  : "Reason for rejection (recommended)..."
              }
              value={modalNotes}
              onChange={(e) => setModalNotes(e.target.value)}
            />
            <ModalButtons>
              <ModalButton
                $variant="secondary"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </ModalButton>
              <ModalButton
                $variant={modalAction === "VERIFIED" ? "primary" : "danger"}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting
                  ? "Processing..."
                  : modalAction === "VERIFIED"
                    ? "Approve"
                    : "Reject"}
              </ModalButton>
            </ModalButtons>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default ClaimsList;
