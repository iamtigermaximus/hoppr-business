"use client";

import { useState, useCallback, useMemo } from "react";
import type { ContentType, FormState } from "./types";
import { PROMOTION_TYPES } from "./types";
import { getImageUrl } from "@/lib/cloudinary-url";

// ---- Types ----

interface FieldDefinition {
  key: string;
  label: string;
  prompt: string;
  hint: string;
  required: boolean;
  forTypes: ContentType[];
  skipIfFilled?: boolean;
  inputType: "image" | "datetime" | "date" | "number" | "text" | "textarea" | "select" | "toggle" | "multitext";
  selectOptions?: { value: string; label: string }[];
  placeholder?: string;
}

// ---- Field definitions ----

const CAMPAIGN_TYPES = [
  { value: "FEATURED_LISTING", label: "Featured Listing — top of the feed" },
  { value: "BANNER_AD", label: "Banner Ad — visual display ad" },
  { value: "BOOSTED_PROMO", label: "Boosted Promo — amplify a promotion" },
  { value: "SPONSORED_EVENT", label: "Sponsored Event — highlight an event" },
];

const PASS_TYPES = [
  { value: "SKIP_LINE", label: "Skip the Line" },
  { value: "COVER_INCLUDED", label: "Cover Fee Included" },
  { value: "PREMIUM_ENTRY", label: "Premium Entry" },
  { value: "DRINK_PACKAGE", label: "Drink Package" },
];

const EVENT_FIELDS: FieldDefinition[] = [
  {
    key: "imageUrl", label: "Event Image", prompt: "Add a cover image",
    hint: "Use your bar's cover photo or upload a custom image. It appears on the event card and social shares. Focus on atmosphere — not alcohol.",
    required: false, forTypes: ["event"], inputType: "image", skipIfFilled: true,
  },
  {
    key: "startTime", label: "Start Time", prompt: "When does this event begin?",
    hint: "Pick the date and time. This is what customers see first on the card.",
    required: true, forTypes: ["event"], inputType: "datetime",
  },
  {
    key: "endTime", label: "End Time", prompt: "When does it wrap up?",
    hint: "Optional. Skip if you want the card to show only the start time.",
    required: false, forTypes: ["event"], inputType: "datetime",
  },
  {
    key: "maxAttendees", label: "Capacity", prompt: "How many people can attend?",
    hint: "Leave empty for unlimited — the card shows 'Be the first' to encourage arrivals.",
    required: false, forTypes: ["event"], inputType: "number", placeholder: "e.g. 100",
  },
  {
    key: "isPrivate", label: "Visibility", prompt: "Should this event be private?",
    hint: "Private events are hidden from the public feed. Only people with the link can see them. Good for invite-only gatherings.",
    required: false, forTypes: ["event"], inputType: "toggle",
  },
];

const PROMOTION_FIELDS: FieldDefinition[] = [
  {
    key: "imageUrl", label: "Promotion Image", prompt: "Add a photo",
    hint: "Use your bar's cover photo or upload custom. Real bar photos outperform stock images. Food-focused imagery avoids alcohol advertising restrictions.",
    required: false, forTypes: ["promotion"], inputType: "image", skipIfFilled: true,
  },
  {
    key: "promotionType", label: "Promotion Type", prompt: "What kind of promotion?",
    hint: "Food Specials have no alcohol advertising restrictions under Finnish law — the safest choice. 'After-Work' is preferred over 'Happy Hour'.",
    required: true, forTypes: ["promotion"], inputType: "select", selectOptions: PROMOTION_TYPES,
  },
  {
    key: "discountValue", label: "Value Offer", prompt: "Any discount or special value? (%)",
    hint: "Food & cover discounts are fine. Alcohol price discounts are prohibited under the Alcohol Act (§50). For drink-related promos, leave this blank — promote the experience instead.",
    required: false, forTypes: ["promotion"], inputType: "number", placeholder: "e.g. 20 (food/cover only)",
  },
  {
    key: "startDate", label: "Start Date", prompt: "When does it start?",
    hint: "Defaults to today. Promotions built around atmosphere and experience age better than price-focused ones.",
    required: true, forTypes: ["promotion"], inputType: "date",
  },
  {
    key: "endDate", label: "End Date", prompt: "When does it end?",
    hint: "Defaults to one week from today.",
    required: true, forTypes: ["promotion"], inputType: "date",
  },
  {
    key: "conditions", label: "Terms", prompt: "Any special terms?",
    hint: "Never include: free alcohol, BOGO, quantity discounts, student discounts, alcohol giveaways, prize draws linked to alcohol. Good example: 'Weekdays 16–19. Valid with ID. 20+ only.'",
    required: false, forTypes: ["promotion"], inputType: "textarea", placeholder: "e.g. Weekdays 16–19. Valid with ID. 20+ only.",
  },
];

