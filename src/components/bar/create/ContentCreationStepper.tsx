"use client";

import { useState, useCallback, forwardRef, useImperativeHandle } from "react";
import styled from "styled-components";
import type { ContentType } from "./types";

// ---- Styled ----

const StepperContainer = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
`;

const StepsHeader = styled.div`
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
`;

const StepTab = styled.button<{ $active: boolean; $completed: boolean }>`
  flex: 1;
  padding: 0.875rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: ${({ $active }) => ($active ? 600 : 500)};
  color: ${({ $active, $completed }) =>
    $active ? "#7c3aed" : $completed ? "#059669" : "#9ca3af"};
  background: ${({ $active }) => ($active ? "white" : "transparent")};
  border: none;
  border-bottom: 2px solid ${({ $active }) => ($active ? "#7c3aed" : "transparent")};
  cursor: ${({ $completed }) => ($completed ? "pointer" : "default")};
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  white-space: nowrap;

  &:hover {
    color: ${({ $completed }) => ($completed ? "#059669" : "#7c3aed")};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const StepNumber = styled.span<{ $active: boolean; $completed: boolean }>`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6875rem;
  font-weight: 700;
  background: ${({ $active, $completed }) =>
    $active ? "#7c3aed" : $completed ? "#059669" : "#e5e7eb"};
  color: ${({ $active, $completed }) =>
    $active || $completed ? "white" : "#9ca3af"};
  flex-shrink: 0;
`;

const StepBody = styled.div`
  padding: 1.5rem;
  min-height: 300px;
`;

const StepFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  gap: 0.75rem;
`;

const StepButton = styled.button<{ $variant: "primary" | "secondary" | "outline" }>`
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid ${({ $variant }) => ($variant === "outline" ? "#d1d5db" : "transparent")};
  background: ${({ $variant }) =>
    $variant === "primary" ? "#7c3aed" : $variant === "secondary" ? "#10b981" : "white"};
  color: ${({ $variant }) => ($variant === "outline" ? "#374151" : "white")};

  &:hover:not(:disabled) {
    background: ${({ $variant }) =>
      $variant === "primary" ? "#6d28d9" : $variant === "secondary" ? "#059669" : "#f3f4f6"};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TypeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
`;

const TypeCard = styled.button<{ $selected: boolean }>`
  padding: 1.25rem 1rem;
  border-radius: 0.75rem;
  border: 2px solid ${({ $selected }) => ($selected ? "#7c3aed" : "#e5e7eb")};
  background: ${({ $selected }) => ($selected ? "#f5f3ff" : "white")};
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
  font-family: inherit;

  &:hover {
    border-color: #7c3aed;
    background: ${({ $selected }) => ($selected ? "#f5f3ff" : "#faf5ff")};
  }
`;

const TypeIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
`;

const TypeName = styled.div`
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
`;

const TypeDesc = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.4;
`;

const StepTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem;
`;

const StepSubtitle = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1.25rem;
`;

const PreviewFrame = styled.div`
  background: #0a0a0a;
  border-radius: 0.75rem;
  padding: 1rem;
  border: 1px solid #262626;
  max-width: 380px;
  margin: 0 auto;
`;

const PreviewHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #262626;
  font-size: 0.75rem;
  font-weight: 600;
  color: #d1d5db;
  text-transform: uppercase;
`;

const CompliancePass = styled.div<{ $clean: boolean }>`
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  text-align: center;
  margin-top: 1rem;
  background: ${({ $clean }) => ($clean ? "#d1fae5" : "#fef2f2")};
  color: ${({ $clean }) => ($clean ? "#065f46" : "#dc2626")};
  border: 1px solid ${({ $clean }) => ($clean ? "#86efac" : "#fecaca")};
`;

// ---- Types ----

interface StepConfig {
  label: string;
  subtitle: string;
}

const STEPS: StepConfig[] = [
  { label: "Choose Type", subtitle: "What do you want to create?" },
  { label: "Write Content", subtitle: "AI-assisted title & description" },
  { label: "Add Details", subtitle: "Type-specific information" },
  { label: "Review", subtitle: "Preview & compliance check" },
];

interface TypeOption {
  value: ContentType;
  label: string;
  icon: string;
  desc: string;
}

const TYPE_OPTIONS: TypeOption[] = [
  {
    value: "promotion",
    label: "Promotion",
    icon: "🎁",
    desc: "Happy hours, drink specials, food deals, ladies nights",
  },
  {
    value: "event",
    label: "Event",
    icon: "📅",
    desc: "Live music, game nights, theme parties, special occasions",
  },
  {
    value: "campaign",
    label: "Ad Campaign",
    icon: "📢",
    desc: "Featured listings, banners, boosted promotions, sponsored events",
  },
  {
    value: "pass",
    label: "VIP Pass",
    icon: "🎟️",
    desc: "Skip-line passes, cover-included entry, drink packages",
  },
];

// ---- Types ----

export interface StepperHandle {
  advanceStep: () => void;
  getCurrentStep: () => number;
}

// ---- Component ----

interface ContentCreationStepperProps {
  contentType: ContentType;
  onTypeChange: (type: ContentType) => void;
  children: (step: number) => React.ReactNode;
  canGoNext: boolean[];
  onSubmit: () => void;
  submitting: boolean;
  /** Hide the built-in footer on these step indices (child handles its own nav) */
  hideFooterOnSteps?: number[];
}

const ContentCreationStepper = forwardRef<StepperHandle, ContentCreationStepperProps>(function ContentCreationStepper({
  contentType,
  onTypeChange,
  children,
  canGoNext,
  onSubmit,
  submitting,
  hideFooterOnSteps = [],
}, ref) {
  const [step, setStep] = useState(0);
  const completedSteps = new Set<number>();

  // Mark steps as completed as user progresses
  if (step > 0) completedSteps.add(0);
  if (step > 1) completedSteps.add(1);
  if (step > 2) completedSteps.add(2);

  const handleNext = useCallback(() => {
    if (step < 3) {
      completedSteps.add(step);
      setStep((s) => s + 1);
    }
  }, [step]);

  const handleBack = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  useImperativeHandle(ref, () => ({
    advanceStep: () => handleNext(),
    getCurrentStep: () => step,
  }), [handleNext, step]);

  const canAdvance = canGoNext[step] ?? true;

  return (
    <StepperContainer>
      <StepsHeader>
        {STEPS.map((s, i) => (
          <StepTab
            key={s.label}
            $active={step === i}
            $completed={completedSteps.has(i)}
            onClick={() => {
              if (completedSteps.has(i)) setStep(i);
            }}
            disabled={!completedSteps.has(i) && i !== step}
          >
            <StepNumber $active={step === i} $completed={completedSteps.has(i)}>
              {completedSteps.has(i) ? "✓" : i + 1}
            </StepNumber>
            <span style={{ display: "none" }}> {/* Hide label on mobile, show on wider */}
              {s.label}
            </span>
          </StepTab>
        ))}
      </StepsHeader>

      <StepBody>
        {step === 0 && (
          <div>
            <StepTitle>What do you want to create?</StepTitle>
            <StepSubtitle>
              Pick the type of content. The AI will adapt its suggestions and the form
              will show the right fields for what you choose.
            </StepSubtitle>
            <TypeGrid>
              {TYPE_OPTIONS.map((t) => (
                <TypeCard
                  key={t.value}
                  $selected={contentType === t.value}
                  onClick={() => onTypeChange(t.value)}
                >
                  <TypeIcon>{t.icon}</TypeIcon>
                  <TypeName>{t.label}</TypeName>
                  <TypeDesc>{t.desc}</TypeDesc>
                </TypeCard>
              ))}
            </TypeGrid>
          </div>
        )}

        {step === 1 && (
          <div>
            <StepTitle>Write your content</StepTitle>
            <StepSubtitle>
              Use the AI assistant above to generate a draft, or write your own title
              and description. The compliance engine checks as you type.
            </StepSubtitle>
            {children(1)}
          </div>
        )}

        {step === 2 && (
          <div>
            <StepTitle>
              Add details for your{" "}
              {contentType === "campaign" ? "ad campaign" : contentType}
            </StepTitle>
            <StepSubtitle>
              Fill in the {contentType}-specific information below. Required fields are
              marked with *.
            </StepSubtitle>
            {children(2)}
          </div>
        )}

        {step === 3 && (
          <div>
            <StepTitle>Review & publish</StepTitle>
            <StepSubtitle>
              Check the consumer preview below. The compliance engine has scanned your
              content — make sure it passes all checks before publishing.
            </StepSubtitle>
            {children(3)}
          </div>
        )}
      </StepBody>

      {!hideFooterOnSteps.includes(step) && (
        <StepFooter>
          <StepButton
            $variant="outline"
            onClick={handleBack}
            disabled={step === 0}
          >
            ← Back
          </StepButton>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            {step < 3 ? (
              <StepButton
                $variant="primary"
                onClick={handleNext}
                disabled={!canAdvance}
              >
                Continue →
              </StepButton>
            ) : (
              <StepButton
                $variant="secondary"
                onClick={onSubmit}
                disabled={submitting || !canAdvance}
              >
                {submitting
                  ? "Publishing..."
                  : `✅ Publish ${contentType === "campaign" ? "Ad Campaign" : contentType.charAt(0).toUpperCase() + contentType.slice(1)}`}
              </StepButton>
            )}
          </div>
        </StepFooter>
      )}
    </StepperContainer>
  );
});

export default ContentCreationStepper;
