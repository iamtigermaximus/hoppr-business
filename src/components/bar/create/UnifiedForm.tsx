"use client";

import { useRef } from "react";
import styled from "styled-components";
import type { ContentType, FormState } from "./types";
import { supportsBoost, isStandaloneCampaign } from "./types";
import {
  FormGroup,
  FormGroupWide,
  Label,
  Input,
  Select,
  TextArea,
  ButtonRow,
  ButtonGroup,
  ModalButton,
  SectionDivider,
  FieldHint,
  InlineRow,
  CheckboxLabel,
} from "./shared/FormPrimitives";
import ImageUploader from "./shared/ImageUploader";
import EventFields from "./fields/EventFields";
import PromotionFields from "./fields/PromotionFields";
import PassFields from "./fields/PassFields";
import AdCampaignFields from "./fields/AdCampaignFields";

// ---- Styled ----

const FormSection = styled.div`
  margin-bottom: 0.5rem;
`;

const BoostSection = styled.div<{ $visible: boolean }>`
  background: ${({ $visible }) => ($visible ? "#f0fdf4" : "transparent")};
  border: 1px solid ${({ $visible }) => ($visible ? "#a7f3d0" : "#e5e7eb")};
  border-radius: 0.5rem;
  padding: ${({ $visible }) => ($visible ? "1rem" : "0.75rem")};
  margin-top: 0.5rem;
  transition: all 0.2s;
`;

const BoostHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ children }) => (children ? "0.75rem" : "0")};
`;

const BoostLabel = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
`;

const BoostBadge = styled.span`
  font-size: 0.6875rem;
  background: #10b981;
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 1rem;
  font-weight: 600;
`;

const BudgetSlider = styled.input`
  width: 100%;
  margin-top: 0.25rem;
`;

const BudgetValue = styled.span`
  font-size: 0.8125rem;
  font-weight: 600;
  color: #065f46;
`;

// ---- Component ----

interface UnifiedFormProps {
  contentType: ContentType;
  formState: FormState;
  onChange: (field: string, value: unknown) => void;
  barId: string;
  submitting: boolean;
  onSubmit: () => void;
  /** When true, the form is rendered within the stepper. Only shows fields for the current step. */
  stepperMode?: boolean;
  /** Which stepper step we're on: 1 = shared fields, 2 = type-specific fields */
  stepperStep?: number;
}

