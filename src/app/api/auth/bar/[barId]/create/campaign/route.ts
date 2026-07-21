import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isBarStaffToken } from "@/lib/auth";
import { prisma } from "@/lib/database";
import { checkRateLimit, RateLimits } from "@/lib/rate-limiter";
import { handleApiError } from "@/lib/api-error";
import { logUsage } from "@/lib/credit-tracker";
import { extractJsonObjects } from "@/lib/json-extractor";
import { buildPerformanceContextBlock } from "@/lib/performance-feedback";
import { getCalendarContext, getSeasonalBrief } from "@/lib/calendar/finnish-calendar";
import { checkCoherence } from "@/lib/coherence-check";
import { getCompetitiveContext, buildCompetitiveContextBlock } from "@/lib/competitive-context";
import { getTonePromptBlock, type ContentTone } from "@/lib/prompts/tone-voices";
import {
  buildCampaignSystemPrompt,
  buildCampaignUserPrompt,
  type CampaignBeatJob,
} from "@/lib/prompts/build-campaign-prompt";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

const VALID_BEATS: CampaignBeatJob[] = [
  "teaser",
  "announcement",
  "reminder",
  "day_of",
  "follow_up",
];

/** Infer differentiators from bar data */
function inferDifferentiators(bar: {
  type: string;
  amenities?: string[] | null;
  description?: string | null;
  musicTags?: string[] | null;
}): string[] {
  const diffs: string[] = [];
  const typeMap: Record<string, string> = {
    COCKTAIL_BAR: "Hand-crafted cocktails with premium ingredients",
    PUB: "Neighborhood gathering spot with welcoming atmosphere",
    SPORTS_BAR: "Big screens and game-day energy",
    WINE_BAR: "Curated wine selection in an intimate setting",
    LOUNGE: "Relaxed, sophisticated space for conversation",
    KARAOKE: "Stage-ready entertainment with group-friendly vibe",
    LIVE_MUSIC: "Live performances in an acoustically tuned space",
    CLUB: "High-energy nightlife with DJs and late-night dancing",
  };
  if (typeMap[bar.type]) diffs.push(typeMap[bar.type]);
  if (bar.amenities) {
    const amenityMap: Record<string, string> = {
      terrace: "Outdoor terrace",
      "live music": "Regular live performances",
      dj: "Resident and guest DJs",
      kitchen: "Full kitchen serving food",
      "late hours": "Open late",
      waterfront: "Waterfront location",
    };
    bar.amenities.forEach((a) => {
      const match = Object.entries(amenityMap).find(([key]) =>
        a.toLowerCase().includes(key),
      );
      if (match) diffs.push(match[1]);
    });
  }
  return diffs.length > 0 ? diffs : ["Quality drinks and welcoming atmosphere"];
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
) {
  try {
    // 1. Auth
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isBarStaffToken(payload))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { barId } = await params;
    if (payload.barId !== barId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // 2. Rate limit
    const rateCheck = await checkRateLimit(
      `ai-campaign:${barId}`,
      RateLimits.AI,
    );
    if (!rateCheck.allowed)
      return NextResponse.json(
        { error: `Rate limit. Retry in ${rateCheck.retryAfter}s.` },
        { status: 429 },
      );

    // 3. Parse body
    const body = await request.json();
    const {
      campaignName,
      language = "en",
      beats,
      contentTone,
      audience,
      coreMessage,
      atmosphere,
      imageWorld,
      copyStructure,
      eventDate,
      eventTime,
      userBrief,
      voiceProfileContext,
    } = body as {
      campaignName?: string;
      language?: string;
      beats?: string[];
      contentTone?: string;
      audience?: string[];
      coreMessage?: string;
      atmosphere?: string[];
      imageWorld?: string;
      copyStructure?: string;
      eventDate?: string;
      eventTime?: string;
      userBrief?: string;
      voiceProfileContext?: string;
    };

    const lang = language === "fi" ? "fi" : "en";

    if (!campaignName || typeof campaignName !== "string" || !campaignName.trim()) {
      return NextResponse.json(
        { error: "Missing required field: campaignName" },
        { status: 400 },
      );
    }

    const validatedBeats: CampaignBeatJob[] = Array.isArray(beats)
      ? beats.filter((b): b is CampaignBeatJob => VALID_BEATS.includes(b as CampaignBeatJob))
      : ["teaser", "announcement", "day_of"];
    if (validatedBeats.length === 0) {
      return NextResponse.json(
        { error: "At least one valid beat is required" },
        { status: 400 },
      );
    }

    // 4. Fetch bar context
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
      },
    });
    if (!bar)
      return NextResponse.json({ error: "Bar not found" }, { status: 404 });

    // 5. Build tone instruction
    const tone = contentTone &&
      ["WARM_INVITING", "BOLD_ENERGETIC", "EDGY_IRREVERENT", "ELEGANT_PREMIUM", "PLAYFUL_FUN"].includes(contentTone)
      ? (contentTone as ContentTone)
      : null;
    const toneInstruction = tone
      ? getTonePromptBlock(tone, lang)
      : null;

    // 6. Build prompts
    const barPositioning = {
      name: bar.name,
      type: bar.type,
      district: bar.district ?? undefined,
      cityName: bar.cityName ?? undefined,
      differentiators: inferDifferentiators(bar),
      seasonalContext: getSeasonalBrief(new Date(), lang),
    };

    let systemPrompt = buildCampaignSystemPrompt(lang, barPositioning);
    if (voiceProfileContext) {
      systemPrompt += voiceProfileContext;
    }

    // 6a. Inject performance feedback context — helps the AI prefer
    // creative choices that have driven better engagement for this bar.
    try {
      const performanceCtx = await buildPerformanceContextBlock(barId, lang);
      if (performanceCtx) {
        systemPrompt += `\n${performanceCtx}`;
        console.log("[campaign] Performance context injected —", performanceCtx.length, "chars");
      }
    } catch (err) {
      console.warn("[campaign] Failed to load performance context:", err);
    }

    // 6b. Inject calendar context — Finnish holidays, cultural events, sports
    // with lead-time phases and competitive differentiators.
    try {
      const calendarCtx = getCalendarContext(new Date(), lang);
      const calendarBlock = calendarCtx.systemPromptBlock[lang];
      if (calendarBlock) {
        systemPrompt += `\n${calendarBlock}`;
        console.log("[campaign] Calendar context injected —", calendarBlock.length, "chars");
      }
    } catch (err) {
      console.warn("[campaign] Failed to load calendar context:", err);
    }

    // 6c. Inject competitive context — what competitors are running, whitespace
    try {
      const compCtx = await getCompetitiveContext(
        barId,
        bar.district,
        bar.cityName,
        bar.type,
        (bar.amenities as string[]) ?? [],
      );
      const compBlock = buildCompetitiveContextBlock(compCtx, lang);
      if (compBlock) {
        systemPrompt += `\n${compBlock}`;
        console.log("[campaign] Competitive context injected —", compBlock.length, "chars");
      }
    } catch (err) {
      console.warn("[campaign] Failed to load competitive context:", err);
    }

    const amenitiesStr = (bar.amenities as string[])?.join(", ") ?? undefined;
    const musicTagsStr = (bar.musicTags as string[])?.join(", ") ?? undefined;

    const userPrompt = buildCampaignUserPrompt({
      campaignName: campaignName.trim(),
      barName: bar.name,
      barType: bar.type,
      district: bar.district,
      cityName: bar.cityName,
      priceRange: bar.priceRange,
      amenities: amenitiesStr,
      description: bar.description,
      musicTags: musicTagsStr,
      tone,
      toneInstruction,
      audience,
      coreMessage,
      atmosphere,
      imageWorld,
      copyStructure,
      language: lang,
      eventDate,
      eventTime,
      beats: validatedBeats,
      userBrief,
      barId,
    });

    // 7. Call DeepSeek or use fallback
    const useAI = !!DEEPSEEK_API_KEY;
    let campaignBeats: Record<string, unknown>[] | null = null;
    let aiGenerated = false;
    let warning: string | undefined;
    let aiUsage: { promptTokens: number; completionTokens: number } | null = null;

    if (useAI) {
      const totalPromptChars = systemPrompt.length + userPrompt.length;
      console.log(
        `[campaign] Sending to DeepSeek — system: ${systemPrompt.length}c, user: ${userPrompt.length}c, beats: ${validatedBeats.length}`,
      );

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
            max_tokens: 4000,
          }),
          signal: AbortSignal.timeout(45_000),
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

          // Parse: try JSON array first, then extractJsonObjects fallback
          try {
            let jsonText = aiResponse.trim();
            const codeBlockMatch = jsonText.match(
              /```(?:json)?\s*([\s\S]*?)```/,
            );
            if (codeBlockMatch) jsonText = codeBlockMatch[1].trim();

            if (jsonText.startsWith("[")) {
              const arrayMatch = jsonText.match(/\[[\s\S]*\]/);
              if (arrayMatch) {
                const cleanJson = arrayMatch[0].replace(/,(\s*[}\]])/g, "$1");
                const parsed = JSON.parse(cleanJson);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  campaignBeats = parsed;
                  aiGenerated = true;
                  console.log("[campaign] Parsed", parsed.length, "beats");
                }
              }
            }

            // Fallback: extract individual JSON objects
            if (!aiGenerated) {
              const matches = extractJsonObjects(jsonText, {
                maxObjects: 10,
                maxLength: 100_000,
              });
              if (matches.length > 0) {
                campaignBeats = matches
                  .map((m) => {
                    try { return JSON.parse(m); } catch { return null; }
                  })
                  .filter(Boolean) as Record<string, unknown>[];
                if (campaignBeats.length > 0) {
                  aiGenerated = true;
                  console.log("[campaign] Extracted", campaignBeats.length, "objects via fallback");
                }
              }
            }
          } catch (parseErr) {
            console.error("[campaign] Parse error:", (parseErr as Error).message);
          }
        } else {
          const errorText = await response.text().catch(() => "(no body)");
          console.error(`[campaign] DeepSeek error ${response.status}:`, errorText.slice(0, 300));
        }
      } catch (err) {
        console.error("[campaign] Fetch error:", (err as Error).message);
      }
    }

    // Credit tracking
    if (aiGenerated && aiUsage) {
      logUsage({
        provider: "deepseek",
        endpoint: "chat/completions",
        tokensIn: aiUsage.promptTokens,
        tokensOut: aiUsage.completionTokens,
        barId,
        barName: bar.name,
        metadata: { step: "campaign", language: lang, beats: validatedBeats.length },
      }).catch(() => {});
    }

    // 8. Build response — with intelligent fallback if AI didn't produce results
    if (!aiGenerated || !campaignBeats || campaignBeats.length === 0) {
      warning = lang === "fi"
        ? "AI-palvelu ei tuottanut tuloksia — näytetään mallipohjaiset ehdotukset."
        : "AI service did not return results — showing template-based suggestions.";
      campaignBeats = buildFallbackBeats(validatedBeats, bar.name, lang);
    }

    // Normalize beat output
    const normalizedBeats = campaignBeats.map((b, i) => ({
      job: (VALID_BEATS.includes(b.job as CampaignBeatJob)
        ? b.job
        : validatedBeats[i % validatedBeats.length]) as CampaignBeatJob,
      headline: (b.headline as string) || (b.title as string) || `Beat ${i + 1}`,
      body: (b.body as string) || (b.description as string) || "",
      cta: (b.cta as string) || (b.callToAction as string) || "Learn More",
      hookPattern: typeof b.hookPattern === "string" ? (b.hookPattern as string) : undefined,
      imagePrompt: (b.imagePrompt as string) || "",
    }));

    // Visual-text coherence check — verify each beat's imagePrompt matches
    // its headline/body emotional register.
    const coherence = normalizedBeats.map((b) =>
      checkCoherence(b.headline, b.body, b.imagePrompt),
    );
    const coherenceWarnings = coherence
      .filter((c) => c.warnings.length > 0)
      .flatMap((c, i) => c.warnings.map((w) => `Beat ${i + 1}: ${w}`));
    if (coherenceWarnings.length > 0) {
      console.log("[campaign] Coherence warnings:", coherenceWarnings);
    }

    return NextResponse.json({
      success: true,
      aiGenerated,
      ...(warning && { warning }),
      campaignName: campaignName.trim(),
      beats: normalizedBeats,
      beatsRequested: validatedBeats,
      ...(coherence.some((c) => !c.pass) && { coherenceWarnings }),
    });
  } catch (error) {
    return handleApiError(error, "campaign generate");
  }
}

