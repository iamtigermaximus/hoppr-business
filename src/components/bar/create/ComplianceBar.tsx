"use client";

import { useMemo, useState } from "react";
import styled from "styled-components";
import { scanCompliance } from "@/lib/compliance-engine";
import type { ComplianceResult, ComplianceViolation } from "@/lib/compliance-engine";
import { COMPLIANCE_RULES } from "@/lib/compliance/rules";

// ---- Styled ----

const Bar = styled.div<{ $status: "none" | "clean" | "flagged" | "blocked" }>`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.625rem;
  margin-bottom: 1rem;
  background: ${({ $status }) =>
    $status === "blocked"
      ? "#fef2f2"
      : $status === "flagged"
        ? "#fefce8"
        : $status === "clean"
          ? "#f0fdf4"
          : "#fafafa"};
  border: 1px solid
    ${({ $status }) =>
      $status === "blocked"
        ? "#fecaca"
        : $status === "flagged"
          ? "#fde68a"
          : $status === "clean"
            ? "#86efac"
            : "#e5e7eb"};
  transition: all 0.2s;

  @media (max-width: 480px) {
    padding: 0.5rem 0.75rem;
    gap: 0.5rem;
  }
`;

const Icon = styled.span`
  font-size: 0.875rem;
  flex-shrink: 0;
  margin-top: 1px;
`;

const Content = styled.div`
  flex: 1;
  min-width: 0;
`;

const Title = styled.div<{ $status: "none" | "clean" | "flagged" | "blocked" }>`
  font-size: 0.8125rem;
  font-weight: 600;
  color: ${({ $status }) =>
    $status === "blocked" ? "#991b1b" : $status === "flagged" ? "#92400e" : $status === "clean" ? "#065f46" : "#374151"};
`;

const Subtitle = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 2px;
  line-height: 1.45;
`;

const FixList = styled.div`
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FixItem = styled.div`
  font-size: 0.71875rem;
  color: #374151;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px 10px;
  word-break: break-word;

  @media (max-width: 480px) {
    padding: 6px 8px;
  }
`;

const FixLabel = styled.span`
  font-weight: 600;
  color: #991b1b;
`;

const FixArrow = styled.span`
  color: #6b7280;
  margin: 0 6px;
`;

const FixReplacement = styled.span`
  font-weight: 600;
  color: #059669;
`;

const ToggleButton = styled.button`
  padding: 0.25rem 0.5rem;
  background: none;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.6875rem;
  color: #6b7280;
  cursor: pointer;
  flex-shrink: 0;
  margin-top: 1px;

  &:hover {
    background: #f3f4f6;
  }
`;

const ProactiveTips = styled.div`
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
`;

const ProactiveChip = styled.span`
  font-size: 0.6875rem;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 4px;
  word-break: break-word;
  line-height: 1.4;
`;

// ---- Proactive guidance ----

/** Tips shown when the user hasn't typed anything yet — models good behavior */
const WRITING_TIPS = [
  "Focus on atmosphere, music, and experience — not alcohol prices",
  "Use 'After-Work' instead of 'Happy Hour'",
  "Use 'Featured Selection' instead of 'Cheapest Drinks'",
  "Use 'Premium Spirits' instead of brand names (vodka, whiskey, etc.)",
  "Specify '20+ only' when targeting young adults — never 'Student'",
  "Food promos have no alcohol advertising restrictions — lead with food",
  "Never promise free drinks, unlimited alcohol, or quantity discounts",
  "Never use giveaways, prize draws, or contests linked to alcohol",
];

// ---- Component ----

interface ComplianceBarProps {
  title: string;
  description: string;
  expanded: boolean;
  onToggle: () => void;
}

function getHighestSeverity(violations: ComplianceViolation[]): "high" | "medium" | "low" | "none" {
  if (violations.length === 0) return "none";
  if (violations.some((v) => v.severity === "high")) return "high";
  if (violations.some((v) => v.severity === "medium")) return "medium";
  return "low";
}

