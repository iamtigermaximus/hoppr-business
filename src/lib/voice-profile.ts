// src/lib/voice-profile.ts
// ============================================================================
// BAR VOICE PROFILE — Persistent brand voice memory
// ============================================================================
//
// Tracks tone usage, template preferences, and audience targeting per bar
// across content generation sessions. The creative director references this
// profile to maintain a consistent brand voice by default, with an explicit
// override mechanism when the bar wants to try something new.
//
// Data lives in the BarVoiceProfile Prisma model. This module provides
// the read/update logic and prompt-injection formatting.
//
// CLIENT SAFETY: buildVoiceProfileBlock() and getVoiceSummary() are pure
// functions that can be called from the browser. getVoiceProfile() and
// updateVoiceProfile() are server-only — they lazy-import prisma so the
// module can be imported client-side without throwing.
// ============================================================================

import type { ContentTone } from "./prompts/tone-voices";

// ---- Types ----

/** Shape of the JSON stored in BarVoiceProfile.toneUsage */
export type ToneUsage = Partial<Record<ContentTone, number>>;

/** Shape of the JSON stored in BarVoiceProfile.templateUsage */
export type TemplateUsage = Record<string, number>;

/** Flattened voice profile returned to the client */
export interface VoiceProfile {
  preferredTone: ContentTone | null;
  toneUsage: ToneUsage;
  totalGenerations: number;
  frequentTemplates: TemplateUsage;
  preferredAudience: string[];
  lastUsedAt: string | null;
}

/** Payload for updating the voice profile after a generation */
export interface VoiceProfileUpdate {
  /** The tone used in this generation */
  tone?: ContentTone | null;
  /** The template ID used (kebab-case) */
  template?: string | null;
  /** Audience chips targeted */
  audience?: string[];
}

// ---- Defaults ----

const EMPTY_TONE_USAGE: ToneUsage = {};

// ---- CRUD ----

/**
 * Fetch the voice profile for a bar. Creates a default empty profile
 * if one doesn't exist yet (first-generation scenario).
 */
export async function getVoiceProfile(barId: string): Promise<VoiceProfile> {
  const { prisma } = await import("./database");
  let profile = await prisma.barVoiceProfile.findUnique({
    where: { barId },
  });

  if (!profile) {
    profile = await prisma.barVoiceProfile.create({
      data: { barId },
    });
  }

  return formatProfile(profile);
}

/**
 * Update the voice profile after a content generation.
 * Increments tone/template usage counts, merges audience data,
 * and bumps totalGenerations. Non-blocking — should be called
 * fire-and-forget after the generation succeeds.
 */
export async function updateVoiceProfile(
  barId: string,
  update: VoiceProfileUpdate,
): Promise<void> {
  const { prisma } = await import("./database");
  const existing = await prisma.barVoiceProfile.findUnique({
    where: { barId },
  });

  const currentToneUsage = (existing?.toneUsage as ToneUsage) ?? {};
  const currentTemplateUsage = (existing?.templateUsage as TemplateUsage) ?? {};
  const currentAudience = (existing?.preferredAudience as string[]) ?? [];

  // Increment tone usage counter
  if (update.tone) {
    currentToneUsage[update.tone] = (currentToneUsage[update.tone] || 0) + 1;
  }

  // Increment template usage counter
  if (update.template) {
    currentTemplateUsage[update.template] =
      (currentTemplateUsage[update.template] || 0) + 1;
  }

  // Merge audience — add new segments, keep existing order, deduplicate
  const mergedAudience = [...currentAudience];
  if (update.audience) {
    for (const segment of update.audience) {
      if (!mergedAudience.includes(segment)) {
        mergedAudience.push(segment);
      }
    }
  }

  await prisma.barVoiceProfile.upsert({
    where: { barId },
    create: {
      barId,
      totalGenerations: 1,
      toneUsage: update.tone
        ? { [update.tone]: 1 }
        : EMPTY_TONE_USAGE,
      templateUsage: update.template
        ? { [update.template]: 1 }
        : {},
      preferredAudience: update.audience ?? [],
      lastUsedAt: new Date(),
    },
    update: {
      totalGenerations: (existing?.totalGenerations ?? 0) + 1,
      toneUsage: currentToneUsage,
      templateUsage: currentTemplateUsage,
      preferredAudience: mergedAudience,
      lastUsedAt: new Date(),
    },
  });
}

