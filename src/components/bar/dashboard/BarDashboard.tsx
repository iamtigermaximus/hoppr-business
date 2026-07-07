"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { SkeletonBox, SkeletonCard } from "@/components/ui/Skeleton";
import { InsightCard } from "./InsightCard";
import { ChatPanel } from "./ChatPanel";

// ── Styled Components ──────────────────────────────────────────

const Container = styled.div`
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  @media (max-width: 768px) { padding: 1rem; }
  @media (max-width: 480px) { padding: 0.75rem; }
`;

const WelcomeSection = styled.div`
  margin-bottom: 2rem;
  @media (max-width: 480px) { text-align: center; }
`;

const Title = styled.h1`
  font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; color: #1f2937;
  @media (max-width: 480px) { font-size: 1.5rem; }
`;

const Subtitle = styled.p`
  color: #6b7280; font-size: 1.125rem;
  @media (max-width: 480px) { font-size: 0.9rem; }
`;

const WelcomeBanner = styled.div<{ $dismissed: boolean }>`
  display: ${(p) => (p.$dismissed ? "none" : "flex")};
  align-items: flex-start; gap: 1rem;
  background: linear-gradient(135deg, #eef2ff 0%, #faf5ff 100%);
  border: 1px solid #c7d2fe; border-radius: 0.75rem;
  padding: 1.25rem 1.5rem; margin-bottom: 1.5rem;
  position: relative;
  @media (max-width: 480px) { flex-direction: column; padding: 1rem; }
`;

const BannerIcon = styled.span` font-size: 2rem; flex-shrink: 0; `;

const BannerContent = styled.div` flex: 1; `;

const BannerTitle = styled.h3`
  font-size: 1.05rem; font-weight: 700; color: #3730a3; margin: 0 0 0.25rem;
`;

const BannerText = styled.p`
  font-size: 0.85rem; color: #4f46e5; margin: 0 0 0.75rem; line-height: 1.5;
`;

const BannerCta = styled.button`
  background: #4f46e5; color: white; border: none; border-radius: 0.375rem;
  padding: 0.5rem 1rem; font-size: 0.8rem; font-weight: 600; cursor: pointer;
  transition: background 0.15s;
  &:hover { background: #4338ca; }
`;

const BannerDismiss = styled.button`
  background: none; border: none; color: #9ca3af; font-size: 1.25rem;
  cursor: pointer; padding: 0.25rem; line-height: 1; flex-shrink: 0;
  &:hover { color: #6b7280; }
`;

const CongratsCard = styled.div`
  background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
  border: 1px solid #6ee7b7; border-radius: 0.75rem;
  padding: 1.5rem; margin-bottom: 2rem; text-align: center;
`;

const SectionLabel = styled.h2`
  font-size: 1rem; font-weight: 600; color: #9ca3af;
  text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1rem;
`;

// ── Status Cards ───────────────────────────────────────────────

const StatusGrid = styled.div`
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem;
  @media (max-width: 768px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 480px) { grid-template-columns: 1fr 1fr; gap: 0.5rem; }
`;

const accentColors: Record<string, { border: string; bg: string; text: string }> = {
  red:    { border: "#ef4444", bg: "#fef2f2", text: "#991b1b" },
  amber:  { border: "#f59e0b", bg: "#fffbeb", text: "#92400e" },
  green:  { border: "#10b981", bg: "#ecfdf5", text: "#065f46" },
  blue:   { border: "#3b82f6", bg: "#eff6ff", text: "#1e40af" },
};

const StatusCard = styled.button<{ $accent: string }>`
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 0.5rem; padding: 1.5rem 1rem;
  background: ${(p) => accentColors[p.$accent]?.bg || "#f9fafb"};
  border: 1px solid ${(p) => accentColors[p.$accent]?.border || "#e5e7eb"};
  border-left: 4px solid ${(p) => accentColors[p.$accent]?.border || "#e5e7eb"};
  border-radius: 0.5rem; cursor: pointer; transition: all 0.2s; text-align: center;
  &:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  @media (max-width: 480px) { padding: 1rem 0.5rem; }
`;

