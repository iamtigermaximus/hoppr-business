"use client";

import styled from "styled-components";

// ---- Form layout ----

export const FormGroup = styled.div`
  margin-bottom: 1.125rem;
`;

export const FormGroupWide = styled.div`
  margin-bottom: 1.5rem;

  @media (max-width: 480px) {
    margin-bottom: 1rem;
  }
`;

// ---- Labels & inputs ----

export const Label = styled.label`
  display: block;
  font-weight: 600;
  margin-bottom: 0.375rem;
  color: #374151;
  font-size: 0.8125rem;
`;

export const Input = styled.input`
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #7c3aed;
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1);
  }
`;

export const TextArea = styled.textarea`
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  min-height: 80px;
  resize: vertical;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #7c3aed;
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1);
  }
`;

export const Select = styled.select`
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #7c3aed;
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1);
  }
`;

// ---- Checkbox ----

export const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
`;

// ---- Buttons ----

export const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;

export const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
  gap: 1rem;

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 0.75rem;
  }
`;

export const ModalButton = styled.button<{
  $variant: "primary" | "secondary" | "outline" | "danger";
}>`
  padding: 0.625rem 1.25rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid ${({ $variant }) => ($variant === "outline" ? "#d1d5db" : "transparent")};
  background: ${({ $variant }) => {
    switch ($variant) {
      case "primary":
        return "#7c3aed";
      case "secondary":
        return "#10b981";
      case "danger":
        return "#ef4444";
      default:
        return "white";
    }
  }};
  color: ${({ $variant }) => ($variant === "outline" ? "#374151" : "white")};

  &:hover {
    background: ${({ $variant }) => {
      switch ($variant) {
        case "primary":
          return "#6d28d9";
        case "secondary":
          return "#059669";
        case "danger":
          return "#dc2626";
        default:
          return "#f3f4f6";
      }
    }};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// ---- Chips & grids ----

export const DayCheckGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

export const DayChip = styled.button<{ $selected: boolean }>`
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid ${({ $selected }) => ($selected ? "#7c3aed" : "#d1d5db")};
  background: ${({ $selected }) => ($selected ? "#ede9fe" : "white")};
  color: ${({ $selected }) => ($selected ? "#7c3aed" : "#6b7280")};
  transition: all 0.15s;

  &:hover {
    border-color: #7c3aed;
  }
`;

export const InlineRow = styled.div`
  display: flex;
  gap: 0.75rem;

  @media (max-width: 480px) {
    flex-direction: column;
  }

  > * {
    flex: 1;
  }
`;

// ---- Misc ----

export const SectionDivider = styled.hr`
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 1.25rem 0;
`;

export const FieldHint = styled.span`
  display: block;
  margin-top: 0.25rem;
  font-size: 0.6875rem;
  color: #9ca3af;
`;
