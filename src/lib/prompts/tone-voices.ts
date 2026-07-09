// src/lib/prompts/tone-voices.ts
// ============================================================================
// TONE VOICE PROFILES — Structured writing rules for each content tone.
//
// Goes beyond one-line voice hints. Each tone has a full set of writing
// constraints that the LLM must follow: sentence length, vocabulary range,
// CTA patterns, punctuation style, emoji usage, rhythm, characteristic
// phrases, and forbidden words/patterns.
//
// When injected into the prompt, these rules produce CONSISTENT voice
// across bars — two bars using "Warm & Inviting" both feel warm, not
// like one got bold and one got flat.
// ============================================================================

export type ContentTone =
  | "BOLD_ENERGETIC"
  | "WARM_INVITING"
  | "EDGY_IRREVERENT"
  | "ELEGANT_PREMIUM"
  | "PLAYFUL_FUN";

export interface ToneVoice {
  id: ContentTone;
  label: { en: string; fi: string };
  emoji: string;

  // Structured writing rules
  sentenceLength: "short" | "medium" | "varied" | "long";
  maxWordsPerSentence: number;
  ctaStyle: string;
  emojiUsage: "none" | "sparse" | "moderate" | "heavy";
  punctuationStyle: string;
  rhythm: string;
  characteristicPhrases: { en: string[]; fi: string[] };
  avoidPatterns: string;

  // Full prompt block — injected into the AI's user message
  promptBlock: { en: string; fi: string };
}

export const TONE_VOICES: Record<ContentTone, ToneVoice> = {
  BOLD_ENERGETIC: {
    id: "BOLD_ENERGETIC",
    label: { en: "Bold & Energetic", fi: "Rohkea & energinen" },
    emoji: "⚡",
    sentenceLength: "short",
    maxWordsPerSentence: 8,
    ctaStyle: "Verbs over adjectives — tell them what to do",
    emojiUsage: "sparse",
    punctuationStyle: "Exclamation marks for energy. Em-dashes for drama. Periods for finality.",
    rhythm: "Staccato. Each sentence lands like a beat drop. No filler between the hits.",
    characteristicPhrases: {
      en: ["Tonight.", "Last call.", "Be there.", "Go big.", "You in?"],
      fi: ["Tänään.", "Viimeinen kutsu.", "Ole siellä.", "Nyt mennään.", "Tuutko?"],
    },
    avoidPatterns:
      "Hedging words (perhaps, maybe), passive voice, filler words, soft invitations, long descriptions.",

    promptBlock: {
      en: `VOICE RULES — Bold & Energetic:
Short punchy sentences. Verbs over adjectives. No hedging. Exclamation energy. Headlines under 5 words. Write like you're counting down to something big. Each line lands like a beat drop.`,

      fi: `ÄÄNISÄÄNNÖT — Rohkea & energinen:
Lyhyitä, iskeviä lauseita. Verbejä adjektiivien sijaan. Ei epäröintiä. Huutomerkkienergiaa. Otsikot alle 5 sanaa. Kirjoita kuin laskisit jotain suurta — jokainen rivi laskeutuu kuin biitti.`,
    },
  },

  WARM_INVITING: {
    id: "WARM_INVITING",
    label: { en: "Warm & Inviting", fi: "Lämmin & kutsuva" },
    emoji: "🍷",
    sentenceLength: "medium",
    maxWordsPerSentence: 15,
    ctaStyle: "Like recommending to a close friend — genuine, never pushy",
    emojiUsage: "sparse",
    punctuationStyle: "Periods. Occasional ellipsis for pause. No exclamation stacks.",
    rhythm: "Flowing and intimate. Sensory build. Make them feel already there, drink in hand.",
    characteristicPhrases: {
      en: ["Your table is waiting.", "Glad you came.", "Stay awhile.", "Welcome in."],
      fi: ["Pöytäsi odottaa.", "Kiva kun tulit.", "Viivy hetki.", "Tervetuloa sisään."],
    },
    avoidPatterns:
      "Aggressive sales, urgency, commands, discount-first framing, slang, exclamation-heavy headlines.",

    promptBlock: {
      en: `VOICE RULES — Warm & Inviting:
Sensory language — touch, smell, sound. Personal pronouns. Write like recommending to a close friend. Soft, intimate rhythm. Make the reader feel they're already sitting at the table, drink in hand, glad they came.`,

      fi: `ÄÄNISÄÄNNÖT — Lämmin & kutsuva:
Aistikieltä — kosketus, tuoksu, ääni. Persoonapronominit. Kirjoita kuin suosittelisit läheiselle ystävälle. Pehmeä, intiimi rytmi. Saa lukija tuntemaan kuin hän istuisi jo pöydässä, juoma kädessä, iloisena että tuli.`,
    },
  },

  EDGY_IRREVERENT: {
    id: "EDGY_IRREVERENT",
    label: { en: "Edgy & Irreverent", fi: "Ronski & railakas" },
    emoji: "💀",
    sentenceLength: "short",
    maxWordsPerSentence: 10,
    ctaStyle: "Subvert expectations — casual, confident, never corporate. Dark humor allowed.",
    emojiUsage: "sparse",
    punctuationStyle: "Periods. One exclamation max. Lowercase for effect. No title case.",
    rhythm: "Irregular. Short punch → deadpan statement → short punch. Like texting a friend who doesn't sugarcoat.",
    characteristicPhrases: {
      en: ["No BS.", "You know the deal.", "Just show up.", "Yeah, that kind of night."],
      fi: ["Suoraan asiaan.", "Sä tiedät.", "Tuut vaan.", "Joo, sellanen ilta."],
    },
    avoidPatterns:
      'Marketing clichés ("curated experience", "unforgettable evening"), corporate warmth, over-selling, formal grammar, apologetic language.',

    promptBlock: {
      en: `VOICE RULES — Edgy & Irreverent:
Unexpected metaphors. Dark humor allowed. Break conventional bar-marketing clichés. No corporate warmth. Subvert expectations. Write like the bar's actual personality — if it would never say "curated experience," neither should you.`,

      fi: `ÄÄNISÄÄNNÖT — Ronski & railakas:
Odottamattomia metaforia. Musta huumori sallittu. Riko perinteisiä baarimarkkinoinnin kliseitä. Ei yrityslämpöä. Kumoa odotukset. Kirjoita kuin baarin oikea persoonallisuus — jos se ei koskaan sanoisi "kuratoitu kokemus", älä sinäkään.`,
    },
  },

  ELEGANT_PREMIUM: {
    id: "ELEGANT_PREMIUM",
    label: { en: "Elegant & Premium", fi: "Elegantti & premium" },
    emoji: "🥂",
    sentenceLength: "varied",
    maxWordsPerSentence: 20,
    ctaStyle: "Understated — let quality speak through detail",
    emojiUsage: "none",
    punctuationStyle: "Periods only. No exclamation marks — ever. Em-dashes for considered asides.",
    rhythm: "Measured. A whisper is always more convincing than a shout. Let details accumulate.",
    characteristicPhrases: {
      en: ["An evening of", "Thoughtfully assembled", "At your leisure", "We've prepared"],
      fi: ["Ilta", "Harkiten koottu", "Rauhallisesti", "Olemme valmistaneet"],
    },
    avoidPatterns:
      "Exclamation marks, hype, discount language, casual phrasing, emojis, urgency words, ALL CAPS, price-first framing.",

    promptBlock: {
      en: `VOICE RULES — Elegant & Premium:
Restrained vocabulary. Understatement over hype. Precise nouns. No exclamation marks. Let quality speak through detail. Write like the difference between a whisper and a shout — the whisper is always more convincing.`,

      fi: `ÄÄNISÄÄNNÖT — Elegantti & premium:
Hillitty sanasto. Vähättelyä liioittelun sijaan. Tarkkoja substantiiveja. Ei huutomerkkejä. Anna laadun puhua yksityiskohtien kautta. Kirjoita kuin ero kuiskauksen ja huudon välillä — kuiskaus on aina vakuuttavampi.`,
    },
  },

  PLAYFUL_FUN: {
    id: "PLAYFUL_FUN",
    label: { en: "Playful & Fun", fi: "Leikkisä & hauska" },
    emoji: "🎉",
    sentenceLength: "short",
    maxWordsPerSentence: 12,
    ctaStyle: "Banter, not sales pitch — cheerful nudges over commands",
    emojiUsage: "moderate",
    punctuationStyle: "Exclamation marks welcome. Question marks create engagement. No corporate restraint.",
    rhythm: "Bouncy. Like the group chat after someone said 'we should do something tonight.' Call and response.",
    characteristicPhrases: {
      en: ["Guess what?", "Plot twist:", "You + us =", "Friday called."],
      fi: ["Arvaa mitä?", "Juonenkäänne:", "Sä + me =", "Perjantai soitti."],
    },
    avoidPatterns:
      "Corporate announcements, restrained elegance, seriousness, press-release tone, long paragraphs.",

    promptBlock: {
      en: `VOICE RULES — Playful & Fun:
Light rhythm. Wordplay encouraged. Pop culture references if natural. Banter, not sales pitch. Emoji-worthy energy without emojis. Write like the group chat after someone said "we should do something tonight" and you replied "already on it."`,

      fi: `ÄÄNISÄÄNNÖT — Leikkisä & hauska:
Kevyt rytmi. Sanaleikit sallittuja. Pop-kulttuuriviittaukset jos luontevia. Läppää, ei myyntipuhetta. Emoji-arvoista energiaa ilman emojeja. Kirjoita kuin se ryhmächatti, jossa joku sanoi "pitäis tehdä jotain tänään" ja sä vastasit "hoidossa."`,
    },
  },
};