const StatusValue = styled.div<{ $accent: string }>`
  font-size: 2rem; font-weight: 700;
  color: ${(p) => accentColors[p.$accent]?.text || "#374151"};
  @media (max-width: 480px) { font-size: 1.5rem; }
`;

const StatusLabel = styled.span` font-size: 0.85rem; font-weight: 600; color: #374151; `;
const StatusHint = styled.span` font-size: 0.72rem; color: #9ca3af;
  @media (max-width: 480px) { display: none; } `;

// ── Stats Grid ─────────────────────────────────────────────────

const StatsGrid = styled.div`
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem;
  @media (max-width: 768px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 480px) { grid-template-columns: 1fr 1fr; gap: 0.5rem; }
`;

const StatCard = styled.div`
  background: white; padding: 1.25rem; border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb;
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
  @media (max-width: 480px) { padding: 0.875rem; text-align: center; }
`;

const StatValue = styled.div`
  font-size: 1.75rem; font-weight: 700; color: #1f2937; margin-bottom: 0.25rem;
  @media (max-width: 480px) { font-size: 1.35rem; }
`;

const StatLabel = styled.div` color: #6b7280; font-size: 0.85rem; @media (max-width: 480px) { font-size: 0.78rem; } `;
const StatChange = styled.span<{ $positive: boolean }>`
  font-size: 0.75rem; color: ${(p) => (p.$positive ? "#10b981" : "#ef4444")}; margin-left: 0.25rem;
`;

// ── Empty State / Preview ──────────────────────────────────────

const PreviewCard = styled.div`
  background: white; border: 1px dashed #d1d5db; border-radius: 0.75rem;
  padding: 1.5rem; margin-bottom: 2rem;
`;

const PreviewTitle = styled.h3`
  font-size: 1rem; font-weight: 700; color: #6b7280; margin-bottom: 0.25rem;
  display: flex; align-items: center; gap: 0.5rem;
`;

const PreviewHint = styled.p`
  font-size: 0.8rem; color: #9ca3af; margin-bottom: 1.25rem;
`;

const PreviewGrid = styled.div`
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem;
  @media (max-width: 768px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 480px) { grid-template-columns: 1fr 1fr; gap: 0.5rem; }
`;

const PreviewStat = styled.div`
  background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem;
  padding: 1rem; text-align: center;
`;

const PreviewValue = styled.div`
  font-size: 1.5rem; font-weight: 700; color: #d1d5db; margin-bottom: 0.25rem;
`;

const PreviewIcon = styled.span` font-size: 1.25rem; display: block; margin-bottom: 0.25rem; `;

// ── Checklist ──────────────────────────────────────────────────

const ChecklistCard = styled.div`
  background: white; border: 1px solid #e5e7eb; border-radius: 0.75rem;
  padding: 1.5rem; margin-bottom: 2rem;
`;

const ChecklistItem = styled.div<{ $done: boolean }>`
  display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
  &:last-child { border-bottom: none; }
  color: ${(p) => (p.$done ? "#10b981" : "#6b7280")};
  font-size: 0.9rem;
`;

const ChecklistIcon = styled.span<{ $done: boolean }>`
  font-size: 1.1rem; flex-shrink: 0;
  color: ${(p) => (p.$done ? "#10b981" : "#d1d5db")};
`;

// ── Activity ───────────────────────────────────────────────────

const ActivitySection = styled.div` margin-bottom: 2rem; `;
const ActivityCard = styled.div`
  background: white; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border: 1px solid #e5e7eb; overflow: hidden;
`;
const ActivityItem = styled.div<{ $clickable?: boolean }>`
  display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem 1.25rem;
  border-bottom: 1px solid #f3f4f6;
  cursor: ${(p) => (p.$clickable ? "pointer" : "default")}; transition: background 0.15s;
  &:last-child { border-bottom: none; }
  &:hover { background: ${(p) => (p.$clickable ? "#f9fafb" : "transparent")}; }
`;
const ActivityIcon = styled.span` font-size: 1.25rem; flex-shrink: 0; `;
const ActivityContent = styled.div` flex: 1; min-width: 0; `;
const ActivityText = styled.p` color: #374151; font-size: 0.9rem; margin: 0; line-height: 1.4; `;
const ActivityTime = styled.span` color: #9ca3af; font-size: 0.75rem; white-space: nowrap; `;
const EmptyState = styled.div` padding: 2rem; text-align: center; color: #9ca3af; font-size: 0.9rem; `;

