"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import styled, { css } from "styled-components";
import { SkeletonBox, SkeletonTable, SkeletonTableRow, SkeletonTableCell } from "@/components/ui/Skeleton";

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const Page = styled.div`
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
  gap: 0.75rem;

  @media (min-width: 768px) {
    margin-bottom: 1.25rem;
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

const ViewToggleGroup = styled.div`
  display: flex;
  background: #f3f4f6;
  border-radius: 0.5rem;
  padding: 0.25rem;
`;

const ViewToggleBtn = styled.button<{ $active: boolean }>`
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 0.375rem;

  ${({ $active }) =>
    $active
      ? "background: white; color: #1f2937; box-shadow: 0 1px 2px rgba(0,0,0,0.08);"
      : "background: transparent; color: #6b7280;"}

  &:hover {
    color: #1f2937;
  }
`;

const FilterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
  align-items: center;

  @media (min-width: 768px) {
    gap: 0.625rem;
  }
`;

const SearchInput = styled.input`
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  min-width: 200px;
  flex: 1 1 200px;
  max-width: 320px;
  transition: border-color 0.15s, box-shadow 0.15s;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    outline: none;
    border-color: #7c3aed;
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1);
  }
`;

const FilterSelect = styled.select`
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  background: white;
  color: #374151;
  cursor: pointer;
  max-width: 180px;

  &:focus {
    outline: none;
    border-color: #7c3aed;
  }
`;

const ClearBtn = styled.button`
  background: none;
  border: none;
  color: #7c3aed;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.375rem 0.5rem;
  white-space: nowrap;

  &:hover {
    color: #6d28d9;
    text-decoration: underline;
  }
`;

const ActiveFilterCount = styled.span`
  font-size: 0.625rem;
  background: #7c3aed;
  color: white;
  border-radius: 1rem;
  padding: 0.125rem 0.5rem;
  font-weight: 600;
`;

// ---- Table ----

const TableWrapper = styled.div`
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  overflow: hidden;
`;

const TableScroll = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
`;

const Th = styled.th<{ $sortable?: boolean }>`
  text-align: left;
  padding: 0.75rem 1rem;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
  user-select: none;

  ${({ $sortable }) =>
    $sortable &&
    css`
      cursor: pointer;
      &:hover {
        color: #7c3aed;
      }
    `}
`;

const SortArrow = styled.span<{ $active: boolean; $dir: "asc" | "desc" }>`
  margin-left: 0.25rem;
  color: ${({ $active }) => ($active ? "#7c3aed" : "#d1d5db")};
`;

const Td = styled.td`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
  vertical-align: middle;
`;

const Tr = styled.tr<{ $expanded?: boolean }>`
  transition: background 0.1s;

  &:hover {
    background: ${({ $expanded }) => ($expanded ? "white" : "#fafbfc")};
  }

  &:last-child td {
    border-bottom: none;
  }
`;

const BarName = styled.span`
  font-weight: 600;
  color: #1f2937;
  cursor: pointer;

  &:hover {
    color: #7c3aed;
    text-decoration: underline;
  }
`;

const BarMeta = styled.span`
  color: #9ca3af;
  font-size: 0.6875rem;
`;

// ---- Badges ----

const badgeColors: Record<string, string> = {
  ACTIVE: "#dcfce7,#166534",
  GROWING: "#dbeafe,#1e40af",
  STAGNANT: "#fef3c7,#92400e",
  DEAD: "#fef2f2,#dc2626",
  NEW: "#f3e8ff,#7c3aed",
};

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-block;
  padding: 0.1875rem 0.5rem;
  border-radius: 0.75rem;
  font-size: 0.6875rem;
  font-weight: 600;
  white-space: nowrap;

  ${({ $status }) => {
    const c = badgeColors[$status];
    if (c) {
      const [bg, fg] = c.split(",");
      return `background: ${bg}; color: ${fg};`;
    }
    return "background: #f3f4f6; color: #6b7280;";
  }}
`;

const OutreachBadge = styled.span<{ $status: string }>`
  display: inline-block;
  padding: 0.1875rem 0.5rem;
  border-radius: 0.75rem;
  font-size: 0.6875rem;
  font-weight: 600;
  white-space: nowrap;

  ${({ $status }) => {
    switch ($status) {
      case "NOT_CONTACTED":
        return "background: #f3f4f6; color: #6b7280;";
      case "EMAILED":
        return "background: #dbeafe; color: #1e40af;";
      case "CALLED":
        return "background: #fef3c7; color: #92400e;";
      case "IN_DISCUSSION":
        return "background: #dcfce7; color: #166534;";
      default:
        return "background: #f3f4f6; color: #6b7280;";
    }
  }}
`;

