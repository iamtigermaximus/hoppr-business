// src/components/bar/promotions/PromotionsWizard.tsx
"use client";

import { useState } from "react";
import styled from "styled-components";

const Container = styled.div`
  padding: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #1f2937;

  @media (max-width: 768px) {
    font-size: 1.5rem;
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

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

interface WizardStepProps {
  $active: boolean;
  $completed: boolean;
}

const WizardStep = styled.div<WizardStepProps>`
  flex: 1;
  padding: 1rem;
  text-align: center;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  ${(props) =>
    props.$active
      ? `
    background: #3b82f6;
    color: white;
  `
      : props.$completed
      ? `
    background: #10b981;
    color: white;
  `
      : `
    background: #f8f9fa;
    color: #6b7280;
  `}

  &:hover {
    ${(props) =>
      !props.$active && !props.$completed
        ? `
      background: #e5e7eb;
    `
        : ""}
  }

  @media (max-width: 768px) {
    padding: 0.75rem;
  }
`;

const WizardContent = styled.div`
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #374151;
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
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Button = styled.button<{ $variant: "primary" | "secondary" }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  flex: 1;

  ${(props) =>
    props.$variant === "primary"
      ? `
    background: #3b82f6;
    color: white;
    
    &:hover:not(:disabled) {
      background: #2563eb;
    }
  `
      : `
    background: #6b7280;
    color: white;
    
    &:hover:not(:disabled) {
      background: #4b5563;
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const PreviewCard = styled.div`
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  margin-top: 1rem;
`;

const PreviewTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1f2937;
`;

const PreviewDescription = styled.p`
  color: #6b7280;
  margin-bottom: 1rem;
`;

const PreviewDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const PreviewDetail = styled.div`
  text-align: center;
  padding: 0.75rem;
  background: white;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
`;

interface PromotionsWizardProps {
  barId: string;
}

type PromotionType = "DISCOUNT" | "FREE_ITEM" | "COMBO" | "VIP_ACCESS";
type DiscountType = "PERCENTAGE" | "FIXED";
type TargetAudience = "ALL" | "NEW_CUSTOMERS" | "RETURNING" | "VIP";

interface PromotionFormData {
  title: string;
  description: string;
  type: PromotionType;
  discountValue?: number;
  discountType?: DiscountType;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  targetAudience: TargetAudience;
  conditions: string;
}

const PromotionsWizard = ({ barId }: PromotionsWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<PromotionFormData>({
    title: "",
    description: "",
    type: "DISCOUNT",
    discountValue: 0,
    discountType: "PERCENTAGE",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    usageLimit: 100,
    targetAudience: "ALL",
    conditions: "",
  });

  const steps = [
    { id: 1, title: "Basic Info" },
    { id: 2, title: "Details" },
    { id: 3, title: "Audience" },
    { id: 4, title: "Review" },
  ];

  const handleInputChange = (
    field: keyof PromotionFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("hoppr_token");
      const response = await fetch(`/api/bar/${barId}/promotions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Promotion created successfully!");
        setCurrentStep(1);
        setFormData({
          title: "",
          description: "",
          type: "DISCOUNT",
          discountValue: 0,
          discountType: "PERCENTAGE",
          startDate: new Date().toISOString().split("T")[0],
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          usageLimit: 100,
          targetAudience: "ALL",
          conditions: "",
        });
      } else {
        alert("Failed to create promotion");
      }
    } catch (error) {
      alert("Error creating promotion");
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <FormGroup>
              <Label>Promotion Title</Label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g., Friday Night Special"
              />
            </FormGroup>
            <FormGroup>
              <Label>Description</Label>
              <TextArea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe your promotion..."
              />
            </FormGroup>
            <FormGroup>
              <Label>Promotion Type</Label>
              <Select
                value={formData.type}
                onChange={(e) =>
                  handleInputChange("type", e.target.value as PromotionType)
                }
              >
                <option value="DISCOUNT">Discount</option>
                <option value="FREE_ITEM">Free Item</option>
                <option value="COMBO">Combo Deal</option>
                <option value="VIP_ACCESS">VIP Access</option>
              </Select>
            </FormGroup>
          </div>
        );

      case 2:
        return (
          <div>
            {formData.type === "DISCOUNT" && (
              <>
                <FormGroup>
                  <Label>Discount Type</Label>
                  <Select
                    value={formData.discountType}
                    onChange={(e) =>
                      handleInputChange(
                        "discountType",
                        e.target.value as DiscountType
                      )
                    }
                  >
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED">Fixed Amount</option>
                  </Select>
                </FormGroup>
                <FormGroup>
                  <Label>Discount Value</Label>
                  <Input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) =>
                      handleInputChange("discountValue", Number(e.target.value))
                    }
                  />
                </FormGroup>
              </>
            )}
            <FormGroup>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
              />
            </FormGroup>
            <FormGroup>
              <Label>End Date</Label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange("endDate", e.target.value)}
              />
            </FormGroup>
            <FormGroup>
              <Label>Usage Limit (optional)</Label>
              <Input
                type="number"
                value={formData.usageLimit}
                onChange={(e) =>
                  handleInputChange("usageLimit", Number(e.target.value))
                }
                placeholder="Leave empty for unlimited"
              />
            </FormGroup>
          </div>
        );

      case 3:
        return (
          <div>
            <FormGroup>
              <Label>Target Audience</Label>
              <Select
                value={formData.targetAudience}
                onChange={(e) =>
                  handleInputChange(
                    "targetAudience",
                    e.target.value as TargetAudience
                  )
                }
              >
                <option value="ALL">All Customers</option>
                <option value="NEW_CUSTOMERS">New Customers Only</option>
                <option value="RETURNING">Returning Customers</option>
                <option value="VIP">VIP Customers Only</option>
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>Conditions</Label>
              <TextArea
                value={formData.conditions}
                onChange={(e) =>
                  handleInputChange("conditions", e.target.value)
                }
                placeholder="Any special conditions or requirements..."
              />
            </FormGroup>
          </div>
        );

      case 4:
        return (
          <div>
            <PreviewCard>
              <PreviewTitle>{formData.title}</PreviewTitle>
              <PreviewDescription>{formData.description}</PreviewDescription>
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
                  <div>{formData.targetAudience.replace("_", " ")}</div>
                </PreviewDetail>
                {formData.usageLimit && (
                  <PreviewDetail>
                    <strong>Usage Limit</strong>
                    <div>{formData.usageLimit} times</div>
                  </PreviewDetail>
                )}
              </PreviewDetails>
            </PreviewCard>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Container>
      <Title>Create Promotion</Title>

      <WizardContainer>
        <WizardHeader>
          {steps.map((step) => (
            <WizardStep
              key={step.id}
              $active={currentStep === step.id}
              $completed={currentStep > step.id}
              onClick={() => setCurrentStep(step.id)}
            >
              {step.title}
            </WizardStep>
          ))}
        </WizardHeader>

        <WizardContent>
          {renderStep()}

          <ButtonGroup>
            <Button
              $variant="secondary"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous
            </Button>

            {currentStep < steps.length ? (
              <Button $variant="primary" onClick={nextStep}>
                Next
              </Button>
            ) : (
              <Button $variant="primary" onClick={handleSubmit}>
                Create Promotion
              </Button>
            )}
          </ButtonGroup>
        </WizardContent>
      </WizardContainer>
    </Container>
  );
};

export default PromotionsWizard;
