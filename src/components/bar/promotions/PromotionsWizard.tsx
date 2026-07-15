"use client";

import AIPromotionGenerator from "@/components/promotions/AIPromotionGenerator";
import { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { SkeletonBox, SkeletonCard } from "@/components/ui/Skeleton";
import ComplianceIndicator from "@/components/shared/ComplianceIndicator";

// Styled Components with Responsive Design
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

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #1f2937;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }

  @media (max-width: 480px) {
    font-size: 1.25rem;
  }
`;

const Subtitle = styled.p`
  color: #6b7280;
  margin-bottom: 2rem;
  font-size: 1.125rem;

  @media (max-width: 768px) {
    font-size: 1rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 480px) {
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: 1px solid #d1d5db;
  color: #6b7280;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  margin-bottom: 1.5rem;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
  }

  @media (max-width: 480px) {
    width: 100%;
    justify-content: center;
    padding: 0.75rem;
  }
`;

const ModeSelector = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    gap: 1rem;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const ModeCard = styled.div<{ $selected: boolean }>`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  border: 2px solid ${(props) => (props.$selected ? "#3b82f6" : "#e5e7eb")};
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;

  &:hover {
    border-color: #3b82f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  }

  @media (max-width: 768px) {
    padding: 1.5rem;
  }

  @media (max-width: 480px) {
    padding: 1.25rem;
  }
`;

const ModeIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }

  @media (max-width: 480px) {
    font-size: 2rem;
  }
`;

const ModeTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1f2937;

  @media (max-width: 768px) {
    font-size: 1.25rem;
  }

  @media (max-width: 480px) {
    font-size: 1.125rem;
  }
`;

const ModeDescription = styled.p`
  color: #6b7280;
  margin-bottom: 1rem;
  line-height: 1.5;

  @media (max-width: 768px) {
    font-size: 0.875rem;
  }
`;

const AITag = styled.span`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
  margin-bottom: 0.5rem;
`;

const ModeFeatures = styled.div`
  font-size: 0.875rem;
  line-height: 1.6;
  color: #6b7280;

  @media (max-width: 480px) {
    font-size: 0.75rem;
  }
`;

const WizardContainer = styled.div`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  overflow: hidden;
`;

const WizardHeader = styled.div`
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  background: #f8f9fa;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const WizardStep = styled.div<{ $active: boolean; $completed: boolean }>`
  flex: 1;
  padding: 1rem;
  text-align: center;
  font-weight: 600;
  cursor: pointer;
  background: ${(props) =>
    props.$active ? "#3b82f6" : props.$completed ? "#10b981" : "#f8f9fa"};
  color: ${(props) =>
    props.$active || props.$completed ? "white" : "#6b7280"};
  transition: all 0.2s;

  @media (max-width: 640px) {
    padding: 0.75rem;
    font-size: 0.875rem;
  }
`;

const WizardContent = styled.div`
  padding: 2rem;
  min-height: 500px;

  @media (max-width: 768px) {
    padding: 1.5rem;
    min-height: 400px;
  }

  @media (max-width: 480px) {
    padding: 1rem;
    min-height: 350px;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;

  @media (max-width: 480px) {
    margin-bottom: 1rem;
  }
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #374151;
  font-size: 0.875rem;

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }

  @media (max-width: 480px) {
    padding: 0.625rem;
    font-size: 16px;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }

  @media (max-width: 480px) {
    padding: 0.625rem;
    min-height: 80px;
    font-size: 16px;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  background: white;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }

  @media (max-width: 480px) {
    padding: 0.625rem;
    font-size: 16px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
  gap: 1rem;

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 0.75rem;
  }
`;

const Button = styled.button<{
  $variant: "primary" | "secondary" | "outline" | "danger";
}>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  flex: 1;
  transition: all 0.2s;
  text-align: center;
  min-height: 44px;
  font-size: 0.875rem;

  ${(props) =>
    props.$variant === "primary"
      ? `
    background: #3b82f6;
    color: white;
    &:hover:not(:disabled) { background: #2563eb; }
  `
      : props.$variant === "secondary"
        ? `
    background: #10b981;
    color: white;
    &:hover:not(:disabled) { background: #059669; }
  `
        : props.$variant === "danger"
          ? `
    background: #ef4444;
    color: white;
    &:hover:not(:disabled) { background: #dc2626; }
  `
          : `
    background: transparent;
    color: #6b7280;
    border: 1px solid #d1d5db;
    &:hover:not(:disabled) { background: #f3f4f6; }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 640px) {
    padding: 0.875rem;
  }
`;

const PreviewCard = styled.div`
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  margin-top: 1rem;

  @media (max-width: 480px) {
    padding: 1rem;
  }
`;

const PreviewTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1f2937;

  @media (max-width: 480px) {
    font-size: 1.125rem;
  }
`;

const PreviewDescription = styled.p`
  color: #6b7280;
  margin-bottom: 1rem;
  line-height: 1.5;

  @media (max-width: 480px) {
    font-size: 0.875rem;
  }
`;

const PreviewDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1rem;

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
`;

const PreviewDetail = styled.div`
  text-align: center;
  padding: 0.75rem;
  background: white;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;

  @media (max-width: 480px) {
    padding: 0.5rem;
    font-size: 0.75rem;
  }
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  color: #dc2626;
  font-size: 0.875rem;

  @media (max-width: 480px) {
    padding: 0.75rem;
    font-size: 0.8rem;
  }
`;

const SuccessMessage = styled.div`
  background: #dcfce7;
  border: 1px solid #bbf7d0;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  color: #166534;
  font-size: 0.875rem;

  @media (max-width: 480px) {
    padding: 0.75rem;
    font-size: 0.8rem;
  }
`;

// Modal Components
const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${(props) => (props.$isOpen ? "flex" : "none")};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 1rem;
  width: 90%;
  max-width: 450px;
  overflow: hidden;
  animation: modalSlideIn 0.2s ease-out;

  @keyframes modalSlideIn {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @media (max-width: 480px) {
    width: 95%;
    margin: 1rem;
  }
`;

const ModalHeader = styled.div<{ $type: "warning" | "success" | "info" }>`
  padding: 1.5rem 1.5rem 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: ${(props) =>
    props.$type === "warning"
      ? "#fef3c7"
      : props.$type === "success"
        ? "#dcfce7"
        : "#eff6ff"};
`;

const ModalIcon = styled.div`
  font-size: 3rem;
  text-align: center;
  margin-bottom: 0.5rem;
`;

const ModalTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  text-align: center;
  color: #1f2937;
  margin: 0;
`;

const ModalBody = styled.div`
  padding: 1.5rem;
  text-align: center;
  color: #6b7280;
  line-height: 1.5;
`;

const ModalFooter = styled.div`
  padding: 1rem 1.5rem 1.5rem 1.5rem;
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const ModalButton = styled.button<{
  $variant: "confirm" | "cancel" | "approve";
}>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  min-height: 44px;

  ${(props) =>
    props.$variant === "confirm"
      ? `
    background: #ef4444;
    color: white;
    &:hover { background: #dc2626; }
  `
      : props.$variant === "approve"
        ? `
    background: #10b981;
    color: white;
    &:hover { background: #059669; }
  `
        : `
    background: #f3f4f6;
    color: #6b7280;
    border: 1px solid #e5e7eb;
    &:hover { background: #e5e7eb; }
  `}
`;

// Promotions List Styles
const PromotionsSection = styled.div`
  @media (max-width: 768px) {
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;

  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

// Tab Styles
const TabsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #f3f4f6;
  padding-bottom: 0;
  overflow-x: auto;

  @media (max-width: 640px) {
    gap: 0.25rem;
  }
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 0.625rem 1.25rem;
  background: none;
  border: none;
  border-bottom: 2px solid
    ${(props) => (props.$active ? "#7c3aed" : "transparent")};
  color: ${(props) => (props.$active ? "#7c3aed" : "#6b7280")};
  font-size: 0.875rem;
  font-weight: ${(props) => (props.$active ? "600" : "500")};
  cursor: pointer;
  margin-bottom: -1px;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    color: #7c3aed;
  }

  @media (max-width: 640px) {
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
  }
`;

const TabCount = styled.span<{ $color: string }>`
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.125rem 0.5rem;
  border-radius: 1rem;
  background: ${(props) =>
    props.$color === "orange"
      ? "#fef3c7"
      : props.$color === "green"
        ? "#dcfce7"
        : props.$color === "red"
          ? "#fee2e2"
          : "#f3f4f6"};
  color: ${(props) =>
    props.$color === "orange"
      ? "#92400e"
      : props.$color === "green"
        ? "#166534"
        : props.$color === "red"
          ? "#dc2626"
          : "#6b7280"};
  font-size: 0.7rem;
  font-weight: 600;
`;

const PromotionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1rem;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const CardThumbnail = styled.div`
  width: 100%;
  height: 160px;
  border-radius: 0.5rem;
  overflow: hidden;
  margin-bottom: 0.75rem;
  background: #f3f4f6;
`;

const PromotionCard = styled.div<{ $status: string }>`
  background: white;
  padding: 1.25rem;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  border-left: 4px solid
    ${(props) =>
      props.$status === "active"
        ? "#10b981"
        : props.$status === "pending"
          ? "#f59e0b"
          : props.$status === "expired"
            ? "#ef4444"
            : "#6b7280"};
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 280px;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  @media (max-width: 480px) {
    padding: 1rem;
    min-height: 260px;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const PromotionTitle = styled.h4`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  flex: 1;

  @media (max-width: 480px) {
    font-size: 1rem;
  }
`;

const StatusBadge = styled.span<{ $status: string }>`
  font-size: 0.7rem;
  padding: 0.25rem 0.6rem;
  border-radius: 1rem;
  background: ${(props) =>
    props.$status === "active"
      ? "#dcfce7"
      : props.$status === "pending"
        ? "#fef3c7"
        : props.$status === "expired"
          ? "#fee2e2"
          : "#f3f4f6"};
  color: ${(props) =>
    props.$status === "active"
      ? "#166534"
      : props.$status === "pending"
        ? "#92400e"
        : props.$status === "expired"
          ? "#dc2626"
          : "#6b7280"};
  white-space: nowrap;
  flex-shrink: 0;
`;

const PromotionDescription = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.75rem;
  line-height: 1.4;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;

  @media (max-width: 480px) {
    font-size: 0.8rem;
    -webkit-line-clamp: 2;
  }
`;

const PromotionMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  font-size: 0.75rem;
  color: #9ca3af;

  @media (max-width: 480px) {
    gap: 0.5rem;
    font-size: 0.7rem;
  }
`;

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const DiscountBadge = styled.div`
  display: inline-block;
  background: #10b981;
  color: white;
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 0.25rem;
  margin-top: 0.5rem;
  align-self: flex-start;
`;

const StatsRow = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
  font-size: 0.7rem;
  color: #6b7280;
  justify-content: space-around;

  @media (max-width: 480px) {
    gap: 0.75rem;
    font-size: 0.65rem;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  background: #f9fafb;
  border-radius: 0.75rem;
  color: #6b7280;

  @media (max-width: 768px) {
    padding: 2rem 1.5rem;
  }

  @media (max-width: 480px) {
    padding: 1.5rem 1rem;
  }
`;

const EmptyStateIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;

  @media (max-width: 480px) {
    font-size: 2.5rem;
  }
`;

const LoadingSpinner = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6b7280;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const StatusMessage = styled.div<{ $type: "pending" | "active" }>`
  margin-top: 0.75rem;
  padding: 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.7rem;
  text-align: center;
  background: ${(props) => (props.$type === "pending" ? "#fef3c7" : "#dcfce7")};
  color: ${(props) => (props.$type === "pending" ? "#92400e" : "#166534")};
`;

// Types
type PromotionType =
  | "HAPPY_HOUR"
  | "STUDENT_DISCOUNT"
  | "LADIES_NIGHT"
  | "THEME_NIGHT"
  | "FOOD_SPECIAL"
  | "DRINK_SPECIAL"
  | "COVER_DISCOUNT"
  | "VIP_OFFER";

type TargetAudience = "ALL" | "WEEKEND" | "WEEKDAY";
type FilterTab = "all" | "pending" | "active" | "expired";

interface PromotionFormData {
  title: string;
  description: string;
  type: PromotionType;
  discountValue: number;
  startDate: string;
  endDate: string;
  targetAudience: TargetAudience;
  conditions: string;
}

interface ExistingPromotion {
  id: string;
  title: string;
  description: string;
  type: string;
  discount: number | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isApproved: boolean;
  views: number;
  clicks: number;
  redemptions: number;
  imageUrl?: string | null;
  accentColor?: string | null;
}

interface PromotionsWizardProps {
  barId: string;
  userRole?: string;
}

interface ModalState {
  isOpen: boolean;
  type: "delete" | "approve";
  promotionId: string;
  promotionTitle: string;
}

interface AIGeneratedData {
  title: string;
  description: string;
  type: PromotionType;
  discount: number | null;
  callToAction: string;
  accentColor: string;
  conditions: string;
}

const PromotionsWizard = ({
  barId,
  userRole = "STAFF",
}: PromotionsWizardProps) => {
  const [mode, setMode] = useState<"ai" | "manual" | null>(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [promotions, setPromotions] = useState<ExistingPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({
    all: 0,
    pending: 0,
    active: 0,
    expired: 0,
  });
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: "delete",
    promotionId: "",
    promotionTitle: "",
  });

  const [formData, setFormData] = useState<PromotionFormData>({
    title: "",
    description: "",
    type: "DRINK_SPECIAL",
    discountValue: 0,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    targetAudience: "ALL",
    conditions: "",
  });

  const steps = [
    { id: 1, title: "Basic Info" },
    { id: 2, title: "Details" },
    { id: 3, title: "Review" },
  ];

  // Check if user can approve (OWNER, MANAGER, PROMOTIONS_MANAGER)
  const canManage = ["OWNER", "MANAGER", "PROMOTIONS_MANAGER"].includes(
    userRole,
  );
  const canApprove = ["OWNER", "MANAGER", "PROMOTIONS_MANAGER"].includes(
    userRole,
  );
  const canDelete = ["OWNER", "MANAGER", "PROMOTIONS_MANAGER"].includes(
    userRole,
  );

  // Fetch tab counts on mount (lightweight: limit=1 per status)
  const fetchTabCounts = useCallback(async () => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("hoppr_token")
        : null;
    if (!token) return;
    const statuses = ["all", "pending", "active", "expired"] as const;
    try {
      const results = await Promise.all(
        statuses.map(async (s) => {
          const res = await fetch(
            `/api/auth/bar/${barId}/promotions?status=${s}&limit=1`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (!res.ok) return { status: s, count: 0 };
          const data = await res.json();
          return { status: s, count: data.pagination?.total || 0 };
        }),
      );
      const counts: Record<string, number> = {
        all: 0,
        pending: 0,
        active: 0,
        expired: 0,
      };
      results.forEach((r) => {
        counts[r.status] = r.count;
      });
      setTabCounts(counts);
    } catch {
      // counts stay at 0 on error — non-critical
    }
  }, [barId]);

  // Fetch promotions with full params for the active tab
  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("hoppr_token")
        : null;
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams();
      params.set("status", activeTab);
      if (search) params.set("search", search);
      if (typeFilter) params.set("type", typeFilter);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      params.set("page", String(page));
      params.set("limit", "12");

      const response = await fetch(
        `/api/auth/bar/${barId}/promotions?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.promotions) {
          setPromotions(data.promotions);
        }
        if (data.pagination) setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch promotions:", error);
    } finally {
      setLoading(false);
    }
  }, [barId, activeTab, search, typeFilter, sortBy, sortOrder, page]);

  // Fetch on mount + tab/param change
  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  // Fetch tab counts on mount
  useEffect(() => {
    fetchTabCounts();
  }, [fetchTabCounts]);

  const handleApprovePromotion = async (promotionId: string) => {
    closeModal();

    try {
      const token = localStorage.getItem("hoppr_token");
      const response = await fetch(
        `/api/auth/bar/${barId}/promotions/${promotionId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isApproved: true }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(
          "✅ Promotion approved! It will now appear in the user app.",
        );
        fetchPromotions();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(data.error || "Failed to approve");
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to approve promotion",
      );
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeletePromotion = async (promotionId: string, title: string) => {
    closeModal();

    try {
      const token = localStorage.getItem("hoppr_token");
      const response = await fetch(
        `/api/auth/bar/${barId}/promotions/${promotionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(`✅ "${title}" deleted successfully.`);
        fetchPromotions();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(data.error || "Failed to delete");
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to delete promotion",
      );
      setTimeout(() => setError(null), 3000);
    }
  };

  const openDeleteModal = (promotionId: string, promotionTitle: string) => {
    setModal({
      isOpen: true,
      type: "delete",
      promotionId,
      promotionTitle,
    });
  };

  const openApproveModal = (promotionId: string, promotionTitle: string) => {
    setModal({
      isOpen: true,
      type: "approve",
      promotionId,
      promotionTitle,
    });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  const confirmAction = () => {
    if (modal.type === "delete") {
      handleDeletePromotion(modal.promotionId, modal.promotionTitle);
    } else if (modal.type === "approve") {
      handleApprovePromotion(modal.promotionId);
    }
  };

  const handleBackToMode = () => {
    setMode(null);
    setShowAIGenerator(false);
    setCurrentStep(1);
    setError(null);
    setSuccess(null);
    setActiveTab("all");
    setFormData({
      title: "",
      description: "",
      type: "DRINK_SPECIAL",
      discountValue: 0,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      targetAudience: "ALL",
      conditions: "",
    });
    fetchPromotions();
  };

  const handleInputChange = (
    field: keyof PromotionFormData,
    value: string | number,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAIGenerate = (generatedData: AIGeneratedData) => {
    setFormData((prev) => ({
      ...prev,
      title: generatedData.title,
      description: generatedData.description,
      type: generatedData.type,
      discountValue: generatedData.discount || prev.discountValue,
      conditions: generatedData.conditions,
    }));
    setShowAIGenerator(false);
    setMode("manual");
    setSuccess("✨ AI-generated promotion ready! Review and adjust if needed.");
    setTimeout(() => setSuccess(null), 5000);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem("hoppr_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`/api/auth/bar/${barId}/promotions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          type: formData.type,
          discountValue: formData.discountValue || null,
          startDate: formData.startDate,
          endDate: formData.endDate,
          conditions: formData.conditions ? [formData.conditions] : [],
          targetAudience: formData.targetAudience,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(
          `✅ "${formData.title}" created successfully! ${
            canApprove
              ? "You can approve it now."
              : "Waiting for owner/manager approval."
          }`,
        );
        setTimeout(() => {
          handleBackToMode();
        }, 2000);
      } else {
        throw new Error(data.error || "Failed to create promotion");
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to create promotion",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getPromotionStatus = (promo: ExistingPromotion): string => {
    const now = new Date();
    const endDate = new Date(promo.endDate);

    if (!promo.isApproved) return "pending";
    if (!promo.isActive) return "inactive";
    if (endDate < now) return "expired";
    return "active";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatPromotionType = (type: string): string => {
    return type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Render Tabs
  const renderTabs = () => (
    <TabsContainer>
      <Tab
        $active={activeTab === "all"}
        onClick={() => {
          setActiveTab("all");
          setPage(1);
        }}
      >
        All
        <TabCount $color="gray">{tabCounts.all}</TabCount>
      </Tab>
      <Tab
        $active={activeTab === "pending"}
        onClick={() => {
          setActiveTab("pending");
          setPage(1);
        }}
      >
        Pending
        <TabCount $color="orange">{tabCounts.pending}</TabCount>
      </Tab>
      <Tab
        $active={activeTab === "active"}
        onClick={() => {
          setActiveTab("active");
          setPage(1);
        }}
      >
        Active
        <TabCount $color="green">{tabCounts.active}</TabCount>
      </Tab>
      <Tab
        $active={activeTab === "expired"}
        onClick={() => {
          setActiveTab("expired");
          setPage(1);
        }}
      >
        Expired
        <TabCount $color="red">{tabCounts.expired}</TabCount>
      </Tab>
    </TabsContainer>
  );
  const renderModal = () => {
    const isDelete = modal.type === "delete";

    return (
      <ModalOverlay $isOpen={modal.isOpen} onClick={closeModal}>
        <ModalContainer onClick={(e) => e.stopPropagation()}>
          <ModalHeader $type={isDelete ? "warning" : "success"}>
            <ModalIcon>{isDelete ? "⚠️" : "🎉"}</ModalIcon>
            <ModalTitle>
              {isDelete ? "Delete Promotion" : "Approve Promotion"}
            </ModalTitle>
          </ModalHeader>
          <ModalBody>
            {isDelete ? (
              <>
                Are you sure you want to delete{" "}
                <strong>&quot;{modal.promotionTitle}&quot;</strong>?
                <br />
                This action cannot be undone.
              </>
            ) : (
              <>
                Are you sure you want to approve{" "}
                <strong>&quot;{modal.promotionTitle}&quot;</strong>?
                <br />
                It will immediately become visible to customers in the user app.
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <ModalButton $variant="cancel" onClick={closeModal}>
              Cancel
            </ModalButton>
            <ModalButton
              $variant={isDelete ? "confirm" : "approve"}
              onClick={confirmAction}
            >
              {isDelete ? "Yes, Delete" : "Yes, Approve"}
            </ModalButton>
          </ModalFooter>
        </ModalContainer>
      </ModalOverlay>
    );
  };

  // Render existing promotions list
  const renderPromotionsList = () => {
    return (
      <PromotionsSection>
        {/* <SectionTitle>Your Promotions</SectionTitle> */}
        {renderTabs()}

        {/* Toolbar: search + type filter + sort */}
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
            placeholder="Search promotions..."
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
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: "0.5rem 0.75rem",
              border: "1px solid #d1d5db",
              borderRadius: "0.375rem",
              fontSize: "0.8125rem",
              background: "white",
            }}
          >
            <option value="">All Types</option>
            {[
              "HAPPY_HOUR",
              "DRINK_SPECIAL",
              "FOOD_SPECIAL",
              "LADIES_NIGHT",
              "THEME_NIGHT",
              "VIP_OFFER",
              "COVER_DISCOUNT",
              "STUDENT_DISCOUNT",
            ].map((t) => (
              <option key={t} value={t}>
                {t
                  .replace(/_/g, " ")
                  .toLowerCase()
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setSortBy("title");
              setSortOrder(
                sortBy === "title" && sortOrder === "asc" ? "desc" : "asc",
              );
              setPage(1);
            }}
            style={{
              padding: "0.5rem 0.75rem",
              border: `1px solid ${sortBy === "title" ? "#7c3aed" : "#d1d5db"}`,
              borderRadius: "0.375rem",
              background: sortBy === "title" ? "#f5f3ff" : "white",
              color: sortBy === "title" ? "#7c3aed" : "#6b7280",
              fontSize: "0.75rem",
              cursor: "pointer",
            }}
          >
            Name {sortBy === "title" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
          </button>
          <button
            onClick={() => {
              setSortBy("createdAt");
              setSortOrder(
                sortBy === "createdAt" && sortOrder === "desc" ? "asc" : "desc",
              );
              setPage(1);
            }}
            style={{
              padding: "0.5rem 0.75rem",
              border: `1px solid ${sortBy === "createdAt" ? "#7c3aed" : "#d1d5db"}`,
              borderRadius: "0.375rem",
              background: sortBy === "createdAt" ? "#f5f3ff" : "white",
              color: sortBy === "createdAt" ? "#7c3aed" : "#6b7280",
              fontSize: "0.75rem",
              cursor: "pointer",
            }}
          >
            Date{" "}
            {sortBy === "createdAt" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
          </button>
        </div>

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
        ) : promotions.length === 0 ? (
          <EmptyState>
            <EmptyStateIcon>
              {activeTab === "pending" && "⏳"}
              {activeTab === "active" && "✓"}
              {activeTab === "expired" && "📅"}
              {activeTab === "all" && "🎯"}
            </EmptyStateIcon>
            <p>
              {activeTab === "pending" &&
                "No pending promotions waiting for approval."}
              {activeTab === "active" &&
                "No active promotions yet. Create and approve one!"}
              {activeTab === "expired" && "No expired promotions."}
              {activeTab === "all" &&
                "No promotions yet. Create your first promotion above!"}
            </p>
          </EmptyState>
        ) : (
          <PromotionsGrid>
            {promotions.map((promo) => {
              const status = getPromotionStatus(promo);
              return (
                <PromotionCard key={promo.id} $status={status}>
                  {promo.imageUrl && (
                    <CardThumbnail>
                      <img
                        src={promo.imageUrl}
                        alt={promo.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </CardThumbnail>
                  )}
                  <CardHeader>
                    <PromotionTitle>{promo.title}</PromotionTitle>
                    <StatusBadge $status={status}>
                      {status === "active"
                        ? "✓ Live"
                        : status === "pending"
                          ? "⏳ Draft"
                          : status === "expired"
                            ? "📅 Expired"
                            : "❌ Inactive"}
                    </StatusBadge>
                  </CardHeader>

                  <PromotionDescription>
                    {promo.description}
                  </PromotionDescription>

                  <PromotionMeta>
                    <MetaItem>📌 {formatPromotionType(promo.type)}</MetaItem>
                    <MetaItem>
                      📅 {formatDate(promo.startDate)} →{" "}
                      {formatDate(promo.endDate)}
                    </MetaItem>
                  </PromotionMeta>

                  {promo.discount && promo.discount > 0 && (
                    <DiscountBadge>{promo.discount}% OFF</DiscountBadge>
                  )}

                  <ActionButtons>
                    <Button
                      $variant="outline"
                      style={{ flex: 1, textDecoration: "none" }}
                      as="a"
                      href={`/bar/${barId}/create?type=promotion&resurface=${promo.id}`}
                    >
                      📋 Duplicate
                    </Button>
                    {promo.imageUrl && (
                      <Button
                        $variant="secondary"
                        style={{ flex: 1 }}
                        onClick={() => window.open(promo.imageUrl!, "_blank")}
                      >
                        📥 Download card
                      </Button>
                    )}
                    {status === "pending" && canApprove && (
                      <Button
                        $variant="secondary"
                        style={{ flex: 2 }}
                        onClick={() => openApproveModal(promo.id, promo.title)}
                      >
                        Approve & Publish
                      </Button>
                    )}

                    {canDelete && (
                      <Button
                        $variant="danger"
                        style={{ flex: 1 }}
                        onClick={() => openDeleteModal(promo.id, promo.title)}
                      >
                        Delete
                      </Button>
                    )}
                  </ActionButtons>

                  {status === "pending" && !canApprove && (
                    <StatusMessage $type="pending">
                      ⏳ Waiting for owner/manager approval
                    </StatusMessage>
                  )}

                  {status === "active" && (
                    <StatusMessage $type="active">
                      ✓ Live in user app - Customers can see this
                    </StatusMessage>
                  )}

                  <StatsRow>
                    <span>👁️ {promo.views.toLocaleString()}</span>
                    <span>👆 {promo.clicks.toLocaleString()}</span>
                    <span>🎫 {promo.redemptions.toLocaleString()}</span>
                  </StatsRow>
                </PromotionCard>
              );
            })}
          </PromotionsGrid>
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
              )}{" "}
              of {pagination.total} promotions
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
      </PromotionsSection>
    );
  };

  const renderHeader = () => (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <Title>Promotions</Title>
        {canManage && (
          <a
            href={`/bar/${barId}/create`}
            style={{
              padding: "0.75rem 1.5rem",
              background: "#7c3aed",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            Create Promotion
          </a>
        )}
      </div>
      {renderPromotionsList()}
    </div>
  );

  const renderBasicInfo = () => (
    <div>
      <FormGroup>
        <Label>Promotion Title *</Label>
        <Input
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange("title", e.target.value)}
          placeholder="e.g., Friday Night Happy Hour"
          required
        />
      </FormGroup>

      <FormGroup>
        <Label>Description *</Label>
        <TextArea
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="Describe your promotion..."
          required
        />
      </FormGroup>

      <ComplianceIndicator
        title={formData.title}
        description={formData.description}
      />

      <FormGroup>
        <Label>Promotion Type *</Label>
        <Select
          value={formData.type}
          onChange={(e) =>
            handleInputChange("type", e.target.value as PromotionType)
          }
        >
          <option value="HAPPY_HOUR">Happy Hour</option>
          <option value="DRINK_SPECIAL">Drink Special</option>
          <option value="FOOD_SPECIAL">Food Special</option>
          <option value="LADIES_NIGHT">Ladies Night</option>
          <option value="THEME_NIGHT">Theme Night</option>
          <option value="VIP_OFFER">VIP Offer</option>
          <option value="COVER_DISCOUNT">Cover Discount</option>
          <option value="STUDENT_DISCOUNT">Student Discount</option>
        </Select>
      </FormGroup>
    </div>
  );

  const renderDetails = () => (
    <div>
      {formData.type === "HAPPY_HOUR" ||
      formData.type === "DRINK_SPECIAL" ||
      formData.type === "FOOD_SPECIAL" ? (
        <FormGroup>
          <Label>Discount Value (%)</Label>
          <Input
            type="number"
            min="0"
            max="100"
            value={formData.discountValue}
            onChange={(e) =>
              handleInputChange("discountValue", Number(e.target.value))
            }
            placeholder="e.g., 25"
          />
        </FormGroup>
      ) : null}

      <FormGroup>
        <Label>Start Date *</Label>
        <Input
          type="date"
          value={formData.startDate}
          onChange={(e) => handleInputChange("startDate", e.target.value)}
          required
        />
      </FormGroup>

      <FormGroup>
        <Label>End Date *</Label>
        <Input
          type="date"
          value={formData.endDate}
          onChange={(e) => handleInputChange("endDate", e.target.value)}
          required
        />
      </FormGroup>

      <FormGroup>
        <Label>Target Audience</Label>
        <Select
          value={formData.targetAudience}
          onChange={(e) =>
            handleInputChange(
              "targetAudience",
              e.target.value as TargetAudience,
            )
          }
        >
          <option value="ALL">All Customers</option>
          <option value="WEEKEND">Weekend Customers (Fri-Sat)</option>
          <option value="WEEKDAY">Weekday Customers (Mon-Thu)</option>
        </Select>
      </FormGroup>

      <FormGroup>
        <Label>Terms & Conditions (Optional)</Label>
        <TextArea
          value={formData.conditions}
          onChange={(e) => handleInputChange("conditions", e.target.value)}
          placeholder="e.g., Valid with valid ID, 18+ only, Cannot combine with other offers"
        />
      </FormGroup>
    </div>
  );

  const renderReview = () => (
    <div>
      <PreviewCard>
        <PreviewTitle>{formData.title || "Untitled Promotion"}</PreviewTitle>
        <PreviewDescription>
          {formData.description || "No description"}
        </PreviewDescription>
        <PreviewDetails>
          <PreviewDetail>
            <strong>Type</strong>
            <div>{formData.type.replace("_", " ")}</div>
          </PreviewDetail>
          <PreviewDetail>
            <strong>Duration</strong>
            <div>
              {formData.startDate} to {formData.endDate}
            </div>
          </PreviewDetail>
          <PreviewDetail>
            <strong>Audience</strong>
            <div>{formData.targetAudience}</div>
          </PreviewDetail>
          {formData.discountValue > 0 && (
            <PreviewDetail>
              <strong>Discount</strong>
              <div>{formData.discountValue}% OFF</div>
            </PreviewDetail>
          )}
        </PreviewDetails>
        {formData.conditions && (
          <div
            style={{
              marginTop: "1rem",
              fontSize: "0.875rem",
              color: "#6b7280",
            }}
          >
            <strong>Terms:</strong> {formData.conditions}
          </div>
        )}
      </PreviewCard>

      <div
        style={{
          marginTop: "1rem",
          padding: "0.75rem",
          background: "#fef3c7",
          borderRadius: "0.5rem",
          fontSize: "0.875rem",
          color: "#92400e",
        }}
      >
        ⏳ This promotion will be created as DRAFT and will need approval from
        an Owner or Manager before going live in the user app.
      </div>
    </div>
  );

  const renderManualWizard = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInfo();
      case 2:
        return renderDetails();
      case 3:
        return renderReview();
      default:
        return null;
    }
  };

  // Always show the promotions list with link to unified create hub
  return (
    <>
      <Container>{renderHeader()}</Container>
      {renderModal()}
    </>
  );
};

export default PromotionsWizard;
