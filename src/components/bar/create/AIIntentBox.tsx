"use client";

import { useState, useCallback } from "react";
import VariantPicker, { type PromotionVariant } from "./VariantPicker";
import type { ContentTone } from "./ToneSelector";
import { TONE_OPTIONS } from "./ToneSelector";

// ---- Types ----

interface AIIntentBoxProps {
  barId: string;
  barName?: string;
  barCoverImage?: string | null;
  onGenerated: (data: Record<string, unknown>) => void;
  disabled?: boolean;
  contentTone?: ContentTone | null;
  onToneChange?: (tone: ContentTone | null) => void;
  onFormatChange?: (format: CardFormat) => void;
}

type Language = "fi" | "en";
type Step = "brief" | "generating" | "variants";
type CardFormat = "square" | "wide" | "banner";
type ContentType = "promotion" | "event" | "pass" | "campaign" | "brand";

const CONTENT_TYPES: { value: ContentType; label: string; emoji: string }[] = [
  { value: "promotion", label: "Promotion", emoji: "🍻" },
  { value: "event", label: "Event", emoji: "🎵" },
  { value: "pass", label: "VIP Pass", emoji: "✨" },
];

const FORMAT_OPTIONS: { value: CardFormat; label: string; dims: string; hint: string }[] = [
  { value: "square", label: "Instagram Post", dims: "1:1", hint: "Feed post — square cards, stories, carousels" },
  { value: "wide", label: "Facebook Post", dims: "1.91:1", hint: "Link shares, feed posts, event promos" },
  { value: "banner", label: "Cover", dims: "3:1", hint: "Event headers, page covers, wide banners" },
];

// ---- Quick templates (compliance-safe, bilingual) ----

const TEMPLATES: Record<Language, { label: string; prompt: string }[]> = {
  en: [
    { label: "After-Work", prompt: "After-work evening — great music, relaxed atmosphere, and the perfect place to unwind after the office. Weekday afternoons 16:00–19:00. Focus on the vibe." },
    { label: "Ladies Night", prompt: "Ladies Night — exclusive evening for women, Friday or Saturday. Welcoming atmosphere with great music, service, and company. No price mentions or special offers." },
    { label: "Live Music", prompt: "Live music performance — band or DJ, evening event. Describe the experience, atmosphere, date and time." },
    { label: "Game Night", prompt: "Quiz or bingo night — entry included, competitive team atmosphere, weekday evening. Focus on fun and social experience. No prizes or giveaways linked to purchases." },
    { label: "Food Special", prompt: "Food special — featured menu items or combo selections, weekday evenings. Focus on food quality and pairing suggestions. Food promos have no alcohol advertising restrictions." },
    { label: "VIP Experience", prompt: "Premium experience — priority entry, reserved seating, exclusive area access. Describe the elevated service and atmosphere." },
    { label: "Signature Evening", prompt: "Signature evening — our team's top recommendations for the night. Focus on craftsmanship, unique flavours, and the bar's character. No price mentions, discounts, or brand names." },
    { label: "Theme Night", prompt: "Theme night — karaoke, 80s retro, sports screening. Describe the theme and entertainment. Focus on the experience." },
  ],
  fi: [
    { label: "After-Work", prompt: "After-work-ilta — hyvää musiikkia, rento tunnelma ja täydellinen paikka rentoutua toimiston jälkeen. Arki-iltapäivisin klo 16–19. Keskity tunnelmaan." },
    { label: "Naistenilta", prompt: "Naistenilta — naisille suunnattu ilta, perjantai tai lauantai. Viihtyisä tunnelma, hyvää musiikkia, palvelua ja seuraa. Älä mainitse hintoja tai erikoistarjouksia." },
    { label: "Elävä musiikki", prompt: "Live-esiintyminen — bändi tai DJ, iltatapahtuma. Kuvaile elämystä, tunnelmaa, päivämäärää ja kellonaikaa." },
    { label: "Peli-ilta", prompt: "Tietovisa- tai bingoilta — osallistuminen sisältyy, kilpailuhenkinen joukkuetunnelma, arki-ilta. Keskity hauskuuteen ja sosiaaliseen kokemukseen. Ei palkintoja tai lahjoja." },
    { label: "Ruokatarjous", prompt: "Ruokatarjous — suositeltuja annoksia tai yhdistelmiä, arki-iltaisin. Keskity ruoan laatuun ja yhdistelyvinkkeihin. Ruokatarjouksilla ei ole alkoholimainonnan rajoituksia." },
    { label: "VIP-kokemus", prompt: "Premium-kokemus — etuoikeutettu sisäänpääsy, varattu istumapaikka, pääsy eksklusiiviselle alueelle. Kuvaile parempaa palvelua ja tunnelmaa." },
    { label: "Talon suositukset", prompt: "Talon suositukset — tiimimme parhaat suositukset illalle. Keskity käsityötaitoon, ainutlaatuisiin makuihin ja baarin luonteeseen. Ei hintamainintoja, alennuksia tai tuotemerkkejä." },
    { label: "Teemailta", prompt: "Teemailta — karaoke, 80-luvun retro, urheilulähetys. Kuvaile teemaa ja viihdettä. Keskity elämykseen." },
  ],
};

