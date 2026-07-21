// src/lib/utils/platform-validator.ts
// ============================================================================
// PLATFORM-AWARE VALIDATION — Character limits & readability scoring
// ============================================================================
//
// Content created in Hoppr is distributed across multiple channels:
// - Instagram/Facebook cards (OG image + caption)
// - Push notifications to app users
// - Email subject lines and previews
// - In-app feed cards
//
// Each platform has different truncation points. This module checks content
// against real platform limits and provides readability scoring so bar staff
// can optimize before publishing.
//
// Platform limit sources:
// - Instagram caption: 2,200 chars max, ~125 visible before "more" fold
// - Instagram card title overlay: ~40 chars comfortable on 1080×1080 card
// - iOS push notification: ~110 chars before "..." truncation
// - Android push (collapsed): ~65 chars, expanded ~130
// - Email subject (mobile): ~40-50 chars visible
// - SMS/push preview: ~90 chars comfortable
// ============================================================================

// ---------------------------------------------------------------------------
// Platform Definitions
// ---------------------------------------------------------------------------

export interface PlatformLimit {
  id: string;
  label: string;
  /** Soft limit — content is still usable but not optimal */
  softLimit: number;
  /** Hard limit — content gets truncated or cut off beyond this */
  hardLimit: number;
  /** What field this limit applies to */
  field: "title" | "description" | "cta" | "combined";
  /** Description shown in the UI */
  description: string;
}

export const PLATFORM_LIMITS: PlatformLimit[] = [
  {
    id: "instagram-card-title",
    label: "IG Card Title",
    softLimit: 35,
    hardLimit: 50,
    field: "title",
    description: "Title visible on Instagram story/frame card — longer titles get cut off on smaller screens",
  },
  {
    id: "instagram-caption",
    label: "IG Caption",
    softLimit: 120,
    hardLimit: 2200,
    field: "description",
    description: "Caption text — first 125 chars visible before 'more' fold on Instagram",
  },
  {
    id: "push-ios",
    label: "Push (iOS)",
    softLimit: 80,
    hardLimit: 110,
    field: "title",
    description: "Push notification on iPhone — truncated with '...' beyond 110 chars",
  },
  {
    id: "push-android-collapsed",
    label: "Push (Android)",
    softLimit: 50,
    hardLimit: 65,
    field: "title",
    description: "Android notification in collapsed tray — only 65 chars visible",
  },
  {
    id: "email-subject",
    label: "Email Subject",
    softLimit: 40,
    hardLimit: 60,
    field: "title",
    description: "Email subject line on mobile — most inboxes show ~40 chars before cutoff",
  },
  {
    id: "sms-preview",
    label: "SMS / Text",
    softLimit: 70,
    hardLimit: 160,
    field: "description",
    description: "SMS preview or notification body — 160 char GSM limit before multi-part",
  },
];

// ---------------------------------------------------------------------------
// Validation Result Types
// ---------------------------------------------------------------------------

export type LimitStatus = "ok" | "soft" | "hard";

export interface PlatformCheck {
  platform: PlatformLimit;
  currentLength: number;
  status: LimitStatus;
  /** Percentage used: 0-100 for hard limit, can exceed 100 */
  percentUsed: number;
}

export interface ReadabilityScore {
  /** Flesch Reading Ease: 0-100 (higher = easier) */
  fleschReadingEase: number;
  /** Approximate US grade level needed to understand */
  gradeLevel: number;
  /** Human-readable label */
  label: "Very Easy" | "Easy" | "Fairly Easy" | "Standard" | "Fairly Difficult" | "Difficult" | "Very Difficult";
  /** Whether this is in the sweet spot for social media (60-80) */
  isSocialOptimal: boolean;
}

export interface PlatformValidationResult {
  /** Per-platform checks */
  checks: PlatformCheck[];
  /** Readability score for the description/body text */
  readability: ReadabilityScore | null;
  /** Summary: true if any hard limit is exceeded */
  hasHardViolations: boolean;
  /** Summary: count of soft-limit warnings */
  softWarningCount: number;
}

// ---------------------------------------------------------------------------
// Readability Scoring
// ---------------------------------------------------------------------------

const SIMPLE_WORDS = new Set([
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "i",
  "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
  "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
  "or", "an", "will", "my", "one", "all", "would", "there", "their",
  "what", "so", "up", "out", "if", "about", "who", "get", "which", "go",
  "me", "when", "make", "can", "like", "time", "no", "just", "him", "know",
  "take", "people", "into", "year", "your", "good", "some", "could", "them",
  "see", "other", "than", "then", "now", "look", "only", "come", "its",
  "over", "think", "also", "back", "after", "use", "two", "how", "our",
  "work", "first", "well", "way", "even", "new", "want", "because", "any",
  "these", "give", "day", "most", "us", "night", "place", "every", "here",
  "live", "music", "bar", "drink", "food", "free", "join", "best", "come",
  "tonight", "today", "special", "offer", "event", "time", "great", "fun",
  "weekend", "friday", "saturday", "happy", "hour", "party", "dance", "love",
]);

/**
 * Calculate Flesch Reading Ease score.
 * Formula: 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
 *
 * For social media content, we target 60-80 (Standard to Fairly Easy).
 * Above 80 is very easy (good for broad reach), below 50 is difficult.
 */
