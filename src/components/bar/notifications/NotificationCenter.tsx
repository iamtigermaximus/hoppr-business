"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import { SkeletonBox, SkeletonCard } from "@/components/ui/Skeleton";

// ---- Types ----

interface TypeBreakdown {
  type: string;
  sent: number;
  opened: number;
  converted: number;
}

interface NotificationStats {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalConverted: number;
  totalFailed: number;
  openRate: number;
  conversionRate: number;
  byType: TypeBreakdown[];
}

interface HistoryItem {
  id: string;
  type: string;
  title: string;
  body: string;
  status: string;
  contentId: string | null;
  sentAt: string;
  openedAt: string | null;
}

interface NotificationData {
  success: boolean;
  bar: { name: string };
  period: { days: number; label: string };
  stats: NotificationStats;
  history: HistoryItem[];
}

interface NotificationCenterProps {
  barId: string;
}

// ---- Helpers ----

function formatType(type: string): string {
  const map: Record<string, string> = {
    PROMO_NEW: "New promo",
    PROMO_EXPIRING: "Promo expiring",
    EVENT_REMINDER: "Event reminder",
    EVENT_UPDATED: "Event updated",
    EVENT_CANCELLED: "Event cancelled",
    EVENT_INVITE: "Event invite",
    BAR_FOLLOWED: "New follower",
    BAR_VERIFIED: "Bar verified",
    BAR_NEW_CONTENT: "Bar activity",
    PASS_PURCHASED: "Pass sold",
    PASS_EXPIRING: "Pass expiring",
    PASS_SCANNED: "Pass scanned",
    SYSTEM: "System",
    INSIGHT: "Insight",
  };
  return map[type] || type.replace(/_/g, " ").toLowerCase();
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    sent: "Sent",
    delivered: "Delivered",
    opened: "Opened",
    failed: "Failed",
    converted: "Converted",
  };
  return map[status] || status;
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    sent: "#6b7280",
    delivered: "#3b82f6",
    opened: "#8b5cf6",
    converted: "#059669",
    failed: "#dc2626",
  };
  return map[status] || "#9ca3af";
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ---- Styled Components ----

const Container = styled.div`
  padding: 1.5rem 0;
  max-width: 820px;
  margin: 0 auto;
  width: 100%;
  @media (max-width: 768px) { padding: 1.25rem 1rem; }
  @media (max-width: 480px) { padding: 1rem 0.75rem; }
`;

const Header = styled.div`
  margin-bottom: 1.5rem;
`;

const Title = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
  @media (max-width: 480px) { font-size: 1.375rem; }
`;

const Subtitle = styled.p`
  color: #6b7280;
  font-size: 0.9375rem;
  margin: 0;
  @media (max-width: 480px) { font-size: 0.8125rem; }
`;

// ---- Stats grid ----

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.625rem;
  margin-bottom: 1.5rem;
  @media (max-width: 768px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 480px) { grid-template-columns: 1fr 1fr; gap: 0.5rem; }
`;

const StatCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.625rem;
  padding: 1rem;
  @media (max-width: 480px) { padding: 0.75rem; text-align: center; }
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
  margin-bottom: 0.25rem;
  @media (max-width: 480px) { font-size: 0.6875rem; }
`;

const StatValue = styled.div<{ $color?: string }>`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ $color }) => $color || "#1f2937"};
  line-height: 1.2;
  @media (max-width: 480px) { font-size: 1.25rem; }
`;

const StatSub = styled.div`
  font-size: 0.6875rem;
  color: #d1d5db;
  margin-top: 0.125rem;
`;

// ---- Period selector ----

const PeriodRow = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  @media (max-width: 480px) { gap: 0.375rem; }
`;

const PeriodButton = styled.button<{ $active: boolean }>`
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid ${({ $active }) => ($active ? "#7c3aed" : "#d1d5db")};
  background: ${({ $active }) => ($active ? "#f5f3ff" : "white")};
  color: ${({ $active }) => ($active ? "#7c3aed" : "#6b7280")};
  transition: all 0.15s;
  &:hover { border-color: #7c3aed; }
  @media (max-width: 480px) { flex: 1; text-align: center; }
`;

