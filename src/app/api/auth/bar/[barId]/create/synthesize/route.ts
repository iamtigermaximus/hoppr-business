import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isBarStaffToken } from "@/lib/auth";
import { prisma } from "@/lib/database";
import { checkRateLimit, RateLimits } from "@/lib/rate-limiter";
import { buildFullSystemPrompt } from "@/lib/compliance/prompts";
import { buildCreativeDirectorReview } from "@/lib/compliance/persona";
import {
  getTonePromptBlock,
  type ContentTone,
} from "@/lib/prompts/tone-voices";
import { TEMPLATE_CHARACTERISTICS } from "@/lib/compliance/prompts";
import { formatTemplateFieldValues } from "@/lib/prompts/template-fields";
import { handleApiError } from "@/lib/api-error";
import { logUsage } from "@/lib/credit-tracker";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

/** Build a prompt that asks the AI to synthesize a professional creative brief.
 *  The prompt includes full bar context + ingredient data so each establishment
 *  gets a genuinely unique, marketing-agency-level creative brief. */
function buildSynthesisPrompt(
  bar: { name: string; type: string; district?: string | null; cityName?: string | null; description?: string | null; amenities?: string[] | null; priceRange?: string | null },
  templateLabel: string | null,
  templateTraits: string | null,
  toneLabel: string | null,
  toneInstruction: string | null,
  contextValues: string[],
  language: "en" | "fi",
): string {
  const isFi = language === "fi";

  // Bar identity — gives the AI specific details to anchor the brief in
  const barTypeClean = bar.type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  const location = [bar.district, bar.cityName].filter(Boolean).join(", ");
  const barDesc = bar.description ? `"${bar.description}"` : "";
  const amenities = bar.amenities?.length ? bar.amenities.join(", ") : "";

  // Ingredients as structured context
  const templateSection = templateLabel
    ? (isFi
        ? `MALLIPOHJA: "${templateLabel}"${templateTraits ? ` — ${templateTraits}` : ""}`
        : `TEMPLATE: "${templateLabel}"${templateTraits ? ` — ${templateTraits}` : ""}`)
    : "";

  const toneSection = toneLabel
    ? (isFi
        ? `ÄÄNENSÄVY: "${toneLabel}"`
        : `TONE OF VOICE: "${toneLabel}"`)
    : "";

  const contextSection = contextValues.length > 0
    ? (isFi ? `KONTEKSTI: ${contextValues.join(" | ")}` : `CONTEXT: ${contextValues.join(" | ")}`)
    : "";

  if (isFi) {
    return `TOIMEKSIANTO — Luo luova brief baarille ${bar.name}.

BAARIN PROFIILI:
- Nimi: ${bar.name}
- Tyyppi: ${barTypeClean}${location ? `, ${location}` : ""}${bar.priceRange ? `, ${bar.priceRange}` : ""}
${barDesc ? `- Baarin oma kuvaus: ${barDesc}` : ""}${amenities ? `- Palvelut: ${amenities}` : ""}

${templateSection}
${toneSection}
${contextSection}

TEHTÄVÄSI — KIRJOITA LUOVA BRIEF JOKA TOIMII SEKÄ COPYWRITERIN ETTÄ KUVAAJAN OHJEENA:

Tämä brief ohjaa 3:n uniikin tekstivariantin ja 3:n kuvagenerointipromptin luomista.

Kirjoita 3-4 hyvin kirjoitettua kappaletta (ei bulletteja, ei otsikoita):

1. AVAUS — Kenelle ja mitä: Perustele miksi juuri tämä malli + sävy + ajankohta toimii ${bar.name}lle. Mihin tarpeeseen tai hetkeen tämä vastaa? Mikä tekee yhdistelmästä toimivan juuri tälle baarityypille (${barTypeClean}) eikä geneerisesti mille tahansa baarille?

2. LUOVA ALUE — Miltä sisältö näyttää ja tuntuu: Kuvaile konkreettisesti tekstin sävy, rytmi ja sanavalinnat. Miten ${toneLabel || "sävy"} näkyy otsikoissa? Miten ${templateLabel || "malli"} muokkaa kerrontaa? Anna esimerkkejä siitä millaista kieltä KÄYTETÄÄN ja millaista VÄLTETÄÄN. Puno konteksti luontevasti mukaan — ${contextValues.length > 0 ? contextValues[0] : "ajankohta"} ei ole irrallinen lisä vaan olennainen osa tarinaa.

3. VISUAALINEN SUUNTA — Mitä kuvissa näkyy: Miten samat ainekset (malli, sävy, konteksti) kääntyvät visuaaliseksi kieleksi? Millaisia kohtauksia, värejä, valaistuksia ja tunnelmia kuvagenerointiprompteihin ohjataan? Jokaisen kolmen variantin kuva on erilainen — eri perspektiivi, eri hetki, eri tunnelma. Kuvaile ERITYISESTI miten ${bar.name}n todelliset puitteet (${barTypeClean}${location ? `, ${location}` : ""}${amenities ? `, ${amenities}` : ""}) näkyvät kuvissa — älä keksi elementtejä joita baarissa ei ole.

4. LOPPUTULOS — Mitä syntyy: 3 täysin erilaista tekstivarianttia (eri kulma, eri otsikko, eri sävy) + 3 kuvagenerointipromptia (eri kohtaus, eri perspektiivi). Jokainen variantti on uniikki — ei uudelleenmuotoiltuja versioita samasta ideasta. Tämä brief on laadun tae.

KRIITTISET LAATUVAATIMUKSET:
- Jokainen lause on ankkuroitu ${bar.name}iin — tätä briefiä EI VOISI käyttää toiselle baarille
- Ei latteuksia ("mahtava tunnelma", "huippuluokan", "jotain uutta ja jännittävää")
- Konkreettista, aistivoimaista, spesifiä — näytä, älä selitä
- Kirjoita SUOMEKSI. Ammattimaisella otteella. Tämä on työnäyte.

Palauta VAIN valmis brief-teksti — ei otsikoita, ei johdantoa kuten "tässä on brief", ei bulletteja. Puhdasta, juoksevaa tekstiä.`;
  }

  return `ASSIGNMENT — Create a creative brief for ${bar.name}.

BAR PROFILE:
- Name: ${bar.name}
- Type: ${barTypeClean}${location ? `, ${location}` : ""}${bar.priceRange ? `, ${bar.priceRange}` : ""}
${barDesc ? `- Bar's own description: ${barDesc}` : ""}${amenities ? `- Amenities: ${amenities}` : ""}

${templateSection}
${toneSection}
${contextSection}

YOUR TASK — WRITE A CREATIVE BRIEF THAT SERVES AS BOTH COPYWRITER AND PHOTOGRAPHER INSTRUCTIONS:

This brief will drive 3 unique text variants and 3 image generation prompts.

Write 3-4 well-crafted paragraphs (no bullets, no headings):

1. OPENING — Who and what: Explain why THIS particular format + voice + timing combination works for ${bar.name}. What need or moment does it serve? What makes this combination effective for a ${barTypeClean} specifically — not generically for any bar?

2. CREATIVE TERRITORY — What the content looks and feels like: Describe concretely the voice, rhythm, and word choices. How does ${toneLabel || "the tone"} manifest in headlines? How does ${templateLabel || "the format"} shape the storytelling? Give examples of language TO USE and language TO AVOID. Weave context in naturally — ${contextValues.length > 0 ? contextValues[0] : "the timing"} isn't a bolt-on, it's integral to the story.

3. VISUAL DIRECTION — What appears in the images: How do the same ingredients (format, voice, context) translate into visual language? What scenes, colors, lighting, and moods go into the image generation prompts? Each of the three variants gets a different image — different perspective, different moment, different atmosphere. Describe SPECIFICALLY how ${bar.name}'s actual setting (${barTypeClean}${location ? `, ${location}` : ""}${amenities ? `, ${amenities}` : ""}) shows up in the imagery — don't invent elements the bar doesn't have.

4. OUTPUT — What gets produced: 3 completely different text variants (different angle, different headline, different voice) + 3 image generation prompts (different scene, different perspective). Each variant is unique — not rephrased versions of the same idea. This brief is the quality guarantee.

CRITICAL QUALITY REQUIREMENTS:
- Every sentence is anchored to ${bar.name} — this brief COULD NOT be used for another bar
- No platitudes ("amazing atmosphere", "top-notch", "something for everyone")
- Concrete, sensory, specific — show, don't tell
- Write with professional polish. This is a portfolio piece.

Return ONLY the finished brief text — no headings, no intro like "here's the brief", no bullets. Clean, flowing prose.`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
) {
  try {
    // 1. Auth
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = verifyToken(token);
    if (!payload || !isBarStaffToken(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { barId } = await params;
    if (payload.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Rate limit
    const rateCheck = await checkRateLimit(`synthesize:${barId}`, RateLimits.AI);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Rate limit reached. Retry in ${rateCheck.retryAfter}s.` },
        { status: 429 },
      );
    }

    // 3. Parse body
    const body = await request.json();
    const {
      template,
      tone,
      context = [],
      language = "en",
      templateFields = {},
    } = body as {
      template?: string | null;
      tone?: string | null;
      context?: string[];
      language?: string;
      templateFields?: Record<string, string>;
    };

    const lang = language === "fi" ? "fi" : "en";

    // 4. Fetch bar
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

    // 5. Build ingredient data
    const templateTraits = template
      ? TEMPLATE_CHARACTERISTICS[template]
        ? (lang === "fi"
            ? TEMPLATE_CHARACTERISTICS[template].fi
            : TEMPLATE_CHARACTERISTICS[template].en)
        : null
      : null;

    const toneInstruction = tone
      ? getTonePromptBlock(tone as ContentTone, lang)
      : null;

    // 6. Build synthesis prompt
    const userPrompt = buildSynthesisPrompt(
      bar,
      template || null,
      templateTraits,
      tone || null,
      toneInstruction,
      context,
      lang,
    );

    const systemPrompt = buildFullSystemPrompt(lang, {
      name: bar.name,
      type: bar.type,
      district: bar.district ?? undefined,
      cityName: bar.cityName ?? undefined,
      priceRange: bar.priceRange ?? undefined,
      amenities: bar.amenities ?? undefined,
      description: bar.description ?? undefined,
      musicTags: (bar.musicTags as string[]) ?? undefined,
    }) + `\n${buildCreativeDirectorReview(lang)}`;

    // Inject template-specific field values into the user prompt
    const fieldValuesStr = formatTemplateFieldValues(templateFields, lang);
    const finalUserPrompt = fieldValuesStr
      ? userPrompt + fieldValuesStr
      : userPrompt;

    // 7. Try AI; fall back to empty brief on failure
    let brief = "";

    if (DEEPSEEK_API_KEY) {
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
              { role: "user", content: finalUserPrompt },
            ],
            temperature: 0.85,
            max_tokens: 1200,
          }),
          signal: AbortSignal.timeout(20_000),
        });

        if (response.ok) {
          const data = await response.json();
          brief = (data.choices[0].message.content || "").trim();

          // Track credit usage
          if (data.usage) {
            logUsage({
              provider: "deepseek",
              endpoint: "chat/completions",
              tokensIn: data.usage.prompt_tokens || 0,
              tokensOut: data.usage.completion_tokens || 0,
              barId,
              barName: bar.name,
              metadata: { step: "synthesize", language: lang },
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.error("[synthesize] AI call failed:", err instanceof Error ? err.message : String(err));
      }
    }

    return NextResponse.json({
      success: true,
      brief,
      aiGenerated: brief.length > 0,
    });
  } catch (error) {
    return handleApiError(error, "brief synthesize");
  }
}
