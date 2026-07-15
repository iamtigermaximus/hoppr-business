"use client";

import { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { SkeletonBox, SkeletonCard } from "@/components/ui/Skeleton";

// ---- Styled Components ----

const Container = styled.div`
  padding: 1.5rem;
  max-width: 1200px;
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
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const CreateButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s;
  text-decoration: none;

  &:hover {
    background: #6d28d9;
  }
`;

// Filter tabs
const FilterTabs = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #f3f4f6;
  padding-bottom: 0;
`;

const FilterTab = styled.button<{ $active: boolean }>`
  padding: 0.625rem 1.25rem;
  background: none;
  border: none;
  border-bottom: 2px solid
    ${({ $active }) => ($active ? "#7c3aed" : "transparent")};
  color: ${({ $active }) => ($active ? "#7c3aed" : "#6b7280")};
  font-size: 0.875rem;
  font-weight: ${({ $active }) => ($active ? "600" : "500")};
  cursor: pointer;
  margin-bottom: -2px;
  transition: all 0.2s;

  &:hover {
    color: #374151;
  }
`;

// Pass cards grid
const PassGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const PassCard = styled.div<{ $active: boolean }>`
  background: white;
  border-radius: 0.75rem;
  padding: 1.25rem;
  border: 1px solid ${({ $active }) => ($active ? "#e5e7eb" : "#f3f4f6")};
  opacity: ${({ $active }) => ($active ? 1 : 0.6)};
  transition: box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
`;

const PassHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
`;

const PassName = styled.div`
  font-size: 1.0625rem;
  font-weight: 700;
  color: #1f2937;
  flex: 1;
`;

const PassTypeBadge = styled.span`
  display: inline-block;
  padding: 0.1875rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.6875rem;
  font-weight: 600;
  background: #ede9fe;
  color: #7c3aed;
  white-space: nowrap;
  text-transform: capitalize;
`;

const PassPrice = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
`;

const PassMeta = styled.div`
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: #6b7280;
  flex-wrap: wrap;
`;

const ProgressBar = styled.div`
  height: 6px;
  background: #f3f4f6;
  border-radius: 3px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => Math.min($pct, 100)}%;
  background: ${({ $pct }) =>
    $pct >= 80 ? "#f59e0b" : $pct >= 100 ? "#dc2626" : "#7c3aed"};
  border-radius: 3px;
  transition: width 0.3s ease;
`;

const BenefitsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
`;

const BenefitTag = styled.span`
  padding: 0.1875rem 0.5rem;
  background: #f3f4f6;
  border-radius: 0.25rem;
  font-size: 0.6875rem;
  color: #374151;
`;

const PassActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
`;

const ActionButton = styled.button<{
  $variant: "outline" | "primary" | "danger";
}>`
  padding: 0.4375rem 0.875rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid
    ${({ $variant }) => ($variant === "danger" ? "#fecaca" : "#d1d5db")};
  background: ${({ $variant }) =>
    $variant === "primary" ? "#7c3aed" : "white"};
  color: ${({ $variant }) => {
    switch ($variant) {
      case "primary":
        return "white";
      case "danger":
        return "#dc2626";
      default:
        return "#374151";
    }
  }};

  &:hover {
    background: ${({ $variant }) => {
      switch ($variant) {
        case "primary":
          return "#6d28d9";
        case "danger":
          return "#fef2f2";
        default:
          return "#f3f4f6";
      }
    }};
  }
`;

// Modal
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

const Modal = styled.div`
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
`;

const ModalTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1.25rem 0;
`;

const FormGroup = styled.div`
  margin-bottom: 1.125rem;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  margin-bottom: 0.375rem;
  color: #374151;
  font-size: 0.8125rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #7c3aed;
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  min-height: 70px;
  resize: vertical;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #7c3aed;
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #7c3aed;
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1);
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
`;

const DayCheckGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const DayChip = styled.button<{ $selected: boolean }>`
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid ${({ $selected }) => ($selected ? "#7c3aed" : "#d1d5db")};
  background: ${({ $selected }) => ($selected ? "#ede9fe" : "white")};
  color: ${({ $selected }) => ($selected ? "#7c3aed" : "#6b7280")};
  transition: all 0.15s;

  &:hover {
    border-color: #7c3aed;
  }
`;

