"use client";

import { useState } from "react";
import styled from "styled-components";

// ---- Types ----

export type ContentTone =
  | "BOLD_ENERGETIC"
  | "WARM_INVITING"
  | "EDGY_IRREVERENT"
  | "ELEGANT_PREMIUM"
  | "PLAYFUL_FUN";

interface ToneOption {
  value: ContentTone;
  label: string;
  emoji: string;
  description: string;
  sampleHeadline: string;
  sampleBody: string;
  socialStyle: string;
}

export const TONE_OPTIONS: ToneOption[] = [
  {
    value: "BOLD_ENERGETIC",
    label: "Bold & Energetic",
    emoji: "🔥",
    description: "Short punchy headlines, high-energy CTAs, high-contrast visuals",
    sampleHeadline: "TONIGHT. 2-for-1 cocktails. Let's go.",
    sampleBody: "The weekend starts here. No reservations, just show up.",
    socialStyle: "High contrast, loud typography, urgent countdowns",
  },
  {
    value: "WARM_INVITING",
    label: "Warm & Inviting",
    emoji: "🍷",
    description: "Softer language, hospitality-focused, cozy and welcoming imagery",
    sampleHeadline: "Join us for a relaxed evening. The terrace is open.",
    sampleBody: "Good drinks, better company, and a seat waiting just for you.",
    socialStyle: "Warm gradients, soft typography, inviting photography",
  },
  {
    value: "EDGY_IRREVERENT",
    label: "Edgy & Irreverent",
    emoji: "🎸",
    description: "Casual, direct, personality-driven, doesn't try too hard",
    sampleHeadline: "Beer's cold. Music's loud. You coming or what?",
    sampleBody: "No dress code. No velvet rope. Just a good time and questionable decisions.",
    socialStyle: "Bold monochrome, raw photography, minimal but loud",
  },
  {
    value: "ELEGANT_PREMIUM",
    label: "Elegant & Premium",
    emoji: "🥂",
    description: "Minimal, sophisticated, no exclamation marks, understated luxury",
    sampleHeadline: "Craft cocktails. Live jazz. This Friday.",
    sampleBody: "An evening of considered drinks, accomplished musicians, and quiet luxury.",
    socialStyle: "Minimalist, muted palettes, thin typography, negative space",
  },
  {
    value: "PLAYFUL_FUN",
    label: "Playful & Fun",
    emoji: "🎉",
    description: "Emoji-friendly, upbeat, event-energy, doesn't take itself seriously",
    sampleHeadline: "🎉 Karaoke night! Grab the mic, we'll grab the drinks 🍸",
    sampleBody: "Warning: may cause spontaneous dancing, new friendships, and lost voices.",
    socialStyle: "Bright colors, playful typography, confetti/party motifs",
  },
];

// ---- Tone-to-template compatibility ----

/** Which visual templates suit each tone best */
export const TONE_TEMPLATE_COMPATIBILITY: Record<ContentTone, { preferred: string[]; avoid: string[] }> = {
  BOLD_ENERGETIC: {
    preferred: ["split", "card"],
    avoid: ["centered"],
  },
  WARM_INVITING: {
    preferred: ["card", "centered"],
    avoid: [],
  },
  EDGY_IRREVERENT: {
    preferred: ["split", "card"],
    avoid: ["centered"],
  },
  ELEGANT_PREMIUM: {
    preferred: ["centered", "card"],
    avoid: ["split"],
  },
  PLAYFUL_FUN: {
    preferred: ["card", "split"],
    avoid: [],
  },
};

/** Which visual moods suit each tone best */
export const TONE_MOOD_COMPATIBILITY: Record<ContentTone, { preferred: string[]; avoid: string[] }> = {
  BOLD_ENERGETIC: {
    preferred: ["vibrant", "dark"],
    avoid: ["minimal", "warm"],
  },
  WARM_INVITING: {
    preferred: ["warm", "minimal"],
    avoid: ["dark"],
  },
  EDGY_IRREVERENT: {
    preferred: ["dark", "vibrant"],
    avoid: ["warm"],
  },
  ELEGANT_PREMIUM: {
    preferred: ["minimal", "cool"],
    avoid: ["vibrant"],
  },
  PLAYFUL_FUN: {
    preferred: ["vibrant", "warm"],
    avoid: ["dark"],
  },
};

/**
 * Generate the AI prompt instruction for a given tone.
 * Injected into the DeepSeek prompt as a system-level voice directive.
 */
