import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isBarStaffToken } from "@/lib/auth";
import { checkRateLimit, RateLimits } from "@/lib/rate-limiter";
import { handleApiError } from "@/lib/api-error";
import { logUsage } from "@/lib/credit-tracker";
import { extractJsonObjects } from "@/lib/json-extractor";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

// ---- Instruction categories for smarter prompt routing ----

type InstructionCategory =
  | "shorter" | "bolder" | "softer" | "different_hook" | "more_urgency"
  | "simplify" | "more_playful" | "more_premium" | "more_casual"
  | "combine" | "custom";

function categorizeInstruction(instruction: string): InstructionCategory {
  const lower = instruction.toLowerCase();

  if (/shorter|lyhyempi|condense|tiivi|lyhenn/i.test(lower)) return "shorter";
  if (/bolder|rohke|assertive|vahve/i.test(lower)) return "bolder";
  if (/softer|pehme|gentle|inviting|kutsu/i.test(lower)) return "softer";
  if (/different hook|eri kouk|new hook|toinen ots|uusi ots/i.test(lower)) return "different_hook";
  if (/urgency|kiire|fomo|scarcity|deadline|rajoit|paine/i.test(lower)) return "more_urgency";
  if (/simplify|yksinkert|plain|selke/i.test(lower)) return "simplify";
  if (/playful|leikkis|witty|hausk|humor/i.test(lower)) return "more_playful";
  if (/premium|luxury|elevated|ylell|eksklus|hienost/i.test(lower)) return "more_premium";
  if (/casual|rento|conversational|arkik|puhek/i.test(lower)) return "more_casual";
  if (/combine|yhdist|merge|blend/i.test(lower)) return "combine";

  return "custom";
}

// ---- Field-specific guidance per instruction category ----

const CATEGORY_GUIDANCE: Record<InstructionCategory, string> = {
  shorter: "Focus on the description/body text. Cut filler words, merge sentences, remove secondary details. Keep the hook and CTA intact unless they also need trimming. Target: 30-50% shorter while preserving the message.",
  bolder: "Use more assertive, confident language. Replace hedges ('might', 'could', 'perhaps') with conviction. Use stronger verbs. Punchier sentence starts. Apply across all fields.",
  softer: "Use warmer, more inviting language. Replace commanding CTAs with welcoming ones. Soften the tone without losing the offer. Apply across all fields.",
  different_hook: "Rewrite ONLY the title/headline. Use a completely different hook pattern — if the current one is a question, try a statement. If it's a list, try a contradiction. If it's a story, try a bold claim. Keep it under 40 characters.",
  more_urgency: "Add time pressure or scarcity signals. Focus on the CTA and the tail of the description. Use phrases like 'limited time', 'tonight only', 'last chance', 'before it's gone'. Don't invent fake deadlines — imply natural urgency.",
  simplify: "Use shorter words, simpler sentence structures. Lower the reading level by 2-3 grade levels. Target: every word should be understandable by a non-native speaker. Apply across all fields.",
  more_playful: "Add wit, wordplay, or humor. Use unexpected word choices, puns if they work in the language, rhythmic phrasing. Don't force it — if the content doesn't support playfulness, add just a touch.",
  more_premium: "Elevate the language. Use sophisticated but not pretentious vocabulary. Emphasize exclusivity, craft, quality. Replace bargain/free language with value/experience language.",
  more_casual: "Make it conversational and friendly. Use contractions, colloquial phrasing, direct address ('you', 'your'). Sound like you're texting a friend about something exciting.",
  combine: "Analyze the two pieces mentioned in the instruction and create a fusion. Take the best element from each and blend them into one coherent version. If the instruction names specific variants/fields, respect those references.",
  custom: "Apply the exact instruction as stated. Be precise — don't over-interpret. If the instruction targets a specific field, only change that field.",
};

function buildRefineSystemPrompt(language: string): string {
  const isFi = language === "fi";

  return [
    "You are an expert copywriting editor. Your task is to apply a refinement instruction to existing content.",
    "",
    "CRITICAL RULES:",
    "- ONLY change what the instruction asks for. Keep everything else IDENTICAL to the original.",
    "- Return a single JSON object with exactly these fields: { \"title\": \"...\", \"description\": \"...\", \"callToAction\": \"...\" }",
    "- Never invent new offers, discounts, dates, prices, or facts that aren't in the original.",
    "- Preserve the original language — if the input is in Finnish, output in Finnish.",
    "- If the instruction asks for something that doesn't make sense for the content, make the smallest reasonable change and keep the rest intact.",
    "- Do NOT wrap the JSON in markdown code blocks. Return raw JSON only.",
    "",
    isFi
      ? "Säilytä alkoholilainsäädännön vaatimukset: ei alaikäisyyttä, ei liiallista juomista, ei alkoholia pääasiana, ei terveysväitteitä."
      : "Maintain alcohol law compliance: no underage references, no excessive drinking, no alcohol as main subject, no health claims.",
  ].join("\n");
}

