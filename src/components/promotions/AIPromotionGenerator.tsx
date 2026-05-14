"use client";

import { useState } from "react";
import styled from "styled-components";

// Types - Match the PromotionType from PromotionsWizard
type PromotionType =
  | "HAPPY_HOUR"
  | "STUDENT_DISCOUNT"
  | "LADIES_NIGHT"
  | "THEME_NIGHT"
  | "FOOD_SPECIAL"
  | "DRINK_SPECIAL"
  | "COVER_DISCOUNT"
  | "VIP_OFFER";

interface GeneratedPromotion {
  title: string;
  description: string;
  type: PromotionType;
  discount: number | null;
  callToAction: string;
  accentColor: string;
  conditions: string;
}

interface AIPromotionGeneratorProps {
  barId: string;
  onGenerate: (data: GeneratedPromotion) => void;
  currentType?: string;
  currentAudience?: string;
}

interface Template {
  label: string;
  prompt: string;
}

// Styled Components with Responsive Design
const Container = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1.5rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  color: white;

  @media (max-width: 768px) {
    padding: 1rem;
  }

  @media (max-width: 480px) {
    padding: 0.75rem;
  }
`;

const Title = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;

  @media (max-width: 768px) {
    font-size: 1.125rem;
  }

  @media (max-width: 480px) {
    font-size: 1rem;
  }
`;

const Description = styled.p`
  margin: 0 0 1rem 0;
  opacity: 0.9;
  font-size: 0.875rem;

  @media (max-width: 768px) {
    font-size: 0.8rem;
  }

  @media (max-width: 480px) {
    font-size: 0.75rem;
    margin-bottom: 0.75rem;
  }
`;

const PromptInput = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.95);
  font-size: 0.875rem;
  resize: vertical;
  min-height: 80px;
  margin-bottom: 1rem;
  font-family: inherit;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
  }

  @media (max-width: 768px) {
    padding: 0.625rem;
    font-size: 0.8rem;
    min-height: 70px;
  }

  @media (max-width: 480px) {
    padding: 0.5rem;
    font-size: 0.75rem;
    min-height: 60px;
    margin-bottom: 0.75rem;
  }
`;

const TemplatesGrid = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;

  @media (max-width: 640px) {
    gap: 0.375rem;
  }

  @media (max-width: 480px) {
    gap: 0.25rem;
  }
`;

const TemplateButton = styled.button`
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.5rem;
  color: white;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    padding: 0.4rem 0.75rem;
    font-size: 0.7rem;
  }

  @media (max-width: 480px) {
    padding: 0.3rem 0.6rem;
    font-size: 0.65rem;
  }
`;

const GenerateButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  color: #667eea;
  transition: all 0.2s;
  font-size: 0.875rem;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    padding: 0.625rem;
    font-size: 0.8rem;
  }

  @media (max-width: 480px) {
    padding: 0.5rem;
    font-size: 0.75rem;
  }
`;

const PreviewCard = styled.div`
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1rem;

  @media (max-width: 768px) {
    padding: 0.75rem;
  }

  @media (max-width: 480px) {
    padding: 0.5rem;
  }
`;

const PreviewHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
`;

const PreviewTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #166534;
  margin: 0 0 0.5rem 0;

  @media (max-width: 768px) {
    font-size: 0.9rem;
  }

  @media (max-width: 480px) {
    font-size: 0.85rem;
  }
`;

const PreviewText = styled.p`
  font-size: 0.875rem;
  color: #14532d;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;

  @media (max-width: 768px) {
    font-size: 0.8rem;
  }

  @media (max-width: 480px) {
    font-size: 0.75rem;
  }
`;

const PreviewDetails = styled.div`
  font-size: 0.75rem;
  color: #15803d;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #bbf7d0;

  @media (max-width: 768px) {
    font-size: 0.7rem;
  }

  @media (max-width: 480px) {
    font-size: 0.65rem;
  }
`;

const ErrorMessage = styled.div`
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fee2e2;
  border-radius: 0.5rem;
  color: #dc2626;
  font-size: 0.875rem;

  @media (max-width: 768px) {
    padding: 0.625rem;
    font-size: 0.8rem;
  }

  @media (max-width: 480px) {
    padding: 0.5rem;
    font-size: 0.75rem;
  }
`;

const TemplatesLabel = styled.div`
  font-size: 0.75rem;
  margin-bottom: 0.5rem;
  opacity: 0.8;

  @media (max-width: 480px) {
    font-size: 0.7rem;
  }