export function tonePromptInstruction(tone: ContentTone | null | undefined): string {
  if (!tone) return "";

  const option = TONE_OPTIONS.find((o) => o.value === tone);
  if (!option) return "";

  switch (tone) {
    case "BOLD_ENERGETIC":
      return `VOICE: "${option.label}". Write like a hype-person who respects the reader's time. Short sentences. Active verbs. Direct CTAs. No hedging, no filler. Use urgency when appropriate (tonight, now, this weekend). Avoid: passive voice, formal language, long paragraphs. Social caption style: ${option.socialStyle}.`;
    case "WARM_INVITING":
      return `VOICE: "${option.label}". Write like a hospitable host welcoming friends. Warm, inclusive language. Focus on atmosphere and experience over deals. Use words like: join us, welcome, relaxed, cosy, together. Avoid: aggressive sales language, exclamation marks, FOMO tactics. Social caption style: ${option.socialStyle}.`;
    case "EDGY_IRREVERENT":
      return `VOICE: "${option.label}". Write like the bar itself is talking — casual, direct, unpolished. Short punchy sentences. Personality over polish. Humor is welcome. Avoid: corporate language, exclamation marks, marketing clichés, anything that sounds like it was written by a committee. Social caption style: ${option.socialStyle}.`;
    case "ELEGANT_PREMIUM":
      return `VOICE: "${option.label}". Write with restrained sophistication. Understated. No exclamation marks. Let quality speak for itself. Use words like: craft, curated, considered, evening, experience. Avoid: discount language, urgency, slang, emojis, loud formatting. Social caption style: ${option.socialStyle}.`;
    case "PLAYFUL_FUN":
      return `VOICE: "${option.label}". Write like the life of the party — upbeat, emoji-friendly, slightly cheeky. Fun over formal. Energy over elegance. Use emojis naturally. Avoid: corporate language, formality, restraint. Social caption style: ${option.socialStyle}.`;
    default:
      return "";
  }
}

// ---- Visual presets (mirrors ai-generate route VISUAL_PRESETS) ----

interface ToneVisualPreset {
  template: "split" | "centered" | "card";
  mood: "warm" | "cool" | "vibrant" | "dark" | "minimal";
  overlayOpacity: number;
  accentColor: string;
}

/**
 * Default visual preset for each tone — used by the preview panel so
 * selecting a tone immediately updates the social card's look even before
 * AI generation runs. Picks the first compatible preset from each tone's
 * preference list (same logic as the ai-generate API route).
 */
export const TONE_DEFAULT_VISUAL: Record<ContentTone, ToneVisualPreset> = {
  BOLD_ENERGETIC:   { template: "split",    mood: "warm",    overlayOpacity: 0.35, accentColor: "#f59e0b" },
  WARM_INVITING:    { template: "split",    mood: "warm",    overlayOpacity: 0.35, accentColor: "#f59e0b" },
  EDGY_IRREVERENT:  { template: "card",     mood: "dark",    overlayOpacity: 0.4,  accentColor: "#8b5cf6" },
  ELEGANT_PREMIUM:  { template: "centered", mood: "cool",    overlayOpacity: 0.45, accentColor: "#3b82f6" },
  PLAYFUL_FUN:      { template: "card",     mood: "vibrant", overlayOpacity: 0.3,  accentColor: "#ef4444" },
};

// ---- Styled Components ----

const Container = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.25rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
`;

const Hint = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0 0 1rem 0;
`;

const ToneGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem;
`;

const ToneCard = styled.button<{ $selected: boolean }>`
  text-align: left;
  padding: 1rem;
  border-radius: 0.625rem;
  border: 2px solid ${({ $selected }) => ($selected ? "#7c3aed" : "#e5e7eb")};
  background: ${({ $selected }) => ($selected ? "#f5f3ff" : "white")};
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;

  &:hover {
    border-color: ${({ $selected }) => ($selected ? "#7c3aed" : "#d1d5db")};
    background: ${({ $selected }) => ($selected ? "#f5f3ff" : "#f9fafb")};
  }
`;

const ToneEmoji = styled.span`
  font-size: 1.5rem;
  line-height: 1;
`;

const ToneName = styled.span`
  font-size: 0.8125rem;
  font-weight: 700;
  color: #1f2937;
`;

const ToneDesc = styled.span`
  font-size: 0.6875rem;
  color: #6b7280;
  line-height: 1.4;
`;

const SampleBox = styled.div`
  margin-top: 0.5rem;
  padding: 0.625rem;
  background: #f9fafb;
  border-radius: 0.375rem;
  border: 1px solid #f3f4f6;
`;

const SampleHeadline = styled.div`
  font-size: 0.6875rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
  font-style: italic;
`;

const SampleBody = styled.div`
  font-size: 0.625rem;
  color: #6b7280;
  font-style: italic;
  line-height: 1.4;
`;

const SelectedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #7c3aed;
  margin-top: 0.25rem;
`;

// ---- Component ----

interface ToneSelectorProps {
  value: ContentTone | null | undefined;
  onChange: (tone: ContentTone) => void;
  compact?: boolean;
}

export default function ToneSelector({ value, onChange, compact }: ToneSelectorProps) {
  return (
    <Container>
      <Label>How does your bar talk to customers?</Label>
      <Hint>
        This controls the voice and visual style of your social media promo cards.
        You can change it anytime. Pick the one that feels most like your bar.
      </Hint>
      <ToneGrid>
        {TONE_OPTIONS.map((option) => {
          const isSelected = value === option.value;
          return (
            <ToneCard
              key={option.value}
              $selected={isSelected}
              onClick={() => onChange(option.value)}
              type="button"
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <ToneEmoji>{option.emoji}</ToneEmoji>
                <div>
                  <ToneName>{option.label}</ToneName>
                  <ToneDesc>{option.description}</ToneDesc>
                </div>
              </div>
              {(!compact || isSelected) && (
                <SampleBox>
                  <SampleHeadline>"{option.sampleHeadline}"</SampleHeadline>
                  <SampleBody>"{option.sampleBody}"</SampleBody>
                </SampleBox>
              )}
              {isSelected && (
                <SelectedBadge>✓ Selected</SelectedBadge>
              )}
            </ToneCard>
          );
        })}
      </ToneGrid>
    </Container>
  );
}