function buildRefineUserPrompt(
  title: string,
  description: string,
  callToAction: string,
  instruction: string,
  category: InstructionCategory,
  language: string,
): string {
  const guidance = CATEGORY_GUIDANCE[category];
  const fieldHint =
    category === "different_hook"
      ? " (APPLY TO TITLE ONLY)"
      : category === "more_urgency"
        ? " (APPLY TO CTA AND DESCRIPTION TAIL)"
        : category === "shorter"
          ? " (APPLY TO DESCRIPTION PRIMARILY)"
          : "";

  return [
    `REFINEMENT INSTRUCTION${fieldHint}: "${instruction}"`,
    "",
    `Guidance: ${guidance}`,
    "",
    "ORIGINAL CONTENT:",
    `title: "${title}"`,
    `description: "${description}"`,
    `callToAction: "${callToAction}"`,
    "",
    `Language: ${language === "fi" ? "Finnish" : "English"}`,
    "",
    "Return ONLY a JSON object with the refined title, description, and callToAction.",
  ].join("\n");
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

    // 2. Rate limit
    const rateCheck = await checkRateLimit(`ai-refine:${barId}`, RateLimits.AI);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `AI refine rate limit reached. Retry in ${rateCheck.retryAfter}s.` },
        { status: 429 },
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const {
      title = "",
      description = "",
      callToAction = "",
      instruction,
      language = "en",
    } = body as {
      title?: string;
      description?: string;
      callToAction?: string;
      instruction: string;
      language?: string;
    };

    if (!instruction || !instruction.trim()) {
      return NextResponse.json(
        { error: "Missing required field: instruction" },
        { status: 400 },
      );
    }

    // 4. Categorize the instruction and build prompts
    const category = categorizeInstruction(instruction.trim());
    const systemPrompt = buildRefineSystemPrompt(language);
    const userPrompt = buildRefineUserPrompt(
      title, description, callToAction,
      instruction.trim(), category, language,
    );

    console.log(`[refine] bar=${barId} category=${category} instruction="${instruction.trim().slice(0, 60)}"`);

    // 5. Call DeepSeek
    let refinedTitle = title;
    let refinedDescription = description;
    let refinedCta = callToAction;
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
            temperature: 0.4, // low-mid temp — creative refinement but not wild
            max_tokens: 600,
          }),
          signal: AbortSignal.timeout(12_000),
        });

        if (response.ok) {
          const data = await response.json();
          const raw = data.choices[0].message.content?.trim() ?? "";

          if (data.usage) {
            aiUsage = {
              promptTokens: data.usage.prompt_tokens || 0,
              completionTokens: data.usage.completion_tokens || 0,
            };
          }

          // Parse the JSON response
          try {
            // Strip potential markdown code blocks
            let jsonText = raw;
            const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (codeBlockMatch) {
              jsonText = codeBlockMatch[1].trim();
            }

            // Try direct parse first
            let parsed: Record<string, unknown> | null = null;
            try {
              parsed = JSON.parse(jsonText);
            } catch {
              // Fall back to extractJsonObjects
              const objects = extractJsonObjects(jsonText, { maxObjects: 1, maxLength: 5000 });
              if (objects.length > 0) {
                parsed = JSON.parse(objects[0]);
              }
            }

            if (parsed && typeof parsed === "object") {
              if (typeof parsed.title === "string" && parsed.title.trim()) {
                refinedTitle = parsed.title.trim();
              }
              if (typeof parsed.description === "string" && parsed.description.trim()) {
                refinedDescription = parsed.description.trim();
              }
              if (typeof parsed.callToAction === "string" && parsed.callToAction.trim()) {
                refinedCta = parsed.callToAction.trim();
              }
            } else {
              console.warn("[refine] Could not parse JSON from AI response");
            }
          } catch (parseErr) {
            console.warn("[refine] JSON parse error:", (parseErr as Error).message);
          }
        } else {
          console.warn("[refine] DeepSeek call failed:", response.status);
        }
      } catch (fetchErr) {
        console.warn("[refine] DeepSeek fetch error:", (fetchErr as Error).message);
      }
    } else {
      console.warn("[refine] DEEPSEEK_API_KEY not configured");
    }

    // 6. Log credit usage (non-blocking)
    if (aiUsage) {
      logUsage({
        provider: "deepseek",
        endpoint: "chat/completions",
        tokensIn: aiUsage.promptTokens,
        tokensOut: aiUsage.completionTokens,
        barId,
        metadata: { step: "refine", category, instruction: instruction.trim().slice(0, 80) },
      }).catch(() => {});
    }

    console.log(
      `[refine] bar=${barId} category=${category} title:"${refinedTitle.slice(0, 40)}..."`,
    );

    return NextResponse.json({
      title: refinedTitle,
      description: refinedDescription,
      callToAction: refinedCta,
      category,
    });
  } catch (error) {
    return handleApiError(error, "AI refine");
  }
}
