"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { getToken } from "@/lib/dashboard-utils";
import KPICards from "./KPICards";
import ActivityFeed from "./ActivityFeed";
import IncidentsPanel from "./IncidentsPanel";

// ---- Types ----

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin";
  adminRole: "SUPER_ADMIN" | "CONTENT_MODERATOR" | "ANALYTICS_VIEWER" | "SUPPORT";
}

// ---- Layout styled components ----

const Container = styled.div`
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  @media (max-width: 768px) { padding: 1rem; }
  @media (max-width: 480px) { padding: 0.75rem; }
`;

const Header = styled.div`
  margin-bottom: 0.5rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
  @media (max-width: 768px) { font-size: 1.75rem; }
  @media (max-width: 480px) { font-size: 1.5rem; }
`;

const Subtitle = styled.p`
  color: #6b7280;
  font-size: 0.9375rem;
  margin: 0;
`;

const SectionTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
  @media (max-width: 480px) { font-size: 1rem; }
`;

const QuickActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`;

const QuickActionCard = styled.div`
  background: white;
  padding: 1.25rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const ActionTitle = styled.h3`
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem;
`;

const ActionDescription = styled.p`
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
`;

// ---- Score modal styled components ----

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  max-width: 420px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
`;

const ModalTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
`;

const ModalBody = styled.div`
  font-size: 0.875rem;
  color: #374151;
  margin-bottom: 1.25rem;
  p { margin: 0 0 0.5rem; }
`;

const ModalStatRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.375rem 0;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.8125rem;
  &:last-child { border-bottom: none; }
`;

const ModalStatLabel = styled.span`
  color: #6b7280;
`;

const ModalStatValue = styled.span`
  font-weight: 600;
  color: #1f2937;
`;

const ModalButton = styled.button`
  width: 100%;
  padding: 0.625rem;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #6d28d9; }
`;

// ---- Component ----

export default function DashboardContent() {
  const router = useRouter();

  // User — read from localStorage on mount
  const [user] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("hoppr_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          id: parsed.id,
          email: parsed.email,
          name: parsed.name,
          role: "admin",
          adminRole: parsed.adminRole || "SUPER_ADMIN",
        };
      }
    } catch {
      // ignore parse errors
    }
    return null;
  });

  // Score recalculation state
  const [recalculating, setRecalculating] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [scoreResult, setScoreResult] = useState<{
    success: boolean;
    processed?: number;
    averageScore?: number;
    tiers?: Record<string, number>;
    error?: string;
  } | null>(null);

  const handleRecalculateScores = async () => {
    setRecalculating(true);
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch("/api/auth/admin/bars/calculate-scores", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setScoreResult({
          success: true,
          processed: data.processed,
          averageScore: data.stats?.averageScore,
          tiers: data.tierDistribution,
        });
      } else {
        setScoreResult({
          success: false,
          error: data.error || "Failed to recalculate scores",
        });
      }
      setShowScoreModal(true);
    } catch {
      setScoreResult({ success: false, error: "Network error. Please try again." });
      setShowScoreModal(true);
    } finally {
      setRecalculating(false);
    }
  };

  const quickActions = [
    {
      title: "View Analytics",
      description: "Deep dive into platform performance and insights",
      icon: "",
      onClick: () => router.push("/admin/analytics"),
    },
    {
      title: "Manage Bars",
      description: "Review and manage bar registrations and verifications",
      icon: "",
      onClick: () => router.push("/admin/bars"),
    },
    {
      title: "User Management",
      description: "View and manage platform users and permissions",
      icon: "",
      onClick: () => router.push("/admin/users"),
    },
    {
      title: recalculating ? "Calculating..." : "Recalculate Scores",
      description: "Recompute quality scores and performance tiers for all bars",
      icon: "",
      onClick: () => handleRecalculateScores(),
    },
  ];

  // ---- Render ----

  if (!user) {
    return (
      <Container>
        <Header>
          <Title>Welcome back!</Title>
          <Subtitle>Please sign in to access your dashboard.</Subtitle>
        </Header>
        <div style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
          <button
            onClick={() => router.push("/login")}
            style={{
              background: "#7c3aed",
              color: "#fff",
              border: "none",
              padding: "0.75rem 2rem",
              borderRadius: "0.5rem",
              fontSize: "0.9375rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Go to Login
          </button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Welcome back, {user.name}!</Title>
        <Subtitle>Here&apos;s what&apos;s happening with your platform today</Subtitle>
      </Header>

      {/* KPI Cards — self-contained data fetching */}
      <KPICards />

      {/* Quick Actions */}
      <SectionTitle>Quick Actions</SectionTitle>
      <QuickActionsGrid>
        {quickActions.map((action, index) => (
          <QuickActionCard key={index} onClick={action.onClick}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem" }}>
              <div style={{ fontSize: "1.5rem" }}>{action.icon}</div>
              <ActionTitle>{action.title}</ActionTitle>
            </div>
            <ActionDescription>{action.description}</ActionDescription>
          </QuickActionCard>
        ))}
      </QuickActionsGrid>

      {/* Activity Feed — self-contained data fetching */}
      <ActivityFeed limit={5} />

      {/* Bar Incidents — self-contained data fetching */}
      <IncidentsPanel />

      {/* Score Recalculation Modal */}
      {showScoreModal && scoreResult && (
        <ModalOverlay onClick={() => setShowScoreModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>
              {scoreResult.success ? "Scores Recalculated" : "Recalculation Failed"}
            </ModalTitle>
            <ModalBody>
              {scoreResult.success ? (
                <>
                  <p>
                    Successfully recalculated scores for <strong>{scoreResult.processed}</strong>{" "}
                    bars.
                  </p>
                  {scoreResult.averageScore != null && (
                    <ModalStatRow>
                      <ModalStatLabel>Average Score</ModalStatLabel>
                      <ModalStatValue>{scoreResult.averageScore}/100</ModalStatValue>
                    </ModalStatRow>
                  )}
                  {scoreResult.tiers && (
                    <>
                      {(["ACTIVE", "GROWING", "STAGNANT", "DEAD", "NEW"] as const).map((tier) => (
                        <ModalStatRow key={tier}>
                          <ModalStatLabel>{tier.charAt(0) + tier.slice(1).toLowerCase()}</ModalStatLabel>
                          <ModalStatValue>{scoreResult.tiers![tier] ?? 0}</ModalStatValue>
                        </ModalStatRow>
                      ))}
                    </>
                  )}
                </>
              ) : (
                <p>{scoreResult.error}</p>
              )}
            </ModalBody>
            <ModalButton onClick={() => setShowScoreModal(false)}>Close</ModalButton>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}
