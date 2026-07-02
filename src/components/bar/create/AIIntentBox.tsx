"use client";

import { useState, useCallback } from "react";
import VariantPicker, { type PromotionVariant } from "./VariantPicker";

// ---- Types ----

interface AIIntentBoxProps {
  barId: string;
  barName?: string;
  barCoverImage?: string | null;
  onGenerated: (data: Record<string, unknown>) => void;
  disabled?: boolean;
}

type Language = "fi" | "en" | "sv";
type Step = "brief" | "generating" | "variants";

// ---- Quick templates (compliance-safe, same as before) ----

const TEMPLATES = [
  { emoji: "🕐", label: "After-Work", prompt: "After-work evening — great music, relaxed atmosphere, and the perfect place to unwind after the office. Weekday afternoons 16:00–19:00. Focus on the vibe." },
  { emoji: "💃", label: "Ladies Night", prompt: "Ladies Night — exclusive evening for women, Friday or Saturday. Welcoming atmosphere with great music, service, and company. No price mentions or special offers." },
  { emoji: "🎸", label: "Live Music", prompt: "Live music performance — band or DJ, evening event. Describe the experience, atmosphere, date and time." },
  { emoji: "🎮", label: "Game Night", prompt: "Quiz or bingo night — entry included, competitive team atmosphere, weekday evening. Focus on fun and social experience. No prizes or giveaways linked to purchases." },
  { emoji: "🍕", label: "Food Special", prompt: "Food special — featured menu items or combo selections, weekday evenings. Focus on food quality and pairing suggestions. Food promos have no alcohol advertising restrictions." },
  { emoji: "⭐", label: "VIP Experience", prompt: "Premium experience — priority entry, reserved seating, exclusive area access. Describe the elevated service and atmosphere." },
  { emoji: "✨", label: "Signature Evening", prompt: "Signature evening — our team's top recommendations for the night. Focus on craftsmanship, unique flavours, and the bar's character. No price mentions, discounts, or brand names." },
  { emoji: "🎭", label: "Theme Night", prompt: "Theme night — karaoke, 80s retro, sports screening. Describe the theme and entertainment. Focus on the experience." },
] as const;

const PLACEHOLDERS: Record<Language, string> = {
  fi: "Kuvaile mitä haluat luoda — esim. \"Perjantain after-work, klo 16–19, rento tunnelma ja hyvää musiikkia\"",
  en: "Describe what you want — e.g. \"Friday after-work, 16:00–19:00, relaxed atmosphere with great music\"",
  sv: "Beskriv vad du vill skapa — t.ex. \"Fredags after-work, 16:00–19:00, avslappnad atmosfär med bra musik\"",
};

const GENERATING_MESSAGES: Record<Language, string> = {
  fi: "Tekoälymme luo vaihtoehtoja...",
  en: "Our AI is crafting your options...",
  sv: "Vår AI skapar dina alternativ...",
};

// ---- Component ----

export default function AIIntentBox({
  barId,
  barName = "Your Bar",
  barCoverImage,
  onGenerated,
  disabled,
}: AIIntentBoxProps) {
  // Core state
  const [text, setText] = useState("");
  const [step, setStep] = useState<Step>("brief");
  const [error, setError] = useState<string | null>(null);

  // Controls
  const [language, setLanguage] = useState<Language>("fi");
  const [numVariants, setNumVariants] = useState(3);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  // Variant state
  const [variants, setVariants] = useState<PromotionVariant[]>([]);
  const [inferredType, setInferredType] = useState<string>("promotion");

  const token = typeof window !== "undefined" ? localStorage.getItem("hoppr_token") : null;

  // ---- Two-step generation ----

  const handleGenerate = useCallback(
    async (promptText?: string, overrideVariants?: number) => {
      const input = (promptText ?? text).trim();
      if (!input || !token) return;

      const variantCount = overrideVariants ?? numVariants;

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
          body: JSON.stringify({ text: input, language }),
        });

        if (!suggestRes.ok) {
          const data = await suggestRes.json();
          throw new Error(data.error || "Type inference failed");
        }

        const suggestData = await suggestRes.json();
        const type = (suggestData.inferredType as string) || "promotion";
        setInferredType(type);

        // Step 2: Always call ai-generate for promotions to get visual params
        // (template, mood, accentColor) that differentiate cards in the app.
        // Also run when user explicitly requested multiple variants regardless of type.
        if (type === "promotion" || variantCount > 1) {
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
        onGenerated(suggestData);
        setStep("brief");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate. Try again.");
        setStep("brief");
      }
    },
    [text, token, barId, language, numVariants, onGenerated],
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
        visual: {
          ...(variant.visual || {}),
          accentColor: variant.accentColor,
        },
      };
      setStep("brief");
      setVariants([]);
      onGenerated(data);
    },
    [inferredType, variants.length, onGenerated],
  );

  const handleRegenerate = useCallback(() => {
    setStep("generating");
    setError(null);
    setVariants([]);
    // Re-run generation with the same text + same variant count
    handleGenerate(text, numVariants);
  }, [text, numVariants, handleGenerate]);

  // ---- Template click → auto-generate single variant ----

  const handleTemplateClick = (label: string, prompt: string) => {
    setText(prompt);
    setActiveTemplate(label);
    // Templates produce 1 variant by default (quick path) — pass override to avoid closure race
    handleGenerate(prompt, 1);
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

      {/* Brief: textarea + controls + templates (shown during 'brief' step) */}
      {(step === "brief" || step === "generating") && (
        <>
          <textarea
            style={{
              ...styles.textarea,
              ...(isBusy ? styles.textareaDisabled : {}),
            }}
            placeholder={PLACEHOLDERS[language]}
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
                  ["fi", "FI"],
                  ["en", "EN"],
                  ["sv", "SV"],
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
              <span style={styles.controlLabel}>Options</span>
              <div style={styles.pillGroup}>
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    style={{
                      ...styles.pill,
                      ...(numVariants === n ? styles.pillActive : {}),
                    }}
                    onClick={() => setNumVariants(n)}
                    disabled={isBusy}
                  >
                    {n}
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

          {/* Quick templates */}
          <div style={styles.templateLabel}>Quick templates — click to generate</div>
          <div style={styles.templateRow}>
            {TEMPLATES.map((t) => (
              <button
                key={t.label}
                style={{
                  ...styles.templateChip,
                  ...(activeTemplate === t.label ? styles.templateChipActive : {}),
                }}
                onClick={() => handleTemplateClick(t.label, t.prompt)}
                disabled={isBusy}
                title={t.prompt}
              >
                {t.emoji} {t.label}
              </button>
            ))}
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
  templateLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: "#4b5563",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    marginTop: 14,
    marginBottom: 6,
  },
  templateRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 6,
  },
  templateChip: {
    padding: "6px 12px",
    border: "1px solid #2d2d4a",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    background: "#0d0d1a",
    color: "#9ca3af",
    transition: "all 0.15s",
    whiteSpace: "nowrap" as const,
  },
  templateChipActive: {
    borderColor: "#7c3aed",
    background: "rgba(124, 58, 237, 0.15)",
    color: "#a78bfa",
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
