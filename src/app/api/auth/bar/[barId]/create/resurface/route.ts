import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";

/**
 * GET /api/auth/bar/[barId]/create/resurface?contentId=xxx&contentType=promotion|event|pass
 *
 * Returns content data for pre-filling the creation flow when resurfacing
 * a top-performing content item. Fetches from the appropriate content table
 * and returns a minimal payload with the fields the creation form needs.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
): Promise<NextResponse> {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isBarStaffToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { barId } = await params;
    if (payload.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get("contentId");
    const contentType = searchParams.get("contentType") as
      | "promotion"
      | "event"
      | "pass"
      | null;

    if (!contentId || !contentType) {
      return NextResponse.json(
        { error: "contentId and contentType are required" },
        { status: 400 },
      );
    }

    let content: {
      title: string;
      description: string | null;
      imageUrl: string | null;
      startDate: string | null;
      endDate: string | null;
      conditions?: string[];
      type?: string;
    } | null = null;

    switch (contentType) {
      case "promotion": {
        const promo = await prisma.barPromotion.findFirst({
          where: { id: contentId, barId },
          select: {
            title: true,
            description: true,
            imageUrl: true,
            startDate: true,
            endDate: true,
            conditions: true,
            type: true,
          },
        });
        if (promo) {
          content = {
            title: promo.title,
            description: promo.description,
            imageUrl: promo.imageUrl,
            startDate: promo.startDate.toISOString(),
            endDate: promo.endDate.toISOString(),
            conditions: promo.conditions,
            type: promo.type,
          };
        }
        break;
      }
      case "event": {
        const event = await prisma.event.findFirst({
          where: { id: contentId, venueId: barId },
          select: {
            title: true,
            description: true,
            imageUrl: true,
            startTime: true,
            endTime: true,
            category: true,
          },
        });
        if (event) {
          content = {
            title: event.title,
            description: event.description,
            imageUrl: event.imageUrl,
            startDate: event.startTime.toISOString(),
            endDate: event.endTime?.toISOString() ?? null,
            type: event.category ?? undefined,
          };
        }
        break;
      }
      case "pass": {
        const pass = await prisma.vIPPassEnhanced.findFirst({
          where: { id: contentId, barId },
          select: {
            name: true,
            description: true,
            imageUrl: true,
            validityStart: true,
            validityEnd: true,
            benefits: true,
            type: true,
          },
        });
        if (pass) {
          content = {
            title: pass.name,
            description: pass.description,
            imageUrl: pass.imageUrl,
            startDate: pass.validityStart.toISOString(),
            endDate: pass.validityEnd.toISOString(),
            conditions: pass.benefits,
            type: pass.type,
          };
        }
        break;
      }
    }

    if (!content) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      contentId,
      contentType,
      sourceTitle: content.title,
      ...content,
    });
  } catch (error) {
    return handleApiError(error, "Resurface");
  }
}
