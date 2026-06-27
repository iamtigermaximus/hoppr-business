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
  FieldHint,
} from "../shared/FormPrimitives";

// ---- Types ----

interface AdCampaignFieldsProps {
  campaignType: string;
  campaignBudget: number;
  campaignStartDate: string;
  campaignEndDate: string;
  promotedItemId: string;
  targetUrl: string;
  onChange: (field: string, value: unknown) => void;
}

const CAMPAIGN_TYPES = [
  { value: "FEATURED_LISTING", label: "Featured Listing", desc: "Your bar appears at the top of discovery results" },
  { value: "BANNER_AD", label: "Banner Ad", desc: "Display banner in the app feed or homepage" },
  { value: "BOOSTED_PROMO", label: "Boosted Promotion", desc: "Amplify an existing promotion to more users" },
  { value: "SPONSORED_EVENT", label: "Sponsored Event", desc: "Feature your event prominently in the feed" },
];

// ---- Helpers ----

function toDateInput(iso: string): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

// ---- Styled ----

const CampaignTypeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
  margin-top: 0.25rem;
`;

const CampaignTypeCard = styled.button<{ $selected: boolean }>`
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 2px solid ${({ $selected }) => ($selected ? "#7c3aed" : "#e5e7eb")};
  background: ${({ $selected }) => ($selected ? "#f5f3ff" : "white")};
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: all 0.15s;

  &:hover {
    border-color: #7c3aed;
  }
`;

const CampaignTypeTitle = styled.div`
  font-size: 0.8125rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.125rem;
`;

const CampaignTypeDesc = styled.div`
  font-size: 0.6875rem;
  color: #6b7280;
  line-height: 1.4;
`;

const BudgetSlider = styled.input`
  width: 100%;
  margin-top: 0.25rem;
`;

const BudgetValue = styled.span`
  font-size: 0.875rem;
  font-weight: 700;
  color: #7c3aed;
  white-space: nowrap;
`;

const BudgetSummary = styled.div`
  background: #f5f3ff;
  border: 1px solid #ddd6fe;
  border-radius: 0.5rem;
  padding: 0.625rem 0.75rem;
  font-size: 0.75rem;
  color: #5b21b6;
  line-height: 1.5;
  margin-top: 0.5rem;
`;

// ---- Component ----

export default function AdCampaignFields({
  campaignType,
  campaignBudget,
  campaignStartDate,
  campaignEndDate,
  promotedItemId,
  targetUrl,
  onChange,
}: AdCampaignFieldsProps) {
  const estimatedImpressions = Math.round(campaignBudget * 200); // ~200 impressions per euro
  const estimatedClicks = Math.round(estimatedImpressions * 0.03); // ~3% CTR

  return (
    <>
      <FormGroupWide>
        <Label>Campaign Type *</Label>
        <CampaignTypeGrid>
          {CAMPAIGN_TYPES.map((ct) => (
            <CampaignTypeCard
              key={ct.value}
              $selected={campaignType === ct.value}
              onClick={() => onChange("campaignType", ct.value)}
            >
              <CampaignTypeTitle>{ct.label}</CampaignTypeTitle>
              <CampaignTypeDesc>{ct.desc}</CampaignTypeDesc>
            </CampaignTypeCard>
          ))}
        </CampaignTypeGrid>
        <FieldHint>
          Choose how your ad will appear to Hoppr users. All campaigns support
          images and must comply with Finnish alcohol marketing rules.
        </FieldHint>
      </FormGroupWide>

      <FormGroupWide>
        <Label>Campaign Budget (€) *</Label>
        <InlineRow>
          <BudgetSlider
            type="range"
            min={10}
            max={500}
            step={10}
            value={campaignBudget}
            onChange={(e) => onChange("campaignBudget", Number(e.target.value))}
          />
          <BudgetValue>€{campaignBudget}</BudgetValue>
        </InlineRow>
        <BudgetSummary>
          Estimated reach: ~{estimatedImpressions.toLocaleString()} impressions,
          ~{estimatedClicks.toLocaleString()} clicks &middot; You only pay when users
          engage. Unused budget rolls over.
        </BudgetSummary>
      </FormGroupWide>

      <InlineRow>
        <FormGroup>
          <Label>Start Date *</Label>
          <Input
            type="date"
            value={toDateInput(campaignStartDate)}
            onChange={(e) =>
              onChange(
                "campaignStartDate",
                e.target.value ? new Date(e.target.value).toISOString() : "",
              )
            }
            required
          />
        </FormGroup>
        <FormGroup>
          <Label>End Date *</Label>
          <Input
            type="date"
            value={toDateInput(campaignEndDate)}
            onChange={(e) =>
              onChange(
                "campaignEndDate",
                e.target.value ? new Date(e.target.value).toISOString() : "",
              )
            }
            required
          />
        </FormGroup>
      </InlineRow>

      <FormGroupWide>
        <Label>Target URL (optional)</Label>
        <Input
          type="url"
          placeholder="https://your-bar.com/special-offer"
          value={targetUrl}
          onChange={(e) => onChange("targetUrl", e.target.value)}
        />
        <FieldHint>
          Where users go when they tap your ad. Leave empty to link to your bar
          page in Hoppr.
        </FieldHint>
      </FormGroupWide>

      <FormGroupWide>
        <Label>Promoted Item ID (optional)</Label>
        <Input
          type="text"
          placeholder="Paste an existing promotion or event ID"
          value={promotedItemId}
          onChange={(e) => onChange("promotedItemId", e.target.value)}
        />
        <FieldHint>
          Link this campaign to an existing promotion or event for tracking. Leave
          empty for a standalone brand campaign.
        </FieldHint>
      </FormGroupWide>
    </>
  );
}
