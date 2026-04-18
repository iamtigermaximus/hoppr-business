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
  background: #3b82f6;
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
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 2px solid #e5e7eb;

  @media (max-width: 768px) {
    margin-top: 2rem;
    padding-top: 1.5rem;
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
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.5rem;
  overflow-x: auto;

  @media (max-width: 640px) {
    gap: 0.25rem;
  }
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 0.75rem 1.5rem;
  background: ${(props) => (props.$active ? "#3b82f6" : "transparent")};
  color: ${(props) => (props.$active ? "white" : "#6b7280")};
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
  min-height: 44px;

  &:hover {
    background: ${(props) => (props.$active ? "#2563eb" : "#f3f4f6")};
  }

  @media (max-width: 640px) {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
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

const PromotionsWizard = ({
  barId,
  userRole = "STAFF",
}: PromotionsWizardProps) => {
  const [mode, setMode] = useState<"ai" | "manual" | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [promotions, setPromotions] = useState<ExistingPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
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
  const canApprove = ["OWNER", "MANAGER", "PROMOTIONS_MANAGER"].includes(
    userRole,
  );
  const canDelete = ["OWNER", "MANAGER", "PROMOTIONS_MANAGER"].includes(
    userRole,
  );

  // Fetch existing promotions on load
  useEffect(() => {
    fetchPromotions();
  }, [barId]);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("hoppr_token");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        `/api/auth/bar/${barId}/promotions?status=all`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.promotions) {
          setPromotions(data.promotions);
        }
      }
    } catch (error) {
      console.error("Failed to fetch promotions:", error);
    } finally {
      setLoading(false);
    }
  };

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

  // Filter promotions based on active tab
  const getFilteredPromotions = () => {
    if (activeTab === "all") return promotions;
    return promotions.filter((p) => getPromotionStatus(p) === activeTab);
  };

  // Get counts for tabs
  const getTabCounts = () => {
    const counts = {
      all: promotions.length,
      pending: promotions.filter((p) => getPromotionStatus(p) === "pending")
        .length,
      active: promotions.filter((p) => getPromotionStatus(p) === "active")
        .length,
      expired: promotions.filter((p) => getPromotionStatus(p) === "expired")
        .length,
    };
    return counts;
  };

  const counts = getTabCounts();

  // Render Modal
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
                <strong>"{modal.promotionTitle}"</strong>?
                <br />
                This action cannot be undone.
              </>
            ) : (
              <>
                Are you sure you want to approve{" "}
                <strong>"{modal.promotionTitle}"</strong>?
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

  // Render Tabs
  const renderTabs = () => (
    <TabsContainer>
      <Tab $active={activeTab === "all"} onClick={() => setActiveTab("all")}>
        All
        <TabCount $color="gray">{counts.all}</TabCount>
      </Tab>
      <Tab
        $active={activeTab === "pending"}
        onClick={() => setActiveTab("pending")}
      >
        ⏳ Pending
        <TabCount $color="orange">{counts.pending}</TabCount>
      </Tab>
      <Tab
        $active={activeTab === "active"}
        onClick={() => setActiveTab("active")}
      >
        ✓ Active
        <TabCount $color="green">{counts.active}</TabCount>
      </Tab>
      <Tab
        $active={activeTab === "expired"}
        onClick={() => setActiveTab("expired")}
      >
        📅 Expired
        <TabCount $color="red">{counts.expired}</TabCount>
      </Tab>
    </TabsContainer>
  );

  // Render existing promotions list
  const renderPromotionsList = () => {
    if (loading) {
      return (
        <PromotionsSection>
          <SectionTitle>Your Promotions</SectionTitle>
          {renderTabs()}
          <LoadingSpinner>Loading your promotions...</LoadingSpinner>
        </PromotionsSection>
      );
    }

    const filteredPromotions = getFilteredPromotions();

    return (
      <PromotionsSection>
        <SectionTitle>Your Promotions</SectionTitle>
        {renderTabs()}

        {filteredPromotions.length === 0 ? (
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
            {filteredPromotions.map((promo) => {
              const status = getPromotionStatus(promo);
              return (
                <PromotionCard key={promo.id} $status={status}>
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
                    {promo.description.length > 100
                      ? `${promo.description.substring(0, 100)}...`
                      : promo.description}
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
      </PromotionsSection>
    );
  };

  const renderModeSelection = () => (
    <div>
      <Title>🎯 Create Promotion</Title>
      <Subtitle>Choose how you&apos;d like to create your promotion</Subtitle>

      <ModeSelector>
        <ModeCard $selected={mode === "ai"} onClick={() => setMode("ai")}>
          <ModeIcon>🤖</ModeIcon>
          <ModeTitle>AI Assistant</ModeTitle>
          <AITag>COMING SOON</AITag>
          <ModeDescription>
            Get AI-powered suggestions based on your bar&apos;s performance
          </ModeDescription>
          <ModeFeatures>
            • Data-driven suggestions
            <br />• Auto-filled forms
            <br />• Higher success rate
          </ModeFeatures>
        </ModeCard>

        <ModeCard
          $selected={mode === "manual"}
          onClick={() => setMode("manual")}
        >
          <ModeIcon>✏️</ModeIcon>
          <ModeTitle>Manual Creation</ModeTitle>
          <ModeDescription>
            Create promotions from scratch with full control
          </ModeDescription>
          <ModeFeatures>
            • Full creative control
            <br />• Custom everything
            <br />• For experts
          </ModeFeatures>
        </ModeCard>
      </ModeSelector>

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

  if (!mode) {
    return (
      <>
        <Container>{renderModeSelection()}</Container>
        {renderModal()}
      </>
    );
  }

  if (mode === "ai") {
    return (
      <>
        <Container>
          <BackButton onClick={() => setMode(null)}>
            ← Back to Mode Selection
          </BackButton>
          <Title>AI Assistant</Title>
          <Subtitle>Coming soon! Please use manual creation for now.</Subtitle>
          <ButtonGroup>
            <Button $variant="primary" onClick={() => setMode("manual")}>
              Switch to Manual Creation
            </Button>
            <Button $variant="outline" onClick={() => setMode(null)}>
              Back
            </Button>
          </ButtonGroup>
        </Container>
        {renderModal()}
      </>
    );
  }

  return (
    <>
      <Container>
        <BackButton onClick={() => setMode(null)}>
          ← Back to Mode Selection
        </BackButton>

        <Title>Create Promotion</Title>
        <Subtitle>Manual creation with full control</Subtitle>

        {error && <ErrorMessage>❌ {error}</ErrorMessage>}
        {success && <SuccessMessage>✅ {success}</SuccessMessage>}

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
            {renderManualWizard()}

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
                  Next
                </Button>
              ) : (
                <Button
                  $variant="secondary"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? "Creating..." : "Create Draft Promotion"}
                </Button>
              )}
            </ButtonGroup>
          </WizardContent>
        </WizardContainer>
      </Container>
      {renderModal()}
    </>
  );
};

export default PromotionsWizard;
