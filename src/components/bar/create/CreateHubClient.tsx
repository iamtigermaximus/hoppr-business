"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { scanCompliance } from "@/lib/compliance-engine";
import type { ComplianceViolation } from "@/lib/compliance-engine";
import AIIntentBox from "./AIIntentBox";
import ComplianceBar from "./ComplianceBar";
import SuggestionPanel from "./SuggestionPanel";
import ContentTypeTabs from "./ContentTypeTabs";
import UnifiedForm from "./UnifiedForm";
import ConsumerPreviewPanel from "./ConsumerPreviewPanel";

// ---- Types ----

type ContentType = "event" | "promotion" | "pass";

interface FormState {
  title: string;
  description: string;
  imageUrl: string | null;
  startTime: string;
  endTime: string;
  maxAttendees: number | null;
  isPrivate: boolean;
  promotionType: string;
  discountValue: number | null;
  startDate: string;
  endDate: string;
  conditions: string;
  targetAudience: string;
  passType: string;
  priceEuros: string;
  originalPriceEuros: string;
  benefits: string[];
  validDays: string[];
  totalQuantity: number | null;
  maxPerUser: number;
  redemptionMode: string;
  maxRedemptions: number | null;
  skipLinePriority: boolean;
  coverFeeIncluded: boolean;
  coverFeeAmount: number;
}

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  imageUrl: null,
  startTime: "",
  endTime: "",
  maxAttendees: null,
  isPrivate: false,
  promotionType: "",
  discountValue: null,
  startDate: "",
  endDate: "",
  conditions: "",
  targetAudience: "",
  passType: "",
  priceEuros: "",
  originalPriceEuros: "",
  benefits: [],
  validDays: [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ],
  totalQuantity: null,
  maxPerUser: 1,
  redemptionMode: "SINGLE_USE",
  maxRedemptions: null,
  skipLinePriority: true,
  coverFeeIncluded: false,
  coverFeeAmount: 0,
};

// ---- Styled Components ----

const HubLayout = styled.div`
  display: flex;
  gap: 1.5rem;
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;

  @media (max-width: 1023px) {
    flex-direction: column;
  }
`;

const FormPanel = styled.div`
  flex: 1;
  min-width: 0;
`;

const PreviewPanel = styled.div`
  width: 400px;
  flex-shrink: 0;
  position: sticky;
  top: 1rem;
  align-self: flex-start;

  @media (max-width: 1023px) {
    width: 100%;
    position: static;
    order: -1;
  }
`;

const PageHeader = styled.div`
  margin-bottom: 1.25rem;
`;

const Title = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.25rem;
`;

const Subtitle = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
`;

const ToastContainer = styled.div`
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 5000;
`;

