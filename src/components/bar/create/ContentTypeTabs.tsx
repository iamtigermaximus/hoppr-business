"use client";

import styled from "styled-components";
import type { ContentType } from "./types";

const TabRow = styled.div`
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1.25rem;
`;

const Tab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 0.75rem 0.5rem;
  font-size: 0.875rem;
  font-weight: ${({ $active }) => ($active ? 600 : 500)};
  color: ${({ $active }) => ($active ? "#7c3aed" : "#6b7280")};
  background: none;
  border: none;
  border-bottom: 2px solid
    ${({ $active }) => ($active ? "#7c3aed" : "transparent")};
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;

  &:hover {
    color: #7c3aed;
  }
`;

const AiBadge = styled.span`
  font-size: 0.625rem;
  background: #ede9fe;
  color: #7c3aed;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-weight: 600;
`;

interface ContentTypeTabsProps {
  value: ContentType;
  onChange: (type: ContentType) => void;
  aiInferred?: boolean;
}

const TAB_CONFIG: { value: ContentType; label: string; icon: string }[] = [
  { value: "event", label: "Event", icon: "" },
  { value: "promotion", label: "Promotion", icon: "" },
  { value: "campaign", label: "Ad", icon: "" },
  { value: "pass", label: "Pass", icon: "" },
];

export default function ContentTypeTabs({
  value,
  onChange,
  aiInferred,
}: ContentTypeTabsProps) {
  return (
    <TabRow>
      {TAB_CONFIG.map((tab) => (
        <Tab
          key={tab.value}
          $active={value === tab.value}
          onClick={() => onChange(tab.value)}
        >
          {tab.icon} {tab.label}
          {aiInferred && value === tab.value && <AiBadge>AI</AiBadge>}
        </Tab>
      ))}
    </TabRow>
  );
}
