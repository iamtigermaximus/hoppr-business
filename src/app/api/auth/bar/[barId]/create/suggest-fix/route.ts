import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isBarStaffToken } from "@/lib/auth";
import { scanCompliance } from "@/lib/compliance-engine";
import { buildFixPrompt } from "@/lib/compliance/prompts";
import { checkRateLimit, RateLimits } from "@/lib/rate-limiter";

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

    // 2. Rate limit: 10 AI calls per minute per bar
    const rateCheck = checkRateLimit(`ai-suggest-fix:${barId}`, RateLimits.AI);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `AI fix suggestions rate limit reached. Retry in ${rateCheck.retryAfter}s.` },
        { status: 429 },
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const { title, description, violations, contentType } = body;

    if (!title || !violations || !Array.isArray(violations)) {
      return NextResponse.json(
        { error: "Missing required fields: title, violations" },
        { status: 400 },
      );
    }

    // 3. Check if DeepSeek API key is configured
    if (!DEEPSEEK_API_KEY) {
      console.error("DEEPSEEK_API_KEY is not set");
      return NextResponse.json(
        { error: "AI service is not configured" },
        { status: 500 },
      );
    }

    // 4. Build prompt using canonical rules and call DeepSeek
    const systemPrompt = buildFixPrompt(
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
          {
            role: "system",
            content:
              "You are a Finnish alcohol marketing compliance expert. Return ONLY valid JSON arrays.",
          },
          { role: "user", content: systemPrompt },
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

    // 5. Parse JSON from AI response
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

    // 6. Re-scan each alternative through compliance before returning
    const validatedAlternatives = alternatives
      .map((alt: { title: string; description: string; explanation: string }) => {
        const result = scanCompliance(alt.title, alt.description);
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
    console.error("Suggest-fix error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate alternatives",
      },
      { status: 500 },
    );
  }
}
