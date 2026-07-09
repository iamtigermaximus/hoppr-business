"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import styled from "styled-components";
import type { ContentType, FormState } from "./types";
import { PROMOTION_TYPES } from "./types";
import type { ContentTone } from "./ToneSelector";
import { TONE_OPTIONS } from "./ToneSelector";
import ImageUploader from "./shared/ImageUploader";
import { deriveImageChips } from "@/lib/prompts/tone-to-image-chips";
import { TEMPLATE_CHARACTERISTICS } from "@/lib/compliance/prompts";
import {
  getWizardForTemplate,
  assembleWizardPrompt,
  type WizardStep,
} from "@/lib/prompts/template-wizards";

// ---- Types ----

type Language = "fi" | "en";
type FlowStep = "type" | "brief" | "refine" | "images" | "publish";

interface UnifiedCreationFlowProps {
  barId: string;
  barName?: string;
  barCoverImage?: string | null;
  contentType: ContentType;
  formState: FormState;
  contentTone?: ContentTone | null;
  onGenerated: (data: Record<string, unknown>) => void;
  onFieldChange: (field: string, value: unknown) => void;
  onTypeChange: (type: ContentType) => void;
  onSubmit: () => void;
  submitting?: boolean;
}

interface EditableVariant {
  title: string;
  description: string;
  type: string;
  discount: number | null;
  callToAction: string;
  accentColor: string;
  conditions: string;
  visualDirection: {
    description: string;
    keyElements: string[];
    styleNotes: string;
  } | null;
  /** The Flux prompt — derived from visualDirection but fully editable */
  fluxPrompt: string;
}

// ---- Constants ----

const TYPE_OPTIONS: {
  value: ContentType;
  label: string;
  desc: string;
  emoji: string;
}[] = [
  {
    value: "promotion",
    label: "Promotion",
    desc: "Happy hours, drink specials, food deals",
    emoji: "",
  },
  {
    value: "event",
    label: "Event",
    desc: "Live music, game nights, theme parties",
    emoji: "",
  },
  {
    value: "campaign",
    label: "Ad Campaign",
    desc: "Boosted listings, featured placements",
    emoji: "",
  },
  {
    value: "pass",
    label: "Pass / Ticket",
    desc: "Skip-line, VIP, cover charge passes",
    emoji: "",
  },
];

const TEMPLATES: Record<Language, { label: string; prompt: string }[]> = {
  en: [
    {
      label: "After-Work",
      prompt:
        "After-work gathering. The moment the workday ends and the evening begins. Describe the transition — the first drink, the decompression, the shift in energy as people unwind. Focus on atmosphere over specifics.",
    },
    {
      label: "Ladies Night",
      prompt:
        "A night designed for groups of friends. The music, the welcome, the space — all curated to make groups feel at home. Describe the social energy, the laughter, the feeling of a night out with your people.",
    },
    {
      label: "Live Music",
      prompt:
        "Music takes over the room. The first chord, the shifting crowd, the shared experience of live sound. Describe the performer, the audience, the moment when everything else fades and only the music matters.",
    },
    {
      label: "Game Night",
      prompt:
        "Friendly competition with drinks in hand. The playful tension, the surprise victory, the laughter after a wrong answer. Describe the social glue of games — how they turn strangers into teammates.",
    },
    {
      label: "Food Special",
      prompt:
        "The kitchen is showing off. A dish worth planning your evening around. Describe the craftsmanship, the ingredients, the pairing, the satisfaction of a meal that exceeds expectations.",
    },
    {
      label: "VIP Experience",
      prompt:
        "Behind the rope, above the crowd. A different pace, a different level of attention. Describe what makes this experience feel elevated — not just exclusive, but genuinely better.",
    },
    {
      label: "Signature Evening",
      prompt:
        "A curated night that couldn't happen anywhere else. Something unique to this bar, this team, this moment. Describe the concept, the craft, the reason someone would cross town for this.",
    },
    {
      label: "Theme Night",
      prompt:
        "The bar transforms. A concept, a dress code, a shared reality that everyone in the room is part of. Describe the immersion — what it looks like, sounds like, feels like to step into a different world for one night.",
    },
  ],
  fi: [
    {
      label: "After-Work",
      prompt:
        "After-work-kokoontuminen. Hetki jolloin työpäivä päättyy ja ilta alkaa. Kuvaile siirtymä — ensimmäinen juoma, rentoutuminen, energian muutos. Keskity tunnelmaan.",
    },
    {
      label: "Naistenilta",
      prompt:
        "Ilta ystäväporukoille. Musiikki, vastaanotto, tila — kaikki kuratoitu ryhmien viihtymiseen. Kuvaile sosiaalista energiaa, naurua, yhdessä vietetyn illan tunnelmaa.",
    },
    {
      label: "Elävä musiikki",
      prompt:
        "Musiikki valtaa tilan. Ensimmäinen sointu, liikkuva yleisö, jaettu live-äänen kokemus. Kuvaile esiintyjää, yleisöä, hetkeä jolloin kaikki muu katoaa.",
    },
    {
      label: "Peli-ilta",
      prompt:
        "Ystävällismielistä kilpailua juoman äärellä. Leikkisä jännitys, yllätysvoitto, nauru väärän vastauksen jälkeen. Kuvaile pelien sosiaalista liimaa.",
    },
    {
      label: "Ruokatarjous",
      prompt:
        "Keittiö näyttää osaamistaan. Annos, jonka ympärille kannattaa suunnitella ilta. Kuvaile käsityötaitoa, raaka-aineita, makupareja, ateriaa joka ylittää odotukset.",
    },
    {
      label: "VIP-kokemus",
      prompt:
        "Köyden takana, väkijoukon yllä. Eri rytmi, eri huomion taso. Kuvaile mikä tekee tästä kokemuksesta kohotetun — ei vain eksklusiivisen, vaan aidosti paremman.",
    },
    {
      label: "Talon suositukset",
      prompt:
        "Kuratoitu ilta jota ei voisi tapahtua missään muualla. Jotain ainutlaatuista tälle baarille, tälle tiimille, tälle hetkelle. Kuvaile konsepti, syy miksi joku matkustaisi kaupungin halki tämän takia.",
    },
    {
      label: "Teemailta",
      prompt:
        "Baari muuntuu. Konsepti, pukukoodi, jaettu todellisuus. Kuvaile immersio — miltä näyttää, kuulostaa, tuntuu astua eri maailmaan yhden illan ajaksi.",
    },
  ],
};

const LAYOUT_HINTS = [
  {
    template: "split" as const,
    label: "Split",
    desc: "Photo left, text right",
  },
  {
    template: "centered" as const,
    label: "Centered",
    desc: "Bold headline focus",
  },
  { template: "card" as const, label: "Card", desc: "Square, photo-forward" },
];

const PLACEHOLDERS: Record<Language, string> = {
  fi: 'Kuvaile mitä haluat luoda — esim. "Perjantain after-work, klo 16–19, rento tunnelma ja hyvää musiikkia"',
  en: 'Describe what you want — e.g. "Friday after-work, 4–7pm, relaxed atmosphere with great music"',
};

const GENERATING_MESSAGES: Record<Language, string> = {
  fi: "Luodaan vaihtoehtoja...",
  en: "Creating your options...",
};

const GENERATING_IMAGES_MSG: Record<Language, string> = {
  fi: "Luodaan kuvia...",
  en: "Generating images...",
};

// ---- Progress labels ----

const STEP_LABELS: Record<FlowStep, string> = {
  type: "What are you creating?",
  brief: "Describe what's happening",
  refine: "Review & edit",
  images: "Choose your image",
  publish: "Review & publish",
};

function stepNumber(step: FlowStep): number {
  return ["type", "brief", "refine", "images", "publish"].indexOf(step) + 1;
}

// ---- Progress display labels (short, for the progress bar) ----

const PROGRESS_LABELS: Record<FlowStep, string> = {
  type: "Type",
  brief: "Brief",
  refine: "Refine",
  images: "Image",
  publish: "Publish",
};

// ---- Contextual suggestions ----

interface ContextSuggestion {
  label: string; // Short display text that fits in chips
  value: string; // Full description injected into prompt generation
}

function getContextualSuggestions(language: Language): ContextSuggestion[] {
  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();
  const dayOfWeek = now.toLocaleDateString("en-US", { weekday: "long" });
  const hour = now.getHours();
  const suggestions: ContextSuggestion[] = [];

  if (dayOfWeek === "Friday" || dayOfWeek === "Saturday") {
    suggestions.push({
      label: language === "fi" ? "Viikonloppu" : "Weekend energy",
      value:
        language === "fi"
          ? "Viikonlopun tunnelma, bilekansa liikkeellä, korkea energia"
          : "Weekend energy — the crowd is ready, the vibe is high, the night is wide open",
    });
  } else if (dayOfWeek === "Thursday") {
    suggestions.push({
      label: language === "fi" ? "Torstai-ilta" : "Thursday night",
      value:
        language === "fi"
          ? "Torstai on uusi perjantai — viikonlopun odotus, rento mutta energinen fiilis"
          : "Thursday — the weekend starts early, the smart crowd is already out",
    });
  } else {
    suggestions.push({
      label: language === "fi" ? "Arki-ilta" : "Weekday calm",
      value:
        language === "fi"
          ? "Arki-illan rentous — vähemmän tungosta, enemmän tilaa nauttia"
          : "Weekday calm — less crowd, more room to breathe, the regulars' night",
    });
  }

  if (hour < 12) {
    suggestions.push({
      label: language === "fi" ? "Päivätapahtuma" : "Daytime",
      value:
        language === "fi"
          ? "Päivätapahtuma — brunssi, lounas, aikainen startti"
          : "Daytime event — brunch, lunch, early start, different energy",
    });
  } else if (hour >= 16 && hour < 20) {
    suggestions.push({
      label: language === "fi" ? "After-work" : "After-work",
      value:
        language === "fi"
          ? "After-work-aika — toimistolta suoraan, rentoutumisen hetki"
          : "After-work hours — straight from the office, the decompression hour",
    });
  } else {
    suggestions.push({
      label: language === "fi" ? "Myöhäinen ilta" : "Late night",
      value:
        language === "fi"
          ? "Iltatunnelma — myöhäinen ilta, bileet käynnissä, yöelämän syke"
          : "Late night energy — the party is alive, the night crowd has arrived",
    });
  }

  if (month >= 5 && month <= 7) {
    suggestions.push({
      label: language === "fi" ? "Kesäterassi" : "Summer terrace",
      value:
        language === "fi"
          ? "Kesäterassi — ulkoilma, auringonlasku, pitkät illat"
          : "Summer terrace season — outdoor, sunset, long evenings, fresh air",
    });
  } else if (month >= 11 || month <= 1) {
    suggestions.push({
      label: language === "fi" ? "Talvitunnelma" : "Winter cozy",
      value:
        language === "fi"
          ? "Talvinen tunnelma — lämmintä valoa, pimeyttä vastaan, sisätilojen kodikkuus"
          : "Winter warmth — cozy indoors, warm lighting, escape from the cold",
    });
  }

  if (month === 4 && day >= 28 && day <= 30) {
    suggestions.push({
      label: language === "fi" ? "Vappu" : "Vappu",
      value:
        language === "fi"
          ? "Vappu-tunnelma — kevään juhla, kaupungin suurin karnevaali"
          : "Vappu celebration — Finland's biggest carnival, spring festival",
    });
  }

  suggestions.push({
    label: language === "fi" ? "Syntymäpäivät" : "Birthday",
    value:
      language === "fi"
        ? "Syntymäpäivät tai juhlat — ryhmävaraukset, yksityistila"
        : "Birthday or celebration — group bookings, private area",
  });
  suggestions.push({
    label: language === "fi" ? "Treffi-ilta" : "Date night",
    value:
      language === "fi"
        ? "Treffi-ilta — intiimi tunnelma, kahden hengen pöydät"
        : "Date night — intimate atmosphere, tables for two",
  });

  return suggestions;
}

