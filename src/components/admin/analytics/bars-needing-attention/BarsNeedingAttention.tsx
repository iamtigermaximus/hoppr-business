"use client";

import styled from "styled-components";

const Section = styled.section`
  background: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e5e7eb;
`;

const IssuesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const IssueItem = styled.div<{ $priority: "high" | "medium" | "low" }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  border-left: 4px solid
    ${(props) => {
      switch (props.$priority) {
        case "high":
          return "#ef4444";
        case "medium":
          return "#f59e0b";
        default:
          return "#10b981";
      }
    }};
`;

const IssueInfo = styled.div`
  flex: 1;
`;

const IssueReason = styled.div`
  font-weight: 600;
  font-size: 0.875rem;
  color: #1f2937;
`;

const IssueAction = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
`;

const IssueCount = styled.div<{ $priority: "high" | "medium" | "low" }>`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${(props) => {
    switch (props.$priority) {
      case "high":
        return "#dc2626";
      case "medium":
        return "#d97706";
      default:
        return "#059669";
    }
  }};
`;

const IssueUnit = styled.span`
  font-size: 0.75rem;
  font-weight: normal;
  color: #6b7280;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #10b981;
  font-weight: 500;
`;

interface NeedingAttentionIssue {
  reason: string;
  count: number;
  priority: "high" | "medium" | "low";
  action: string;
}

interface BarsNeedingAttentionProps {
  issues: NeedingAttentionIssue[];
}

const BarsNeedingAttention = ({ issues }: BarsNeedingAttentionProps) => {
  if (issues.length === 0) {
    return (
      <Section>
        <SectionTitle>✅ Bars Needing Attention</SectionTitle>
        <EmptyState>🎉 All bars are in good shape! No issues found.</EmptyState>
      </Section>
    );
  }

  return (
    <Section>
      <SectionTitle>⚠️ Bars Needing Attention</SectionTitle>
      <IssuesList>
        {issues.map((issue, index) => (
          <IssueItem key={index} $priority={issue.priority}>
            <IssueInfo>
              <IssueReason>{issue.reason}</IssueReason>
              <IssueAction>Suggested action: {issue.action}</IssueAction>
            </IssueInfo>
            <IssueCount $priority={issue.priority}>
              {issue.count}{" "}
              <IssueUnit>bar{issue.count !== 1 ? "s" : ""}</IssueUnit>
            </IssueCount>
          </IssueItem>
        ))}
      </IssuesList>
    </Section>
  );
};

export default BarsNeedingAttention;
