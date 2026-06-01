"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { InsightCard } from "./InsightCard";
import { ChatPanel } from "./ChatPanel";

// ── Styled Components ──────────────────────────────────────────

const Container = styled.div`
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;

  @media (max-width: 768px) {
    padding: 1rem;
  }

  @media (max-width: 480px) {
    padding: 0.75rem;
  }
`;

const WelcomeSection = styled.div`
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    margin-bottom: 1.5rem;
  }

  @media (max-width: 480px) {
    margin-bottom: 1rem;
    text-align: center;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #1f2937;

  @media (max-width: 768px) {
    font-size: 1.75rem;
  }

  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`;

const Subtitle = styled.p`
  color: #6b7280;
  font-size: 1.125rem;

  @media (max-width: 768px) {
    font-size: 1rem;
  }

  @media (max-width: 480px) {
    font-size: 0.9rem;
  }
`;

// ── Status Cards ───────────────────────────────────────────────

const SectionLabel = styled.h2`
  font-size: 1rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;

  @media (max-width: 480px) {
    font-size: 0.85rem;
    margin-bottom: 0.75rem;
  }
`;

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
`;

interface StatusCardProps {
  $accent: "red" | "amber" | "green" | "blue";
}

const accentColors: Record<StatusCardProps["$accent"], { border: string; bg: string; text: string }> = {
  red:    { border: "#ef4444", bg: "#fef2f2", text: "#991b1b" },
  amber:  { border: "#f59e0b", bg: "#fffbeb", text: "#92400e" },
  green:  { border: "#10b981", bg: "#ecfdf5", text: "#065f46" },
  blue:   { border: "#3b82f6", bg: "#eff6ff", text: "#1e40af" },
};

const StatusCard = styled.button<StatusCardProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.5rem 1rem;
  background: ${(p) => accentColors[p.$accent].bg};
  border: 1px solid ${(p) => accentColors[p.$accent].border};
  border-left: 4px solid ${(p) => accentColors[p.$accent].border};
  border-radius: 0.5rem;
  cursor: ${(p) => (p.onClick ? "pointer" : "default")};
  transition: all 0.2s;
  text-align: center;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 768px) {
    padding: 1.25rem 0.75rem;
  }

  @media (max-width: 480px) {
    padding: 1rem 0.5rem;
  }
`;

const StatusValue = styled.div<{ $accent: StatusCardProps["$accent"] }>`
  font-size: 2rem;
  font-weight: 700;
  color: ${(p) => accentColors[p.$accent].text};

  @media (max-width: 768px) {
    font-size: 1.75rem;
  }

  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`;

const StatusLabel = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;

  @media (max-width: 480px) {
    font-size: 0.78rem;
  }
`;

const StatusHint = styled.span`
  font-size: 0.72rem;
  color: #9ca3af;

  @media (max-width: 480px) {
    display: none;
  }
`;

// ── Stats Grid ─────────────────────────────────────────────────

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
`;

const StatCard = styled.div`
  background: white;
  padding: 1.25rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  transition:
    transform 0.2s,
    box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    padding: 1rem;
  }

  @media (max-width: 480px) {
    padding: 0.875rem;
    text-align: center;
  }
`;

const StatValue = styled.div`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }

  @media (max-width: 480px) {
    font-size: 1.35rem;
    margin-bottom: 0.125rem;
  }
`;

const StatLabel = styled.div`
  color: #6b7280;
  font-size: 0.85rem;

  @media (max-width: 480px) {
    font-size: 0.78rem;
  }
`;

const StatChange = styled.span<{ $positive: boolean }>`
  font-size: 0.75rem;
  color: ${(props) => (props.$positive ? "#10b981" : "#ef4444")};
  margin-left: 0.25rem;
`;

// ── Recent Activity ────────────────────────────────────────────

const ActivitySection = styled.div`
  margin-bottom: 2rem;
`;

const ActivityCard = styled.div`
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  overflow: hidden;
`;