const CAMPAIGN_FIELDS: FieldDefinition[] = [
  {
    key: "campaignType", label: "Campaign Type", prompt: "How should we feature your bar?",
    hint: "Featured Listing: top of feed. Banner Ad: visual display. Boosted Promo: amplify existing. Sponsored Event: highlight an event.",
    required: true, forTypes: ["campaign"], inputType: "select", selectOptions: CAMPAIGN_TYPES,
  },
  {
    key: "campaignBudget", label: "Budget", prompt: "What's your budget? (€)",
    hint: "Start at 50 € for a week. Higher budgets get more impressions. Adjust anytime.",
    required: true, forTypes: ["campaign"], inputType: "number", placeholder: "50",
  },
  {
    key: "campaignStartDate", label: "Start Date", prompt: "When should it start?",
    hint: "Defaults to today. Time it to your busiest days for impact.",
    required: false, forTypes: ["campaign"], inputType: "date",
  },
  {
    key: "campaignEndDate", label: "End Date", prompt: "When should it end?",
    hint: "Defaults to one week. Longer = more reach; shorter = more urgency.",
    required: false, forTypes: ["campaign"], inputType: "date",
  },
];

const PASS_FIELDS: FieldDefinition[] = [
  {
    key: "passType", label: "Pass Type", prompt: "What kind of pass?",
    hint: "Skip the Line lets customers bypass queues. Cover Included bundles entry. Premium Entry gives priority treatment.",
    required: true, forTypes: ["pass"], inputType: "select", selectOptions: PASS_TYPES,
  },
  {
    key: "priceEuros", label: "Price", prompt: "How much does the pass cost? (€)",
    hint: "Leave blank if free. Passes with prices sell better when perceived value exceeds cost.",
    required: false, forTypes: ["pass"], inputType: "number", placeholder: "e.g. 10",
  },
  {
    key: "totalQuantity", label: "Quantity", prompt: "How many passes available?",
    hint: "Leave empty for unlimited. Limited quantities create scarcity — passes sell faster.",
    required: false, forTypes: ["pass"], inputType: "number", placeholder: "e.g. 50",
  },
  {
    key: "benefits", label: "Benefits", prompt: "What benefits come with the pass?",
    hint: "Add perks like 'Priority entry', 'Skip the line', 'Reserved seating'. One per line.",
    required: false, forTypes: ["pass"], inputType: "multitext", placeholder: "Priority entry\nSkip the line",
  },
];

const FIELDS_BY_TYPE: Record<ContentType, FieldDefinition[]> = {
  event: EVENT_FIELDS,
  promotion: PROMOTION_FIELDS,
  campaign: CAMPAIGN_FIELDS,
  pass: PASS_FIELDS,
  brand: [],
};

// ---- Helpers ----

function getFieldValue(formState: FormState, key: string): unknown {
  if (key === "isPrivate") return formState.isPrivate;
  if (key === "benefits") return formState.benefits;
  if (key === "maxAttendees") return formState.maxAttendees;
  return (formState as unknown as Record<string, unknown>)[key] ?? "";
}

function hasValue(formState: FormState, key: string): boolean {
  const val = getFieldValue(formState, key);
  if (val === null || val === undefined || val === "") return false;
  if (typeof val === "boolean") return true;
  if (typeof val === "number") return val > 0 || val === 0;
  if (Array.isArray(val)) return val.length > 0;
  return true;
}

// ---- Component ----

interface FieldGuideProps {
  contentType: ContentType;
  formState: FormState;
  onChange: (field: string, value: unknown) => void;
  barCoverImage?: string | null;
  barId?: string;
  onComplete: () => void;
}