export function calculateReadability(text: string): ReadabilityScore | null {
  if (!text || text.trim().length === 0) return null;

  // Clean and tokenize
  const cleaned = text.replace(/[^\w\s.!?]/g, "").trim();
  const sentences = cleaned.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = cleaned.split(/\s+/).filter((w) => w.length > 0);

  if (words.length === 0) return null;

  const sentenceCount = Math.max(sentences.length, 1);
  const wordCount = words.length;

  // Estimate syllables (simplified: count vowel groups)
  let syllableCount = 0;
  for (const word of words) {
    syllableCount += estimateSyllables(word);
  }

  // Flesch Reading Ease
  const wordsPerSentence = wordCount / sentenceCount;
  const syllablesPerWord = syllableCount / wordCount;
  let fleschScore = 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord;

  // Clamp to 0-100
  fleschScore = Math.max(0, Math.min(100, fleschScore));

  // Flesch-Kincaid Grade Level
  const gradeLevel = 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;

  // Label mapping
  let label: ReadabilityScore["label"];
  if (fleschScore >= 90) label = "Very Easy";
  else if (fleschScore >= 80) label = "Easy";
  else if (fleschScore >= 70) label = "Fairly Easy";
  else if (fleschScore >= 60) label = "Standard";
  else if (fleschScore >= 50) label = "Fairly Difficult";
  else if (fleschScore >= 30) label = "Difficult";
  else label = "Very Difficult";

  return {
    fleschReadingEase: Math.round(fleschScore),
    gradeLevel: Math.round(gradeLevel * 10) / 10,
    label,
    isSocialOptimal: fleschScore >= 55 && fleschScore <= 85,
  };
}

/** Simple syllable estimation for English words */
function estimateSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;

  // Count vowel groups
  let count = 0;
  let prevVowel = false;
  for (const ch of w) {
    const isVowel = "aeiouy".includes(ch);
    if (isVowel && !prevVowel) count++;
    prevVowel = isVowel;
  }

  // Adjust for common endings
  if (w.endsWith("e") && count > 1) count--; // silent e
  if (w.endsWith("le") && w.length > 3) count++; // -le syllable
  if (w.endsWith("es") && !"aeiouy".includes(w[w.length - 3] || "")) count--; // plural -es often doesn't add syllable

  return Math.max(1, count);
}

// ---------------------------------------------------------------------------
// Platform Validation
// ---------------------------------------------------------------------------

/**
 * Run platform-aware validation on a content variant.
 * Checks title and description against all relevant platform limits
 * and calculates readability for the description text.
 */
export function validatePlatform(
  title: string,
  description: string,
  cta?: string,
): PlatformValidationResult {
  const checks: PlatformCheck[] = [];

  for (const limit of PLATFORM_LIMITS) {
    let currentLength: number;
    switch (limit.field) {
      case "title":
        currentLength = (title || "").length;
        break;
      case "description":
        currentLength = (description || "").length;
        break;
      case "cta":
        currentLength = (cta || "").length;
        break;
      case "combined":
        currentLength = ((title || "") + " " + (description || "")).length;
        break;
    }

    let status: LimitStatus;
    if (currentLength <= limit.softLimit) {
      status = "ok";
    } else if (currentLength <= limit.hardLimit) {
      status = "soft";
    } else {
      status = "hard";
    }

    checks.push({
      platform: limit,
      currentLength,
      status,
      percentUsed: Math.round((currentLength / limit.hardLimit) * 100),
    });
  }

  const readability = calculateReadability(description);
  const hasHardViolations = checks.some((c) => c.status === "hard");
  const softWarningCount = checks.filter((c) => c.status === "soft").length;

  return { checks, readability, hasHardViolations, softWarningCount };
}

/**
 * Get a prioritized list of platform warnings for display.
 * Only returns checks that have soft or hard violations, sorted by severity.
 */
export function getPlatformWarnings(
  result: PlatformValidationResult,
): PlatformCheck[] {
  return result.checks
    .filter((c) => c.status !== "ok")
    .sort((a, b) => {
      // Hard violations first, then by percentage used
      if (a.status === "hard" && b.status !== "hard") return -1;
      if (b.status === "hard" && a.status !== "hard") return 1;
      return b.percentUsed - a.percentUsed;
    });
}

/**
 * Format a platform check as a human-readable warning message.
 */
export function formatPlatformWarning(check: PlatformCheck): {
  label: string;
  message: string;
} {
  const { platform, currentLength, status } = check;

  if (status === "hard") {
    return {
      label: `${platform.label} — OVER LIMIT`,
      message: `${currentLength}/${platform.hardLimit} chars — ${platform.description}`,
    };
  }

  if (status === "soft") {
    return {
      label: `${platform.label} — Long`,
      message: `${currentLength} chars (optimal: ≤${platform.softLimit}) — may get truncated or lose impact`,
    };
  }

  return { label: platform.label, message: "" };
}

/**
 * Get a color for the limit status (for UI display).
 */
export function getLimitStatusColor(status: LimitStatus): string {
  switch (status) {
    case "hard": return "#ef4444"; // red
    case "soft": return "#f59e0b"; // amber
    case "ok": return "#10b981";   // green
  }
}

/**
 * Get a color for readability score.
 */
export function getReadabilityColor(score: ReadabilityScore): string {
  if (score.isSocialOptimal) return "#10b981"; // green — in the sweet spot
  if (score.fleschReadingEase >= 80) return "#f59e0b"; // amber — very easy, might lack substance
  if (score.fleschReadingEase >= 50) return "#3b82f6"; // blue — acceptable
  return "#ef4444"; // red — too difficult
}
