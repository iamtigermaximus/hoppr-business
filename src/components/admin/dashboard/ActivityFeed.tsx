"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import { getToken, formatRelativeTime } from "@/lib/dashboard-utils";

// ---- Types ----

interface Activity {
  id: string;
  icon: string;
  text: string;
  time: string;
  timestamp: Date;
}

interface ActivityFeedProps {
  limit?: number;
}

// ---- Styled components ----

const SectionTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
  @media (max-width: 480px) { font-size: 1rem; }
`;

const RecentActivity = styled.div`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  overflow: hidden;
`;

const ActivityList = styled.div``;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f3f4f6;
  &:last-child { border-bottom: none; }
  @media (max-width: 480px) { padding: 0.75rem 1rem; gap: 0.75rem; }
`;

const ActivityIcon = styled.div`
  font-size: 1.25rem;
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  border-radius: 0.375rem;
  @media (max-width: 480px) { width: 1.75rem; height: 1.75rem; font-size: 1rem; }
`;

const ActivityContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ActivityText = styled.p`
  color: #1f2937;
  font-size: 0.875rem;
  font-weight: 500;
  margin: 0 0 0.125rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  @media (max-width: 480px) { font-size: 0.8125rem; }
`;

const ActivityTime = styled.span`
  font-size: 0.75rem;
  color: #9ca3af;
`;

// ---- Component ----

export default function ActivityFeed({ limit = 5 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`/api/auth/admin/audit-logs?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((auditData) => {
        const auditLogs = auditData.logs || [];
        const list: Activity[] = [];

        for (const log of auditLogs) {
          let icon = "📝";
          let text = "";

          if (log.action === "CREATE" && log.resource === "BAR") {
            icon = "🍻";
            text = `New bar "${log.details?.barName || "Unknown"}" was created`;
          } else if (log.action === "UPDATE" && log.resource === "BAR") {
            icon = "✏️";
            text = `Bar "${log.details?.barName || "Unknown"}" was updated`;
          } else if (log.action === "DELETE") {
            icon = "🗑️";
            text = `A ${log.resource?.toLowerCase()} was deleted`;
          } else if (log.action === "IMPORT") {
            icon = "📁";
            text = `CSV import completed: ${log.details?.importedCount || 0} bars imported`;
          } else {
            icon = "📋";
            text = `${log.action} ${log.resource}`;
          }

          list.push({
            id: log.id,
            icon,
            text,
            time: formatRelativeTime(new Date(log.createdAt)),
            timestamp: new Date(log.createdAt),
          });
        }

        list.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setActivities(list.slice(0, limit));
      })
      .catch(() => console.error("Error fetching activities"))
      .finally(() => setLoading(false));
  }, [limit]);

  return (
    <>
      <SectionTitle>Recent Activity</SectionTitle>
      <RecentActivity>
        <ActivityList>
          {loading ? (
            <ActivityItem>
              <ActivityIcon>⏳</ActivityIcon>
              <ActivityContent>
                <ActivityText>Loading activities...</ActivityText>
              </ActivityContent>
            </ActivityItem>
          ) : activities.length > 0 ? (
            activities.map((a) => (
              <ActivityItem key={a.id}>
                <ActivityIcon>{a.icon}</ActivityIcon>
                <ActivityContent>
                  <ActivityText>{a.text}</ActivityText>
                  <ActivityTime>{a.time}</ActivityTime>
                </ActivityContent>
              </ActivityItem>
            ))
          ) : (
            <ActivityItem>
              <ActivityIcon>📭</ActivityIcon>
              <ActivityContent>
                <ActivityText>No recent activity</ActivityText>
                <ActivityTime>Check back later</ActivityTime>
              </ActivityContent>
            </ActivityItem>
          )}
        </ActivityList>
      </RecentActivity>
    </>
  );
}
