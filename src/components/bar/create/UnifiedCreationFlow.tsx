"use client";

import { useState, useCallback } from "react";
import styled from "styled-components";
import type { ContentType, FormState } from "./types";
import { PROMOTION_TYPES } from "./types";
import VariantPicker, { type PromotionVariant } from "./VariantPicker";
import type { ContentTone } from "./ToneSelector";
import { TONE_OPTIONS } from "./ToneSelector";
import ImageUploader from "./shared/ImageUploader";
import AIImageGenerator from "./shared/AIImageGenerator";

// ---- Types ----

type Language = "fi" | "en";
type FlowStep = "type" | "brief" | "variants" | "review";

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
    { label: "After-Work", prompt: "After-work evening — great music, relaxed atmosphere, and the perfect place to unwind after the office. Weekday afternoons 16:00–19:00. Focus on the vibe." },
    { label: "Ladies Night", prompt: "Ladies Night — exclusive evening for women, Friday or Saturday. Welcoming atmosphere with great music, service, and company. No price mentions or special offers." },
    { label: "Live Music", prompt: "Live music performance — band or DJ, evening event. Describe the experience, atmosphere, date and time." },
    { label: "Game Night", prompt: "Quiz or bingo night — entry included, competitive team atmosphere, weekday evening. Focus on fun and social experience." },
    { label: "Food Special", prompt: "Food special — featured menu items or combo selections, weekday evenings. Focus on food quality and pairing suggestions." },
    { label: "VIP Experience", prompt: "Premium experience — priority entry, reserved seating, exclusive area access. Describe the elevated service and atmosphere." },
    { label: "Signature Evening", prompt: "Signature evening — our team's top recommendations for the night. Focus on craftsmanship, unique flavours, and the bar's character." },
    { label: "Theme Night", prompt: "Theme night — karaoke, 80s retro, sports screening. Describe the theme and entertainment. Focus on the experience." },
  ],
  fi: [
    { label: "After-Work", prompt: "After-work-ilta — hyvää musiikkia, rento tunnelma ja täydellinen paikka rentoutua toimiston jälkeen. Arki-iltapäivisin klo 16–19. Keskity tunnelmaan." },
    { label: "Naistenilta", prompt: "Naistenilta — naisille suunnattu ilta, perjantai tai lauantai. Viihtyisä tunnelma, hyvää musiikkia, palvelua ja seuraa. Älä mainitse hintoja tai erikoistarjouksia." },
    { label: "Elävä musiikki", prompt: "Live-esiintyminen — bändi tai DJ, iltatapahtuma. Kuvaile elämystä, tunnelmaa, päivämäärää ja kellonaikaa." },
    { label: "Peli-ilta", prompt: "Tietovisa- tai bingoilta — osallistuminen sisältyy, kilpailuhenkinen joukkuetunnelma, arki-ilta. Keskity hauskuuteen ja sosiaaliseen kokemukseen." },
    { label: "Ruokatarjous", prompt: "Ruokatarjous — suositeltuja annoksia tai yhdistelmiä, arki-iltaisin. Keskity ruoan laatuun ja yhdistelyvinkkeihin." },
    { label: "VIP-kokemus", prompt: "Premium-kokemus — etuoikeutettu sisäänpääsy, varattu istumapaikka, pääsy eksklusiiviselle alueelle. Kuvaile parempaa palvelua ja tunnelmaa." },
    { label: "Talon suositukset", prompt: "Talon suositukset — tiimimme parhaat suositukset illalle. Keskity käsityötaitoon, ainutlaatuisiin makuihin ja baarin luonteeseen." },
    { label: "Teemailta", prompt: "Teemailta — karaoke, 80-luvun retro, urheilulähetys. Kuvaile teemaa ja viihdettä. Keskity elämykseen." },
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
  en: 'Describe what you want — e.g. "Friday after-work, 16:00–19:00, relaxed atmosphere with great music"',
};

const GENERATING_MESSAGES: Record<Language, string> = {
  fi: "Tekoälymme luo vaihtoehtoja...",
  en: "Our AI is crafting your options...",
};

// ---- Helpers ----

const STEP_LABELS: Record<FlowStep, string> = {
  type: "What are you creating?",
  brief: "Describe what's happening",
  variants: "Choose your favorite",
  review: "Review & publish",
};