// ---- Event templates (shown when contentType is "event") ----

const EVENT_TEMPLATES: Record<Language, { label: string; prompt: string }[]> = {
  en: [
    { label: "Live Music", prompt: "Live music performance — band or solo act. Describe the artist, genre, date, time. Is there a cover charge? What's the atmosphere like?" },
    { label: "DJ Night", prompt: "DJ set — describe the DJ, music style (house, techno, hip-hop, disco), when the music starts, and the energy. Mention drink specials or door policy if relevant." },
    { label: "Quiz Night", prompt: "Pub quiz or trivia night — what topics? Team size? Prizes? When does it start? Describe the competitive-but-fun atmosphere." },
    { label: "Sports Screening", prompt: "Big game on the screens — what sport? Which teams? Kickoff time? Any food or drink specials during the game?" },
    { label: "Tasting Event", prompt: "Tasting event — whiskey, wine, craft beer, or cocktail masterclass. Who's hosting? What's included? How many spots? What will people learn?" },
    { label: "Theme Night", prompt: "Theme night — 80s retro, tropical luau, masquerade. Describe the theme, dress code, decorations, and themed drinks." },
    { label: "Comedy Night", prompt: "Stand-up comedy — who's performing? Format (showcase, open mic)? When does it start? Entry fee?" },
    { label: "Karaoke Night", prompt: "Karaoke night — song selection, host/MC, drink specials for performers. Everyone is a star tonight." },
  ],
  fi: [
    { label: "Elävä musiikki", prompt: "Live-esiintyminen — bändi tai sooloartisti. Kuvaile esiintyjä, genre, päivämäärä, kellonaika. Onko sisäänpääsymaksua? Millainen tunnelma?" },
    { label: "DJ-ilta", prompt: "DJ-setti — kuvaile DJ, musiikkityyli (house, techno, hip-hop, disco), milloin musiikki alkaa, energiataso. Mainitse juomatarjoukset tai ovikäytäntö." },
    { label: "Tietovisa", prompt: "Pubivisa tai tietovisa — mitä aiheita? Joukkueen koko? Palkinnot? Mihin aikaan alkaa? Kuvaile kilpailuhenkinen mutta hauska tunnelma." },
    { label: "Urheilulähetys", prompt: "Iso peli ruuduilla — mitä lajia? Mitkä joukkueet? Aloitusaika? Onko ruoka- tai juomatarjouksia pelin aikana?" },
    { label: "Maistelutapahtuma", prompt: "Maistelutapahtuma — viski, viini, käsityöolut tai cocktail-mestarikurssi. Kuka isännöi? Mitä sisältyy? Kuinka monta paikkaa? Mitä osallistujat oppivat?" },
    { label: "Teemailta", prompt: "Teemailta — 80-luvun retro, trooppinen luau, naamiaiset. Kuvaile teema, pukukoodi, koristelut ja teemajuomat." },
    { label: "Komediailta", prompt: "Stand-up komediaa — kuka esiintyy? Formaatti (showcase, avoin mikki)? Mihin aikaan alkaa? Sisäänpääsymaksu?" },
    { label: "Karaokeilta", prompt: "Karaokeilta — lauluvalikoima, juontaja, esiintyjien juomatarjoukset. Kaikki ovat tähtiä tänään." },
  ],
};

