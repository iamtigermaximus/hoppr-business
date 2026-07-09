// POST /api/auth/bar/[barId]/images/generate
// Generates AI images from structured selections (no free-text prompting),
// runs compliance checks, uploads results to Cloudinary for permanence.
//
// Two modes:
//   1. Single image — provide styleId/subjectId/compositionId
//   2. Per-variant images — provide variantVisualDirections[] for concurrent
//      generation of unique images for each promotion variant.

import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth-service";
import { handleApiError } from "@/lib/api-error";
import { prisma } from "@/lib/database";
import { generateImages, isProviderConfigured, isProviderReal } from "@/lib/image-generator";
import { checkRateLimit, RateLimits } from "@/lib/rate-limiter";
import { buildImagePrompt, buildContextFromForm, type VisualDirection } from "@/lib/prompts/build-image-prompt";
import { uploadImageFromUrl } from "@/lib/upload-image-from-url";
import { planHasFeature } from "@/lib/plan-limits";
import { logUsage } from "@/lib/credit-tracker";
import { generateImageSuffix } from "@/lib/ai/parameterized-templates";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
) {
  try {
    const { barId } = await params;

    // Auth
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const authResult = await authService.validateToken(authHeader.substring(7));
    if (authResult.type !== "bar_staff" && authResult.type !== "admin") {
      return NextResponse.json({ error: "Authentication required" }, { status: 403 });
    }

    // Plan gate — only enforced for real (paid) providers in production.
    if (process.env.NODE_ENV === "production" && authResult.type === "bar_staff" && isProviderReal()) {
      const bar = await prisma.bar.findUnique({
        where: { id: barId },
        select: { plan: true },
      });
      if (!bar || !planHasFeature(bar.plan, "aiGeneration")) {
        return NextResponse.json(
          { error: "AI image generation requires a PRO or PREMIUM plan" },
          { status: 402 },
        );
      }
    }

    // Provider check
    if (!isProviderConfigured()) {
      return NextResponse.json(
        {
          error: "AI image generation is not configured",
          hint: "Set AI_IMAGE_PROVIDER and AI_IMAGE_API_KEY in .env.local",
        },
        { status: 503 },
      );
    }

    // Rate limits
    if (isProviderReal()) {
      const perMinute = checkRateLimit(`ai-image:${barId}`, RateLimits.AI_IMAGE_PER_MINUTE);
      if (!perMinute.allowed) {
        return NextResponse.json(
          { error: `Generating too fast. Retry in ${perMinute.retryAfter}s.` },
          { status: 429 },
        );
      }

      const perDay = checkRateLimit(`ai-image-daily:${barId}`, RateLimits.AI_IMAGE_PER_DAY);
      if (!perDay.allowed) {
        return NextResponse.json(
          { error: "Daily image generation limit reached (50/day). Try again tomorrow." },
          { status: 429 },
        );
      }
    }

    // Parse body
    const body = await request.json();
    const {
      styleId = "warm_cozy",
      subjectId = "interior",
      compositionId = "wide",
      contentType = "promotion",
      formContext,
      visualDirection,
      /** Array of per-variant visual directions for concurrent unique image generation.
       *  Each entry produces one unique background image for its corresponding variant card.
       *  Image suffixes are generated server-side with bar-specific randomness. */
      variantVisualDirections,
    } = body as {
      styleId?: string;
      subjectId?: string;
      compositionId?: string;
      contentType?: string;
      formContext?: { title?: string; description?: string; promotionType?: string; barName?: string };
      visualDirection?: VisualDirection;
      variantVisualDirections?: Array<{
        visualDirection: VisualDirection;
        formContext?: { title?: string; description?: string; promotionType?: string; barName?: string };
      }>;
    };

    // Validate selections
    if (
      typeof styleId !== "string" ||
      typeof subjectId !== "string" ||
      typeof compositionId !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid selections. Provide styleId, subjectId, and compositionId." },
        { status: 400 },
      );
    }

    // ---- PER-VARIANT CONCURRENT GENERATION ----
    // When variantVisualDirections is provided, generate a unique image for each
    // variant concurrently. Each variant gets its own prompt, compliance check,
    // and image — ensuring visual diversity across the variant cards.
    //
    // Image suffixes are generated server-side using generateImageSuffix(),
    // which injects bar-specific randomness (barId hash as rotation offset)
    // so two bars of the same type generating at the same time get different
    // color palettes, lighting, and atmosphere.
    if (variantVisualDirections && variantVisualDirections.length > 0) {
      // Fetch bar type early — needed for image suffix generation
      const bar = await prisma.bar.findUnique({
        where: { id: barId },
        select: { name: true, type: true },
      });
      const barType = bar?.type || "PUB";

      const ct = contentType as "promotion" | "event" | "pass" | "campaign";

      // Validate all variants pass compliance BEFORE spending any API credits
      const variantPrompts: Array<{ finalPrompt: string; index: number }> = [];
      for (let i = 0; i < variantVisualDirections.length; i++) {
        const vd = variantVisualDirections[i];
        const ctxStr = vd.formContext ? buildContextFromForm(vd.formContext) : "";
        const built = buildImagePrompt(
          { styleId, subjectId, compositionId, context: ctxStr, visualDirection: vd.visualDirection },
          ct,
        );

        if (!built.compliance.passed) {
          return NextResponse.json(
            {
              error: "Content policy violation",
              blockedReasons: built.compliance.blockedReasons,
              variantIndex: i,
              hint: `Variant ${i + 1} visual description violates Finnish alcohol advertising regulations.`,
            },
            { status: 422 },
          );
        }

        // Inject bar-specific image suffix — guarantees different bars get
        // genuinely different color palettes even at the same time of day.
        const imageSuffix = generateImageSuffix(barType, i, barId);
        const finalPrompt = `${built.finalPrompt}. ${imageSuffix}.`;
        variantPrompts.push({ finalPrompt, index: i });
      }

      // Generate all variant images concurrently
      const count = body.count || 1;
      const generationResults = await Promise.all(
        variantPrompts.map((vp) =>
          generateImages({ prompt: vp.finalPrompt, count }).then((images) => ({
            index: vp.index,
            images,
          }))
        )
      );

      // Log credit usage
      logUsage({
        provider: "bfl_flux",
        endpoint: "image-generation",
        imageCount: count * variantVisualDirections.length,
        barId,
        barName: bar?.name,
        metadata: { styleId, subjectId, contentType, variantCount: variantVisualDirections.length },
      }).catch(() => {});

      // Upload each variant's first image to Cloudinary
      const variantUrls: string[] = [];
      for (const result of generationResults.sort((a, b) => a.index - b.index)) {
        const img = result.images[0];
        if (!img) {
          variantUrls.push("");
          continue;
        }
        try {
          const uploaded = await uploadImageFromUrl(img.url, barId);
          variantUrls.push(uploaded.url);
        } catch {
          variantUrls.push(img.url);
        }
      }

      return NextResponse.json({
        success: true,
        urls: variantUrls,
        variantUrls,
        variantCount: variantVisualDirections.length,
      });
    }

    // ---- SINGLE IMAGE GENERATION (backward compatible) ----
    const contextStr = formContext
      ? buildContextFromForm(formContext)
      : "";
    const built = buildImagePrompt(
      { styleId, subjectId, compositionId, context: contextStr, visualDirection },
      contentType as "promotion" | "event" | "pass" | "campaign",
    );

    // Compliance block
    if (!built.compliance.passed) {
      return NextResponse.json(
        {
          error: "Content policy violation",
          blockedReasons: built.compliance.blockedReasons,
          hint: "Your selections contain content that violates Finnish alcohol advertising regulations. Try different options.",
        },
        { status: 422 },
      );
    }

    // Generate images
    const count = body.count || 2;
    const images = await generateImages({
      prompt: built.finalPrompt,
      count,
    });

    // Fetch bar name for credit tracking
    const bar = await prisma.bar.findUnique({
      where: { id: barId },
      select: { name: true },
    });

    // Log credit usage
    logUsage({
      provider: "bfl_flux",
      endpoint: "image-generation",
      imageCount: count,
      barId,
      barName: bar?.name,
      metadata: { styleId, subjectId, contentType },
    }).catch(() => {});

    // Upload to Cloudinary
    const permanentUrls: string[] = [];
    for (const img of images) {
      try {
        const uploaded = await uploadImageFromUrl(img.url, barId);
        permanentUrls.push(uploaded.url);
      } catch {
        permanentUrls.push(img.url);
      }
    }

    return NextResponse.json({
      success: true,
      urls: permanentUrls,
      preview: built.preview,
      selections: {
        style: built.selections.style.label,
        subject: built.selections.subject.label,
        composition: built.selections.composition.label,
      },
      warnings: built.compliance.warnings,
    });
  } catch (error) {
    return handleApiError(error, "Image generation error:");
  }
}
