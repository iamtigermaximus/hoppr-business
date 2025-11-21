// // src/components/bar/promotions/PromotionsWizard.tsx
// "use client";

// import { useState } from "react";
// import styled from "styled-components";

// const Container = styled.div`
//   padding: 1.5rem;
//   max-width: 800px;
//   margin: 0 auto;
//   width: 100%;

//   @media (max-width: 768px) {
//     padding: 1rem;
//   }
// `;

// const Title = styled.h1`
//   font-size: 2rem;
//   font-weight: 700;
//   margin-bottom: 1rem;
//   color: #1f2937;

//   @media (max-width: 768px) {
//     font-size: 1.5rem;
//   }
// `;

// const WizardContainer = styled.div`
//   background: white;
//   border-radius: 0.5rem;
//   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
//   border: 1px solid #e5e7eb;
//   overflow: hidden;
// `;

// const WizardHeader = styled.div`
//   display: flex;
//   border-bottom: 1px solid #e5e7eb;
//   background: #f8f9fa;

//   @media (max-width: 768px) {
//     flex-direction: column;
//   }
// `;

// interface WizardStepProps {
//   $active: boolean;
//   $completed: boolean;
// }

// const WizardStep = styled.div<WizardStepProps>`
//   flex: 1;
//   padding: 1rem;
//   text-align: center;
//   font-weight: 600;
//   cursor: pointer;
//   transition: all 0.2s;

//   ${(props) =>
//     props.$active
//       ? `
//     background: #3b82f6;
//     color: white;
//   `
//       : props.$completed
//       ? `
//     background: #10b981;
//     color: white;
//   `
//       : `
//     background: #f8f9fa;
//     color: #6b7280;
//   `}

//   &:hover {
//     ${(props) =>
//       !props.$active && !props.$completed
//         ? `
//       background: #e5e7eb;
//     `
//         : ""}
//   }

//   @media (max-width: 768px) {
//     padding: 0.75rem;
//   }
// `;

// const WizardContent = styled.div`
//   padding: 2rem;

//   @media (max-width: 768px) {
//     padding: 1.5rem;
//   }
// `;

// const FormGroup = styled.div`
//   margin-bottom: 1.5rem;
// `;

// const Label = styled.label`
//   display: block;
//   font-weight: 600;
//   margin-bottom: 0.5rem;
//   color: #374151;
// `;

// const Input = styled.input`
//   width: 100%;
//   padding: 0.75rem;
//   border: 1px solid #d1d5db;
//   border-radius: 0.375rem;
//   font-size: 1rem;

//   &:focus {
//     outline: none;
//     border-color: #3b82f6;
//     box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
//   }
// `;

// const TextArea = styled.textarea`
//   width: 100%;
//   padding: 0.75rem;
//   border: 1px solid #d1d5db;
//   border-radius: 0.375rem;
//   font-size: 1rem;
//   min-height: 100px;
//   resize: vertical;

//   &:focus {
//     outline: none;
//     border-color: #3b82f6;
//     box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
//   }
// `;

// const Select = styled.select`
//   width: 100%;
//   padding: 0.75rem;
//   border: 1px solid #d1d5db;
//   border-radius: 0.375rem;
//   font-size: 1rem;
//   background: white;

//   &:focus {
//     outline: none;
//     border-color: #3b82f6;
//     box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
//   }
// `;

// const ButtonGroup = styled.div`
//   display: flex;
//   justify-content: space-between;
//   margin-top: 2rem;
//   gap: 1rem;

//   @media (max-width: 768px) {
//     flex-direction: column;
//   }
// `;

// const Button = styled.button<{ $variant: "primary" | "secondary" }>`
//   padding: 0.75rem 1.5rem;
//   border: none;
//   border-radius: 0.375rem;
//   font-weight: 600;
//   cursor: pointer;
//   transition: background-color 0.2s;
//   flex: 1;

//   ${(props) =>
//     props.$variant === "primary"
//       ? `
//     background: #3b82f6;
//     color: white;

//     &:hover:not(:disabled) {
//       background: #2563eb;
//     }
//   `
//       : `
//     background: #6b7280;
//     color: white;

//     &:hover:not(:disabled) {
//       background: #4b5563;
//     }
//   `}

//   &:disabled {
//     opacity: 0.6;
//     cursor: not-allowed;
//   }
// `;