function stepNumber(step: FlowStep): number {
  return ["type", "brief", "variants", "review"].indexOf(step) + 1;
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
  const [activeLayout, setActiveLayout] = useState<string | null>(null);

  // Generation state
  const [variants, setVariants] = useState<PromotionVariant[]>([]);
  const [inferredType, setInferredType] = useState<string>("promotion");
  const [generating, setGenerating] = useState(false);
  const [imageTab, setImageTab] = useState<"upload" | "ai">("upload");
  const [sharedBgImage, setSharedBgImage] = useState<string | null>(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("hoppr_token") : null;

  // ---- Tone ----

  const handleToneSelect = (tone: ContentTone) => {
    setActiveTone(activeTone === tone ? null : tone);
  };

  // ---- Template click → fill textarea ----

  const handleTemplateClick = (label: string, prompt: string) => {
    setText(prompt);
    setActiveTemplate(label);
  };

  // ---- AI Generation ----

  /** Generate a single shared background image from inferred chips.
   *  All variant cards display this same image — only the text layout varies. */
  const generateSharedImage = useCallback(
    async (variant: PromotionVariant, authToken: string) => {
      if (!variant.imageChips) return;
      try {
        const res = await fetch(`/api/auth/bar/${barId}/images/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            styleId: variant.imageChips.styleId,
            subjectId: variant.imageChips.subjectId,
            compositionId: variant.imageChips.compositionId,
            contentType: "promotion",
            count: 2,
            formContext: {
              title: variant.title,
              description: variant.description,
              promotionType: variant.type,
              barName,
            },
          }),
        });
        const data = await res.json();
        if (data.urls && data.urls.length > 0) {
          setSharedBgImage(data.urls[0]);
        }
      } catch {
        // Silently fall back — cards show OG text overlay without background
      }
    },
    [barId, barName],
  );

  const handleGenerate = useCallback(async () => {
    const input = text.trim();
    if (!input || !token) return;

    setGenerating(true);
    setError(null);
    setVariants([]);

    try {
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

      const genRes = await fetch(
        `/api/auth/bar/${barId}/promotions/ai-generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            prompt: input,
            type,
            language,
            numVariants: 3,
            contentTone: activeTone,
            layoutHint: activeLayout,
          }),
        },
      );

      if (!genRes.ok) {
        const data = await genRes.json();
        throw new Error(data.error || "Variant generation failed");
      }

      const genData = await genRes.json();

      if (genData.variants && Array.isArray(genData.variants)) {
        const vars = genData.variants as PromotionVariant[];
        setVariants(vars);
        setStep("variants");

        // Generate ONE shared background image from the first variant's inferred chips.
        // The variant cards show different text layouts on this same image — not new images.
        const first = vars[0];
        if (first.imageChips) {
          generateSharedImage(first, token);
        }

        const previewVisual = activeLayout
          ? {
              template: activeLayout as "split" | "centered" | "card",
              mood: "dark",
              overlayOpacity: 0.4,
            }
          : first.visual;

        onGenerated({
          ...suggestData,
          _previewOnly: true,
          cardFormat: "wide",
          title: first.title,
          description: first.description,
          promotionType: first.type,
          discountValue: first.discount,
          conditions: first.conditions,
          callToAction: first.callToAction,
          visual: {
            ...(previewVisual || {}),
            accentColor: first.accentColor,
          },
        });
        return;
      }

      onGenerated({ ...suggestData, cardFormat: "wide" });
      setStep("review");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate. Try again.",
      );
    } finally {
      setGenerating(false);
    }
  }, [text, token, barId, language, activeTone, activeLayout, onGenerated]);

  // ---- Variant selection ----

  const handleVariantSelect = useCallback(
    (variant: PromotionVariant) => {
      const visual = {
        ...(variant.visual || {}),
        accentColor: variant.accentColor,
        ...(activeLayout ? { template: activeLayout } : {}),
      };

      onGenerated({
        inferredType,
        aiGenerated: true,
        confidence: 0.85,
        title: variant.title,
        description: variant.description,
        reasoning: `Selected from ${variants.length} AI-generated options.`,
        imageSuggestion: "bar-ambience",
        imageUrl: sharedBgImage || null,
        promotionType: variant.type,
        discountValue: variant.discount,
        conditions: variant.conditions,
        targetAudience: "EVERYONE",
        cardFormat: "wide",
        visual,
      });
      setVariants([]);
      setStep("review");
    },
    [inferredType, variants.length, activeLayout, sharedBgImage, onGenerated],
  );

  // ---- Navigation ----

  const goBack = () => {
    if (step === "brief") setStep("type");
    else if (step === "variants") {
      setStep("brief");
      setVariants([]);
      setGenerating(false);
    } else if (step === "review") setStep("variants");
  };

  // ---- Render helpers ----

  const isBusy = generating;
  const toneInfo = activeTone
    ? TONE_OPTIONS.find((o) => o.value === activeTone)
    : null;
  const profileTone =
    !activeTone && contentTone
      ? TONE_OPTIONS.find((o) => o.value === contentTone)
      : null;

  return (
    <Container>
      {/* ---- Progress bar ---- */}
      <ProgressBar>
        {(["type", "brief", "variants", "review"] as FlowStep[]).map((s, i) => {
          const idx = i + 1;
          const isActive = s === step;
          const isDone = stepNumber(step) > stepNumber(s);
          const isClickable = isDone && s !== "variants";

          return (
            <ProgressStep key={s}>
              <ProgressDot
                $active={isActive}
                $done={isDone}
                onClick={isClickable ? () => setStep(s) : undefined}
                style={{ cursor: isClickable ? "pointer" : "default" }}
              >
                {isDone ? "✓" : idx}
              </ProgressDot>
              <ProgressLabel $active={isActive} $done={isDone}>
                {s === "type"
                  ? "Type"
                  : s === "brief"
                    ? "Brief"
                    : s === "variants"
                      ? "Pick"
                      : "Review"}
              </ProgressLabel>
              {i < 3 && <ProgressLine $done={isDone} />}
            </ProgressStep>
          );
        })}
      </ProgressBar>

      {/* ---- Step content ---- */}
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
            {/* Language — at top, affects all generated content */}
            <ControlsRow style={{ marginTop: 0, marginBottom: 14 }}>
              <ControlGroup>
                <ControlLabel>Language</ControlLabel>
                <PillGroup>
                  {(["en", "fi"] as const).map((lang) => (
                    <Pill
                      key={lang}
                      $active={language === lang}
                      onClick={() => setLanguage(lang)}
                      disabled={isBusy}
                    >
                      {lang.toUpperCase()}
                    </Pill>
                  ))}
                </PillGroup>
              </ControlGroup>
              <LangHint $visible={language !== "en"}>
                {language === "fi" ? "Sisältö luodaan suomeksi" : "Generated content will be in English"}
              </LangHint>
            </ControlsRow>

            {/* Tone selector */}
            <SectionLabel>Voice</SectionLabel>
            <ToneRow>
              {TONE_OPTIONS.map((opt) => {
                const isActive = activeTone === opt.value;
                const isDefault = !activeTone && contentTone === opt.value;
                return (
                  <ToneCard
                    key={opt.value}
                    $active={isActive}
                    $default={isDefault}
                    onClick={() => handleToneSelect(opt.value)}
                    disabled={isBusy}
                    title={opt.description}
                  >
                    <ToneCardTop>
                      <ToneEmoji>{opt.emoji}</ToneEmoji>
                      <ToneLabel>{opt.label}</ToneLabel>
                      {isDefault && !isActive && (
                        <DefaultBadge>default</DefaultBadge>
                      )}
                    </ToneCardTop>
                    <ToneSample $active={isActive}>
                      &ldquo;{opt.sampleHeadline}&rdquo;
                    </ToneSample>
                  </ToneCard>
                );
              })}
            </ToneRow>

            {/* Selected tone preview */}
            {toneInfo && (
              <TonePreview>
                <span style={{ marginRight: 8 }}>{toneInfo.emoji}</span>
                <strong style={{ color: "#e5e7eb" }}>{toneInfo.label}</strong>
                <span style={{ color: "#6b7280", marginLeft: 8, fontSize: 12 }}>
                  — {toneInfo.socialStyle}
                </span>
              </TonePreview>
            )}
            {!activeTone && !contentTone && (
              <ToneHint>
                Pick a voice to shape how your cards look and sound. You can
                skip this — the AI will infer tone from your brief.
              </ToneHint>
            )}

            <Divider />

            {/* Templates */}
            <SectionLabel>Quick templates</SectionLabel>
            <TemplateGrid>
              {TEMPLATES[language].map((t) => (
                <TemplateCard
                  key={t.label}
                  $active={activeTemplate === t.label}
                  onClick={() => handleTemplateClick(t.label, t.prompt)}
                  disabled={isBusy}
                  title={t.prompt}
                >
                  <TemplateName>{t.label}</TemplateName>
                  <TemplateDesc>{t.prompt}</TemplateDesc>
                </TemplateCard>
              ))}
            </TemplateGrid>

            <Divider />

            {/* Textarea — the bar's own words */}
            <SectionLabel>Your brief</SectionLabel>
            <Textarea
              placeholder={PLACEHOLDERS[language]}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setActiveTemplate(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              disabled={isBusy}
            />

            {/* Layout hints — before upload so the bar picks the look first */}
            <SubLabel>Card layout (optional)</SubLabel>
            <LayoutRow>
              {LAYOUT_HINTS.map((layout) => (
                <LayoutCard
                  key={layout.template}
                  $active={activeLayout === layout.template}
                  onClick={() =>
                    setActiveLayout(
                      activeLayout === layout.template ? null : layout.template,
                    )
                  }
                >
                  <LayoutThumb $template={layout.template} />
                  <LayoutName>{layout.label}</LayoutName>
                  <LayoutDesc>{layout.desc}</LayoutDesc>
                </LayoutCard>
              ))}
            </LayoutRow>

            {/* Photo / banner — after layout so the image fits the chosen card style */}
            <SubLabel>Photo or background</SubLabel>
            <ImageTabRow>
              <ImageTab
                $active={imageTab === "upload"}
                onClick={() => setImageTab("upload")}
              >
                Upload
              </ImageTab>
              <ImageTab
                $active={imageTab === "ai"}
                onClick={() => setImageTab("ai")}
              >
                ✨ AI Generate
              </ImageTab>
            </ImageTabRow>

            {imageTab === "upload" && (
              <ImageUploader
                value={formState.imageUrl}
                onChange={(url) => onFieldChange("imageUrl", url)}
                contentType={contentType}
                barId={barId}
                dark
              />
            )}

            {imageTab === "ai" && (
              <AIImageGenerator
                barId={barId}
                contentType={contentType}
                barName={barName}
                formTitle={formState.title}
                formDescription={formState.description}
                formPromotionType={formState.promotionType}
                onSelect={(url) => onFieldChange("imageUrl", url)}
                dark
              />
            )}

            {/* Controls row */}
            <ControlsRow>
              <FormatNote>
                Social cards generated in all 3 formats: Instagram (1:1),
                Facebook (1.91:1), Cover (3:1)
              </FormatNote>

              <GenerateButton
                onClick={handleGenerate}
                disabled={isBusy || !text.trim()}
              >
                {isBusy ? (
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Spinner /> {GENERATING_MESSAGES[language]}
                  </span>
                ) : (
                  "Generate 3 options"
                )}
              </GenerateButton>
            </ControlsRow>

            <HintRow>
              <HintKey>⌘+Enter</HintKey>
              <HintText> to generate</HintText>
              {activeTemplate && (
                <span style={{ marginLeft: 8, fontSize: 11, color: "#a78bfa" }}>
                  — using &ldquo;{activeTemplate}&rdquo; template
                </span>
              )}
            </HintRow>

            {error && <ErrorBox>{error}</ErrorBox>}
            <BackLink onClick={goBack}>← Change type</BackLink>
          </div>
        )}

        {/* ===== STEP 3: VARIANTS ===== */}
        {step === "variants" && variants.length > 0 && (
          <div>
            <BriefRecap>
              <BriefLabel>Brief:</BriefLabel> {text}
              {toneInfo && (
                <span style={{ color: "#a78bfa", marginLeft: 8 }}>
                  {toneInfo.emoji} {toneInfo.label}
                </span>
              )}
            </BriefRecap>

            <VariantPicker
              variants={variants}
              barName={barName}
              barCoverImage={barCoverImage}
              sharedBgImage={sharedBgImage}
              cardFormat="wide"
              onSelect={handleVariantSelect}
            />

            <BackLink onClick={goBack}>← Back to brief</BackLink>
          </div>
        )}

        {/* ===== STEP 4: REVIEW ===== */}
        {step === "review" && (
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

            {toneInfo && (
              <ToneTag>
                {toneInfo.emoji} Generated with {toneInfo.label.toLowerCase()}{" "}
                voice
              </ToneTag>
            )}

            <SubmitRow>
              <BackLink onClick={goBack} style={{ marginBottom: 0 }}>
                ← Back to options
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

// ---- Styled Components ----

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
  padding: 16px 20px 0;
`;

const ProgressStep = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  &:last-child {
    flex: 0;
  }
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
  margin: 0 8px;
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

const SubLabel = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
  margin-top: 12px;
`;

const ImageTabRow = styled.div`
  display: flex;
  gap: 0;
  margin-bottom: 12px;
  border-bottom: 2px solid #2d2d4a;
`;

const ImageTab = styled.button<{ $active: boolean }>`
  padding: 8px 16px;
  font-size: 12px;
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  color: ${({ $active }) => ($active ? "#a78bfa" : "#6b7280")};
  background: none;
  border: none;
  border-bottom: 2px solid
    ${({ $active }) => ($active ? "#a78bfa" : "transparent")};
  margin-bottom: -2px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    color: #a78bfa;
  }
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

// ---- Step 2: Tone ----

const ToneRow = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const ToneCard = styled.button<{ $active: boolean; $default: boolean }>`
  flex: 1 1 100px;
  min-width: 95px;
  max-width: 140px;
  padding: 8px 10px;
  border: 1px solid
    ${({ $active, $default }) =>
      $active ? "#7c3aed" : $default ? "#4c1d95" : "#2d2d4a"};
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
  &:hover {
    border-color: #7c3aed;
  }
`;

const ToneCardTop = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
`;
const ToneEmoji = styled.span`
  font-size: 14px;
  line-height: 1;
`;
const ToneLabel = styled.span`
  font-size: 10px;
  font-weight: 700;
  color: #d1d5db;
  line-height: 1.2;
`;
const DefaultBadge = styled.span`
  font-size: 8px;
  color: #7c3aed;
  font-weight: 600;
  background: rgba(124, 58, 237, 0.15);
  padding: 1px 4px;
  border-radius: 3px;
  margin-left: auto;
`;

const ToneSample = styled.span<{ $active: boolean }>`
  font-size: 9px;
  color: ${({ $active }) => ($active ? "#a78bfa" : "#6b7280")};
  font-style: italic;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const TonePreview = styled.div`
  margin-top: 10px;
  padding: 8px 12px;
  background: rgba(124, 58, 237, 0.08);
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  font-size: 12px;
`;

const ToneHint = styled.div`
  margin-top: 8px;
  font-size: 11px;
  color: #4b5563;
  line-height: 1.5;
  font-style: italic;
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
  &:hover {
    border-color: #7c3aed;
  }
`;

const TemplateName = styled.span`
  font-size: 12px;
  font-weight: 700;
  color: #d1d5db;
  line-height: 1.2;
`;
const TemplateDesc = styled.span`
  font-size: 10px;
  color: #6b7280;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

// ---- Textarea ----

const Textarea = styled.textarea`
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #2d2d4a;
  border-radius: 10px;
  font-size: 14px;
  min-height: 90px;
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

// ---- Layout hints ----

const LayoutRow = styled.div`
  display: flex;
  gap: 8px;
`;

const LayoutCard = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 10px;
  border: 1px solid ${({ $active }) => ($active ? "#7c3aed" : "#2d2d4a")};
  border-radius: 8px;
  background: ${({ $active }) =>
    $active ? "rgba(124, 58, 237, 0.1)" : "#0d0d1a"};
  cursor: pointer;
  text-align: center;
  transition: all 0.15s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  &:hover {
    border-color: #7c3aed;
  }
`;

const LayoutThumb = styled.div<{ $template: string }>`
  width: 60px;
  height: ${({ $template }) => ($template === "card" ? "60px" : "34px")};
  border-radius: 4px;
  background: ${({ $template }) =>
    $template === "split"
      ? "linear-gradient(90deg, #3b82f6 40%, #1e293b 40%)"
      : $template === "centered"
        ? "linear-gradient(135deg, #8b5cf6, #1e293b)"
        : "linear-gradient(180deg, #ef4444 45%, #1e293b 45%)"};
`;

const LayoutName = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: #d1d5db;
`;
const LayoutDesc = styled.span`
  font-size: 9px;
  color: #6b7280;
  line-height: 1.3;
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
const FormatNote = styled.span`
  font-size: 10px;
  color: #6b7280;
  font-style: italic;
  flex: 1;
  text-align: center;
  padding-bottom: 4px;
`;

const LangHint = styled.span<{ $visible: boolean }>`
  font-size: 10px;
  color: #a78bfa;
  font-weight: 500;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.2s;
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
  margin-left: auto;
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

// ---- Variants ----

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

// ---- Step 4: Review ----

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

const ToneTag = styled.div`
  font-size: 11px;
  color: #a78bfa;
  padding: 6px 10px;
  background: rgba(124, 58, 237, 0.1);
  border-radius: 6px;
  font-weight: 500;
`;

const SubmitRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid #2d2d4a;
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