export default function UnifiedForm({
  contentType,
  formState,
  onChange,
  barId,
  submitting,
  onSubmit,
  stepperMode,
  stepperStep,
}: UnifiedFormProps) {
  const perTypeState = useRef<Map<ContentType, Partial<FormState>>>(new Map());

  const showSharedFields = !stepperMode || stepperStep === 1;
  const showTypeFields = !stepperMode || stepperStep === 2;
  const showSubmit = !stepperMode; // In stepper mode, submit is in the stepper footer
  const showBoost = !stepperMode && !isStandaloneCampaign(contentType);

  const typeLabel = contentType === "campaign"
    ? "Ad Campaign"
    : contentType.charAt(0).toUpperCase() + contentType.slice(1);

  return (
    <div>
      {/* Shared fields — title, description, image */}
      {showSharedFields && (
        <>
          <FormSection>
            <FormGroupWide>
              <Label>Title *</Label>
              <Input
                type="text"
                placeholder="Enter a catchy title..."
                value={formState.title}
                onChange={(e) => onChange("title", e.target.value)}
                required
              />
            </FormGroupWide>

            <FormGroupWide>
              <Label>Description</Label>
              <TextArea
                placeholder="Describe what you're creating..."
                value={formState.description}
                onChange={(e) => onChange("description", e.target.value)}
              />
              <FieldHint>
                Describe the key details — the AI preview and compliance engine use this
              </FieldHint>
            </FormGroupWide>

            <FormGroupWide>
              <Label>Image</Label>
              <ImageUploader
                value={formState.imageUrl}
                onChange={(url) => onChange("imageUrl", url)}
                contentType={contentType}
                barId={barId}
              />
              <FieldHint>
                Upload your own or pick from our library of default images
              </FieldHint>
            </FormGroupWide>
          </FormSection>

          {!stepperMode && <SectionDivider />}
        </>
      )}

      {/* Type-specific fields */}
      {showTypeFields && (
        <>
          {contentType === "event" && (
            <EventFields
              startTime={formState.startTime}
              endTime={formState.endTime}
              maxAttendees={formState.maxAttendees}
              isPrivate={formState.isPrivate}
              onChange={onChange}
            />
          )}

          {contentType === "promotion" && (
            <>
              <PromotionFields
                promotionType={formState.promotionType}
                discountValue={formState.discountValue}
                startDate={formState.startDate}
                endDate={formState.endDate}
                targetAudience={formState.targetAudience}
                conditions={formState.conditions}
                onChange={onChange}
              />
              <FormSection>
                <CheckboxLabel>
                  <input
                    type="checkbox"
                    checked={formState.createMatchingEvent}
                    onChange={(e) => onChange("createMatchingEvent", e.target.checked)}
                  />
                  <span style={{ fontSize: "0.8rem", color: "#374151" }}>
                    Also create a matching event
                  </span>
                </CheckboxLabel>
              </FormSection>
            </>
          )}

          {contentType === "campaign" && (
            <AdCampaignFields
              campaignType={formState.campaignType}
              campaignBudget={formState.campaignBudget}
              campaignStartDate={formState.campaignStartDate}
              campaignEndDate={formState.campaignEndDate}
              promotedItemId={formState.promotedItemId}
              targetUrl={formState.targetUrl}
              onChange={onChange}
            />
          )}

          {contentType === "pass" && (
            <PassFields
              passType={formState.passType}
              priceEuros={formState.priceEuros}
              originalPriceEuros={formState.originalPriceEuros}
              benefits={formState.benefits}
              validDays={formState.validDays}
              totalQuantity={formState.totalQuantity}
              maxPerUser={formState.maxPerUser}
              redemptionMode={formState.redemptionMode}
              maxRedemptions={formState.maxRedemptions}
              skipLinePriority={formState.skipLinePriority}
              coverFeeIncluded={formState.coverFeeIncluded}
              coverFeeAmount={formState.coverFeeAmount}
              onChange={onChange}
            />
          )}
        </>
      )}

      {!stepperMode && <SectionDivider />}

      {/* ---- Boost Toggle (promotions & events only, not campaigns) ---- */}
      {showBoost && supportsBoost(contentType) && (
        <FormSection>
          <BoostSection $visible={formState.boostEnabled}>
            <BoostHeader>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={formState.boostEnabled}
                  onChange={(e) => onChange("boostEnabled", e.target.checked)}
                />
                <BoostLabel>🚀 Boost this {contentType}</BoostLabel>
              </CheckboxLabel>
              {formState.boostEnabled && <BoostBadge>More reach</BoostBadge>}
            </BoostHeader>

            {formState.boostEnabled && (
              <>
                <FormGroupWide>
                  <Label>Boost budget (€)</Label>
                  <InlineRow>
                    <BudgetSlider
                      type="range"
                      min={5}
                      max={200}
                      step={5}
                      value={formState.boostBudget}
                      onChange={(e) => onChange("boostBudget", Number(e.target.value))}
                    />
                    <BudgetValue>€{formState.boostBudget}</BudgetValue>
                  </InlineRow>
                  <FieldHint>
                    Higher budget = more Hoppr users see your {contentType} in their feed
                  </FieldHint>
                </FormGroupWide>

                <InlineRow>
                  <FormGroup>
                    <Label>Start</Label>
                    <Input
                      type="date"
                      value={formState.boostStartDate ? formState.boostStartDate.slice(0, 10) : ""}
                      onChange={(e) =>
                        onChange("boostStartDate", e.target.value ? new Date(e.target.value).toISOString() : "")
                      }
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>End</Label>
                    <Input
                      type="date"
                      value={formState.boostEndDate ? formState.boostEndDate.slice(0, 10) : ""}
                      onChange={(e) =>
                        onChange("boostEndDate", e.target.value ? new Date(e.target.value).toISOString() : "")
                      }
                    />
                  </FormGroup>
                </InlineRow>
              </>
            )}
          </BoostSection>
        </FormSection>
      )}

      {!stepperMode && <SectionDivider />}

      {showSubmit && (
        <ButtonRow>
          <ModalButton
            $variant="primary"
            onClick={onSubmit}
            disabled={submitting || !formState.title.trim()}
          >
            {submitting
              ? "Creating..."
              : `📋 Create ${typeLabel}`}
          </ModalButton>
        </ButtonRow>
      )}
    </div>
  );
}
