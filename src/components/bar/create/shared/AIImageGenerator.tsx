"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import styled from "styled-components";
import { SkeletonBox } from "@/components/ui/Skeleton";
import {
  STYLE_PRESETS,
  SUBJECT_PRESETS,
  COMPOSITION_PRESETS,
} from "@/lib/prompts/build-image-prompt";
import type { ContentType } from "@/components/bar/create/types";

// ---- Styled ----

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SectionLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const Chip = styled.button<{ $selected: boolean; $dark?: boolean }>`
  padding: 0.5rem 0.875rem;
  border-radius: 2rem;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid
    ${({ $selected, $dark }) =>
      $selected ? "#8b5cf6" : $dark ? "#374151" : "#d1d5db"};
  background: ${({ $selected, $dark }) =>
    $selected ? "rgba(139, 92, 246, 0.12)" : $dark ? "#1f2937" : "white"};
  color: ${({ $selected, $dark }) =>
    $selected ? "#8b5cf6" : $dark ? "#d1d5db" : "#374151"};

  &:hover {
    border-color: #8b5cf6;
    background: ${({ $dark }) =>
      $dark ? "rgba(139, 92, 246, 0.08)" : "rgba(139, 92, 246, 0.04)"};
  }
`;

const PreviewText = styled.div`
  font-size: 0.8125rem;
  color: #6b7280;
  padding: 0.5rem 0.75rem;
  background: #f3f4f6;
  border-radius: 0.5rem;
  font-style: italic;
`;

const GenerateButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #8b5cf6, #6d28d9);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
  width: 100%;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const ResultCard = styled.button<{ $selected: boolean }>`
  aspect-ratio: 1;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 3px solid ${({ $selected }) => ($selected ? "#8b5cf6" : "transparent")};
  cursor: pointer;
  padding: 0;
  background: #f3f4f6;
  transition: all 0.15s ease;
  position: relative;

  &:hover {
    transform: scale(1.02);
    border-color: ${({ $selected }) => ($selected ? "#8b5cf6" : "#a78bfa")};
  }
`;

const ResultImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const SelectedBadge = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #8b5cf6;
  color: white;
  font-size: 0.625rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  text-transform: uppercase;
`;

const GeneratingOverlay = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const GeneratingCard = styled.div`
  aspect-ratio: 1;
  border-radius: 0.75rem;
  overflow: hidden;
`;

const ErrorBlock = styled.div`
  padding: 0.75rem 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  color: #dc2626;
  font-size: 0.8125rem;
`;

const WarningBlock = styled.div`
  padding: 0.5rem 0.75rem;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 0.5rem;
  color: #92400e;
  font-size: 0.75rem;
`;

const CostBadge = styled.span`
  font-size: 0.6875rem;
  color: #9ca3af;
  margin-left: 0.5rem;
  font-weight: 400;
