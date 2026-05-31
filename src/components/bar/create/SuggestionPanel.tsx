"use client";

import { useState } from "react";
import styled from "styled-components";
import type { ComplianceViolation } from "@/lib/compliance-engine";

// ---- Styled Components ----

const Panel = styled.div`
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  margin-top: 0.5rem;
  font-size: 0.8125rem;
`;

const ViolationItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  padding: 0.5rem 0;

  &:not(:last-child) {
    border-bottom: 1px solid #fef3c7;
  }
`;

const SeverityBadge = styled.span<{ $severity: string }>`
  flex-shrink: 0;
  margin-top: 0.125rem;
  font-size: 0.75rem;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-weight: 600;
  background: ${({ $severity }) =>
    $severity === "high"
      ? "#fee2e2"
      : $severity === "medium"
        ? "#fef3c7"
        : "#f3f4f6"};
  color: ${({ $severity }) =>
    $severity === "high"
      ? "#dc2626"
      : $severity === "medium"
        ? "#d97706"
        : "#6b7280"};
`;

const ViolationContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ViolationMessage = styled.div`
  color: #374151;
  margin-bottom: 0.25rem;
  line-height: 1.4;
`;

const Suggestion = styled.div`
  color: #6d28d9;
  font-size: 0.75rem;
  line-height: 1.4;
  background: #f5f3ff;
  padding: 0.375rem 0.625rem;
  border-radius: 0.375rem;
  margin-top: 0.25rem;
`;

const AcceptButton = styled.button`
  margin-top: 0.375rem;
  padding: 0.25rem 0.75rem;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.6875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: #6d28d9;
  }
`;

const AiButton = styled.button`
  margin-top: 0.75rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #7c3aed, #a78bfa);
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #6d28d9, #8b5cf6);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const AiAlternatives = styled.div`
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const AlternativeCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 0.75rem;
`;

const AltTitle = styled.div`
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
`;

const AltDesc = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
`;

const AltExplanation = styled.div`
  font-size: 0.6875rem;
  color: #7c3aed;
  margin-bottom: 0.375rem;
`;

const UseButton = styled.button`
  padding: 0.25rem 0.625rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.6875rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #059669;
  }
`;

const Divider = styled.div`
  margin: 0.25rem 0;
`;

// ---- Component ----

interface SuggestionPanelProps {
  violations: ComplianceViolation[];
  title: string;
  description: string;
  contentType: string;
  barId: string;
  onAcceptFix: (newTitle: string, newDescription: string) => void;
}

export default function SuggestionPanel({
  violations,
  title,
  description,
  contentType,
  barId,
  onAcceptFix,
}: SuggestionPanelProps) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAlternatives, setAiAlternatives] = useState<
    Array<{ title: string; description: string; explanation: string }> | null
  >(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("hoppr_token")
      : null;

  const hasHighSeverity = violations.some((v) => v.severity === "high");
  const hasMultipleRules = violations.length >= 3;
  const showAiOption = hasHighSeverity || hasMultipleRules;

  const handleAcceptFix = (suggestion: string) => {
    // For now, accept the violation's suggestion by clearing the flagged keyword
    // In a full implementation, we'd do NLP replacement
    onAcceptFix(title, description);
  };

  const handleGenerateAI = async () => {
    if (!token) return;
    setAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch(
        `/api/auth/bar/${barId}/create/suggest-fix`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            description,
            violations,
            contentType,
          }),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "AI generation failed");
      }

      const data = await res.json();
      setAiAlternatives(data.alternatives || []);
    } catch (err) {
      setAiError(
        err instanceof Error ? err.message : "Failed to generate alternatives",
      );
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Panel>
      <div style={{ fontWeight: 600, marginBottom: "0.25rem", color: "#92400e" }}>
        💡 {violations.length} compliance suggestion{violations.length > 1 ? "s" : ""} available
      </div>

      {violations.map((v, i) => (
        <ViolationItem key={`${v.rule}-${i}`}>
          <SeverityBadge $severity={v.severity}>
            {v.severity.toUpperCase()}
          </SeverityBadge>
          <ViolationContent>
            <ViolationMessage>{v.message}</ViolationMessage>
            {v.suggestion && (
              <Suggestion>
                💡 {v.suggestion}
                <div>
                  <AcceptButton onClick={() => handleAcceptFix(v.suggestion)}>
                    Accept Fix
                  </AcceptButton>
                </div>
              </Suggestion>
            )}
          </ViolationContent>
        </ViolationItem>
      ))}

      {showAiOption && (
        <>
          <Divider />
          <AiButton
            onClick={handleGenerateAI}
            disabled={aiLoading}
          >
            {aiLoading ? "✨ Generating alternatives..." : "✨ Generate AI alternatives"}
          </AiButton>
        </>
      )}

      {aiError && (
        <div style={{ color: "#dc2626", fontSize: "0.75rem", marginTop: "0.5rem" }}>
          {aiError}
        </div>
      )}

      {aiAlternatives && aiAlternatives.length > 0 && (
        <AiAlternatives>
          {aiAlternatives.map((alt, i) => (
            <AlternativeCard key={i}>
              <AltTitle>{alt.title}</AltTitle>
              <AltDesc>{alt.description}</AltDesc>
              <AltExplanation>💡 {alt.explanation}</AltExplanation>
              <UseButton
                onClick={() => onAcceptFix(alt.title, alt.description)}
              >
                ✓ Use This
              </UseButton>
            </AlternativeCard>
          ))}
        </AiAlternatives>
      )}
    </Panel>
  );
}