// ---- Pass templates (shown when contentType is "pass") ----

const PASS_TEMPLATES: Record<Language, { label: string; prompt: string }[]> = {
  en: [
    { label: "Skip the Line", prompt: "Skip-the-line pass — priority entry on busy nights. Walk past the queue, straight to the door. What nights is it valid? Price per person?" },
    { label: "Drink Package", prompt: "Drink package — X number of drinks included for a fixed price. What's the deal? What drinks are included? Valid per night or per person?" },
    { label: "Table Reservation", prompt: "Table reservation — reserved table for your group. How many people? Where in the venue? Dedicated service? What nights?" },
    { label: "Bottle Service", prompt: "Bottle service — premium bottle, mixers, reserved table. What's the bottle selection? Price? How many people does it cover?" },
    { label: "Cover + Perk", prompt: "Cover charge included + extra perk (welcome drink, cloakroom, first round). Entry sorted and something extra. What's the total value?" },
    { label: "Group Package", prompt: "Group package — all-in-one for a group night out. Entry, drinks, table all sorted. What's included per person? Group size? Price?" },
  ],
  fi: [
    { label: "Jononohitus", prompt: "Jononohituspassi — etuoikeutettu sisäänpääsy kiireisinä iltoina. Kävele jonon ohi, suoraan ovelle. Minä iltoina voimassa? Hinta per henkilö?" },
    { label: "Juomapaketti", prompt: "Juomapaketti — X juomaa kiinteään hintaan. Mikä on diili? Mitä juomia sisältyy? Voimassa per ilta vai per henkilö?" },
    { label: "Pöytävaraus", prompt: "Pöytävaraus — varattu pöytä ryhmällesi. Kuinka monelle? Missä kohtaa? Oma palvelu? Minä iltoina?" },
    { label: "Pullopalvelu", prompt: "Pullopalvelu — premium-pullo, mikserit, varattu pöytä. Mikä on pullovalikoima? Hinta? Kuinka monelle?" },
    { label: "Sisäänpääsy + etu", prompt: "Sisäänpääsymaksu sisältyy + lisäetu (tervetuliaismalja, narikka, ensimmäinen kierros). Sisäänpääsy hoidettu ja jotain extraa. Mikä on kokonaisarvo?" },
    { label: "Ryhmäpaketti", prompt: "Ryhmäpaketti — all-in-one illanviettoon. Sisäänpääsy, juomat, pöytä kaikki hoidettu. Mitä sisältyy per henkilö? Ryhmän koko? Hinta?" },
  ],
};

const PLACEHOLDERS: Record<ContentType, Record<Language, string>> = {
  promotion: {
    fi: "Kuvaile mitä haluat luoda — esim. \"Perjantain after-work, klo 16–19, rento tunnelma ja hyvää musiikkia\"",
    en: "Describe what you want — e.g. \"Friday after-work, 16:00–19:00, relaxed atmosphere with great music\"",
  },
  event: {
    fi: "Kuvaile tapahtuma — esim. \"Live jazz trio lauantaina, klo 20, ilmainen sisäänpääsy, cocktail-tarjouksia\"",
    en: "Describe your event — e.g. \"Live jazz trio this Saturday, 8pm, free entry, cocktail specials\"",
  },
  pass: {
    fi: "Kuvaile VIP-passi — esim. \"Jononohitus lauantaisin, 10 € per henkilö, sisältää etuoikeutetun sisäänpääsyn\"",
    en: "Describe your VIP pass — e.g. \"Skip-the-line on Saturdays, €10 per person, priority entry included\"",
  },
  campaign: {
    fi: "Kuvaile mainoskampanja — esim. \"Näkyvyyttä baarille keskustan alueella, kohderyhmänä 25–35-vuotiaat\"",
    en: "Describe your ad campaign — e.g. \"Visibility for the bar in the city center, targeting 25–35 year olds\"",
  },
  brand: {
    fi: "Kuvaile brändiäsi — esim. \"Kallion sydämessä, rento ja kotoisa karaokebaari jossa jokainen on tervetullut\"",
    en: "Describe your brand — e.g. \"In the heart of Kallio, a relaxed and welcoming karaoke bar where everyone belongs\"",
  },
};

