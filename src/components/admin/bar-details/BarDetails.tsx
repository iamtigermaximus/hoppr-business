"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import styled from "styled-components";
import Link from "next/link";
import {
  SkeletonBox,
  SkeletonCard,
  SkeletonText,
  SkeletonContentGrid,
  SkeletonSidebar,
  SkeletonPageHeader,
} from "@/components/ui/Skeleton";

const Container = styled.div`
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;

  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
`;

const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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

const Breadcrumb = styled.div`
  color: #6b7280;
  font-size: 0.875rem;

  a {
    color: #3b82f6;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;

  @media (min-width: 640px) {
    flex-wrap: nowrap;
  }
`;

const Button = styled.button<{ $variant?: "primary" | "secondary" | "danger" }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  white-space: nowrap;
  min-height: 44px;

  ${({ $variant }) => {
    switch ($variant) {
      case "primary":
        return `
          background: #3b82f6;
          color: white;
          &:hover { 
            background: #2563eb;
            transform: translateY(-1px);
          }
        `;
      case "danger":
        return `
          background: #ef4444;
          color: white;
          &:hover { 
            background: #dc2626;
            transform: translateY(-1px);
          }
        `;
      default:
        return `
          background: #6b7280;
          color: white;
          &:hover { 
            background: #4b5563;
            transform: translateY(-1px);
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const LinkButton = styled(Link)<{ $variant?: "primary" | "secondary" }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  white-space: nowrap;
  min-height: 44px;

  ${({ $variant }) =>
    $variant === "primary"
      ? `
        background: #3b82f6;
        color: white;
        &:hover { 
          background: #2563eb;
          transform: translateY(-1px);
        }
      `
      : `
        background: #6b7280;
        color: white;
        &:hover { 
          background: #4b5563;
          transform: translateY(-1px);
        }
      `}
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;

  @media (min-width: 1024px) {
    grid-template-columns: 2fr 1fr;
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

const Card = styled.div`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
`;

const CardTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const InfoGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const InfoLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const InfoValue = styled.div<{ $status?: string }>`
  font-size: 1rem;
  color: #1f2937;
  font-weight: 500;

  ${({ $status }) => {
    switch ($status) {
      case "VERIFIED":
        return "color: #166534;";
      case "CLAIMED":
        return "color: #1e40af;";
      case "UNCLAIMED":
        return "color: #6b7280;";
      default:
        return "color: #1f2937";
    }
  }}
`;

const StatusBadge = styled.span<{ $status: string }>`
  padding: 0.375rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;

  ${({ $status }) => {
    switch ($status) {
      case "VERIFIED":
        return "background: #dcfce7; color: #166534;";
      case "CLAIMED":
        return "background: #dbeafe; color: #1e40af;";
      case "UNCLAIMED":
        return "background: #f3f4f6; color: #6b7280;";
      case "SUSPENDED":
        return "background: #fef2f2; color: #dc2626;";
      default:
        return "background: #f3f4f6; color: #6b7280;";
    }
  }}
`;

const Badge = styled.span`
  background: #f3f4f6;
  color: #374151;
  padding: 0.375rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
`;

const AmenitiesGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const Image = styled.img`
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6b7280;
  text-align: center;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
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

// Modal for Invite only
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
  max-width: 400px;
`;

const ModalTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #1f2937;
`;

const ModalInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const ModalButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
`;

const ColumnFlex = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const QuickActionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const PendingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const PendingInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const PendingName = styled.span`
  font-weight: 600;
  color: #1f2937;
  font-size: 0.875rem;
`;

const PendingEmail = styled.span`
  color: #6b7280;
  font-size: 0.75rem;
`;

const ApproveButton = styled.button`
  padding: 0.5rem 1rem;
  background: #16a34a;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-weight: 600;
  font-size: 0.75rem;
  cursor: pointer;
  white-space: nowrap;
  min-height: 36px;

  &:hover {
    background: #15803d;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// Quality Score specific components
const ScoreContainer = styled.div`
  margin-top: 0.5rem;
`;

const ScoreHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const ScoreValue = styled.span<{ $score: number }>`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ $score }) => {
    if ($score >= 70) return "#16a34a";
    if ($score >= 50) return "#f59e0b";
    if ($score >= 30) return "#f97316";
    return "#dc2626";
  }};
`;

const ScoreBar = styled.div`
  width: 100%;
  height: 8px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
`;

const ScoreFill = styled.div<{ $score: number }>`
  height: 100%;
  width: ${({ $score }) => $score}%;
  border-radius: 4px;
  transition: width 0.5s ease;
  background: ${({ $score }) => {
    if ($score >= 70) return "#16a34a";
    if ($score >= 50) return "#f59e0b";
    if ($score >= 30) return "#f97316";
    return "#dc2626";
  }};
`;

const TierBadge = styled.span<{ $tier: string }>`
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  ${({ $tier }) => {
    switch ($tier) {
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

// Default operating hours for display only
const DEFAULT_OPERATING_HOURS = {
  Monday: { open: "16:00", close: "02:00" },
  Tuesday: { open: "16:00", close: "02:00" },
  Wednesday: { open: "16:00", close: "02:00" },
  Thursday: { open: "16:00", close: "02:00" },
  Friday: { open: "16:00", close: "04:00" },
  Saturday: { open: "14:00", close: "04:00" },
  Sunday: { open: "14:00", close: "02:00" },
};

interface OperatingHours {
  Monday: { open: string; close: string };
  Tuesday: { open: string; close: string };
  Wednesday: { open: string; close: string };
  Thursday: { open: string; close: string };
  Friday: { open: string; close: string };
  Saturday: { open: string; close: string };
  Sunday: { open: string; close: string };
}

interface Bar {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  district: string | null;
  type: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  operatingHours: OperatingHours | null;
  priceRange: string | null;
  coverCharge: number | null;
  musicTags: string[];
  capacity: number | null;
  amenities: string[];
  coverImage: string | null;
  imageUrls: string[];
  logoUrl: string | null;
  status: string;
  isVerified: boolean;
  isActive: boolean;
  vipEnabled: boolean;
  profileViews: number;
  directionClicks: number;
  websiteClicks: number;
  callClicks: number;
  shareCount: number;
  qualityScore: number | null;
  performanceTier: string | null;
  createdAt: string;
  updatedAt: string;
  claimedAt: string | null;
  claims: Claim[];
  latestOutreach: {
    id: string;
    method: string;
    status: string;
    notes: string | null;
    followUpAt: string | null;
    createdAt: string;
    user: { name: string | null } | null;
  } | null;
}

interface Claim {
  id: string;
  status: string;
  notes: string | null;
  documentUrls: string[];
  createdAt: string;
  reviewedAt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string | null;
  } | null;
  reviewedBy: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface InviteResponse {
  success: boolean;
  message: string;
  inviteLink: string;
}

const BarDetails = () => {
  const params = useParams();
  const router = useRouter();
  const [bar, setBar] = useState<Bar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviting, setInviting] = useState(false);

  // Pending owner approvals
  const [pendingOwners, setPendingOwners] = useState<any[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Outreach log form state
  const [showLogForm, setShowLogForm] = useState(false);
  const [logMethod, setLogMethod] = useState("EMAIL");
  const [logStatus, setLogStatusState] = useState("EMAILED");
  const [logNotes, setLogNotesState] = useState("");
  const [logFollowUp, setLogFollowUpState] = useState("");
  const [logSubmitting, setLogSubmitting] = useState(false);
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const barId = params.id as string;

  useEffect(() => {
    fetchBar();
    fetchPendingOwners();
  }, [barId]);

  const fetchPendingOwners = async () => {
    try {
      const token = localStorage.getItem("hoppr_token");
      const res = await fetch(`/api/auth/admin/staff/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Filter to only show pending owners for this bar
        setPendingOwners(
          (data.pending || []).filter((s: any) => s.barId === barId),
        );
      }
    } catch {
      // Best-effort
    }
  };

  const handleApproveOwner = async (staffId: string) => {
    setApprovingId(staffId);
    try {
      const token = localStorage.getItem("hoppr_token");
      const res = await fetch(`/api/auth/admin/staff/pending`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ staffId }),
      });
      if (res.ok) {
        setPendingOwners((prev) => prev.filter((s) => s.id !== staffId));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to approve");
      }
    } catch {
      alert("Failed to approve owner");
    } finally {
      setApprovingId(null);
    }
  };

  const fetchBar = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("hoppr_token");

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`/api/auth/admin/bars/${barId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        throw new Error("Authentication required");
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch bar: ${response.status}`);
      }

      const result = await response.json();
      const barData = result.bar || result.data || result;
      setBar(barData);
    } catch (error) {
      console.error("Error fetching bar:", error);
      setError(error instanceof Error ? error.message : "Failed to load bar");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this bar? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("hoppr_token");
      const response = await fetch(`/api/auth/admin/bars/${barId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to delete bar");
      router.push("/admin/bars");
    } catch (error) {
      console.error("Error deleting bar:", error);
      alert("Failed to delete bar");
    }
  };

  const handleStatusUpdate = async (newStatus: string, extra?: { isVerified?: boolean; isActive?: boolean }) => {
    // Optimistic: update UI immediately
    setBar((prev) => prev ? {
      ...prev,
      status: newStatus,
      ...(extra?.isVerified !== undefined ? { isVerified: extra.isVerified } : {}),
      ...(extra?.isActive !== undefined ? { isActive: extra.isActive } : {}),
    } : prev);
    try {
      const token = localStorage.getItem("hoppr_token");
      const response = await fetch(`/api/auth/admin/bars/${barId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus, ...extra }),
      });
      if (!response.ok) {
        fetchBar(); // revert on failure
        console.error("Failed to update status:", response.status);
      }
    } catch (error) {
      fetchBar(); // revert on network error
      console.error("Error updating status:", error);
    }
  };

  const handleOutreachStatusChange = async (newStatus: string) => {
    // Optimistic
    setBar((prev) => prev ? {
      ...prev,
      latestOutreach: {
        id: prev.latestOutreach?.id ?? `opt-${Date.now()}`,
        method: prev.latestOutreach?.method ?? "EMAIL",
        status: newStatus,
        notes: prev.latestOutreach?.notes ?? null,
        followUpAt: prev.latestOutreach?.followUpAt ?? null,
        createdAt: prev.latestOutreach?.createdAt ?? new Date().toISOString(),
        user: prev.latestOutreach?.user ?? null,
      },
    } : prev);
    setStatusSubmitting(true);
    try {
      const token = localStorage.getItem("hoppr_token");
      if (!token) { fetchBar(); return; }
      const res = await fetch("/api/auth/admin/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ barId, method: "EMAIL", status: newStatus, notes: null, followUpAt: null }),
      });
      if (!res.ok) { fetchBar(); console.error("Outreach status change failed:", res.status); }
    } catch (err) {
      fetchBar();
      console.error("Outreach status change error:", err);
    } finally { setStatusSubmitting(false); }
  };

  const openLogForm = () => {
    const current = bar?.latestOutreach?.status ?? "NOT_CONTACTED";
    setLogStatusState(current);
    setLogMethod("EMAIL");
    setLogNotesState("");
    setLogFollowUpState("");
    setShowLogForm(true);
  };

  const handleSubmitLog = async () => {
    if (!bar) return;
    // Optimistic
    setBar((prev) => prev ? {
      ...prev,
      latestOutreach: {
        id: prev.latestOutreach?.id ?? `opt-${Date.now()}`,
        method: logMethod,
        status: logStatus,
        notes: logNotes || null,
        followUpAt: logFollowUp || null,
        createdAt: prev.latestOutreach?.createdAt ?? new Date().toISOString(),
        user: prev.latestOutreach?.user ?? null,
      },
    } : prev);
    setShowLogForm(false);
    setLogSubmitting(true);
    try {
      const token = localStorage.getItem("hoppr_token");
      if (!token) { fetchBar(); return; }
      const res = await fetch("/api/auth/admin/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ barId, method: logMethod, status: logStatus, notes: logNotes || null, followUpAt: logFollowUp || null }),
      });
      if (!res.ok) { fetchBar(); console.error("Log contact failed:", res.status); }
    } catch (err) {
      fetchBar();
      console.error("Log contact error:", err);
    } finally { setLogSubmitting(false); }
  };

  const sendInvitation = async () => {
    setInviting(true);
    try {
      const token = localStorage.getItem("hoppr_token");
      const response = await fetch(`/api/auth/admin/bars/${barId}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: inviteEmail,
          name: inviteName,
          role: "OWNER",
        }),
      });

      const data = (await response.json()) as InviteResponse;
      if (response.ok) {
        alert(
          `Invitation sent! Share this link with the bar owner:\n\n${data.inviteLink}`,
        );
        setShowInviteModal(false);
        setInviteEmail("");
        setInviteName("");
      } else {
        alert(data.message || "Failed to send invitation");
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      alert("Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  const fetchScores = async () => {
    try {
      const token = localStorage.getItem("hoppr_token");
      const res = await fetch(
        `/api/auth/admin/bars/calculate-scores?barId=${barId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        fetchBar(); // Refresh bar data to show new scores
      }
    } catch (err) {
      console.error("Failed to calculate scores:", err);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper to clean city name (remove postal code)
  const cleanCityName = (city: string) => {
    if (!city) return "";
    return city.replace(/^\d+\s+/, "").trim();
  };

  if (loading) {
    return (
      <Container>
        <SkeletonPageHeader>
          <div>
            <SkeletonBox $width="140px" $height="1.5rem" />
            <SkeletonBox $width="200px" $height="0.875rem" style={{ marginTop: "0.5rem" }} />
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <SkeletonBox $width="100px" $height="2.75rem" $radius="0.5rem" />
            <SkeletonBox $width="100px" $height="2.75rem" $radius="0.5rem" />
            <SkeletonBox $width="100px" $height="2.75rem" $radius="0.5rem" />
          </div>
        </SkeletonPageHeader>
        <SkeletonContentGrid>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <SkeletonCard>
              <SkeletonBox $width="120px" $height="1rem" />
              <SkeletonText $lines={3} />
            </SkeletonCard>
            <SkeletonCard>
              <SkeletonBox $width="100px" $height="1rem" />
              <SkeletonText $lines={4} />
            </SkeletonCard>
          </div>
          <SkeletonSidebar>
            <SkeletonCard>
              <SkeletonBox $width="80px" $height="1rem" />
              <SkeletonText $lines={4} $lastShort />
            </SkeletonCard>
            <SkeletonCard>
              <SkeletonBox $width="100px" $height="1rem" />
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <SkeletonBox $width="100%" $height="2.25rem" $radius="0.5rem" />
                <SkeletonBox $width="100%" $height="2.25rem" $radius="0.5rem" />
                <SkeletonBox $width="100%" $height="2.25rem" $radius="0.5rem" />
              </div>
            </SkeletonCard>
          </SkeletonSidebar>
        </SkeletonContentGrid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorState>
          <h3>Error</h3>
          <p>{error}</p>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              marginTop: "1rem",
            }}
          >
            <Button
              $variant="primary"
              onClick={() => router.push("/admin/bars")}
            >
              ← Back to Bars
            </Button>
            <Button $variant="secondary" onClick={fetchBar}>
              🔄 Try Again
            </Button>
          </div>
        </ErrorState>
      </Container>
    );
  }

  if (!bar) {
    return (
      <Container>
        <ErrorState>
          <h3>Bar Not Found</h3>
          <p>The bar you're looking for doesn't exist or has been deleted.</p>
          <Button $variant="primary" onClick={() => router.push("/admin/bars")}>
            ← Back to Bars
          </Button>
        </ErrorState>
      </Container>
    );
  }

  // Get display hours (use bar's hours or default)
  const displayHours =
    bar.operatingHours && Object.keys(bar.operatingHours).length > 0
      ? bar.operatingHours
      : DEFAULT_OPERATING_HOURS;

  return (
    <Container>
      <Header>
        <TitleSection>
          <Breadcrumb>
            <Link href="/admin/bars">Bars Database</Link> / {bar.name}
          </Breadcrumb>
          <Title>{bar.name}</Title>
        </TitleSection>
        <ActionButtons>
          <LinkButton href={`/admin/bars/${barId}/edit`} $variant="primary">
            Edit
          </LinkButton>
          <Button $variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </ActionButtons>
      </Header>

      <ContentGrid>
        <MainContent>
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <SectionGrid>
              <InfoGroup>
                <InfoLabel>Name</InfoLabel>
                <InfoValue>{bar.name}</InfoValue>
              </InfoGroup>
              <InfoGroup>
                <InfoLabel>Type</InfoLabel>
                <InfoValue>{bar.type.replace("_", " ")}</InfoValue>
              </InfoGroup>
              <InfoGroup>
                <InfoLabel>Description</InfoLabel>
                <InfoValue>
                  {bar.description || "No description provided"}
                </InfoValue>
              </InfoGroup>
              <InfoGroup>
                <InfoLabel>Price Range</InfoLabel>
                <InfoValue>{bar.priceRange || "Not specified"}</InfoValue>
              </InfoGroup>
              <InfoGroup>
                <InfoLabel>Capacity</InfoLabel>
                <InfoValue>
                  {bar.capacity ? `${bar.capacity} people` : "Not specified"}
                </InfoValue>
              </InfoGroup>
              <InfoGroup>
                <InfoLabel>Cover Charge</InfoLabel>
                <InfoValue>
                  {bar.coverCharge != null
                    ? bar.coverCharge === 0
                      ? "Free entry"
                      : `€${bar.coverCharge}`
                    : "Not specified"}
                </InfoValue>
              </InfoGroup>
              <InfoGroup>
                <InfoLabel>Music Tags</InfoLabel>
                <InfoValue>
                  {bar.musicTags?.length > 0
                    ? bar.musicTags.join(", ")
                    : "Not specified"}
                </InfoValue>
              </InfoGroup>
            </SectionGrid>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <SectionGrid>
              <InfoGroup>
                <InfoLabel>Address</InfoLabel>
                <InfoValue>{bar.address}</InfoValue>
              </InfoGroup>
              <InfoGroup>
                <InfoLabel>City</InfoLabel>
                <InfoValue>{cleanCityName(bar.city)}</InfoValue>
              </InfoGroup>
              <InfoGroup>
                <InfoLabel>District</InfoLabel>
                <InfoValue>{bar.district || "Not specified"}</InfoValue>
              </InfoGroup>
              {bar.latitude && bar.longitude && (
                <InfoGroup>
                  <InfoLabel>Coordinates</InfoLabel>
                  <InfoValue>{`${bar.latitude}, ${bar.longitude}`}</InfoValue>
                </InfoGroup>
              )}
            </SectionGrid>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <SectionGrid>
              <InfoGroup>
                <InfoLabel>Phone</InfoLabel>
                <InfoValue>{bar.phone || "Not provided"}</InfoValue>
              </InfoGroup>
              <InfoGroup>
                <InfoLabel>Email</InfoLabel>
                <InfoValue>{bar.email || "Not provided"}</InfoValue>
              </InfoGroup>
              <InfoGroup>
                <InfoLabel>Website</InfoLabel>
                <InfoValue>
                  {bar.website ? (
                    <a
                      href={bar.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {bar.website}
                    </a>
                  ) : (
                    "Not provided"
                  )}
                </InfoValue>
              </InfoGroup>
              <InfoGroup>
                <InfoLabel>Instagram</InfoLabel>
                <InfoValue>
                  {bar.instagram ? (
                    <a
                      href={`https://instagram.com/${bar.instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {bar.instagram}
                    </a>
                  ) : (
                    "Not provided"
                  )}
                </InfoValue>
              </InfoGroup>
            </SectionGrid>
          </Card>

          {/* Amenities */}
          {bar.amenities && bar.amenities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <AmenitiesGrid>
                {bar.amenities.map((amenity, index) => (
                  <Badge key={index}>{amenity.replace(/_/g, " ")}</Badge>
                ))}
              </AmenitiesGrid>
            </Card>
          )}

          {/* Operating Hours - Display Only (Edit via Edit button) */}
          {/* Operating Hours - Display Only (Edit via Edit button) */}
          <Card>
            <CardHeader>
              <CardTitle>Operating Hours</CardTitle>
            </CardHeader>
            <SectionGrid>
              {[
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ].map((day) => {
                const hours = displayHours[day as keyof OperatingHours];
                return (
                  <InfoGroup key={day}>
                    <InfoLabel>{day}</InfoLabel>
                    <InfoValue>
                      {hours?.open && hours?.close && hours.open !== "Closed"
                        ? `${hours.open} - ${hours.close}`
                        : "Closed"}
                    </InfoValue>
                  </InfoGroup>
                );
              })}
            </SectionGrid>
          </Card>

          {/* Images */}
          {/* Images */}
          {(bar.coverImage ||
            bar.logoUrl ||
            (bar.imageUrls && bar.imageUrls.length > 0)) && (
            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
              </CardHeader>

              {/* Logo - New addition */}
              {bar.logoUrl && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <InfoLabel>Logo</InfoLabel>
                  <div style={{ marginTop: "0.5rem" }}>
                    <Image
                      src={bar.logoUrl}
                      alt="Logo"
                      style={{
                        height: "100px",
                        width: "100px",
                        objectFit: "cover",
                        borderRadius: "50%",
                        border: "2px solid #e5e7eb",
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://placehold.co/200x200?text=Logo+Not+Found";
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Cover Image */}
              {bar.coverImage && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <InfoLabel>Cover Image</InfoLabel>
                  <Image
                    src={bar.coverImage}
                    alt="Cover"
                    style={{
                      height: "200px",
                      width: "100%",
                      objectFit: "cover",
                      marginTop: "0.5rem",
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/800x400?text=Image+Not+Found";
                    }}
                  />
                </div>
              )}

              {/* Gallery Images */}
              {bar.imageUrls && bar.imageUrls.length > 0 && (
                <div>
                  <InfoLabel>Gallery ({bar.imageUrls.length} images)</InfoLabel>
                  <ImageGrid>
                    {bar.imageUrls.map((url, index) => (
                      <Image
                        key={index}
                        src={url}
                        alt={`Gallery ${index + 1}`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://placehold.co/400x300?text=Image+Not+Found";
                        }}
                      />
                    ))}
                  </ImageGrid>
                </div>
              )}
            </Card>
          )}
        </MainContent>

        <Sidebar>
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <ColumnFlex>
              <InfoGroup>
                <InfoLabel>Verification Status</InfoLabel>
                <StatusBadge $status={bar.isVerified ? "VERIFIED" : bar.status}>
                  {bar.isVerified ? "VERIFIED" : bar.status}
                </StatusBadge>
              </InfoGroup>
              <InfoGroup>
                <InfoLabel>Active Status</InfoLabel>
                <InfoValue $status={bar.isActive ? "ACTIVE" : "INACTIVE"}>
                  {bar.isActive ? "Active ✅" : "Inactive ⏸️"}
                </InfoValue>
              </InfoGroup>
              <InfoGroup>
                <InfoLabel>VIP Enabled</InfoLabel>
                <InfoValue>{bar.vipEnabled ? "Yes ✨" : "No"}</InfoValue>
              </InfoGroup>
              <InfoGroup>
                <InfoLabel>Profile Views</InfoLabel>
                <InfoValue>{bar.profileViews?.toLocaleString() || 0}</InfoValue>
              </InfoGroup>
              <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "0.25rem 0" }} />
              <InfoGroup>
                <InfoLabel>Outreach Status</InfoLabel>
                <select
                  value={bar.latestOutreach?.status ?? "NOT_CONTACTED"}
                  disabled={statusSubmitting}
                  onChange={(e) => {
                    if (e.target.value !== (bar.latestOutreach?.status ?? "NOT_CONTACTED")) {
                      handleOutreachStatusChange(e.target.value);
                    }
                  }}
                  style={{
                    padding: "0.375rem 0.5rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #d1d5db",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    background: "white",
                    cursor: "pointer",
                    width: "100%",
                  }}
                >
                  <option value="NOT_CONTACTED">Not Contacted</option>
                  <option value="EMAILED">Emailed</option>
                  <option value="CALLED">Called</option>
                  <option value="IN_DISCUSSION">In Discussion</option>
                  <option value="CLAIMED">Claimed</option>
                  <option value="DECLINED">Declined</option>
                </select>
              </InfoGroup>
              {bar.latestOutreach && bar.latestOutreach.status !== "NOT_CONTACTED" && (
                <InfoGroup>
                  <InfoLabel>Last Contact</InfoLabel>
                  <InfoValue style={{ fontSize: "0.8125rem" }}>
                    {new Date(bar.latestOutreach.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    {" · "}
                    {bar.latestOutreach.method === "EMAIL" ? "Email" :
                     bar.latestOutreach.method === "PHONE_CALL" ? "Phone" :
                     bar.latestOutreach.method === "IN_PERSON" ? "In Person" :
                     bar.latestOutreach.method === "SOCIAL_MEDIA" ? "Social" : bar.latestOutreach.method}
                    {bar.latestOutreach.user?.name ? ` by ${bar.latestOutreach.user.name}` : ""}
                  </InfoValue>
                </InfoGroup>
              )}
            </ColumnFlex>
          </Card>

          {/* Log Contact Form */}
          {showLogForm && (
            <Card>
              <CardHeader>
                <CardTitle>Log Contact</CardTitle>
              </CardHeader>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <InfoGroup>
                  <InfoLabel>Method</InfoLabel>
                  <select
                    value={logMethod}
                    onChange={(e) => setLogMethod(e.target.value)}
                    style={{ padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #d1d5db", fontSize: "0.8125rem" }}
                  >
                    <option value="EMAIL">Email</option>
                    <option value="PHONE_CALL">Phone</option>
                    <option value="IN_PERSON">In Person</option>
                    <option value="SOCIAL_MEDIA">Social</option>
                  </select>
                </InfoGroup>
                <InfoGroup>
                  <InfoLabel>Status</InfoLabel>
                  <select
                    value={logStatus}
                    onChange={(e) => setLogStatusState(e.target.value)}
                    style={{ padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #d1d5db", fontSize: "0.8125rem" }}
                  >
                    <option value="NOT_CONTACTED">Not Contacted</option>
                    <option value="EMAILED">Emailed</option>
                    <option value="CALLED">Called</option>
                    <option value="IN_DISCUSSION">In Discussion</option>
                    <option value="CLAIMED">Claimed</option>
                    <option value="DECLINED">Declined</option>
                  </select>
                </InfoGroup>
                <InfoGroup>
                  <InfoLabel>Notes</InfoLabel>
                  <textarea
                    placeholder="What was discussed?"
                    value={logNotes}
                    onChange={(e) => setLogNotesState(e.target.value)}
                    style={{ padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #d1d5db", fontSize: "0.8125rem", resize: "vertical", minHeight: "60px", fontFamily: "inherit" }}
                  />
                </InfoGroup>
                <InfoGroup>
                  <InfoLabel>Follow-up Date (optional)</InfoLabel>
                  <input
                    type="date"
                    value={logFollowUp}
                    onChange={(e) => setLogFollowUpState(e.target.value)}
                    style={{ padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #d1d5db", fontSize: "0.8125rem" }}
                  />
                </InfoGroup>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <Button $variant="primary" onClick={handleSubmitLog} disabled={logSubmitting}>
                    {logSubmitting ? "Saving..." : "Save"}
                  </Button>
                  <Button onClick={() => setShowLogForm(false)} disabled={logSubmitting}>Cancel</Button>
                </div>
              </div>
            </Card>
          )}

          {/* Claim Information */}
          {bar.claims && bar.claims.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Claim Information</CardTitle>
              </CardHeader>
              <ColumnFlex>
                {bar.claims.map((claim) => (
                  <PendingRow key={claim.id}>
                    <PendingInfo>
                      <PendingName>
                        <StatusBadge $status={claim.status}>
                          {claim.status}
                        </StatusBadge>
                      </PendingName>
                      {claim.user && (
                        <PendingEmail>
                          {claim.user.name || claim.user.email}
                          {claim.user.phoneNumber &&
                            ` • ${claim.user.phoneNumber}`}
                        </PendingEmail>
                      )}
                      {claim.notes && (
                        <PendingEmail
                          style={{
                            whiteSpace: "pre-wrap",
                            marginTop: "0.25rem",
                          }}
                        >
                          {claim.notes}
                        </PendingEmail>
                      )}
                      <PendingEmail>
                        {formatDate(claim.createdAt)}
                        {claim.reviewedAt &&
                          ` → Reviewed ${formatDate(claim.reviewedAt)}`}
                      </PendingEmail>
                      {claim.reviewedBy && (
                        <PendingEmail>
                          Reviewer:{" "}
                          {claim.reviewedBy.name || claim.reviewedBy.email}
                        </PendingEmail>
                      )}
                      {claim.documentUrls && claim.documentUrls.length > 0 && (
                        <div
                          style={{
                            marginTop: "0.25rem",
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.5rem",
                          }}
                        >
                          {claim.documentUrls.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: "0.75rem",
                                color: "#3b82f6",
                                textDecoration: "underline",
                              }}
                            >
                              Doc {idx + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </PendingInfo>
                  </PendingRow>
                ))}
              </ColumnFlex>
            </Card>
          )}

          {/* Quality Score Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quality Score</CardTitle>
            </CardHeader>
            <ColumnFlex>
              {bar.qualityScore !== null && bar.qualityScore !== undefined ? (
                <>
                  <ScoreContainer>
                    <ScoreHeader>
                      <ScoreValue $score={bar.qualityScore}>
                        {bar.qualityScore}/100
                      </ScoreValue>
                      {bar.performanceTier && (
                        <TierBadge $tier={bar.performanceTier}>
                          {bar.performanceTier}
                        </TierBadge>
                      )}
                    </ScoreHeader>
                    <ScoreBar>
                      <ScoreFill $score={bar.qualityScore} />
                    </ScoreBar>
                  </ScoreContainer>
                  <InfoGroup>
                    <InfoLabel>Engagement Clicks</InfoLabel>
                    <InfoValue>
                      {(
                        (bar.directionClicks || 0) +
                        (bar.websiteClicks || 0) +
                        (bar.callClicks || 0)
                      ).toLocaleString()}{" "}
                      total
                    </InfoValue>
                  </InfoGroup>
                  <InfoGroup>
                    <InfoLabel>Shares</InfoLabel>
                    <InfoValue>
                      {bar.shareCount?.toLocaleString() || 0}
                    </InfoValue>
                  </InfoGroup>
                </>
              ) : (
                <div
                  style={{
                    color: "#9ca3af",
                    fontSize: "0.875rem",
                    padding: "0.5rem 0",
                  }}
                >
                  Quality scores not yet calculated.{" "}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      fetchScores();
                    }}
                    style={{ color: "#7c3aed", textDecoration: "underline" }}
                  >
                    Calculate now
                  </a>
                </div>
              )}
            </ColumnFlex>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <ColumnFlex>
              <InfoGroup>
                <InfoLabel>Created</InfoLabel>
                <InfoValue>{formatDate(bar.createdAt)}</InfoValue>
              </InfoGroup>
              <InfoGroup>
                <InfoLabel>Last Updated</InfoLabel>
                <InfoValue>{formatDate(bar.updatedAt)}</InfoValue>
              </InfoGroup>
              {bar.claimedAt && (
                <InfoGroup>
                  <InfoLabel>Claimed</InfoLabel>
                  <InfoValue>{formatDate(bar.claimedAt)}</InfoValue>
                </InfoGroup>
              )}
            </ColumnFlex>
          </Card>

          {/* Pending Owner Approvals */}
          {pendingOwners.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Owner Approvals</CardTitle>
              </CardHeader>
              {pendingOwners.map((owner: any) => (
                <PendingRow key={owner.id}>
                  <PendingInfo>
                    <PendingName>{owner.name}</PendingName>
                    <PendingEmail>{owner.email}</PendingEmail>
                  </PendingInfo>
                  <ApproveButton
                    onClick={() => handleApproveOwner(owner.id)}
                    disabled={approvingId === owner.id}
                  >
                    {approvingId === owner.id ? "Approving..." : "Approve"}
                  </ApproveButton>
                </PendingRow>
              ))}
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <QuickActionsContainer>
              <Button
                $variant="secondary"
                onClick={() => handleStatusUpdate("VERIFIED", { isVerified: true })}
                disabled={bar.isVerified}
              >
                ✅ Verify Bar
              </Button>
              <Button
                $variant="secondary"
                onClick={() =>
                  handleStatusUpdate(
                    bar.isActive ? "SUSPENDED" : "CLAIMED",
                    bar.isActive ? { isActive: false } : { isActive: true }
                  )
                }
              >
                {bar.isActive ? "⏸️ Suspend" : "▶️ Activate"}
              </Button>
              <Button
                $variant="secondary"
                onClick={() => setShowInviteModal(true)}
              >
                📧 Invite Bar Owner
              </Button>
              <Button
                $variant="secondary"
                onClick={openLogForm}
              >
                📝 Log Contact
              </Button>
            </QuickActionsContainer>
          </Card>
        </Sidebar>
      </ContentGrid>

      {/* Invite Modal (Only modal left) */}
      {showInviteModal && (
        <ModalOverlay onClick={() => setShowInviteModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Invite Bar Owner</ModalTitle>
            <ModalInput
              type="text"
              placeholder="Owner Name"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
            />
            <ModalInput
              type="email"
              placeholder="Owner Email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <ModalButtonGroup>
              <Button onClick={sendInvitation} disabled={inviting}>
                {inviting ? "Sending..." : "Send Invitation"}
              </Button>
              <Button
                $variant="secondary"
                onClick={() => setShowInviteModal(false)}
              >
                Cancel
              </Button>
            </ModalButtonGroup>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default BarDetails;
