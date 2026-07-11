/**
 * GET /api/auth/bar/[barId]/images/jobs/[jobId]
 *
 * Poll for image job status + lazy processing. Called by the client every
 * 2 seconds after submitting. The first caller to find a "pending" job
 * atomically claims it and runs the generation + upload inline. Subsequent
 * callers get the result once completed. No cron infra needed.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isBarStaffToken, isAdminToken } from "@/lib/auth";
import { prisma } from "@/lib/database";
import { generateImages } from "@/lib/image-generator";
import { uploadImageFromUrl } from "@/lib/upload-image-from-url";
import { logUsage } from "@/lib/credit-tracker";
import { handleApiError } from "@/lib/api-error";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string; jobId: string }> },
) {
  try {
    const { barId, jobId } = await params;

    // Auth
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = verifyToken(authHeader.substring(7));
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }
    if (!isBarStaffToken(payload) && !isAdminToken(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (isBarStaffToken(payload) && payload.barId !== barId) {
      return NextResponse.json({ error: "Forbidden: Wrong bar" }, { status: 403 });
    }

    const job = await prisma.imageJob.findUnique({
      where: { id: jobId },
    });

    if (!job || job.barId !== barId) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Already done — return result immediately
    if (job.status === "completed" || job.status === "failed") {
      return NextResponse.json({
        id: job.id,
        status: job.status,
        urls: job.urls,
        error: job.error,
      });
    }

    // Still processing by another caller — tell the client to keep polling
    if (job.status === "processing") {
      return NextResponse.json({ id: job.id, status: "processing" });
    }

    // Status is "pending" — try to claim it atomically.
    // Only one caller wins the race; the rest fall through to polling.
    const claimed = await prisma.imageJob.updateMany({
      where: { id: jobId, status: "pending" },
      data: { status: "processing" },
    });

    if (claimed.count === 0) {
      // Lost the race — another caller is already processing
      return NextResponse.json({ id: job.id, status: "processing" });
    }

    // We claimed it. Run the actual work.
    try {
      const images = await generateImages({
        prompt: job.prompt,
        count: job.count,
      });

      const permanentUrls: string[] = [];
      for (const img of images) {
        try {
          const uploaded = await uploadImageFromUrl(img.url, job.barId);
          permanentUrls.push(uploaded.url);
        } catch {
          permanentUrls.push(img.url);
        }
      }

      await prisma.imageJob.update({
        where: { id: jobId },
        data: { status: "completed", urls: permanentUrls },
      });

      logUsage({
        provider: job.provider as "deepseek" | "bfl_flux",
        endpoint: "image-generation",
        imageCount: job.count,
        barId: job.barId,
        metadata: {
          styleId: job.styleId,
          subjectId: job.subjectId,
          contentType: job.contentType,
        },
      }).catch(() => {});

      return NextResponse.json({
        id: job.id,
        status: "completed",
        urls: permanentUrls,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      await prisma.imageJob.update({
        where: { id: jobId },
        data: { status: "failed", error: errorMsg },
      });
      return NextResponse.json({
        id: job.id,
        status: "failed",
        error: errorMsg,
      });
    }
  } catch (error) {
    return handleApiError(error, "Image job status");
  }
}