// const PreviewCard = styled.div`
//   background: #f8f9fa;
//   padding: 1.5rem;
//   border-radius: 0.5rem;
//   border: 1px solid #e5e7eb;
//   margin-top: 1rem;
// `;

// const PreviewTitle = styled.h3`
//   font-size: 1.25rem;
//   font-weight: 600;
//   margin-bottom: 0.5rem;
//   color: #1f2937;
// `;

// const PreviewDescription = styled.p`
//   color: #6b7280;
//   margin-bottom: 1rem;
// `;

// const PreviewDetails = styled.div`
//   display: grid;
//   grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
//   gap: 1rem;
//   margin-top: 1rem;
// `;

// const PreviewDetail = styled.div`
//   text-align: center;
//   padding: 0.75rem;
//   background: white;
//   border-radius: 0.375rem;
//   border: 1px solid #e5e7eb;
// `;

// interface PromotionsWizardProps {
//   barId: string;
// }

// type PromotionType = "DISCOUNT" | "FREE_ITEM" | "COMBO" | "VIP_ACCESS";
// type DiscountType = "PERCENTAGE" | "FIXED";
// type TargetAudience = "ALL" | "NEW_CUSTOMERS" | "RETURNING" | "VIP";

// interface PromotionFormData {
//   title: string;
//   description: string;
//   type: PromotionType;
//   discountValue?: number;
//   discountType?: DiscountType;
//   startDate: string;
//   endDate: string;
//   usageLimit?: number;
//   targetAudience: TargetAudience;
//   conditions: string;
// }

// const PromotionsWizard = ({ barId }: PromotionsWizardProps) => {
//   const [currentStep, setCurrentStep] = useState(1);
//   const [formData, setFormData] = useState<PromotionFormData>({
//     title: "",
//     description: "",
//     type: "DISCOUNT",
//     discountValue: 0,
//     discountType: "PERCENTAGE",
//     startDate: new Date().toISOString().split("T")[0],
//     endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
//       .toISOString()
//       .split("T")[0],
//     usageLimit: 100,
//     targetAudience: "ALL",
//     conditions: "",
//   });

//   const steps = [
//     { id: 1, title: "Basic Info" },
//     { id: 2, title: "Details" },
//     { id: 3, title: "Audience" },
//     { id: 4, title: "Review" },
//   ];

//   const handleInputChange = (
//     field: keyof PromotionFormData,
//     value: string | number
//   ) => {
//     setFormData((prev) => ({
//       ...prev,
//       [field]: value,
//     }));
//   };

//   const nextStep = () => {
//     if (currentStep < steps.length) {
//       setCurrentStep(currentStep + 1);
//     }
//   };

//   const prevStep = () => {
//     if (currentStep > 1) {
//       setCurrentStep(currentStep - 1);
//     }
//   };

//   const handleSubmit = async () => {
//     try {
//       const token = localStorage.getItem("hoppr_token");
//       const response = await fetch(`/api/bar/${barId}/promotions`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(formData),
//       });

//       if (response.ok) {
//         alert("Promotion created successfully!");
//         setCurrentStep(1);
//         setFormData({
//           title: "",
//           description: "",
//           type: "DISCOUNT",
//           discountValue: 0,
//           discountType: "PERCENTAGE",
//           startDate: new Date().toISOString().split("T")[0],
//           endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
//             .toISOString()
//             .split("T")[0],
//           usageLimit: 100,
//           targetAudience: "ALL",
//           conditions: "",
//         });
//       } else {
//         alert("Failed to create promotion");
//       }
//     } catch (error) {
//       alert("Error creating promotion");
//     }
//   };

//   const renderStep = () => {
//     switch (currentStep) {
//       case 1:
//         return (
//           <div>
//             <FormGroup>
//               <Label>Promotion Title</Label>
//               <Input
//                 type="text"
//                 value={formData.title}
//                 onChange={(e) => handleInputChange("title", e.target.value)}
//                 placeholder="e.g., Friday Night Special"
//               />
//             </FormGroup>
//             <FormGroup>
//               <Label>Description</Label>
//               <TextArea
//                 value={formData.description}
//                 onChange={(e) =>
//                   handleInputChange("description", e.target.value)
//                 }
//                 placeholder="Describe your promotion..."
//               />
//             </FormGroup>
//             <FormGroup>
//               <Label>Promotion Type</Label>
//               <Select
//                 value={formData.type}
//                 onChange={(e) =>
//                   handleInputChange("type", e.target.value as PromotionType)
//                 }
//               >
//                 <option value="DISCOUNT">Discount</option>
//                 <option value="FREE_ITEM">Free Item</option>
//                 <option value="COMBO">Combo Deal</option>
//                 <option value="VIP_ACCESS">VIP Access</option>
//               </Select>
//             </FormGroup>
//           </div>
//         );

