import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isBarStaffToken } from "@/lib/auth";
import { prisma } from "@/lib/database";
import { buildGeneratePrompt } from "@/lib/compliance/prompts";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

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

    const body = await request.json();
    const { prompt, type, targetAudience } = body;

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

    // 5. Check if DeepSeek API key is configured
    if (!DEEPSEEK_API_KEY) {
      console.error("DEEPSEEK_API_KEY is not set");
      return NextResponse.json(
        { error: "AI service is not configured. Please contact support." },
        { status: 500 },
      );
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
      targetAudience || undefined,
    );

    const systemPrompt = `You are a marketing expert specializing in bar and nightlife promotions.
Create engaging, professional promotions for bars. Return ONLY valid JSON.`;

    // 7. Call DeepSeek API
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
        temperature: 0.8,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepSeek API error:", response.status, errorText);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // 8. Parse JSON from AI response
    let generatedPromotion;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      generatedPromotion = jsonMatch
        ? JSON.parse(jsonMatch[0])
        : JSON.parse(aiResponse);
    } catch (e) {
      console.error("Failed to parse AI response:", aiResponse);
      return NextResponse.json(
        { error: "AI returned invalid format. Please try again." },
        { status: 500 },
      );
    }

    // 9. Validate the generated fields
    const validTypes = [
      "HAPPY_HOUR",
      "DRINK_SPECIAL",
      "FOOD_SPECIAL",
      "LADIES_NIGHT",
      "THEME_NIGHT",
      "VIP_OFFER",
      "COVER_DISCOUNT",
    ];

    // 10. Return the generated promotion
    return NextResponse.json({
      success: true,
      promotion: {
        title: generatedPromotion.title || `${bar.name} Special`,
        description:
          generatedPromotion.description || `Special offer at ${bar.name}`,
        type: validTypes.includes(generatedPromotion.type)
          ? generatedPromotion.type
          : "DRINK_SPECIAL",
        discount:
          typeof generatedPromotion.discount === "number"
            ? generatedPromotion.discount
            : null,
        callToAction: generatedPromotion.callToAction || "View Offer",
        accentColor: generatedPromotion.accentColor || "#8b5cf6",
        conditions:
          generatedPromotion.conditions || "Valid with valid ID. Terms apply.",
      },
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
