"use client";

import styled from "styled-components";
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

interface PromotionFieldsProps {
  promotionType: string;
  discountValue: number | null;
  startDate: string;
  endDate: string;
  targetAudience: string;
  conditions: string;
  onChange: (field: string, value: unknown) => void;
}

const AUDIENCE_OPTIONS = [
  { value: "", label: "All customers" },
  { value: "WEEKEND", label: "Weekend crowd" },
  { value: "WEEKDAY", label: "Weekday visitors" },
  { value: "YOUNG_ADULTS", label: "Young adults (20+)" },
  { value: "VIP", label: "VIP members" },
];

// ---- Helpers ----

function toDateInput(iso: string): string {
  if (!iso) return "";
  return iso.slice(0, 10); // "2026-05-31"
}

// ---- Component ----

export default function PromotionFields({
  promotionType,
  discountValue,
  startDate,
  endDate,
  targetAudience,
  conditions,
  onChange,
}: PromotionFieldsProps) {
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