// ---- Helpers ----

function formatProfile(profile: {
  toneUsage: unknown;
  templateUsage: unknown;
  preferredAudience: unknown;
  totalGenerations: number;
  lastUsedAt: Date | null;
}): VoiceProfile {
  const toneUsage = (profile.toneUsage as ToneUsage) ?? {};
  const templateUsage = (profile.templateUsage as TemplateUsage) ?? {};
  const preferredAudience = (profile.preferredAudience as string[]) ?? [];

  // Derive preferred tone: the tone with the highest usage count
  const preferredTone = derivePreferredTone(toneUsage);

  return {
    preferredTone,
    toneUsage,
    totalGenerations: profile.totalGenerations,
    frequentTemplates: templateUsage,
    preferredAudience,
    lastUsedAt: profile.lastUsedAt?.toISOString() ?? null,
  };
}

/** Pick the tone with the highest usage count. Returns null if no data. */
function derivePreferredTone(toneUsage: ToneUsage): ContentTone | null {
  let best: ContentTone | null = null;
  let bestCount = 0;

  for (const [tone, count] of Object.entries(toneUsage)) {
    if ((count as number) > bestCount) {
      bestCount = count as number;
      best = tone as ContentTone;
    }
  }

  return best;
}

// ---- Prompt Injection ----

/**
 * Build a voice profile context block for injection into AI system prompts.
 * Gives the creative director awareness of the bar's established voice so it
 * maintains consistency across sessions.
 *
 * Returns an empty string if the profile is too thin (fewer than 2 generations).
 */