const ShareBarCard = styled.div`
  background: linear-gradient(135deg, #eef2ff, #faf5ff);
  border: 1px solid #c7d2fe; border-radius: 0.75rem;
  padding: 1.25rem 1.5rem; margin-bottom: 1.5rem;
  display: flex; align-items: center; gap: 1rem;
  @media (max-width: 480px) { flex-direction: column; text-align: center; }
`;

const ShareBarText = styled.div` flex: 1; `;
const ShareBarTitle = styled.h3` font-size: 1rem; font-weight: 700; color: #3730a3; margin: 0 0 0.25rem; `;
const ShareBarHint = styled.p` font-size: 0.82rem; color: #6b7280; margin: 0; `;

const ShareBarBtn = styled.button`
  background: #4f46e5; color: white; border: none; border-radius: 0.375rem;
  padding: 0.55rem 1.25rem; font-size: 0.82rem; font-weight: 600;
  cursor: pointer; white-space: nowrap; transition: background 0.15s;
  &:hover { background: #4338ca; }
`;

// ── Types ──────────────────────────────────────────────────────

export type BarStaffRole = "OWNER" | "MANAGER" | "PROMOTIONS_MANAGER" | "STAFF" | "VIEWER";

export interface AuthenticatedUser {
  id: string; email: string; name: string; role: BarStaffRole;
  barId: string; barName: string; permissions: string[]; staffRole: BarStaffRole;
}

interface DashboardStats {
  profileViews: number;
  directionClicks: number;
  websiteClicks: number;
  callClicks: number;
  shareCount: number;
  promoViews: number;
  promoClicks: number;
  promoRedemptions: number;
  eventViews: number;
  eventJoins: number;
  uniqueVisitors: number;
  activePromos: number;
  activeCampaigns: number;
  campaignImpressions: number;
  campaignClicks: number;
  campaignConversions: number;
  campaignSpentCents: number;
  campaignBudgetCents: number;
  totalFollowers: number;
  newFollowers: number;
  lostFollowers: number;
  netFollowers: number;
  hasData: boolean;
}

interface ActivityEntry {
  id: string; icon: string; text: string; time: string; href?: string;
}

interface BarDashboardContentProps {
  user: AuthenticatedUser;
}

// ── Helpers ────────────────────────────────────────────────────

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString();
};

