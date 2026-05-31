"use client";

import { useMemo } from "react";
import styled from "styled-components";
import { scanCompliance } from "@/lib/compliance-engine";
import type { ComplianceResult } from "@/lib/compliance-engine";

// ---- Styled Components ----

const Bar = styled.div<{ $status: "compliant" | "flagged" | "clean" }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  background: ${({ $status }) =>
    $status === "compliant"
      ? "#f0fdf4"
      : $status === "flagged"
        ? "#fef3c7"
        : "#f9fafb"};
  border: 1px solid
    ${({ $status }) =>
      $status === "compliant"
        ? "#86efac"
        : $status === "flagged"
          ? "#fde68a"
          : "#e5e7eb"};
`;

const StatusDot = styled.span<{ $severity: "high" | "medium" | "low" | "none" }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ $severity }) =>
    $severity === "high" ? "#ef4444" : $severity === "medium" ? "#f59e0b" : $severity === "low" ? "#facc15" : "#10b981"};
`;

const Summary = styled.span`
  flex: 1;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #374151;
`;

const Count = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
`;

const ToggleButton = styled.button`
  padding: 0.25rem 0.5rem;
  background: none;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.6875rem;
  color: #6b7280;
  cursor: pointer;

  &:hover {
    background: #f3f4f6;
  }
`;

// ---- Helpers ----

function getHighestSeverity(
  violations: ComplianceResult["violations"],
): "high" | "medium" | "low" | "none" {
  if (violations.length === 0) return "none";
  if (violations.some((v) => v.severity === "high")) return "high";
  if (violations.some((v) => v.severity === "medium")) return "medium";
  return "low";
}

// ---- Component ----

interface ComplianceBarProps {
  title: string;
  description: string;
  expanded: boolean;
  onToggle: () => void;
}

export default function ComplianceBar({
  title,
  description,
  expanded,
  onToggle,
}: ComplianceBarProps) {
  const result: ComplianceResult = useMemo(
    () => scanCompliance(title, description || ""),
    [title, description],
  );

  const highestSeverity = getHighestSeverity(result.violations);
  const violationCount = result.violations.length;

  const statusLabel =
    violationCount === 0
      ? "✅ Compliant — no issues found"
      : highestSeverity === "high"
        ? "🔴 Flagged — critical issues detected"
        : highestSeverity === "medium"
          ? "🟡 Review — warnings found"
          : "🟢 Monitor — minor advisory";

  return (
    <Bar
      $status={
        violationCount === 0 ? "clean" : highestSeverity === "high" ? "flagged" : "compliant"
      }
    >
      <StatusDot $severity={highestSeverity} />
      <Summary>{statusLabel}</Summary>
      {violationCount > 0 && (
        <>
          <Count>
            {violationCount} issue{violationCount > 1 ? "s" : ""}
          </Count>
          <ToggleButton onClick={onToggle}>
            {expanded ? "▲ Hide" : "▼ Details"}
          </ToggleButton>
        </>
      )}
    </Bar>
  );
}
