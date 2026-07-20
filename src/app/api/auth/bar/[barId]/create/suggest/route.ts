import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isBarStaffToken } from "@/lib/auth";
import { prisma } from "@/lib/database";
import { checkRateLimit, RateLimits } from "@/lib/rate-limiter";
import {
  buildFullSystemPrompt,
  buildUserReminder,
} from "@/lib/compliance/prompts";
import { type BarPositioning, buildCreativeDirectorReview } from "@/lib/compliance/persona";
import { getFallbackSuggestion } from "@/lib/ai/fallback-templates";
import { logUsage } from "@/lib/credit-tracker";
import { handleApiError } from "@/lib/api-error";
import {
  buildEventPrompt,
  inferEventCategory,
  type EventPromptOutput,
} from "@/lib/prompts/build-event-prompt";
import {
  buildPassPrompt,
  inferPassCategory,
  type PassPromptOutput,
} from "@/lib/prompts/build-pass-prompt";
import { getTonePromptBlock, toneSystemInstruction, type ContentTone } from "@/lib/prompts/tone-voices";
import { buildBrandGeneratePrompt } from "@/lib/compliance/prompts";
import { scanCompliance } from "@/lib/compliance/engine";
import { inferImageChips } from "@/lib/prompts/infer-image-chips";
import { extractJsonObjects } from "@/lib/json-extractor";
import { formatTemplateFieldValues } from "@/lib/prompts/template-fields";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

/** Infer differentiators from bar data for the persona */
function inferDifferentiators(bar: {
  type: string;
  amenities?: string[] | null;
  description?: string | null;
  musicTags?: string[] | null;
}): string[] {
  const diffs: string[] = [];

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

  if (bar.musicTags && bar.musicTags.length > 0) {
    diffs.push(`Music identity: ${bar.musicTags.slice(0, 3).join(", ")}`);
  }

  return diffs.length > 0 ? diffs : ["Quality drinks and welcoming atmosphere"];
}

