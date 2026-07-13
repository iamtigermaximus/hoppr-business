import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isBarStaffToken } from "@/lib/auth";
import { prisma } from "@/lib/database";
import { planHasFeature } from "@/lib/plan-limits";
import { buildGeneratePrompt, buildFullSystemPrompt, type PromptLanguage } from "@/lib/compliance/prompts";
import { type BarPositioning } from "@/lib/compliance/persona";
import { checkPromptCompliance } from "@/lib/compliance/image-compliance";
import { scanCompliance } from "@/lib/compliance/engine";
import { checkRateLimit, RateLimits } from "@/lib/rate-limiter";
import { inferImageChips } from "@/lib/prompts/infer-image-chips";
import { logUsage } from "@/lib/credit-tracker";
import { extractJsonObjects } from "@/lib/json-extractor";
import { handleApiError } from "@/lib/api-error";
import { logIncident } from "@/lib/incident-logger";
import {
  getFallbackPromotion,
  type PromotionType,
} from "@/lib/ai/fallback-templates";
import { toneSystemInstruction } from "@/lib/prompts/tone-voices";

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

/** Visual style presets */
const VISUAL_PRESETS = [
  { template: "card" as const, mood: "dark" as const, overlayOpacity: 0.4, accentColor: "#8b5cf6" },
  { template: "split" as const, mood: "warm" as const, overlayOpacity: 0.35, accentColor: "#f59e0b" },
  { template: "centered" as const, mood: "cool" as const, overlayOpacity: 0.45, accentColor: "#3b82f6" },
  { template: "card" as const, mood: "vibrant" as const, overlayOpacity: 0.3, accentColor: "#ef4444" },
  { template: "split" as const, mood: "minimal" as const, overlayOpacity: 0.5, accentColor: "#6b7280" },
];

const TONE_PRESET_MAP: Record<ContentTone, number[]> = {
  BOLD_ENERGETIC: [1, 3],
  WARM_INVITING: [1, 2],
  EDGY_IRREVERENT: [0, 4],
  ELEGANT_PREMIUM: [2, 4],
  PLAYFUL_FUN: [3, 1],
};

/** Infer differentiators from bar data for the persona */
function inferDifferentiators(bar: {
  type: string;
  amenities?: string[] | null;
  description?: string | null;
  musicTags?: string[] | null;
}): string[] {
  const diffs: string[] = [];

  // Type-based differentiators
  const typeMap: Record<string, string> = {
    COCKTAIL_BAR: "Hand-crafted cocktails with premium ingredients",
    NIGHTCLUB: "High-energy nightlife with DJs and late-night dancing",
    PUB: "Neighborhood gathering spot with welcoming atmosphere",
    SPORTS_BAR: "Big screens and game-day energy",
    WINE_BAR: "Curated wine selection in an intimate setting",
    LOUNGE: "Relaxed, sophisticated space for conversation",
    KARAOKE: "Stage-ready entertainment with group-friendly vibe",
    LIVE_MUSIC: "Live performances in an acoustically tuned space",
    TERRACE_BAR: "Outdoor drinking and dining with city views",
    BEER_HALL: "Communal tables and craft beer culture",
  };
  if (typeMap[bar.type]) diffs.push(typeMap[bar.type]);

  // Amenity-based differentiators
  const amenityMap: Record<string, string> = {
    terrace: "Outdoor terrace — one of the few in the area",
    "live music": "Regular live performances you won't find elsewhere",
    dj: "Resident and guest DJs spinning curated sets",
    "private room": "Bookable private space for groups and events",
    kitchen: "Full kitchen serving food alongside drinks",
    "late hours": "One of the last places open in the neighborhood",
    parking: "Rare on-site parking in the area",
    waterfront: "Waterfront location with scenic views",
  };
  if (bar.amenities) {
    bar.amenities.forEach((a) => {
      const lower = a.toLowerCase();
      const match = Object.entries(amenityMap).find(([key]) => lower.includes(key));
      if (match) diffs.push(match[1]);
    });
  }

  // Music-based differentiators
  if (bar.musicTags && bar.musicTags.length > 0) {
    diffs.push(`Music identity: ${bar.musicTags.slice(0, 3).join(", ")}`);
  }

  return diffs.length > 0 ? diffs : ["Quality drinks and welcoming atmosphere"];
}