export default function FieldGuide({
  contentType,
  formState,
  onChange,
  barCoverImage,
  barId,
  onComplete,
}: FieldGuideProps) {
  const fields = useMemo(() => FIELDS_BY_TYPE[contentType] || [], [contentType]);

  const guideFields = useMemo(
    () =>
      fields.filter((f) => {
        if (!f.skipIfFilled) return true;
        return !hasValue(formState, f.key);
      }),
    [fields, formState],
  );

  const [currentIdx, setCurrentIdx] = useState(0);
  const currentField = guideFields[currentIdx] || null;

  const handleNext = useCallback(() => {
    if (currentIdx < guideFields.length - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      onComplete();
    }
  }, [currentIdx, guideFields.length, onComplete]);

  const handleBack = useCallback(() => {
    if (currentIdx > 0) setCurrentIdx((i) => i - 1);
  }, [currentIdx]);

  const handleSkip = useCallback(() => {
    handleNext();
  }, [handleNext]);

  const progress = guideFields.length > 0
    ? Math.round(((currentIdx + 1) / guideFields.length) * 100)
    : 100;

  if (!currentField) {
    return (
      <div style={styles.complete}>
        <div style={styles.completeIcon}>✓</div>
        <div style={styles.completeTitle}>All details filled in</div>
        <div style={styles.completeSub}>
          You've completed all fields for this {contentType}. Continue to review and publish.
        </div>
        <button style={styles.continueBtn} onClick={onComplete}>
          Continue to Review →
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Progress */}
      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>
      <div style={styles.progressLabel}>
        Step {currentIdx + 1} of {guideFields.length}
      </div>

      {/* Card */}
      <div style={styles.fieldCard}>
        {/* Header */}
        <div style={styles.fieldHeader}>
          <span style={styles.fieldNumber}>{currentIdx + 1}</span>
          <div style={{ flex: 1 }}>
            <div style={styles.fieldPrompt}>{currentField.prompt}</div>
            <div style={styles.fieldHint}>{currentField.hint}</div>
          </div>
          {!currentField.required && (
            <span style={styles.optionalBadge}>optional</span>
          )}
        </div>

        {/* Input */}
        <div style={styles.fieldInput}>
          <FieldInput
            field={currentField}
            value={getFieldValue(formState, currentField.key)}
            onChange={(v) => onChange(currentField.key, v)}
            barCoverImage={barCoverImage}
            barId={barId}
            formState={formState}
          />
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <button style={styles.backBtn} onClick={handleBack} disabled={currentIdx === 0}>
            ← Back
          </button>
          <div style={styles.actionsRight}>
            {!currentField.required && (
              <button style={styles.skipBtn} onClick={handleSkip}>
                Skip for now
              </button>
            )}
            <button
              style={{
                ...styles.nextBtn,
                ...(currentField.required && !hasValue(formState, currentField.key)
                  ? styles.nextBtnDisabled
                  : {}),
              }}
              onClick={handleNext}
              disabled={currentField.required && !hasValue(formState, currentField.key)}
            >
              {currentIdx < guideFields.length - 1 ? "Continue →" : "Done →"}
            </button>
          </div>
        </div>
      </div>

      {/* Mini-dots */}
      <div style={styles.miniNav}>
        {guideFields.map((f, i) => (
          <div
            key={f.key}
            style={{
              ...styles.miniDot,
              ...(i === currentIdx ? styles.miniDotCurrent : {}),
              ...(hasValue(formState, f.key) || i < currentIdx ? styles.miniDotFilled : {}),
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ---- Field Input Renderer ----

function FieldInput({
  field,
  value,
  onChange,
  barCoverImage,
  barId,
  formState,
}: {
  field: FieldDefinition;
  value: unknown;
  onChange: (v: unknown) => void;
  barCoverImage?: string | null;
  barId?: string;
  formState: FormState;
}) {
  switch (field.inputType) {
    case "image":
      return (
        <div style={inputStyles.imageContainer}>
          {barCoverImage && !value && (
            <button
              style={inputStyles.useCoverBtn}
              onClick={() => onChange(barCoverImage)}
              type="button"
            >
              <span style={inputStyles.useCoverIcon}>📸</span>
              <div style={{ textAlign: "left" }}>
                <div style={inputStyles.useCoverTitle}>Use bar cover photo</div>
                <div style={inputStyles.useCoverSub}>Your bar's cover image — looks great instantly</div>
              </div>
              <span style={inputStyles.useCoverArrow}>→</span>
            </button>
          )}
          {typeof value === "string" && value && (
            <div style={inputStyles.preview}>
              <img src={getImageUrl(value as string, 400)} alt="Preview" style={inputStyles.previewImg} />
              <div style={inputStyles.previewInfo}>
                <span style={inputStyles.previewLabel}>✓ Image selected</span>
                <button style={inputStyles.removeBtn} onClick={() => onChange(null)} type="button">
                  Remove
                </button>
              </div>
            </div>
          )}
          {/* Native file input fallback */}
          {!value && !barCoverImage && (
            <div style={inputStyles.uploadZone}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => onChange(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
                style={inputStyles.fileInput}
              />
              <div style={inputStyles.uploadIcon}>🖼️</div>
              <div style={inputStyles.uploadText}>Click to upload an image</div>
              <div style={inputStyles.uploadSub}>PNG, JPG, or WebP — up to 5 MB</div>
            </div>
          )}
        </div>
      );

    case "datetime":
      return (
        <input
          type="datetime-local"
          value={typeof value === "string" ? value.slice(0, 16) : ""}
          onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : "")}
          style={inputStyles.input}
          placeholder={field.placeholder}
        />
      );

    case "date":
      return (
        <input
          type="date"
          value={typeof value === "string" ? value.slice(0, 10) : ""}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyles.input}
        />
      );

    case "number":
      return (
        <>
          <input
            type="number"
            value={typeof value === "number" && value > 0 ? value : ""}
            onChange={(e) => {
              const n = e.target.value ? Number(e.target.value) : null;
              onChange(n);
            }}
            style={inputStyles.input}
            placeholder={field.placeholder}
            min={0}
          />
          {field.key === "discountValue" &&
            ["DRINK_SPECIAL", "HAPPY_HOUR", "LADIES_NIGHT"].includes(
              String(formState.promotionType ?? ""),
            ) && (
              <div style={inputStyles.complianceWarn}>
                ⚠️ Alcohol price discounts are prohibited under the Alcohol Act §50.
                Use this only for food or cover charge discounts.
              </div>
            )}
        </>
      );

    case "text":
      return (
        <input
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyles.input}
          placeholder={field.placeholder}
        />
      );

    case "textarea":
      return (
        <textarea
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyles.textarea}
          placeholder={field.placeholder}
          rows={3}
        />
      );

    case "select":
      return (
        <select
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyles.select}
        >
          <option value="">Select…</option>
          {field.selectOptions?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );

    case "toggle":
      return (
        <div style={inputStyles.toggleContainer}>
          <button
            type="button"
            style={{
              ...inputStyles.toggleOption,
              ...(!value ? inputStyles.toggleOptionActive : {}),
            }}
            onClick={() => onChange(false)}
          >
            <span style={inputStyles.toggleIcon}>🌐</span>
            <div>
              <div style={inputStyles.toggleTitle}>Public</div>
              <div style={inputStyles.toggleDesc}>Visible on the Hoppr feed. Gets more reach.</div>
            </div>
          </button>
          <button
            type="button"
            style={{
              ...inputStyles.toggleOption,
              ...(value ? inputStyles.toggleOptionActive : {}),
            }}
            onClick={() => onChange(true)}
          >
            <span style={inputStyles.toggleIcon}>🔒</span>
            <div>
              <div style={inputStyles.toggleTitle}>Private</div>
              <div style={inputStyles.toggleDesc}>Hidden from feed. Link-only access. Good for invite-only.</div>
            </div>
          </button>
        </div>
      );

    case "multitext":
      return (
        <textarea
          value={Array.isArray(value) ? value.join("\n") : ""}
          onChange={(e) => {
            const lines = e.target.value.split("\n").filter((l) => l.trim());
            onChange(lines);
          }}
          style={inputStyles.textarea}
          placeholder={field.placeholder}
          rows={4}
        />
      );

    default:
      return null;
  }
}

// ---- Styles ----

const styles: Record<string, React.CSSProperties> = {
  container: { display: "flex", flexDirection: "column", gap: 16 },
  progressBar: { height: 4, background: "#e5e7eb", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", background: "#7c3aed", borderRadius: 2, transition: "width 0.3s ease" },
  progressLabel: { fontSize: 12, fontWeight: 500, color: "#6b7280", textAlign: "center" },
  fieldCard: { background: "white", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" },
  fieldHeader: { display: "flex", gap: 12, alignItems: "flex-start", padding: "16px 16px 12px", borderBottom: "1px solid #f3f4f6" },
  fieldNumber: { width: 28, height: 28, borderRadius: "50%", background: "#7c3aed", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 },
  fieldPrompt: { fontSize: 15, fontWeight: 700, color: "#1f2937", marginBottom: 2 },
  fieldHint: { fontSize: 12, color: "#6b7280", lineHeight: 1.5 },
  optionalBadge: { fontSize: 10, fontWeight: 600, color: "#9ca3af", background: "#f3f4f6", padding: "3px 8px", borderRadius: 6, flexShrink: 0, marginTop: 2 },
  fieldInput: { padding: 16 },
  actions: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: "1px solid #f3f4f6", background: "#fafafa" },
  actionsRight: { display: "flex", gap: 8 },
  backBtn: { padding: "8px 16px", border: "1px solid #d1d5db", borderRadius: 8, background: "white", color: "#374151", fontSize: 13, fontWeight: 500, cursor: "pointer" },
  skipBtn: { padding: "8px 16px", border: "none", borderRadius: 8, background: "transparent", color: "#9ca3af", fontSize: 13, fontWeight: 500, cursor: "pointer" },
  nextBtn: { padding: "8px 20px", border: "none", borderRadius: 8, background: "#7c3aed", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  nextBtnDisabled: { opacity: 0.5, cursor: "not-allowed" },
  miniNav: { display: "flex", justifyContent: "center", gap: 8 },
  miniDot: { width: 8, height: 8, borderRadius: "50%", background: "#e5e7eb", transition: "all 0.2s" },
  miniDotCurrent: { background: "#7c3aed", transform: "scale(1.4)" },
  miniDotFilled: { background: "#7c3aed", opacity: 0.5 },
  complete: { textAlign: "center", padding: "32px 16px" },
  completeIcon: { width: 48, height: 48, borderRadius: "50%", background: "#d1fae5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, margin: "0 auto 12px" },
  completeTitle: { fontSize: 16, fontWeight: 700, color: "#1f2937", marginBottom: 4 },
  completeSub: { fontSize: 13, color: "#6b7280", marginBottom: 16 },
  continueBtn: { padding: "10px 24px", background: "#7c3aed", color: "white", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" },
};

const inputStyles: Record<string, React.CSSProperties> = {
  input: { width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, fontFamily: "inherit", color: "#1f2937", background: "white", boxSizing: "border-box" },
  textarea: { width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, fontFamily: "inherit", color: "#1f2937", background: "white", resize: "vertical", boxSizing: "border-box", lineHeight: 1.5 },
  select: { width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, fontFamily: "inherit", color: "#1f2937", background: "white", cursor: "pointer", boxSizing: "border-box" },
  imageContainer: { display: "flex", flexDirection: "column", gap: 12 },
  useCoverBtn: { display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "14px 16px", border: "2px dashed #c4b5fd", borderRadius: 10, background: "#f5f3ff", cursor: "pointer", fontFamily: "inherit" },
  useCoverIcon: { fontSize: 24 },
  useCoverTitle: { fontSize: 13, fontWeight: 600, color: "#5b21b6" },
  useCoverSub: { fontSize: 11, color: "#7c3aed" },
  useCoverArrow: { fontSize: 18, color: "#7c3aed", marginLeft: "auto" },
  preview: { border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" },
  previewImg: { width: "100%", maxHeight: 180, objectFit: "cover", display: "block" },
  previewInfo: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f0fdf4" },
  previewLabel: { fontSize: 12, fontWeight: 600, color: "#059669" },
  removeBtn: { padding: "4px 10px", border: "none", borderRadius: 4, background: "transparent", color: "#dc2626", fontSize: 11, fontWeight: 500, cursor: "pointer" },
  uploadZone: { border: "2px dashed #d1d5db", borderRadius: 10, padding: "24px 16px", textAlign: "center", cursor: "pointer", position: "relative", background: "#fafafa" },
  fileInput: { position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" },
  uploadIcon: { fontSize: 28, marginBottom: 6 },
  uploadText: { fontSize: 13, fontWeight: 500, color: "#374151" },
  uploadSub: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  toggleContainer: { display: "flex", flexDirection: "column", gap: 8 },
  toggleOption: { display: "flex", gap: 12, alignItems: "flex-start", width: "100%", padding: "14px 16px", border: "1px solid #e5e7eb", borderRadius: 10, background: "white", cursor: "pointer", fontFamily: "inherit", textAlign: "left" },
  toggleOptionActive: { borderColor: "#7c3aed", background: "#f5f3ff" },
  toggleIcon: { fontSize: 20 },
  toggleTitle: { fontSize: 14, fontWeight: 600, color: "#1f2937", marginBottom: 2 },
  toggleDesc: { fontSize: 11, color: "#6b7280", lineHeight: 1.4 },
  complianceWarn: {
    marginTop: 8,
    padding: "8px 12px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 6,
    fontSize: 12,
    color: "#991b1b",
    fontWeight: 500,
    lineHeight: 1.4,
  },
};
