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
  | "PLAYFUL_FUN"
  | "COMMUNITY_LOCAL"
  | "ROMANTIC_INTIMATE"
  | "MYSTERIOUS_EXCLUSIVE"
  | "ADVENTUROUS_CURIOUS"
  | "NOSTALGIC_CLASSIC";

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

  COMMUNITY_LOCAL: {
    id: "COMMUNITY_LOCAL",
    label: { en: "Community & Local", fi: "Yhteisöllinen & paikallinen" },
    emoji: "🏠",
    sentenceLength: "medium",
    maxWordsPerSentence: 15,
    ctaStyle: "Like a neighbour reminding you — familiar, not marketing",
    emojiUsage: "sparse",
    punctuationStyle: "Periods. Occasional question for engagement. No exclamation stacks.",
    rhythm: "Steady, grounded. Like the bartender who's worked here 10 years — unhurried, knows exactly what to say.",
    characteristicPhrases: {
      en: ["Your usual?", "We saved your spot.", "Around the corner.", "See you Thursday."],
      fi: ["Tavalliseen tapaan?", "Säästettiin sun paikka.", "Kulman takana.", "Nähdään torstaina."],
    },
    avoidPatterns: "Hype language, trend-chasing phrases, anything that sounds like a chain, sales-pitch framing, urgency words.",
    promptBlock: {
      en: `VOICE RULES — Community & Local:
Familiar, neighbourly, unpretentious. Rooted in the neighbourhood — reference the street, the corner, the regulars. Highlight routine and consistency. Write like someone who knows the regulars by name and is genuinely glad they came back. The bar is the third place between home and work — talk like it.`,
      fi: `ÄÄNISÄÄNNÖT — Yhteisöllinen & paikallinen:
Tuttavallinen, naapurillinen, vaatimaton. Juurrettu kaupunginosaan — viittaa katuun, kulmaan, vakiokasvoihin. Korosta rutiinia ja jatkuvuutta. Kirjoita kuin joku, joka tuntee vakioasiakkaat nimeltä ja on aidosti iloinen heidän paluustaan. Baari on kolmas paikka kodin ja työn välillä — puhu sen mukaisesti.`,
    },
  },

  ROMANTIC_INTIMATE: {
    id: "ROMANTIC_INTIMATE",
    label: { en: "Romantic & Intimate", fi: "Romanttinen & intiimi" },
    emoji: "🕯️",
    sentenceLength: "medium",
    maxWordsPerSentence: 16,
    ctaStyle: "Suggest, don't sell — an invitation to two people, not a crowd",
    emojiUsage: "none",
    punctuationStyle: "Periods. Occasional ellipsis for pause. No exclamation marks.",
    rhythm: "Slow, deliberate, sensory. Like a candle burning down — each sentence has room to breathe.",
    characteristicPhrases: {
      en: ["Just the two of you.", "Take your time.", "Low lights,", "Stay as long as you like."],
      fi: ["Vain te kaksi.", "Aikaa on.", "Hämärässä valossa,", "Viipyilkää niin kauan kuin haluatte."],
    },
    avoidPatterns: "Loud formatting, party references, group language ('bring the crew'), urgency, exclamation marks, discount framing.",
    promptBlock: {
      en: `VOICE RULES — Romantic & Intimate:
Soft, sensual, couple-focused. Suggest intimacy through atmosphere — the lighting, the corner table, the unhurried pace. Write for two people who chose this bar for each other. Never use group energy language. The night is a slow burn, not a firework.`,
      fi: `ÄÄNISÄÄNNÖT — Romanttinen & intiimi:
Pehmeä, aistillinen, pariskuntakeskeinen. Ehdota intimiteettiä tunnelman kautta — valaistus, nurkkapöytä, kiireetön tahti. Kirjoita kahdelle ihmiselle, jotka valitsivat tämän baarin toisilleen. Älä koskaan käytä ryhmäenergiakieltä. Ilta on hidas palo, ei ilotulitus.`,
    },
  },

  MYSTERIOUS_EXCLUSIVE: {
    id: "MYSTERIOUS_EXCLUSIVE",
    label: { en: "Mysterious & Exclusive", fi: "Salaperäinen & eksklusiivinen" },
    emoji: "🔑",
    sentenceLength: "short",
    maxWordsPerSentence: 10,
    ctaStyle: "Cryptic — leave room for curiosity, never over-explain",
    emojiUsage: "none",
    punctuationStyle: "Periods. Minimal punctuation. Fragments over full sentences. The unsaid is the message.",
    rhythm: "Terse, deliberate. Like a secret passed between two people who both know what it means. Every word earns its place.",
    characteristicPhrases: {
      en: ["Find the door.", "Few know.", "If you know, you know.", "Limited. Always."],
      fi: ["Löydä ovi.", "Harva tietää.", "Jos tiedät, tiedät.", "Rajoitetusti. Aina."],
    },
    avoidPatterns: "Loud CTAs, discount language, mass-market phrasing, over-explaining, anything that sounds like a chain promotion, exclamation marks.",
    promptBlock: {
      en: `VOICE RULES — Mysterious & Exclusive:
Cryptic. Minimal. Share a secret — don't run an ad. Less is more. Leave room for curiosity. The reader's reward is the discovery. Write like the door is unmarked and some things are better that way. Never explain — suggest. Never sell — invite.`,
      fi: `ÄÄNISÄÄNNÖT — Salaperäinen & eksklusiivinen:
Arvoituksellinen. Minimalistinen. Jaa salaisuus — älä pyöritä mainosta. Vähemmän on enemmän. Jätä tilaa uteliaisuudelle. Lukijan palkinto on löytö. Kirjoita kuin ovi on merkitsemätön ja jotkut asiat ovat parempia niin. Älä koskaan selitä — ehdota. Älä koskaan myy — kutsu.`,
    },
  },

  ADVENTUROUS_CURIOUS: {
    id: "ADVENTUROUS_CURIOUS",
    label: { en: "Adventurous & Curious", fi: "Seikkailunhaluinen & utelias" },
    emoji: "🧪",
    sentenceLength: "medium",
    maxWordsPerSentence: 16,
    ctaStyle: "Curiosity-driven — 'come see what we're making' over 'come buy what we're selling'",
    emojiUsage: "sparse",
    punctuationStyle: "Periods. Occasional em-dash for asides. Question marks for engagement. No exclamation stacks.",
    rhythm: "Exploratory, unfolding. Like a menu where each course is a surprise. Build anticipation through process and craft.",
    characteristicPhrases: {
      en: ["This week's experiment:", "Come curious.", "Behind the bar:", "We've been working on something."],
      fi: ["Tämän viikon kokeilu:", "Tule uteliaana.", "Baarin takana:", "Olemme työstäneet jotain."],
    },
    avoidPatterns: "Generic bar language, 'good times' clichés, party-focused framing, anything that could describe any other bar.",
    promptBlock: {
      en: `VOICE RULES — Adventurous & Curious:
Novelty-driven. Educational but never pretentious. Reference ingredients, techniques, process — the craft is the story. Highlight what makes THIS bar different. Write like a curious explorer who wants the reader to discover something they've never tried before. The bar is a laboratory, not a factory.`,
      fi: `ÄÄNISÄÄNNÖT — Seikkailunhaluinen & utelias:
Uutuusvetoinen. Opetuksellinen muttei koskaan ylimielinen. Viittaa raaka-aineisiin, tekniikoihin, prosessiin — käsityö on tarina. Korosta mikä tekee TÄSTÄ baarista erilaisen. Kirjoita kuin utelias tutkija, joka haluaa lukijan löytävän jotain mitä hän ei ole koskaan ennen kokeillut. Baari on laboratorio, ei tehdas.`,
    },
  },

  NOSTALGIC_CLASSIC: {
    id: "NOSTALGIC_CLASSIC",
    label: { en: "Nostalgic & Classic", fi: "Nostalginen & klassinen" },
    emoji: "📻",
    sentenceLength: "varied",
    maxWordsPerSentence: 20,
    ctaStyle: "Confident, earned — 'we've been here longer than most, and here's why'",
    emojiUsage: "none",
    punctuationStyle: "Periods. Occasional semicolon — measured, deliberate. No exclamation marks. Serif-worthy sentence cadence.",
    rhythm: "Measured, patient. Like a jazz standard — it doesn't rush because it knows where it's going. Every phrase carries institutional weight.",
    characteristicPhrases: {
      en: ["Since 19", "Same bar,", "Some things don't need", "As always,", "We've been doing this"],
      fi: ["Vuodesta 19", "Sama baari,", "Joitain asioita ei tarvitse", "Kuten aina,", "Olemme tehneet tätä"],
    },
    avoidPatterns: "Trend language, urgency words, slang, emojis, novelty framing, anything that suggests reinvention or pivoting.",
    promptBlock: {
      en: `VOICE RULES — Nostalgic & Classic:
Timeless. Confident. Heritage-forward. Reference history and consistency — the bar's age is a feature. Write with the authority of an institution. Every sentence should suggest: we've been doing this longer, and better, and we don't need to shout about it. The bar endures because it deserves to.`,
      fi: `ÄÄNISÄÄNNÖT — Nostalginen & klassinen:
Ajaton. Itsevarma. Perintö edellä. Viittaa historiaan ja jatkuvuuteen — baarin ikä on ominaisuus. Kirjoita instituution arvovallalla. Jokaisen lauseen tulisi vihjata: olemme tehneet tätä pidempään, ja paremmin, eikä meidän tarvitse huutaa siitä. Baari kestää koska se ansaitsee sen.`,
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
