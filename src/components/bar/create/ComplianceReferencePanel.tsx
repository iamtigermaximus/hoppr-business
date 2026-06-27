"use client";

import { useState, useEffect, useMemo } from "react";
import styled from "styled-components";

// ---- Types ----

interface RuleSummary {
  id: string;
  name: string;
  lawReference: string;
  severity: "high" | "medium" | "low";
  lawText: string;
  valviraGuidance: string;
  valviraSection?: {
    chapter: number;
    chapterTitle: string;
    section: string;
    pages: string;
  };
  prohibited: string[];
  approved: string[];
  examples: Array<{ violation: string; fix: string }>;
}

interface RulesData {
  lastUpdated: string;
  sources: string[];
  summary: {
    totalRules: number;
    totalPatterns: number;
    highSeverity: number;
    mediumSeverity: number;
    lowSeverity: number;
  };
  rules: RuleSummary[];
}

// ---- Styled ----

const Container = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  background: white;
  margin-bottom: 1rem;
  overflow: hidden;
`;

const Header = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  text-align: left;

  &:hover {
    background: #f3f4f6;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const HeaderBadge = styled.span`
  font-size: 0.6875rem;
  background: #ede9fe;
  color: #5b21b6;
  padding: 0.125rem 0.5rem;
  border-radius: 1rem;
  font-weight: 600;
`;

const Body = styled.div`
  padding: 1rem;
  max-height: 500px;
  overflow-y: auto;
`;

const SourceBar = styled.div`
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 0.5rem;
  padding: 0.625rem 0.75rem;
  margin-bottom: 1rem;
  font-size: 0.75rem;
  color: #92400e;
  line-height: 1.5;
`;

const StatsRow = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

const Stat = styled.div<{ $color: string }>`
  padding: 0.375rem 0.625rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${({ $color }) =>
    $color === "red" ? "#fef2f2" : $color === "amber" ? "#fffbeb" : "#f0fdf4"};
  color: ${({ $color }) =>
    $color === "red" ? "#dc2626" : $color === "amber" ? "#d97706" : "#059669"};
`;

const RuleCard = styled.details`
  border: 1px solid #f3f4f6;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;

  &[open] {
    border-color: #e5e7eb;
  }
`;

const RuleSummary = styled.summary`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  cursor: pointer;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #1f2937;

  &:hover {
    background: #f9fafb;
  }

  &::marker {
    font-size: 0.75rem;
  }
`;

const SeverityDot = styled.span<{ $severity: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ $severity }) =>
    $severity === "high" ? "#ef4444" : $severity === "medium" ? "#f59e0b" : "#10b981"};
`;

const RuleBody = styled.div`
  padding: 0.5rem 0.75rem 0.75rem 1.5rem;
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.6;
`;

const RuleSectionLabel = styled.div`
  font-size: 0.6875rem;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 0.75rem;
  margin-bottom: 0.25rem;
`;

const ChipsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.25rem;
`;

const Chip = styled.span<{ $variant: "prohibited" | "approved" }>`
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.6875rem;
  font-weight: 500;
  background: ${({ $variant }) =>
    $variant === "prohibited" ? "#fef2f2" : "#f0fdf4"};
  color: ${({ $variant }) =>
    $variant === "prohibited" ? "#dc2626" : "#059669"};
  border: 1px solid ${({ $variant }) =>
    $variant === "prohibited" ? "#fecaca" : "#86efac"};
`;

const ExamplePair = styled.div`
  margin-top: 0.375rem;
  font-size: 0.6875rem;
`;

const ExampleBad = styled.span`
  color: #dc2626;
  text-decoration: line-through;
  text-decoration-color: rgba(220, 38, 38, 0.3);
`;

const ExampleGood = styled.span`
  color: #059669;
`;

const LoadingText = styled.div`
  padding: 2rem;
  text-align: center;
  color: #9ca3af;
  font-size: 0.8125rem;
`;

const ErrorText = styled.div`
  padding: 1rem;
  text-align: center;
  color: #dc2626;
  font-size: 0.8125rem;
`;

const FallbackLabel = styled.span`
  font-size: 0.6875rem;
  color: #9ca3af;
  font-style: italic;
  margin-left: 0.25rem;