/** Get seasonal context based on current date */
function getSeasonalContext(): string {
  const month = new Date().getMonth();
  if (month >= 5 && month <= 7) return "Summer terrace season — outdoor spaces are premium. Long daylight hours favor evening-to-night transitions.";
  if (month === 8) return "Late summer — people are back from holidays, craving social connection before autumn.";
  if (month >= 9 && month <= 10) return "Autumn cozy season — indoor warmth, candles, comfort drinks. Students are back in town.";
  if (month >= 11 || month <= 1) return "Winter holiday season — Christmas parties, New Year celebrations, cozy indoor gatherings. Dark evenings favor warm, intimate atmospheres.";
  return "Spring awakening — people emerge from winter hibernation, terraces reopen, energy rises.";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
) {
  try {
    // 1. Verify authentication
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

    // 2. Rate limit: 10 AI calls per minute per bar
    const rateCheck = await checkRateLimit(`ai-suggest:${barId}`, RateLimits.AI);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `AI suggestions rate limit reached. Retry in ${rateCheck.retryAfter}s.` },
        { status: 429 },
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const {
      text,
      language = "en",
      contentType,
      contentTone,
      // New: advertising hub mode and ingredients
      mode,
      audience,
      coreMessage,
      atmosphere,
      imageWorld,
      timeOfDay,
      season: bodySeason,
      roomEnergy,
      focalPoint,
      copyStructure,
      templateName,
      avoidHeadlinePatterns,
      templateFields = {},
    } = body as {
      text: string;
      language?: string;
      contentType?: string;
      contentTone?: string;
      mode?: string;
      audience?: string[];
      coreMessage?: string;
      atmosphere?: string[];
      imageWorld?: string;
      timeOfDay?: string;
      season?: string;
      roomEnergy?: string;
      focalPoint?: string;
      copyStructure?: string;
      templateName?: string;
      avoidHeadlinePatterns?: string[];
      templateFields?: Record<string, string>;
    };

    // In brand mode, the structured ingredients (audience, coreMessage,
    // atmosphere, imageWorld, copyStructure) carry the content intent.
    // A free-text brief is optional — the route synthesizes one when empty.
    const isBrand = mode === "brand";
    if (!isBrand && (!text || typeof text !== "string" || text.trim().length === 0)) {
      return NextResponse.json(
        { error: "Missing required field: text" },
        { status: 400 },
      );
    }
    const safeText = typeof text === "string" ? text : "";

    // Validate language
    const validLanguages = ["en", "fi"];
    const lang = validLanguages.includes(language) ? language : "en";

    // Validate contentType
    const validContentTypes = ["auto", "event", "promotion", "pass"];
    const ct = validContentTypes.includes(contentType || "")
      ? contentType!
      : "auto";

    // 4. Fetch bar context — include musicTags for positioning
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

    if (!bar) {
      return NextResponse.json({ error: "Bar not found" }, { status: 404 });
    }

    // 5. Build bar positioning for the senior marketing persona
    const barPositioning: BarPositioning = {
      name: bar.name,
      type: bar.type,
      district: bar.district ?? undefined,
      cityName: bar.cityName ?? undefined,
      priceRange: bar.priceRange ?? undefined,
      amenities: bar.amenities ?? undefined,
      description: bar.description ?? undefined,
      musicTags: (bar.musicTags as string[]) ?? undefined,
      differentiators: inferDifferentiators(bar),
      seasonalContext: getSeasonalContext(),
    };

    // 6. Check if DeepSeek API key is configured — use fallback templates if not
    const useAI = !!DEEPSEEK_API_KEY;

    // 6a. Build type-specific prompts when contentType is specified
    // When "auto", fall through to the generic prompt builder below.
    // IMPORTANT: When mode is "brand", skip event/pass prompts entirely —
    // the brand prompt builder (6b) handles all content generation.
    let eventPromptResult: EventPromptOutput | null = null;
    let passPromptResult: PassPromptOutput | null = null;

    if (ct === "event" && mode !== "brand") {
      const inferredCategory = inferEventCategory(text);
      eventPromptResult = buildEventPrompt({
        barName: bar.name,
        barType: bar.type,
        district: bar.district ?? undefined,
        cityName: bar.cityName ?? undefined,
        amenities: bar.amenities ?? undefined,
        priceRange: bar.priceRange ?? undefined,
        description: bar.description ?? undefined,
        musicTags: (bar.musicTags as string[]) ?? undefined,
        vipEnabled: bar.vipEnabled,
        userBrief: text,
        language: lang as "en" | "fi",
        eventCategory: inferredCategory,
      });
    } else if (ct === "pass" && mode !== "brand") {
      const inferredCategory = inferPassCategory(text);
      passPromptResult = buildPassPrompt({
        barName: bar.name,
        barType: bar.type,
        district: bar.district ?? undefined,
        cityName: bar.cityName ?? undefined,
        amenities: bar.amenities ?? undefined,
        priceRange: bar.priceRange ?? undefined,
        description: bar.description ?? undefined,
        vipEnabled: bar.vipEnabled,
        userBrief: text,
        language: lang as "en" | "fi",
        passCategory: inferredCategory,
      });
    }

    // 6b. Build brand prompt when mode is "brand"
    let brandSystemPrompt: string | null = null;
    let brandUserPrompt: string | null = null;

    if (mode === "brand" || ct === "brand") {
      console.log("[suggest] Brand mode detected — building brand generate prompt (mode:", mode, "ct:", ct, ")");

      // Strip tone/template instruction lines from the brief.
      // The client injects "Tone: playful and fun..." into the textarea
      // when a tone is selected, which confuses the AI. For brand mode,
      // structured ingredients carry all the information — the brief
      // should be the user's actual words, not auto-generated metadata.
      let cleanBrief = safeText;
      const briefLines = safeText.split("\n").filter((line) => {
        const trimmed = line.trim();
        if (!trimmed) return false; // drop blank lines
        if (trimmed.startsWith("Tone:") || trimmed.startsWith("Äänensävy:")) return false;
        if (trimmed.startsWith("Template:") || trimmed.startsWith("Malli:")) return false;
        return true;
      });
      if (briefLines.length > 0) {
        cleanBrief = briefLines.join("\n").trim();
      }
      // If the brief was entirely auto-generated metadata, synthesize one
      // from the ingredients so the AI has meaningful context.
      if (!cleanBrief) {
        const audienceFi = Array.isArray(audience) && audience.length > 0
          ? `kohderyhmä: ${audience.join(", ")}`
          : "";
        const msgFi = coreMessage ? `viesti: ${coreMessage}` : "";
        const atmosFi = Array.isArray(atmosphere) && atmosphere.length > 0
          ? `tunnelma: ${atmosphere.join(", ")}`
          : "";
        const parts = [audienceFi, msgFi, atmosFi].filter(Boolean);
        cleanBrief = parts.length > 0
          ? `Luo brändisisältöä — ${parts.join("; ")}`
          : "Luo brändisisältöä tälle baarille";
      }
      console.log("[suggest] Brand mode — cleaned brief:", cleanBrief.slice(0, 120));

      // Build tone instruction from the tone voice profiles.
      // The tone defaults to WARM_INVITING for brand content — the client
      // sends tone selection in a separate step; for now we use the default.
      const defaultTone: ContentTone = "WARM_INVITING";
      const toneInstruction = getTonePromptBlock(defaultTone, lang as "en" | "fi");

      const amenitiesStr = (bar.amenities as string[])?.join(", ") ?? undefined;
      const musicTagsStr = (bar.musicTags as string[])?.join(", ") ?? undefined;

      // Build the brand user prompt using the SAME proven architecture
      // as buildGeneratePrompt — bar context → creative ingredients →
      // output format → compliance. This replaces the old buildBrandPrompt
      // which used a different prompt structure that produced garbage.
      brandUserPrompt = buildBrandGeneratePrompt({
        barName: bar.name,
        barType: bar.type,
        district: bar.district,
        cityName: bar.cityName,
        priceRange: bar.priceRange,
        amenities: amenitiesStr,
        description: bar.description,
        musicTags: musicTagsStr,
        template: templateName ?? null,
        tone: defaultTone,
        toneInstruction,
        audience: (audience as string[]) ?? [],
        coreMessage: coreMessage ?? null,
        atmosphere: (atmosphere as string[]) ?? [],
        imageWorld: imageWorld ?? null,
        copyStructure: copyStructure ?? null,
        language: lang as "en" | "fi",
        numVariants: 3,
        nonce: 0,
        barId,
      });

      // System prompt: persona + compliance + variant differentiation + tone + footer
      // Same architecture as promotions ai-generate route.
      const isFi = lang === "fi";
      const variantDifferentiation = isFi
        ? `\n\nVARIAATIOIDEN EROTTELU — EHDOTTOMAN KRIITTINEN SAANTO:\nKun luot useita variantteja, JOKAISELLA on oltava AIDOSTI ERI:\n- Otsikko: eri sanat, eri rakenne, eri koukku. Ala kierrata avainsanoja.\n- Leipateksti: eri kulma. 1) TARINAKULMA (pieni tarina, hetki, muisto, narratiivi). 2) TUNNELMAKULMA (milta tuntuu, aistit, ilmapiiri, valo, aani). 3) KUTSUKULMA (puhuttelee suoraan — "sina", "tule", kutsu).\n- Aani: jokainen kuulostaa eri henkilon kirjoittamalta.\n- ALA tuota kolmea uudelleenmuotoiltua versiota samasta ideasta. Niiden on luettava kuin eri ihmisten kirjoittamina.\n- Jokaisella variantilla on ERI imagePrompt - eri kohtaus, eri perspektiivi, eri tunnelma.`
        : `\n\nVARIANT DIFFERENTIATION - ABSOLUTELY CRITICAL RULE:\nWhen generating multiple variants, EACH one MUST have GENUINELY DIFFERENT:\n- Headline: different words, different structure, different hook. Do NOT recycle keywords.\n- Body: different angle. 1) STORY ANGLE (a small story, moment, memory, narrative). 2) ATMOSPHERE ANGLE (how it feels, senses, vibe, light, sound). 3) INVITATION ANGLE (speaks directly — "you", "come", an invitation).\n- Voice: each sounds like a different person wrote it.\n- Do NOT produce three rephrasings of the same idea. They must read as if written by different people.\n- Every variant has a DIFFERENT imagePrompt - different scene, different perspective, different mood.`;
      const footerText = isFi
        ? `\nALA KOSKAAN mainitse lakiviitteita (Alkoholilaki, Valvira, compliance) otsikoissa, leipateksteissa tai toimintakehotteissa - ne ovat asiakasteksteja, eivat lakidokumentteja.\nKAIKKI teksti TAYTYY olla suomeksi. Palauta VAIN validi JSON.`
        : `\nNEVER mention legal references (Alcohol Act, Valvira, compliance) in headlines, body text, or CTAs - these are customer-facing, not legal documents.\nReturn ONLY valid JSON.`;
      const toneInstr = contentTone
        ? toneSystemInstruction(contentTone as ContentTone)
        : "";
      brandSystemPrompt = `${buildFullSystemPrompt(lang as "en" | "fi", barPositioning)}\n${variantDifferentiation}${footerText}${toneInstr ? `\n${toneInstr}` : ""}`;

      console.log("[suggest] Brand prompt built — system:", brandSystemPrompt.length, "user:", brandUserPrompt.length);
      console.log("[suggest] Brand user prompt first 200 chars:", brandUserPrompt.slice(0, 200));
    }

    // 7. Build system prompt — senior marketing persona + compliance rules
    // When contentType is specified, use the type-specific prompts instead
    let systemPrompt: string;
    let userPrompt: string;
    const isFi = lang === "fi";

    if (eventPromptResult) {
      systemPrompt = eventPromptResult.systemPrompt;
      userPrompt = eventPromptResult.userPrompt;
      console.log("[suggest] Using event prompt");
    } else if (passPromptResult) {
      systemPrompt = passPromptResult.systemPrompt;
      userPrompt = passPromptResult.userPrompt;
      console.log("[suggest] Using pass prompt");
    } else if (brandUserPrompt && brandSystemPrompt) {
      systemPrompt = brandSystemPrompt;
      userPrompt = brandUserPrompt;
      console.log("[suggest] Using brand generate prompt");
    } else {
      console.log("[suggest] Using generic route prompt (no type-specific prompt built)");
      const routeInstructions = isFi
      ? `\n\nMääritä, haluaako käyttäjä luoda TAPAHTUMAN, TARJOUKSEN, VIP-PASSIN vai MAINOSKAMPANJAN. Poimi kaikki olennaiset kentät ja tuota sisältö SUOMEKSI.

Tarjouksissa: suosi FOOD_SPECIAL- tai ruokapainotteisia tyyppejä, kun mahdollista. Ruokatarjouksilla ei ole mainosrajoituksia.
Tapahtumissa: keskity viihteeseen (musiikki, pelit, tunnelma) juomisen sijaan.
Mainoskampanjoissa: tunnista, kun käyttäjä pyytää "feature", "boost", "mainosta", "kampanjaa".

Palauta VAIN validi JSON — ei muuta tekstiä — tällä rakenteella:

{
  "inferredType": "event" | "promotion" | "pass" | "campaign",
  "confidence": 0.0-1.0,
  "title": "Kiinnostava otsikko (max 60 merkkiä) — Alkoholilain mukainen",
  "description": "Kiinnostava kuvaus (max 200 merkkiä) — Alkoholilain mukainen",
  "reasoning": "Lyhyt selitys tyypin päättelystä",`
      : `\n\nDetermine whether the user wants to create an EVENT, PROMOTION, VIP PASS, or AD CAMPAIGN. Extract all relevant fields and generate content IN ENGLISH.

For promotions: prefer FOOD_SPECIAL or non-alcohol-focused types when possible. Food promotions have no advertising restrictions.
For events: focus on the entertainment (music, games, atmosphere) rather than drinking.
For ad campaigns: infer when the user asks to "feature", "boost", "advertise", "promote my bar", or "run a campaign."

Return ONLY valid JSON with this structure — no other text:

{
  "inferredType": "event" | "promotion" | "pass" | "campaign",
  "confidence": 0.0-1.0,
  "title": "Catchy title (max 60 chars) — MUST be Finland-compliant",
  "description": "Compelling description (max 200 chars) — MUST be Finland-compliant",
  "reasoning": "Brief explanation of why you inferred this type",

  // Include for events:
  "startTime": "ISO date-time or null if not specified",
  "endTime": "ISO date-time or null",
  "maxAttendees": number or null,
  "isPrivate": boolean,

  // Include for promotions:
  "promotionType": "HAPPY_HOUR | STUDENT_DISCOUNT | LADIES_NIGHT | THEME_NIGHT | FOOD_SPECIAL | DRINK_SPECIAL | COVER_DISCOUNT | VIP_OFFER | LIVE_MUSIC_EVENT | GAME_NIGHT",
  "discountValue": number 0-100 or null,
  "startDate": "ISO date (always provide — if not specified in text, use today's date)",
  "endDate": "ISO date (always provide — if not specified, use 7 days from startDate)",
  "conditions": "Terms and conditions — compliant wording only",
  "targetAudience": "WEEKEND | WEEKDAY | STUDENTS | VIP | EVERYONE (infer from context)",

  // Include for campaigns:
  "campaignType": "FEATURED_LISTING | BANNER_AD | BOOSTED_PROMO | SPONSORED_EVENT",
  "campaignBudget": number (10-500, default 50),
  "campaignStartDate": "ISO date or null",
  "campaignEndDate": "ISO date or null",

  // Include for passes:
  "passType": "SKIP_LINE | COVER_INCLUDED | PREMIUM_ENTRY | DRINK_PACKAGE",
  "priceEuros": string or null,
  "originalPriceEuros": string or null,
  "benefits": ["benefit1", "benefit2"],
  "totalQuantity": number or null,

  // Shared
  "imageSuggestion": "Which default image category fits best: cocktails | live-music | party | beer | vip | wine | special-offer | karaoke | sports | outdoor-terrace | dj-night | bar-ambiance"
}`;

      systemPrompt = `${buildFullSystemPrompt(lang as "en" | "fi", barPositioning)}${routeInstructions}`;

      userPrompt = isFi
      ? `Ravintolan "${bar.name}" (${bar.type}-baari, ${bar.district}, ${bar.cityName}) henkilökunta kuvaili mitä he haluavat luoda:

"${text}"

HUOM: Vaikka yllä oleva kuvaus saattaa olla englanniksi, SINUN TÄYTYY tuottaa KAIKKI kentät SUOMEKSI. Otsikko, kuvaus, ehdot — kaikki suomeksi. Älä kopioi englanninkielistä tekstiä. Käännä ja luo uusi suomenkielinen sisältö.

Baarin tiedot:
- Tyyppi: ${bar.type}
- Alue: ${bar.district || ""}, ${bar.cityName || ""}
- Hintataso: ${bar.priceRange || "Kohtalainen"}
- Palvelut: ${bar.amenities?.join(", ") || "Vakiovarustelu"}
- Kuvaus: ${bar.description || "Loistava paikka nauttia illasta"}
- VIP käytössä: ${bar.vipEnabled ? "Kyllä" : "Ei"}
- Päivämäärä: ${new Date().toISOString()}

Analysoi teksti: tapahtuma, tarjous vai VIP-passi? Poimi kaikki olennaiset kentät. Tuota KAIKKI sisältö SUOMEKSI.

${buildUserReminder("fi")}`
      : `A bar staff member at "${bar.name}" (a ${bar.type} bar in ${bar.district}, ${bar.cityName}) described what they want to create:

"${text}"

Bar context:
- Type: ${bar.type}
- Location: ${bar.district || ""}, ${bar.cityName || ""}
- Price Range: ${bar.priceRange || "Moderate"}
- Amenities: ${bar.amenities?.join(", ") || "Standard bar amenities"}
- Description: ${bar.description || "A great place to enjoy nightlife"}
- VIP Available: ${bar.vipEnabled ? "Yes" : "No"}
- Current Date: ${new Date().toISOString()}

Analyze the text: event, promotion, or VIP pass? Extract all relevant fields. Generate ALL content in English.

${buildUserReminder("en")}`;
    }

    // 7b. Inject Creative Director Review into every system prompt path.
    // The event/pass/brand/generic branches above each build their own systemPrompt —
    // append the quality assurance review after all branches for consistency.
    systemPrompt += `\n${buildCreativeDirectorReview(lang as "en" | "fi")}`;

    // 7c. Inject template-specific detail fields into the user prompt.
    const fieldValuesStr = formatTemplateFieldValues(templateFields, lang as "en" | "fi");
    if (fieldValuesStr) {
      userPrompt += fieldValuesStr;
    }

    // 8. Try DeepSeek API; fall back to templates on any failure
    let result: Record<string, unknown> | null = null;
    let aiGenerated = false;
    let warning: string | undefined;
    let aiUsage: { promptTokens: number; completionTokens: number } | null = null;

    if (useAI) {
      const totalPromptChars = systemPrompt.length + userPrompt.length;
      const estimatedTokens = Math.round(totalPromptChars / 4);
      console.log(`[suggest] Sending to DeepSeek — system: ${systemPrompt.length}c, user: ${userPrompt.length}c, total: ${totalPromptChars}c (~${estimatedTokens}t)`);

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
            temperature: (mode === "brand" || ct === "brand") ? 0.95 : 0.7,
            max_tokens: (mode === "brand" || ct === "brand") ? 3000 : 1000,
          }),
          signal: AbortSignal.timeout((mode === "brand" || ct === "brand") ? 30_000 : 15_000),
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
            const isBrandResponse = (mode === "brand" || ct === "brand");
            if (isBrandResponse) {
              // Robust parsing — same strategy as promotions ai-generate route.
              // Step 1: Strip markdown code blocks
              let jsonText = aiResponse.trim();
              const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
              if (codeBlockMatch) {
                jsonText = codeBlockMatch[1].trim();
                console.log("[suggest] Stripped markdown code block from brand response");
              }

              // Step 2: Try array parse with trailing comma cleanup
              let brandVariants: Record<string, unknown>[] = [];
              if (jsonText.startsWith("[")) {
                const arrayMatch = jsonText.match(/\[[\s\S]*\]/);
                if (arrayMatch) {
                  let cleanJson = arrayMatch[0].replace(/,(\s*[}\]])/g, "$1");
                  try {
                    const parsed = JSON.parse(cleanJson);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                      brandVariants = parsed;
                      console.log("[suggest] Brand array parse —", brandVariants.length, "variants");
                    }
                  } catch (arrayErr) {
                    console.log("[suggest] Brand array parse failed:", (arrayErr as Error).message);
                  }
                }
              }

              // Step 3: Fall back to extractJsonObjects for malformed responses
              if (brandVariants.length === 0) {
                const objectMatches = extractJsonObjects(jsonText, { maxObjects: 5, maxLength: 50_000 });
                for (const objStr of objectMatches) {
                  try {
                    const parsed = JSON.parse(objStr);
                    brandVariants.push(parsed);
                  } catch {
                    // Skip malformed objects
                  }
                }
                if (brandVariants.length > 0) {
                  console.log("[suggest] Extracted", brandVariants.length, "brand objects via extractJsonObjects");
                }
              }

              // Step 4: Fall back to object format (old prompt compatibility)
              if (brandVariants.length === 0) {
                const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
                const parsed = jsonMatch
                  ? JSON.parse(jsonMatch[0])
                  : JSON.parse(jsonText);
                if (Array.isArray((parsed as Record<string, unknown>).variants)) {
                  brandVariants = (parsed as Record<string, unknown>).variants as Record<string, unknown>[];
                } else {
                  brandVariants = [parsed as Record<string, unknown>];
                }
              }

              // Step 5: Wrap for response builder
              if (brandVariants.length > 0) {
                result = { variants: brandVariants };
                aiGenerated = true;
                console.log("[suggest] Brand response —", brandVariants.length, "variant(s) parsed:", brandVariants.map((v) => ((v.headline as string) || (v.title as string) || "").slice(0, 50)));
              } else {
                warning = "AI response could not be processed. Using template-based suggestion instead.";
              }
            } else {
              const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
              result = jsonMatch
                ? JSON.parse(jsonMatch[0])
                : JSON.parse(aiResponse);
              aiGenerated = true;
              console.log("[suggest] AI generated type:", result?.inferredType);
              console.log("[suggest] AI result keys:", Object.keys(result as object).join(", "));
            }
            if (aiGenerated && result) {
              console.log("[suggest] AI result has variants?:", !!(result as Record<string, unknown>).variants, "variants type:", typeof (result as Record<string, unknown>).variants);
              if ((result as Record<string, unknown>).variants && Array.isArray((result as Record<string, unknown>).variants)) {
                console.log("[suggest] Variant count:", (result as Record<string, unknown> & { variants: unknown[] }).variants.length);
              }
            }
            console.log("[suggest] AI raw response first 500 chars:", aiResponse.slice(0, 500));
          } catch {
            warning = "AI response could not be processed. Using template-based suggestion instead.";
          }
        } else {
          const errorText = await response.text().catch(() => "(could not read error body)");
          console.error(`[suggest] DeepSeek API error — status ${response.status}: ${errorText.slice(0, 500)}`);
          warning = `AI service returned error ${response.status}. Using template-based suggestion instead.`;
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[suggest] DeepSeek fetch/network error: ${errMsg}`);
        warning = `AI service unavailable (${errMsg.slice(0, 100)}). Using template-based suggestion instead.`;
      }
    } else {
      warning = "AI service is not configured. Suggestions are generated from templates. Set DEEPSEEK_API_KEY to enable AI suggestions.";
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
        metadata: { step: "suggest", language: lang },
      }).catch(() => {});
    }

    // 9. Fall back to template-based suggestion if AI didn't produce results
    if (!result) {
      result = getFallbackSuggestion(
        { name: bar.name, type: bar.type },
        text,
      ) as unknown as Record<string, unknown>;
    }

    // 10. Validate and normalize inferred type
    // When contentType is explicitly specified, use it instead of AI inference
    let inferredType: string;
    if (ct !== "auto") {
      inferredType = ct;
    } else {
      const validTypes = ["event", "promotion", "pass", "campaign"];
      inferredType = validTypes.includes(result.inferredType as string)
        ? (result.inferredType as string)
        : "promotion";
    }

    // 11. Build response with type-specific fields
    const isBrandMode = mode === "brand" || ct === "brand";

    // Hoist bar fields for use in nested functions (TypeScript narrowing)
    const barName = bar.name;
    const barDistrict = bar.district;
    const barCity = bar.cityName;
    const barTypeStr2 = bar.type;

    // Build fallback brand variants from bar info + ingredients when AI
    // doesn't return the expected { variants: [...] } structure.
    function buildBrandFallbackVariants(): Array<Record<string, unknown>> {
      const district = barDistrict ? `, ${barDistrict}` : "";
      const city = barCity || "";
      const typeStr = barTypeStr2.toLowerCase().replace(/_/g, " ");
      const worldFi = typeof imageWorld === "string" ? imageWorld : "venue";
      const atmosphereFi = Array.isArray(atmosphere) && atmosphere.length > 0
        ? atmosphere.join(", ")
        : "lämmin ja kutsuva";

      const fi2 = lang === "fi";
      return [
        {
          headline: fi2 ? `${barName} — ${city}${district}` : `${barName} — ${city}${district}`,
          body: fi2
            ? `Tutustu ${barName}n tunnelmaan. ${atmosphereFi} ilmapiiri — täällä ilta on aina hyvä.`
            : `Discover the atmosphere at ${barName}. A ${atmosphereFi} vibe — the evening is always good here.`,
          cta: fi2 ? "Tule käymään" : "Come visit",
          imagePrompt: `warm inviting ${typeStr} interior with soft lighting and ${worldFi} ambiance`,
        },
        {
          headline: fi2 ? `Illanviettoa ${city}ssa` : `An evening in ${city}`,
          body: fi2
            ? `Kaipaatko jotain uutta? ${barName} tarjoaa ${atmosphereFi} elämyksen ${city}n sydämessä.`
            : `Looking for something new? ${barName} offers a ${atmosphereFi} experience in the heart of ${city}.`,
          cta: fi2 ? "Varaa pöytä" : "Book a table",
          imagePrompt: `cozy ${typeStr} corner with ambient lighting, ${worldFi} mood, no people visible`,
        },
        {
          headline: fi2 ? `Täällä on hyvä olla` : `A place to be`,
          body: fi2
            ? `${barName} — ${city}n ${atmosphereFi} kohtaamispaikka. Tule sellaisena kuin olet.`
            : `${barName} — ${city}'s ${atmosphereFi} meeting spot. Come as you are.`,
          cta: fi2 ? "Löydä meidät" : "Find us",
          imagePrompt: `${typeStr} details with ${worldFi} aesthetic, warm tones, shallow depth of field`,
        },
      ];
    }

    const response_: Record<string, unknown> = {
      inferredType,
      aiGenerated,
      ...(warning && { warning }),
      mode: isBrandMode ? "brand" : "promotional",
      confidence: typeof result.confidence === "number" ? result.confidence : 0.8,
      ...(isBrandMode
        ? (() => {
            // Brand mode output: 3 variants with headline + body + cta + imagePrompt
            // AI returns { variants: [...] } with the new prompt format; fall back
            // to intelligent template-based variants if AI didn't produce brand content
            // Use bar name as ultimate headline fallback (safeText may be empty in brand mode)
            const headlineFallback = safeText ? safeText.slice(0, 60) : barName;
            let brandVariants: Array<Record<string, unknown>>;

            if (Array.isArray(result.variants) && result.variants.length > 0) {
              brandVariants = (result.variants as Array<Record<string, unknown>>).map((v) => ({
                headline: (v.headline as string) || headlineFallback,
                body: (v.body as string) || "",
                cta: (v.cta as string) || "",
                imagePrompt: (v.imagePrompt as string) || "",
              }));
            } else if ((result.headline as string) || (result.title as string)) {
              // AI returned generic format with some content fields — wrap as single variant
              console.log("[suggest] Brand mode fallback: AI returned generic format, wrapping as single variant");
              brandVariants = [{
                headline: (result.headline as string) || (result.title as string) || headlineFallback,
                body: (result.body as string) || (result.description as string) || "",
                cta: (result.cta as string) || "",
                imagePrompt: (result.imageSuggestion as string) || "",
              }];
            } else {
              // No proper content at all — use ingredient-based fallback variants
              console.log("[suggest] Brand mode fallback: no content fields in AI response, using template variants");
              warning = warning || (lang === "fi"
                ? "AI tuotti yleismuotoisen vastauksen — näytetään brändipohjaiset ehdotukset."
                : "AI returned a generic response — showing brand-based suggestions.");
              brandVariants = buildBrandFallbackVariants();
            }

            // ---- POST-PROCESSING: same steps as promotions ai-generate route ----

            // 1. Compliance scanning per variant
            const complianceResults: Array<{
              variantIndex: number;
              violations: Array<{ rule: string; keyword: string; severity: string; message: string; suggestion: string }>;
            }> = [];
            for (let i = 0; i < brandVariants.length; i++) {
              const scan = scanCompliance(
                (brandVariants[i].headline as string) || "",
                (brandVariants[i].body as string) || "",
                { barName: bar.name },
              );
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
            console.log("[suggest] Brand compliance scan —", complianceResults.length, "variant(s) with violations");

            // 2. Image chip inference per variant
            const barForChips = {
              name: bar.name,
              type: bar.type,
              description: bar.description ?? undefined,
              district: bar.district ?? undefined,
              priceRange: bar.priceRange ?? undefined,
              amenities: (bar.amenities as string[])?.join(", ") ?? undefined,
            };
            const variantsWithChips = brandVariants.map((v) => ({
              ...v,
              imageChips: inferImageChips(
                safeText || "",
                barForChips,
                {
                  title: (v.headline as string) || "",
                  description: (v.body as string) || "",
                  type: "brand",
                  discount: null,
                },
              ),
            }));

            return {
              variants: variantsWithChips,
              ...(complianceResults.length > 0 && { complianceResults }),
            };
          })()
        : {
            // Standard output
            title: result.title || result.name || text.slice(0, 60),
            description: result.description || "",
          }),
      reasoning: result.reasoning || `Based on your description, this appears to be a ${inferredType}.`,
      imageSuggestion: result.imageSuggestion || "bar-ambiance",
    };

    // Add type-specific fields
    if (isBrandMode) {
      // Brand mode doesn't need promotion/event/pass-specific fields
      response_.imageWorld = imageWorld || "venue";
      response_.atmosphere = atmosphere || [];
      response_.audience = audience || [];
      response_.coreMessage = coreMessage || "best-place";
      response_.copyStructure = copyStructure || "direct";
    } else if (inferredType === "event") {
      response_.startTime = result.startTime || null;
      response_.endTime = result.endTime || null;
      response_.maxAttendees = result.maxAttendees || null;
      response_.isPrivate = result.isPrivate || false;
      response_.entryFee = result.entryFee || null;
      response_.eventCategory = result.eventCategory || null;
    } else if (inferredType === "promotion") {
      response_.promotionType = result.promotionType || "DRINK_SPECIAL";
      response_.discountValue = result.discountValue || null;
      response_.startDate = result.startDate || new Date().toISOString();
      response_.endDate = result.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      response_.conditions = result.conditions || "";
      response_.targetAudience = result.targetAudience || "EVERYONE";
    } else if (inferredType === "campaign") {
      response_.campaignType = result.campaignType || "FEATURED_LISTING";
      response_.campaignBudget = typeof result.campaignBudget === "number" ? result.campaignBudget : 50;
      response_.campaignStartDate = result.campaignStartDate || null;
      response_.campaignEndDate = result.campaignEndDate || null;
    } else if (inferredType === "pass") {
      response_.passType = result.passCategory || result.passType || "SKIP_LINE";
      response_.priceEuros = result.priceEuros || (typeof result.price === "number" ? String(result.price) : null);
      response_.originalPriceEuros = result.originalPriceEuros || null;
      response_.benefits = result.benefits || [];
      response_.totalQuantity = result.maxQuantity || result.totalQuantity || null;
      response_.validityPeriod = result.validityPeriod || null;
    }

    return NextResponse.json({
      success: true,
      ...response_,
    });
  } catch (error) {
    return handleApiError(error, "AI suggest");
  }
}