const GENERATING_MESSAGES: Record<Language, string> = {
  fi: "Tekoälymme luo vaihtoehtoja...",
  en: "Our AI is crafting your options...",
};

// ---- Component ----

export default function AIIntentBox({
  barId,
  barName = "Your Bar",
  barCoverImage,
  onGenerated,
  disabled,
  contentTone,
  onToneChange,
  onFormatChange,
}: AIIntentBoxProps) {
  // Core state
  const [text, setText] = useState("");
  const [step, setStep] = useState<Step>("brief");
  const [error, setError] = useState<string | null>(null);

  // Controls
  const [language, setLanguage] = useState<Language>("en");
  const [cardFormat, setCardFormat] = useState<CardFormat>("wide");
  const [contentType, setContentType] = useState<ContentType>("promotion");
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  // Tone state — starts from bar profile default, overridable per creation
  const [activeTone, setActiveTone] = useState<ContentTone | null>(contentTone ?? null);

  // Variant state
  const [variants, setVariants] = useState<PromotionVariant[]>([]);
  const [inferredType, setInferredType] = useState<string>("promotion");

  // Active templates based on contentType
  const activeTemplates =
    contentType === "event"
      ? EVENT_TEMPLATES[language]
      : contentType === "pass"
        ? PASS_TEMPLATES[language]
        : TEMPLATES[language];

  const token = typeof window !== "undefined" ? localStorage.getItem("hoppr_token") : null;

  const handleToneSelect = (tone: ContentTone) => {
    const newTone = activeTone === tone ? null : tone;
    setActiveTone(newTone);
    onToneChange?.(newTone);
  };

  // ---- Two-step generation ----

  const handleGenerate = useCallback(
    async (promptText?: string) => {
      const input = (promptText ?? text).trim();
      if (!input || !token) return;

      const variantCount = 3; // always generate 3 variants

      setStep("generating");
      setError(null);
      setVariants([]);

      try {
        // Step 1: Infer content type from the user's description
        const suggestRes = await fetch(`/api/auth/bar/${barId}/create/suggest`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: input, language, contentType, contentTone: activeTone }),
        });

        if (!suggestRes.ok) {
          const data = await suggestRes.json();
          throw new Error(data.error || "Type inference failed");
        }

        const suggestData = await suggestRes.json();
        const type = (suggestData.inferredType as string) || "promotion";
        setInferredType(type);

        // Step 2: For promotions, call ai-generate to get visual params
        // (template, mood, accentColor) and multiple variants.
        // Events and passes get their content directly from the suggest step.
        if (type === "promotion") {
          const requestCount = Math.max(variantCount, 1);
          const genRes = await fetch(`/api/auth/bar/${barId}/promotions/ai-generate`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              prompt: input,
              type,
              language,
              numVariants: requestCount,
              contentTone: activeTone,
            }),
          });

          if (!genRes.ok) {
            const data = await genRes.json();
            throw new Error(data.error || "Variant generation failed");
          }

          const genData = await genRes.json();

          if (genData.variants && Array.isArray(genData.variants)) {
            const vars = genData.variants as PromotionVariant[];
            setVariants(vars);
            setStep("variants");
            // Seed the side preview with the first variant immediately.
            // _previewOnly: true prevents the parent from switching the content type
            // (the user hasn't selected this variant yet — they're just browsing options).
            const first = vars[0];
            onGenerated({
              ...suggestData,
              _previewOnly: true,
              cardFormat,
              title: first.title,
              description: first.description,
              promotionType: first.type,
              discountValue: first.discount,
              conditions: first.conditions,
              callToAction: first.callToAction,
              visual: {
                ...(first.visual || {}),
                accentColor: first.accentColor,
              },
            });
            return;
          }

          // Fallback: single promotion returned
          const single = genData.promotion as PromotionVariant;
          if (single) {
            onGenerated({
              ...suggestData,
              cardFormat,
              title: single.title,
              description: single.description,
              promotionType: single.type,
              discountValue: single.discount,
              conditions: single.conditions,
              callToAction: single.callToAction,
              accentColor: single.accentColor,
              visual: single.visual,
            });
            setStep("brief");
            return;
          }
        }

        // Single variant or non-promotion type — populate form directly
        onGenerated({ ...suggestData, cardFormat });
        setStep("brief");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate. Try again.");
        setStep("brief");
      }
    },
    [text, token, barId, language, cardFormat, contentType, activeTone, onGenerated],
  );

  // ---- Variant selection ----

  const handleVariantSelect = useCallback(
    (variant: PromotionVariant) => {
      const data: Record<string, unknown> = {
        inferredType,
        aiGenerated: true,
        confidence: 0.85,
        title: variant.title,
        description: variant.description,
        reasoning: `Selected from ${variants.length} AI-generated options. ${variant.visual ? `Uses ${variant.visual.template} template with ${variant.visual.mood} mood.` : ""}`,
        imageSuggestion: "bar-ambience",
        promotionType: variant.type,
        discountValue: variant.discount,
        conditions: variant.conditions,
        targetAudience: "EVERYONE",
        cardFormat,
        visual: {
          ...(variant.visual || {}),
          accentColor: variant.accentColor,
        },
      };
      setStep("brief");
      setVariants([]);
      onGenerated(data);
    },
    [inferredType, contentType, variants.length, cardFormat, onGenerated],
  );

  const handleRegenerate = useCallback(() => {
    setStep("generating");
    setError(null);
    setVariants([]);
    handleGenerate(text);
  }, [text, handleGenerate]);

  // ---- Template click → fill textarea for review (Step 2 → Step 3) ----

  const handleTemplateClick = (label: string, prompt: string) => {
    setText(prompt);
    setActiveTemplate(label);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const isBusy = step === "generating" || disabled;

  // ---- Render ----

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerIcon}>✦</span>
          <span style={styles.headerTitle}>Creative Brief</span>
        </div>
        <span style={styles.headerBadge}>AI-powered</span>
      </div>

      {/* Content type selector — what are we creating? */}
      {(step === "brief" || step === "generating") && (
        <div style={styles.contentTypeRow}>
          {CONTENT_TYPES.map((ct) => {
            const isActive = contentType === ct.value;
            return (
              <button
                key={ct.value}
                type="button"
                style={{
                  ...styles.contentTypePill,
                  ...(isActive ? styles.contentTypePillActive : {}),
                }}
                onClick={() => {
                  setContentType(ct.value);
                  setActiveTemplate(null);
                  setText("");
                }}
                disabled={isBusy}
              >
                <span style={styles.contentTypeEmoji}>{ct.emoji}</span>
                {ct.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Brief: textarea + controls + templates (shown during 'brief' step) */}
      {(step === "brief" || step === "generating") && (
        <>
          {/* ---- Step 1: Pick your voice ---- */}
          <div style={styles.toneSection}>
            <div style={styles.stepLabel}>1. Pick your voice</div>
            <div style={styles.toneRow}>
              {TONE_OPTIONS.map((opt) => {
                const isActive = activeTone === opt.value;
                const isDefault = !activeTone && contentTone === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    style={{
                      ...styles.toneCard,
                      ...(isActive ? styles.toneCardActive : {}),
                      ...(isDefault ? styles.toneCardDefault : {}),
                    }}
                    onClick={() => handleToneSelect(opt.value)}
                    disabled={isBusy}
                    title={opt.description}
                  >
                    <span style={styles.toneCardTop}>
                      <span style={styles.toneCardLabel}>{opt.label}</span>
                      {isDefault && !isActive && (
                        <span style={styles.toneCardDefaultBadge}>default</span>
                      )}
                    </span>
                    <span style={{
                      ...styles.toneCardSample,
                      ...(isActive ? styles.toneCardSampleActive : {}),
                    }}>
                      &ldquo;{opt.sampleHeadline}&rdquo;
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected tone live preview */}
            {activeTone && (() => {
              const selected = TONE_OPTIONS.find((o) => o.value === activeTone);
              if (!selected) return null;
              return (
                <div style={styles.tonePreview}>
                  <div style={styles.tonePreviewRow}>
                    <span style={styles.tonePreviewLabel}>{selected.label}</span>
                  </div>
                  <div style={styles.tonePreviewHeadline}>
                    &ldquo;{selected.sampleHeadline}&rdquo;
                  </div>
                  <div style={styles.tonePreviewBody}>
                    &ldquo;{selected.sampleBody}&rdquo;
                  </div>
                  <div style={styles.tonePreviewStyle}>
                    <span style={styles.tonePreviewStyleLabel}>Visual style:</span> {selected.socialStyle}
                  </div>
                </div>
              );
            })()}
            {!activeTone && !contentTone && (
              <div style={styles.toneHint}>
                Choose a voice style above — this shapes how your AI-generated cards look and sound on social media. You can change it anytime, even per creation.
              </div>
            )}
          </div>

          <div style={styles.stepDivider} />

          {/* ---- Step 2: Pick a starting point ---- */}
          <div style={styles.stepLabel}>2. Pick a starting point</div>
          <div style={styles.templateGrid}>
            {activeTemplates.map((t) => (
              <button
                key={t.label}
                style={{
                  ...styles.templateCard,
                  ...(activeTemplate === t.label ? styles.templateCardActive : {}),
                }}
                onClick={() => handleTemplateClick(t.label, t.prompt)}
                disabled={isBusy}
                title={t.prompt}
              >
                <span style={styles.templateCardLabel}>{t.label}</span>
                <span style={styles.templateCardDesc}>{t.prompt}</span>
              </button>
            ))}
          </div>

          <div style={styles.stepDivider} />

          {/* ---- Step 3: Review & customize ---- */}
          <div style={styles.stepLabel}>3. Review &amp; customize</div>

          <textarea
            style={{
              ...styles.textarea,
              ...(isBusy ? styles.textareaDisabled : {}),
            }}
            placeholder={PLACEHOLDERS[contentType][language]}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setActiveTemplate(null);
            }}
            onKeyDown={handleKeyDown}
            disabled={isBusy}
          />

          {/* Controls row: language + variants + generate */}
          <div style={styles.controls}>
            <div style={styles.controlGroup}>
              <span style={styles.controlLabel}>Language</span>
              <div style={styles.pillGroup}>
                {([
                  ["en", "EN"],
                  ["fi", "FI"],
                ] as const).map(([lang, label]) => (
                  <button
                    key={lang}
                    style={{
                      ...styles.pill,
                      ...(language === lang ? styles.pillActive : {}),
                    }}
                    onClick={() => setLanguage(lang)}
                    disabled={isBusy}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.controlGroup}>
              <span style={styles.controlLabel}>Format</span>
              <div style={styles.pillGroup}>
                {FORMAT_OPTIONS.map((fmt) => (
                  <button
                    key={fmt.value}
                    style={{
                      ...styles.pill,
                      ...(cardFormat === fmt.value ? styles.pillActive : {}),
                    }}
                    onClick={() => {
                      setCardFormat(fmt.value);
                      onFormatChange?.(fmt.value);
                    }}
                    disabled={isBusy}
                    title={`${fmt.dims} — ${fmt.hint}`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              style={{
                ...styles.generateButton,
                ...(isBusy || !text.trim() ? styles.generateButtonDisabled : {}),
              }}
              onClick={() => handleGenerate()}
              disabled={isBusy || !text.trim()}
            >
              {isBusy ? (
                <span style={styles.generateLoading}>
                  <span style={styles.generateSpinner} />
                  {GENERATING_MESSAGES[language]}
                </span>
              ) : (
                "Generate"
              )}
            </button>
          </div>

          {/* Hint / shortcut */}
          <div style={styles.hint}>
            {isBusy ? (
              <span style={styles.hintLoading}>
                {GENERATING_MESSAGES[language]}
              </span>
            ) : (
              <>
                <span style={styles.hintKey}>⌘+Enter</span>
                <span style={styles.hintText}> to generate</span>
              </>
            )}
          </div>
        </>
      )}

      {/* Variant picker (shown during 'variants' step) */}
      {step === "variants" && variants.length > 0 && (
        <>
          {/* Show the prompt text that generated these */}
          <div style={styles.briefRecap}>
            <span style={styles.briefRecapLabel}>Brief:</span> {text}
          </div>

          <VariantPicker
            variants={variants}
            barName={barName}
            barCoverImage={barCoverImage}
            cardFormat={cardFormat}
            onSelect={handleVariantSelect}
            onRegenerate={handleRegenerate}
          />

          {/* Option to go back to brief */}
          <div style={styles.backLink}>
            <button
              style={styles.backButton}
              onClick={() => {
                setStep("brief");
                setVariants([]);
              }}
            >
              ← Back to brief
            </button>
          </div>
        </>
      )}

      {/* Loading state for initial generation (when we haven't gotten variants yet) */}
      {step === "generating" && !isBusy && (
        <div style={styles.generatingState}>
          <div style={styles.generatingPulse} />
          <div style={styles.generatingText}>{GENERATING_MESSAGES[language]}</div>
        </div>
      )}

      {/* Error */}
      {error && <div style={styles.error}>{error}</div>}
    </div>
  );
}

// ---- Styles ----

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: "linear-gradient(135deg, #1a1a2e 0%, #16162a 100%)",
    border: "1px solid #2d2d4a",
    borderRadius: 14,
    padding: "20px 20px 16px",
    marginBottom: 16,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  headerIcon: {
    color: "#a78bfa",
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#f9fafb",
  },
  headerBadge: {
    fontSize: 10,
    background: "rgba(124, 58, 237, 0.2)",
    color: "#a78bfa",
    padding: "3px 10px",
    borderRadius: 10,
    fontWeight: 600,
    letterSpacing: "0.03em",
  },
  // ---- Content type selector ----
  contentTypeRow: {
    display: "flex",
    gap: 4,
    marginBottom: 14,
    background: "#0d0d1a",
    borderRadius: 10,
    padding: 3,
    border: "1px solid #2d2d4a",
  },
  contentTypePill: {
    flex: 1,
    padding: "7px 12px",
    border: "none",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    background: "transparent",
    color: "#6b7280",
    transition: "all 0.15s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  contentTypePillActive: {
    background: "#7c3aed",
    color: "white",
  },
  contentTypeEmoji: {
    fontSize: 14,
    lineHeight: 1,
  },

  // ---- Step labels ----
  stepLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#a78bfa",
    marginBottom: 8,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  stepDivider: {
    height: 1,
    background: "#2d2d4a",
    margin: "16px 0",
  },

  // ---- Tone selector (Step 1: Pick your voice) ----
  toneSection: {
    marginBottom: 4,
  },
  toneRow: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap" as const,
  },
  toneCard: {
    flex: "1 1 100px",
    minWidth: 95,
    maxWidth: 140,
    padding: "8px 10px",
    border: "1px solid #2d2d4a",
    borderRadius: 8,
    background: "#0d0d1a",
    cursor: "pointer",
    textAlign: "left" as const,
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
    transition: "all 0.15s",
  },
  toneCardActive: {
    borderColor: "#7c3aed",
    background: "rgba(124, 58, 237, 0.12)",
    boxShadow: "0 0 0 1px rgba(124, 58, 237, 0.3)",
  },
  toneCardDefault: {
    borderColor: "#4c1d95",
    background: "rgba(124, 58, 237, 0.06)",
  },
  toneCardTop: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  toneCardEmoji: {
    fontSize: 14,
    lineHeight: 1,
  },
  toneCardLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "#d1d5db",
    lineHeight: 1.2,
  },
  toneCardDefaultBadge: {
    fontSize: 8,
    color: "#7c3aed",
    fontWeight: 600,
    background: "rgba(124, 58, 237, 0.15)",
    padding: "1px 4px",
    borderRadius: 3,
    marginLeft: "auto",
  },
  toneCardSample: {
    fontSize: 9,
    color: "#6b7280",
    fontStyle: "italic" as const,
    lineHeight: 1.3,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
  },
  toneCardSampleActive: {
    color: "#a78bfa",
  },

  // Selected tone preview
  tonePreview: {
    marginTop: 10,
    padding: "10px 12px",
    background: "rgba(124, 58, 237, 0.08)",
    border: "1px solid rgba(124, 58, 237, 0.2)",
    borderRadius: 8,
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
  },
  tonePreviewRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  tonePreviewEmoji: {
    fontSize: 16,
  },
  tonePreviewLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#e5e7eb",
  },
  tonePreviewHeadline: {
    fontSize: 12,
    fontWeight: 600,
    color: "#c4b5fd",
    fontStyle: "italic" as const,
    lineHeight: 1.4,
  },
  tonePreviewBody: {
    fontSize: 11,
    color: "#9ca3af",
    fontStyle: "italic" as const,
    lineHeight: 1.4,
  },
  tonePreviewStyle: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 2,
  },
  tonePreviewStyleLabel: {
    fontWeight: 600,
    color: "#8b5cf6",
  },
  toneHint: {
    marginTop: 10,
    fontSize: 11,
    color: "#4b5563",
    lineHeight: 1.5,
    fontStyle: "italic" as const,
  },

  textarea: {
    width: "100%",
    padding: "14px 16px",
    border: "1px solid #2d2d4a",
    borderRadius: 10,
    fontSize: 14,
    minHeight: 90,
    resize: "vertical" as const,
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
    lineHeight: 1.55,
    background: "#0d0d1a",
    color: "#e5e7eb",
    transition: "border-color 0.2s",
  },
  textareaDisabled: {
    opacity: 0.6,
  },
  controls: {
    display: "flex",
    alignItems: "flex-end",
    gap: 16,
    marginTop: 12,
    flexWrap: "wrap" as const,
  },
  controlGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
  },
  controlLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  pillGroup: {
    display: "flex",
    gap: 2,
    background: "#0d0d1a",
    borderRadius: 8,
    padding: 2,
    border: "1px solid #2d2d4a",
  },
  pill: {
    padding: "5px 12px",
    border: "none",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    background: "transparent",
    color: "#6b7280",
    transition: "all 0.15s",
  },
  pillActive: {
    background: "#7c3aed",
    color: "white",
  },
  generateButton: {
    padding: "10px 22px",
    background: "#7c3aed",
    color: "white",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
    marginLeft: "auto",
    whiteSpace: "nowrap" as const,
    minWidth: 120,
  },
  generateButtonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  generateLoading: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
  },
  generateSpinner: {
    width: 14,
    height: 14,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid white",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.7s linear infinite",
  },
  // ---- Templates (Step 2: Pick a starting point) ----
  templateGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: 6,
  },
  templateCard: {
    padding: "10px 12px",
    border: "1px solid #2d2d4a",
    borderRadius: 8,
    background: "#0d0d1a",
    cursor: "pointer",
    textAlign: "left" as const,
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
    transition: "all 0.15s",
  },
  templateCardActive: {
    borderColor: "#7c3aed",
    background: "rgba(124, 58, 237, 0.12)",
    boxShadow: "0 0 0 1px rgba(124, 58, 237, 0.3)",
  },
  templateCardLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#d1d5db",
    lineHeight: 1.2,
  },
  templateCardDesc: {
    fontSize: 10,
    color: "#6b7280",
    lineHeight: 1.35,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
  },
  hint: {
    marginTop: 10,
    textAlign: "center" as const,
  },
  hintKey: {
    fontSize: 11,
    color: "#4b5563",
    background: "#1a1a2e",
    padding: "1px 6px",
    borderRadius: 3,
    border: "1px solid #2d2d4a",
  },
  hintText: {
    fontSize: 11,
    color: "#4b5563",
  },
  hintLoading: {
    fontSize: 12,
    color: "#a78bfa",
    fontWeight: 500,
  },
  generatingState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "32px 20px",
  },
  generatingPulse: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "rgba(124, 58, 237, 0.2)",
    animation: "pulse 1.5s ease-in-out infinite",
    marginBottom: 14,
  },
  generatingText: {
    fontSize: 14,
    fontWeight: 500,
    color: "#a78bfa",
  },
  briefRecap: {
    fontSize: 12,
    color: "#6b7280",
    padding: "8px 12px",
    background: "#0d0d1a",
    borderRadius: 8,
    marginBottom: 12,
    border: "1px solid #2d2d4a",
    lineHeight: 1.4,
  },
  briefRecapLabel: {
    fontWeight: 600,
    color: "#9ca3af",
  },
  backLink: {
    marginTop: 12,
    textAlign: "center" as const,
  },
  backButton: {
    background: "none",
    border: "none",
    color: "#6b7280",
    fontSize: 12,
    cursor: "pointer",
    fontWeight: 500,
  },
  error: {
    marginTop: 10,
    fontSize: 12,
    color: "#ef4444",
    padding: "8px 12px",
    background: "rgba(239, 68, 68, 0.08)",
    borderRadius: 8,
    border: "1px solid rgba(239, 68, 68, 0.2)",
  },
};