`;

const templates: Template[] = [
  {
    label: "🍻 Happy Hour",
    prompt:
      "Create a happy hour promotion with discounted drinks for after-work crowd. Include time range and discount.",
  },
  {
    label: "👩‍🎤 Ladies Night",
    prompt:
      "Create a ladies night promotion with free entry and drink specials for women.",
  },
  {
    label: "🎵 Live Music",
    prompt:
      "Create a live music event promotion featuring local artists or DJs.",
  },
  {
    label: "🏈 Game Night",
    prompt:
      "Create a sports game viewing party promotion with food and drink specials.",
  },
  {
    label: "⭐ VIP Offer",
    prompt:
      "Create a VIP pass promotion with skip-the-line benefits and exclusive area access.",
  },
  {
    label: "🎉 Weekend Special",
    prompt:
      "Create a weekend party promotion with DJ, bottle service, and midnight champagne toast.",
  },
  {
    label: "🍽️ Food Special",
    prompt:
      "Create a food special promotion like 'Buy one get one free' on appetizers or discounted food menu.",
  },
  {
    label: "🥂 First Date",
    prompt:
      "Create a romantic promotion for couples with special cocktails and shareable platters.",
  },
];

export default function AIPromotionGenerator({
  barId,
  onGenerate,
  currentType,
  currentAudience,
}: AIPromotionGeneratorProps) {
  const [prompt, setPrompt] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generated, setGenerated] = useState<GeneratedPromotion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generatePromotion = async () => {
    if (!prompt.trim()) {
      setError("Please describe what promotion you want to create");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGenerated(null);

    try {
      const token = localStorage.getItem("hoppr_token");
      const response = await fetch(
        `/api/auth/bar/${barId}/promotions/ai-generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            prompt: prompt,
            type: currentType,
            targetAudience: currentAudience,
          }),
        },
      );

      const data = await response.json();

      if (response.ok && data.success) {
        const promotionData: GeneratedPromotion = {
          title: data.promotion.title,
          description: data.promotion.description,
          type: data.promotion.type as PromotionType,
          discount: data.promotion.discount,
          callToAction: data.promotion.callToAction,
          accentColor: data.promotion.accentColor,
          conditions: data.promotion.conditions,
        };
        setGenerated(promotionData);
        onGenerate(promotionData);
      } else {
        throw new Error(data.error || "Generation failed");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate promotion",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const selectTemplate = (templatePrompt: string) => {
    setPrompt(templatePrompt);
  };

  return (
    <Container>
      <Title>🤖 AI Promotion Generator</Title>
      <Description>
        Describe what kind of promotion you want, and AI will create a
        professional promotion for your bar!
      </Description>

      <TemplatesLabel>Quick templates:</TemplatesLabel>
      <TemplatesGrid>
        {templates.map((template) => (
          <TemplateButton
            key={template.label}
            onClick={() => selectTemplate(template.prompt)}
          >
            {template.label}
          </TemplateButton>
        ))}
      </TemplatesGrid>

      <PromptInput
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Example: Create a happy hour promotion for young professionals on Friday evenings with 20% off cocktails and free entry before 8 PM..."
      />

      <GenerateButton
        onClick={generatePromotion}
        disabled={isGenerating || !prompt.trim()}
      >
        {isGenerating ? "✨ Generating..." : "🤖 Generate Promotion with AI"}
      </GenerateButton>

      {error && <ErrorMessage>❌ {error}</ErrorMessage>}

      {generated && (
        <PreviewCard>
          <PreviewHeader>
            <span>✨</span>
            <strong style={{ color: "#166534" }}>
              AI Generated Promotion!
            </strong>
          </PreviewHeader>
          <PreviewTitle>{generated.title}</PreviewTitle>
          <PreviewText>{generated.description}</PreviewText>
          <PreviewDetails>
            <strong>Type:</strong> {generated.type.replace("_", " ")}
            <br />
            {generated.discount && (
              <>
                <strong>Discount:</strong> {generated.discount}% OFF
                <br />
              </>
            )}
            <strong>Call to Action:</strong> {generated.callToAction}
            <br />
            <strong>Brand Color:</strong> {generated.accentColor}
            <br />
            <strong>Terms:</strong> {generated.conditions}
          </PreviewDetails>
          <div
            style={{
              marginTop: "0.75rem",
              fontSize: "0.75rem",
              color: "#15803d",
            }}
          >
            ✅ This has been auto-filled in the form below. Review and submit
            for approval!
          </div>
        </PreviewCard>
      )}
    </Container>
  );
}