const StatusDropdown = styled.select<{ $status: string }>`
  padding: 0.1875rem 0.375rem;
  border-radius: 0.375rem;
  font-size: 0.6875rem;
  font-weight: 600;
  border: 1px solid #d1d5db;
  cursor: pointer;
  max-width: 140px;

  ${({ $status }) => {
    switch ($status) {
      case "NOT_CONTACTED":
        return "background: #f3f4f6; color: #6b7280; border-color: #d1d5db;";
      case "EMAILED":
        return "background: #dbeafe; color: #1e40af; border-color: #93c5fd;";
      case "CALLED":
        return "background: #fef3c7; color: #92400e; border-color: #fcd34d;";
      case "IN_DISCUSSION":
        return "background: #dcfce7; color: #166534; border-color: #86efac;";
      default:
        return "background: #f3f4f6; color: #6b7280; border-color: #d1d5db;";
    }
  }}

  &:focus {
    outline: none;
    border-color: #7c3aed;
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ScoreText = styled.span<{ $score: number }>`
  font-weight: 600;
  font-size: 0.8125rem;
  color: ${({ $score }) => {
    if ($score >= 70) return "#16a34a";
    if ($score >= 50) return "#f59e0b";
    if ($score >= 30) return "#f97316";
    return "#dc2626";
  }};
`;

// ---- Log button + inline form ----

const LogBtn = styled.button`
  padding: 0.3125rem 0.625rem;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.6875rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;

  &:hover {
    background: #6d28d9;
  }
`;

const ViewBtn = styled.button`
  padding: 0.3125rem 0.625rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.6875rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: #e5e7eb;
  }
`;

const ActionCell = styled.div`
  display: flex;
  gap: 0.375rem;
  align-items: center;
`;

// Inline log form
const ExpandedRow = styled.tr`
  background: #faf5ff;
  border-bottom: 1px solid #e5e7eb;
`;

const ExpandedCell = styled.td`
  padding: 1rem;
`;

const InlineForm = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: flex-end;
`;

const InlineField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const InlineLabel = styled.label`
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
`;

const InlineSelect = styled.select`
  padding: 0.4375rem 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  background: white;
  min-width: 130px;

  &:focus {
    outline: none;
    border-color: #7c3aed;
  }
`;

const InlineInput = styled.input`
  padding: 0.4375rem 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  min-width: 130px;

  &:focus {
    outline: none;
    border-color: #7c3aed;
  }
`;

const InlineTextarea = styled.textarea`
  padding: 0.4375rem 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  resize: vertical;
  min-height: 36px;
  max-height: 80px;
  min-width: 180px;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #7c3aed;
  }
`;

const InlineActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
`;

const SubmitBtn = styled.button`
  padding: 0.4375rem 0.875rem;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: #6d28d9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CancelBtn = styled.button`
  padding: 0.4375rem 0.875rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
`;

// ---- Pagination ----

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-top: 1px solid #e5e7eb;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const PageInfo = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
`;

const PageButtons = styled.div`
  display: flex;
  gap: 0.25rem;
  align-items: center;
`;

const PageBtn = styled.button<{ $active?: boolean }>`
  padding: 0.375rem 0.625rem;
  border: 1px solid ${({ $active }) => ($active ? "#7c3aed" : "#d1d5db")};
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${({ $active }) => ($active ? "#7c3aed" : "white")};
  color: ${({ $active }) => ($active ? "white" : "#374151")};
  cursor: pointer;
  min-width: 32px;
  text-align: center;

  &:hover:not(:disabled) {
    background: ${({ $active }) => ($active ? "#6d28d9" : "#f3f4f6")};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

// ---- Kanban (condensed) ----

const KanbanBoard = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  min-height: 60vh;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    gap: 0.75rem;
    padding-bottom: 0.5rem;

    /* Hide scrollbar on mobile */
    &::-webkit-scrollbar {
      display: none;
    }
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

const KColumn = styled.div<{ $isDragOver?: boolean }>`
  background: ${({ $isDragOver }) => ($isDragOver ? "#f0fdf4" : "#f9fafb")};
  border-radius: 0.75rem;
  border: 2px dashed ${({ $isDragOver }) => ($isDragOver ? "#16a34a" : "#e5e7eb")};
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  min-height: 300px;
  transition: background 0.2s, border-color 0.2s;

  @media (max-width: 768px) {
    min-width: 280px;
    max-width: 320px;
    flex-shrink: 0;
    scroll-snap-align: start;
  }
`;

const KColumnHeader = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.75rem;
  background: white;
  border-radius: 0.5rem;
  border-left: 4px solid ${({ $color }) => $color};
`;

const KColumnTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const KColumnCount = styled.span`
  background: #e5e7eb;
  color: #374151;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 1rem;
`;

const KCard = styled.div`
  background: white;
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  transition: transform 0.15s, box-shadow 0.15s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
  }

  &:active {
    cursor: grabbing;
  }
`;

const KCardName = styled.div`
  font-weight: 600;
  font-size: 0.8125rem;
  color: #1f2937;
  margin-bottom: 0.25rem;
`;

const KCardMeta = styled.div`
  font-size: 0.6875rem;
  color: #6b7280;
  margin-bottom: 0.375rem;
`;

const KCardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.375rem;
  flex-wrap: wrap;