//       case 2:
//         return (
//           <div>
//             {formData.type === "DISCOUNT" && (
//               <>
//                 <FormGroup>
//                   <Label>Discount Type</Label>
//                   <Select
//                     value={formData.discountType}
//                     onChange={(e) =>
//                       handleInputChange(
//                         "discountType",
//                         e.target.value as DiscountType
//                       )
//                     }
//                   >
//                     <option value="PERCENTAGE">Percentage</option>
//                     <option value="FIXED">Fixed Amount</option>
//                   </Select>
//                 </FormGroup>
//                 <FormGroup>
//                   <Label>Discount Value</Label>
//                   <Input
//                     type="number"
//                     value={formData.discountValue}
//                     onChange={(e) =>
//                       handleInputChange("discountValue", Number(e.target.value))
//                     }
//                   />
//                 </FormGroup>
//               </>
//             )}
//             <FormGroup>
//               <Label>Start Date</Label>
//               <Input
//                 type="date"
//                 value={formData.startDate}
//                 onChange={(e) => handleInputChange("startDate", e.target.value)}
//               />
//             </FormGroup>
//             <FormGroup>
//               <Label>End Date</Label>
//               <Input
//                 type="date"
//                 value={formData.endDate}
//                 onChange={(e) => handleInputChange("endDate", e.target.value)}
//               />
//             </FormGroup>
//             <FormGroup>
//               <Label>Usage Limit (optional)</Label>
//               <Input
//                 type="number"
//                 value={formData.usageLimit}
//                 onChange={(e) =>
//                   handleInputChange("usageLimit", Number(e.target.value))
//                 }
//                 placeholder="Leave empty for unlimited"
//               />
//             </FormGroup>
//           </div>
//         );

//       case 3:
//         return (
//           <div>
//             <FormGroup>
//               <Label>Target Audience</Label>
//               <Select
//                 value={formData.targetAudience}
//                 onChange={(e) =>
//                   handleInputChange(
//                     "targetAudience",
//                     e.target.value as TargetAudience
//                   )
//                 }
//               >
//                 <option value="ALL">All Customers</option>
//                 <option value="NEW_CUSTOMERS">New Customers Only</option>
//                 <option value="RETURNING">Returning Customers</option>
//                 <option value="VIP">VIP Customers Only</option>
//               </Select>
//             </FormGroup>
//             <FormGroup>
//               <Label>Conditions</Label>
//               <TextArea
//                 value={formData.conditions}
//                 onChange={(e) =>
//                   handleInputChange("conditions", e.target.value)
//                 }
//                 placeholder="Any special conditions or requirements..."
//               />
//             </FormGroup>
//           </div>
//         );

//       case 4:
//         return (
//           <div>
//             <PreviewCard>
//               <PreviewTitle>{formData.title}</PreviewTitle>
//               <PreviewDescription>{formData.description}</PreviewDescription>
//               <PreviewDetails>
//                 <PreviewDetail>
//                   <strong>Type</strong>
//                   <div>{formData.type.replace("_", " ")}</div>
//                 </PreviewDetail>
//                 <PreviewDetail>
//                   <strong>Duration</strong>
//                   <div>
//                     {formData.startDate} to {formData.endDate}
//                   </div>
//                 </PreviewDetail>
//                 <PreviewDetail>
//                   <strong>Audience</strong>
//                   <div>{formData.targetAudience.replace("_", " ")}</div>
//                 </PreviewDetail>
//                 {formData.usageLimit && (
//                   <PreviewDetail>
//                     <strong>Usage Limit</strong>
//                     <div>{formData.usageLimit} times</div>
//                   </PreviewDetail>
//                 )}
//               </PreviewDetails>
//             </PreviewCard>
//           </div>
//         );

//       default:
//         return null;
//     }
//   };

//   return (
//     <Container>
//       <Title>Create Promotion</Title>

