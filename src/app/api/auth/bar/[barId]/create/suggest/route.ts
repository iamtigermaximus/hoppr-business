import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isBarStaffToken } from "@/lib/auth";
import { prisma } from "@/lib/database";
import {
  buildComplianceSystemPrompt,
  buildUserReminder,
} from "@/lib/compliance/prompts";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

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

    // 2. Parse request body
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing required field: text" },
        { status: 400 },
      );
    }

    // 3. Fetch bar context
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
      },
    });

    if (!bar) {
      return NextResponse.json({ error: "Bar not found" }, { status: 404 });
    }

    // 4. Check if DeepSeek API key is configured
    if (!DEEPSEEK_API_KEY) {
      console.error("DEEPSEEK_API_KEY is not set");
      return NextResponse.json(
        { error: "AI service is not configured. Please contact support." },
        { status: 500 },
      );
    }

    // 5. Build AI prompt — compliance rules injected from canonical source
    const complianceRules = buildComplianceSystemPrompt();

    const systemPrompt = `You are an expert at understanding bar and nightlife content. Given a natural language description, determine whether the user wants to create an EVENT, PROMOTION, VIP PASS, or AD CAMPAIGN. Then extract all relevant fields.

${complianceRules}

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

    const userPrompt = `A bar staff member at "${bar.name}" (a ${bar.type} bar in ${bar.district}, ${bar.cityName}) described what they want to create:

"${text}"

Bar context:
- Type: ${bar.type}
- Price Range: ${bar.priceRange || "Moderate"}
- Amenities: ${bar.amenities?.join(", ") || "Standard bar amenities"}
- Description: ${bar.description || "A great place to enjoy nightlife"}
- VIP Available: ${bar.vipEnabled ? "Yes" : "No"}
- Current Date: ${new Date().toISOString()}

Analyze the text and determine: event, promotion, or VIP pass? Extract all relevant fields.

${buildUserReminder()}`;

    // 6. Call DeepSeek API
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
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepSeek API error:", response.status, errorText);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // 7. Parse JSON from AI response
    let result;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      result = jsonMatch
        ? JSON.parse(jsonMatch[0])
        : JSON.parse(aiResponse);
    } catch {
      console.error("Failed to parse AI response:", aiResponse);
      return NextResponse.json(
        { error: "AI returned invalid format. Please try again." },
        { status: 500 },
      );
    }

    // 8. Validate and normalize inferred type
    const validTypes = ["event", "promotion", "pass", "campaign"];
    const inferredType = validTypes.includes(result.inferredType)
      ? result.inferredType
      : "promotion";

    // 9. Build response with type-specific fields
    const response_: Record<string, unknown> = {
      inferredType,
      confidence: typeof result.confidence === "number" ? result.confidence : 0.8,
      title: result.title || text.slice(0, 60),
      description: result.description || "",
      reasoning: result.reasoning || `Based on your description, this appears to be a ${inferredType}.`,
      imageSuggestion: result.imageSuggestion || "bar-ambiance",
    };

    // Add type-specific fields
    if (inferredType === "event") {
      response_.startTime = result.startTime || null;
      response_.endTime = result.endTime || null;
      response_.maxAttendees = result.maxAttendees || null;
      response_.isPrivate = result.isPrivate || false;
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
      response_.passType = result.passType || "SKIP_LINE";
      response_.priceEuros = result.priceEuros || null;
      response_.originalPriceEuros = result.originalPriceEuros || null;
      response_.benefits = result.benefits || [];
      response_.totalQuantity = result.totalQuantity || null;
    }

    return NextResponse.json({
      success: true,
      ...response_,
    });
  } catch (error) {
    console.error("AI suggest error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate suggestions",
      },
      { status: 500 },
    );
  }
}