const InlineRow = styled.div`
  display: flex;
  gap: 0.75rem;

  @media (max-width: 480px) {
    flex-direction: column;
  }

  > * {
    flex: 1;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;

const ModalButton = styled.button<{
  $variant: "primary" | "outline" | "danger";
}>`
  padding: 0.625rem 1.25rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid
    ${({ $variant }) => ($variant === "outline" ? "#d1d5db" : "transparent")};
  background: ${({ $variant }) => {
    switch ($variant) {
      case "primary":
        return "#7c3aed";
      case "danger":
        return "#ef4444";
      default:
        return "white";
    }
  }};
  color: ${({ $variant }) => ($variant === "outline" ? "#374151" : "white")};

  &:hover {
    background: ${({ $variant }) => {
      switch ($variant) {
        case "primary":
          return "#6d28d9";
        case "danger":
          return "#dc2626";
        default:
          return "#f3f4f6";
      }
    }};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// Sales table
const SalesTable = styled.table`
  width: 100%;
  min-width: 480px;
  border-collapse: collapse;
  font-size: 0.8125rem;
  margin-bottom: 1rem;
`;

const SalesTh = styled.th`
  text-align: left;
  padding: 0.5rem 0.75rem;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e5e7eb;
`;

const SalesTd = styled.td`
  padding: 0.4375rem 0.75rem;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
`;

// Empty state
const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #9ca3af;
`;

const EmptyIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
`;

const EmptyText = styled.div`
  font-size: 0.9375rem;
  margin-bottom: 0.25rem;
`;

const EmptySubtext = styled.div`
  font-size: 0.8125rem;
`;

// Loading / Error
const LoadingOverlay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #6b7280;
  font-size: 1rem;
`;

const ErrorBox = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 1rem 1.25rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
`;

// ---- Types ----

type PassType =
  | "SKIP_LINE"
  | "COVER_INCLUDED"
  | "PREMIUM_ENTRY"
  | "DRINK_PACKAGE";
type RedemptionMode =
  | "SINGLE_USE"
  | "ONCE_PER_DAY"
  | "MULTI_USE"
  | "LIMITED_MULTI";

interface PassItem {
  id: string;
  name: string;
  description: string | null;
  type: PassType;
  priceCents: number;
  originalPriceCents: number | null;
  benefits: string[];
  skipLinePriority: boolean;
  coverFeeIncluded: boolean;
  coverFeeAmount: number;
  validityStart: string;
  validityEnd: string;
  validDays: string[];
  totalQuantity: number;
  soldCount: number;
  maxPerUser: number;
  redemptionMode: RedemptionMode;
  maxRedemptions: number | null;
  isActive: boolean;
  createdAt: string;
}

interface Purchaser {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  purchasePriceCents: number;
  status: string;
  scannedAt: string | null;
  purchasedAt: string;
  expiresAt: string;
}

interface PassDetail extends PassItem {
  revenueCents: number;
  purchasers: Purchaser[];
}

interface PassFormData {
  name: string;
  description: string;
  type: PassType;
  priceEuros: string;
  originalPriceEuros: string;
  benefits: string[];
  skipLinePriority: boolean;
  coverFeeIncluded: boolean;
  coverFeeAmount: string;
  validityStart: string;
  validityEnd: string;
  validDays: string[];
  totalQuantity: string;
  maxPerUser: string;
  redemptionMode: RedemptionMode;
  maxRedemptions: string;
}

const PASS_TYPE_LABELS: Record<PassType, string> = {
  SKIP_LINE: "Skip Line",
  COVER_INCLUDED: "Cover Included",
  PREMIUM_ENTRY: "Premium Entry",
  DRINK_PACKAGE: "Drink Package",
};

const ALL_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// ---- Helpers ----

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatEuro(cents: number): string {
  return (cents / 100).toFixed(2);
}

// ---- Component ----

interface PassManagerProps {
  barId: string;
  userRole: string;
}

const PassManager = ({ barId, userRole }: PassManagerProps) => {
  const [passes, setPasses] = useState<PassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("active");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });

  // Form modal
  const [showForm, setShowForm] = useState(false);
  const [editingPass, setEditingPass] = useState<PassDetail | null>(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = (): PassFormData => {
    const now = new Date();
    const later = new Date();
    later.setMonth(later.getMonth() + 3);
    return {
      name: "",
      description: "",
      type: "SKIP_LINE",
      priceEuros: "",
      originalPriceEuros: "",
      benefits: [],
      skipLinePriority: true,
      coverFeeIncluded: false,
      coverFeeAmount: "0",
      validityStart: toDatetimeLocal(now.toISOString()),
      validityEnd: toDatetimeLocal(later.toISOString()),
      validDays: [...ALL_DAYS],
      totalQuantity: "100",
      maxPerUser: "1",
      redemptionMode: "SINGLE_USE",
      maxRedemptions: "1",
    };
  };

  const [formData, setFormData] = useState<PassFormData>(emptyForm());
  const [benefitInput, setBenefitInput] = useState("");

  // Sales modal
  const [showSales, setShowSales] = useState(false);
  const [salesData, setSalesData] = useState<PassDetail | null>(null);
  const [salesLoading, setSalesLoading] = useState(false);

  // Deactivate confirm
  const [deactivateTarget, setDeactivateTarget] = useState<PassItem | null>(
    null,
  );
  const [deactivating, setDeactivating] = useState(false);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("hoppr_token") : null;

  const fetchPasses = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("status", filter);
      if (search) params.set("search", search);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      params.set("page", String(page));
      params.set("limit", "12");

      const res = await fetch(
        `/api/auth/bar/${barId}/passes?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data = await res.json();
      setPasses(data.passes || []);
      if (data.pagination) setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load passes");
    } finally {
      setLoading(false);
    }
  }, [barId, filter, search, sortBy, sortOrder, page, token]);

  useEffect(() => {
    fetchPasses();
  }, [fetchPasses]);

  const handleCreate = () => {
    setEditingPass(null);
    setFormData(emptyForm());
    setShowForm(true);
  };

  const handleEdit = async (pass: PassItem) => {
    if (!token) return;
    setError(null);
    try {
      const res = await fetch(`/api/auth/bar/${barId}/passes/${pass.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data = await res.json();
      const detail = data.pass as PassDetail;
      setEditingPass(detail);

      setFormData({
        name: detail.name,
        description: detail.description || "",
        type: detail.type,
        priceEuros: (detail.priceCents / 100).toFixed(2),
        originalPriceEuros: detail.originalPriceCents
          ? (detail.originalPriceCents / 100).toFixed(2)
          : "",
        benefits: detail.benefits || [],
        skipLinePriority: detail.skipLinePriority,
        coverFeeIncluded: detail.coverFeeIncluded,
        coverFeeAmount: detail.coverFeeAmount.toString(),
        validityStart: toDatetimeLocal(detail.validityStart),
        validityEnd: toDatetimeLocal(detail.validityEnd),
        validDays: detail.validDays || [],
        totalQuantity: detail.totalQuantity.toString(),
        maxPerUser: detail.maxPerUser.toString(),
        redemptionMode: detail.redemptionMode || "SINGLE_USE",
        maxRedemptions: detail.maxRedemptions?.toString() || "1",
      });
      setShowForm(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pass");
    }
  };

  const handleSave = async () => {
    if (
      !token ||
      !formData.name.trim() ||
      !formData.priceEuros ||
      !formData.validityStart ||
      !formData.validityEnd ||
      !formData.totalQuantity
    )
      return;
    setSaving(true);
    setError(null);

    const priceCents = Math.round(parseFloat(formData.priceEuros) * 100);
    if (isNaN(priceCents) || priceCents <= 0) {
      setError("Price must be a positive number");
      setSaving(false);
      return;
    }

    const body: Record<string, unknown> = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      type: formData.type,
      priceCents,
      originalPriceCents: formData.originalPriceEuros
        ? Math.round(parseFloat(formData.originalPriceEuros) * 100)
        : null,
      benefits: formData.benefits,
      skipLinePriority: formData.skipLinePriority,
      coverFeeIncluded: formData.coverFeeIncluded,
      coverFeeAmount: parseInt(formData.coverFeeAmount, 10) || 0,
      validityStart: new Date(formData.validityStart).toISOString(),
      validityEnd: new Date(formData.validityEnd).toISOString(),
      validDays: formData.validDays,
      totalQuantity: parseInt(formData.totalQuantity, 10),
      maxPerUser: parseInt(formData.maxPerUser, 10) || 1,
      redemptionMode: formData.redemptionMode,
      maxRedemptions:
        formData.redemptionMode === "LIMITED_MULTI"
          ? parseInt(formData.maxRedemptions, 10) || null
          : null,
    };

    try {
      let res: Response;
      if (editingPass) {
        res = await fetch(`/api/auth/bar/${barId}/passes/${editingPass.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`/api/auth/bar/${barId}/passes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `Failed: ${res.status}`);
      }

      setShowForm(false);
      fetchPasses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save pass");
    } finally {
      setSaving(false);
    }
  };

  const handleViewSales = async (pass: PassItem) => {
    if (!token) return;
    setShowSales(true);
    setSalesLoading(true);
    try {
      const res = await fetch(`/api/auth/bar/${barId}/passes/${pass.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data = await res.json();
      setSalesData(data.pass as PassDetail);
    } catch {
      setSalesData(null);
    } finally {
      setSalesLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!token || !deactivateTarget) return;
    setDeactivating(true);
    try {
      const res = await fetch(
        `/api/auth/bar/${barId}/passes/${deactivateTarget.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      setDeactivateTarget(null);
      fetchPasses();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to deactivate pass",
      );
    } finally {
      setDeactivating(false);
    }
  };

  const addBenefit = () => {
    const trimmed = benefitInput.trim();
    if (trimmed && !formData.benefits.includes(trimmed)) {
      setFormData({ ...formData, benefits: [...formData.benefits, trimmed] });
    }
    setBenefitInput("");
  };

  const removeBenefit = (idx: number) => {
    setFormData({
      ...formData,
      benefits: formData.benefits.filter((_, i) => i !== idx),
    });
  };

  const toggleDay = (day: string) => {
    setFormData({
      ...formData,
      validDays: formData.validDays.includes(day)
        ? formData.validDays.filter((d) => d !== day)
        : [...formData.validDays, day],
    });
  };

  const canManage = userRole === "OWNER" || userRole === "MANAGER";

  return (
    <Container>
      <Header>
        <Title>VIP Passes</Title>
        {canManage && (
          <CreateButton as="a" href={`/bar/${barId}/create`}>
            Create Pass
          </CreateButton>
        )}
      </Header>

      <FilterTabs>
        {(["active", "inactive", "all"] as const).map((f) => (
          <FilterTab
            key={f}
            $active={filter === f}
            onClick={() => {
              setFilter(f);
              setPage(1);
            }}
          >
            {f === "active"
              ? "Active"
              : f === "inactive"
                ? "Inactive"
                : "All Passes"}
          </FilterTab>
        ))}
      </FilterTabs>

      {/* Toolbar: search + sort */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Search passes..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{
            flex: 1,
            minWidth: "200px",
            padding: "0.5rem 0.75rem",
            border: "1px solid #d1d5db",
            borderRadius: "0.375rem",
            fontSize: "0.8125rem",
          }}
        />
        <button
          onClick={() => {
            setSortBy("name");
            setSortOrder(
              sortBy === "name" && sortOrder === "desc" ? "asc" : "desc",
            );
            setPage(1);
          }}
          style={{
            padding: "0.5rem 0.75rem",
            border: `1px solid ${sortBy === "name" ? "#7c3aed" : "#d1d5db"}`,
            borderRadius: "0.375rem",
            background: sortBy === "name" ? "#f5f3ff" : "white",
            color: sortBy === "name" ? "#7c3aed" : "#6b7280",
            fontSize: "0.75rem",
            cursor: "pointer",
          }}
        >
          Name {sortBy === "name" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
        </button>
        <button
          onClick={() => {
            setSortBy("priceCents");
            setSortOrder(
              sortBy === "priceCents" && sortOrder === "asc" ? "desc" : "asc",
            );
            setPage(1);
          }}
          style={{
            padding: "0.5rem 0.75rem",
            border: `1px solid ${sortBy === "priceCents" ? "#7c3aed" : "#d1d5db"}`,
            borderRadius: "0.375rem",
            background: sortBy === "priceCents" ? "#f5f3ff" : "white",
            color: sortBy === "priceCents" ? "#7c3aed" : "#6b7280",
            fontSize: "0.75rem",
            cursor: "pointer",
          }}
        >
          Price{" "}
          {sortBy === "priceCents" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
        </button>
        <button
          onClick={() => {
            setSortBy("soldCount");
            setSortOrder(
              sortBy === "soldCount" && sortOrder === "desc" ? "asc" : "desc",
            );
            setPage(1);
          }}
          style={{
            padding: "0.5rem 0.75rem",
            border: `1px solid ${sortBy === "soldCount" ? "#7c3aed" : "#d1d5db"}`,
            borderRadius: "0.375rem",
            background: sortBy === "soldCount" ? "#f5f3ff" : "white",
            color: sortBy === "soldCount" ? "#7c3aed" : "#6b7280",
            fontSize: "0.75rem",
            cursor: "pointer",
          }}
        >
          Sold{" "}
          {sortBy === "soldCount" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
        </button>
      </div>

      {error && (
        <ErrorBox>
          {error}
          <button
            onClick={fetchPasses}
            style={{
              marginLeft: "1rem",
              background: "none",
              border: "none",
              color: "#dc2626",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Retry
          </button>
        </ErrorBox>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i}>
                <SkeletonBox $width="50%" $height="0.75rem" />
                <SkeletonBox $width="80%" $height="1rem" />
                <SkeletonBox $width="100%" $height="3rem" $radius="0.375rem" />
              </SkeletonCard>
            ))}
          </div>
        </div>
      ) : passes.length === 0 ? (
        <EmptyState>
          <EmptyIcon>🎟️</EmptyIcon>
          <EmptyText>
            No {filter !== "all" ? filter : ""} VIP passes yet
          </EmptyText>
          <EmptySubtext>
            {canManage
              ? "Create your first VIP pass to start selling"
              : "Check back when passes are available"}
          </EmptySubtext>
        </EmptyState>
      ) : (
        <PassGrid>
          {passes.map((pass) => {
            const soldPct =
              pass.totalQuantity > 0
                ? (pass.soldCount / pass.totalQuantity) * 100
                : 0;
            return (
              <PassCard key={pass.id} $active={pass.isActive}>
                <PassHeader>
                  <PassName>{pass.name}</PassName>
                  <PassTypeBadge>{PASS_TYPE_LABELS[pass.type]}</PassTypeBadge>
                </PassHeader>

                <PassPrice>
                  €{formatEuro(pass.priceCents)}
                  {pass.originalPriceCents &&
                    pass.originalPriceCents > pass.priceCents && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#9ca3af",
                          textDecoration: "line-through",
                          marginLeft: "0.5rem",
                          fontWeight: 400,
                        }}
                      >
                        €{formatEuro(pass.originalPriceCents)}
                      </span>
                    )}
                </PassPrice>

                <div>
                  <ProgressBar>
                    <ProgressFill $pct={soldPct} />
                  </ProgressBar>
                  <PassMeta style={{ marginTop: "0.375rem" }}>
                    <span>
                      {pass.soldCount} / {pass.totalQuantity} sold
                    </span>
                    <span>{Math.round(soldPct)}%</span>
                  </PassMeta>
                </div>

                {pass.benefits.length > 0 && (
                  <BenefitsList>
                    {pass.benefits.map((b, i) => (
                      <BenefitTag key={i}>{b}</BenefitTag>
                    ))}
                  </BenefitsList>
                )}

                <PassMeta>
                  <span>
                    Valid: {formatDate(pass.validityStart)} –{" "}
                    {formatDate(pass.validityEnd)}
                  </span>
                  <span>Max {pass.maxPerUser}/person</span>
                  <span>
                    {pass.redemptionMode === "SINGLE_USE"
                      ? "🔹 Single Use"
                      : pass.redemptionMode === "ONCE_PER_DAY"
                        ? "🔸 Once/Day"
                        : pass.redemptionMode === "MULTI_USE"
                          ? "🟢 Unlimited"
                          : pass.redemptionMode === "LIMITED_MULTI"
                            ? `🔺 ${pass.maxRedemptions || "?"} uses`
                            : ""}
                  </span>
                </PassMeta>

                <PassActions>
                  <ActionButton
                    $variant="outline"
                    as="a"
                    href={`/bar/${barId}/create?type=pass&resurface=${pass.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    📋 Duplicate
                  </ActionButton>
                  <ActionButton
                    $variant="outline"
                    onClick={() => handleViewSales(pass)}
                  >
                    Sales ({pass.soldCount})
                  </ActionButton>
                  {canManage && (
                    <>
                      <ActionButton
                        $variant="outline"
                        onClick={() => handleEdit(pass)}
                      >
                        Edit
                      </ActionButton>
                      {pass.isActive && (
                        <ActionButton
                          $variant="danger"
                          onClick={() => setDeactivateTarget(pass)}
                        >
                          Deactivate
                        </ActionButton>
                      )}
                    </>
                  )}
                </PassActions>
              </PassCard>
            );
          })}
        </PassGrid>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "1rem",
            fontSize: "0.8125rem",
            color: "#6b7280",
          }}
        >
          <span>
            Showing {(pagination.page - 1) * pagination.limit + 1}
            &ndash;
            {Math.min(
              pagination.page * pagination.limit,
              pagination.total,
            )} of {pagination.total} passes
          </span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              style={{
                padding: "0.375rem 0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.375rem",
                background: "white",
                cursor: page <= 1 ? "not-allowed" : "pointer",
                opacity: page <= 1 ? 0.5 : 1,
              }}
            >
              Previous
            </button>
            <button
              disabled={page >= pagination.pages}
              onClick={() => setPage(page + 1)}
              style={{
                padding: "0.375rem 0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.375rem",
                background: "white",
                cursor: page >= pagination.pages ? "not-allowed" : "pointer",
                opacity: page >= pagination.pages ? 0.5 : 1,
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showForm && (
        <ModalOverlay onClick={() => setShowForm(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalTitle>
              {editingPass ? "Edit Pass" : "Create VIP Pass"}
            </ModalTitle>

            <FormGroup>
              <Label>Pass Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder='e.g. "VIP Skip Line"'
              />
            </FormGroup>

            <FormGroup>
              <Label>Description</Label>
              <TextArea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="What does this pass include?"
              />
            </FormGroup>

            <FormGroup>
              <Label>Pass Type *</Label>
              <Select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as PassType })
                }
              >
                {Object.entries(PASS_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <InlineRow>
              <FormGroup>
                <Label>Price (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.priceEuros}
                  onChange={(e) =>
                    setFormData({ ...formData, priceEuros: e.target.value })
                  }
                  placeholder="9.99"
                />
              </FormGroup>
              <FormGroup>
                <Label>Original Price (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.originalPriceEuros}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      originalPriceEuros: e.target.value,
                    })
                  }
                  placeholder="19.99 (for strikethrough)"
                />
              </FormGroup>
            </InlineRow>

            <FormGroup>
              <Label>Benefits</Label>
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  marginBottom: "0.5rem",
                }}
              >
                <Input
                  value={benefitInput}
                  onChange={(e) => setBenefitInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addBenefit();
                    }
                  }}
                  placeholder='e.g. "Free welcome drink"'
                />
                <ModalButton
                  $variant="outline"
                  onClick={addBenefit}
                  style={{ flexShrink: 0 }}
                >
                  Add
                </ModalButton>
              </div>
              {formData.benefits.length > 0 && (
                <BenefitsList>
                  {formData.benefits.map((b, i) => (
                    <BenefitTag
                      key={i}
                      style={{ cursor: "pointer" }}
                      onClick={() => removeBenefit(i)}
                    >
                      {b} ✕
                    </BenefitTag>
                  ))}
                </BenefitsList>
              )}
            </FormGroup>

            <InlineRow>
              <FormGroup>
                <Label>Valid From *</Label>
                <Input
                  type="datetime-local"
                  value={formData.validityStart}
                  onChange={(e) =>
                    setFormData({ ...formData, validityStart: e.target.value })
                  }
                />
              </FormGroup>
              <FormGroup>
                <Label>Valid Until *</Label>
                <Input
                  type="datetime-local"
                  value={formData.validityEnd}
                  onChange={(e) =>
                    setFormData({ ...formData, validityEnd: e.target.value })
                  }
                />
              </FormGroup>
            </InlineRow>

            <FormGroup>
              <Label>Valid Days</Label>
              <DayCheckGrid>
                {ALL_DAYS.map((day) => (
                  <DayChip
                    key={day}
                    $selected={formData.validDays.includes(day)}
                    onClick={() => toggleDay(day)}
                    type="button"
                  >
                    {day.slice(0, 3)}
                  </DayChip>
                ))}
              </DayCheckGrid>
            </FormGroup>

            <InlineRow>
              <FormGroup>
                <Label>Total Quantity *</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.totalQuantity}
                  onChange={(e) =>
                    setFormData({ ...formData, totalQuantity: e.target.value })
                  }
                />
              </FormGroup>
              <FormGroup>
                <Label>Max Per User</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.maxPerUser}
                  onChange={(e) =>
                    setFormData({ ...formData, maxPerUser: e.target.value })
                  }
                />
              </FormGroup>
            </InlineRow>

            <FormGroup>
              <Label>Redemption Mode</Label>
              <Select
                value={formData.redemptionMode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    redemptionMode: e.target.value as RedemptionMode,
                  })
                }
              >
                <option value="SINGLE_USE">
                  Single Use — scan once, then consumed
                </option>
                <option value="ONCE_PER_DAY">
                  Once Per Day — reset each calendar day
                </option>
                <option value="MULTI_USE">
                  Multi Use — unlimited redemptions
                </option>
                <option value="LIMITED_MULTI">
                  Limited Multi — up to N total redemptions
                </option>
              </Select>
            </FormGroup>

            {formData.redemptionMode === "LIMITED_MULTI" && (
              <FormGroup>
                <Label>Max Redemptions</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.maxRedemptions}
                  onChange={(e) =>
                    setFormData({ ...formData, maxRedemptions: e.target.value })
                  }
                  placeholder="e.g. 5"
                />
              </FormGroup>
            )}

            <FormGroup>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={formData.skipLinePriority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      skipLinePriority: e.target.checked,
                    })
                  }
                />
                Skip Line Priority
              </CheckboxLabel>
            </FormGroup>

            <FormGroup>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={formData.coverFeeIncluded}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      coverFeeIncluded: e.target.checked,
                    })
                  }
                />
                Cover Fee Included
              </CheckboxLabel>
              {formData.coverFeeIncluded && (
                <Input
                  type="number"
                  min="0"
                  value={formData.coverFeeAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, coverFeeAmount: e.target.value })
                  }
                  placeholder="Cover fee amount"
                  style={{ marginTop: "0.5rem", maxWidth: "200px" }}
                />
              )}
            </FormGroup>

            <ButtonRow>
              <ModalButton
                $variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </ModalButton>
              <ModalButton
                $variant="primary"
                onClick={handleSave}
                disabled={
                  saving ||
                  !formData.name.trim() ||
                  !formData.priceEuros ||
                  !formData.validityStart ||
                  !formData.validityEnd ||
                  !formData.totalQuantity
                }
              >
                {saving
                  ? "Saving..."
                  : editingPass
                    ? "Save Changes"
                    : "Create Pass"}
              </ModalButton>
            </ButtonRow>
          </Modal>
        </ModalOverlay>
      )}

      {/* Sales Modal */}
      {showSales && (
        <ModalOverlay onClick={() => setShowSales(false)}>
          <Modal
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "640px" }}
          >
            <ModalTitle>
              {salesData ? `Sales — ${salesData.name}` : "Sales Data"}
            </ModalTitle>

            {salesLoading ? (
              <LoadingOverlay>Loading sales data...</LoadingOverlay>
            ) : !salesData ? (
              <EmptyState>
                <EmptyText>Failed to load sales data</EmptyText>
              </EmptyState>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    gap: "1.5rem",
                    marginBottom: "1rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#6b7280",
                        textTransform: "uppercase",
                      }}
                    >
                      Revenue
                    </div>
                    <div
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        color: "#1f2937",
                      }}
                    >
                      €{formatEuro(salesData.revenueCents)}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#6b7280",
                        textTransform: "uppercase",
                      }}
                    >
                      Sold
                    </div>
                    <div
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        color: "#1f2937",
                      }}
                    >
                      {salesData.soldCount} / {salesData.totalQuantity}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#6b7280",
                        textTransform: "uppercase",
                      }}
                    >
                      Remaining
                    </div>
                    <div
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        color: "#1f2937",
                      }}
                    >
                      {salesData.totalQuantity - salesData.soldCount}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: "0.5rem",
                  }}
                >
                  Recent Purchasers ({salesData.purchasers.length})
                </div>

                {salesData.purchasers.length === 0 ? (
                  <div
                    style={{
                      color: "#9ca3af",
                      fontSize: "0.875rem",
                      padding: "1rem 0",
                    }}
                  >
                    No purchases yet
                  </div>
                ) : (
                  <div style={{ maxHeight: "300px", overflow: "auto" }}>
                    <SalesTable>
                      <thead>
                        <tr>
                          <SalesTh>Customer</SalesTh>
                          <SalesTh>Email</SalesTh>
                          <SalesTh>Price</SalesTh>
                          <SalesTh>Status</SalesTh>
                          <SalesTh>Purchased</SalesTh>
                        </tr>
                      </thead>
                      <tbody>
                        {salesData.purchasers.map((p) => (
                          <tr key={p.id}>
                            <SalesTd style={{ fontWeight: 500 }}>
                              {p.userName}
                            </SalesTd>
                            <SalesTd
                              style={{ fontSize: "0.75rem", color: "#6b7280" }}
                            >
                              {p.userEmail}
                            </SalesTd>
                            <SalesTd style={{ fontWeight: 600 }}>
                              €{formatEuro(p.purchasePriceCents)}
                            </SalesTd>
                            <SalesTd>
                              <span
                                style={{
                                  padding: "0.125rem 0.5rem",
                                  borderRadius: "0.25rem",
                                  fontSize: "0.6875rem",
                                  fontWeight: 600,
                                  background:
                                    p.status === "ACTIVE"
                                      ? "#dcfce7"
                                      : p.status === "USED"
                                        ? "#f3f4f6"
                                        : "#fef2f2",
                                  color:
                                    p.status === "ACTIVE"
                                      ? "#166534"
                                      : p.status === "USED"
                                        ? "#6b7280"
                                        : "#dc2626",
                                }}
                              >
                                {p.status}
                              </span>
                            </SalesTd>
                            <SalesTd
                              style={{ fontSize: "0.75rem", color: "#6b7280" }}
                            >
                              {formatDate(p.purchasedAt)}
                            </SalesTd>
                          </tr>
                        ))}
                      </tbody>
                    </SalesTable>
                  </div>
                )}
              </>
            )}

            <ButtonRow>
              <ModalButton
                $variant="outline"
                onClick={() => setShowSales(false)}
              >
                Close
              </ModalButton>
            </ButtonRow>
          </Modal>
        </ModalOverlay>
      )}

      {/* Deactivate Confirmation */}
      {deactivateTarget && (
        <ModalOverlay onClick={() => setDeactivateTarget(null)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Deactivate Pass</ModalTitle>
            <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
              Deactivate{" "}
              <strong style={{ color: "#1f2937" }}>
                {deactivateTarget.name}
              </strong>
              ? Existing purchased passes will still be valid. This stops new
              sales.
            </p>
            <ButtonRow>
              <ModalButton
                $variant="outline"
                onClick={() => setDeactivateTarget(null)}
              >
                Keep Active
              </ModalButton>
              <ModalButton
                $variant="danger"
                onClick={handleDeactivate}
                disabled={deactivating}
              >
                {deactivating ? "Deactivating..." : "Yes, Deactivate"}
              </ModalButton>
            </ButtonRow>
          </Modal>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default PassManager;
