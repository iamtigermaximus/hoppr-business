import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isBarStaffToken } from "@/lib/auth";
import { prisma } from "@/lib/database";
import { planHasFeature } from "@/lib/plan-limits";
import { buildGeneratePrompt, type PromptLanguage } from "@/lib/compliance/prompts";
import { checkPromptCompliance } from "@/lib/compliance/image-compliance";
import { scanCompliance } from "@/lib/compliance/engine";
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
      return "VOICE: Edgy & Irreverent. Casual, direct, personality-driven. Short punchy lines. Humor welcome. Avoid corporate language and marketing cliches.";
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
    // Pass through the AI's visualDirection so the frontend can build Flux prompts from it
    visualDirection: raw.visualDirection as {
      description: string;
      keyElements: string[];
      styleNotes: string;
    } | undefined,
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
      template,
      tone: toneParam,
      context,
      targetAudience,
      language = "en",
      numVariants = 1,
      contentTone,
      nonce = 0,
      layoutHint,
    } = body as {
      prompt?: string;
      type?: string;
      template?: string | null;
      tone?: string | null;
      context?: string[] | null;
      targetAudience?: string;
      language?: string;
      numVariants?: number;
      contentTone?: string | null;
      nonce?: number;
      layoutHint?: string | null;
    };

    // Validate contentTone — accept both 'tone' (from new flow) and 'contentTone' (legacy)
    const tone: ContentTone | undefined =
      (toneParam && VALID_TONES.includes(toneParam as ContentTone)
        ? (toneParam as ContentTone)
        : contentTone && VALID_TONES.includes(contentTone as ContentTone)
          ? (contentTone as ContentTone)
          : undefined);

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

    // 5a. Compliance PRE-CHECK — block the prompt before it reaches DeepSeek
    // Only check the user-facing content (prompt + context), not the full constructed message
    if (useAI) {
      const preCheckInput = [prompt, ...(context || [])].filter(Boolean).join(" ");
      if (preCheckInput.trim()) {
        const preCheck = checkPromptCompliance(preCheckInput, "bar or nightlife promotion");
        if (!preCheck.passed) {
          return NextResponse.json(
            {
              error: "Prompt blocked by compliance check. Please remove prohibited content.",
              complianceBlocked: preCheck.blockedPatterns,
            },
            { status: 400 },
          );
        }
      }
    }

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
      template || undefined,
      context || undefined,
      targetAudience || undefined,
      lang,
      variants,
      nonce,
    );

    const isFi = lang === "fi";
    const toneInstruction = toneSystemInstruction(tone);

    // Variant differentiation — injected into the system prompt where it carries more weight.
    // The user message in buildGeneratePrompt reinforces this, but the system prompt is the
    // primary instruction the model follows. Without this, compliance conservatism causes
    // DeepSeek to converge on near-identical "safe" phrasing for all variants.
    const variantDifferentiation = isFi
      ? `\n\nVARIAATIOIDEN EROTTELU — EHDOTTOMAN KRIITTINEN SÄÄNTÖ:\nKun luot useita variantteja, JOKAISELLA on oltava AIDOSTI ERI:\n- Otsikko: eri sanat, eri rakenne, eri koukku. Ala kierrata avainsanoja.\n- Kuvaus: eri kulma. 1) TARJOUSKESKEINEN (mita saa, hinta, konkreettinen etu). 2) TUNNELMAKESKEINEN (milta tuntuu, aistit, ilmapiiri). 3) SOSIAALINEN (kuka, kenen kanssa, yhteiso, jaettu hetki).\n- Aani: jokainen kuulostaa eri henkilon kirjoittamalta — yksi suora ja faktinen, yksi aistillinen ja kuvaileva, yksi sosiaalinen ja kutsuva.\n- ALA tuota kolmea uudelleenmuotoiltua versiota samasta ideasta. Niiden on luettava kuin eri ihmisten kirjoittamina.\n- Jokaisella variantilla on ERI visualDirection — eri kohtaus, eri perspektiivi, eri tunnelma, eri vuorokaudenaika.`
      : `\n\nVARIANT DIFFERENTIATION — ABSOLUTELY CRITICAL RULE:\nWhen generating multiple variants, EACH one MUST have GENUINELY DIFFERENT:\n- Title: different words, different structure, different hook. Do NOT recycle keywords.\n- Description: different angle. 1) OFFER-FOCUSED (what you get, price, concrete benefit). 2) VIBE-FOCUSED (how it feels, senses, atmosphere). 3) SOCIAL-FOCUSED (who, with whom, community, shared moment).\n- Voice: each sounds like a different person wrote it — one direct and factual, one sensory and descriptive, one social and inviting.\n- Do NOT produce three rephrasings of the same idea. They must read as if written by different people.\n- Every variant has a DIFFERENT visualDirection — different scene, different perspective, different mood, different time of day.`;

    // System prompt — compliance rules are injected via buildGeneratePrompt in the user message.
    // This prompt focuses on the model's role and the critical variant differentiation rule.
    const systemPrompt = isFi
      ? `Olet Suomen baari- ja yöelämän markkinointiasiantuntija.
Tunnet Alkoholilain (1102/2017) ja Valviran ohjeistukset.
Jokainen tuottamasi tarjous on oletusarvoisesti lainmukainen — et koskaan ehdota kiellettya sanamuotoa.
Luo kiinnostavia, ammattimaisia tarjouksia suomalaisille baareille SUOMEKSI.${variantDifferentiation}
ALA KOSKAAN mainitse lakiviitteita (Alkoholilaki, Valvira, compliance) otsikoissa, kuvauksissa, ehdoissa tai toimintakehotteissa — ne ovat asiakasteksteja, eivat lakidokumentteja.
KAIKKI teksti TÄYTYY olla suomeksi. Palauta VAIN validi JSON.${toneInstruction ? `\n${toneInstruction}` : ""}`
      : `You are a marketing expert specializing in bar and nightlife promotions in Finland.
You understand Finnish alcohol marketing law (Alkoholilaki 1102/2017) and Valvira guidelines.
Every promotion you write is compliant by default — you never suggest prohibited language.
Create engaging, professional promotions for bars in English.${variantDifferentiation}
NEVER mention legal references (Alkoholilaki, Valvira, compliance) in titles, descriptions, conditions, or CTAs — these are customer-facing, not legal documents.
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
            temperature: 0.95,
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

          // DEBUG: Log raw AI response to diagnose issues
          console.log("[ai-generate] Raw DeepSeek response (first 2000 chars):", aiResponse.slice(0, 2000));

          try {
            let jsonText = aiResponse.trim();

            // Strip markdown code blocks: ```json ... ``` or ``` ... ```
            const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (codeBlockMatch) {
              jsonText = codeBlockMatch[1].trim();
              console.log("[ai-generate] Stripped markdown code block");
            }

            // Try parsing as JSON array (multi-variant)
            if (jsonText.startsWith("[")) {
              const arrayMatch = jsonText.match(/\[[\s\S]*\]/);
              if (arrayMatch) {
                // Clean common DeepSeek JSON issues: trailing commas before ]
                let cleanJson = arrayMatch[0].replace(/,(\s*[}\]])/g, "$1");
                try {
                  const parsed = JSON.parse(cleanJson);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    generatedPromotions = parsed;
                    aiGenerated = true;
                    console.log("[ai-generate] Parsed titles:", parsed.map((p: any) => p.title));
                    console.log("[ai-generate] Parsed descriptions:", parsed.map((p: any) => (p.description || "").slice(0, 80)));
                  }
                } catch (arrayErr) {
                  console.log("[ai-generate] Array parse failed, trying individual objects:", (arrayErr as Error).message);
                  // Fall through to try extracting individual objects
                }
              }
            }

            // If array parsing failed or response wasn't an array, try single-object extraction
            if (generatedPromotions.length === 0) {
              // Try to find all top-level JSON objects in the response
              const objectMatches = jsonText.match(/\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g);
              if (objectMatches && objectMatches.length > 0) {
                for (const objStr of objectMatches) {
                  try {
                    const parsed = JSON.parse(objStr);
                    generatedPromotions.push(parsed);
                  } catch {
                    // Skip malformed objects
                  }
                }
                if (generatedPromotions.length > 0) {
                  aiGenerated = true;
                  console.log("[ai-generate] Extracted", generatedPromotions.length, "objects from response");
                }
              }
            }

            // Last resort: try the whole thing as JSON
            if (generatedPromotions.length === 0) {
              try {
                const parsed = JSON.parse(jsonText);
                generatedPromotions = Array.isArray(parsed) ? parsed : [parsed];
                aiGenerated = true;
              } catch {
                // Will trigger the catch below
                throw new Error("Could not parse AI response as JSON. First 200 chars: " + jsonText.slice(0, 200));
              }
            }
          } catch (parseErr) {
            console.error("[ai-generate] Parse error:", parseErr);
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

    // 8a. Compliance POST-CHECK — scan each variant's title+description against rules.
    // Filter out variants with high-severity violations; warn on medium/low.
    const complianceWarnings: string[] = [];
    const compliantPromotions = promotions.filter((p, i) => {
      const scan = scanCompliance(p.title as string, p.description as string);
      if (scan.status === "FLAGGED_AUTO") {
        const highViolations = scan.violations.filter((v) => v.severity === "high");
        if (highViolations.length > 0) {
          complianceWarnings.push(
            `Variant ${i + 1} filtered: ${highViolations.map((v) => v.message).join("; ")}`,
          );
          return false;
        }
        // Medium/low — warn but keep
        const otherViolations = scan.violations.filter((v) => v.severity !== "high");
        if (otherViolations.length > 0) {
          complianceWarnings.push(
            `Variant ${i + 1} advisory: ${otherViolations.map((v) => v.message).join("; ")}`,
          );
        }
      }
      return true;
    });

    // If all AI-generated variants were filtered, fall back to templates
    let finalPromotions = compliantPromotions;
    if (aiGenerated && compliantPromotions.length === 0) {
      warning = "All AI-generated variants were filtered by compliance. Using safe templates instead.";
      const promoType = VALID_PROMO_TYPES.includes(type as any)
        ? (type as PromotionType)
        : "DRINK_SPECIAL";
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
        finalPromotions.push(normalizePromotion(
          fallback as unknown as Record<string, unknown>,
          bar.name,
          hasPhoto,
          i,
          tone,
          layoutHint,
        ));
      }
      aiGenerated = false;
    }

    // Attach inferred image chips to each variant so the client can
    // auto-generate matching images without the user manually picking chips.
    const variantsWithChips = finalPromotions.map((p) => ({
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
      ...(complianceWarnings.length > 0 && { complianceWarnings }),
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