const Toast = styled.div<{ $type: "success" | "error" }>`
  padding: 0.75rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background: ${({ $type }) => ($type === "success" ? "#dcfce7" : "#fef2f2")};
  color: ${({ $type }) => ($type === "success" ? "#166534" : "#dc2626")};
  border: 1px solid ${({ $type }) => ($type === "success" ? "#86efac" : "#fecaca")};
  animation: slideUp 0.3s ease;

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// ---- Component ----

interface CreateHubClientProps {
  barId: string;
  userRole: string;
}

export default function CreateHubClient({ barId, userRole }: CreateHubClientProps) {
  const router = useRouter();
  const [contentType, setContentType] = useState<ContentType>("promotion");
  const [formState, setFormState] = useState<FormState>(EMPTY_FORM);
  const [aiInferred, setAiInferred] = useState(false);
  const [complianceExpanded, setComplianceExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewCollapsed, setPreviewCollapsed] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Preserve type-specific state when switching tabs
  const perTypeState = useRef<Map<ContentType, Partial<FormState>>>(new Map());

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("hoppr_token")
      : null;

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleFieldChange = useCallback(
    (field: string, value: unknown) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
      // Auto-collapse preview on mobile when typing starts
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        setPreviewCollapsed(true);
      }
    },
    [],
  );

  const handleTypeChange = useCallback(
    (newType: ContentType) => {
      // Save current type state
      perTypeState.current.set(contentType, { ...formState });
      // Restore new type state or keep shared fields
      const saved = perTypeState.current.get(newType);
      if (saved) {
        setFormState((prev) => ({
          ...EMPTY_FORM,
          title: prev.title, // shared
          description: prev.description, // shared
          imageUrl: prev.imageUrl, // shared
          ...saved,
        }));
      } else {
        setFormState((prev) => ({
          ...EMPTY_FORM,
          title: prev.title,
          description: prev.description,
          imageUrl: prev.imageUrl,
        }));
      }
      setContentType(newType);
    },
    [contentType, formState],
  );

  const handleAIGenerated = useCallback(
    (data: Record<string, unknown>) => {
      setAiLoading(true);
      const inferredType = (data.inferredType as ContentType) || "promotion";

      // Save current state
      perTypeState.current.set(contentType, { ...formState });

      setContentType(inferredType);
      setAiInferred(true);

      const updates: Partial<FormState> = {
        title: (data.title as string) || formState.title,
        description: (data.description as string) || formState.description,
      };

      // Type-specific fields from AI
      if (inferredType === "event") {
        updates.startTime = (data.startTime as string) || "";
        updates.endTime = (data.endTime as string) || "";
        updates.maxAttendees = (data.maxAttendees as number) || null;
      } else if (inferredType === "promotion") {
        updates.promotionType = (data.promotionType as string) || "DRINK_SPECIAL";
        updates.discountValue = (data.discountValue as number) || null;
        updates.startDate = (data.startDate as string) || "";
        updates.endDate = (data.endDate as string) || "";
        updates.conditions = (data.conditions as string) || "";
      } else if (inferredType === "pass") {
        updates.passType = (data.passType as string) || "SKIP_LINE";
        updates.priceEuros = (data.priceEuros as string) || "";
        updates.originalPriceEuros = (data.originalPriceEuros as string) || "";
        updates.benefits = (data.benefits as string[]) || [];
        updates.totalQuantity = (data.totalQuantity as number) || null;
      }

      setFormState((prev) => ({ ...prev, ...updates }));
      setAiLoading(false);
      setComplianceExpanded(true); // Show compliance immediately
    },
    [contentType, formState],
  );

  const handleAcceptFix = useCallback(
    (newTitle: string, newDescription: string) => {
      setFormState((prev) => ({
        ...prev,
        title: newTitle,
        description: newDescription,
      }));
      setComplianceExpanded(false);
    },
    [],
  );

  const handleSubmit = async () => {
    if (!token) return;
    setSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        contentType,
        title: formState.title,
        description: formState.description,
        imageUrl: formState.imageUrl,
      };

      // Add type-specific fields
      if (contentType === "event") {
        body.startTime = formState.startTime;
        body.endTime = formState.endTime;
        body.maxAttendees = formState.maxAttendees;
        body.isPrivate = formState.isPrivate;
      } else if (contentType === "promotion") {
        body.promotionType = formState.promotionType;
        body.discountValue = formState.discountValue;
        body.startDate = formState.startDate;
        body.endDate = formState.endDate;
        body.conditions = formState.conditions;
        body.targetAudience = formState.targetAudience;
      } else if (contentType === "pass") {
        body.passType = formState.passType;
        body.priceEuros = formState.priceEuros;
        body.originalPriceEuros = formState.originalPriceEuros;
        body.benefits = formState.benefits;
        body.validDays = formState.validDays;
        body.totalQuantity = formState.totalQuantity;
        body.maxPerUser = formState.maxPerUser;
        body.redemptionMode = formState.redemptionMode;
        body.maxRedemptions = formState.maxRedemptions;
        body.skipLinePriority = formState.skipLinePriority;
        body.coverFeeIncluded = formState.coverFeeIncluded;
        body.coverFeeAmount = formState.coverFeeAmount;
      }

      const res = await fetch(
        `/api/auth/bar/${barId}/create/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        const errorMsg = data.blocked && data.message ? data.message : data.error || "Failed to create";
throw new Error(errorMsg);
      }

      const data = await res.json();
      showToast(
        `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} created successfully!`,
        "success",
      );

      // Redirect to list page after short delay
      setTimeout(() => {
        if (contentType === "event") {
          router.push(`/bar/${barId}/events`);
        } else if (contentType === "promotion") {
          router.push(`/bar/${barId}/promotions`);
        } else {
          router.push(`/bar/${barId}/passes`);
        }
      }, 1500);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to create",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Compute violations client-side for the ComplianceBar
  const violations: ComplianceViolation[] = formState.title
    ? scanCompliance(formState.title, formState.description).violations
    : [];

  return (
    <div style={{ padding: "1.5rem" }}>
      <PageHeader>
        <Title>Create Content</Title>
        <Subtitle>
          Describe what you want to create and let AI handle the rest. All content is
          checked for Finnish alcohol marketing compliance.
        </Subtitle>
      </PageHeader>

      <HubLayout>
        <FormPanel>
          <AIIntentBox barId={barId} onGenerated={handleAIGenerated} />

          <ComplianceBar
            title={formState.title}
            description={formState.description}
            expanded={complianceExpanded}
            onToggle={() => setComplianceExpanded((prev) => !prev)}
          />

          {complianceExpanded && violations.length > 0 && (
            <SuggestionPanel
              violations={violations}
              title={formState.title}
              description={formState.description}
              contentType={contentType}
              barId={barId}
              onAcceptFix={handleAcceptFix}
            />
          )}

          <ContentTypeTabs
            value={contentType}
            onChange={handleTypeChange}
            aiInferred={aiInferred}
          />

          <UnifiedForm
            contentType={contentType}
            formState={formState}
            onChange={handleFieldChange}
            barId={barId}
            submitting={submitting}
            onSubmit={handleSubmit}
          />
        </FormPanel>

        <PreviewPanel>
          <ConsumerPreviewPanel
            contentType={contentType}
            formState={formState}
            collapsed={previewCollapsed}
          />
          {previewCollapsed && (
            <button
              onClick={() => setPreviewCollapsed(false)}
              style={{
                width: "100%",
                padding: "0.5rem",
                marginTop: "0.5rem",
                background: "#f3f4f6",
                border: "1px solid #e5e7eb",
                borderRadius: "0.375rem",
                fontSize: "0.8125rem",
                color: "#6b7280",
                cursor: "pointer",
              }}
            >
              ▲ Show Preview
            </button>
          )}
        </PreviewPanel>
      </HubLayout>

      {toast && (
        <ToastContainer>
          <Toast $type={toast.type}>{toast.message}</Toast>
        </ToastContainer>
      )}
    </div>
  );
}