const ActivityItem = styled.div<{ $clickable?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid #f3f4f6;
  cursor: ${(props) => (props.$clickable ? "pointer" : "default")};
  transition: background 0.15s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${(props) => (props.$clickable ? "#f9fafb" : "transparent")};
  }

  @media (max-width: 480px) {
    padding: 0.75rem 1rem;
  }
`;

const ActivityIcon = styled.span`
  font-size: 1.25rem;
  flex-shrink: 0;
`;

const ActivityContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ActivityText = styled.p`
  color: #374151;
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.4;

  @media (max-width: 480px) {
    font-size: 0.85rem;
  }
`;

const ActivityTime = styled.span`
  color: #9ca3af;
  font-size: 0.75rem;
  white-space: nowrap;
`;

const EmptyState = styled.div`
  padding: 2rem;
  text-align: center;
  color: #9ca3af;
  font-size: 0.9rem;
`;

// ── Types ──────────────────────────────────────────────────────

export type BarStaffRole =
  | "OWNER"
  | "MANAGER"
  | "PROMOTIONS_MANAGER"
  | "STAFF"
  | "VIEWER";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: BarStaffRole;
  barId: string;
  barName: string;
  permissions: string[];
  staffRole: BarStaffRole;
}

interface BarStats {
  profileViews: number;
  vipPassSales: number;
  revenue: number;
  promotionClicks: number;
  socialCheckins: number;
}

interface ActivityEntry {
  id: string;
  icon: string;
  text: string;
  time: string;
  href?: string;
}

interface BarDashboardContentProps {
  user: AuthenticatedUser;
  stats: BarStats;
}

// ── Helpers ────────────────────────────────────────────────────

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString();
};

const formatEuro = (num: number): string => {
  if (num >= 1000000) return "€" + (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return "€" + (num / 1000).toFixed(1) + "K";
  return "€" + num.toLocaleString();
};

const timeAgo = (dateStr: string): string => {
  const now = new Date();
  const date = new Date(dateStr);
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
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

const expiresWithinDays = (dateStr: string, days: number): boolean => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  return diffMs > 0 && diffMs <= days * 86400000;
};

// ── Component ──────────────────────────────────────────────────

const BarDashboardContent = ({ user, stats }: BarDashboardContentProps) => {
  const router = useRouter();
  const [dashboardStats, setDashboardStats] = useState<BarStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [latestInsight, setLatestInsight] = useState<any>(null);
  const [chatOpen, setChatOpen] = useState(false);

  // Status card data
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [todayEvents, setTodayEvents] = useState(0);
  const [activePromos, setActivePromos] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);

  const isManager =
    user.staffRole === "OWNER" || user.staffRole === "MANAGER";

  const getToken = (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("hoppr_token");
    }
    return null;
  };

  // Fetch all dashboard data
  useEffect(() => {
    const fetchAll = async () => {
      const token = getToken();
      if (!token) return;

      const activities: ActivityEntry[] = [];

      try {
        // ── Stats ──────────────────────────────────────────────
        const statsRes = await fetch(
          `/api/auth/bar/${user.barId}/dashboard/stats`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (statsRes.ok) {
          const data = await statsRes.json();
          setDashboardStats(data);
        }

        // ── Upcoming events (for activity + today count) ──────
        let upcomingEvents: any[] = [];
        try {
          const eventsRes = await fetch(
            `/api/auth/bar/${user.barId}/events?filter=upcoming`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (eventsRes.ok) {
            const data = await eventsRes.json();
            upcomingEvents = Array.isArray(data) ? data : data.events || [];

            // Today's events
            const today = upcomingEvents.filter((e: any) =>
              isToday(e.startTime),
            );
            setTodayEvents(today.length);

            // Activity feed: 3 most recent upcoming
            upcomingEvents.slice(0, 3).forEach(
              (event: {
                id: string;
                title: string;
                startTime: string;
                attendeeCount?: number;
              }) => {
                const attrs = event.attendeeCount ?? 0;
                activities.push({
                  id: `event-${event.id}`,
                  icon: "📅",
                  text: `Event "${event.title}" is upcoming${attrs ? ` with ${attrs} attending` : ""}`,
                  time: timeAgo(event.startTime),
                  href: `/bar/${user.barId}/events`,
                });
              },
            );
          }
        } catch {
          // skip
        }

        // ── Promotions (for active count + expiring) ──────────
        try {
          const promosRes = await fetch(
            `/api/auth/bar/${user.barId}/promotions?status=active`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (promosRes.ok) {
            const data = await promosRes.json();
            const promos = Array.isArray(data)
              ? data
              : data.promotions || [];
            setActivePromos(promos.length);

            const expiring = promos.filter((p: any) =>
              expiresWithinDays(p.endDate, 7),
            );
            setExpiringCount((prev) => prev + expiring.length);
          }
        } catch {
          // skip
        }

        // ── Passes (for activity + expiring count) ────────────
        try {
          const passesRes = await fetch(
            `/api/auth/bar/${user.barId}/passes?status=active`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (passesRes.ok) {
            const data = await passesRes.json();
            const passes = Array.isArray(data) ? data : data.passes || [];

            // Expiring passes
            const expiring = passes.filter((p: any) =>
              expiresWithinDays(p.validityEnd, 7),
            );
            setExpiringCount((prev) => prev + expiring.length);

            // Activity: passes with sales
            passes
              .filter((p: { soldCount?: number }) => (p.soldCount || 0) > 0)
              .slice(0, 2)
              .forEach(
                (p: { id: string; name: string; soldCount: number }) => {
                  activities.push({
                    id: `pass-${p.id}`,
                    icon: "🎟️",
                    text: `"${p.name}" — ${p.soldCount} sold`,
                    time: "recent",
                    href: `/bar/${user.barId}/passes`,
                  });
                },
              );
          }
        } catch {
          // skip
        }

        // ── Pending approvals (managers only) ─────────────────
        if (isManager) {
          try {
            const approvalsRes = await fetch(
              `/api/auth/bar/${user.barId}/approvals`,
              { headers: { Authorization: `Bearer ${token}` } },
            );
            if (approvalsRes.ok) {
              const data = await approvalsRes.json();
              setPendingApprovals(data.counts?.total || 0);
            }
          } catch {
            // skip
          }
        }

        // ── Latest insight ────────────────────────────────────
        try {
          const insightRes = await fetch(
            `/api/auth/bar/${user.barId}/insights`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (insightRes.ok) {
            const insightData = await insightRes.json();
            setLatestInsight(insightData.latest);
          }
        } catch {
          // skip
        }

        setRecentActivity(activities);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
  }, [user.barId]);

  const displayStats = dashboardStats || stats;

  // ── Loading state ──────────────────────────────────────────

  if (isLoading) {
    return (
      <Container>
        <WelcomeSection>
          <Title>Welcome to {user.barName}! 🎉</Title>
          <Subtitle>Loading your dashboard...</Subtitle>
        </WelcomeSection>
      </Container>
    );
  }

  // ── Insight handlers ────────────────────────────────────────

  const handleDismiss = async (insightId: string) => {
    const token = getToken();
    await fetch(`/api/auth/bar/${user.barId}/insights`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ insightId, action: "dismiss" }),
    });
    setLatestInsight(null);
  };

  const handleAct = async (insightId: string, route?: string) => {
    if (insightId) {
      const token = getToken();
      await fetch(`/api/auth/bar/${user.barId}/insights`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ insightId, action: "act" }),
      });
    }
    if (route) {
      router.push(route);
    }
  };

  // ── Build status cards ─────────────────────────────────────

  interface StatusCardDef {
    accent: StatusCardProps["$accent"];
    value: string;
    label: string;
    hint: string;
    href?: string;
  }

  const statusCards: StatusCardDef[] = [];

  // Pending approvals (managers only)
  if (isManager) {
    statusCards.push({
      accent: pendingApprovals > 0 ? "red" : "green",
      value: String(pendingApprovals),
      label: "Pending Approvals",
      hint: pendingApprovals > 0 ? "Needs your review" : "All clear",
      href: `/bar/${user.barId}/approvals`,
    });
  }

  // Today's events
  statusCards.push({
    accent: todayEvents > 0 ? "blue" : "green",
    value: String(todayEvents),
    label: "Events Today",
    hint: todayEvents > 0 ? "Happening now or later" : "Nothing scheduled",
    href: `/bar/${user.barId}/events`,
  });

  // Active promotions
  statusCards.push({
    accent: activePromos > 0 ? "green" : "amber",
    value: String(activePromos),
    label: "Active Promos",
    hint: activePromos > 0 ? "Live and visible" : "Create your first",
    href: `/bar/${user.barId}/promotions`,
  });

  // Expiring soon
  statusCards.push({
    accent: expiringCount > 0 ? "amber" : "green",
    value: String(expiringCount),
    label: "Expiring This Week",
    hint: expiringCount > 0 ? "Promos or passes ending soon" : "Nothing expiring",
    href: `/bar/${user.barId}/promotions`,
  });

  // ── Render ─────────────────────────────────────────────────

  return (
    <Container>
      {/* Welcome */}
      <WelcomeSection>
        <Title>Welcome to {user.barName}! 🎉</Title>
        <Subtitle>
          Hello, {user.name}! Here&apos;s how your bar is doing.
        </Subtitle>
      </WelcomeSection>

      {/* Status cards */}
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

      {/* Stats */}
      <SectionLabel>Performance at a Glance</SectionLabel>
      <StatsGrid>
        <StatCard>
          <StatValue>{formatNumber(displayStats.vipPassSales)}</StatValue>
          <StatLabel>
            VIP Pass Sales
            {displayStats.vipPassSales > 0 && (
              <StatChange $positive>▲ Active</StatChange>
            )}
          </StatLabel>
        </StatCard>

        <StatCard>
          <StatValue>{formatEuro(displayStats.revenue)}</StatValue>
          <StatLabel>
            Revenue
            {displayStats.revenue > 0 && (
              <StatChange $positive>▲ Growing</StatChange>
            )}
          </StatLabel>
        </StatCard>

        <StatCard>
          <StatValue>{formatNumber(displayStats.profileViews)}</StatValue>
          <StatLabel>Profile Views</StatLabel>
        </StatCard>

        <StatCard>
          <StatValue>{formatNumber(displayStats.promotionClicks)}</StatValue>
          <StatLabel>Promotion Clicks</StatLabel>
        </StatCard>
      </StatsGrid>

      {/* Insights */}
      <InsightCard
        insight={latestInsight}
        onDismiss={handleDismiss}
        onAct={handleAct}
        onExpand={() => setChatOpen(true)}
      />

      <ChatPanel
        barId={user.barId}
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
      />

      {/* Recent Activity */}
      <SectionLabel>Recent Activity</SectionLabel>
      <ActivitySection>
        <ActivityCard>
          {recentActivity.length > 0 ? (
            recentActivity.map((item) => (
              <ActivityItem
                key={item.id}
                $clickable={!!item.href}
                onClick={() => {
                  if (item.href) router.push(item.href);
                }}
              >
                <ActivityIcon>{item.icon}</ActivityIcon>
                <ActivityContent>
                  <ActivityText>{item.text}</ActivityText>
                </ActivityContent>
                <ActivityTime>{item.time}</ActivityTime>
              </ActivityItem>
            ))
          ) : (
            <EmptyState>
              No recent activity yet. Start by creating an event, promotion, or
              pass!
            </EmptyState>
          )}
        </ActivityCard>
      </ActivitySection>
    </Container>
  );
};

export default BarDashboardContent;
