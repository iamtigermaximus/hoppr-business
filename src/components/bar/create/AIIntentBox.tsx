"use client";

import { useState } from "react";
import styled from "styled-components";

// ---- Styled Components ----

const Container = styled.div`
  background: linear-gradient(135deg, #ede9fe 0%, #f5f3ff 100%);
  border: 1px solid #ddd6fe;
  border-radius: 0.75rem;
  padding: 1.25rem;
  margin-bottom: 1rem;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`;

const HeaderText = styled.span`
  font-size: 0.9375rem;
  font-weight: 700;
  color: #5b21b6;
`;

const HeaderBadge = styled.span`
  font-size: 0.6875rem;
  background: #7c3aed;
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 1rem;
  font-weight: 600;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  min-height: 80px;
  resize: vertical;
  box-sizing: border-box;
  font-family: inherit;
  line-height: 1.5;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    outline: none;
    border-color: #7c3aed;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
  }
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const Hint = styled.span`
  font-size: 0.75rem;
  color: #9ca3af;
`;

const GenerateButton = styled.button`
  padding: 0.625rem 1.5rem;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: #6d28d9;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorText = styled.div`
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #dc2626;
`;

// ---- Component ----

interface AIIntentBoxProps {
  barId: string;
  onGenerated: (data: Record<string, unknown>) => void;
  disabled?: boolean;
}

const EXAMPLES = [
  "Ladies Night every Friday with 20% off cocktails and a VIP skip-line pass",
  "Karaoke competition next Saturday at 8pm, max 50 people",
  "Summer terrace special — 2 craft beers + bruschetta for €15",
];

export default function AIIntentBox({
  barId,
  onGenerated,
  disabled,
}: AIIntentBoxProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placeholder] = useState(
    () => EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)],
  );

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("hoppr_token")
      : null;

  const handleGenerate = async () => {
    if (!text.trim() || !token) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/auth/bar/${barId}/create/suggest`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: text.trim() }),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "AI generation failed");
      }

      const data = await res.json();
      onGenerated(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <Container>
      <Header>
        <HeaderText>🪄 AI Creation Hub</HeaderText>
        <HeaderBadge>Powered by AI</HeaderBadge>
      </Header>
      <TextArea
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading || disabled}
      />
      <Footer>
        <Hint>
          Describe what you want — the AI figures out the details
          <br />
          <span style={{ color: "#c4b5fd" }}>
            {loading ? "Generating..." : "⌘+Enter to generate"}
          </span>
        </Hint>
        <GenerateButton
          onClick={handleGenerate}
          disabled={loading || disabled || !text.trim()}
        >
          {loading ? "✨ Thinking..." : "✨ Generate"}
        </GenerateButton>
      </Footer>
      {error && <ErrorText>{error}</ErrorText>}
    </Container>
  );
}
