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

const TemplateRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
`;

const TemplateChip = styled.button<{ $active?: boolean }>`
  padding: 0.375rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  border: 1px solid ${({ $active }) => ($active ? "#7c3aed" : "#ddd6fe")};
  background: ${({ $active }) => ($active ? "#ede9fe" : "white")};
  color: ${({ $active }) => ($active ? "#5b21b6" : "#6b7280")};

  &:hover {
    border-color: #7c3aed;
    background: #f5f3ff;
    color: #5b21b6;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TemplateLabel = styled.span`
  display: block;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 0.75rem;
  margin-bottom: 0;
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

const PLACEHOLDER = "Describe what you want — e.g. \"Friday after-work special with featured cocktails and craft beers, 16:00–19:00\"";

/**
 * Quick-start templates.  Each prompt guides the AI to produce content that
 * passes Finnish Alcohol Act compliance out of the box — no "happy hour",
 * no "free drinks", no spirit brand names, no student targeting, no
 * excessive-consumption language.
 */
const TEMPLATES = [
  {
    emoji: "🍺",
    label: "After-Work",
    prompt:
      "After-work special — discounted craft beers and featured cocktails, weekday afternoons 16:00–19:00. Focus on taste and atmosphere, not price.",
  },
  {
    emoji: "💃",
    label: "Ladies Night",
    prompt:
      "Ladies Night — special offers for women, Friday or Saturday evening. Premium pours, welcoming atmosphere. Compliant wording only.",
  },
  {
    emoji: "🎸",
    label: "Live Music",
    prompt:
      "Live music performance — band or DJ, evening event. Describe the experience and atmosphere. Include date and time if known.",
  },
  {
    emoji: "🎮",
    label: "Game Night",
    prompt:
      "Quiz or bingo night — entry included, prizes for winning teams, weekday evening. Fun competitive atmosphere, no alcohol quantity language.",
  },
  {
    emoji: "🍕",
    label: "Food Special",
    prompt:
      "Food special — discounted menu items or combo deals, weekday evenings. Focus on the food quality and pairing suggestions. No alcohol price reductions.",
  },
  {
    emoji: "🎉",
    label: "Weekend Party",
    prompt:
      "Weekend evening party — Friday or Saturday night, late night service. Describe the DJ, atmosphere, and venue vibe. Finland-compliant wording.",
  },
  {
    emoji: "🍹",
    label: "Featured Drinks",
    prompt:
      "Featured cocktails — special pricing on selected drinks, all evening. Focus on unique flavours and the bar's signature style. No spirit brand names.",
  },
  {
    emoji: "🎓",
    label: "Young Adult",
    prompt:
      "Young adult offer — valid ID required, 20+, weekday evenings. Great atmosphere for the 20–30 crowd. No 'student discount' language — use 'young adult' instead.",
  },
  {
    emoji: "🎭",
    label: "Theme Night",
    prompt:
      "Theme night — karaoke, 80s retro, sports screening, or costume party. Describe the theme and entertainment. Focus on the experience, not alcohol.",
  },
  {
    emoji: "📢",
    label: "Ad Campaign",
    prompt:
      "Create an ad campaign to feature our bar in Hoppr. Boost our visibility for the weekend crowd. Budget around 50 euros for a week-long campaign.",
  },
];

export default function AIIntentBox({
  barId,
  onGenerated,
  disabled,
}: AIIntentBoxProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("hoppr_token")
      : null;

  const handleGenerate = async (promptText?: string) => {
    const input = (promptText ?? text).trim();
    if (!input || !token) return;
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
          body: JSON.stringify({ text: input }),
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

  const handleTemplateClick = (label: string, prompt: string) => {
    setText(prompt);
    setActiveTemplate(label);
    handleGenerate(prompt);
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
        placeholder={PLACEHOLDER}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setActiveTemplate(null);
        }}
        onKeyDown={handleKeyDown}
        disabled={loading || disabled}
      />
      <TemplateLabel>Quick templates — click to generate</TemplateLabel>
      <TemplateRow>
        {TEMPLATES.map((t) => (
          <TemplateChip
            key={t.label}
            $active={activeTemplate === t.label}
            onClick={() => handleTemplateClick(t.label, t.prompt)}
            disabled={loading || disabled}
            title={t.prompt}
          >
            {t.emoji} {t.label}
          </TemplateChip>
        ))}
      </TemplateRow>
      <Footer>
        <Hint>
          {loading
            ? "Generating..."
            : "Describe your idea or pick a template above"}
          <br />
          <span style={{ color: "#c4b5fd" }}>
            {loading ? "✨ AI is writing compliant copy..." : "⌘+Enter to generate"}
          </span>
        </Hint>
        <GenerateButton
          onClick={() => handleGenerate()}
          disabled={loading || disabled || !text.trim()}
        >
          {loading ? "✨ Thinking..." : "✨ Generate"}
        </GenerateButton>
      </Footer>
      {error && <ErrorText>{error}</ErrorText>}
    </Container>
  );
}