//       <WizardContainer>
//         <WizardHeader>
//           {steps.map((step) => (
//             <WizardStep
//               key={step.id}
//               $active={currentStep === step.id}
//               $completed={currentStep > step.id}
//               onClick={() => setCurrentStep(step.id)}
//             >
//               {step.title}
//             </WizardStep>
//           ))}
//         </WizardHeader>

//         <WizardContent>
//           {renderStep()}

//           <ButtonGroup>
//             <Button
//               $variant="secondary"
//               onClick={prevStep}
//               disabled={currentStep === 1}
//             >
//               Previous
//             </Button>

//             {currentStep < steps.length ? (
//               <Button $variant="primary" onClick={nextStep}>
//                 Next
//               </Button>
//             ) : (
//               <Button $variant="primary" onClick={handleSubmit}>
//                 Create Promotion
//               </Button>
//             )}
//           </ButtonGroup>
//         </WizardContent>
//       </WizardContainer>
//     </Container>
//   );
// };

// export default PromotionsWizard;
// src/components/bar/promotions/PromotionsWizard.tsx
"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";

const Container = styled.div`
  padding: 1.5rem;
  max-width: 1000px;
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
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 768px) {
    font-size: 1.5rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  @media (max-width: 480px) {
    font-size: 1.375rem;
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
    font-size: 0.9rem;
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
  font-weight: 500;
  margin-bottom: 1.5rem;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
  }

  @media (max-width: 480px) {
    width: 100%;
    justify-content: center;
    padding: 0.75rem 1rem;
  }
`;

const ModeSelector = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  @media (max-width: 480px) {
    gap: 0.75rem;
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
    text-align: left;
  }
`;

const ModeIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;

  @media (max-width: 480px) {
    font-size: 2.5rem;
    margin-bottom: 0.75rem;
  }
`;

const ModeTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1f2937;

  @media (max-width: 480px) {
    font-size: 1.25rem;
    margin-bottom: 0.375rem;
  }
`;

const ModeDescription = styled.p`
  color: #6b7280;
  margin-bottom: 1rem;
  line-height: 1.5;

  @media (max-width: 480px) {
    font-size: 0.875rem;
    margin-bottom: 0.75rem;
  }