export function buildVoiceProfileBlock(
  profile: VoiceProfile,
  language: "en" | "fi" = "en",
): string {
  // Don't inject voice profile until there's enough history to be meaningful
  if (profile.totalGenerations < 2) return "";

  const isFi = language === "fi";

  // Preferred tone line
  const toneLabels: Record<ContentTone, { en: string; fi: string }> = {
    WARM_INVITING: { en: "Warm & Inviting", fi: "Lämmin & Kutsuva" },
    BOLD_ENERGETIC: { en: "Bold & Energetic", fi: "Rohkea & Energinen" },
    EDGY_IRREVERENT: { en: "Edgy & Irreverent", fi: "Räväkkä & Epäkunnioittava" },
    ELEGANT_PREMIUM: { en: "Elegant & Premium", fi: "Tyylikäs & Premium" },
    PLAYFUL_FUN: { en: "Playful & Fun", fi: "Leikkisä & Hauska" },
    COMMUNITY_LOCAL: { en: "Community & Local", fi: "Yhteisöllinen & Paikallinen" },
    ROMANTIC_INTIMATE: { en: "Romantic & Intimate", fi: "Romanttinen & Intiimi" },
    MYSTERIOUS_EXCLUSIVE: { en: "Mysterious & Exclusive", fi: "Salaperäinen & Eksklusiivinen" },
    ADVENTUROUS_CURIOUS: { en: "Adventurous & Curious", fi: "Seikkailunhaluinen & Utelias" },
    NOSTALGIC_CLASSIC: { en: "Nostalgic & Classic", fi: "Nostalginen & Klassinen" },
  };

  const toneLine = profile.preferredTone
    ? (isFi
        ? `Ensisijainen äänensävy: ${toneLabels[profile.preferredTone]?.fi ?? profile.preferredTone} (käytetty ${profile.totalGenerations} kertaa ${profile.totalGenerations} kerrasta — tämä on vakiintunut ääni)`
        : `Preferred tone: ${toneLabels[profile.preferredTone]?.en ?? profile.preferredTone} (used in most of ${profile.totalGenerations} total generations — this is the established voice)`)
    : (isFi
        ? `Yhteensä ${profile.totalGenerations} sisällöntuotantoa — äänensävy ei ole vielä vakiintunut`
        : `${profile.totalGenerations} total generations — voice not yet established`);

  // Frequent templates line
  const topTemplates = Object.entries(profile.frequentTemplates)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([id]) => id);
  const templateLine = topTemplates.length > 0
    ? (isFi
        ? `Useimmin käytetyt sisältömallit: ${topTemplates.join(", ")}`
        : `Most-used content templates: ${topTemplates.join(", ")}`)
    : "";

  // Audience preference line
  const audienceLine = profile.preferredAudience.length > 0
    ? (isFi
        ? `Tyypilliset kohderyhmät: ${profile.preferredAudience.join(", ")}`
        : `Typical audience segments: ${profile.preferredAudience.join(", ")}`)
    : "";

  const parts = [toneLine, templateLine, audienceLine].filter(Boolean);
  if (parts.length === 0) return "";

  const header = isFi
    ? "BAARIN ÄÄNIPROFIILI — Tämä baari on kehittänyt tunnistettavan brändi-identiteetin:"
    : "BAR VOICE PROFILE — This bar has developed a recognizable brand identity:";
  const body = parts.map((p) => `- ${p}`).join("\n");
  const directive = isFi
    ? "\n\nOHJE: Oletuksena käytä tätä vakiintunutta ääntä kaikessa sisällössä. Poikkea vain, jos käyttäjä erikseen pyytää eri tyyliä tai luova konsepti aidosti hyötyy poikkeamasta."
    : "\n\nDIRECTIVE: Default to this established voice for all content. Only deviate if the user explicitly requests a different style or the creative concept genuinely benefits from a departure.";

  return `\n\n${header}\n${body}${directive}`;
}

/**
 * Get a compact summary for the UI — shown as a subtle indicator
 * that the bar has an established voice. Returns null if the profile
 * is too thin.
 */
export function getVoiceSummary(
  profile: VoiceProfile,
  language: "en" | "fi" = "en",
): { label: string; tone: string; hasHistory: boolean } | null {
  if (profile.totalGenerations < 2 || !profile.preferredTone) return null;

  const toneLabels: Record<ContentTone, string> = {
    WARM_INVITING: language === "fi" ? "Lämmin & Kutsuva" : "Warm & Inviting",
    BOLD_ENERGETIC: language === "fi" ? "Rohkea & Energinen" : "Bold & Energetic",
    EDGY_IRREVERENT: language === "fi" ? "Räväkkä" : "Edgy",
    ELEGANT_PREMIUM: language === "fi" ? "Tyylikäs & Premium" : "Elegant & Premium",
    PLAYFUL_FUN: language === "fi" ? "Leikkisä & Hauska" : "Playful & Fun",
    COMMUNITY_LOCAL: language === "fi" ? "Yhteisöllinen & Paikallinen" : "Community & Local",
    ROMANTIC_INTIMATE: language === "fi" ? "Romanttinen & Intiimi" : "Romantic & Intimate",
    MYSTERIOUS_EXCLUSIVE: language === "fi" ? "Salaperäinen & Eksklusiivinen" : "Mysterious & Exclusive",
    ADVENTUROUS_CURIOUS: language === "fi" ? "Seikkailunhaluinen & Utelias" : "Adventurous & Curious",
    NOSTALGIC_CLASSIC: language === "fi" ? "Nostalginen & Klassinen" : "Nostalgic & Classic",
  };

  return {
    label: language === "fi" ? "Sinun äänesi" : "Your voice",
    tone: toneLabels[profile.preferredTone] ?? profile.preferredTone,
    hasHistory: true,
  };
}