/** Get seasonal context based on current date */
function getSeasonalContext(): string {
  const month = new Date().getMonth(); // 0-11
  if (month >= 5 && month <= 7) return "Summer terrace season — outdoor spaces are premium. Long daylight hours favor evening-to-night transitions.";
  if (month === 8) return "Late summer — people are back from holidays, craving social connection before autumn.";
  if (month >= 9 && month <= 10) return "Autumn cozy season — indoor warmth, candles, comfort drinks. Students are back in town.";
  if (month >= 11 || month <= 1) return "Winter holiday season — Christmas parties, New Year celebrations, cozy indoor gatherings. Dark evenings favor warm, intimate atmospheres.";
  return "Spring awakening — people emerge from winter hibernation, terraces reopen, energy rises.";
}

function normalizePromotion(
  raw: Record<string, unknown>,
  barName: string,
  hasPhoto: boolean,
  index: number = 0,
  tone?: ContentTone | null,
  layoutHint?: string | null,
) {
  const rawVisual = (raw.visual as Record<string, unknown> | undefined);

  const compatibleIndices = tone ? TONE_PRESET_MAP[tone] ?? [0, 1, 2, 3, 4] : [0, 1, 2, 3, 4];
  const presetIndex = compatibleIndices[index % compatibleIndices.length];
  const preset = VISUAL_PRESETS[presetIndex];

  const template = (layoutHint && ["split", "centered", "card"].includes(layoutHint))
    ? layoutHint
    : (typeof rawVisual?.template === "string" && ["split", "centered", "card"].includes(rawVisual.template as string))
      ? (rawVisual.template as "split" | "centered" | "card")
      : preset.template;

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

    if (!isBarStaffToken(payload)) {
      return NextResponse.json(
        { error: "Forbidden: Bar staff access required" },
        { status: 403 },
      );
    }

    const { barId } = await params;

    if (payload.barId !== barId) {
      return NextResponse.json(
        { error: "Forbidden: You don't have access to this bar" },
        { status: 403 },
      );
    }

    if (process.env.REQUIRE_PLAN_FOR_AI === "true") {
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

    const rateCheck = await checkRateLimit(`ai-generate:${barId}`, RateLimits.AI);
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

    const tone: ContentTone | undefined =
      (toneParam && VALID_TONES.includes(toneParam as ContentTone)
        ? (toneParam as ContentTone)
        : contentTone && VALID_TONES.includes(contentTone as ContentTone)
          ? (contentTone as ContentTone)
          : undefined);

    const validLanguages: PromptLanguage[] = ["en", "fi"];
    const lang: PromptLanguage = validLanguages.includes(language as PromptLanguage)
      ? (language as PromptLanguage)
      : "en";

    const variants = Math.max(1, Math.min(3, numVariants || 1));

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
        musicTags: true,
        vipEnabled: true,
        coverImage: true,
      },
    });

    if (!bar) {
      return NextResponse.json({ error: "Bar not found" }, { status: 404 });
    }

    const recentPromotions = await prisma.barPromotion.findMany({
      where: { barId, isActive: true },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { title: true, type: true },
    });

    // Build bar positioning context for the senior marketing persona
    const barPositioning: BarPositioning = {
      name: bar.name,
      type: bar.type,
      district: bar.district ?? undefined,
      cityName: bar.cityName ?? undefined,
      priceRange: bar.priceRange ?? undefined,
      amenities: bar.amenities ?? undefined,
      description: bar.description ?? undefined,
      musicTags: (bar.musicTags as string[]) ?? undefined,
      targetAudience: targetAudience || undefined,
      differentiators: inferDifferentiators(bar),
      seasonalContext: getSeasonalContext(),
    };

    const useAI = !!DEEPSEEK_API_KEY;

    if (useAI) {
      const preCheckInput = [prompt, ...(context || [])].filter(Boolean).join(" ");
      if (preCheckInput.trim()) {
        const preCheck = checkPromptCompliance(preCheckInput, "bar or nightlife promotion");
        if (!preCheck.passed) {
          logIncident({
            barId, barName: bar.name,
            type: "COMPLIANCE_BLOCKED",
            severity: "INFO",
            message: `Compliance pre-check blocked prompt: ${preCheck.blockedPatterns?.join(", ") || "unknown pattern"}`,
            endpoint: "ai-generate",
          }).catch(() => {});
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

    const userPrompt = buildGeneratePrompt(
      {
        name: bar.name,
        type: bar.type,
        district: bar.district ?? undefined,
        cityName: bar.cityName ?? undefined,
        priceRange: bar.priceRange ?? undefined,
        amenities: bar.amenities ?? undefined,
        description: bar.description ?? undefined,
        musicTags: (bar.musicTags as string[]) ?? undefined,
      },
      barId,
      recentPromotions.map((p) => p.title),
      prompt || "",
      type || "unique",
      template || undefined,
      tone || undefined,
      context || undefined,
      targetAudience || undefined,
      lang,
      variants,
      nonce,
    );

    const isFi = lang === "fi";
    const toneInstruction = toneSystemInstruction(tone);

    const variantDifferentiation = isFi
      ? `\n\nVARIAATIOIDEN EROTTELU — EHDOTTOMAN KRIITTINEN SAANTO:\nKun luot useita variantteja, JOKAISELLA on oltava AIDOSTI ERI:\n- Otsikko: eri sanat, eri rakenne, eri koukku. Ala kierrata avainsanoja.\n- Kuvaus: eri kulma. 1) TARJOUSKESKEINEN (mita saa, hinta, konkreettinen etu). 2) TUNNELMAKESKEINEN (milta tuntuu, aistit, ilmapiiri). 3) SOSIAALINEN (kuka, kenen kanssa, yhteiso, jaettu hetki).\n- Aani: jokainen kuulostaa eri henkilon kirjoittamalta - yksi suora ja faktinen, yksi aistillinen ja kuvaileva, yksi sosiaalinen ja kutsuva.\n- ALA tuota kolmea uudelleenmuotoiltua versiota samasta ideasta. Niiden on luettava kuin eri ihmisten kirjoittamina.\n- Jokaisella variantilla on ERI visualDirection - eri kohtaus, eri perspektiivi, eri tunnelma, eri vuorokaudenaika.`
      : `\n\nVARIANT DIFFERENTIATION - ABSOLUTELY CRITICAL RULE:\nWhen generating multiple variants, EACH one MUST have GENUINELY DIFFERENT:\n- Title: different words, different structure, different hook. Do NOT recycle keywords.\n- Description: different angle. 1) OFFER-FOCUSED (what you get, price, concrete benefit). 2) VIBE-FOCUSED (how it feels, senses, atmosphere). 3) SOCIAL-FOCUSED (who, with whom, community, shared moment).\n- Voice: each sounds like a different person wrote it - one direct and factual, one sensory and descriptive, one social and inviting.\n- Do NOT produce three rephrasings of the same idea. They must read as if written by different people.\n- Every variant has a DIFFERENT visualDirection - different scene, different perspective, different mood, different time of day.`;

    // System prompt: senior marketing persona + compliance rules + variant differentiation
    const footerText = isFi
      ? `\nALA KOSKAAN mainitse lakiviitteita (Alkoholilaki, Valvira, compliance) otsikoissa, kuvauksissa, ehdoissa tai toimintakehotteissa - ne ovat asiakasteksteja, eivat lakidokumentteja.\nKAIKKI teksti TAYTYY olla suomeksi. Palauta VAIN validi JSON.`
      : `\nNEVER mention legal references (Alkoholilaki, Valvira, compliance) in titles, descriptions, conditions, or CTAs - these are customer-facing, not legal documents.\nReturn ONLY valid JSON.`;

    const systemPrompt = `${buildFullSystemPrompt(lang, barPositioning)}\n${variantDifferentiation}${footerText}${toneInstruction ? `\n${toneInstruction}` : ""}`;

    let generatedPromotions: Record<string, unknown>[] = [];
    let aiGenerated = false;
    let warning: string | undefined;
    let aiUsage: { promptTokens: number; completionTokens: number } | null = null;

    if (useAI) {
      const totalPromptChars = systemPrompt.length + userPrompt.length;
      const estimatedTokens = Math.round(totalPromptChars / 4);
      console.log(`[ai-generate] Sending to DeepSeek — system: ${systemPrompt.length}c, user: ${userPrompt.length}c, total: ${totalPromptChars}c (~${estimatedTokens}t), variants: ${variants}, tone: ${tone || "none"}`);

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
            max_tokens: variants > 1 ? 3000 : 1500,
          }),
          signal: AbortSignal.timeout(30_000),
        });

        if (response.ok) {
          const data = await response.json();
          const aiResponse = data.choices[0].message.content;

          if (data.usage) {
            aiUsage = {
              promptTokens: data.usage.prompt_tokens || 0,
              completionTokens: data.usage.completion_tokens || 0,
            };
          }

          console.log("[ai-generate] Raw DeepSeek response (first 2000 chars):", aiResponse.slice(0, 2000));

          try {
            let jsonText = aiResponse.trim();

            const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (codeBlockMatch) {
              jsonText = codeBlockMatch[1].trim();
              console.log("[ai-generate] Stripped markdown code block");
            }

            if (jsonText.startsWith("[")) {
              const arrayMatch = jsonText.match(/\[[\s\S]*\]/);
              if (arrayMatch) {
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
                }
              }
            }

            if (generatedPromotions.length === 0) {
              const objectMatches = extractJsonObjects(jsonText, { maxObjects: 5, maxLength: 50_000 });
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

            if (generatedPromotions.length === 0) {
              try {
                const parsed = JSON.parse(jsonText);
                generatedPromotions = Array.isArray(parsed) ? parsed : [parsed];
                aiGenerated = true;
              } catch {
                throw new Error("Could not parse AI response as JSON. First 200 chars: " + jsonText.slice(0, 200));
              }
            }
          } catch (parseErr) {
            console.error("[ai-generate] Parse error:", parseErr);
            logIncident({
              barId, barName: bar.name,
              type: "PARSE_ERROR",
              severity: "WARNING",
              message: "DeepSeek response could not be parsed as JSON",
              detail: (parseErr as Error).message?.slice(0, 500),
              endpoint: "ai-generate",
            }).catch(() => {});
            warning = "AI response could not be processed. Using template-based generation instead.";
          }
        } else {
          const errorText = await response.text().catch(() => "(could not read error body)");
          console.error(`[ai-generate] DeepSeek API error — status ${response.status}: ${errorText.slice(0, 500)}`);
          console.error(`[ai-generate] System prompt length: ${systemPrompt.length} chars (~${Math.round(systemPrompt.length / 4)} tokens)`);
          console.error(`[ai-generate] User prompt length: ${userPrompt.length} chars (~${Math.round(userPrompt.length / 4)} tokens)`);
          logIncident({
            barId, barName: bar.name,
            type: "AI_GENERATE_FAILED",
            severity: response.status >= 500 ? "CRITICAL" : "WARNING",
            message: `DeepSeek API returned status ${response.status}`,
            detail: errorText.slice(0, 500),
            endpoint: "ai-generate",
          }).catch(() => {});
          warning = `AI service returned error ${response.status}. Using template-based generation instead.`;
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        const isTimeout = err instanceof Error && err.name === "TimeoutError";
        console.error(`[ai-generate] DeepSeek fetch/network error: ${errMsg}`);
        console.error(`[ai-generate] System prompt length: ${systemPrompt.length} chars`, isTimeout ? "(timeout)" : "");
        logIncident({
          barId, barName: bar.name,
          type: isTimeout ? "TIMEOUT" : "NETWORK_ERROR",
          severity: "CRITICAL",
          message: isTimeout ? "DeepSeek request timed out after 30s" : `DeepSeek network error: ${errMsg.slice(0, 200)}`,
          endpoint: "ai-generate",
        }).catch(() => {});
        warning = `AI service unavailable (${errMsg.slice(0, 100)}). Using template-based generation instead.`;
      }
    } else {
      logIncident({
        barId, barName: bar.name,
        type: "MISSING_API_KEY",
        severity: "CRITICAL",
        message: "DEEPSEEK_API_KEY is not configured — all bars receive template fallbacks",
        endpoint: "ai-generate",
      }).catch(() => {});
      warning = "AI service is not configured. Promotions are generated from templates. Set DEEPSEEK_API_KEY to enable AI generation.";
    }

    if (aiGenerated && aiUsage) {
      logUsage({
        provider: "deepseek",
        endpoint: "chat/completions",
        tokensIn: aiUsage.promptTokens,
        tokensOut: aiUsage.completionTokens,
        barId,
        barName: bar.name,
        metadata: { variants, language: lang },
      }).catch(() => {});
    }

    if (generatedPromotions.length === 0) {
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
        generatedPromotions.push(fallback as unknown as Record<string, unknown>);
      }
    }

    const hasPhoto = !!(bar.coverImage as string | null);

    const promotions = generatedPromotions.map((p, i) =>
      normalizePromotion(p, bar.name, hasPhoto, i, tone, layoutHint),
    );

    const complianceResults: Array<{
      variantIndex: number;
      violations: Array<{ rule: string; keyword: string; severity: string; message: string; suggestion: string }>;
    }> = [];

    for (let i = 0; i < promotions.length; i++) {
      const scan = scanCompliance(promotions[i].title as string, promotions[i].description as string, {
        barName: bar.name,
      });
      if (scan.violations.length > 0) {
        complianceResults.push({
          variantIndex: i,
          violations: scan.violations.map((v) => ({
            rule: v.rule,
            keyword: v.keyword,
            severity: v.severity,
            message: v.message,
            suggestion: v.suggestion || "",
          })),
        });
      }
    }

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

    return NextResponse.json({
      success: true,
      aiGenerated,
      ...(warning && { warning }),
      ...(complianceResults.length > 0 && { complianceResults }),
      language: lang,
      ...(variants > 1
        ? { variants: variantsWithChips }
        : { promotion: variantsWithChips[0] }),
    });
  } catch (error) {
    return handleApiError(error, "AI generation");
  }
}