/** Build a concrete fix suggestion for a given violation using rule examples */
function getFixExample(violation: ComplianceViolation): { violation: string; fix: string } | null {
  const rule = COMPLIANCE_RULES.find((r) => r.id === violation.rule);
  if (!rule || rule.examples.length === 0) return null;
  return rule.examples[0];
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

  const [tipsExpanded, setTipsExpanded] = useState(false);

  const highestSeverity = getHighestSeverity(result.violations);
  const violationCount = result.violations.length;
  const hasContent = !!(title || description);

  // Status
  const status: "none" | "clean" | "flagged" | "blocked" =
    !hasContent ? "none"
    : violationCount === 0 ? "clean"
    : highestSeverity === "high" ? "blocked"
    : "flagged";

  // ---- Render: no content yet — show proactive writing tips ----

  if (!hasContent) {
    return (
      <Bar $status="none">
        <Icon>💡</Icon>
        <Content>
          <Title $status="none">Write compliant from the start</Title>
          <Subtitle>
            Finnish alcohol marketing law has specific rules. These tips help you write
            content that passes compliance on the first try.
          </Subtitle>
          <ProactiveTips>
            {WRITING_TIPS.slice(0, tipsExpanded ? WRITING_TIPS.length : 4).map((tip, i) => (
              <ProactiveChip key={i}>{tip}</ProactiveChip>
            ))}
          </ProactiveTips>
          {WRITING_TIPS.length > 4 && (
            <ToggleButton
              style={{ marginTop: 4 }}
              onClick={() => setTipsExpanded((p) => !p)}
            >
              {tipsExpanded ? "Show less ▲" : "Show all tips ▼"}
            </ToggleButton>
          )}
        </Content>
      </Bar>
    );
  }

  // ---- Render: clean ----

  if (status === "clean") {
    return (
      <Bar $status="clean">
        <Icon>✅</Icon>
        <Content>
          <Title $status="clean">Compliant — passes all checks</Title>
          <Subtitle>
            Your content follows Finnish alcohol marketing rules. It will not be blocked
            or flagged when published.
          </Subtitle>
        </Content>
      </Bar>
    );
  }

  // ---- Render: violations found ----

  const criticalCount = result.violations.filter((v) => v.severity === "high").length;
  const warningCount = result.violations.filter((v) => v.severity === "medium").length;

  return (
    <Bar $status={status}>
      <Icon>{status === "blocked" ? "🚫" : "⚠️"}</Icon>
      <Content>
        <Title $status={status}>
          {status === "blocked"
            ? `${violationCount} issue${violationCount > 1 ? "s" : ""} found — fix before publishing`
            : `${violationCount} warning${violationCount > 1 ? "s" : ""} — review before publishing`}
        </Title>
        <Subtitle>
          {status === "blocked"
            ? `${criticalCount} critical issue${criticalCount > 1 ? "s" : ""} must be resolved. These violate mandatory provisions of the Alcohol Act.`
            : `${warningCount} advisory issue${warningCount > 1 ? "s" : ""} to review. These may draw scrutiny from Valvira.`}
        </Subtitle>

        {expanded && (
          <FixList>
            {result.violations.map((v, i) => {
              const example = getFixExample(v);
              return (
                <FixItem key={i}>
                  <FixLabel>{v.message}</FixLabel>
                  {example && (
                    <div style={{ marginTop: 4 }}>
                      <span style={{ color: "#dc2626" }}>"{example.violation}"</span>
                      <FixArrow>→</FixArrow>
                      <FixReplacement>"{example.fix}"</FixReplacement>
                    </div>
                  )}
                </FixItem>
              );
            })}
          </FixList>
        )}
      </Content>
      <ToggleButton onClick={onToggle}>
        {expanded ? "▲ Hide" : "▼ Details"}
      </ToggleButton>
    </Bar>
  );
}