const timeAgo = (dateStr: string): string => {
  const now = new Date(); const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const isToday = (dateStr: string): boolean => {
  const d = new Date(dateStr); const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
};

const expiresWithinDays = (dateStr: string, days: number): boolean => {
  const d = new Date(dateStr); const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  return diffMs > 0 && diffMs <= days * 86400000;
};

// ── Component ──────────────────────────────────────────────────

const BarDashboardContent = ({ user }: BarDashboardContentProps) => {
  const router = useRouter();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [latestInsight, setLatestInsight] = useState<any>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  // Status card data
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [todayEvents, setTodayEvents] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);

  // Seed state
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  // Onboarding states
  const [firstVisit, setFirstVisit] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const [congratulated, setCongratulated] = useState(false);
  const [shareBarDismissed, setShareBarDismissed] = useState(false);

  const isManager = user.staffRole === "OWNER" || user.staffRole === "MANAGER";

  const getToken = (): string | null => {
    if (typeof window !== "undefined") return localStorage.getItem("hoppr_token");
    return null;
  };

  // Fetch all dashboard data
  useEffect(() => {
    const fetchAll = async () => {
      const token = getToken();
      if (!token) return;

      try {
        // ── Stats ──────────────────────────────────────────────
        const statsRes = await fetch(`/api/auth/bar/${user.barId}/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (statsRes.ok) {
          const data = await statsRes.json();
          setDashboardStats(data);
        }

        // ── Recent activity ────────────────────────────────────
        try {
          const activityRes = await fetch(`/api/auth/bar/${user.barId}/dashboard/activity`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (activityRes.ok) {
            const data = await activityRes.json();
            if (data.activities) {
              // Map API times to relative "Xm ago" format for display
              setRecentActivity(
                data.activities.map((a: ActivityEntry) => ({
                  ...a,
                  time: timeAgo(a.time),
                })),
              );
            }
          }
        } catch { /* skip */ }

        // ── Bar profile (for checklist) ────────────────────────
        try {
          const profileRes = await fetch(`/api/auth/bar/${user.barId}/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (profileRes.ok) setProfile(await profileRes.json());
        } catch { /* skip */ }

        // ── Upcoming events (status card only) ────────────────
        try {
          const eventsRes = await fetch(`/api/auth/bar/${user.barId}/events?filter=upcoming`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (eventsRes.ok) {
            const data = await eventsRes.json();
            const upcomingEvents = Array.isArray(data) ? data : data.events || [];
            const today = upcomingEvents.filter((e: any) => isToday(e.startTime));
            setTodayEvents(today.length);
          }
        } catch { /* skip */ }

        // ── Promotions (status card only) ─────────────────────
        try {
          const promosRes = await fetch(`/api/auth/bar/${user.barId}/promotions?status=active`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (promosRes.ok) {
            const data = await promosRes.json();
            const promos = Array.isArray(data) ? data : data.promotions || [];
            const expiring = promos.filter((p: any) => expiresWithinDays(p.endDate, 7));
            setExpiringCount(expiring.length);
          }
        } catch { /* skip */ }

        // ── Pending approvals ──────────────────────────────────
        if (isManager) {
          try {
            const approvalsRes = await fetch(`/api/auth/bar/${user.barId}/approvals`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (approvalsRes.ok) {
              const data = await approvalsRes.json();
              setPendingApprovals(data.counts?.total || 0);
            }
          } catch { /* skip */ }
        }

        // ── Insight ────────────────────────────────────────────
        try {
          const insightRes = await fetch(`/api/auth/bar/${user.barId}/insights`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (insightRes.ok) {
            const data = await insightRes.json();
            setLatestInsight(data.latest);
          }
        } catch { /* skip */ }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, [user.barId]);

  // ── Auto-seed sample content on first visit with empty bar ────
  useEffect(() => {
    if (isLoading) return;
    const alreadySeeded = typeof window !== "undefined" && localStorage.getItem("hoppr_content_seeded");
    if (alreadySeeded) return;

    const hasNoContent =
      (!dashboardStats || (dashboardStats.activePromos === 0 && dashboardStats.activeCampaigns === 0)) &&
      todayEvents === 0;

    if (!hasNoContent) return;

    const doSeed = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const res = await fetch(`/api/auth/bar/${user.barId}/dashboard/seed-content`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          localStorage.setItem("hoppr_content_seeded", "true");
          // Reload to show seeded content
          window.location.reload();
        }
      } catch {
        // Silently fail — seed is non-critical
      }
    };
    doSeed();
  }, [isLoading, dashboardStats, todayEvents, user.barId]);

  // ── First-visit detection ────────────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined") {
      const visited = localStorage.getItem("hoppr_dashboard_visited");
      if (!visited) {
        setFirstVisit(true);
      }
      const dismissed = localStorage.getItem("hoppr_welcome_dismissed");
      if (dismissed) setWelcomeDismissed(true);
      const shareDismissed = localStorage.getItem("hoppr_share_bar_dismissed");
      if (shareDismissed) setShareBarDismissed(true);
    }
  }, []);

  // ── Congratulations effect ───────────────────────────────────
  useEffect(() => {
    if (!isLoading && completedCount === checklistItems.length && !congratulated) {
      const seen = localStorage.getItem("hoppr_onboarding_complete");
      if (!seen) {
        setCongratulated(true);
        localStorage.setItem("hoppr_onboarding_complete", "true");
      }
    }
  }, [isLoading, dashboardStats, profile, todayEvents, recentActivity]);

  // ── Insight handlers ────────────────────────────────────────

  const handleDismiss = async (insightId: string) => {
    const token = getToken();
    await fetch(`/api/auth/bar/${user.barId}/insights`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ insightId, action: "dismiss" }),
    });
    setLatestInsight(null);
  };

  const handleAct = async (insightId: string, route?: string) => {
    if (insightId) {
      const token = getToken();
      await fetch(`/api/auth/bar/${user.barId}/insights`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ insightId, action: "act" }),
      });
    }
    if (route) router.push(route);
  };

  const handleSeed = async () => {
    setSeeding(true);
    setSeedResult(null);
    try {
      const token = getToken();
      const res = await fetch(`/api/auth/bar/${user.barId}/dashboard/seed`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSeedResult(`✅ ${data.eventsInserted} events seeded across ${data.daysSeeded} days.`);
        // Reload the page to show seeded data
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setSeedResult(`❌ ${data.error || "Failed to seed"}`);
      }
    } catch {
      setSeedResult("❌ Network error — try again");
    } finally {
      setSeeding(false);
    }
  };

  // ── Loading ─────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Container>
        <WelcomeSection>
          <Title>Welcome to {user.barName}! 🎉</Title>
          <Subtitle>Loading your dashboard...</Subtitle>
        </WelcomeSection>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i}>
              <SkeletonBox $width="60%" $height="0.75rem" />
              <SkeletonBox $width="35%" $height="1.25rem" />
            </SkeletonCard>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
          <SkeletonCard>
            <SkeletonBox $width="40%" $height="0.75rem" />
            <SkeletonBox $width="100%" $height="180px" $radius="0.5rem" />
          </SkeletonCard>
          <SkeletonCard>
            <SkeletonBox $width="50%" $height="0.75rem" />
            <SkeletonBox $width="100%" $height="120px" $radius="0.5rem" />
          </SkeletonCard>
        </div>
      </Container>
    );
  }

  const stats = dashboardStats;
  const hasData = stats?.hasData ?? false;

  // ── Build status cards ─────────────────────────────────────

  const statusCards: { accent: string; value: string; label: string; hint: string; href?: string }[] = [];

  if (isManager) {
    statusCards.push({
      accent: pendingApprovals > 0 ? "red" : "green",
      value: String(pendingApprovals),
      label: "Pending Approvals",
      hint: pendingApprovals > 0 ? "Needs your review" : "All clear",
      href: `/bar/${user.barId}/approvals`,
    });
  }

  statusCards.push({
    accent: todayEvents > 0 ? "blue" : "green",
    value: String(todayEvents),
    label: "Events Today",
    hint: todayEvents > 0 ? "Happening now or later" : "Nothing scheduled",
    href: `/bar/${user.barId}/events`,
  });

  statusCards.push({
    accent: (stats?.activePromos ?? 0) > 0 ? "green" : "amber",
    value: String(stats?.activePromos ?? 0),
    label: "Active Promos",
    hint: (stats?.activePromos ?? 0) > 0 ? "Live and visible" : "Create your first",
    href: `/bar/${user.barId}/promotions`,
  });

  statusCards.push({
    accent: expiringCount > 0 ? "amber" : "green",
    value: String(expiringCount),
    label: "Expiring This Week",
    hint: expiringCount > 0 ? "Promos ending soon" : "Nothing expiring",
    href: `/bar/${user.barId}/promotions`,
  });

  statusCards.push({
    accent: (stats?.activeCampaigns ?? 0) > 0 ? "blue" : "amber",
    value: String(stats?.activeCampaigns ?? 0),
    label: "Active Ads",
    hint: (stats?.activeCampaigns ?? 0) > 0 ? "Live and running" : "Create your first campaign",
    href: `/bar/${user.barId}/campaigns`,
  });

  // ── Checklist items ─────────────────────────────────────────

  const checklistItems = [
    {
      label: "Profile photo added",
      done: !!(profile?.coverImage || profile?.logoUrl),
      href: `/bar/${user.barId}/profile`,
    },
    {
      label: "Operating hours set",
      done: !!(profile?.operatingHours && Object.keys(profile.operatingHours).length > 0),
      href: `/bar/${user.barId}/profile`,
    },
    {
      label: "Cover charge & music tags added",
      done: !!(profile?.coverCharge != null || profile?.musicTags?.length > 0),
      href: `/bar/${user.barId}/profile`,
    },
    {
      label: "Gallery images uploaded",
      done: !!(profile?.imageUrls?.length > 0),
      href: `/bar/${user.barId}/profile`,
    },
    {
      label: "First promotion created",
      done: (stats?.activePromos ?? 0) > 0,
      href: `/bar/${user.barId}/promotions`,
    },
    {
      label: "First event scheduled",
      done: todayEvents > 0 || recentActivity.some((a) => a.href?.includes("/events/")),
      href: `/bar/${user.barId}/events`,
    },
    {
      label: "First ad campaign created",
      done: (stats?.activeCampaigns ?? 0) > 0 || (stats?.campaignImpressions ?? 0) > 0,
      href: `/bar/${user.barId}/campaigns`,
    },
  ];

  const completedCount = checklistItems.filter((c) => c.done).length;

  // ── Render ─────────────────────────────────────────────────

  const showChecklist = completedCount < checklistItems.length;
  const showCongrats = !showChecklist && congratulated;

  const handleDismissWelcome = () => {
    setWelcomeDismissed(true);
    localStorage.setItem("hoppr_welcome_dismissed", "true");
    localStorage.setItem("hoppr_dashboard_visited", "true");
  };

  const handleWelcomeCta = () => {
    handleDismissWelcome();
    // Scroll to checklist
    const el = document.getElementById("onboarding-checklist");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Container>
      {/* First-visit welcome banner */}
      {firstVisit && !welcomeDismissed && (
        <WelcomeBanner $dismissed={false}>
          <BannerIcon>👋</BannerIcon>
          <BannerContent>
            <BannerTitle>Welcome to Hoppr! Your bar is live.</BannerTitle>
            <BannerText>
              Customers can now discover {user.barName} on the app. Complete the checklist below to
              make your bar stand out — photos, promotions, and events are what bring people in.
            </BannerText>
            <BannerCta onClick={handleWelcomeCta}>Let&apos;s get started</BannerCta>
          </BannerContent>
          <BannerDismiss onClick={handleDismissWelcome} aria-label="Dismiss">×</BannerDismiss>
        </WelcomeBanner>
      )}

      <WelcomeSection>
        <Title>{firstVisit ? <>Your bar is live! 🎉</> : <>Welcome to {user.barName}! 🎉</>}</Title>
        <Subtitle>
          {firstVisit
            ? "Let's set it up so customers can find you."
            : <>Hello, {user.name}! Here&apos;s how your bar is doing.</>}
        </Subtitle>
      </WelcomeSection>

      {/* Status cards — always visible */}
      <SectionLabel>At a Glance</SectionLabel>
      <StatusGrid>
        {statusCards.map((card) => (
          <StatusCard
            key={card.label}
            $accent={card.accent}
            onClick={card.href ? () => router.push(card.href!) : undefined}
          >
            <StatusValue $accent={card.accent}>{card.value}</StatusValue>
            <StatusLabel>{card.label}</StatusLabel>
            <StatusHint>{card.hint}</StatusHint>
          </StatusCard>
        ))}
      </StatusGrid>

      {/* Performance stats — real data or preview */}
      <SectionLabel>Performance (Last 7 Days)</SectionLabel>

      {hasData ? (
        <StatsGrid>
          <StatCard>
            <StatValue>{formatNumber(stats?.profileViews ?? 0)}</StatValue>
            <StatLabel>Profile Views</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{formatNumber(stats?.uniqueVisitors ?? 0)}</StatValue>
            <StatLabel>Unique Visitors</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{formatNumber(stats?.directionClicks ?? 0)}</StatValue>
            <StatLabel>Directions</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{formatNumber(stats?.websiteClicks ?? 0)}</StatValue>
            <StatLabel>Website Visits</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{formatNumber(stats?.callClicks ?? 0)}</StatValue>
            <StatLabel>Phone Calls</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{formatNumber(stats?.shareCount ?? 0)}</StatValue>
            <StatLabel>Shares</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{formatNumber(stats?.promoViews ?? 0)}</StatValue>
            <StatLabel>Promo Views</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{formatNumber(stats?.promoClicks ?? 0)}</StatValue>
            <StatLabel>Promo Clicks</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{formatNumber(stats?.eventViews ?? 0)}</StatValue>
            <StatLabel>Event Views</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{formatNumber(stats?.eventJoins ?? 0)}</StatValue>
            <StatLabel>Event Joins</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{formatNumber(stats?.campaignImpressions ?? 0)}</StatValue>
            <StatLabel>Ad Impressions</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{formatNumber(stats?.campaignClicks ?? 0)}</StatValue>
            <StatLabel>Ad Clicks</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{formatNumber(stats?.totalFollowers ?? 0)}</StatValue>
            <StatLabel>Followers</StatLabel>
            {stats && stats.netFollowers !== undefined && (
              <StatChange $positive={stats.netFollowers >= 0}>
                {stats.netFollowers >= 0 ? "+" : ""}{stats.netFollowers} this week
              </StatChange>
            )}
          </StatCard>
          <StatCard>
            <StatValue>{formatNumber(stats?.newFollowers ?? 0)}</StatValue>
            <StatLabel>New Followers</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{formatNumber(stats?.lostFollowers ?? 0)}</StatValue>
            <StatLabel>Unfollowed</StatLabel>
          </StatCard>
        </StatsGrid>
      ) : (
        <>
          {/* Preview of what they'll see */}
          <PreviewCard>
            <PreviewTitle>📊 Your analytics will appear here</PreviewTitle>
            <PreviewHint>
              Once people start discovering your bar on Hoppr, these cards will show real traffic data. Here&apos;s what to expect:
            </PreviewHint>

            {/* Seed button — dev only, hidden in production */}
            {process.env.NODE_ENV !== "production" && (
              <div style={{ marginBottom: "1rem" }}>
                <button
                  onClick={handleSeed}
                  disabled={seeding}
                  style={{
                    padding: "0.5rem 1rem",
                    background: seeding ? "#d1d5db" : "#3b82f6",
                    color: "#fff",
                    border: "none",
                    borderRadius: "0.375rem",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: seeding ? "not-allowed" : "pointer",
                  }}
                >
                  {seeding ? "Generating..." : "🔬 Preview with sample data"}
                </button>
                {seedResult && (
                  <span style={{ marginLeft: "0.75rem", fontSize: "0.78rem", color: seedResult.startsWith("✅") ? "#10b981" : "#ef4444" }}>
                    {seedResult}
                  </span>
                )}
              </div>
            )}

            <PreviewGrid>
              {[
                { icon: "👁️", label: "Profile Views", example: "~120" },
                { icon: "🧭", label: "Directions", example: "~25" },
                { icon: "🌐", label: "Website Visits", example: "~12" },
                { icon: "📞", label: "Phone Calls", example: "~5" },
                { icon: "📤", label: "Shares", example: "~8" },
                { icon: "🎫", label: "Promo Views", example: "~60" },
                { icon: "👆", label: "Promo Clicks", example: "~20" },
                { icon: "📅", label: "Event Views", example: "~40" },
                { icon: "✅", label: "Event Joins", example: "~15" },
                { icon: "👤", label: "Unique Visitors", example: "~90" },
                { icon: "❤️", label: "Followers", example: "~35" },
                { icon: "➕", label: "New Followers", example: "~5" },
              ].map((m) => (
                <PreviewStat key={m.label}>
                  <PreviewIcon>{m.icon}</PreviewIcon>
                  <PreviewValue style={{ color: "#cbd5e1" }}>{m.example}</PreviewValue>
                  <StatLabel>{m.label}</StatLabel>
                </PreviewStat>
              ))}
            </PreviewGrid>
          </PreviewCard>
        </>
      )}

      {/* Onboarding checklist — visible until all items complete, regardless of analytics data */}
      {showChecklist && (
        <ChecklistCard id="onboarding-checklist">
          <PreviewTitle>
            ✅ Get ready for launch ({completedCount}/{checklistItems.length})
          </PreviewTitle>
          <PreviewHint>
            Complete these steps to make your bar discoverable and attractive to customers.
          </PreviewHint>
          {checklistItems.map((item) => (
            <ChecklistItem key={item.label} $done={item.done}>
              <ChecklistIcon $done={item.done}>
                {item.done ? "✓" : "○"}
              </ChecklistIcon>
              <span style={{ flex: 1 }}>{item.label}</span>
              {!item.done && item.href && (
                <span
                  style={{ color: "#3b82f6", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}
                  onClick={() => router.push(item.href!)}
                >
                  Do it →
                </span>
              )}
            </ChecklistItem>
          ))}
        </ChecklistCard>
      )}

      {/* Congratulations when all items complete */}
      {showCongrats && (
        <CongratsCard>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🎉</div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#065f46", margin: "0 0 0.5rem" }}>
            Your bar is fully set up!
          </h3>
          <p style={{ color: "#047857", fontSize: "0.85rem", margin: 0 }}>
            All {checklistItems.length} steps complete. Customers can now discover your bar, browse your
            promotions, and join your events. Keep creating — we&apos;ll keep tracking.
          </p>
        </CongratsCard>
      )}

      {/* Share your bar — shown when onboarding is complete */}
      {!showChecklist && !shareBarDismissed && (
        <ShareBarCard>
          <ShareBarText>
            <ShareBarTitle>📤 Share {user.barName} with your regulars</ShareBarTitle>
            <ShareBarHint>
              Your bar is set up and discoverable on Hoppr. Share the link with your customers and on social media to drive traffic.
            </ShareBarHint>
          </ShareBarText>
          <ShareBarBtn
            onClick={() => {
              const url = typeof window !== "undefined" ? `${window.location.origin}/venues/${user.barId}` : "";
              if (typeof navigator !== "undefined" && navigator.share) {
                navigator.share({ title: user.barName, text: `Check out ${user.barName} on Hoppr!`, url }).catch(() => {});
              } else {
                navigator.clipboard?.writeText(url).catch(() => {});
              }
            }}
          >
            Share my bar
          </ShareBarBtn>
          <button
            onClick={() => {
              setShareBarDismissed(true);
              localStorage.setItem("hoppr_share_bar_dismissed", "true");
            }}
            style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "1.1rem", padding: "0 0 0 0.5rem" }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </ShareBarCard>
      )}

      {/* Insights */}
      <InsightCard
        insight={latestInsight}
        onDismiss={handleDismiss}
        onAct={handleAct}
        onExpand={() => setChatOpen(true)}
      />

      <ChatPanel barId={user.barId} isOpen={chatOpen} onClose={() => setChatOpen(false)} />

      {/* Recent Activity */}
      <SectionLabel>Recent Activity</SectionLabel>
      <ActivitySection>
        <ActivityCard>
          {recentActivity.length > 0 ? (
            recentActivity.map((item) => (
              <ActivityItem
                key={item.id}
                $clickable={!!item.href}
                onClick={() => { if (item.href) router.push(item.href); }}
              >
                <ActivityIcon>{item.icon}</ActivityIcon>
                <ActivityContent><ActivityText>{item.text}</ActivityText></ActivityContent>
                <ActivityTime>{item.time}</ActivityTime>
              </ActivityItem>
            ))
          ) : (
            <EmptyState>
              No recent activity yet. Start by creating an event or promotion!
            </EmptyState>
          )}
        </ActivityCard>
      </ActivitySection>
    </Container>
  );
};

export default BarDashboardContent;
