import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isBarStaffToken } from "@/lib/auth";
import { checkRateLimit, RateLimits } from "@/lib/rate-limiter";
import { handleApiError } from "@/lib/api-error";
import { logUsage } from "@/lib/credit-tracker";

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

    // 2. Rate limit
    const rateCheck = await checkRateLimit(`ai-rephrase:${barId}`, RateLimits.AI);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `AI rephrase rate limit reached. Retry in ${rateCheck.retryAfter}s.` },
        { status: 429 },
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const {
      text,
      field,
      targetLength,
      language = "en",
    } = body as {
      text: string;
      field: "title" | "description" | "cta";
      targetLength: number;
      language?: string;
    };

    if (!text || !field || !targetLength) {
      return NextResponse.json(
        { error: "Missing required fields: text, field, targetLength" },
        { status: 400 },
      );
    }

    if (text.length <= targetLength) {
      return NextResponse.json({ text, alreadyFit: true });
    }

    // 4. Build the rephrase prompts
    const fieldLabel =
      field === "title" ? "headline" : field === "description" ? "body copy" : "call to action";
    const langLabel = language === "fi" ? "Finnish" : "English";

    const systemPrompt = [
      "You are a sharp copywriting editor. Your job is to shorten text to fit within a character limit.",
      "Rules:",
      "- Preserve the hook, emotional punch, and key message.",
      "- Keep the same voice and tone — just tighter.",
      "- If it's a headline/title, remove filler words first.",
      "- If it's body copy, cut secondary details before primary ones.",
      "- If it's a CTA, make it punchier but keep the urgency/offer.",
      "- Return ONLY the shortened text. No quotes, no explanation, no preamble.",
    ].join("\n");

    const userPrompt = [
      `Shorten this ${fieldLabel} to fit within ${targetLength} characters.`,
      `Language: ${langLabel}.`,
      "",
      `Current length: ${text.length} chars — needs to be ≤ ${targetLength}.`,
      `Original: "${text}"`,
    ].join("\n");

    // 5. Call DeepSeek
    let rephrasedText = text;
    let aiUsage: { promptTokens: number; completionTokens: number } | null = null;

    const apiKey = DEEPSEEK_API_KEY;
    if (apiKey) {
      try {
        const response = await fetch(DEEPSEEK_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.3, // low temp — this is editing, not creative generation
            max_tokens: 200,
          }),
          signal: AbortSignal.timeout(10_000),
        });

        if (response.ok) {
          const data = await response.json();
          const raw = data.choices[0].message.content?.trim() ?? text;

          if (data.usage) {
            aiUsage = {
              promptTokens: data.usage.prompt_tokens || 0,
              completionTokens: data.usage.completion_tokens || 0,
            };
          }

          // Clean up: strip any stray quotes or markdown
          rephrasedText = raw
            .replace(/^["']|["']$/g, "")
            .replace(/^["']|["']$/g, "") // double-check
            .trim();

          // If the AI returned something wildly different or empty, fall back
          if (!rephrasedText || rephrasedText.length > text.length * 1.5) {
            console.warn("[rephrase] AI returned suspicious result, using original");
            rephrasedText = text;
          }
        } else {
          console.warn("[rephrase] DeepSeek call failed:", response.status);
        }
      } catch (fetchErr) {
        console.warn("[rephrase] DeepSeek fetch error:", (fetchErr as Error).message);
      }
    } else {
      console.warn("[rephrase] DEEPSEEK_API_KEY not configured");
    }

    // 6. Log credit usage (non-blocking)
    if (aiUsage) {
      logUsage({
        provider: "deepseek",
        endpoint: "chat/completions",
        tokensIn: aiUsage.promptTokens,
        tokensOut: aiUsage.completionTokens,
        barId,
        metadata: { step: "rephrase", field, targetLength },
      }).catch(() => {});
    }

    console.log(
      `[rephrase] bar=${barId} field=${field} ${text.length}→${rephrasedText.length} chars target=${targetLength}`,
    );

    return NextResponse.json({
      text: rephrasedText,
      originalLength: text.length,
      newLength: rephrasedText.length,
      targetLength,
    });
  } catch (error) {
    return handleApiError(error, "AI rephrase");
  }
}
