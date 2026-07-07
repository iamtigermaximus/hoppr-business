import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isBarStaffToken } from "@/lib/auth";
import { prisma } from "@/lib/database";
import { planHasFeature } from "@/lib/plan-limits";
import { buildGeneratePrompt, type PromptLanguage } from "@/lib/compliance/prompts";
import { checkRateLimit, RateLimits } from "@/lib/rate-limiter";
import { inferImageChips } from "@/lib/prompts/infer-image-chips";
import { logUsage } from "@/lib/credit-tracker";
import {
  getFallbackPromotion,
  type PromotionType,
} from "@/lib/ai/fallback-templates";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

const VALID_PROMO_TYPES = [
  "HAPPY_HOUR", "DRINK_SPECIAL", "FOOD_SPECIAL", "LADIES_NIGHT",
  "THEME_NIGHT", "VIP_OFFER", "COVER_DISCOUNT", "LIVE_MUSIC_EVENT", "GAME_NIGHT",
  "SEASONAL",
] as const;

const VALID_TONES = [
  "BOLD_ENERGETIC", "WARM_INVITING", "EDGY_IRREVERENT", "ELEGANT_PREMIUM", "PLAYFUL_FUN",
] as const;
type ContentTone = (typeof VALID_TONES)[number];

/** Visual style presets — cycled per variant so each looks distinct */
const VISUAL_PRESETS = [
  { template: "card" as const, mood: "dark" as const, overlayOpacity: 0.4, accentColor: "#8b5cf6" },
  { template: "split" as const, mood: "warm" as const, overlayOpacity: 0.35, accentColor: "#f59e0b" },
  { template: "centered" as const, mood: "cool" as const, overlayOpacity: 0.45, accentColor: "#3b82f6" },
  { template: "card" as const, mood: "vibrant" as const, overlayOpacity: 0.3, accentColor: "#ef4444" },
  { template: "split" as const, mood: "minimal" as const, overlayOpacity: 0.5, accentColor: "#6b7280" },
];

/** Map tone to compatible preset indices — avoids mismatched styles */
const TONE_PRESET_MAP: Record<ContentTone, number[]> = {
  BOLD_ENERGETIC: [1, 3],        // warm split, vibrant card
  WARM_INVITING: [1, 2],         // warm split, cool centered
  EDGY_IRREVERENT: [0, 4],       // dark card, minimal split
  ELEGANT_PREMIUM: [2, 4],       // cool centered, minimal split
  PLAYFUL_FUN: [3, 1],           // vibrant card, warm split
};

/** Tone-specific system prompt instruction */
function toneSystemInstruction(tone: ContentTone | undefined): string {
  if (!tone) return "";
  switch (tone) {
    case "BOLD_ENERGETIC":
      return "VOICE: Bold & Energetic. Short sentences. Active verbs. Direct CTAs. Use urgency (tonight, now, this weekend). No hedging. No filler words.";
    case "WARM_INVITING":
      return "VOICE: Warm & Inviting. Hospitality-focused. Focus on atmosphere and experience. Use words like: join us, welcome, relaxed, cosy. No aggressive sales language.";
    case "EDGY_IRREVERENT":
      return "VOICE: Edgy & Irreverent. Casual, direct, personality-driven. Short punchy lines. Humor welcome. Avoid corporate language and marketing clichés.";
    case "ELEGANT_PREMIUM":
      return "VOICE: Elegant & Premium. Understated sophistication. No exclamation marks. Use words like: craft, curated, considered, evening. Avoid discount language and slang.";
    case "PLAYFUL_FUN":
      return "VOICE: Playful & Fun. Upbeat, emoji-friendly, energetic. Fun over formal. Use emojis naturally. Avoid corporate language and restraint.";
    default:
      return "";
  }
}