/** Intelligent fallback using bar name and beat definitions */
function buildFallbackBeats(
  jobs: CampaignBeatJob[],
  barName: string,
  lang: "en" | "fi",
): Record<string, unknown>[] {
  const isFi = lang === "fi";
  const templates: Record<CampaignBeatJob, { headline: string; body: string; cta: string; imagePrompt: string }> = {
    teaser: {
      headline: isFi ? `${barName} — jotain on tulossa` : `${barName} — something's coming`,
      body: isFi
        ? `Merkkaa kalenteriin. Jotain erityistä on tekeillä ${barName}lla. Lisätietoja pian.`
        : `Save the date. Something special is brewing at ${barName}. More soon.`,
      cta: isFi ? "Pysy kuulolla" : "Stay tuned",
      imagePrompt: `mysterious close-up detail of ${barName} bar interior, shallow depth of field, warm amber light hinting through, anticipation mood`,
    },
    announcement: {
      headline: isFi ? `${barName} — tule mukaan` : `${barName} — join us`,
      body: isFi
        ? `Olemme koonneet illan, joka kannattaa kokea. ${barName} — tuttu paikka, uusi syy tulla.`
        : `We've put together an evening worth experiencing. ${barName} — familiar place, new reason to come.`,
      cta: isFi ? "Varaa paikkasi" : "Save your spot",
      imagePrompt: `wide welcoming shot of ${barName} bar, warm inviting lighting, golden hour feel, empty but ready for guests`,
    },
    reminder: {
      headline: isFi ? `Huomenna ${barName}lla` : `Tomorrow at ${barName}`,
      body: isFi
        ? `Oletko valmis? Huominen ilta ${barName}lla lähestyy. Toivottavasti nähdään.`
        : `You ready? Tomorrow night at ${barName} is coming up. Hope to see you there.`,
      cta: isFi ? "Tuletko?" : "You coming?",
      imagePrompt: `cozy ${barName} bar counter with a single drink waiting, soft lighting, anticipation before the crowd arrives`,
    },
    day_of: {
      headline: isFi ? `Tänään. ${barName}. Nyt.` : `Tonight. ${barName}. Now.`,
      body: isFi
        ? `Se on täällä. ${barName} on valmiina. Ovet auki, valot päällä, tunnelma odottaa. Tule sellaisena kuin olet.`
        : `It's here. ${barName} is ready. Doors open, lights on, vibe is waiting. Come as you are.`,
      cta: isFi ? "Tule nyt" : "Come now",
      imagePrompt: `energetic ${barName} bar interior coming alive, warm lights glowing, first guests arriving, excitement building`,
    },
    follow_up: {
      headline: isFi ? `Kiitos eilisestä, ${barName}` : `Thank you for last night, ${barName}`,
      body: isFi
        ? `Mikä ilta. Kiitos kaikille jotka tulitte — teitte siitä ikimuistoisen. ${barName} odottaa seuraavaa kertaa.`
        : `What a night. Thanks to everyone who came — you made it unforgettable. ${barName} is already looking forward to the next one.`,
      cta: isFi ? "Nähdään ensi kerralla" : "See you next time",
      imagePrompt: `candid moments at ${barName}, soft focus on laughing people, warm afterglow lighting, genuine atmosphere, not staged`,
    },
  };

  return jobs.map((job) => {
    const tpl = templates[job];
    return {
      job,
      headline: tpl.headline,
      body: tpl.body,
      cta: tpl.cta,
      hookPattern: job === "teaser" ? "curiosity_gap" : job === "day_of" ? "urgency_scarcity" : "direct_promise",
      imagePrompt: tpl.imagePrompt,
    };
  });
}