/** Builds a label→value lookup map from the current suggestion set. */
function getContextValueMap(language: Language): Map<string, string> {
  return new Map(
    getContextualSuggestions(language).map((s) => [s.label, s.value]),
  );
}

// ---- Tone instruction for appending to textarea ----

function toneInstructionText(tone: ContentTone, language: Language): string {
  if (language === "fi") {
    const map: Record<ContentTone, string> = {
      BOLD_ENERGETIC:
        "Äänensävy: rohkea ja energinen. Lyhyitä lauseita, aktiivisia verbejä, suoria kehotuksia.",
      WARM_INVITING:
        "Äänensävy: lämmin ja kutsuva. Keskity tunnelmaan ja vieraanvaraisuuteen.",
      EDGY_IRREVERENT:
        "Äänensävy: ronski ja railakas. Rentoa, suoraa, persoonallista.",
      ELEGANT_PREMIUM:
        "Äänensävy: elegantti ja premium. Hillittyä, laadukasta, hienostunutta.",
      PLAYFUL_FUN: "Äänensävy: leikkisä ja hauska. Iloinen, energinen, rento.",
    };
    return map[tone];
  }
  const map: Record<ContentTone, string> = {
    BOLD_ENERGETIC:
      "Tone: bold and energetic. Short sentences, active verbs, direct CTAs.",
    WARM_INVITING:
      "Tone: warm and inviting. Focus on atmosphere and hospitality.",
    EDGY_IRREVERENT:
      "Tone: edgy and irreverent. Casual, direct, personality-driven.",
    ELEGANT_PREMIUM: "Tone: elegant and premium. Understated sophistication.",
    PLAYFUL_FUN: "Tone: playful and fun. Upbeat, emoji-friendly, energetic.",
  };
  return map[tone];
}

// ---- Build initial Flux prompt from visualDirection ----

function buildInitialFluxPrompt(
  vd:
    | { description: string; keyElements: string[]; styleNotes: string }
    | null
    | undefined,
): string {
  if (!vd) return "";
  const elements = vd.keyElements?.length
    ? `Key elements: ${vd.keyElements.join(", ")}.`
    : "";
  const notes = vd.styleNotes ? `Style: ${vd.styleNotes}.` : "";
  return [vd.description, elements, notes].filter(Boolean).join(" ");
}

// ---- Build live preview of the combined prompt from ingredients ----

function buildPreviewPrompt(
  barName: string,
  prompt: string,
  template: string | null,
  tone: ContentTone | null,
  contexts: string[],
  language: Language,
): string {
  const parts: string[] = [];
  const isFi = language === "fi";

  if (template) {
    const chars = TEMPLATE_CHARACTERISTICS[template];
    const traits = chars ? (isFi ? chars.fi : chars.en) : null;
    parts.push(
      isFi
        ? `Kampanjatyyppi: ${template}${traits ? ` — ${traits}` : ""}`
        : `Template type: ${template}${traits ? ` — ${traits}` : ""}`,
    );
  }

  if (tone) {
    const toneLabel = TONE_OPTIONS.find((t) => t.value === tone)?.label || tone;
    parts.push(isFi ? `Äänensävy: ${toneLabel}` : `Tone: ${toneLabel}`);
  }

  if (contexts.length > 0) {
    parts.push(
      isFi
        ? `Konteksti: ${contexts.join(", ")}`
        : `Context: ${contexts.join(", ")}`,
    );
  }

  if (prompt.trim()) {
    parts.push(
      isFi
        ? `\nKäyttäjän kuvaus:\n${prompt.trim()}`
        : `\nUser's brief:\n${prompt.trim()}`,
    );
  }

  if (parts.length === 0) return "";

  parts.push(
    isFi
      ? `\n\n→ Näistä aineksista luodaan 3 uniikkia varianttia baarille "${barName}".`
      : `\n\n→ From these ingredients, 3 unique variants will be created for "${barName}".`,
  );

  return parts.join("\n");
}

// ---- Component ----

