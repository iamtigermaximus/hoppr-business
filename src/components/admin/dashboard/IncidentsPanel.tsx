"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import { getToken, formatRelativeTime, formatIncidentType } from "@/lib/dashboard-utils";

// ---- Types ----

interface Incident {
  id: string;
  barId: string;
  barName?: string;
  incidentType: string;
  severity: string;
  message: string;
  createdAt: string;
}

// ---- Styled components ----

const SectionTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
  @media (max-width: 480px) { font-size: 1rem; }
`;

const IncidentCard = styled.div<{ $severity: string }>`
  background: white;
  border: 1px solid #e5e7eb;
  border-left: 4px solid
    ${({ $severity }) =>
      $severity === "critical" ? "#dc2626" : $severity === "warning" ? "#f59e0b" : "#3b82f6"};
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  @media (max-width: 480px) { padding: 0.625rem 0.75rem; flex-direction: column; align-items: flex-start; }
`;

const IncidentBarName = styled.span`
  font-weight: 600;
  font-size: 0.875rem;
  color: #1f2937;
`;

const IncidentMessage = styled.p`
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0.125rem 0;
`;

const IncidentMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
`;

const IncidentType = styled.span`
  font-size: 0.6875rem;
  font-weight: 600;
  color: #6b7280;
  background: #f3f4f6;
  padding: 1px 6px;
  border-radius: 3px;
`;

const IncidentTime = styled.span`
  font-size: 0.6875rem;
  color: #9ca3af;
`;

const ResolveButton = styled.button`
  background: none;
  border: 1px solid #d1d5db;
  color: #6b7280;
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  &:hover { background: #f3f4f6; color: #374151; }
`;

const IncidentsList = styled.div``;

const RecentActivity = styled.div`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  overflow: hidden;
  padding: 0.5rem 0;
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 1.25rem;
  @media (max-width: 480px) { padding: 0.5rem 1rem; }
`;

const ActivityIcon = styled.div`
  font-size: 1.25rem;
  flex-shrink: 0;
`;

const ActivityContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ActivityText = styled.p`
  color: #1f2937;
  font-size: 0.875rem;
  font-weight: 500;
  margin: 0;
  @media (max-width: 480px) { font-size: 0.8125rem; }
`;

// ---- Component ----

export default function IncidentsPanel() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifyingBar, setNotifyingBar] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    fetch("/api/auth/admin/incidents?limit=10", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => setIncidents(data.incidents || []))
      .catch(() => console.error("Error fetching incidents"))
      .finally(() => setLoading(false));
  }, []);

  const handleResolveIncident = async (incidentId: string) => {
    const token = getToken();
    if (!token) return;
    try {
      await fetch("/api/auth/admin/incidents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: [incidentId] }),
      });
      setIncidents((prev) => prev.filter((i) => i.id !== incidentId));
    } catch {
      console.error("Error resolving incident");
    }
  };

  const handleNotifyBar = async (incident: Incident) => {
    const token = getToken();
    if (!token) return;
    setNotifyingBar(incident.id);
    try {
      const summary = `${incident.barName || "A bar"} had an issue: ${incident.message}. This has been resolved.`;
      await fetch("/api/auth/admin/incidents/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ barId: incident.barId, issueSummary: summary }),
      });
      await handleResolveIncident(incident.id);
    } catch {
      console.error("Error notifying bar");
    } finally {
      setNotifyingBar(null);
    }
  };

  return (
    <>
      <SectionTitle style={{ marginTop: "2rem" }}>
        Bar Incidents
        {incidents.length > 0 && (
          <span
            style={{
              fontSize: "0.875rem",
              fontWeight: 400,
              color: "#ef4444",
              marginLeft: "0.75rem",
            }}
          >
            {incidents.length} unresolved
          </span>
        )}
      </SectionTitle>
      <RecentActivity>
        <IncidentsList>
          {loading ? (
            <ActivityItem>
              <ActivityIcon>⏳</ActivityIcon>
              <ActivityContent>
                <ActivityText>Loading incidents...</ActivityText>
              </ActivityContent>
            </ActivityItem>
          ) : incidents.length > 0 ? (
            incidents.map((inc) => (
              <IncidentCard key={inc.id} $severity={inc.severity}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <IncidentBarName>{inc.barName || inc.barId.slice(0, 8)}</IncidentBarName>
                  <IncidentMessage>{inc.message}</IncidentMessage>
                  <IncidentMeta>
                    <IncidentType>{formatIncidentType(inc.incidentType)}</IncidentType>
                    <IncidentTime>{formatRelativeTime(new Date(inc.createdAt))}</IncidentTime>
                  </IncidentMeta>
                </div>
                <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                  <button
                    onClick={() => handleNotifyBar(inc)}
                    disabled={notifyingBar === inc.id}
                    style={{
                      background: notifyingBar === inc.id ? "#f3f4f6" : "#7c3aed",
                      color: notifyingBar === inc.id ? "#9ca3af" : "#fff",
                      border: "none",
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: "4px",
                      cursor: notifyingBar === inc.id ? "wait" : "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {notifyingBar === inc.id ? "Sending..." : "Notify Bar"}
                  </button>
                  <ResolveButton onClick={() => handleResolveIncident(inc.id)}>
                    Dismiss
                  </ResolveButton>
                </div>
              </IncidentCard>
            ))
          ) : (
            <ActivityItem>
              <ActivityIcon>✅</ActivityIcon>
              <ActivityContent>
                <ActivityText>No open incidents</ActivityText>
              </ActivityContent>
            </ActivityItem>
          )}
        </IncidentsList>
      </RecentActivity>
    </>
  );
}