`;

const KLastContact = styled.div`
  font-size: 0.625rem;
  color: #9ca3af;
  margin-top: 0.25rem;
`;

const KanbanPageInfo = styled.div`
  text-align: center;
  font-size: 0.75rem;
  color: #9ca3af;
  margin-bottom: 0.75rem;

  @media (min-width: 769px) {
    display: none;
  }
`;

const KEmpty = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 0.75rem;
  padding: 2rem 0;
`;

// ---- State ----

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

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #9ca3af;
  font-size: 0.875rem;
`;

const RetryBtn = styled.button`
  padding: 0.5rem 1rem;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.75rem;

  &:hover {
    background: #6d28d9;
  }
`;

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

interface OutreachBar {
  id: string;
  name: string;
  type: string;
  cityName: string | null;
  district: string | null;
  barStatus: string;
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

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface FilterOptions {
  cities: string[];
  types: string[];
}

interface TableData {
  success: boolean;
  view: "table";
  bars: OutreachBar[];
  pagination: PaginationMeta;
  filters: FilterOptions;
}

interface KanbanColumn {
  status: string;
  label: string;
  bars: OutreachBar[];
}

interface KanbanData {
  success: boolean;
  view: "kanban";
  columns: KanbanColumn[];
  pagination: PaginationMeta;
  filters: FilterOptions;
}

type OutreachData = TableData | KanbanData;

const OUTREACH_STATUSES = [
  { value: "", label: "All statuses" },
  { value: "NOT_CONTACTED", label: "Not Contacted" },
  { value: "EMAILED", label: "Emailed" },
  { value: "CALLED", label: "Called" },
  { value: "IN_DISCUSSION", label: "In Discussion" },
];

const SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "qualityScore", label: "Quality Score" },
  { value: "lastContacted", label: "Last Contacted" },
  { value: "recentlyAdded", label: "Recently Added" },
];

const TIER_OPTIONS = [
  { value: "", label: "All tiers" },
  { value: "ACTIVE", label: "Active" },
  { value: "GROWING", label: "Growing" },
  { value: "STAGNANT", label: "Stagnant" },
  { value: "DEAD", label: "Dead" },
  { value: "NEW", label: "New" },
];

const METHOD_OPTIONS = [
  { value: "EMAIL", label: "Email" },
  { value: "PHONE_CALL", label: "Phone" },
  { value: "IN_PERSON", label: "In Person" },
  { value: "SOCIAL_MEDIA", label: "Social" },
];

const LOG_STATUS_OPTIONS = [
  "NOT_CONTACTED",
  "EMAILED",
  "CALLED",
  "IN_DISCUSSION",
  "CLAIMED",
  "DECLINED",
];

const COLUMN_COLORS: Record<string, string> = {
  NOT_CONTACTED: "#9ca3af",
  EMAILED: "#3b82f6",
  CALLED: "#f59e0b",
  IN_DISCUSSION: "#16a34a",
};

const METHOD_LABELS: Record<string, string> = {
  EMAIL: "Email",
  PHONE_CALL: "Phone",
  IN_PERSON: "In Person",
  SOCIAL_MEDIA: "Social",
};

const STATUS_LABELS: Record<string, string> = {
  NOT_CONTACTED: "Not Contacted",
  EMAILED: "Emailed",
  CALLED: "Called",
  IN_DISCUSSION: "In Discussion",
  CLAIMED: "Claimed",
  DECLINED: "Declined",
};

// ============================================================================
// COMPONENT
// ============================================================================

const OutreachKanban = () => {
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataBeforeChange = useRef<OutreachData | null>(null);

  // Data state
  const [data, setData] = useState<OutreachData | null>(null);
  const [dataVersion, setDataVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [view, setView] = useState<"table" | "kanban">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("outreach_view") as "table" | "kanban") || "table";
    }
    return "table";
  });
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [outreachFilter, setOutreachFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [sort, setSort] = useState("name");
  const [page, setPage] = useState(1);
  const [limit] = useState(25);

  // Drag-and-drop state (kanban only)
  const [dragBarId, setDragBarId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Inline log state
  const [expandedBarId, setExpandedBarId] = useState<string | null>(null);
  const [logMethod, setLogMethod] = useState("EMAIL");
  const [logStatus, setLogStatus] = useState("EMAILED");
  const [logNotes, setLogNotes] = useState("");
  const [logFollowUp, setLogFollowUp] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ---- Data fetching ----

  const fetchOutreach = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("hoppr_token");
      if (!token) {
        setError("No authentication token found");
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      params.set("view", view);
      params.set("sort", sort);
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (search.trim()) params.set("search", search.trim());
      if (cityFilter) params.set("city", cityFilter);
      if (typeFilter) params.set("type", typeFilter);
      if (outreachFilter) params.set("outreachStatus", outreachFilter);
      if (tierFilter) params.set("tier", tierFilter);

      const res = await fetch(`/api/auth/admin/outreach?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `Failed to fetch: ${res.status}`);
      }

      const json: OutreachData = await res.json();
      setData(json);
      setDataVersion((v) => v + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load outreach data");
    } finally {
      setLoading(false);
    }
  }, [view, sort, page, limit, search, cityFilter, typeFilter, outreachFilter, tierFilter]);

  useEffect(() => {
    fetchOutreach();
  }, [fetchOutreach]);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
    }, 300);
  };

  // Reset page when filters change
  const handleFilterChange = (setter: (v: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setCityFilter("");
    setTypeFilter("");
    setOutreachFilter("");
    setTierFilter("");
    setSort("name");
    setPage(1);
  };

  const activeFilterCount = [cityFilter, typeFilter, outreachFilter, tierFilter].filter(Boolean)
    .length + (search.trim() ? 1 : 0);

  // ---- Inline log ----

  const openLogForm = (bar: OutreachBar) => {
    setExpandedBarId(bar.id);
    // Default to the bar's current status — user can change it in the form
    setLogStatus(bar.latestOutreach?.status ?? "NOT_CONTACTED");
    setLogMethod("EMAIL");
    setLogNotes("");
    setLogFollowUp("");
  };

  const handleSubmitLog = async () => {
    const barId = expandedBarId;
    if (!barId) return;

    // Snapshot current data so we can roll back without a full refetch
    dataBeforeChange.current = data;

    // Optimistic: update UI immediately, then close form
    applyOptimisticStatus(barId, logStatus);
    setExpandedBarId(null);
    setSubmitting(true);

    try {
      const token = localStorage.getItem("hoppr_token");
      if (!token) {
        if (dataBeforeChange.current) setData(dataBeforeChange.current);
        return;
      }

      const res = await fetch("/api/auth/admin/outreach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          barId,
          method: logMethod,
          status: logStatus,
          notes: logNotes || null,
          followUpAt: logFollowUp || null,
        }),
      });

      if (!res.ok) {
        if (dataBeforeChange.current) setData(dataBeforeChange.current);
        const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        console.error("Log contact failed:", errBody);
      }
      // On success, trust the optimistic update — do not re-fetch.
    } catch (err) {
      if (dataBeforeChange.current) setData(dataBeforeChange.current);
      console.error("Log contact network error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Quick status change (dropdown in table row) ----

  const [quickSubmitting, setQuickSubmitting] = useState<Set<string>>(new Set());

  const applyOptimisticStatus = (barId: string, newStatus: string) => {
    setData((prev) => {
      if (!prev) return prev;

      if (prev.view === "table") {
        return {
          ...prev,
          bars: prev.bars.map((b) =>
            b.id === barId
              ? {
                  ...b,
                  latestOutreach: {
                    id: b.latestOutreach?.id ?? `opt-${Date.now()}`,
                    method: b.latestOutreach?.method ?? "EMAIL",
                    status: newStatus,
                    notes: b.latestOutreach?.notes ?? null,
                    followUpAt: b.latestOutreach?.followUpAt ?? null,
                    createdAt: b.latestOutreach?.createdAt ?? new Date().toISOString(),
                    userName: b.latestOutreach?.userName ?? null,
                  },
                }
              : b
          ),
        };
      }

      // Kanban: find and move the bar to the correct column
      let movedBar: OutreachBar | null = null;
      const strippedColumns = prev.columns.map((col) => {
        const match = col.bars.find((b) => b.id === barId);
        if (match) {
          movedBar = {
            ...match,
            latestOutreach: {
              id: match.latestOutreach?.id ?? `opt-${Date.now()}`,
              method: match.latestOutreach?.method ?? "EMAIL",
              status: newStatus,
              notes: match.latestOutreach?.notes ?? null,
              followUpAt: match.latestOutreach?.followUpAt ?? null,
              createdAt: match.latestOutreach?.createdAt ?? new Date().toISOString(),
              userName: match.latestOutreach?.userName ?? null,
            },
          };
          return { ...col, bars: col.bars.filter((b) => b.id !== barId) };
        }
        return col;
      });

      if (movedBar) {
        return {
          ...prev,
          columns: strippedColumns.map((col) =>
            col.status === newStatus
              ? { ...col, bars: [movedBar!, ...col.bars] }
              : col
          ),
        };
      }

      return prev;
    });
  };

  const handleQuickStatusChange = async (barId: string, newStatus: string) => {
    // Snapshot current data so we can roll back without a full refetch
    dataBeforeChange.current = data;

    // Optimistic: update UI immediately
    applyOptimisticStatus(barId, newStatus);
    setQuickSubmitting((prev) => new Set(prev).add(barId));

    try {
      const token = localStorage.getItem("hoppr_token");
      if (!token) {
        if (dataBeforeChange.current) setData(dataBeforeChange.current);
        return;
      }

      const res = await fetch("/api/auth/admin/outreach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          barId,
          method: "EMAIL",
          status: newStatus,
          notes: null,
          followUpAt: null,
        }),
      });

      if (!res.ok) {
        if (dataBeforeChange.current) setData(dataBeforeChange.current);
        const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        console.error("Quick status change failed:", errBody);
      }
      // On success, trust the optimistic update — do not re-fetch.
      // The next filter/pagination change will pull fresh server data.
    } catch (err) {
      if (dataBeforeChange.current) setData(dataBeforeChange.current);
      console.error("Quick status change network error:", err);
    } finally {
      setQuickSubmitting((prev) => {
        const next = new Set(prev);
        next.delete(barId);
        return next;
      });
    }
  };

  // ---- Formatting ----

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const isFollowUpOverdue = (dateStr: string | null) => {
    if (!dateStr) return false;
    return new Date(dateStr) <= new Date();
  };

  const typeLabel = (t: string) => (t || "").replace(/_/g, " ");

  // ---- Derived ----

  const filters = data?.filters ?? { cities: [], types: [] };

  // ---- Render helpers ----

  const renderTable = (bars: OutreachBar[], pagination: PaginationMeta) => {
    if (bars.length === 0) {
      return (
        <TableWrapper>
          <EmptyState>
            {activeFilterCount > 0
              ? "No bars match your filters. Try widening your search."
              : "No outreach targets found. New unclaimed bars will appear here."}
          </EmptyState>
        </TableWrapper>
      );
    }

    const totalPages = pagination.pages;

    return (
      <TableWrapper>
        <TableScroll>
          <StyledTable>
            <thead>
              <tr>
                <Th $sortable onClick={() => handleSortChange("name")}>
                  Bar
                  <SortArrow $active={sort === "name"} $dir="asc">&uarr;&darr;</SortArrow>
                </Th>
                <Th>City</Th>
                <Th>Type</Th>
                <Th $sortable onClick={() => handleSortChange("qualityScore")}>
                  Score
                  <SortArrow $active={sort === "qualityScore"} $dir="desc">&uarr;&darr;</SortArrow>
                </Th>
                <Th>Tier</Th>
                <Th>Outreach</Th>
                <Th $sortable onClick={() => handleSortChange("lastContacted")}>
                  Contacted
                  <SortArrow $active={sort === "lastContacted"} $dir="asc">&uarr;&darr;</SortArrow>
                </Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {bars.map((bar) => (
                <TableRow
                  key={bar.id}
                  bar={bar}
                  isExpanded={expandedBarId === bar.id}
                  onToggleLog={() =>
                    expandedBarId === bar.id
                      ? setExpandedBarId(null)
                      : openLogForm(bar)
                  }
                  onViewBar={() => router.push(`/admin/bars/${bar.id}`)}
                  onQuickStatusChange={handleQuickStatusChange}
                  isQuickSubmitting={quickSubmitting.has(bar.id)}
                  dataVersion={dataVersion}
                  logMethod={logMethod}
                  logStatus={logStatus}
                  logNotes={logNotes}
                  logFollowUp={logFollowUp}
                  onLogMethodChange={setLogMethod}
                  onLogStatusChange={setLogStatus}
                  onLogNotesChange={setLogNotes}
                  onLogFollowUpChange={setLogFollowUp}
                  onSubmit={handleSubmitLog}
                  onCancel={() => setExpandedBarId(null)}
                  submitting={submitting}
                />
              ))}
            </tbody>
          </StyledTable>
        </TableScroll>

        {totalPages > 1 && (
          <Pagination>
            <PageInfo>
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              {pagination.total} bars
            </PageInfo>
            <PageButtons>
              <PageBtn disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Prev
              </PageBtn>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                // Show pages around current
                let pageNum: number;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (page <= 4) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = page - 3 + i;
                }
                return (
                  <PageBtn
                    key={pageNum}
                    $active={pageNum === page}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </PageBtn>
                );
              })}
              <PageBtn disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </PageBtn>
            </PageButtons>
          </Pagination>
        )}
      </TableWrapper>
    );
  };

  const renderKanban = (columns: KanbanColumn[], pagination: PaginationMeta) => {
    const totalPages = pagination.pages;
    const allEmpty = columns.every((c) => c.bars.length === 0);

    return (
      <>
        {allEmpty ? (
          <EmptyState>
            {activeFilterCount > 0
              ? "No bars match your filters. Try widening your search."
              : "No outreach targets found."}
          </EmptyState>
        ) : (
          <>
            {/* Page indicator for mobile */}
            <KanbanPageInfo>
              Page {pagination.page} of {totalPages || 1} · {pagination.total} bars total
            </KanbanPageInfo>
            <KanbanBoard>
              {columns.map((col) => (
                <KColumn
                  key={col.status}
                  $isDragOver={dragOverColumn === col.status}
                  onDragOverCapture={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverColumn(col.status);
                  }}
                  onDragLeaveCapture={() => setDragOverColumn(null)}
                  onDropCapture={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverColumn(null);
                    if (dragBarId) {
                      handleQuickStatusChange(dragBarId, col.status);
                      setDragBarId(null);
                    }
                  }}
                >
                  <KColumnHeader $color={COLUMN_COLORS[col.status] || "#9ca3af"}>
                    <KColumnTitle>{col.label}</KColumnTitle>
                    <KColumnCount>{col.bars.length}</KColumnCount>
                  </KColumnHeader>

                  {col.bars.length === 0 ? (
                    <KEmpty>No bars in this stage</KEmpty>
                  ) : (
                    col.bars.map((bar) => (
                      <KCard
                        key={bar.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", bar.id);
                          e.dataTransfer.effectAllowed = "move";
                          setDragBarId(bar.id);
                        }}
                      >
                        <KCardName>{bar.name}</KCardName>
                        <KCardMeta>
                          {bar.cityName || "Unknown"} · {typeLabel(bar.type)}
                        </KCardMeta>
                        <KCardFooter>
                          {bar.qualityScore !== null ? (
                            <ScoreText $score={bar.qualityScore}>{bar.qualityScore}/100</ScoreText>
                          ) : (
                            <StatusBadge $status="">No score</StatusBadge>
                          )}
                          {bar.performanceTier && (
                            <StatusBadge $status={bar.performanceTier}>
                              {bar.performanceTier}
                            </StatusBadge>
                          )}
                          <ViewBtn onClick={(e) => { e.stopPropagation(); router.push(`/admin/bars/${bar.id}`); }}>View</ViewBtn>
                          <LogBtn onClick={(e) => { e.stopPropagation(); openLogForm(bar); }}>+ Log</LogBtn>
                        </KCardFooter>
                        {bar.latestOutreach && (
                          <KLastContact>
                            {METHOD_LABELS[bar.latestOutreach.method] || bar.latestOutreach.method} by{" "}
                            {bar.latestOutreach.userName || "Admin"} ·{" "}
                            {formatDate(bar.latestOutreach.createdAt)}
                            {bar.latestOutreach.followUpAt &&
                              isFollowUpOverdue(bar.latestOutreach.followUpAt) && (
                                <span style={{ marginLeft: "0.25rem", color: "#dc2626" }}>
                                  · Follow-up overdue
                                </span>
                              )}
                          </KLastContact>
                        )}
                      </KCard>
                    ))
                  )}
                </KColumn>
              ))}
            </KanbanBoard>

            {totalPages > 1 && (
              <Pagination style={{ marginTop: "1rem" }}>
                <PageInfo>
                  Showing {(pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                  {pagination.total} bars
                </PageInfo>
                <PageButtons>
                  <PageBtn disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Prev
                  </PageBtn>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 7) pageNum = i + 1;
                    else if (page <= 4) pageNum = i + 1;
                    else if (page >= totalPages - 3) pageNum = totalPages - 6 + i;
                    else pageNum = page - 3 + i;
                    return (
                      <PageBtn
                        key={pageNum}
                        $active={pageNum === page}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </PageBtn>
                    );
                  })}
                  <PageBtn disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </PageBtn>
                </PageButtons>
              </Pagination>
            )}
          </>
        )}
      </>
    );
  };

  // ---- Main render ----

  return (
    <Page>
      <Header>
        <Title>Outreach Pipeline</Title>
        <ViewToggleGroup>
          <ViewToggleBtn $active={view === "table"} onClick={() => { setView("table"); localStorage.setItem("outreach_view", "table"); }}>
            List
          </ViewToggleBtn>
          <ViewToggleBtn $active={view === "kanban"} onClick={() => { setView("kanban"); localStorage.setItem("outreach_view", "kanban"); }}>
            Kanban
          </ViewToggleBtn>
        </ViewToggleGroup>
      </Header>

      {/* Filter bar */}
      <FilterBar>
        <SearchInput
          type="text"
          placeholder="Search bars, cities..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        <FilterSelect
          value={cityFilter}
          onChange={(e) => handleFilterChange(setCityFilter, e.target.value)}
        >
          <option value="">All cities</option>
          {filters.cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          value={typeFilter}
          onChange={(e) => handleFilterChange(setTypeFilter, e.target.value)}
        >
          <option value="">All types</option>
          {filters.types.map((t) => (
            <option key={t} value={t}>
              {typeLabel(t)}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          value={outreachFilter}
          onChange={(e) => handleFilterChange(setOutreachFilter, e.target.value)}
        >
          {OUTREACH_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          value={tierFilter}
          onChange={(e) => handleFilterChange(setTierFilter, e.target.value)}
        >
          {TIER_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect value={sort} onChange={(e) => handleSortChange(e.target.value)}>
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              Sort: {s.label}
            </option>
          ))}
        </FilterSelect>
        {activeFilterCount > 0 && (
          <>
            <ActiveFilterCount>{activeFilterCount}</ActiveFilterCount>
            <ClearBtn onClick={clearFilters}>Clear all</ClearBtn>
          </>
        )}
      </FilterBar>

      {/* Content */}
      {loading ? (
        <SkeletonTable>
          <SkeletonBox $height="40px" $width="100%" $radius="0" />
          {Array.from({ length: 10 }).map((_, i) => (
            <SkeletonTableRow key={i}>
              <SkeletonTableCell $width="22%" />
              <SkeletonTableCell $width="14%" />
              <SkeletonTableCell $width="10%" />
              <SkeletonTableCell $width="6%" />
              <SkeletonTableCell $width="10%" />
              <SkeletonTableCell $width="16%" />
              <SkeletonTableCell $width="12%" />
              <SkeletonTableCell $width="10%" />
            </SkeletonTableRow>
          ))}
        </SkeletonTable>
      ) : error ? (
        <ErrorState>
          <p>{error}</p>
          <RetryBtn onClick={fetchOutreach}>Try Again</RetryBtn>
        </ErrorState>
      ) : data?.view === "kanban" ? (
        renderKanban((data as KanbanData).columns, (data as KanbanData).pagination)
      ) : data?.view === "table" ? (
        renderTable((data as TableData).bars, (data as TableData).pagination)
      ) : null}

      {/* Inline log modal for kanban view (table uses inline expand) */}
      {expandedBarId && view === "kanban" && (
        <KanbanLogModal
          bar={findBarInData(data, expandedBarId)}
          method={logMethod}
          status={logStatus}
          notes={logNotes}
          followUp={logFollowUp}
          onMethodChange={setLogMethod}
          onStatusChange={setLogStatus}
          onNotesChange={setLogNotes}
          onFollowUpChange={setLogFollowUp}
          onSubmit={handleSubmitLog}
          onClose={() => setExpandedBarId(null)}
          submitting={submitting}
        />
      )}
    </Page>
  );
};

// ============================================================================
// TABLE ROW (inline expand)
// ============================================================================

interface TableRowProps {
  bar: OutreachBar;
  isExpanded: boolean;
  onToggleLog: () => void;
  onViewBar: () => void;
  onQuickStatusChange: (barId: string, newStatus: string) => void;
  isQuickSubmitting: boolean;
  dataVersion: number;
  logMethod: string;
  logStatus: string;
  logNotes: string;
  logFollowUp: string;
  onLogMethodChange: (v: string) => void;
  onLogStatusChange: (v: string) => void;
  onLogNotesChange: (v: string) => void;
  onLogFollowUpChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
}

const TableRow = ({
  bar,
  isExpanded,
  onToggleLog,
  onViewBar,
  onQuickStatusChange,
  isQuickSubmitting,
  dataVersion,
  logMethod,
  logStatus,
  logNotes,
  logFollowUp,
  onLogMethodChange,
  onLogStatusChange,
  onLogNotesChange,
  onLogFollowUpChange,
  onSubmit,
  onCancel,
  submitting,
}: TableRowProps) => {
  const isFollowUpOverdue = (dateStr: string | null) => {
    if (!dateStr) return false;
    return new Date(dateStr) <= new Date();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <>
      <Tr $expanded={isExpanded}>
        <Td>
          <BarName onClick={onViewBar}>{bar.name}</BarName>
          {bar.district && <BarMeta> · {bar.district}</BarMeta>}
        </Td>
        <Td>{bar.cityName || "—"}</Td>
        <Td style={{ fontSize: "0.75rem" }}>{(bar.type || "").replace(/_/g, " ")}</Td>
        <Td>
          {bar.qualityScore !== null ? (
            <ScoreText $score={bar.qualityScore}>{bar.qualityScore}</ScoreText>
          ) : (
            <span style={{ color: "#9ca3af", fontSize: "0.75rem" }}>—</span>
          )}
        </Td>
        <Td>
          {bar.performanceTier ? (
            <StatusBadge $status={bar.performanceTier}>{bar.performanceTier}</StatusBadge>
          ) : (
            <span style={{ color: "#9ca3af", fontSize: "0.75rem" }}>—</span>
          )}
        </Td>
        <Td>
          <StatusDropdown
            key={`qs-${bar.id}-${dataVersion}`}
            $status={bar.latestOutreach?.status ?? "NOT_CONTACTED"}
            defaultValue={bar.latestOutreach?.status ?? "NOT_CONTACTED"}
            disabled={isQuickSubmitting}
            onChange={(e) => {
              if (e.target.value !== (bar.latestOutreach?.status ?? "NOT_CONTACTED")) {
                onQuickStatusChange(bar.id, e.target.value);
              }
            }}
          >
            {LOG_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </StatusDropdown>
        </Td>
        <Td style={{ fontSize: "0.75rem" }}>
          {bar.latestOutreach ? (
            <>
              {formatDate(bar.latestOutreach.createdAt)}
              <span style={{ color: "#9ca3af" }}>
                {" "}
                · {METHOD_LABELS[bar.latestOutreach.method] || bar.latestOutreach.method}
              </span>
              {bar.latestOutreach.followUpAt &&
                isFollowUpOverdue(bar.latestOutreach.followUpAt) && (
                  <span
                    style={{
                      marginLeft: "0.375rem",
                      color: "#dc2626",
                      fontSize: "0.625rem",
                      fontWeight: 600,
                    }}
                  >
                    ⏰ Due
                  </span>
                )}
            </>
          ) : (
            <span style={{ color: "#9ca3af", fontSize: "0.75rem" }}>—</span>
          )}
        </Td>
        <Td>
          <ActionCell>
            <LogBtn onClick={onToggleLog}>{isExpanded ? "Cancel" : "+ Log"}</LogBtn>
            <ViewBtn onClick={onViewBar}>View</ViewBtn>
          </ActionCell>
        </Td>
      </Tr>

      {isExpanded && (
        <ExpandedRow>
          <ExpandedCell colSpan={8}>
            <InlineForm>
              <InlineField>
                <InlineLabel>Method</InlineLabel>
                <InlineSelect value={logMethod} onChange={(e) => onLogMethodChange(e.target.value)}>
                  {METHOD_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </InlineSelect>
              </InlineField>
              <InlineField>
                <InlineLabel>Status</InlineLabel>
                <InlineSelect value={logStatus} onChange={(e) => onLogStatusChange(e.target.value)}>
                  {LOG_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </InlineSelect>
              </InlineField>
              <InlineField>
                <InlineLabel>Notes</InlineLabel>
                <InlineTextarea
                  placeholder="What was discussed?"
                  value={logNotes}
                  onChange={(e) => onLogNotesChange(e.target.value)}
                />
              </InlineField>
              <InlineField>
                <InlineLabel>Follow-up</InlineLabel>
                <InlineInput
                  type="date"
                  value={logFollowUp}
                  onChange={(e) => onLogFollowUpChange(e.target.value)}
                />
              </InlineField>
              <InlineActions>
                <SubmitBtn onClick={onSubmit} disabled={submitting}>
                  {submitting ? "Saving..." : "Save"}
                </SubmitBtn>
                <CancelBtn onClick={onCancel}>Cancel</CancelBtn>
              </InlineActions>
            </InlineForm>
          </ExpandedCell>
        </ExpandedRow>
      )}
    </>
  );
};

// ============================================================================
// KANBAN LOG MODAL (fallback for kanban view)
// ============================================================================

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
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
  margin: 0 0 0.25rem;
  color: #1f2937;
`;

const ModalSubtitle = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0 0 1rem;
`;

const FormGroup = styled.div` margin-bottom: 1rem; `;
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
  &:focus { outline: none; border-color: #7c3aed; }
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
  &:focus { outline: none; border-color: #7c3aed; }
`;
const Input = styled.input`
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  &:focus { outline: none; border-color: #7c3aed; }
`;
const ModalButtons = styled.div`
  display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 0.5rem;
`;
const ModalButton = styled.button<{ $primary?: boolean }>`
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  ${({ $primary }) =>
    $primary
      ? "background: #7c3aed; color: white; &:hover { background: #6d28d9; }"
      : "background: #f3f4f6; color: #374151; &:hover { background: #e5e7eb; }"}
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

interface KanbanLogModalProps {
  bar: OutreachBar | undefined;
  method: string;
  status: string;
  notes: string;
  followUp: string;
  onMethodChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onFollowUpChange: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  submitting: boolean;
}

const KanbanLogModal = ({
  bar,
  method,
  status,
  notes,
  followUp,
  onMethodChange,
  onStatusChange,
  onNotesChange,
  onFollowUpChange,
  onSubmit,
  onClose,
  submitting,
}: KanbanLogModalProps) => {
  if (!bar) return null;

  return (
    <ModalOverlay onClick={() => !submitting && onClose()}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalTitle>Log Contact</ModalTitle>
        <ModalSubtitle>{bar.name} — {bar.cityName || "Unknown"}</ModalSubtitle>
        <FormGroup>
          <Label>Method</Label>
          <Select value={method} onChange={(e) => onMethodChange(e.target.value)}>
            {METHOD_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </Select>
        </FormGroup>
        <FormGroup>
          <Label>Status</Label>
          <Select value={status} onChange={(e) => onStatusChange(e.target.value)}>
            {LOG_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </Select>
        </FormGroup>
        <FormGroup>
          <Label>Notes</Label>
          <Textarea
            placeholder="What was discussed?"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
          />
        </FormGroup>
        <FormGroup>
          <Label>Follow-up Date (optional)</Label>
          <Input type="date" value={followUp} onChange={(e) => onFollowUpChange(e.target.value)} />
        </FormGroup>
        <ModalButtons>
          <ModalButton onClick={onClose} disabled={submitting}>Cancel</ModalButton>
          <ModalButton $primary onClick={onSubmit} disabled={submitting}>
            {submitting ? "Saving..." : "Log Contact"}
          </ModalButton>
        </ModalButtons>
      </ModalContent>
    </ModalOverlay>
  );
};

// ============================================================================
// HELPERS
// ============================================================================

function findBarInData(data: OutreachData | null, barId: string): OutreachBar | undefined {
  if (!data) return undefined;
  if (data.view === "table") {
    return (data as TableData).bars.find((b) => b.id === barId);
  }
  for (const col of (data as KanbanData).columns) {
    const found = col.bars.find((b) => b.id === barId);
    if (found) return found;
  }
  return undefined;
}

export default OutreachKanban;
