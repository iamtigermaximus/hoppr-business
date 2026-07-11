// POST /api/auth/bar/[barId]/images/generate
// Generates AI images from structured selections (no free-text prompting),
// runs compliance checks, uploads results to Cloudinary for permanence.
//
// Two modes:
//   1. Single image — provide styleId/subjectId/compositionId
//   2. Per-variant images — provide variantVisualDirections[] for concurrent
//      generation of unique images for each promotion variant.

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isAdminToken, isBarStaffToken } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";
import { prisma } from "@/lib/database";
import { isProviderConfigured, isProviderReal } from "@/lib/image-generator";
import { checkRateLimit, RateLimits } from "@/lib/rate-limiter";
import { buildImagePrompt, buildContextFromForm, type VisualDirection } from "@/lib/prompts/build-image-prompt";
import { planHasFeature } from "@/lib/plan-limits";
import { generateImageSuffix } from "@/lib/ai/parameterized-templates";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
) {
  try {
    const { barId } = await params;

    // Auth — inline JWT, zero DB queries (same pattern as ai-generate/suggest)
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = verifyToken(authHeader.substring(7));
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }
    if (!isBarStaffToken(payload) && !isAdminToken(payload)) {
      return NextResponse.json({ error: "Authentication required" }, { status: 403 });
    }
    // Bar staff must belong to this bar
    if (isBarStaffToken(payload) && payload.barId !== barId) {
      return NextResponse.json({ error: "Forbidden: You don't have access to this bar" }, { status: 403 });
    }

    // Plan gate — only enforced for real (paid) providers in production.
    if (process.env.REQUIRE_PLAN_FOR_AI === "true" && isBarStaffToken(payload)) {
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
      const perMinute = await checkRateLimit(`ai-image:${barId}`, RateLimits.AI_IMAGE_PER_MINUTE);
      if (!perMinute.allowed) {
        return NextResponse.json(
          { error: `Generating too fast. Retry in ${perMinute.retryAfter}s.` },
          { status: 429 },
        );
      }

      const perDay = await checkRateLimit(`ai-image-daily:${barId}`, RateLimits.AI_IMAGE_PER_DAY);
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

    // ---- Build prompts and create async jobs ----
    // Image generation (BFL polling) is slow — up to 60s per image.
    // Instead of blocking this request, we create a job record and return
    // immediately. A cron worker picks up pending jobs and handles the
    // generation + Cloudinary upload asynchronously.

    const provider = process.env.AI_IMAGE_PROVIDER || "mock";
    const count = (body as { count?: number }).count || 2;

    if (variantVisualDirections && variantVisualDirections.length > 0) {
      // Fetch bar type for image suffix generation
      const bar = await prisma.bar.findUnique({
        where: { id: barId },
        select: { name: true, type: true },
      });
      const barType = bar?.type || "PUB";
      const ct = contentType as "promotion" | "event" | "pass" | "campaign";

      const jobIds: string[] = [];
      const allWarnings: Array<{ variantIndex: number; reasons: string[] }> = [];

      for (let i = 0; i < variantVisualDirections.length; i++) {
        const vd = variantVisualDirections[i];
        const ctxStr = vd.formContext ? buildContextFromForm(vd.formContext) : "";
        const built = buildImagePrompt(
          { styleId, subjectId, compositionId, context: ctxStr, visualDirection: vd.visualDirection },
          ct,
        );

        if (built.compliance.blockedReasons.length > 0) {
          allWarnings.push({ variantIndex: i, reasons: built.compliance.blockedReasons });
        }
        if (built.compliance.warnings.length > 0) {
          allWarnings.push({ variantIndex: i, reasons: built.compliance.warnings });
        }

        const imageSuffix = generateImageSuffix(barType, i, barId);
        const finalPrompt = `${built.finalPrompt}. ${imageSuffix}.`;

        const job = await prisma.imageJob.create({
          data: {
            barId,
            prompt: finalPrompt,
            count,
            provider,
            styleId,
            subjectId,
            compositionId,
            contentType: ct,
          },
        });
        jobIds.push(job.id);
      }

      return NextResponse.json({
        jobIds,
        status: "pending",
        variantCount: variantVisualDirections.length,
        ...(allWarnings.length > 0 ? { complianceNotes: allWarnings } : {}),
      });
    }

    // ---- Single image generation ----
    const contextStr = formContext
      ? buildContextFromForm(formContext)
      : "";
    const built = buildImagePrompt(
      { styleId, subjectId, compositionId, context: contextStr, visualDirection },
      contentType as "promotion" | "event" | "pass" | "campaign",
    );

    const job = await prisma.imageJob.create({
      data: {
        barId,
        prompt: built.finalPrompt,
        count,
        provider,
        styleId,
        subjectId,
        compositionId,
        contentType: contentType as string,
      },
    });

    return NextResponse.json({
      jobIds: [job.id],
      status: "pending",
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