export default function UnifiedCreationFlow({
  barId,
  barName = "Your Bar",
  barCoverImage,
  contentType,
  formState,
  contentTone,
  onGenerated,
  onFieldChange,
  onTypeChange,
  onSubmit,
  submitting,
}: UnifiedCreationFlowProps) {
  // Flow state
  const [step, setStep] = useState<FlowStep>("type");
  const [error, setError] = useState<string | null>(null);

  // Brief state
  const [text, setText] = useState("");
  const [language, setLanguage] = useState<Language>("en");
  const [activeTone, setActiveTone] = useState<ContentTone | null>(
    contentTone ?? null,
  );
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [selectedContexts, setSelectedContexts] = useState<string[]>([]);
  const [customContextInput, setCustomContextInput] = useState("");
  const nonceRef = useRef(0);
  const [complianceBlocked, setComplianceBlocked] = useState<{
    reasons: string[];
  } | null>(null);
  const [complianceWarnings, setComplianceWarnings] = useState<string[] | null>(
    null,
  );
  const [variantViolations, setVariantViolations] = useState<
    Array<{
      rule: string;
      keyword: string;
      severity: string;
      message: string;
      suggestion: string;
    }>[]
  >([]);
  const [usingFallback, setUsingFallback] = useState(false);
  const [inferredType, setInferredType] = useState<string>("promotion");

  // Helper collapse state
  const [toneOpen, setToneOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Wizard state
  const [wizardActive, setWizardActive] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardAnswers, setWizardAnswers] = useState<Record<string, string>>(
    {},
  );
  const wizardConfig = activeTemplate
    ? getWizardForTemplate(activeTemplate)
    : null;
  const wizardSteps: WizardStep[] =
    wizardConfig && wizardConfig.steps[language]
      ? wizardConfig.steps[language]
      : [];

  // Auto-open preview when any ingredient is selected
  const hasIngredients = !!(
    activeTone ||
    activeTemplate ||
    selectedContexts.length > 0 ||
    text.trim()
  );
  useEffect(() => {
    if (hasIngredients) {
      setPreviewOpen(true);
    }
  }, [activeTone, activeTemplate, selectedContexts, text, hasIngredients]);

  // Auto-open tone section when entering Step 2 (brief)
  useEffect(() => {
    if (step === "brief") {
      setToneOpen(true);
      setTemplatesOpen(false);
      setContextOpen(false);
    }
  }, [step]);

  // Text generation state
  const [variants, setVariants] = useState<EditableVariant[]>([]);
  const [generatingText, setGeneratingText] = useState(false);

  // Image generation state
  const [variantImages, setVariantImages] = useState<(string | null)[]>([]);
  const [variantImagesLoading, setVariantImagesLoading] = useState<boolean[]>(
    [],
  );
  const [generatingImages, setGeneratingImages] = useState(false);
  const [variantLayouts, setVariantLayouts] = useState<
    Array<"split" | "centered" | "card">
  >([]);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("hoppr_token") : null;

  // ---- Tone ----

  const handleToneSelect = (tone: ContentTone) => {
    const newTone = activeTone === tone ? null : tone;
    setActiveTone(newTone);

    if (newTone) {
      const instruction = toneInstructionText(newTone, language);
      setText((prev) => {
        const trimmed = prev.trim();
        const lines = trimmed.split("\n");
        const toneIdx = lines.findIndex(
          (l) => l.startsWith("Tone:") || l.startsWith("Äänensävy:"),
        );
        if (toneIdx >= 0) {
          lines[toneIdx] = instruction;
          return lines.join("\n");
        }
        return trimmed ? `${trimmed}\n\n${instruction}` : instruction;
      });
      // Auto-advance: close tone, open templates
      setToneOpen(false);
      setTemplatesOpen(true);
    }
  };

  // ---- Template click → fill textarea ----

  const handleTemplateClick = (label: string) => {
    const isDeselect = activeTemplate === label;
    if (isDeselect) {
      setActiveTemplate(null);
      setWizardActive(false);
      setWizardStep(0);
      setWizardAnswers({});
      return;
    }

    setActiveTemplate(label);
    const wizard = getWizardForTemplate(label);

    if (wizard) {
      setWizardActive(true);
      setWizardStep(0);
      setWizardAnswers({});
      // Keep templates open so user can complete the wizard
    } else {
      setWizardActive(false);
      setWizardStep(0);
      setWizardAnswers({});
      // Close templates, open context after non-wizard selection
      setTemplatesOpen(false);
      setContextOpen(true);
    }
  };

  // ---- Wizard ----

  const handleWizardAnswer = (stepLabel: string, promptFragment: string) => {
    const updated = { ...wizardAnswers, [stepLabel]: promptFragment };
    setWizardAnswers(updated);

    if (wizardStep < wizardSteps.length - 1) {
      setWizardStep(wizardStep + 1);
      setText(assembleWizardPrompt(updated, barName, language));
    } else {
      // Wizard complete — close templates, open context
      setWizardActive(false);
      setTemplatesOpen(false);
      setContextOpen(true);
      setText(assembleWizardPrompt(updated, barName, language));
    }
  };

  const handleWizardBack = () => {
    if (wizardStep > 0) {
      const currentStepLabel = wizardSteps[wizardStep].label;
      const updated = { ...wizardAnswers };
      delete updated[currentStepLabel];
      setWizardAnswers(updated);
      setWizardStep(wizardStep - 1);
      setText(assembleWizardPrompt(updated, barName, language));
    }
  };

  const handleWizardDismiss = () => {
    setWizardActive(false);
    setTemplatesOpen(false);
    setContextOpen(true);
  };

  // ---- Regenerate brief — re-calls AI with new nonce for guaranteed different output ----

  const handleRegenerateBrief = () => {
    nonceRef.current += 1;
    handleGenerateText();
  };

  // ---- Toggle context tag ----

  const handleToggleContext = (suggestion: ContextSuggestion) => {
    setSelectedContexts((prev) => {
      if (prev.includes(suggestion.label)) {
        return prev.filter((s) => s !== suggestion.label);
      }
      return [...prev, suggestion.label];
    });
  };

  // ---- Add custom context ----

  const handleAddCustomContext = () => {
    const trimmed = customContextInput.trim();
    if (!trimmed) return;
    if (selectedContexts.includes(trimmed)) return;
    setSelectedContexts((prev) => [...prev, trimmed]);
    setCustomContextInput("");
  };

  // ---- Remove context (from summary tags) ----

  const handleRemoveContext = (ctx: string) => {
    setSelectedContexts((prev) => prev.filter((s) => s !== ctx));
  };

  // ---- Step 2 → 3: Generate text ----

  const handleGenerateText = useCallback(async () => {
    const input = text.trim();
    if (!token) return;

    setGeneratingText(true);
    setError(null);
    setComplianceBlocked(null);
    setComplianceWarnings(null);
    setVariantViolations([]);
    setUsingFallback(false);
    setVariants([]);

    try {
      // Type inference
      const suggestRes = await fetch(`/api/auth/bar/${barId}/create/suggest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: input,
          language,
          contentTone: activeTone,
        }),
      });

      if (!suggestRes.ok) {
        const data = await suggestRes.json();
        throw new Error(data.error || "Type inference failed");
      }

      const suggestData = await suggestRes.json();
      const type = (suggestData.inferredType as string) || "promotion";
      setInferredType(type);

      // Text generation — sends structured ingredients, not hardcoded text
      const genRes = await fetch(
        `/api/auth/bar/${barId}/promotions/ai-generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            prompt: input || undefined,
            type,
            template: activeTemplate,
            tone: activeTone,
            context:
              selectedContexts.length > 0
                ? selectedContexts.map(
                    (label) =>
                      getContextValueMap(language).get(label) || label,
                  )
                : undefined,
            language,
            numVariants: 3,
            nonce: nonceRef.current,
          }),
        },
      );

      const genData = await genRes.json();

      if (!genRes.ok) {
        // Handle compliance pre-check failure
        if (genData.complianceBlocked) {
          setComplianceBlocked({ reasons: genData.complianceBlocked });
          throw new Error(
            genData.error || "Prompt blocked by compliance check",
          );
        }
        throw new Error(genData.error || "Variant generation failed");
      }

      // Per-variant compliance violations — shown inline under each variant card
      if (
        genData.complianceResults &&
        Array.isArray(genData.complianceResults)
      ) {
        const violationsByVariant: Array<
          Array<{
            rule: string;
            keyword: string;
            severity: string;
            message: string;
            suggestion: string;
          }>
        > = new Array((genData.variants as Array<unknown>).length)
          .fill(null)
          .map(() => []);
        for (const cr of genData.complianceResults as Array<{
          variantIndex: number;
          violations: Array<{
            rule: string;
            keyword: string;
            severity: string;
            message: string;
            suggestion: string;
          }>;
        }>) {
          if (cr.variantIndex < violationsByVariant.length) {
            violationsByVariant[cr.variantIndex] = cr.violations;
          }
        }
        setVariantViolations(violationsByVariant);
        setComplianceWarnings(null);
      } else {
        setVariantViolations([]);
        setComplianceWarnings(null);
      }

      // Show fallback warning when AI wasn't used
      if (!genData.aiGenerated && genData.warning) {
        setUsingFallback(true);
      } else {
        setUsingFallback(false);
      }

      if (genData.variants && Array.isArray(genData.variants)) {
        const rawVariants = genData.variants as Array<Record<string, unknown>>;

        // Build editable variants with Flux prompts
        const editableVariants: EditableVariant[] = rawVariants.map((v) => {
          const vd = v.visualDirection as
            | EditableVariant["visualDirection"]
            | undefined;
          return {
            title: (v.title as string) || "",
            description: (v.description as string) || "",
            type: (v.type as string) || type,
            discount: (v.discount as number) ?? null,
            callToAction: (v.callToAction as string) || "",
            accentColor: (v.accentColor as string) || "#7c3aed",
            conditions: (v.conditions as string) || "",
            visualDirection: vd || null,
            fluxPrompt: buildInitialFluxPrompt(vd),
          };
        });

        setVariants(editableVariants);
        // Use the AI's chosen template per variant, not hardcoded "split"
        setVariantLayouts(
          rawVariants.map((v) => {
            const t = (v.visual as Record<string, unknown> | undefined)
              ?.template as string | undefined;
            return t && ["split", "centered", "card"].includes(t)
              ? (t as "split" | "centered" | "card")
              : "split";
          }),
        );
        setVariantImages(new Array(editableVariants.length).fill(null));
        setStep("refine");
      } else {
        throw new Error("No variants returned");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate. Try again.",
      );
    } finally {
      setGeneratingText(false);
    }
  }, [
    text,
    token,
    barId,
    language,
    activeTone,
    activeTemplate,
    selectedContexts,
  ]);

  // ---- Edit a variant field ----

  const updateVariant = (
    index: number,
    field: keyof EditableVariant,
    value: unknown,
  ) => {
    setVariants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // ---- Delete a variant ----

  const deleteVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
    setVariantImages((prev) => prev.filter((_, i) => i !== index));
    setVariantLayouts((prev) => prev.filter((_, i) => i !== index));
    setVariantViolations((prev) => prev.filter((_, i) => i !== index));
  };

  // ---- Fix variant violations via AI ----

  const [fixingVariant, setFixingVariant] = useState<number | null>(null);

  const handleFixVariant = async (index: number) => {
    if (!token || !variantViolations[index]?.length) return;
    setFixingVariant(index);

    try {
      const v = variants[index];
      const res = await fetch(`/api/auth/bar/${barId}/create/suggest-fix`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: v.title,
          description: v.description,
          violations: variantViolations[index],
          contentType: "promotion",
        }),
      });

      if (!res.ok) throw new Error("Fix generation failed");

      const data = await res.json();
      if (data.alternatives?.length > 0) {
        // Auto-apply the first compliant alternative
        const fix = data.alternatives[0];
        updateVariant(index, "title", fix.title);
        updateVariant(index, "description", fix.description);
        // Clear violations for this variant
        setVariantViolations((prev) => {
          const next = [...prev];
          next[index] = [];
          return next;
        });
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Fix failed. Edit manually instead.",
      );
    } finally {
      setFixingVariant(null);
    }
  };

  // ---- Step 3 → 4: Generate images ----

  const handleGenerateImages = useCallback(async () => {
    if (!token || variants.length === 0) return;

    setGeneratingImages(true);
    setError(null);
    setVariantImagesLoading(new Array(variants.length).fill(true));

    try {
      const chips = deriveImageChips(activeTone, activeTemplate, 0);

      const variantVDs = variants.map((v, i) => ({
        visualDirection: {
          description: v.fluxPrompt || v.visualDirection?.description || "",
          keyElements: v.visualDirection?.keyElements || [],
          styleNotes: v.visualDirection?.styleNotes || "",
        },
        formContext: {
          title: v.title,
          description: v.description,
          promotionType: v.type,
          barName,
        },
      }));

      const res = await fetch(`/api/auth/bar/${barId}/images/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          variantVisualDirections: variantVDs,
          contentType: "promotion",
          styleId: chips.styleId,
          subjectId: chips.subjectId,
          compositionId: chips.compositionId,
          count: 1,
        }),
      });

      const data = await res.json();

      if (data.variantUrls && Array.isArray(data.variantUrls)) {
        const images: (string | null)[] = variantVDs.map(
          (_, i) => data.variantUrls[i] || null,
        );
        setVariantImages(images);
        setStep("images");
      } else if (data.blockedReasons && Array.isArray(data.blockedReasons)) {
        // Compliance block — show specific reasons so user knows what to fix
        const variantLabel = data.variantIndex != null
          ? ` (Option ${data.variantIndex + 1})`
          : "";
        const reasons = data.blockedReasons.join("; ");
        const hint = data.hint ? ` ${data.hint}` : "";
        setError(`Image blocked${variantLabel}: ${reasons}.${hint}`);
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error("Image generation returned unexpected response");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Image generation failed. Try again.",
      );
    } finally {
      setGeneratingImages(false);
      setVariantImagesLoading(new Array(variants.length).fill(false));
    }
  }, [token, variants, barId, barName, activeTone, activeTemplate]);

  // ---- Step 4 → 5: Select variant ----

  const handleSelectVariant = useCallback(
    (variantIndex: number) => {
      const v = variants[variantIndex];
      const layout = variantLayouts[variantIndex] || "split";

      onGenerated({
        inferredType,
        aiGenerated: true,
        confidence: 0.85,
        title: v.title,
        description: v.description,
        promotionType: v.type,
        discountValue: v.discount,
        conditions: v.conditions,
        callToAction: v.callToAction,
        imageUrl: variantImages[variantIndex] || null,
        cardFormat: "wide",
        visual: {
          template: layout,
          mood: "dark",
          overlayOpacity: 0.4,
          accentColor: v.accentColor,
        },
      });

      setStep("publish");
    },
    [variants, variantLayouts, variantImages, inferredType, onGenerated],
  );

  // ---- Regenerate single image ----

  const handleRegenerateImage = useCallback(
    async (variantIndex: number) => {
      const v = variants[variantIndex];
      if (!v || !token) return;

      const loading = [...variantImagesLoading];
      loading[variantIndex] = true;
      setVariantImagesLoading(loading);

      try {
        const chips = deriveImageChips(
          activeTone,
          activeTemplate,
          variantIndex,
        );

        const res = await fetch(`/api/auth/bar/${barId}/images/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            variantVisualDirections: [
              {
                visualDirection: {
                  description:
                    v.fluxPrompt || v.visualDirection?.description || "",
                  keyElements: v.visualDirection?.keyElements || [],
                  styleNotes: v.visualDirection?.styleNotes || "",
                },
                formContext: {
                  title: v.title,
                  description: v.description,
                  promotionType: v.type,
                  barName,
                },
              },
            ],
            contentType: "promotion",
            styleId: chips.styleId,
            subjectId: chips.subjectId,
            compositionId: chips.compositionId,
            count: 1,
          }),
        });

        const data = await res.json();
        if (data.variantUrls?.[0]) {
          const images = [...variantImages];
          images[variantIndex] = data.variantUrls[0];
          setVariantImages(images);
        }
      } catch {
        // Silently fail — keep existing image
      } finally {
        const loading = [...variantImagesLoading];
        loading[variantIndex] = false;
        setVariantImagesLoading(loading);
      }
    },
    [
      variants,
      variantImages,
      variantImagesLoading,
      token,
      barId,
      barName,
      activeTone,
      activeTemplate,
    ],
  );

  // ---- Navigation ----

  const goBack = () => {
    if (step === "brief") setStep("type");
    else if (step === "refine") setStep("brief");
    else if (step === "images") setStep("refine");
    else if (step === "publish") setStep("images");
  };

  // ---- Render helpers ----

  const toneLabel = activeTone
    ? TONE_OPTIONS.find((o) => o.value === activeTone)
    : null;

  return (
    <Container>
      {/* ---- Progress bar ---- */}
      <ProgressBar>
        {(["type", "brief", "refine", "images", "publish"] as FlowStep[]).map(
          (s, i) => {
            const isActive = s === step;
            const isDone = stepNumber(step) > stepNumber(s);
            const isClickable = isDone && s !== "refine" && s !== "images";

            return (
              <React.Fragment key={s}>
                <ProgressStep>
                  <ProgressDot
                    $active={isActive}
                    $done={isDone}
                    onClick={isClickable ? () => setStep(s) : undefined}
                    style={{ cursor: isClickable ? "pointer" : "default" }}
                  >
                    {isDone ? "✓" : i + 1}
                  </ProgressDot>
                  <ProgressLabel $active={isActive} $done={isDone}>
                    {PROGRESS_LABELS[s]}
                  </ProgressLabel>
                </ProgressStep>
                {i < 4 && <ProgressLine $done={isDone} />}
              </React.Fragment>
            );
          },
        )}
      </ProgressBar>

      <StepBody>
        <StepTitle>
          <StepNum>{stepNumber(step)}.</StepNum> {STEP_LABELS[step]}
        </StepTitle>

        {/* ===== STEP 1: TYPE ===== */}
        {step === "type" && (
          <TypeGrid>
            {TYPE_OPTIONS.map((opt) => (
              <TypeCard
                key={opt.value}
                $selected={contentType === opt.value}
                onClick={() => {
                  onTypeChange(opt.value);
                  setStep("brief");
                }}
              >
                <TypeCardEmoji>{opt.emoji}</TypeCardEmoji>
                <TypeCardLabel>{opt.label}</TypeCardLabel>
                <TypeCardDesc>{opt.desc}</TypeCardDesc>
              </TypeCard>
            ))}
          </TypeGrid>
        )}

        {/* ===== STEP 2: BRIEF ===== */}
        {step === "brief" && (
          <div>
            {/* Language toggle */}
            <ControlsRow style={{ marginTop: 0, marginBottom: 14 }}>
              <ControlGroup>
                <ControlLabel>Language</ControlLabel>
                <PillGroup>
                  {(["en", "fi"] as const).map((lang) => (
                    <Pill
                      key={lang}
                      $active={language === lang}
                      onClick={() => setLanguage(lang)}
                      disabled={generatingText}
                    >
                      {lang.toUpperCase()}
                    </Pill>
                  ))}
                </PillGroup>
              </ControlGroup>
            </ControlsRow>

            {/* Textarea — the core input */}
            <SectionLabel>Your brief</SectionLabel>
            <Textarea
              placeholder={PLACEHOLDERS[language]}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleGenerateText();
                }
              }}
              disabled={generatingText}
            />
            <BriefActionsRow>
              {(activeTemplate ||
                activeTone ||
                selectedContexts.length > 0) && (
                <RegenerateBriefButton
                  onClick={handleRegenerateBrief}
                  disabled={generatingText}
                >
                  {language === "fi" ? "↻ Arvo uusi" : "↻ Regenerate"}
                </RegenerateBriefButton>
              )}
              <TextareaHint>
                {language === "fi"
                  ? "Valitse alta apuvälineitä ja kirjoita vapaasti — tai jätä tyhjäksi ja luo automaattisesti."
                  : "Choose helpers below and write freely — or leave empty to generate automatically."}
              </TextareaHint>
            </BriefActionsRow>

            {/* ---- Collapsible Helpers ---- */}

            {/* Tone helper */}
            <HelperSection>
              <HelperToggle onClick={() => setToneOpen(!toneOpen)}>
                <HelperToggleIcon $open={toneOpen}>
                  {toneOpen ? "▼" : "▶"}
                </HelperToggleIcon>
                <HelperToggleLabel>
                  {language === "fi" ? "Äänensävy" : "Tone"}
                  {activeTone && (
                    <HelperActiveTag>
                      {toneLabel?.emoji} {toneLabel?.label}
                    </HelperActiveTag>
                  )}
                </HelperToggleLabel>
                {!toneOpen && (
                  <HelperHint>
                    {language === "fi" ? "Valinnainen" : "Optional"}
                  </HelperHint>
                )}
              </HelperToggle>
              {toneOpen && (
                <HelperBody>
                  <HelperDesc>
                    {language === "fi"
                      ? "Valitse äänensävy — se lisätään briefiin ohjeeksi."
                      : "Pick a tone — it'll be included in your brief as guidance."}
                  </HelperDesc>
                  <ToneRow>
                    {TONE_OPTIONS.map((opt) => (
                      <ToneChip
                        key={opt.value}
                        $active={activeTone === opt.value}
                        onClick={() => handleToneSelect(opt.value)}
                        disabled={generatingText}
                      >
                        <span>{opt.emoji}</span> {opt.label}
                      </ToneChip>
                    ))}
                  </ToneRow>
                </HelperBody>
              )}
            </HelperSection>

            {/* Templates helper */}
            <HelperSection>
              <HelperToggle onClick={() => setTemplatesOpen(!templatesOpen)}>
                <HelperToggleIcon $open={templatesOpen}>
                  {templatesOpen ? "▼" : "▶"}
                </HelperToggleIcon>
                <HelperToggleLabel>
                  {language === "fi" ? "Pikamallit" : "Quick templates"}
                  {activeTemplate && (
                    <HelperActiveTag>{activeTemplate}</HelperActiveTag>
                  )}
                </HelperToggleLabel>
                {!templatesOpen && (
                  <HelperHint>
                    {language === "fi" ? "Valinnainen" : "Optional"}
                  </HelperHint>
                )}
              </HelperToggle>
              {templatesOpen && (
                <HelperBody>
                  <HelperDesc>
                    {language === "fi"
                      ? "Klikkaa mallia täyttääksesi briefin. Mallit joissa on ohjattu toiminto auttavat rakentamaan briefin vaihe vaiheelta."
                      : "Click a template to fill your brief. Templates with a wizard guide you step by step."}
                  </HelperDesc>
                  <TemplateGrid>
                    {TEMPLATES[language].map((tpl) => {
                      const hasWizard = !!getWizardForTemplate(tpl.label);
                      return (
                        <TemplateCard
                          key={tpl.label}
                          $active={activeTemplate === tpl.label}
                          onClick={() => handleTemplateClick(tpl.label)}
                          disabled={generatingText}
                        >
                          <TemplateName>
                            {tpl.label}
                            {hasWizard && (
                              <WizardBadge>
                                {language === "fi" ? "ohjattu" : "wizard"}
                              </WizardBadge>
                            )}
                          </TemplateName>
                          <TemplateDesc>
                            {tpl.prompt.length > 80
                              ? tpl.prompt.slice(0, 77) + "…"
                              : tpl.prompt}
                          </TemplateDesc>
                        </TemplateCard>
                      );
                    })}
                  </TemplateGrid>

                  {/* Wizard panel */}
                  {wizardActive && wizardSteps.length > 0 && (
                    <WizardPanel>
                      <WizardProgress>
                        <span>
                          {language === "fi" ? "Vaihe" : "Step"}{" "}
                          {wizardStep + 1}/{wizardSteps.length}
                        </span>
                        <WizardStepPips>
                          {wizardSteps.map((_, i) => (
                            <WizardPip
                              key={i}
                              $active={i === wizardStep}
                              $done={i < wizardStep}
                            />
                          ))}
                        </WizardStepPips>
                      </WizardProgress>
                      <WizardQuestion>
                        {wizardSteps[wizardStep].question}
                      </WizardQuestion>
                      <WizardChipRow>
                        {wizardSteps[wizardStep].options.map((opt, j) => (
                          <WizardChip
                            key={j}
                            onClick={() =>
                              handleWizardAnswer(
                                wizardSteps[wizardStep].label,
                                opt.prompt,
                              )
                            }
                          >
                            {opt.label}
                          </WizardChip>
                        ))}
                      </WizardChipRow>
                      <WizardActions>
                        <WizardBackButton
                          onClick={handleWizardBack}
                          disabled={wizardStep === 0}
                        >
                          {language === "fi" ? "← Edellinen" : "← Back"}
                        </WizardBackButton>
                        <WizardSkipButton onClick={handleWizardDismiss}>
                          {language === "fi" ? "Ohita" : "Skip"}
                        </WizardSkipButton>
                      </WizardActions>
                    </WizardPanel>
                  )}
                </HelperBody>
              )}
            </HelperSection>

            {/* Context helper */}
            <HelperSection>
              <HelperToggle onClick={() => setContextOpen(!contextOpen)}>
                <HelperToggleIcon $open={contextOpen}>
                  {contextOpen ? "▼" : "▶"}
                </HelperToggleIcon>
                <HelperToggleLabel>
                  {language === "fi" ? "Lisää kontekstia" : "Add context"}
                </HelperToggleLabel>
                {!contextOpen && (
                  <HelperHint>
                    {language === "fi"
                      ? "Kausiluonteiset vinkit"
                      : "Seasonal hooks"}
                  </HelperHint>
                )}
              </HelperToggle>
              {contextOpen && (
                <HelperBody>
                  <HelperDesc>
                    {language === "fi"
                      ? "Lisää ajankohtainen konteksti briefiin yhdellä klikkauksella."
                      : "Add timely context to your brief with one click."}
                  </HelperDesc>
                  <SuggestionRow>
                    {getContextualSuggestions(language).map((suggestion, i) => {
                      const isSelected = selectedContexts.includes(suggestion.label);
                      return (
                        <SuggestionChip
                          key={i}
                          $selected={isSelected}
                          onClick={() => handleToggleContext(suggestion)}
                          disabled={generatingText}
                          title={suggestion.value}
                        >
                          {isSelected ? "✓ " : ""}
                          {suggestion.label}
                        </SuggestionChip>
                      );
                    })}
                  </SuggestionRow>

                  <CustomContextRow>
                    <CustomContextInput
                      placeholder={
                        language === "fi"
                          ? "Kirjoita oma konteksti..."
                          : "Type your own context..."
                      }
                      value={customContextInput}
                      onChange={(e) => setCustomContextInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomContext();
                        }
                      }}
                      disabled={generatingText}
                    />
                    <CustomContextAddBtn
                      onClick={handleAddCustomContext}
                      disabled={generatingText || !customContextInput.trim()}
                    >
                      {language === "fi" ? "Lisää" : "Add"}
                    </CustomContextAddBtn>
                  </CustomContextRow>
                </HelperBody>
              )}
            </HelperSection>

            {/* Active selections summary */}
            {(activeTone || activeTemplate || selectedContexts.length > 0) && (
              <IngredientsSummary>
                <IngredientsLabel>
                  {language === "fi"
                    ? "Valitut ainekset:"
                    : "Selected ingredients:"}
                </IngredientsLabel>
                <IngredientsTags>
                  {activeTone && (
                    <IngredientTag $kind="tone">
                      {toneLabel?.emoji} {toneLabel?.label}
                    </IngredientTag>
                  )}
                  {activeTemplate && (
                    <IngredientTag $kind="template">
                      {activeTemplate}
                    </IngredientTag>
                  )}
                  {selectedContexts.map((ctx, i) => (
                    <IngredientTag
                      key={i}
                      $kind="context"
                      onClick={() => handleRemoveContext(ctx)}
                      style={{ cursor: "pointer" }}
                      title={
                        getContextValueMap(language).get(ctx) || ctx
                      }
                    >
                      {ctx} ✕
                    </IngredientTag>
                  ))}
                </IngredientsTags>
              </IngredientsSummary>
            )}

            {/* Live preview of the combined prompt */}
            {!hasIngredients ? (
              <PreviewSection>
                <PreviewBody>
                  <PreviewPlaceholder>
                    {language === "fi"
                      ? "Valitse tyyppi, äänensävy ja kuvaile promootiosi nähdäksesi esikatselun."
                      : "Select a template, tone, and describe your promotion to see a preview."}
                  </PreviewPlaceholder>
                </PreviewBody>
              </PreviewSection>
            ) : (
              <PreviewSection>
                <PreviewToggle onClick={() => setPreviewOpen(!previewOpen)}>
                  <PreviewToggleIcon $open={previewOpen}>
                    {previewOpen ? "▼" : "▶"}
                  </PreviewToggleIcon>
                  <PreviewToggleLabel>
                    {language === "fi" ? "Esikatselu" : "Preview prompt"}
                  </PreviewToggleLabel>
                  <PreviewToggleHint>
                    {language === "fi"
                      ? "— mitä generoidaan"
                      : "— what will be generated"}
                  </PreviewToggleHint>
                </PreviewToggle>
                {previewOpen && (
                  <PreviewBody>
                    {buildPreviewPrompt(
                      barName,
                      text,
                      activeTemplate,
                      activeTone,
                      selectedContexts.map(
                        (label) =>
                          getContextValueMap(language).get(label) || label,
                      ),
                      language,
                    )
                      .split("\n")
                      .map((line, i) => (
                        <PreviewLine key={i}>{line || " "}</PreviewLine>
                      ))}
                  </PreviewBody>
                )}
              </PreviewSection>
            )}

            {/* Compliance pre-check blocked */}
            {complianceBlocked && (
              <ComplianceBlockedBox>
                <ComplianceBlockedTitle>
                  {language === "fi"
                    ? "Prompt hylättiin sääntöjen vuoksi"
                    : "Prompt blocked by compliance"}
                </ComplianceBlockedTitle>
                {complianceBlocked.reasons.map((reason, i) => (
                  <ComplianceBlockedReason key={i}>
                    {reason}
                  </ComplianceBlockedReason>
                ))}
                <ComplianceBlockedHint>
                  {language === "fi"
                    ? "Muokkaa promptiasi ja yritä uudelleen."
                    : "Edit your prompt and try again."}
                </ComplianceBlockedHint>
              </ComplianceBlockedBox>
            )}

            <Divider />

            {/* Generate button */}
            <GenerateRow>
              <FormatNote>
                {language === "fi"
                  ? "Luo 3 tekstivarianttia valinnoistasi. Kuvat generoidaan erikseen."
                  : "Generates 3 text variants from your selections. Images are separate."}
              </FormatNote>
              <GenerateButton
                onClick={handleGenerateText}
                disabled={generatingText}
              >
                {generatingText ? (
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Spinner /> {GENERATING_MESSAGES[language]}
                  </span>
                ) : (
                  "Generate 3 options"
                )}
              </GenerateButton>
            </GenerateRow>

            <HintRow>
              <HintKey>{language === "fi" ? "⌘+Enter" : "⌘+Enter"}</HintKey>
              <HintText>
                {" "}
                {language === "fi" ? " generoidaksesi" : " to generate"}
              </HintText>
            </HintRow>

            {error && <ErrorBox>{error}</ErrorBox>}
            <BackLink onClick={goBack}>
              {language === "fi" ? "← Vaihda tyyppi" : "← Change type"}
            </BackLink>
          </div>
        )}

        {/* ===== STEP 3: REFINE (Review & Edit Text) ===== */}
        {step === "refine" && variants.length > 0 && (
          <div>
            <BriefRecap>
              <BriefLabel>{language === "fi" ? "Brief:" : "Brief:"}</BriefLabel>{" "}
              {text.length > 120 ? text.slice(0, 117) + "…" : text}
            </BriefRecap>

            <RefineGrid>
              {variants.map((v, i) => (
                <VariantCard key={i}>
                  <VariantCardHeader>
                    <VariantNumber>
                      {language === "fi" ? "Vaihtoehto" : "Option"} {i + 1}
                    </VariantNumber>
                    {variants.length > 1 && (
                      <DeleteButton
                        onClick={() => deleteVariant(i)}
                        title={
                          language === "fi"
                            ? "Poista tämä variantti"
                            : "Remove this variant"
                        }
                      >
                        {language === "fi" ? "Poista" : "Delete"}
                      </DeleteButton>
                    )}
                  </VariantCardHeader>

                  <FieldGroup>
                    <FieldLabel>
                      {language === "fi" ? "Otsikko" : "Title"}
                    </FieldLabel>
                    <FieldInput
                      value={v.title}
                      onChange={(e) =>
                        updateVariant(i, "title", e.target.value)
                      }
                      placeholder={
                        language === "fi"
                          ? "Tarjouksen otsikko"
                          : "Promotion title"
                      }
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <FieldLabel>
                      {language === "fi" ? "Kuvaus" : "Description"}
                    </FieldLabel>
                    <FieldTextarea
                      value={v.description}
                      onChange={(e) =>
                        updateVariant(i, "description", e.target.value)
                      }
                      placeholder={language === "fi" ? "Kuvaus" : "Description"}
                      rows={2}
                    />
                  </FieldGroup>

                  <FieldRow>
                    <FieldGroup style={{ flex: 1 }}>
                      <FieldLabel>CTA</FieldLabel>
                      <FieldInput
                        value={v.callToAction}
                        onChange={(e) =>
                          updateVariant(i, "callToAction", e.target.value)
                        }
                        placeholder="View Offer"
                      />
                    </FieldGroup>
                    <FieldGroup style={{ flex: 1 }}>
                      <FieldLabel>
                        {language === "fi" ? "Ehdot" : "Conditions"}
                      </FieldLabel>
                      <FieldInput
                        value={v.conditions}
                        onChange={(e) =>
                          updateVariant(i, "conditions", e.target.value)
                        }
                        placeholder={language === "fi" ? "Ehdot" : "Conditions"}
                      />
                    </FieldGroup>
                  </FieldRow>

                  {/* Flux prompt editor — collapsible */}
                  <FluxSection>
                    <FluxToggle
                      onClick={() => {
                        const el = document.getElementById(`flux-editor-${i}`);
                        if (el)
                          el.style.display =
                            el.style.display === "none" ? "block" : "none";
                      }}
                    >
                      <FluxToggleLabel>
                        {language === "fi"
                          ? "Muokkaa kuvapromptia"
                          : "Edit image prompt"}
                      </FluxToggleLabel>
                      <FluxToggleHint>
                        {language === "fi" ? "(Flux)" : "(Flux)"}
                      </FluxToggleHint>
                    </FluxToggle>
                    <FluxEditor
                      id={`flux-editor-${i}`}
                      style={{ display: "none" }}
                    >
                      <FluxEditorHint>
                        {language === "fi"
                          ? "Tämä prompt lähetetään Flux-kuvageneraattorille. Muokkaa sitä suoraan — kuvaile mitä kuvassa pitäisi näkyä."
                          : "This prompt is sent to the Flux image generator. Edit it directly — describe what should appear in the image."}
                      </FluxEditorHint>
                      <FieldTextarea
                        value={v.fluxPrompt}
                        onChange={(e) =>
                          updateVariant(i, "fluxPrompt", e.target.value)
                        }
                        rows={3}
                        placeholder={
                          language === "fi"
                            ? "Flux-prompt..."
                            : "Flux prompt..."
                        }
                      />
                    </FluxEditor>
                  </FluxSection>

                  {/* Inline compliance violations per variant */}
                  {variantViolations[i] && variantViolations[i].length > 0 && (
                    <ViolationList>
                      {variantViolations[i].map((v, vi) => (
                        <ViolationItem key={vi} $severity={v.severity}>
                          <ViolationBadge $severity={v.severity}>
                            {v.severity === "high"
                              ? "BLOCKED"
                              : v.severity === "medium"
                                ? "WARNING"
                                : "ADVISORY"}
                          </ViolationBadge>
                          <ViolationText>
                            <strong>"{v.keyword}"</strong> — {v.message}
                            {v.suggestion && (
                              <ViolationSuggestion>
                                {language === "fi"
                                  ? "Korjausehdotus"
                                  : "Suggestion"}
                                : {v.suggestion}
                              </ViolationSuggestion>
                            )}
                          </ViolationText>
                        </ViolationItem>
                      ))}
                      <FixVariantButton
                        onClick={() => handleFixVariant(i)}
                        disabled={fixingVariant === i}
                      >
                        {fixingVariant === i
                          ? language === "fi"
                            ? "Korjataan..."
                            : "Fixing..."
                          : language === "fi"
                            ? "Korjaa automaattisesti"
                            : "Fix automatically"}
                      </FixVariantButton>
                    </ViolationList>
                  )}
                </VariantCard>
              ))}
            </RefineGrid>

            {error && <ErrorBox>{error}</ErrorBox>}

            {usingFallback && (
              <FallbackWarningBox>
                {language === "fi"
                  ? "Luontipalvelu ei ole käytettävissä — näytetään valmiit mallipohjat. Yritä myöhemmin uudelleen."
                  : "Generation service is unavailable — showing template-based options instead. Please try again later."}
              </FallbackWarningBox>
            )}

            {complianceWarnings && complianceWarnings.length > 0 && (
              <ComplianceWarningBox>
                <ComplianceWarningTitle>
                  {language === "fi"
                    ? "Huomioita sisällöstä:"
                    : "Compliance notes:"}
                </ComplianceWarningTitle>
                {complianceWarnings.map((w, i) => (
                  <ComplianceWarningItem key={i}>{w}</ComplianceWarningItem>
                ))}
              </ComplianceWarningBox>
            )}

            <GenerateRow>
              <FormatNote>
                {language === "fi"
                  ? `${variants.length} varianttia — kuvat generoidaan jokaiselle erikseen.`
                  : `${variants.length} variants — images will be generated for each.`}
              </FormatNote>
              <GenerateButton
                onClick={handleGenerateImages}
                disabled={generatingImages || variants.length === 0}
              >
                {generatingImages ? (
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Spinner /> {GENERATING_IMAGES_MSG[language]}
                  </span>
                ) : (
                  "Generate Images"
                )}
              </GenerateButton>
            </GenerateRow>

            <BackLink onClick={goBack}>
              {language === "fi" ? "← Takaisin briefiin" : "← Back to brief"}
            </BackLink>
          </div>
        )}

        {/* ===== STEP 4: IMAGES ===== */}
        {step === "images" && variants.length > 0 && (
          <div>
            <ImageGrid>
              {variants.map((v, i) => (
                <ImageCard key={i}>
                  <ImageCardBadge>
                    {language === "fi" ? "Vaihtoehto" : "Option"} {i + 1}
                  </ImageCardBadge>

                  {/* Image or placeholder */}
                  <ImagePreview>
                    {variantImagesLoading[i] ? (
                      <ImageLoading>
                        <Spinner />
                        <span>
                          {language === "fi" ? "Luodaan..." : "Generating..."}
                        </span>
                      </ImageLoading>
                    ) : variantImages[i] ? (
                      <CardImage src={variantImages[i]} alt={v.title} />
                    ) : (
                      <ImagePlaceholder>
                        {language === "fi" ? "Ei kuvaa" : "No image"}
                      </ImagePlaceholder>
                    )}
                  </ImagePreview>

                  {/* Variant text summary */}
                  <ImageCardTitle>{v.title}</ImageCardTitle>
                  <ImageCardDesc>
                    {v.description.length > 100
                      ? v.description.slice(0, 97) + "…"
                      : v.description}
                  </ImageCardDesc>

                  {/* Layout selector */}
                  <LayoutLabel>
                    {language === "fi" ? "Asettelu" : "Layout"}
                  </LayoutLabel>
                  <LayoutRow>
                    {LAYOUT_HINTS.map((layout) => (
                      <LayoutChip
                        key={layout.template}
                        $active={variantLayouts[i] === layout.template}
                        onClick={() => {
                          setVariantLayouts((prev) => {
                            const next = [...prev];
                            next[i] = layout.template;
                            return next;
                          });
                        }}
                      >
                        {layout.label}
                      </LayoutChip>
                    ))}
                  </LayoutRow>

                  {/* Actions */}
                  <ImageActionsRow>
                    <ImageActionBtn
                      onClick={() => handleRegenerateImage(i)}
                      disabled={variantImagesLoading[i]}
                    >
                      {language === "fi" ? "↻ Arvo uusi" : "↻ Regenerate"}
                    </ImageActionBtn>

                    <FluxToggleSmall
                      onClick={() => {
                        const el = document.getElementById(
                          `flux-img-editor-${i}`,
                        );
                        if (el)
                          el.style.display =
                            el.style.display === "none" ? "block" : "none";
                      }}
                    >
                      {language === "fi" ? "Muokkaa promptia" : "Edit prompt"}
                    </FluxToggleSmall>
                  </ImageActionsRow>

                  {/* Hidden Flux prompt editor */}
                  <FluxImgEditor
                    id={`flux-img-editor-${i}`}
                    style={{ display: "none" }}
                  >
                    <FieldTextarea
                      value={v.fluxPrompt}
                      onChange={(e) =>
                        updateVariant(i, "fluxPrompt", e.target.value)
                      }
                      rows={2}
                      placeholder={
                        language === "fi" ? "Flux-prompt..." : "Flux prompt..."
                      }
                    />
                    <ImageActionBtn
                      onClick={() => handleRegenerateImage(i)}
                      disabled={variantImagesLoading[i]}
                      style={{ marginTop: 6 }}
                    >
                      {language === "fi"
                        ? "Generoi uudelleen"
                        : "Regenerate with new prompt"}
                    </ImageActionBtn>
                  </FluxImgEditor>

                  {/* Upload alternative */}
                  <ImageUploadWrapper>
                    <ImageUploader
                      value={variantImages[i] || ""}
                      onChange={(url) => {
                        const images = [...variantImages];
                        images[i] = url;
                        setVariantImages(images);
                      }}
                      contentType={contentType}
                      barId={barId}
                      dark
                    />
                  </ImageUploadWrapper>

                  {/* Select button */}
                  <SelectVariantBtn onClick={() => handleSelectVariant(i)}>
                    {language === "fi" ? "Valitse tämä" : "Use this one"}
                  </SelectVariantBtn>
                </ImageCard>
              ))}
            </ImageGrid>

            {error && <ErrorBox>{error}</ErrorBox>}

            <BackLink onClick={goBack}>
              {language === "fi" ? "← Takaisin muokkaukseen" : "← Back to edit"}
            </BackLink>
          </div>
        )}

        {/* ===== STEP 5: PUBLISH ===== */}
        {step === "publish" && (
          <ReviewSection>
            <FieldGroup>
              <FieldLabel>Title</FieldLabel>
              <FieldInput
                value={formState.title}
                onChange={(e) => onFieldChange("title", e.target.value)}
                placeholder="Promotion title"
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel>Description</FieldLabel>
              <FieldTextarea
                value={formState.description}
                onChange={(e) => onFieldChange("description", e.target.value)}
                placeholder="Description"
                rows={3}
              />
            </FieldGroup>

            {contentType === "promotion" && (
              <>
                <FieldRow>
                  <FieldGroup style={{ flex: 1 }}>
                    <FieldLabel>Type</FieldLabel>
                    <SelectField
                      value={formState.promotionType}
                      onChange={(e) =>
                        onFieldChange("promotionType", e.target.value)
                      }
                    >
                      {PROMOTION_TYPES.map((pt) => (
                        <option key={pt.value} value={pt.value}>
                          {pt.label}
                        </option>
                      ))}
                    </SelectField>
                  </FieldGroup>
                  <FieldGroup style={{ flex: 1 }}>
                    <FieldLabel>Discount (%)</FieldLabel>
                    <FieldInput
                      type="number"
                      value={formState.discountValue ?? ""}
                      onChange={(e) =>
                        onFieldChange(
                          "discountValue",
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                      placeholder="e.g. 20"
                    />
                  </FieldGroup>
                </FieldRow>
                <FieldRow>
                  <FieldGroup style={{ flex: 1 }}>
                    <FieldLabel>Start date</FieldLabel>
                    <FieldInput
                      type="date"
                      value={formState.startDate?.slice(0, 10) || ""}
                      onChange={(e) =>
                        onFieldChange("startDate", e.target.value)
                      }
                    />
                  </FieldGroup>
                  <FieldGroup style={{ flex: 1 }}>
                    <FieldLabel>End date</FieldLabel>
                    <FieldInput
                      type="date"
                      value={formState.endDate?.slice(0, 10) || ""}
                      onChange={(e) => onFieldChange("endDate", e.target.value)}
                    />
                  </FieldGroup>
                </FieldRow>
                <FieldGroup>
                  <FieldLabel>Conditions / fine print</FieldLabel>
                  <FieldInput
                    value={formState.conditions}
                    onChange={(e) =>
                      onFieldChange("conditions", e.target.value)
                    }
                    placeholder="e.g. Valid on Fridays 16:00–19:00"
                  />
                </FieldGroup>
              </>
            )}

            {contentType === "event" && (
              <>
                <FieldRow>
                  <FieldGroup style={{ flex: 1 }}>
                    <FieldLabel>Start time</FieldLabel>
                    <FieldInput
                      type="datetime-local"
                      value={formState.startTime?.slice(0, 16) || ""}
                      onChange={(e) =>
                        onFieldChange("startTime", e.target.value)
                      }
                    />
                  </FieldGroup>
                  <FieldGroup style={{ flex: 1 }}>
                    <FieldLabel>End time</FieldLabel>
                    <FieldInput
                      type="datetime-local"
                      value={formState.endTime?.slice(0, 16) || ""}
                      onChange={(e) => onFieldChange("endTime", e.target.value)}
                    />
                  </FieldGroup>
                </FieldRow>
                <FieldGroup>
                  <FieldLabel>Max attendees</FieldLabel>
                  <FieldInput
                    type="number"
                    value={formState.maxAttendees ?? ""}
                    onChange={(e) =>
                      onFieldChange(
                        "maxAttendees",
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    placeholder="Leave empty for unlimited"
                  />
                </FieldGroup>
              </>
            )}

            {contentType === "campaign" && (
              <>
                <FieldGroup>
                  <FieldLabel>Campaign type</FieldLabel>
                  <SelectField
                    value={formState.campaignType}
                    onChange={(e) =>
                      onFieldChange("campaignType", e.target.value)
                    }
                  >
                    <option value="FEATURED_LISTING">Featured Listing</option>
                    <option value="BANNER_AD">Banner Ad</option>
                    <option value="PUSH_NOTIFICATION">Push Notification</option>
                  </SelectField>
                </FieldGroup>
                <FieldGroup>
                  <FieldLabel>Budget (EUR)</FieldLabel>
                  <FieldInput
                    type="number"
                    value={formState.campaignBudget}
                    onChange={(e) =>
                      onFieldChange(
                        "campaignBudget",
                        e.target.value ? Number(e.target.value) : 0,
                      )
                    }
                    placeholder="e.g. 50"
                  />
                </FieldGroup>
                <FieldRow>
                  <FieldGroup style={{ flex: 1 }}>
                    <FieldLabel>Start date</FieldLabel>
                    <FieldInput
                      type="date"
                      value={formState.campaignStartDate?.slice(0, 10) || ""}
                      onChange={(e) =>
                        onFieldChange("campaignStartDate", e.target.value)
                      }
                    />
                  </FieldGroup>
                  <FieldGroup style={{ flex: 1 }}>
                    <FieldLabel>End date</FieldLabel>
                    <FieldInput
                      type="date"
                      value={formState.campaignEndDate?.slice(0, 10) || ""}
                      onChange={(e) =>
                        onFieldChange("campaignEndDate", e.target.value)
                      }
                    />
                  </FieldGroup>
                </FieldRow>
              </>
            )}

            {contentType === "pass" && (
              <FieldRow>
                <FieldGroup style={{ flex: 1 }}>
                  <FieldLabel>Price (EUR)</FieldLabel>
                  <FieldInput
                    value={formState.priceEuros}
                    onChange={(e) =>
                      onFieldChange("priceEuros", e.target.value)
                    }
                    placeholder="e.g. 9.90"
                  />
                </FieldGroup>
                <FieldGroup style={{ flex: 1 }}>
                  <FieldLabel>Pass type</FieldLabel>
                  <SelectField
                    value={formState.passType}
                    onChange={(e) => onFieldChange("passType", e.target.value)}
                  >
                    <option value="SKIP_LINE">Skip Line</option>
                    <option value="VIP_ACCESS">VIP Access</option>
                    <option value="COVER_CHARGE">Cover Charge</option>
                  </SelectField>
                </FieldGroup>
              </FieldRow>
            )}

            <SubmitRow>
              <BackLink onClick={goBack} style={{ marginBottom: 0 }}>
                {language === "fi" ? "← Takaisin kuviin" : "← Back to images"}
              </BackLink>
              <SubmitButton
                onClick={onSubmit}
                disabled={submitting || !formState.title.trim()}
              >
                {submitting
                  ? "Publishing..."
                  : contentType === "campaign"
                    ? "Launch campaign"
                    : "Publish"}
              </SubmitButton>
            </SubmitRow>
          </ReviewSection>
        )}
      </StepBody>
    </Container>
  );
}

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16162a 100%);
  border: 1px solid #2d2d4a;
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 16px;
`;

// ---- Progress ----

const ProgressBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 16px;
`;

const ProgressStep = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

const ProgressDot = styled.div<{ $active: boolean; $done: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
  transition: all 0.2s;
  background: ${({ $active, $done }) =>
    $active ? "#7c3aed" : $done ? "#10b981" : "#2d2d4a"};
  color: ${({ $active, $done }) => ($active || $done ? "white" : "#6b7280")};
`;

const ProgressLabel = styled.span<{ $active: boolean; $done: boolean }>`
  font-size: 9px;
  font-weight: 600;
  margin-left: 6px;
  color: ${({ $active, $done }) =>
    $active ? "#a78bfa" : $done ? "#6ee7b7" : "#4b5563"};
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const ProgressLine = styled.div<{ $done: boolean }>`
  flex: 1;
  height: 1px;
  min-width: 8px;
  margin: 0 6px;
  background: ${({ $done }) => ($done ? "#10b981" : "#2d2d4a")};
  transition: background 0.3s;
`;

// ---- Shared ----

const StepBody = styled.div`
  padding: 20px;
`;

const StepTitle = styled.h2`
  font-size: 16px;
  font-weight: 700;
  color: #f9fafb;
  margin: 0 0 16px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const StepNum = styled.span`
  color: #7c3aed;
  font-size: 14px;
`;

const SectionLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: #a78bfa;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
`;

const Divider = styled.div`
  height: 1px;
  background: #2d2d4a;
  margin: 16px 0;
`;

const BackLink = styled.button`
  display: block;
  margin-top: 12px;
  background: none;
  border: none;
  color: #6b7280;
  font-size: 12px;
  cursor: pointer;
  font-weight: 500;
  padding: 0;
  &:hover {
    color: #a78bfa;
  }
`;

const ErrorBox = styled.div`
  margin-top: 10px;
  font-size: 12px;
  color: #ef4444;
  padding: 8px 12px;
  background: rgba(239, 68, 68, 0.08);
  border-radius: 8px;
  border: 1px solid rgba(239, 68, 68, 0.2);
`;

// ---- Step 1: Type ----

const TypeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
`;

const TypeCard = styled.button<{ $selected: boolean }>`
  padding: 16px;
  border: 1px solid ${({ $selected }) => ($selected ? "#7c3aed" : "#2d2d4a")};
  border-radius: 10px;
  background: ${({ $selected }) =>
    $selected ? "rgba(124, 58, 237, 0.1)" : "#0d0d1a"};
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
  display: flex;
  flex-direction: column;
  gap: 6px;
  &:hover {
    border-color: #7c3aed;
    background: rgba(124, 58, 237, 0.06);
  }
`;

const TypeCardEmoji = styled.span`
  font-size: 24px;
  line-height: 1;
`;
const TypeCardLabel = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: #f9fafb;
`;
const TypeCardDesc = styled.span`
  font-size: 11px;
  color: #6b7280;
  line-height: 1.4;
`;

// ---- Step 2: Textarea ----

const Textarea = styled.textarea`
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #2d2d4a;
  border-radius: 10px;
  font-size: 14px;
  min-height: 240px;
  resize: vertical;
  box-sizing: border-box;
  font-family: inherit;
  line-height: 1.55;
  background: #0d0d1a;
  color: #e5e7eb;
  transition: border-color 0.2s;
  &:focus {
    outline: none;
    border-color: #7c3aed;
  }
  &::placeholder {
    color: #4b5563;
  }
`;

const TextareaHint = styled.div`
  font-size: 10px;
  color: #6b7280;
  font-style: italic;
`;

const BriefActionsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  margin-bottom: 2px;
  gap: 12px;
`;

const RegenerateBriefButton = styled.button`
  padding: 5px 12px;
  border: 1px solid #2d2d4a;
  border-radius: 6px;
  background: #0d0d1a;
  color: #a78bfa;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
  flex-shrink: 0;
  &:hover:not(:disabled) {
    border-color: #7c3aed;
    background: rgba(124, 58, 237, 0.1);
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

// ---- Helpers (collapsible) ----

const HelperSection = styled.div`
  margin-top: 12px;
  border: 1px solid #2d2d4a;
  border-radius: 8px;
  overflow: hidden;
`;

const HelperToggle = styled.button`
  width: 100%;
  padding: 8px 12px;
  background: #0d0d1a;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
  &:hover {
    background: #1a1a2e;
  }
`;

const HelperToggleIcon = styled.span<{ $open: boolean }>`
  font-size: 10px;
  color: ${({ $open }) => ($open ? "#a78bfa" : "#6b7280")};
  transition: transform 0.15s;
`;

const HelperToggleLabel = styled.span`
  font-size: 12px;
  font-weight: 700;
  color: #f9fafb;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const HelperActiveTag = styled.span`
  font-size: 10px;
  font-weight: 500;
  color: #a78bfa;
  background: rgba(124, 58, 237, 0.15);
  padding: 1px 6px;
  border-radius: 3px;
`;

const HelperHint = styled.span`
  font-size: 10px;
  color: #4b5563;
  margin-left: auto;
`;

const HelperBody = styled.div`
  padding: 10px 12px 12px;
  background: rgba(124, 58, 237, 0.04);
  border-top: 1px solid #2d2d4a;
`;

const HelperDesc = styled.div`
  font-size: 11px;
  color: #9ca3af;
  margin-bottom: 10px;
  line-height: 1.4;
`;

// ---- Tone chips ----

const ToneRow = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const ToneChip = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  border: 1px solid ${({ $active }) => ($active ? "#7c3aed" : "#2d2d4a")};
  border-radius: 8px;
  background: ${({ $active }) =>
    $active ? "rgba(124, 58, 237, 0.12)" : "#0d0d1a"};
  color: ${({ $active }) => ($active ? "#ffffff" : "#d1d5db")};
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 4px;
  &:hover:not(:disabled) {
    border-color: #7c3aed;
    color: #ffffff;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

// ---- Templates ----

const TemplateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 6px;
`;

const TemplateCard = styled.button<{ $active: boolean }>`
  padding: 10px 12px;
  border: 1px solid ${({ $active }) => ($active ? "#7c3aed" : "#2d2d4a")};
  border-radius: 8px;
  background: ${({ $active }) =>
    $active ? "rgba(124, 58, 237, 0.12)" : "#0d0d1a"};
  cursor: pointer;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: all 0.15s;
  ${({ $active }) =>
    $active && "box-shadow: 0 0 0 1px rgba(124, 58, 237, 0.3);"}
  &:hover:not(:disabled) {
    border-color: #7c3aed;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const TemplateName = styled.span`
  font-size: 12px;
  font-weight: 700;
  color: #f9fafb;
  line-height: 1.2;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const WizardBadge = styled.span`
  font-size: 9px;
  font-weight: 500;
  color: #a78bfa;
  background: rgba(124, 58, 237, 0.15);
  padding: 0 4px;
  border-radius: 3px;
`;

const TemplateDesc = styled.span`
  font-size: 10px;
  color: #9ca3af;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

// ---- Wizard ----

const WizardPanel = styled.div`
  margin-top: 14px;
  padding: 16px;
  background: rgba(124, 58, 237, 0.06);
  border: 1px solid rgba(124, 58, 237, 0.25);
  border-radius: 10px;
  animation: wizardSlideIn 0.2s ease-out;
  @keyframes wizardSlideIn {
    from {
      opacity: 0;
      transform: translateY(-6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const WizardProgress = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 600;
  color: #a78bfa;
  margin-bottom: 12px;
`;

const WizardStepPips = styled.div`
  display: flex;
  gap: 4px;
`;

const WizardPip = styled.div<{ $active: boolean; $done: boolean }>`
  width: ${({ $active }) => ($active ? "20px" : "6px")};
  height: 6px;
  border-radius: 3px;
  background: ${({ $active, $done }) =>
    $active ? "#a78bfa" : $done ? "#7c3aed" : "#2d2d4a"};
  transition: all 0.2s;
`;

const WizardQuestion = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #e5e7eb;
  margin-bottom: 12px;
  line-height: 1.4;
`;

const WizardChipRow = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const WizardChip = styled.button`
  padding: 8px 14px;
  border: 1px solid #2d2d4a;
  border-radius: 8px;
  background: #0d0d1a;
  color: #f9fafb;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  line-height: 1.3;
  flex: 1 1 140px;
  min-width: 120px;
  max-width: 220px;
  &:hover:not(:disabled) {
    border-color: #7c3aed;
    background: rgba(124, 58, 237, 0.1);
    color: #ffffff;
  }
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const WizardActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #2d2d4a;
`;

const WizardBackButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  &:hover {
    color: #a78bfa;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const WizardSkipButton = styled.button`
  background: none;
  border: none;
  color: #4b5563;
  font-size: 11px;
  cursor: pointer;
  padding: 0;
  font-style: italic;
  &:hover {
    color: #6b7280;
  }
`;

// ---- Context chips ----

const SuggestionRow = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const SuggestionChip = styled.button<{ $selected?: boolean }>`
  padding: 5px 12px;
  border: 1px solid ${({ $selected }) => ($selected ? "#7c3aed" : "#2d2d4a")};
  border-radius: 14px;
  background: ${({ $selected }) =>
    $selected ? "rgba(124, 58, 237, 0.12)" : "#0d0d1a"};
  color: ${({ $selected }) => ($selected ? "#ffffff" : "#d1d5db")};
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  &:hover:not(:disabled) {
    border-color: #7c3aed;
    color: #ffffff;
    background: #1a1a2e;
  }
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

// ---- Controls ----

const ControlsRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 16px;
  margin-top: 14px;
`;

const ControlGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ControlLabel = styled.span`
  font-size: 10px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const PillGroup = styled.div`
  display: flex;
  gap: 2px;
  background: #0d0d1a;
  border-radius: 8px;
  padding: 2px;
  border: 1px solid #2d2d4a;
`;

const Pill = styled.button<{ $active: boolean }>`
  padding: 5px 12px;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  background: ${({ $active }) => ($active ? "#7c3aed" : "transparent")};
  color: ${({ $active }) => ($active ? "white" : "#6b7280")};
  transition: all 0.15s;
  &:hover {
    color: ${({ $active }) => ($active ? "white" : "#d1d5db")};
  }
`;

const GenerateRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 14px;
`;

const FormatNote = styled.span`
  font-size: 10px;
  color: #6b7280;
  font-style: italic;
  flex: 1;
  text-align: center;
`;

const GenerateButton = styled.button`
  padding: 10px 22px;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  &:hover:not(:disabled) {
    background: #6d28d9;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Spinner = styled.span`
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.7s linear infinite;
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const HintRow = styled.div`
  margin-top: 10px;
  text-align: center;
`;

const HintKey = styled.span`
  font-size: 11px;
  color: #4b5563;
  background: #1a1a2e;
  padding: 1px 6px;
  border-radius: 3px;
  border: 1px solid #2d2d4a;
`;

const HintText = styled.span`
  font-size: 11px;
  color: #4b5563;
`;

// ---- Step 3: Refine ----

const BriefRecap = styled.div`
  font-size: 12px;
  color: #6b7280;
  padding: 8px 12px;
  background: #0d0d1a;
  border-radius: 8px;
  margin-bottom: 12px;
  border: 1px solid #2d2d4a;
  line-height: 1.4;
`;

const BriefLabel = styled.span`
  font-weight: 600;
  color: #9ca3af;
`;

const RefineGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const VariantCard = styled.div`
  padding: 16px;
  border: 1px solid #2d2d4a;
  border-radius: 10px;
  background: #0d0d1a;
`;

const VariantCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const VariantNumber = styled.span`
  font-size: 12px;
  font-weight: 700;
  color: #a78bfa;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const DeleteButton = styled.button`
  padding: 3px 8px;
  border: 1px solid #2d2d4a;
  border-radius: 6px;
  background: transparent;
  color: #ef4444;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: #ef4444;
  }
`;

// ---- Flux prompt editor (Step 3) ----

const FluxSection = styled.div`
  margin-top: 12px;
  border: 1px solid #2d2d4a;
  border-radius: 6px;
  overflow: hidden;
`;

const FluxToggle = styled.button`
  width: 100%;
  padding: 6px 10px;
  background: #0a0a14;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  &:hover {
    background: #111122;
  }
`;

const FluxToggleLabel = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
`;

const FluxToggleHint = styled.span`
  font-size: 9px;
  color: #4b5563;
  text-transform: uppercase;
`;

const FluxEditor = styled.div`
  padding: 8px 10px 10px;
  border-top: 1px solid #2d2d4a;
  background: #060610;
`;

const FluxEditorHint = styled.div`
  font-size: 10px;
  color: #4b5563;
  margin-bottom: 6px;
  line-height: 1.4;
`;

// ---- Step 4: Images ----

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
`;

const ImageCard = styled.div`
  padding: 14px;
  border: 1px solid #2d2d4a;
  border-radius: 10px;
  background: #0d0d1a;
  display: flex;
  flex-direction: column;
`;

const ImageCardBadge = styled.span`
  font-size: 10px;
  font-weight: 700;
  color: #a78bfa;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
`;

const ImagePreview = styled.div`
  width: 100%;
  height: 160px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #2d2d4a;
  margin-bottom: 10px;
  background: #0a0a14;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CardImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ImagePlaceholder = styled.div`
  font-size: 12px;
  color: #4b5563;
`;

const ImageLoading = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #6b7280;
`;

const ImageCardTitle = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: #f9fafb;
  margin-bottom: 4px;
`;

const ImageCardDesc = styled.div`
  font-size: 11px;
  color: #6b7280;
  line-height: 1.4;
  margin-bottom: 10px;
`;

const LayoutLabel = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: #4b5563;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
  margin-top: 6px;
`;

const LayoutRow = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
`;

const LayoutChip = styled.button<{ $active: boolean }>`
  padding: 3px 8px;
  border: 1px solid ${({ $active }) => ($active ? "#7c3aed" : "#2d2d4a")};
  border-radius: 5px;
  background: ${({ $active }) =>
    $active ? "rgba(124, 58, 237, 0.15)" : "transparent"};
  color: ${({ $active }) => ($active ? "#f9fafb" : "#6b7280")};
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    border-color: #7c3aed;
  }
`;

const ImageActionsRow = styled.div`
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
`;

const ImageActionBtn = styled.button`
  padding: 4px 10px;
  border: 1px solid #2d2d4a;
  border-radius: 6px;
  background: transparent;
  color: #a78bfa;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  &:hover:not(:disabled) {
    border-color: #7c3aed;
    background: rgba(124, 58, 237, 0.1);
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const FluxToggleSmall = styled.button`
  padding: 4px 10px;
  border: 1px solid #2d2d4a;
  border-radius: 6px;
  background: transparent;
  color: #6b7280;
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
  &:hover {
    color: #9ca3af;
    border-color: #4b5563;
  }
`;

const FluxImgEditor = styled.div`
  padding: 8px;
  border: 1px solid #2d2d4a;
  border-radius: 6px;
  margin-bottom: 8px;
  background: #060610;
`;

const ImageUploadWrapper = styled.div`
  margin-bottom: 8px;
`;

const SelectVariantBtn = styled.button`
  width: 100%;
  padding: 8px;
  border: none;
  border-radius: 8px;
  background: #7c3aed;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: auto;
  &:hover {
    background: #6d28d9;
  }
`;

// ---- Step 5: Publish ----

const ReviewSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FieldLabel = styled.label`
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const inputStyles = `
  padding: 8px 12px; border: 1px solid #2d2d4a; border-radius: 8px;
  background: #0d0d1a; color: #e5e7eb; font-size: 13px; font-family: inherit;
  &:focus { outline: none; border-color: #7c3aed; }
  &::placeholder { color: #4b5563; }
`;

const FieldInput = styled.input`
  ${inputStyles}
`;
const FieldTextarea = styled.textarea`
  ${inputStyles} resize: vertical;
`;
const SelectField = styled.select`
  ${inputStyles}
`;

const FieldRow = styled.div`
  display: flex;
  gap: 10px;
`;

const SubmitRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid #2d2d4a;
`;

// ---- Ingredients summary ----

const IngredientsSummary = styled.div`
  margin-top: 14px;
  padding: 10px 12px;
  background: rgba(124, 58, 237, 0.05);
  border: 1px solid rgba(124, 58, 237, 0.15);
  border-radius: 8px;
`;

const IngredientsLabel = styled.div`
  font-size: 10px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
`;

const IngredientsTags = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

// ---- Preview prompt ----

const PreviewSection = styled.div`
  margin-top: 12px;
  border: 1px solid #2d2d4a;
  border-radius: 8px;
  overflow: hidden;
`;

const PreviewToggle = styled.button`
  width: 100%;
  padding: 8px 12px;
  background: #0d0d1a;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
  &:hover {
    background: #1a1a2e;
  }
`;

const PreviewToggleIcon = styled.span<{ $open: boolean }>`
  font-size: 10px;
  color: ${({ $open }) => ($open ? "#60a5fa" : "#6b7280")};
`;

const PreviewToggleLabel = styled.span`
  font-size: 12px;
  font-weight: 700;
  color: #f9fafb;
`;

const PreviewToggleHint = styled.span`
  font-size: 10px;
  color: #6b7280;
  font-style: italic;
`;

const PreviewBody = styled.div`
  padding: 12px;
  background: #060610;
  border-top: 1px solid #2d2d4a;
  font-family: "SF Mono", "Fira Code", monospace;
`;

const PreviewLine = styled.div`
  font-size: 11px;
  color: #d1d5db;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
`;

const PreviewPlaceholder = styled.div`
  font-size: 12px;
  color: #6b7280;
  text-align: center;
  padding: 16px 8px;
  line-height: 1.5;
`;

// ---- Custom context input ----

const CustomContextRow = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #2d2d4a;
`;

const CustomContextInput = styled.input`
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #2d2d4a;
  border-radius: 6px;
  background: #0d0d1a;
  color: #e5e7eb;
  font-size: 11px;
  font-family: inherit;
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
  &::placeholder {
    color: #4b5563;
  }
  &:disabled {
    opacity: 0.4;
  }
`;

const CustomContextAddBtn = styled.button`
  padding: 6px 12px;
  border: 1px solid #3b82f6;
  border-radius: 6px;
  background: rgba(59, 130, 246, 0.12);
  color: #60a5fa;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
  &:hover:not(:disabled) {
    background: rgba(59, 130, 246, 0.2);
  }
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const IngredientTag = styled.span<{ $kind: "tone" | "template" | "context" }>`
  padding: 3px 8px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 600;
  background: ${({ $kind }) =>
    $kind === "tone"
      ? "rgba(245, 158, 11, 0.12)"
      : $kind === "template"
        ? "rgba(124, 58, 237, 0.15)"
        : "rgba(59, 130, 246, 0.12)"};
  color: ${({ $kind }) =>
    $kind === "tone"
      ? "#f59e0b"
      : $kind === "template"
        ? "#a78bfa"
        : "#60a5fa"};
  border: 1px solid
    ${({ $kind }) =>
      $kind === "tone"
        ? "rgba(245, 158, 11, 0.25)"
        : $kind === "template"
          ? "rgba(124, 58, 237, 0.25)"
          : "rgba(59, 130, 246, 0.25)"};
`;

// ---- Compliance blocked ----

const ComplianceBlockedBox = styled.div`
  margin-top: 14px;
  padding: 12px;
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 8px;
`;

const ComplianceBlockedTitle = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: #ef4444;
  margin-bottom: 8px;
`;

const ComplianceBlockedReason = styled.div`
  font-size: 11px;
  color: #fca5a5;
  margin-bottom: 4px;
  padding-left: 8px;
  border-left: 2px solid rgba(239, 68, 68, 0.3);
  line-height: 1.4;
`;

const ComplianceBlockedHint = styled.div`
  font-size: 10px;
  color: #6b7280;
  margin-top: 8px;
  font-style: italic;
`;

// ---- Inline per-variant violation display ----

const ViolationList = styled.div`
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ViolationItem = styled.div<{ $severity: string }>`
  display: flex;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  background: ${({ $severity }) =>
    $severity === "high"
      ? "rgba(239,68,68,0.06)"
      : $severity === "medium"
        ? "rgba(245,158,11,0.06)"
        : "rgba(59,130,246,0.04)"};
  border: 1px solid
    ${({ $severity }) =>
      $severity === "high"
        ? "rgba(239,68,68,0.25)"
        : $severity === "medium"
          ? "rgba(245,158,11,0.25)"
          : "rgba(59,130,246,0.15)"};
`;

const ViolationBadge = styled.span<{ $severity: string }>`
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 5px;
  border-radius: 3px;
  white-space: nowrap;
  height: fit-content;
  color: ${({ $severity }) =>
    $severity === "high"
      ? "#ef4444"
      : $severity === "medium"
        ? "#f59e0b"
        : "#3b82f6"};
  background: ${({ $severity }) =>
    $severity === "high"
      ? "rgba(239,68,68,0.15)"
      : $severity === "medium"
        ? "rgba(245,158,11,0.15)"
        : "rgba(59,130,246,0.1)"};
`;

const ViolationText = styled.div`
  font-size: 11px;
  color: #d1d5db;
  line-height: 1.4;
`;

const ViolationSuggestion = styled.div`
  margin-top: 3px;
  font-size: 10px;
  color: #fbbf24;
  font-style: italic;
`;

const FixVariantButton = styled.button`
  margin-top: 4px;
  padding: 5px 10px;
  font-size: 10px;
  font-weight: 600;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.08);
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-radius: 5px;
  cursor: pointer;
  align-self: flex-start;
  &:hover {
    background: rgba(251, 191, 36, 0.15);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// ---- Compliance warning (post-check) ----

const ComplianceWarningBox = styled.div`
  margin-top: 10px;
  padding: 10px 12px;
  background: rgba(245, 158, 11, 0.06);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 8px;
`;

const FallbackWarningBox = styled.div`
  margin-top: 10px;
  padding: 10px 12px;
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  color: #f87171;
  line-height: 1.4;
`;

const ComplianceWarningTitle = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: #f59e0b;
  margin-bottom: 6px;
`;

const ComplianceWarningItem = styled.div`
  font-size: 10px;
  color: #fcd34d;
  margin-bottom: 3px;
  padding-left: 6px;
  border-left: 2px solid rgba(245, 158, 11, 0.3);
  line-height: 1.4;
`;

const SubmitButton = styled.button`
  padding: 10px 28px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover:not(:disabled) {
    background: #059669;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
