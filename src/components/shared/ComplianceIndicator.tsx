"use client";

import { useMemo } from "react";
import styled from "styled-components";
import { scanCompliance, complianceSummary, type ComplianceViolation } from "@/lib/compliance-engine";

// ---- Styled Components ----

const Container = styled.div`
  margin-top: 0.5rem;
`;

const StatusRow = styled.div<{ $status: "compliant" | "flagged" | "flagged-high" | "idle" }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  background: ${({ $status }) =>
    $status === "compliant"
      ? "#f0fdf4"
      : $status === "flagged-high"
        ? "#fef2f2"
        : $status === "flagged"
          ? "#fffbeb"
          : "#f9fafb"};
  border: 1px solid
    ${({ $status }) =>
      $status === "compliant"
        ? "#bbf7d0"
        : $status === "flagged-high"
          ? "#fecaca"
          : $status === "flagged"
            ? "#fed7aa"
            : "#e5e7eb"};
  color: ${({ $status }) =>
    $status === "compliant"
      ? "#166534"
      : $status === "flagged-high"
        ? "#dc2626"
        : $status === "flagged"
          ? "#92400e"
          : "#9ca3af"};
`;

const StatusDot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const ViolationList = styled.div`
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

const ViolationItem = styled.div<{ $severity: string }>`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  line-height: 1.4;
  background: ${({ $severity }) =>
    $severity === "high"
      ? "#fef2f2"
      : $severity === "medium"
        ? "#fffbeb"
        : "#f0f9ff"};
  border-left: 3px solid
    ${({ $severity }) =>
      $severity === "high" ? "#ef4444" : $severity === "medium" ? "#f59e0b" : "#3b82f6"};
  color: ${({ $severity }) =>
    $severity === "high" ? "#991b1b" : $severity === "medium" ? "#92400e" : "#1e40af"};
`;

const SeverityBadge = styled.span<{ $severity: string }>`
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  flex-shrink: 0;
  background: ${({ $severity }) =>
    $severity === "high"
      ? "#fecaca"
      : $severity === "medium"
        ? "#fed7aa"
        : "#bfdbfe"};
  color: ${({ $severity }) =>
    $severity === "high" ? "#dc2626" : $severity === "medium" ? "#f59e0b" : "#3b82f6"};
`;

const PreviewNote = styled.div`
  margin-top: 0.25rem;
  font-size: 0.6875rem;
  color: #9ca3af;
  font-style: italic;
`;

// ---- Component ----

interface ComplianceIndicatorProps {
  title: string;
  description?: string;
}

export default function ComplianceIndicator({ title, description }: ComplianceIndicatorProps) {
  const result = useMemo(() => {
    if (!title.trim() && !description?.trim()) {
      return null; // idle — nothing to scan
    }
    return scanCompliance(title, description);
  }, [title, description]);

  // Idle state — no content to check
  if (!result) {
    return (
      <Container>
        <StatusRow $status="idle">
          <StatusDot $color="#d1d5db" />
          Start typing to see compliance check
        </StatusRow>
      </Container>
    );
  }

  const hasHigh = result.violations.some((v) => v.severity === "high");
  const hasMedium = result.violations.some((v) => v.severity === "medium");
  const statusType = hasHigh ? "flagged-high" : hasMedium || result.violations.length > 0 ? "flagged" : "compliant";

  const dotColor = statusType === "compliant" ? "#10b981" : statusType === "flagged-high" ? "#ef4444" : "#f59e0b";

  const statusLabel =
    statusType === "compliant"
      ? "Compliant — no issues found"
      : statusType === "flagged-high"
        ? "Flagged — critical issues detected"
        : "Review — potential issues found";

  return (
    <Container>
      <StatusRow $status={statusType}>
        <StatusDot $color={dotColor} />
        {statusLabel}
      </StatusRow>

      {result.violations.length > 0 && (
        <ViolationList>
          {result.violations.map((v, i) => (
            <ViolationItem key={`${v.rule}-${i}`} $severity={v.severity}>
              <SeverityBadge $severity={v.severity}>{v.severity}</SeverityBadge>
              <div>
                <div style={{ fontWeight: 600, marginBottom: "0.125rem" }}>
                  &ldquo;{v.keyword}&rdquo;
                </div>
                <div style={{ opacity: 0.85 }}>{v.message}</div>
              </div>
            </ViolationItem>
          ))}
        </ViolationList>
      )}

      <PreviewNote>
        {complianceSummary(result)} This check runs automatically on submission.
      </PreviewNote>
    </Container>
  );
}
