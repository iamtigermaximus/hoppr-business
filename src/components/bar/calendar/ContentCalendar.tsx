// src/components/bar/calendar/ContentCalendar.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import styled from "styled-components";

// ── Styled Components ──────────────────────────────────────────

const Container = styled.div`
  padding: 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const Title = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
`;

const MonthNav = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const MonthLabel = styled.span`
  font-weight: 600;
  font-size: 1rem;
  color: #1f2937;
  min-width: 140px;
  text-align: center;
`;

const NavButton = styled.button`
  width: 36px;
  height: 36px;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  color: #374151;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;

  &:hover {
    background: #f3f4f6;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const TypeFilters = styled.div`
  display: flex;
  gap: 0.25rem;
  background: #f3f4f6;
  padding: 0.25rem;
  border-radius: 0.5rem;
`;

const FilterChip = styled.button<{ $active: boolean; $color: string }>`
  padding: 0.4rem 0.875rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  background: ${({ $active, $color }) =>
    $active ? $color : "transparent"};
  color: ${({ $active, $color }) =>
    $active ? "white" : "#6b7280"};
  transition: all 0.15s;

  &:hover {
    background: ${({ $active, $color }) =>
      $active ? $color : "#e5e7eb"};
  }
`;

// ── Calendar Grid ──────────────────────────────────────────────

const CalendarGrid = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const WeekdayHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #f8f9fa;
  border-bottom: 1px solid #e5e7eb;
`;

const WeekdayLabel = styled.div`
  padding: 0.75rem 0.5rem;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;

  @media (max-width: 480px) {
    font-size: 0.65rem;
    padding: 0.5rem 0.25rem;
  }
`;

const MonthGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
`;

const DayCell = styled.button<{ $isToday: boolean; $isOtherMonth: boolean }>`
  aspect-ratio: 1;
  min-height: 80px;
  padding: 6px;
  border: none;
  border-right: 1px solid #f3f4f6;
  border-bottom: 1px solid #f3f4f6;
  background: ${({ $isToday }) =>
    $isToday ? "#7c3aed08" : "white"};
  cursor: pointer;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 3px;
  transition: background 0.1s;
  position: relative;

  &:hover {
    background: #f9fafb;
  }

  &:nth-child(7n) {
    border-right: none;
  }

  @media (max-width: 768px) {
    min-height: 60px;
    padding: 4px;
  }

  @media (max-width: 480px) {
    min-height: 48px;
    padding: 2px;
  }
`;

const DayNumber = styled.span<{ $isToday: boolean }>`
  font-size: 0.8rem;
  font-weight: ${({ $isToday }) => ($isToday ? 700 : 500)};
  color: ${({ $isToday }) => ($isToday ? "#7c3aed" : "#6b7280")};

  @media (max-width: 480px) {
    font-size: 0.7rem;
  }
`;

const DayDots = styled.div`
  display: flex;
  gap: 3px;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    gap: 2px;
  }
`;

const Dot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;

  @media (max-width: 480px) {
    width: 6px;
    height: 6px;
  }
`;

const DayLabels = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow: hidden;
`;

const DayLabel = styled.span<{ $color: string }>`
  font-size: 0.6rem;
  color: ${({ $color }) => $color};
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 480px) {
    font-size: 0.5rem;
  }
`;

// ── Selected Day Panel ─────────────────────────────────────────

const DayDetail = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.25rem;
  margin-top: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const DayDetailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const DayDetailTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
`;

const EntryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const EntryCard = styled.a`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  text-decoration: none;
  transition: background 0.1s;

  &:hover {
    background: #f3f4f6;
  }
`;

const EntryBadge = styled.span<{ $color: string }>`
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 3px 8px;
  border-radius: 4px;
  background: ${({ $color }) => $color}18;
  color: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const EntryTitle = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
  color: #1f2937;
  flex: 1;
`;

const EntryMeta = styled.span`
  font-size: 0.75rem;
  color: #9ca3af;
`;

const StatusBadge = styled.span<{ $status: string }>`
  font-size: 0.65rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 3px;
  background: ${({ $status }) =>
    $status === "FLAGGED_AUTO" || $status === "PENDING_REVIEW"
      ? "#fef3c7"
      : "#d1fae5"};
  color: ${({ $status }) =>
    $status === "FLAGGED_AUTO" || $status === "PENDING_REVIEW"
      ? "#92400e"
      : "#065f46"};
`;

// ── Empty / Loading states ─────────────────────────────────────

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  color: #6b7280;
`;

const LoadingWrap = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;
`;

