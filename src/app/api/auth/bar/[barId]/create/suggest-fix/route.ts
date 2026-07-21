import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isBarStaffToken } from "@/lib/auth";
import { prisma } from "@/lib/database";
import { scanCompliance } from "@/lib/compliance-engine";
import { buildFixPrompt, buildFullSystemPrompt } from "@/lib/compliance/prompts";
import { type BarPositioning, buildCreativeDirectorReview } from "@/lib/compliance/persona";
import { checkRateLimit, RateLimits } from "@/lib/rate-limiter";
import { handleApiError } from "@/lib/api-error";
import { getSeasonalBrief } from "@/lib/calendar/finnish-calendar";

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
    const rateCheck = await checkRateLimit(`ai-suggest-fix:${barId}`, RateLimits.AI);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `AI fix suggestions rate limit reached. Retry in ${rateCheck.retryAfter}s.` },
        { status: 429 },
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const { title, description, violations, contentType, language = "en" } = body;

    if (!title || !violations || !Array.isArray(violations)) {
      return NextResponse.json(
        { error: "Missing required fields: title, violations" },
        { status: 400 },
      );
    }

    // Validate language
    const validLanguages = ["en", "fi"];
    const lang = validLanguages.includes(language) ? language : "en";

    // 4. Check if DeepSeek API key is configured
    if (!DEEPSEEK_API_KEY) {
      console.error("DEEPSEEK_API_KEY is not set");
      return NextResponse.json(
        { error: "AI service is not configured" },
        { status: 500 },
      );
    }

    // 5. Fetch bar context for persona positioning
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
      },
    });

    if (!bar) {
      return NextResponse.json({ error: "Bar not found" }, { status: 404 });
    }

    // Build bar positioning for the senior marketing persona
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
      seasonalContext: getSeasonalBrief(),
    };

    // 6. Build system prompt — senior marketing persona + compliance rules
    const systemPrompt = buildFullSystemPrompt(lang as "en" | "fi", barPositioning) + `\n${buildCreativeDirectorReview(lang as "en" | "fi")}`;

    // 7. Build fix prompt (user message) using canonical rules and call DeepSeek
    const userPrompt = buildFixPrompt(
      title,
      description || "",
      violations,
      contentType || "promotion",
    );

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
        temperature: 0.7,
        max_tokens: 1200,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepSeek API error:", response.status, errorText);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // 8. Parse JSON from AI response
    let alternatives;
    try {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      alternatives = jsonMatch
        ? JSON.parse(jsonMatch[0])
        : JSON.parse(aiResponse);
    } catch {
      console.error("Failed to parse AI response:", aiResponse);
      return NextResponse.json(
        { error: "AI returned invalid format. Please try again." },
        { status: 500 },
      );
    }

    if (!Array.isArray(alternatives) || alternatives.length === 0) {
      return NextResponse.json(
        { error: "AI did not generate valid alternatives" },
        { status: 500 },
      );
    }

    // 9. Re-scan each alternative through compliance before returning
    const validatedAlternatives = alternatives
      .map((alt: { title: string; description: string; explanation: string }) => {
        const result = scanCompliance(alt.title, alt.description, { barName: bar.name });
        // Only keep alternatives that are compliant or have only medium/low violations
        const hasHighViolations = result.violations.some(
          (v) => v.severity === "high",
        );
        return {
          title: alt.title,
          description: alt.description || "",
          explanation: alt.explanation || "AI-generated compliant alternative",
          compliance: result,
          isCompliant: !hasHighViolations,
        };
      })
      .filter((alt) => alt.isCompliant);

    if (validatedAlternatives.length === 0) {
      return NextResponse.json(
        {
          alternatives: alternatives.slice(0, 2).map(
            (alt: { title: string; description: string; explanation: string }) => ({
              title: alt.title,
              description: alt.description || "",
              explanation: alt.explanation || "AI-generated alternative",
            }),
          ),
          warning:
            "Generated alternatives could not be fully validated. Review before publishing.",
        },
        { status: 200 },
      );
    }

    return NextResponse.json({
      success: true,
      alternatives: validatedAlternatives.map((alt) => ({
        title: alt.title,
        description: alt.description,
        explanation: alt.explanation,
      })),
    });
  } catch (error) {
    return handleApiError(error, "Suggest-fix");
  }
}
