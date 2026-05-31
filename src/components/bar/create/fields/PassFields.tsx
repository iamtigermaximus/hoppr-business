"use client";

import styled from "styled-components";
import {
  FormGroup,
  FormGroupWide,
  Label,
  Input,
  Select,
  InlineRow,
  DayCheckGrid,
  DayChip,
} from "../shared/FormPrimitives";

// ---- Types ----

interface PassFieldsProps {
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
  onChange: (field: string, value: unknown) => void;
}

const PASS_TYPES = [
  { value: "SKIP_LINE", label: "Skip Line" },
  { value: "VIP_AREA", label: "VIP Area Access" },
  { value: "DRINK_PACKAGE", label: "Drink Package" },
  { value: "COVER_INCLUDED", label: "Cover Fee Included" },
  { value: "TABLE_SERVICE", label: "Table Service" },
  { value: "ALL_INCLUSIVE", label: "All Inclusive" },
];

const REDEMPTION_MODES = [
  { value: "SINGLE_USE", label: "Single Use" },
  { value: "ONCE_PER_DAY", label: "Once Per Day" },
  { value: "MULTI_USE", label: "Multi Use" },
  { value: "LIMITED_MULTI", label: "Limited Multi" },
];

const ALL_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// ---- Helpers ----

function toggleDay(day: string, current: string[]): string[] {
  return current.includes(day)
    ? current.filter((d) => d !== day)
    : [...current, day];
}

function toggleBenefit(benefit: string, current: string[]): string[] {
  return current.includes(benefit)
    ? current.filter((b) => b !== benefit)
    : [...current, benefit];
}

const PRESET_BENEFITS = [
  "Skip line priority",
  "VIP area access",
  "Welcome drink included",
  "Cover fee waived",
  "Table service",
  "Exclusive menu",
  "Priority entry",
  "Free cloakroom",
];

// ---- Component ----

export default function PassFields({
  passType,
  priceEuros,
  originalPriceEuros,
  benefits,
  validDays,
  totalQuantity,
  maxPerUser,
  redemptionMode,
  maxRedemptions,
  skipLinePriority,
  coverFeeIncluded,
  coverFeeAmount,
  onChange,
}: PassFieldsProps) {
  return (
    <>
      <InlineRow>
        <FormGroup>
          <Label>Pass Type *</Label>
          <Select
            value={passType}
            onChange={(e) => onChange("passType", e.target.value)}
          >
            <option value="">Select type...</option>
            {PASS_TYPES.map((pt) => (
              <option key={pt.value} value={pt.value}>
                {pt.label}
              </option>
            ))}
          </Select>
        </FormGroup>
        <FormGroup>
          <Label>Redemption Mode</Label>
          <Select
            value={redemptionMode}
            onChange={(e) => onChange("redemptionMode", e.target.value)}
          >
            {REDEMPTION_MODES.map((rm) => (
              <option key={rm.value} value={rm.value}>
                {rm.label}
              </option>
            ))}
          </Select>
        </FormGroup>
      </InlineRow>

      <InlineRow>
        <FormGroup>
          <Label>Price (€) *</Label>
          <Input
            type="text"
            placeholder="e.g. 19.90"
            value={priceEuros}
            onChange={(e) => onChange("priceEuros", e.target.value)}
            required
          />
        </FormGroup>
        <FormGroup>
          <Label>Original Price (€)</Label>
          <Input
            type="text"
            placeholder="e.g. 29.90"
            value={originalPriceEuros}
            onChange={(e) => onChange("originalPriceEuros", e.target.value)}
          />
        </FormGroup>
      </InlineRow>

      <FormGroupWide>
        <Label>Benefits</Label>
        <DayCheckGrid>
          {PRESET_BENEFITS.map((benefit) => (
            <DayChip
              key={benefit}
              type="button"
              $selected={benefits.includes(benefit)}
              onClick={() =>
                onChange("benefits", toggleBenefit(benefit, benefits))
              }
            >
              {benefits.includes(benefit) ? "✓ " : "+ "}
              {benefit}
            </DayChip>
          ))}
        </DayCheckGrid>
      </FormGroupWide>

      <FormGroupWide>
        <Label>Valid Days</Label>
        <DayCheckGrid>
          {ALL_DAYS.map((day) => (
            <DayChip
              key={day}
              type="button"
              $selected={validDays.includes(day)}
              onClick={() => onChange("validDays", toggleDay(day, validDays))}
            >
              {day.slice(0, 3)}
            </DayChip>
          ))}
        </DayCheckGrid>
      </FormGroupWide>

      <InlineRow>
        <FormGroup>
          <Label>Total Quantity *</Label>
          <Input
            type="number"
            placeholder="e.g. 100"
            value={totalQuantity ?? ""}
            onChange={(e) =>
              onChange(
                "totalQuantity",
                e.target.value ? Number(e.target.value) : null,
              )
            }
            min={1}
            required
          />
        </FormGroup>
        <FormGroup>
          <Label>Max Per User</Label>
          <Input
            type="number"
            placeholder="1"
            value={maxPerUser}
            onChange={(e) =>
              onChange("maxPerUser", Number(e.target.value) || 1)
            }
            min={1}
          />
        </FormGroup>
      </InlineRow>

      {redemptionMode === "LIMITED_MULTI" && (
        <FormGroup>
          <Label>Max Redemptions</Label>
          <Input
            type="number"
            placeholder="e.g. 10"
            value={maxRedemptions ?? ""}
            onChange={(e) =>
              onChange(
                "maxRedemptions",
                e.target.value ? Number(e.target.value) : null,
              )
            }
            min={1}
          />
        </FormGroup>
      )}

      <InlineRow>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
          <input
            type="checkbox"
            checked={skipLinePriority}
            onChange={(e) => onChange("skipLinePriority", e.target.checked)}
          />
          Skip Line Priority
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
          <input
            type="checkbox"
            checked={coverFeeIncluded}
            onChange={(e) => onChange("coverFeeIncluded", e.target.checked)}
          />
          Cover Fee Included
        </label>
      </InlineRow>

      {coverFeeIncluded && (
        <FormGroup>
          <Label>Cover Fee Amount (€)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="e.g., 5.00"
            value={coverFeeAmount || ""}
            onChange={(e) =>
              onChange("coverFeeAmount", parseFloat(e.target.value) || 0)
            }
          />
        </FormGroup>
      )}
    </>
  );
}
