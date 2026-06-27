"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import { scanCompliance } from "@/lib/compliance-engine";
import type { ComplianceViolation } from "@/lib/compliance-engine";
import type { ContentType, FormState } from "./types";
import { EMPTY_FORM, supportsBoost } from "./types";
import AIIntentBox from "./AIIntentBox";
import ComplianceBar from "./ComplianceBar";
import SuggestionPanel from "./SuggestionPanel";
import ComplianceReferencePanel from "./ComplianceReferencePanel";
import ContentTypeTabs from "./ContentTypeTabs";
import ContentCreationStepper from "./ContentCreationStepper";
import UnifiedForm from "./UnifiedForm";
import ConsumerPreviewPanel from "./ConsumerPreviewPanel";

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

const ModeToggleRow = styled.div`
  display: flex;
  gap: 0.25rem;
  background: #f3f4f6;
  border-radius: 0.5rem;
  padding: 0.25rem;
  margin-bottom: 1rem;
  width: fit-content;
`;

const ModeToggleBtn = styled.button<{ $active: boolean }>`
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  font-weight: ${({ $active }) => ($active ? 600 : 500)};
  color: ${({ $active }) => ($active ? "#7c3aed" : "#6b7280")};
  background: ${({ $active }) => ($active ? "white" : "transparent")};
  border: none;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: ${({ $active }) => ($active ? "0 1px 2px rgba(0,0,0,0.08)" : "none")};

  &:hover {
    color: #7c3aed;
  }
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

// ---- Success State ----

const SuccessCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
`;

const SuccessHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const SuccessIcon = styled.span`
  font-size: 1.5rem;
`;

const SuccessTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const SuccessMeta = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
`;

const MetaChip = styled.span<{ $variant?: "green" | "amber" | "gray" }>`
  padding: 0.25rem 0.625rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${({ $variant }) =>
    $variant === "green" ? "#d1fae5" : $variant === "amber" ? "#fef3c7" : "#f3f4f6"};
  color: ${({ $variant }) =>
    $variant === "green" ? "#065f46" : $variant === "amber" ? "#92400e" : "#6b7280"};
`;

const ActionRow = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
`;

const ActionButton = styled.button<{ $variant: "primary" | "secondary" | "outline" }>`
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid ${({ $variant }) => ($variant === "outline" ? "#d1d5db" : "transparent")};
  background: ${({ $variant }) =>
    $variant === "primary" ? "#7c3aed" : $variant === "secondary" ? "#10b981" : "white"};
  color: ${({ $variant }) => ($variant === "outline" ? "#374151" : "white")};

  &:hover {
    background: ${({ $variant }) =>
      $variant === "primary" ? "#6d28d9" : $variant === "secondary" ? "#059669" : "#f3f4f6"};
  }
`;

interface CreatedItem {
  id: string;
  type: string;
  title: string;
  boosted: boolean;
}

// ---- Component ----

interface CreateHubClientProps {
  barId: string;
  userRole: string;
  barCoverImage: string | null;
  barLogoUrl: string | null;
}

