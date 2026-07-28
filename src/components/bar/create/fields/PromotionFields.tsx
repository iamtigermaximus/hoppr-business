"use client";

import styled from "styled-components";
import { Plus, X } from "lucide-react";
import {
  FormGroup,
  FormGroupWide,
  Label,
  Input,
  Select,
  TextArea,
  InlineRow,
} from "../shared/FormPrimitives";
import { PROMOTION_TYPES } from "../types";

// ---- Types ----

export interface BenefitRow {
  item: string;
  discountedPrice: number;
  originalPrice: number;
  description?: string;
}

interface PromotionFieldsProps {
  promotionType: string;
  discountValue: number | null;
  startDate: string;
  endDate: string;
  targetAudience: string;
  conditions: string;
  promotionBenefits: BenefitRow[];
  onChange: (field: string, value: unknown) => void;
}

const AUDIENCE_OPTIONS = [
  { value: "", label: "All customers" },
  { value: "WEEKEND", label: "Weekend crowd" },
  { value: "WEEKDAY", label: "Weekday visitors" },
  { value: "YOUNG_ADULTS", label: "Young adults (20+)" },
  { value: "VIP", label: "VIP members" },
];

const BenefitsSection = styled.div`
  margin-bottom: 1rem;
`;

const BenefitRowWrapper = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 36px;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  align-items: end;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  background: transparent;
  border: 1px dashed #6366f1;
  color: #818cf8;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: rgba(99, 102, 241, 0.08);
    border-color: #818cf8;
  }
`;

const RemoveButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid #374151;
  color: #9ca3af;
  width: 36px;
  height: 36px;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    color: #ef4444;
    border-color: #ef4444;
  }
`;

const SectionLabel = styled(Label)`
  margin-bottom: 0.75rem;
`;

const SectionHint = styled.p`
  color: #6b7280;
  font-size: 0.75rem;
  margin: 0 0 0.75rem 0;
`;

// ---- Helpers ----

function toDateInput(iso: string): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

// ---- Component ----

export default function PromotionFields({
  promotionType,
  discountValue,
  startDate,
  endDate,
  targetAudience,
  conditions,
  promotionBenefits,
  onChange,
}: PromotionFieldsProps) {
  const handleAddBenefit = () => {
    const updated = [
      ...promotionBenefits,
      { item: "", discountedPrice: 0, originalPrice: 0 },
    ];
    onChange("promotionBenefits", updated);
  };

  const handleBenefitChange = (
    index: number,
    field: keyof BenefitRow,
    value: string | number,
  ) => {
    const updated = promotionBenefits.map((b, i) =>
      i === index ? { ...b, [field]: value } : b,
    );
    onChange("promotionBenefits", updated);
  };

  const handleRemoveBenefit = (index: number) => {
    const updated = promotionBenefits.filter((_, i) => i !== index);
    onChange("promotionBenefits", updated);
  };

  return (
    <>
      <InlineRow>
        <FormGroup>
          <Label>Promotion Type *</Label>
          <Select
            value={promotionType}
            onChange={(e) => onChange("promotionType", e.target.value)}
          >
            <option value="">Select type...</option>
            {PROMOTION_TYPES.map((pt) => (
              <option key={pt.value} value={pt.value}>
                {pt.label}
              </option>
            ))}
          </Select>
        </FormGroup>
        <FormGroup>
          <Label>Discount %</Label>
          <Input
            type="number"
            placeholder="e.g. 20"
            value={discountValue ?? ""}
            onChange={(e) =>
              onChange(
                "discountValue",
                e.target.value ? Number(e.target.value) : null,
              )
            }
            min={0}
            max={100}
          />
        </FormGroup>
      </InlineRow>

      <InlineRow>
        <FormGroup>
          <Label>Start Date *</Label>
          <Input
            type="date"
            value={toDateInput(startDate)}
            onChange={(e) =>
              onChange("startDate", new Date(e.target.value).toISOString())
            }
            required
          />
        </FormGroup>
        <FormGroup>
          <Label>End Date *</Label>
          <Input
            type="date"
            value={toDateInput(endDate)}
            onChange={(e) =>
              onChange("endDate", new Date(e.target.value).toISOString())
            }
            required
          />
        </FormGroup>
      </InlineRow>

      <FormGroupWide>
        <Label>Target Audience</Label>
        <Select
          value={targetAudience}
          onChange={(e) => onChange("targetAudience", e.target.value)}
        >
          {AUDIENCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </FormGroupWide>

      {/* Benefits — structured offer items the customer can redeem */}
      <FormGroupWide>
        <SectionLabel>Benefits (what the customer gets)</SectionLabel>
        <SectionHint>
          Add each discounted item. These appear on the promotion detail page
          and activation screen.
        </SectionHint>

        {promotionBenefits.map((benefit, index) => (
          <BenefitRowWrapper key={index}>
            <div>
              <Input
                placeholder="e.g. Espresso Martini"
                value={benefit.item}
                onChange={(e) =>
                  handleBenefitChange(index, "item", e.target.value)
                }
              />
            </div>
            <div>
              <Input
                type="number"
                placeholder="Discounted €"
                value={benefit.discountedPrice || ""}
                onChange={(e) =>
                  handleBenefitChange(
                    index,
                    "discountedPrice",
                    e.target.value ? Number(e.target.value) : 0,
                  )
                }
                min={0}
              />
            </div>
            <div>
              <Input
                type="number"
                placeholder="Normal €"
                value={benefit.originalPrice || ""}
                onChange={(e) =>
                  handleBenefitChange(
                    index,
                    "originalPrice",
                    e.target.value ? Number(e.target.value) : 0,
                  )
                }
                min={0}
              />
            </div>
            <RemoveButton
              type="button"
              onClick={() => handleRemoveBenefit(index)}
            >
              <X size={14} />
            </RemoveButton>
          </BenefitRowWrapper>
        ))}

        <AddButton type="button" onClick={handleAddBenefit}>
          <Plus size={14} /> Add item
        </AddButton>
      </FormGroupWide>

      <FormGroupWide>
        <Label>Terms & Conditions</Label>
        <TextArea
          placeholder="e.g. Valid ID required. Not combinable with other offers."
          value={conditions}
          onChange={(e) => onChange("conditions", e.target.value)}
        />
      </FormGroupWide>
    </>
  );
}
