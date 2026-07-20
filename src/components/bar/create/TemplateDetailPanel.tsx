"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getFieldsForTemplate,
  type TemplateField,
} from "@/lib/prompts/template-fields";

// ---- Types ----

interface TemplateDetailPanelProps {
  templateId: string;
  language: "en" | "fi";
  /** Called whenever any field value changes */
  onChange: (values: Record<string, string>) => void;
}

// ---- Component ----

export default function TemplateDetailPanel({
  templateId,
  language,
  onChange,
}: TemplateDetailPanelProps) {
  const fields = getFieldsForTemplate(templateId);
  const [values, setValues] = useState<Record<string, string>>({});
  // Track the previous templateId to detect changes
  const prevTemplateRef = useRef(templateId);

  // Reset values when templateId changes
  useEffect(() => {
    if (prevTemplateRef.current !== templateId) {
      prevTemplateRef.current = templateId;
      setValues({});
      onChange({});
    }
  }, [templateId, onChange]);

  const handleChange = useCallback(
    (fieldId: string, value: string) => {
      setValues((prev) => {
        const next = { ...prev, [fieldId]: value };
        // Clean up empty entries before passing to parent
        const cleaned: Record<string, string> = {};
        for (const [k, v] of Object.entries(next)) {
          if (v.trim()) cleaned[k] = v.trim();
        }
        onChange(cleaned);
        return next;
      });
    },
    [onChange],
  );

  // Don't render if no fields (no template selected or unknown template)
  if (fields.length === 0) return null;

  return (
    <div
      style={{
        marginTop: "10px",
        padding: "12px 14px",
        background: "rgba(99, 102, 241, 0.04)",
        border: "1px solid rgba(99, 102, 241, 0.12)",
        borderRadius: "10px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: "#a78bfa",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontFamily: "inherit",
        }}
      >
        {language === "fi"
          ? "Tarkenna valitsemasi malli"
          : "Refine your selected template"}
      </div>

      {fields.map((field) => (
        <FieldInput
          key={field.id}
          field={field}
          value={values[field.id] || ""}
          language={language}
          onChange={(v) => handleChange(field.id, v)}
        />
      ))}
    </div>
  );
}

// ---- Field Input Sub-component ----

function FieldInput({
  field,
  value,
  language,
  onChange,
}: {
  field: TemplateField;
  value: string;
  language: "en" | "fi";
  onChange: (value: string) => void;
}) {
  const label = field.label[language];
  const placeholder = field.placeholder[language];

  const sharedStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    background: "rgba(30, 28, 50, 0.6)",
    border: "1px solid rgba(99, 102, 241, 0.15)",
    borderRadius: "6px",
    color: "#e0d6ff",
    fontSize: "12px",
    fontFamily: "inherit",
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.15s ease",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
      <label
        style={{
          fontSize: "11px",
          color: "#9ca3af",
          fontFamily: "inherit",
          fontWeight: 500,
        }}
      >
        {label}
      </label>
      {field.type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          style={{
            ...sharedStyle,
            resize: "vertical",
            minHeight: "48px",
          }}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={sharedStyle}
        />
      )}
    </div>
  );
}