/** Normalize a raw AI-generated promotion object into the standard response shape. */
function normalizePromotion(
  raw: Record<string, unknown>,
  barName: string,
  hasPhoto: boolean,
  index: number = 0,
  tone?: ContentTone | null,
  layoutHint?: string | null,
) {
  // Extract the AI's visual choices — these represent the model's creative intent.
  // Only fall back to presets when the AI didn't provide a value.
  const rawVisual = (raw.visual as Record<string, unknown> | undefined);

  // Use tone-compatible presets when a tone is set, otherwise cycle all presets
  const compatibleIndices = tone ? TONE_PRESET_MAP[tone] ?? [0, 1, 2, 3, 4] : [0, 1, 2, 3, 4];
  const presetIndex = compatibleIndices[index % compatibleIndices.length];
  const preset = VISUAL_PRESETS[presetIndex];

  // When the user explicitly chooses a layout, lock all variants to that template.
  // Otherwise, respect the AI's template choice, then fall back to preset.
  const template = (layoutHint && ["split", "centered", "card"].includes(layoutHint))
    ? layoutHint
    : (typeof rawVisual?.template === "string" && ["split", "centered", "card"].includes(rawVisual.template as string))
      ? (rawVisual.template as "split" | "centered" | "card")
      : preset.template;

  // Respect AI's mood choice, then fall back to preset
  const mood = (typeof rawVisual?.mood === "string" && ["warm", "cool", "vibrant", "dark", "minimal"].includes(rawVisual.mood as string))
    ? (rawVisual.mood as "warm" | "cool" | "vibrant" | "dark" | "minimal")
    : preset.mood;

  return {
    title: raw.title || `${barName} Special`,
    description: raw.description || `Special offer at ${barName}`,
    type: VALID_PROMO_TYPES.includes(raw.type as any)
      ? raw.type
      : "DRINK_SPECIAL",
    discount: typeof raw.discount === "number" ? raw.discount : null,
    callToAction: raw.callToAction || "View Offer",
    accentColor: raw.accentColor || preset.accentColor,
    conditions: raw.conditions || "Valid with valid ID. Terms apply.",
    visual: {
      template,
      photoPreference: hasPhoto ? "use_bar_cover" : "gradient_only",
      mood,
      overlayOpacity: typeof rawVisual?.overlayOpacity === "number"
        ? rawVisual.overlayOpacity as number
        : preset.overlayOpacity,
    },
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
) {
  try {
    // 1. Verify user is authenticated using custom JWT auth
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: No token provided" },
        { status: 401 },
      );
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid token" },
        { status: 401 },
      );
    }

    // Check if user is bar staff
    if (!isBarStaffToken(payload)) {
      return NextResponse.json(
        { error: "Forbidden: Bar staff access required" },
        { status: 403 },
      );
    }

    // 2. Get bar ID from URL
    const { barId } = await params;

    // Verify the staff belongs to this bar
    if (payload.barId !== barId) {
      return NextResponse.json(
        { error: "Forbidden: You don't have access to this bar" },
        { status: 403 },
      );
    }

    // Plan feature gate: only PRO/PREMIUM plans can use AI generation.
    // Skipped in development so the full flow can be tested without plan setup.
    if (process.env.NODE_ENV === "production") {
      const barPlan = await prisma.bar.findUnique({
        where: { id: barId },
        select: { plan: true },
      });
      if (barPlan && !planHasFeature(barPlan.plan, "aiGeneration")) {
        return NextResponse.json(
          { error: "AI generation requires a PRO or PREMIUM plan. Upgrade to access this feature." },
          { status: 402 },
        );
      }
    }

    // Rate limit: 10 AI generations per minute per bar
    const rateCheck = checkRateLimit(`ai-generate:${barId}`, RateLimits.AI);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `AI generation rate limit reached. Retry in ${rateCheck.retryAfter}s.` },
        { status: 429 },
      );
    }

    const body = await request.json();
    const {
      prompt,
      type,
      targetAudience,
      language = "en",
      numVariants = 1,
      contentTone,
      layoutHint,
    } = body as {
      prompt?: string;
      type?: string;
      targetAudience?: string;
      language?: string;
      numVariants?: number;
      contentTone?: string | null;
      layoutHint?: string | null;
    };

    // Validate contentTone
    const tone: ContentTone | undefined = contentTone && VALID_TONES.includes(contentTone as ContentTone)
      ? (contentTone as ContentTone)
      : undefined;

    // Validate language parameter
    const validLanguages: PromptLanguage[] = ["en", "fi"];
    const lang: PromptLanguage = validLanguages.includes(language as PromptLanguage)
      ? (language as PromptLanguage)
      : "en";

    // Validate numVariants — clamp to 1-3
    const variants = Math.max(1, Math.min(3, numVariants || 1));

    // 3. Fetch bar data to personalize the AI prompt
    const bar = await prisma.bar.findUnique({
      where: { id: barId },
      select: {
        name: true,
        type: true,
        district: true,
        cityName: true,
        priceRange: true,
        amenities: true,
        description: true,
        vipEnabled: true,
        coverImage: true,
      },
    });

    if (!bar) {
      return NextResponse.json({ error: "Bar not found" }, { status: 404 });
    }

    // 4. Get recent promotions to avoid repetition
    const recentPromotions = await prisma.barPromotion.findMany({
      where: { barId, isActive: true },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { title: true, type: true },
    });

    // 5. Check if DeepSeek API key is configured — use fallback templates if not
    const useAI = !!DEEPSEEK_API_KEY;

    // 6. Build the AI prompt using the canonical prompt builder
    const userPrompt = buildGeneratePrompt(
      {
        name: bar.name,
        type: bar.type,
        district: bar.district ?? undefined,
        cityName: bar.cityName ?? undefined,
        priceRange: bar.priceRange ?? undefined,
        amenities: bar.amenities ?? undefined,
        description: bar.description ?? undefined,
      },
      recentPromotions.map((p) => p.title),
      prompt || "",
      type || "unique",
      targetAudience || undefined,
      lang,
      variants,
    );

    const isFi = lang === "fi";
    const languageName = isFi ? "Finnish" : "English";
    const toneInstruction = toneSystemInstruction(tone);
    const systemPrompt = isFi
      ? `Olet Suomen baari- ja yöelämän markkinointiasiantuntija.
Tunnet Alkoholilain (1102/2017) ja Valviran ohjeistukset.
Jokainen tuottamasi tarjous on oletusarvoisesti lainmukainen — et koskaan ehdota kiellettyä sanamuotoa.
Luo kiinnostavia, ammattimaisia tarjouksia suomalaisille baareille SUOMEKSI.
KAIKKI teksti TÄYTYY olla suomeksi. Palauta VAIN validi JSON.${toneInstruction ? `\n${toneInstruction}` : ""}`
      : `You are a marketing expert specializing in bar and nightlife promotions in Finland.
You understand Finnish alcohol marketing law (Alkoholilaki 1102/2017) and Valvira guidelines.
Every promotion you write is compliant by default — you never suggest prohibited language.
Create engaging, professional promotions for bars in English.
Return ONLY valid JSON.${toneInstruction ? `\n${toneInstruction}` : ""}`;

    // 7. Try DeepSeek API; fall back to templates on any failure
    let generatedPromotions: Record<string, unknown>[] = [];
    let aiGenerated = false;
    let warning: string | undefined;
    let aiUsage: { promptTokens: number; completionTokens: number } | null = null;

    if (useAI) {
      try {
        const response = await fetch(DEEPSEEK_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.85,
            max_tokens: variants > 1 ? 2000 : 800,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const aiResponse = data.choices[0].message.content;

          // Capture actual token usage for credit tracking
          if (data.usage) {
            aiUsage = {
              promptTokens: data.usage.prompt_tokens || 0,
              completionTokens: data.usage.completion_tokens || 0,
            };
          }

          try {
            // Try parsing as JSON array first (multi-variant), then as single object
            const trimmed = aiResponse.trim();
            if (trimmed.startsWith("[")) {
              const arrayMatch = trimmed.match(/\[[\s\S]*\]/);
              if (arrayMatch) {
                const parsed = JSON.parse(arrayMatch[0]);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  generatedPromotions = parsed;
                  aiGenerated = true;
                }
              }
            }
            if (generatedPromotions.length === 0) {
              const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                generatedPromotions = [parsed];
                aiGenerated = true;
              } else {
                generatedPromotions = [JSON.parse(trimmed)];
                aiGenerated = true;
              }
            }
          } catch {
            warning = "AI response could not be processed. Using template-based generation instead.";
          }
        } else {
          warning = "AI service is temporarily unavailable. Using template-based generation instead.";
        }
      } catch (err) {
        warning = "AI service is temporarily unavailable. Using template-based generation instead.";
      }
    } else {
      warning = "AI service is not configured. Promotions are generated from templates. Set DEEPSEEK_API_KEY to enable AI generation.";
    }

    // Log credit usage for admin monitoring (non-blocking, fire-and-forget)
    if (aiGenerated && aiUsage) {
      logUsage({
        provider: "deepseek",
        endpoint: "chat/completions",
        tokensIn: aiUsage.promptTokens,
        tokensOut: aiUsage.completionTokens,
        barId,
        barName: bar.name,
        metadata: { variants, language: lang },
      }).catch(() => {}); // silently ignore logging failures
    }

    // 8. Use fallback templates if AI didn't produce valid results
    if (generatedPromotions.length === 0) {
      const promoType = VALID_PROMO_TYPES.includes(type as any)
        ? (type as PromotionType)
        : "DRINK_SPECIAL";

      // Generate requested number of variants — visual presets (template/mood/accentColor)
      // cycle per index to give each variant a distinct look without polluting the title.
      for (let i = 0; i < variants; i++) {
        const fallback = getFallbackPromotion(
          {
            name: bar.name,
            type: bar.type,
            cityName: bar.cityName ?? undefined,
            district: bar.district ?? undefined,
          },
          promoType,
          targetAudience || undefined,
        );
        generatedPromotions.push(fallback as unknown as Record<string, unknown>);
      }
    }

    const hasPhoto = !!(bar.coverImage as string | null);

    // Normalize all promotions to standard shape — each gets a distinct visual style,
    // filtered by tone preference when available
    const promotions = generatedPromotions.map((p, i) =>
      normalizePromotion(p, bar.name, hasPhoto, i, tone, layoutHint),
    );

    // Attach inferred image chips to each variant so the client can
    // auto-generate matching images without the user manually picking chips.
    const variantsWithChips = promotions.map((p) => ({
      ...p,
      imageChips: inferImageChips(
        prompt || "",
        {
          name: bar.name,
          type: bar.type,
          description: bar.description ?? undefined,
          district: bar.district ?? undefined,
          priceRange: bar.priceRange ?? undefined,
          amenities: bar.amenities?.join(", ") ?? undefined,
        },
        {
          title: p.title as string,
          description: p.description as string,
          type: p.type as string,
          discount: p.discount as number | null,
        },
      ),
    }));

    // Return variants array for multi-variant, single promotion for backward compat
    return NextResponse.json({
      success: true,
      aiGenerated,
      ...(warning && { warning }),
      language: lang,
      ...(variants > 1
        ? { variants: variantsWithChips }
        : { promotion: variantsWithChips[0] }),
    });
  } catch (error) {
    console.error("AI generation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate promotion",
      },
      { status: 500 },
    );
  }
}