// ---------------------------------------------------------------------------
// Prompt injection helpers
// ---------------------------------------------------------------------------

/** Return the full tone prompt block in the given language. */
export function getTonePromptBlock(
  tone: ContentTone | undefined | null,
  language: "en" | "fi" = "en",
): string {
  if (!tone) return "";
  const voice = TONE_VOICES[tone];
  if (!voice) return "";
  return language === "fi" ? voice.promptBlock.fi : voice.promptBlock.en;
}

/** Return the concise tone label + emoji for the UI. */
export function getToneLabel(
  tone: ContentTone | undefined | null,
  language: "en" | "fi" = "en",
): string {
  if (!tone) return "";
  const voice = TONE_VOICES[tone];
  if (!voice) return "";
  return `${voice.emoji} ${language === "fi" ? voice.label.fi : voice.label.en}`;
}

/** Return the emoji alone for compact UIs. */
export function getToneEmoji(tone: ContentTone | undefined | null): string {
  if (!tone) return "";
  return TONE_VOICES[tone]?.emoji ?? "";
}

/** Return the legacy one-line system prompt instruction for backward compatibility. */
export function toneSystemInstruction(tone: ContentTone | undefined | null): string {
  if (!tone) return "";
  const voice = TONE_VOICES[tone];
  if (!voice) return "";
  // Compact one-liner for system prompt placement
  const v = voice;
  return `VOICE: ${v.label.en}. ${v.sentenceLength} sentences (max ${v.maxWordsPerSentence} words). ${v.ctaStyle}. ${v.rhythm} rhythm. Emoji: ${v.emojiUsage}. Avoid: ${v.avoidPatterns}`;
}