`;

// ---- Component ----

interface AIImageGeneratorProps {
  barId: string;
  contentType: ContentType;
  formTitle?: string;
  formDescription?: string;
  formPromotionType?: string;
  barName?: string;
  onSelect: (url: string) => void;
  dark?: boolean;
}

export default function AIImageGenerator({
  barId,
  contentType,
  formTitle,
  formDescription,
  formPromotionType,
  barName,
  onSelect,
  dark,
}: AIImageGeneratorProps) {
  const [styleId, setStyleId] = useState("warm_cozy");
  const [subjectId, setSubjectId] = useState("interior");
  const [compositionId, setCompositionId] = useState("wide");

  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [cooldown, setCooldown] = useState(0); // seconds left before next generation allowed

  const selectedStyle = STYLE_PRESETS.find((s) => s.id === styleId);
  const selectedSubject = SUBJECT_PRESETS.find((s) => s.id === subjectId);
  const selectedComposition = COMPOSITION_PRESETS.find((c) => c.id === compositionId);

  const promptPreview = [selectedStyle?.label, selectedSubject?.label, selectedComposition?.label]
    .filter(Boolean)
    .join(" · ");

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    setWarnings([]);
    setResults([]);
    setSelectedUrl(null);

    try {
      const token = localStorage.getItem("hoppr_token");
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const res = await fetch(`/api/auth/bar/${barId}/images/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          styleId,
          subjectId,
          compositionId,
          contentType,
          count: 2,
          formContext: {
            title: formTitle,
            description: formDescription,
            promotionType: formPromotionType,
            barName,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.blockedReasons) {
          setError(
            `Content policy: ${data.blockedReasons.join(". ")}`,
          );
        } else {
          setError(data.error || data.hint || "Generation failed");
        }
        return;
      }

      setResults(data.urls || []);
      setPreview(data.preview || "");
      setWarnings(data.warnings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
      // Start cooldown after every generation to prevent rapid regeneration spam
      setCooldown(30);
    }
  }, [
    barId, styleId, subjectId, compositionId, contentType,
    formTitle, formDescription, formPromotionType, barName,
  ]);

  // Cooldown countdown timer
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (cooldown > 0) {
      cooldownRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            if (cooldownRef.current) clearInterval(cooldownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [cooldown > 0]); // only re-run when cooldown transitions to/from active

  const handleSelect = useCallback(
    (url: string) => {
      setSelectedUrl(url);
      onSelect(url);
    },
    [onSelect],
  );

  return (
    <Wrapper>
      {/* Style */}
      <div>
        <SectionLabel>Style</SectionLabel>
        <ChipRow>
          {STYLE_PRESETS.map((s) => (
            <Chip
              key={s.id}
              $selected={styleId === s.id}
              $dark={dark}
              onClick={() => setStyleId(s.id)}
              title={s.description}
            >
              {s.label}
            </Chip>
          ))}
        </ChipRow>
      </div>

      {/* Subject */}
      <div>
        <SectionLabel>Subject</SectionLabel>
        <ChipRow>
          {SUBJECT_PRESETS.map((s) => (
            <Chip
              key={s.id}
              $selected={subjectId === s.id}
              $dark={dark}
              onClick={() => setSubjectId(s.id)}
            >
              {s.label}
            </Chip>
          ))}
        </ChipRow>
      </div>

      {/* Composition */}
      <div>
        <SectionLabel>Composition</SectionLabel>
        <ChipRow>
          {COMPOSITION_PRESETS.map((c) => (
            <Chip
              key={c.id}
              $selected={compositionId === c.id}
              $dark={dark}
              onClick={() => setCompositionId(c.id)}
            >
              {c.label}
            </Chip>
          ))}
        </ChipRow>
      </div>

      {/* Prompt preview */}
      <PreviewText>{promptPreview}</PreviewText>

      {/* Generate button — always shown (except while generating), replaces previous result */}
      {!generating && (
        <GenerateButton onClick={handleGenerate} disabled={cooldown > 0}>
          {cooldown > 0
            ? `Wait ${cooldown}s`
            : <>Generate<CostBadge>(2 images · ~$0.03)</CostBadge></>
          }
        </GenerateButton>
      )}

      {/* Error */}
      {error && <ErrorBlock>{error}</ErrorBlock>}

      {/* Compliance warnings */}
      {warnings.length > 0 && (
        <WarningBlock>
          {warnings.map((w, i) => (
            <div key={i}>⚠ {w}</div>
          ))}
        </WarningBlock>
      )}

      {/* Generating skeleton */}
      {generating && (
        <GeneratingOverlay>
          {[0, 1].map((i) => (
            <GeneratingCard key={i}>
              <SkeletonBox
                $width="100%"
                $height="100%"
                style={{ borderRadius: "0.75rem", aspectRatio: "1" }}
              />
            </GeneratingCard>
          ))}
        </GeneratingOverlay>
      )}

      {/* Results grid */}
      {results.length > 0 && !generating && (
        <ResultsGrid>
          {results.map((url, i) => (
            <ResultCard
              key={i}
              $selected={selectedUrl === url}
              onClick={() => handleSelect(url)}
            >
              <ResultImage
                src={url}
                alt={`Generated option ${i + 1}`}
                loading="lazy"
              />
              {selectedUrl === url && <SelectedBadge>Selected</SelectedBadge>}
            </ResultCard>
          ))}
        </ResultsGrid>
      )}
    </Wrapper>
  );
}