// ---- Type breakdown ----

const SectionTitle = styled.h2`
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.75rem;
`;

const TypeCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.625rem;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  @media (max-width: 480px) { padding: 0.625rem 0.75rem; gap: 0.5rem; }
`;

const TypeName = styled.div`
  font-size: 0.8125rem;
  font-weight: 600;
  color: #1f2937;
  flex: 1;
`;

const TypeNumbers = styled.div`
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: #6b7280;
  @media (max-width: 480px) { gap: 0.5rem; font-size: 0.6875rem; flex-wrap: wrap; justify-content: flex-end; }
`;

const TypeNumber = styled.span`
  white-space: nowrap;
`;

// ---- History list ----

const HistoryCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.625rem;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  @media (max-width: 480px) { padding: 0.625rem 0.75rem; }
`;

const HistoryTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.25rem;
  gap: 0.5rem;
`;

const HistoryTitle = styled.div`
  font-size: 0.8125rem;
  font-weight: 600;
  color: #1f2937;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const HistoryStatus = styled.span<{ $color: string }>`
  font-size: 0.6875rem;
  font-weight: 600;
  color: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const HistoryBody = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const HistoryMeta = styled.div`
  font-size: 0.625rem;
  color: #d1d5db;
  display: flex;
  gap: 0.75rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #d1d5db;
  font-size: 0.875rem;
`;

// ---- Loading / Error ----

const LoadingState = styled.div`
  text-align: center;
  padding: 4rem 1rem;
  color: #9ca3af;
  font-size: 0.9375rem;
`;

const ErrorState = styled.div`
  text-align: center;
  padding: 4rem 1rem;
  color: #dc2626;
  font-size: 0.9375rem;
`;

const FcmWarning = styled.div`
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 0.625rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  font-size: 0.8125rem;
  color: #92400e;
  line-height: 1.5;
`;

// ---- Notification preferences settings ----

const SettingsCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.625rem;
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  @media (max-width: 480px) { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
`;

const SettingsInfo = styled.div`
  flex: 1;
`;

const SettingsLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.125rem;
`;

const SettingsDesc = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
  line-height: 1.4;
`;

const Toggle = styled.label`
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
  cursor: pointer;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  span {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #d1d5db;
    border-radius: 12px;
    transition: background 0.2s;

    &::after {
      content: "";
      position: absolute;
      width: 18px;
      height: 18px;
      left: 3px;
      bottom: 3px;
      background: white;
      border-radius: 50%;
      transition: transform 0.2s;
    }
  }

  input:checked + span {
    background: #7c3aed;
  }

  input:checked + span::after {
    transform: translateX(20px);
  }
`;

// ---- Component ----

export default function NotificationCenter({ barId }: NotificationCenterProps) {
  const [data, setData] = useState<NotificationData | null>(null);
  const [fcmStatus, setFcmStatus] = useState<{
    configured: boolean;
    error: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [claimNotificationsEnabled, setClaimNotificationsEnabled] =
    useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("hoppr_token")
      : null;

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/auth/bar/${barId}/notifications?days=${days}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to load notification data");
        return r.json();
      }),
      fetch(`/api/auth/bar/${barId}/notifications/fcm-status`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .catch(() => ({ configured: false, error: null })),
      fetch(`/api/auth/bar/${barId}/notifications/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .catch(() => ({ claimNotificationsEnabled: true })),
    ])
      .then(([d, fcm, settings]) => {
        setData(d);
        setFcmStatus(fcm);
        setClaimNotificationsEnabled(
          settings.claimNotificationsEnabled ?? true,
        );
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [barId, token, days]);

  const handleToggleClaimNotifications = async () => {
    setSavingPreferences(true);
    const next = !claimNotificationsEnabled;
    setClaimNotificationsEnabled(next);
    try {
      await fetch(`/api/auth/bar/${barId}/notifications/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ claimNotificationsEnabled: next }),
      });
    } catch {
      setClaimNotificationsEnabled(!next); // revert on failure
    } finally {
      setSavingPreferences(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "1rem" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i}>
              <SkeletonBox $width="60%" $height="0.75rem" />
              <SkeletonBox $width="90%" $height="0.625rem" />
            </SkeletonCard>
          ))}
        </div>
      </Container>
    );
  }

  if (error || !data) {
    return (
      <Container>
        <ErrorState>
          {error || "Could not load notification data."}
        </ErrorState>
      </Container>
    );
  }

  const { stats, history } = data;

  return (
    <Container>
      <Header>
        <Title>Push notifications</Title>
        <Subtitle>
          {data.bar.name} · {data.period.label}
        </Subtitle>
      </Header>

      {/* FCM status warning */}
      {fcmStatus && !fcmStatus.configured && (
        <FcmWarning>
          Push notifications are not yet configured. Set up Firebase Cloud
          Messaging to start sending push notifications to your followers.
          Notifications are still logged here and delivered in-app.
        </FcmWarning>
      )}

      {/* Period selector */}
      <PeriodRow>
        <PeriodButton $active={days === 7} onClick={() => setDays(7)}>
          7 days
        </PeriodButton>
        <PeriodButton $active={days === 30} onClick={() => setDays(30)}>
          30 days
        </PeriodButton>
        <PeriodButton $active={days === 90} onClick={() => setDays(90)}>
          90 days
        </PeriodButton>
      </PeriodRow>

      {/* Stats grid */}
      <StatsGrid>
        <StatCard>
          <StatLabel>Total sent</StatLabel>
          <StatValue>{stats.totalSent}</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Opened</StatLabel>
          <StatValue $color="#8b5cf6">{stats.totalOpened}</StatValue>
          <StatSub>{stats.openRate}% open rate</StatSub>
        </StatCard>
        <StatCard>
          <StatLabel>Converted</StatLabel>
          <StatValue $color="#059669">{stats.totalConverted}</StatValue>
          <StatSub>{stats.conversionRate}% conversion</StatSub>
        </StatCard>
        <StatCard>
          <StatLabel>Failed</StatLabel>
          <StatValue $color="#dc2626">{stats.totalFailed}</StatValue>
        </StatCard>
      </StatsGrid>

      {/* Type breakdown */}
      {stats.byType.length > 0 && (
        <>
          <SectionTitle>By notification type</SectionTitle>
          {stats.byType.map((t) => (
            <TypeCard key={t.type}>
              <TypeName>{formatType(t.type)}</TypeName>
              <TypeNumbers>
                <TypeNumber>{t.sent} sent</TypeNumber>
                <TypeNumber>{t.opened} opened</TypeNumber>
                <TypeNumber>{t.converted} converted</TypeNumber>
              </TypeNumbers>
            </TypeCard>
          ))}
        </>
      )}

      {/* History */}
      <SectionTitle style={{ marginTop: "1.5rem" }}>
        Recent notifications
      </SectionTitle>
      {history.length === 0 ? (
        <EmptyState>
          No notifications sent yet. Notifications are triggered when you create
          promotions, events, or when followers interact with your bar.
        </EmptyState>
      ) : (
        history.map((item) => (
          <HistoryCard key={item.id}>
            <HistoryTop>
              <HistoryTitle>{item.title}</HistoryTitle>
              <HistoryStatus $color={statusColor(item.status)}>
                {statusLabel(item.status)}
              </HistoryStatus>
            </HistoryTop>
            <HistoryBody>{item.body}</HistoryBody>
            <HistoryMeta>
              <span>{formatType(item.type)}</span>
              <span>{timeAgo(item.sentAt)}</span>
              {item.openedAt && <span>· opened {timeAgo(item.openedAt)}</span>}
            </HistoryMeta>
          </HistoryCard>
        ))
      )}
    </Container>
  );
}