export default function CreateHubClient({ barId, userRole, barCoverImage, barLogoUrl }: CreateHubClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Allow pre-selecting content type via ?type= query param
  const initialType = useMemo(() => {
    const typeParam = searchParams.get("type");
    const validTypes: ContentType[] = ["event", "promotion", "campaign", "pass"];
    return validTypes.includes(typeParam as ContentType)
      ? (typeParam as ContentType)
      : "promotion";
  }, [searchParams]);

  const [contentType, setContentType] = useState<ContentType>(initialType);
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
  const [createdItem, setCreatedItem] = useState<CreatedItem | null>(null);
  const [mode, setMode] = useState<"guided" | "quick">("guided");

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
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        setPreviewCollapsed(true);
      }
    },
    [],
  );

  const handleTypeChange = useCallback(
    (newType: ContentType) => {
      perTypeState.current.set(contentType, { ...formState });
      const saved = perTypeState.current.get(newType);
      if (saved) {
        setFormState((prev) => ({
          ...EMPTY_FORM,
          title: prev.title,
          description: prev.description,
          imageUrl: prev.imageUrl,
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

      perTypeState.current.set(contentType, { ...formState });
      setContentType(inferredType);
      setAiInferred(true);

      const updates: Partial<FormState> = {
        title: (data.title as string) || formState.title,
        description: (data.description as string) || formState.description,
      };

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
      } else if (inferredType === "campaign") {
        updates.campaignType = (data.campaignType as string) || "FEATURED_LISTING";
        updates.campaignBudget = (data.campaignBudget as number) || 50;
        updates.campaignStartDate = (data.campaignStartDate as string) || "";
        updates.campaignEndDate = (data.campaignEndDate as string) || "";
      } else if (inferredType === "pass") {
        updates.passType = (data.passType as string) || "SKIP_LINE";
        updates.priceEuros = (data.priceEuros as string) || "";
        updates.originalPriceEuros = (data.originalPriceEuros as string) || "";
        updates.benefits = (data.benefits as string[]) || [];
        updates.totalQuantity = (data.totalQuantity as number) || null;
      }

      setFormState((prev) => ({ ...prev, ...updates }));
      setAiLoading(false);
      setComplianceExpanded(true);
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
      } else if (contentType === "campaign") {
        body.campaignType = formState.campaignType;
        body.campaignBudget = formState.campaignBudget;
        body.campaignStartDate = formState.campaignStartDate;
        body.campaignEndDate = formState.campaignEndDate;
        body.promotedItemId = formState.promotedItemId;
        body.targetUrl = formState.targetUrl;
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

      // Boost only for promotions and events (campaigns ARE the ad)
      if (supportsBoost(contentType) && formState.boostEnabled) {
        body.boostEnabled = true;
        body.boostBudget = formState.boostBudget;
        body.boostMultiplier = formState.boostMultiplier;
        body.boostStartDate = formState.boostStartDate || formState.startDate || formState.startTime;
        body.boostEndDate = formState.boostEndDate || formState.endDate || formState.endTime;
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
      setCreatedItem({
        id: data.record?.id ?? "",
        type: contentType,
        title: formState.title,
        boosted: formState.boostEnabled || contentType === "campaign",
      });
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to create",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setCreatedItem(null);
    setFormState(EMPTY_FORM);
    setAiInferred(false);
    setComplianceExpanded(false);
  };

  // Compute violations client-side for compliance bar
  const violations: ComplianceViolation[] = formState.title
    ? scanCompliance(formState.title, formState.description).violations
    : [];

  const typeLabel = contentType === "campaign"
    ? "Ad Campaign"
    : contentType.charAt(0).toUpperCase() + contentType.slice(1);

  // Stepper can-advance conditions
  const canGoNext = [
    true, // Step 0: type selection — always valid
    formState.title.trim().length > 0, // Step 1: must have a title
    contentType !== "campaign"
      ? true // Step 2: type-specific details (validation in submit route)
      : formState.campaignType !== "" && formState.campaignStartDate !== "" && formState.campaignEndDate !== "",
    violations.filter((v) => v.severity === "high").length === 0, // Step 3: no blocking violations
  ];

  return (
    <div style={{ padding: "1.5rem" }}>
      <PageHeader>
        <Title>Create Content</Title>
        <Subtitle>
          Describe what you want to create and let AI handle the rest. All content is
          checked for Finnish alcohol marketing compliance.
        </Subtitle>
      </PageHeader>

      {createdItem ? (
        /* ---- Success State ---- */
        <div>
          <SuccessCard>
            <SuccessHeader>
              <SuccessIcon>✅</SuccessIcon>
              <div>
                <SuccessTitle>{typeLabel} created</SuccessTitle>
                <div style={{ fontSize: "0.8125rem", color: "#6b7280", marginTop: "0.125rem" }}>
                  &ldquo;{createdItem.title}&rdquo;
                </div>
              </div>
            </SuccessHeader>

            <SuccessMeta>
              <MetaChip $variant="green">Live in Hoppr</MetaChip>
              {createdItem.boosted && (
                <MetaChip $variant="amber">Boosted</MetaChip>
              )}
              <MetaChip $variant="gray">{typeLabel}</MetaChip>
            </SuccessMeta>

            <ActionRow>
              {!createdItem.boosted && supportsBoost(contentType) && (
                <ActionButton
                  $variant="primary"
                  onClick={() => {
                    setCreatedItem(null);
                    setFormState((prev) => ({ ...prev, boostEnabled: true }));
                  }}
                >
                  🚀 Boost this
                </ActionButton>
              )}
              {!formState.imageUrl && (
                <ActionButton
                  $variant="secondary"
                  onClick={() => {
                    setCreatedItem(null);
                  }}
                >
                  🖼️ Add image
                </ActionButton>
              )}
              <ActionButton
                $variant="outline"
                onClick={() => router.push(`/bar/${barId}/${contentType === "campaign" ? "campaigns" : contentType + "s"}`)}
              >
                View all {contentType === "campaign" ? "campaigns" : contentType + "s"}
              </ActionButton>
              <ActionButton $variant="outline" onClick={handleReset}>
                + Create another
              </ActionButton>
            </ActionRow>
          </SuccessCard>
        </div>
      ) : (
        /* ---- Creation Form ---- */
        <>
          {/* Mode toggle */}
          <ModeToggleRow>
            <ModeToggleBtn
              $active={mode === "guided"}
              onClick={() => setMode("guided")}
            >
              🧭 Guided
            </ModeToggleBtn>
            <ModeToggleBtn
              $active={mode === "quick"}
              onClick={() => setMode("quick")}
            >
              ⚡ Quick
            </ModeToggleBtn>
          </ModeToggleRow>

          {mode === "guided" ? (
            /* ---- Guided (stepper) mode ---- */
            <div>
              <AIIntentBox barId={barId} onGenerated={handleAIGenerated} />

              <ContentCreationStepper
                contentType={contentType}
                onTypeChange={handleTypeChange}
                canGoNext={canGoNext}
                onSubmit={handleSubmit}
                submitting={submitting}
              >
                {(step) => {
                  if (step === 1) {
                    // Step 2: title + description fields
                    return (
                      <UnifiedForm
                        contentType={contentType}
                        formState={formState}
                        onChange={handleFieldChange}
                        barId={barId}
                        submitting={false}
                        onSubmit={() => {}}
                        stepperMode={true}
                        stepperStep={1}
                      />
                    );
                  }
                  if (step === 2) {
                    // Step 3: type-specific fields only
                    return (
                      <UnifiedForm
                        contentType={contentType}
                        formState={formState}
                        onChange={handleFieldChange}
                        barId={barId}
                        submitting={false}
                        onSubmit={() => {}}
                        stepperMode={true}
                        stepperStep={2}
                      />
                    );
                  }
                  if (step === 3) {
                    // Step 4: preview + compliance
                    return (
                      <div>
                        <ConsumerPreviewPanel
                          contentType={contentType}
                          formState={formState}
                          collapsed={false}
                          barCoverImage={barCoverImage}
                          barLogoUrl={barLogoUrl}
                        />
                        <ComplianceBar
                          title={formState.title}
                          description={formState.description}
                          expanded={true}
                          onToggle={() => {}}
                        />
                        {violations.length > 0 && (
                          <SuggestionPanel
                            violations={violations}
                            title={formState.title}
                            description={formState.description}
                            contentType={contentType}
                            barId={barId}
                            onAcceptFix={handleAcceptFix}
                          />
                        )}
                        <ComplianceReferencePanel barId={barId} />
                      </div>
                    );
                  }
                  return null;
                }}
              </ContentCreationStepper>
            </div>
          ) : (
            /* ---- Quick mode (current form) ---- */
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

                <ComplianceReferencePanel barId={barId} />

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
                  barCoverImage={barCoverImage}
                  barLogoUrl={barLogoUrl}
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
          )}
        </>
      )}

      {toast && (
        <ToastContainer>
          <Toast $type={toast.type}>{toast.message}</Toast>
        </ToastContainer>
      )}
    </div>
  );
}
