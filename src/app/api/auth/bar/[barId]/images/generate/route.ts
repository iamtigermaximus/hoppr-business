// POST /api/auth/bar/[barId]/images/generate
// Generates AI images from structured selections (no free-text prompting),
// runs compliance checks, uploads results to Cloudinary for permanence.

import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth-service";
import { handleApiError } from "@/lib/api-error";
import { prisma } from "@/lib/database";
import { generateImages, isProviderConfigured, isProviderReal } from "@/lib/image-generator";
import { checkRateLimit, RateLimits } from "@/lib/rate-limiter";
import { buildImagePrompt, buildContextFromForm } from "@/lib/prompts/build-image-prompt";
import { uploadImageFromUrl } from "@/lib/upload-image-from-url";
import { planHasFeature } from "@/lib/plan-limits";
import { logUsage } from "@/lib/credit-tracker";

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
    // Skipped in development so the full flow can be tested without plan setup.
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

    // Rate limits — prevent abuse (cost caps)
    // Only enforced for real providers; mock mode is unlimited for dev
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
    } = body;

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

    // Build the prompt from structured selections + optional form context
    const contextStr = formContext
      ? buildContextFromForm(formContext)
      : "";
    const built = buildImagePrompt(
      { styleId, subjectId, compositionId, context: contextStr },
      contentType,
    );

    // Compliance block — don't even call the API if the prompt is illegal
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

    // Fetch bar name for credit tracking attribution
    const bar = await prisma.bar.findUnique({
      where: { id: barId },
      select: { name: true },
    });

    // Log credit usage for admin monitoring (non-blocking, fire-and-forget)
    logUsage({
      provider: "bfl_flux",
      endpoint: "image-generation",
      imageCount: count,
      barId,
      barName: bar?.name,
      metadata: { styleId, subjectId, contentType },
    }).catch(() => {});

    // Upload each generated image to Cloudinary for permanent storage
    const permanentUrls: string[] = [];
    for (const img of images) {
      try {
        const uploaded = await uploadImageFromUrl(img.url, barId);
        permanentUrls.push(uploaded.url);
      } catch {
        // If one upload fails, include the temporary URL as fallback
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
