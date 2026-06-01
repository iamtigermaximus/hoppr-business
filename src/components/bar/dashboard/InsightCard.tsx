"use client";

import { useState } from "react";
import styled from "styled-components";

interface Insight {
  id: string;
  type: string;
  title: string;
  body: string;
  actionLabel?: string | null;
  actionRoute?: string | null;
  createdAt: string;
}

interface Props {
  insight: Insight | null;
  onDismiss: (id: string) => void;
  onAct: (id: string, route?: string) => void;
  onExpand: () => void;
}

const Card = styled.div`
  background: linear-gradient(135deg, #f0f0ff, #f5f0ff);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e0d8f0;
  margin-bottom: 16px;

  @media (max-width: 480px) {
    padding: 12px;
    border-radius: 8px;
  }
`;

const TypeLabel = styled.p`
  margin: 0;
  font-size: 11px;
  color: #7c3aed;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Body = styled.p`
  margin: 6px 0 0;
  font-size: 14px;
  color: #1f2937;
  line-height: 1.5;

  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 10px;

  @media (max-width: 480px) {
    flex-wrap: wrap;
  }
`;

const PrimaryButton = styled.button`
  font-size: 12px;
  padding: 8px 14px;
  background: #7c3aed;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #6d28d9;
  }
`;

const SecondaryButton = styled.button`
  font-size: 12px;
  padding: 8px 14px;
  background: transparent;
  color: #6b7280;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: #f3f4f6;
  }
`;

const EmptyCard = styled(Card)`
  background: #f9fafb;
  border-color: #e5e7eb;
`;

export function InsightCard({
  insight,
  onDismiss,
  onAct,
  onExpand,
}: Props) {
  if (!insight) {
    return (
      <EmptyCard>
        <TypeLabel>All caught up</TypeLabel>
        <Body>
          No new insights right now. We'll let you know when there's
          something to check.
        </Body>
      </EmptyCard>
    );
  }

  return (
    <Card>
      <TypeLabel>Hoppr Insight</TypeLabel>
      <Body>{insight.body}</Body>
      <Actions>
        {insight.actionLabel && (
          <PrimaryButton
            onClick={() => onAct(insight.id, insight.actionRoute || undefined)}
          >
            {insight.actionLabel} →
          </PrimaryButton>
        )}
        <SecondaryButton onClick={() => onDismiss(insight.id)}>
          Dismiss
        </SecondaryButton>
        <SecondaryButton onClick={onExpand}>Chat</SecondaryButton>
      </Actions>
    </Card>
  );
}