`;

// ---- Component ----

interface ComplianceReferencePanelProps {
  barId: string;
}

const SEVERITY_COLOR = { high: "red", medium: "amber", low: "green" } as const;

export default function ComplianceReferencePanel({
  barId: _barId,
}: ComplianceReferencePanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [rules, setRules] = useState<RulesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (expanded && !rules && !loading) {
      setLoading(true);
      fetch("/api/compliance/rules")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load");
          return res.json();
        })
        .then((data) => {
          setRules(data);
          setError(null);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [expanded, rules, loading]);

  // If API is unavailable, show a lightweight embedded fallback
  const fallbackStats = useMemo(
    () => ({
      highSeverity: 4,
      mediumSeverity: 6,
      lowSeverity: 2,
      totalRules: 12,
    }),
    [],
  );

  return (
    <Container>
      <Header onClick={() => setExpanded((p) => !p)}>
        <HeaderLeft>
          📋 Finnish Alcohol Marketing Rules
          <HeaderBadge>Alcohol Act 1102/2017</HeaderBadge>
        </HeaderLeft>
        <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
          {expanded ? "▲ Hide" : "▼ Show"}
        </span>
      </Header>

      {expanded && (
        <Body>
          {loading && <LoadingText>Loading rules...</LoadingText>}

          {error && !rules && (
            <div>
              <SourceBar>
                <strong>Finnish Alcohol Act (1102/2017)</strong> — All content
                created in Hoppr is automatically checked against these rules.
                Content violating HIGH severity rules will be blocked.
              </SourceBar>
              <StatsRow>
                <Stat $color="red">
                  {fallbackStats.highSeverity} blocking rules
                </Stat>
                <Stat $color="amber">
                  {fallbackStats.mediumSeverity} warning rules
                </Stat>
                <Stat $color="green">
                  {fallbackStats.lowSeverity} advisory rules
                </Stat>
              </StatsRow>
              <FallbackLabel>
                Full rule details unavailable — using embedded summary.
                The compliance scanner is always active.
              </FallbackLabel>
            </div>
          )}

          {rules && (
            <>
              <SourceBar>
                <strong>Source:</strong>{" "}
                {rules.sources.slice(0, 2).join(" | ")}
                <br />
                Last reviewed: {rules.lastUpdated}. All content you create is
                automatically scanned against these rules. HIGH severity
                violations will be blocked from publishing.
              </SourceBar>

              <StatsRow>
                <Stat $color="red">
                  {rules.summary.highSeverity} blocking rules
                </Stat>
                <Stat $color="amber">
                  {rules.summary.mediumSeverity} warning rules
                </Stat>
                <Stat $color="green">
                  {rules.summary.lowSeverity} advisory rules
                </Stat>
                <Stat $color="red">
                  {rules.summary.totalPatterns} patterns scanned
                </Stat>
              </StatsRow>

              {rules.rules.map((rule) => (
                <RuleCard key={rule.id}>
                  <RuleSummary>
                    <SeverityDot $severity={rule.severity} />
                    {rule.name}
                    <span style={{ fontSize: "0.6875rem", color: "#9ca3af", fontWeight: 400 }}>
                      ({rule.lawReference}{rule.valviraSection ? ` — Valvira Ch.${rule.valviraSection.chapter}, pp. ${rule.valviraSection.pages}` : ""})
                    </span>
                  </RuleSummary>
                  <RuleBody>
                    <div>{rule.valviraGuidance}</div>

                    {rule.valviraSection && (
                      <div style={{ marginTop: "0.5rem", fontSize: "0.6875rem", color: "#7c3aed", fontWeight: 600 }}>
                        Valvira Guideline: Chapter {rule.valviraSection.chapter} — "{rule.valviraSection.section}" (pp. {rule.valviraSection.pages})
                      </div>
                    )}

                    <RuleSectionLabel>Prohibited</RuleSectionLabel>
                    <ChipsRow>
                      {rule.prohibited.slice(0, 6).map((p) => (
                        <Chip key={p} $variant="prohibited">
                          {p}
                        </Chip>
                      ))}
                      {rule.prohibited.length > 6 && (
                        <span style={{ fontSize: "0.6875rem", color: "#9ca3af" }}>
                          +{rule.prohibited.length - 6} more
                        </span>
                      )}
                    </ChipsRow>

                    <RuleSectionLabel>Approved Alternatives</RuleSectionLabel>
                    <ChipsRow>
                      {rule.approved.slice(0, 6).map((a) => (
                        <Chip key={a} $variant="approved">
                          {a}
                        </Chip>
                      ))}
                      {rule.approved.length > 6 && (
                        <span style={{ fontSize: "0.6875rem", color: "#9ca3af" }}>
                          +{rule.approved.length - 6} more
                        </span>
                      )}
                    </ChipsRow>

                    {rule.examples.length > 0 && (
                      <>
                        <RuleSectionLabel>Examples</RuleSectionLabel>
                        {rule.examples.slice(0, 2).map((ex, i) => (
                          <ExamplePair key={i}>
                            <ExampleBad>✗ {ex.violation}</ExampleBad>
                            <br />
                            <ExampleGood>✓ {ex.fix}</ExampleGood>
                          </ExamplePair>
                        ))}
                      </>
                    )}
                  </RuleBody>
                </RuleCard>
              ))}
            </>
          )}
        </Body>
      )}
    </Container>
  );
}