`;

const AITag = styled.span`
  background: #3b82f6;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;

  @media (max-width: 480px) {
    font-size: 0.7rem;
    padding: 0.2rem 0.6rem;
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
  font-size: 0.875rem;

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
    padding: 0.875rem 0.5rem;
    font-size: 0.8rem;
  }

  @media (max-width: 480px) {
    padding: 0.75rem 0.375rem;
    font-size: 0.75rem;
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

const AISuggestionsSection = styled.div`
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    padding: 1.25rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 480px) {
    padding: 1rem;
    margin-bottom: 1rem;
  }
`;

const AISectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;

  @media (max-width: 480px) {
    font-size: 1.125rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
`;

const AISuggestionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.875rem;
  }

  @media (max-width: 480px) {
    gap: 0.75rem;
  }
`;

const AISuggestionCard = styled.div<{ $selected: boolean }>`
  background: white;
  padding: 1.25rem;
  border-radius: 0.5rem;
  border: 2px solid ${(props) => (props.$selected ? "#3b82f6" : "#e2e8f0")};
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    border-color: #3b82f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  }

  @media (max-width: 480px) {
    padding: 1rem;
  }
`;

const SuggestionHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;

  @media (max-width: 480px) {
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
`;

const SuggestionIcon = styled.div`
  font-size: 1.5rem;
  flex-shrink: 0;

  @media (max-width: 480px) {
    font-size: 1.25rem;
  }
`;

const SuggestionContent = styled.div`
  flex: 1;
`;

const SuggestionTitle = styled.h4`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;

  @media (max-width: 480px) {
    font-size: 1rem;
  }
`;

const SuggestionDescription = styled.p`
  color: #475569;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0 0 0.75rem 0;

  @media (max-width: 480px) {
    font-size: 0.8rem;
    line-height: 1.4;
  }
`;

const SuggestionDetails = styled.div`
  background: #f8fafc;
  padding: 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  color: #64748b;

  @media (max-width: 480px) {
    padding: 0.5rem;
    font-size: 0.7rem;
  }
`;

const ConfidenceBadge = styled.div<{ $confidence: "high" | "medium" | "low" }>`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.625rem;
  font-weight: 600;
  background: ${(props) =>
    props.$confidence === "high"
      ? "#dcfce7"
      : props.$confidence === "medium"
      ? "#fef3c7"
      : "#f3f4f6"};
  color: ${(props) =>
    props.$confidence === "high"
      ? "#166534"
      : props.$confidence === "medium"
      ? "#92400e"
      : "#6b7280"};

  @media (max-width: 480px) {
    top: 0.5rem;
    right: 0.5rem;
    font-size: 0.575rem;
    padding: 0.2rem 0.4rem;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;

  @media (max-width: 480px) {
    margin-bottom: 1.25rem;
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
    margin-bottom: 0.375rem;
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
    font-size: 16px; /* Prevents zoom on iOS */
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

  @media (max-width: 768px) {
    flex-direction: column;
  }

  @media (max-width: 480px) {
    margin-top: 1.5rem;
    gap: 0.75rem;
  }
`;

const Button = styled.button<{ $variant: "primary" | "secondary" | "outline" }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  flex: 1;
  font-size: 0.875rem;

  ${(props) =>
    props.$variant === "primary"
      ? `
    background: #3b82f6;
    color: white;
    
    &:hover:not(:disabled) {
      background: #2563eb;
    }
  `
      : props.$variant === "secondary"
      ? `
    background: #10b981;
    color: white;
    
    &:hover:not(:disabled) {
      background: #059669;
    }
  `
      : `
    background: transparent;
    color: #6b7280;
    border: 1px solid #d1d5db;
    
    &:hover:not(:disabled) {
      background: #f3f4f6;
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 480px) {
    padding: 0.875rem 1rem;
    font-size: 0.8rem;
  }
`;

const PreviewCard = styled.div`
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  margin-top: 1rem;

  @media (max-width: 480px) {
    padding: 1.25rem;
    margin-top: 0.75rem;
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
    margin-bottom: 0.75rem;
  }
`;

const PreviewDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr 1fr;
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
    padding: 0.625rem;
  }
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #64748b;
  text-align: center;

  @media (max-width: 480px) {
    padding: 1.5rem;
  }
`;

const ModeFeatures = styled.div`
  font-size: 0.875rem;
  line-height: 1.6;

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`;

interface PromotionsWizardProps {
  barId: string;
}

type PromotionType =
  | "DISCOUNT"
  | "FREE_ITEM"
  | "COMBO"
  | "VIP_ACCESS"
  | "EVENT";
type DiscountType = "PERCENTAGE" | "FIXED";
type TargetAudience =
  | "ALL"
  | "NEW_CUSTOMERS"
  | "RETURNING"
  | "VIP"
  | "WEEKEND"
  | "WEEKDAY";

interface AIPromotionSuggestion {
  id: string;
  title: string;
  description: string;
  type: PromotionType;
  targetAudience: TargetAudience;
  confidence: "high" | "medium" | "low";
  expectedImpact: number;
  reasoning: string[];
  suggestedTitle: string;
  suggestedDescription: string;
  suggestedDiscount?: number;
  suggestedDuration: number;
  icon: string;
}

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

type CreationMode = "ai" | "manual" | null;

const PromotionsWizard = ({ barId }: PromotionsWizardProps) => {
  const [creationMode, setCreationMode] = useState<CreationMode>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<AIPromotionSuggestion | null>(null);
  const [aiSuggestions, setAISuggestions] = useState<AIPromotionSuggestion[]>(
    []
  );
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

  // Different steps based on mode
  const manualSteps = [
    { id: 1, title: "Basic Info" },
    { id: 2, title: "Details" },
    { id: 3, title: "Audience" },
    { id: 4, title: "Review" },
  ];

  const aiSteps = [
    { id: 1, title: "AI Suggestions" },
    { id: 2, title: "Customize" },
    { id: 3, title: "Review" },
  ];

  const steps = creationMode === "ai" ? aiSteps : manualSteps;

  useEffect(() => {
    if (creationMode === "ai") {
      fetchAISuggestions();
    }
  }, [creationMode]);

  const fetchAISuggestions = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockSuggestions: AIPromotionSuggestion[] = [
        {
          id: "1",
          title: "Weekend VIP Experience",
          description:
            "Exclusive VIP packages for your high-value weekend customers",
          type: "VIP_ACCESS",
          targetAudience: "VIP",
          confidence: "high",
          expectedImpact: 23,
          reasoning: [
            "VIP customers spend 45% more on weekends",
            "Current weekend VIP utilization is only 60%",
          ],
          suggestedTitle: "Weekend VIP Lounge Access",
          suggestedDescription:
            "Exclusive VIP experience with premium seating and dedicated service",
          suggestedDuration: 14,
          icon: "👑",
        },
        {
          id: "2",
          title: "Happy Hour Extension",
          description: "Extend happy hour to capture after-work crowd",
          type: "DISCOUNT",
          targetAudience: "WEEKDAY",
          confidence: "medium",
          expectedImpact: 18,
          reasoning: [
            "Foot traffic drops after 7 PM on weekdays",
            "Nearby offices have late finishing times",
          ],
          suggestedTitle: "Extended Happy Hour",
          suggestedDescription: "Enjoy 25% off all drinks from 5 PM to 8 PM",
          suggestedDiscount: 25,
          suggestedDuration: 30,
          icon: "🍻",
        },
        {
          id: "3",
          title: "New Customer Welcome",
          description:
            "Special offer to convert first-time visitors into regulars",
          type: "COMBO",
          targetAudience: "NEW_CUSTOMERS",
          confidence: "high",
          expectedImpact: 32,
          reasoning: [
            "Only 35% of new customers return within 30 days",
            "Welcome offers boost retention by 68%",
          ],
          suggestedTitle: "First Visit Special",
          suggestedDescription: "Welcome! Enjoy 20% off your first order",
          suggestedDiscount: 20,
          suggestedDuration: 7,
          icon: "👋",
        },
      ];

      setAISuggestions(mockSuggestions);
    } catch (error) {
      console.error("Failed to fetch AI suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToModeSelection = () => {
    setCreationMode(null);
    setCurrentStep(1);
    setSelectedSuggestion(null);
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
  };

  const handleSuggestionSelect = (suggestion: AIPromotionSuggestion) => {
    setSelectedSuggestion(suggestion);

    setFormData({
      title: suggestion.suggestedTitle,
      description: suggestion.suggestedDescription,
      type: suggestion.type,
      discountValue: suggestion.suggestedDiscount || 0,
      discountType: "PERCENTAGE",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(
        Date.now() + suggestion.suggestedDuration * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split("T")[0],
      usageLimit: 100,
      targetAudience: suggestion.targetAudience,
      conditions: "Automatically generated by AI",
    });

    setCurrentStep(2);
  };

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
        body: JSON.stringify({
          ...formData,
          aiSuggested: creationMode === "ai",
          originalSuggestion: selectedSuggestion?.id,
        }),
      });

      if (response.ok) {
        alert(
          `Promotion created successfully${
            creationMode === "ai" ? " with AI!" : "!"
          }`
        );
        handleBackToModeSelection();
      } else {
        alert("Failed to create promotion");
      }
    } catch (error) {
      alert("Error creating promotion");
    }
  };

  const renderModeSelection = () => (
    <div>
      <Title>
        {/* <span>🎯</span> Create Promotion */}
        Create Promotion
      </Title>
      <Subtitle>Choose how you&apos;d like to create your promotion</Subtitle>

      <ModeSelector>
        <ModeCard
          $selected={creationMode === "ai"}
          onClick={() => setCreationMode("ai")}
        >
          <ModeIcon>🤖</ModeIcon>
          <ModeTitle>AI Assistant</ModeTitle>
          <AITag>RECOMMENDED</AITag>
          <ModeDescription>
            Get AI-powered suggestions based on your bar&apos;s performance
            data. Perfect for staff with less marketing experience.
          </ModeDescription>
          <ModeFeatures style={{ color: "#10b981", fontWeight: 600 }}>
            • Data-driven suggestions
            <br />
            • Auto-filled forms
            <br />
            • Higher success rate
            <br />• Perfect for beginners
          </ModeFeatures>
        </ModeCard>

        <ModeCard
          $selected={creationMode === "manual"}
          onClick={() => setCreationMode("manual")}
        >
          <ModeIcon>✏️</ModeIcon>
          <ModeTitle>Manual Creation</ModeTitle>
          <ModeDescription>
            Create promotions from scratch with full control over every detail.
            Best for experienced marketers.
          </ModeDescription>
          <ModeFeatures style={{ color: "#6b7280" }}>
            • Full creative control
            <br />
            • Custom everything
            <br />
            • Advanced options
            <br />• For experts
          </ModeFeatures>
        </ModeCard>
      </ModeSelector>
    </div>
  );

  const renderAIStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <AISuggestionsSection>
              <AISectionTitle>
                <span>🤖</span> AI-Powered Suggestions
              </AISectionTitle>
              <p style={{ color: "#475569", marginBottom: "1.5rem" }}>
                Based on your bar&apos;s performance, here are personalized
                promotion suggestions.
              </p>

              {loading ? (
                <LoadingState>
                  <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>
                    🤔
                  </div>
                  <p>AI is analyzing your bar data...</p>
                </LoadingState>
              ) : (
                <AISuggestionsGrid>
                  {aiSuggestions.map((suggestion) => (
                    <AISuggestionCard
                      key={suggestion.id}
                      $selected={selectedSuggestion?.id === suggestion.id}
                      onClick={() => handleSuggestionSelect(suggestion)}
                    >
                      <ConfidenceBadge $confidence={suggestion.confidence}>
                        {suggestion.confidence.toUpperCase()}
                      </ConfidenceBadge>

                      <SuggestionHeader>
                        <SuggestionIcon>{suggestion.icon}</SuggestionIcon>
                        <SuggestionContent>
                          <SuggestionTitle>{suggestion.title}</SuggestionTitle>
                          <SuggestionDescription>
                            {suggestion.description}
                          </SuggestionDescription>
                        </SuggestionContent>
                      </SuggestionHeader>

                      <SuggestionDetails>
                        <strong>Expected Impact: </strong>
                        <span style={{ color: "#10b981", fontWeight: 600 }}>
                          +{suggestion.expectedImpact}% revenue
                        </span>
                      </SuggestionDetails>
                    </AISuggestionCard>
                  ))}
                </AISuggestionsGrid>
              )}
            </AISuggestionsSection>

            <div style={{ textAlign: "center" }}>
              <Button
                $variant="outline"
                onClick={() => setCreationMode("manual")}
              >
                Switch to Manual Creation
              </Button>
            </div>
          </div>
        );

      case 2:
        return renderManualStep(2);

      case 3:
        return renderManualStep(4); // Use manual review step

      default:
        return null;
    }
  };

  const renderManualStep = (step: number) => {
    switch (step) {
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
                <option value="EVENT">Special Event</option>
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
                <option value="WEEKEND">Weekend Customers</option>
                <option value="WEEKDAY">Weekday Customers</option>
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

              {creationMode === "ai" && selectedSuggestion && (
                <div
                  style={{
                    background: "#dcfce7",
                    padding: "0.75rem",
                    borderRadius: "0.375rem",
                    marginBottom: "1rem",
                    fontSize: "0.875rem",
                    color: "#166534",
                  }}
                >
                  <strong>🤖 AI Optimized:</strong> Enhanced with AI based on
                  your bar&apos;s data.
                </div>
              )}

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

  const renderStep = () => {
    if (creationMode === "ai") {
      return renderAIStep();
    } else if (creationMode === "manual") {
      return renderManualStep(currentStep);
    }
    return null;
  };

  if (!creationMode) {
    return <Container>{renderModeSelection()}</Container>;
  }

  return (
    <Container>
      {/* Back Button */}
      <BackButton onClick={handleBackToModeSelection}>
        <span>←</span>
        Back to Mode Selection
      </BackButton>

      <Title>
        {/* <span>🎯</span> Create Promotion */}
        Create Promotion
        {creationMode === "ai" && (
          <AITag style={{ marginLeft: "1rem" }}>AI ASSISTANT</AITag>
        )}
      </Title>
      <Subtitle>
        {creationMode === "ai"
          ? "AI-powered suggestions for better results"
          : "Manual creation with full control"}
      </Subtitle>

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
              $variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous
            </Button>

            {currentStep < steps.length ? (
              <Button $variant="primary" onClick={nextStep}>
                {creationMode === "ai" &&
                currentStep === 1 &&
                selectedSuggestion
                  ? "Customize Suggestion"
                  : "Next"}
              </Button>
            ) : (
              <Button $variant="secondary" onClick={handleSubmit}>
                🚀 Launch Promotion
              </Button>
            )}
          </ButtonGroup>

          {creationMode === "ai" && currentStep === 1 && (
            <div style={{ textAlign: "center", marginTop: "1rem" }}>
              <Button
                $variant="outline"
                onClick={() => setCreationMode("manual")}
              >
                ↶ Switch to Manual Mode
              </Button>
            </div>
          )}
        </WizardContent>
      </WizardContainer>
    </Container>
  );
};

export default PromotionsWizard;
