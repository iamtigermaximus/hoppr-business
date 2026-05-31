"use client";

import { useRef } from "react";
import styled from "styled-components";
import {
  FormGroup,
  FormGroupWide,
  Label,
  Input,
  TextArea,
  ButtonRow,
  ModalButton,
  SectionDivider,
  FieldHint,
} from "./shared/FormPrimitives";
import ImageUploader from "./shared/ImageUploader";
import EventFields from "./fields/EventFields";
import PromotionFields from "./fields/PromotionFields";
import PassFields from "./fields/PassFields";

// ---- Styled ----

const FormSection = styled.div`
  margin-bottom: 0.5rem;
`;

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

interface UnifiedFormProps {
  contentType: ContentType;
  formState: FormState;
  onChange: (field: string, value: unknown) => void;
  barId: string;
  submitting: boolean;
  onSubmit: () => void;
}

// ---- Component ----

export default function UnifiedForm({
  contentType,
  formState,
  onChange,
  barId,
  submitting,
  onSubmit,
}: UnifiedFormProps) {
  // Preserve type-specific fields when switching tabs
  const perTypeState = useRef<Map<ContentType, Partial<FormState>>>(new Map());

  const handleTypeSwitch = (_newType: ContentType) => {
    // Save current type state before switching — handled by parent
  };

  return (
    <div>
      {/* Shared fields — always visible */}
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

      <SectionDivider />

      {/* Type-specific fields */}
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
        <PromotionFields
          promotionType={formState.promotionType}
          discountValue={formState.discountValue}
          startDate={formState.startDate}
          endDate={formState.endDate}
          targetAudience={formState.targetAudience}
          conditions={formState.conditions}
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

      <SectionDivider />

      <ButtonRow>
        <ModalButton
          $variant="primary"
          onClick={onSubmit}
          disabled={submitting || !formState.title.trim()}
        >
          {submitting
            ? "Creating..."
            : `📋 Create ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`}
        </ModalButton>
      </ButtonRow>
    </div>
  );
}