const Spinner = styled.div`
  width: 36px;
  height: 36px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #7c3aed;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 0.75rem;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const SummaryBar = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  color: #6b7280;
`;

const SummaryItem = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;

  &::before {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${({ $color }) => $color};
    display: inline-block;
  }
`;

// ── Types ───────────────────────────────────────────────────────

const TYPE_COLORS = {
  event: "#3b82f6",
  promotion: "#10b981",
  pass: "#f59e0b",
} as const;

type ContentType = "all" | "events" | "promotions" | "passes";

interface CalendarEntry {
  id: string;
  type: "event" | "promotion" | "pass";
  title: string;
  date?: string;
  time?: string;
  startDate?: string;
  endDate?: string;
  validUntil?: string;
  price?: number;
  status: string;
}

interface CalendarDay {
  date: string;
  entries: CalendarEntry[];
}

interface CalendarData {
  days: CalendarDay[];
  summary: {
    totalEvents: number;
    totalPromotions: number;
    totalPasses: number;
    totalDays: number;
  };
  month?: string;
}

// ── Helpers ─────────────────────────────────────────────────────

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(year: number, month: number): string {
  return new Date(year, month).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function getEntryDate(entry: CalendarEntry): string {
  if (entry.type === "event" && entry.date) return entry.date;
  if (entry.type === "promotion" && entry.startDate) return entry.startDate;
  if (entry.type === "pass" && entry.validUntil) return entry.validUntil;
  return "";
}

// ── Component ───────────────────────────────────────────────────

interface ContentCalendarProps {
  barId: string;
}

export default function ContentCalendar({ barId }: ContentCalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [contentType, setContentType] = useState<ContentType>("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getToken = (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("hoppr_token");
    }
    return null;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) throw new Error("No authentication token found");

      const monthKey = getMonthKey(new Date(viewYear, viewMonth));
      const res = await fetch(
        `/api/auth/bar/${barId}/calendar?month=${monthKey}&type=${contentType}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!res.ok) throw new Error(`Failed: ${res.status}`);

      const json: CalendarData = await res.json();
      setData(json);
      setSelectedDate(null); // clear selection on data change
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [barId, viewYear, viewMonth, contentType]);

  // Build day → entries lookup
  const dayMap = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    if (data?.days) {
      for (const d of data.days) {
        map.set(d.date, d.entries);
      }
    }
    return map;
  }, [data]);

  // Selected day entries
  const selectedEntries = selectedDate ? dayMap.get(selectedDate) || [] : [];

  // Build calendar cells
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const prevMonthDays = getDaysInMonth(viewYear, viewMonth - 1);

  const cells: { day: number; date: string; isOtherMonth: boolean }[] = [];

  // Previous month filler
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = viewMonth === 0 ? 11 : viewMonth - 1;
    const y = viewMonth === 0 ? viewYear - 1 : viewYear;
    cells.push({
      day: d,
      date: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      isOtherMonth: true,
    });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      date: `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      isOtherMonth: false,
    });
  }

  // Next month filler (fill remaining grid cells)
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
    for (let d = 1; d <= remaining; d++) {
      cells.push({
        day: d,
        date: `${nextY}-${String(nextM + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        isOtherMonth: true,
      });
    }
  }

  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  if (loading) {
    return (
      <LoadingWrap>
        <Spinner />
        <p>Loading calendar...</p>
      </LoadingWrap>
    );
  }

  if (error) {
    return (
      <EmptyState>
        <p style={{ color: "#ef4444" }}>⚠️ {error}</p>
        <button
          onClick={fetchData}
          style={{
            marginTop: "0.75rem",
            padding: "0.5rem 1.25rem",
            background: "#7c3aed",
            color: "white",
            border: "none",
            borderRadius: "0.375rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </EmptyState>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Content Calendar</Title>
        <Controls>
          <TypeFilters>
            <FilterChip
              $active={contentType === "all"}
              $color="#6b7280"
              onClick={() => setContentType("all")}
            >
              All
            </FilterChip>
            <FilterChip
              $active={contentType === "events"}
              $color={TYPE_COLORS.event}
              onClick={() => setContentType("events")}
            >
              Events
            </FilterChip>
            <FilterChip
              $active={contentType === "promotions"}
              $color={TYPE_COLORS.promotion}
              onClick={() => setContentType("promotions")}
            >
              Promos
            </FilterChip>
            <FilterChip
              $active={contentType === "passes"}
              $color={TYPE_COLORS.pass}
              onClick={() => setContentType("passes")}
            >
              Passes
            </FilterChip>
          </TypeFilters>
          <MonthNav>
            <NavButton onClick={goPrevMonth}>←</NavButton>
            <MonthLabel>
              {formatMonthLabel(viewYear, viewMonth)}
            </MonthLabel>
            <NavButton onClick={goNextMonth}>→</NavButton>
          </MonthNav>
        </Controls>
      </Header>

      {data?.summary && (
        <SummaryBar>
          <SummaryItem $color={TYPE_COLORS.event}>
            {data.summary.totalEvents} events
          </SummaryItem>
          <SummaryItem $color={TYPE_COLORS.promotion}>
            {data.summary.totalPromotions} promos
          </SummaryItem>
          <SummaryItem $color={TYPE_COLORS.pass}>
            {data.summary.totalPasses} passes
          </SummaryItem>
        </SummaryBar>
      )}

      <CalendarGrid>
        <WeekdayHeader>
          {WEEKDAYS.map((day) => (
            <WeekdayLabel key={day}>{day}</WeekdayLabel>
          ))}
        </WeekdayHeader>
        <MonthGrid>
          {cells.map((cell) => {
            const entries = dayMap.get(cell.date) || [];
            const isToday = cell.date === todayKey;
            const isSelected = cell.date === selectedDate;
            const uniqueTypes = [...new Set(entries.map((e) => e.type))];

            return (
              <DayCell
                key={cell.date}
                $isToday={isToday}
                $isOtherMonth={cell.isOtherMonth}
                onClick={() => setSelectedDate(cell.date)}
                style={{
                  outline: isSelected ? "2px solid #7c3aed" : undefined,
                  outlineOffset: "-2px",
                  opacity: cell.isOtherMonth ? 0.4 : 1,
                }}
              >
                <DayNumber $isToday={isToday}>{cell.day}</DayNumber>
                {uniqueTypes.length > 0 && (
                  <DayDots>
                    {uniqueTypes.map((type) => (
                      <Dot key={type} $color={TYPE_COLORS[type]} />
                    ))}
                  </DayDots>
                )}
                {/* Show first 2 entry titles on larger screens */}
                {entries.length > 0 && (
                  <DayLabels>
                    {entries.slice(0, 2).map((e) => (
                      <DayLabel key={e.id} $color={TYPE_COLORS[e.type]}>
                        {e.title}
                      </DayLabel>
                    ))}
                    {entries.length > 2 && (
                      <DayLabel $color="#9ca3af">
                        +{entries.length - 2} more
                      </DayLabel>
                    )}
                  </DayLabels>
                )}
              </DayCell>
            );
          })}
        </MonthGrid>
      </CalendarGrid>

      {/* Selected day detail panel */}
      {selectedDate && (
        <DayDetail>
          <DayDetailHeader>
            <DayDetailTitle>
              {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                "en-US",
                { weekday: "long", month: "long", day: "numeric" },
              )}
            </DayDetailTitle>
            <button
              onClick={() => setSelectedDate(null)}
              style={{
                background: "none",
                border: "none",
                color: "#9ca3af",
                cursor: "pointer",
                fontSize: "1.25rem",
              }}
            >
              ✕
            </button>
          </DayDetailHeader>
          {selectedEntries.length > 0 ? (
            <EntryList>
              {selectedEntries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  href={`/bar/${barId}/${entry.type === "event" ? "events" : entry.type === "promotion" ? "promotions" : "passes"}`}
                >
                  <EntryBadge $color={TYPE_COLORS[entry.type]}>
                    {entry.type}
                  </EntryBadge>
                  <EntryTitle>{entry.title}</EntryTitle>
                  {entry.type === "pass" && entry.price != null && (
                    <EntryMeta>€{entry.price}</EntryMeta>
                  )}
                  {entry.type === "event" && entry.time && (
                    <EntryMeta>
                      {new Date(entry.time).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </EntryMeta>
                  )}
                  {entry.type === "promotion" && entry.endDate && (
                    <EntryMeta>
                      → {new Date(entry.endDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </EntryMeta>
                  )}
                  <StatusBadge $status={entry.status}>
                    {entry.status === "COMPLIANT" || entry.status === "ACTIVE"
                      ? "✓"
                      : "!"}{" "}
                    {entry.status.replace(/_/g, " ")}
                  </StatusBadge>
                </EntryCard>
              ))}
            </EntryList>
          ) : (
            <p style={{ color: "#9ca3af", textAlign: "center", padding: "1rem" }}>
              No content on this day.
            </p>
          )}
        </DayDetail>
      )}
    </Container>
  );
}
