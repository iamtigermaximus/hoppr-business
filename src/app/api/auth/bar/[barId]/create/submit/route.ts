import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isBarStaffToken } from "@/lib/auth";
import { prisma } from "@/lib/database";
import { scanCompliance, complianceSummary } from "@/lib/compliance-engine";

// ---- Types ----

type ContentType = "event" | "promotion" | "pass";

interface SubmitBody {
  contentType: ContentType;
  // Shared fields
  title: string;
  description?: string;
  imageUrl?: string | null;
  intentText?: string;
  // Event-specific
  startTime?: string;
  endTime?: string | null;
  maxAttendees?: number | null;
  isPrivate?: boolean;
  // Promotion-specific
  promotionType?: string;
  discountValue?: number | null;
  startDate?: string;
  endDate?: string;
  conditions?: string;
  validDays?: string[];
  targetAudience?: string;
  // Pass-specific
  passType?: string;
  priceEuros?: string;
  originalPriceEuros?: string;
  benefits?: string[];
  totalQuantity?: number | null;
  maxPerUser?: number | null;
  redemptionMode?: string;
  maxRedemptions?: number | null;
  skipLinePriority?: boolean;
  coverFeeIncluded?: boolean;
  coverFeeAmount?: number;
}

// ---- Route ----

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

    // 2. Parse and validate request body
    const body = (await request.json()) as SubmitBody;

    if (!body.contentType || !["event", "promotion", "pass"].includes(body.contentType)) {
      return NextResponse.json(
        { error: "Invalid or missing contentType. Must be: event, promotion, or pass." },
        { status: 400 },
      );
    }

    if (!body.title || body.title.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing required field: title" },
        { status: 400 },
      );
    }

    // Per-type required fields validation
    if (body.contentType === "event" && !body.startTime) {
      return NextResponse.json(
        { error: "Missing required field for event: startTime" },
        { status: 400 },
      );
    }

    if (
      body.contentType === "promotion" &&
      (!body.promotionType || !body.startDate || !body.endDate)
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields for promotion: promotionType, startDate, endDate",
        },
        { status: 400 },
      );
    }

    if (
      body.contentType === "pass" &&
      (!body.passType || !body.priceEuros || !body.totalQuantity)
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields for pass: passType, priceEuros, totalQuantity",
        },
        { status: 400 },
      );
    }

    // Per-type enum whitelists — coerce AI-generated values to safe defaults
    const PROMOTION_TYPES = [
      "HAPPY_HOUR", "STUDENT_DISCOUNT", "LADIES_NIGHT", "THEME_NIGHT",
      "FOOD_SPECIAL", "DRINK_SPECIAL", "COVER_DISCOUNT", "VIP_OFFER",
      "LIVE_MUSIC_EVENT", "GAME_NIGHT",
    ] as const;
    const PASS_TYPES = [
      "SKIP_LINE", "COVER_INCLUDED", "PREMIUM_ENTRY", "DRINK_PACKAGE",
    ] as const;

    if (body.contentType === "promotion" && body.promotionType) {
      if (!(PROMOTION_TYPES as readonly string[]).includes(body.promotionType)) {
        body.promotionType = "DRINK_SPECIAL"; // safe fallback
      }
    }

    if (body.contentType === "pass" && body.passType) {
      if (!(PASS_TYPES as readonly string[]).includes(body.passType)) {
        body.passType = "SKIP_LINE"; // safe fallback
      }
    }

    // 3. Run server-side compliance scan (authoritative)
    const compliance = scanCompliance(body.title, body.description);

    // 4. Resolve the real User.id from BarStaff (JWT stores BarStaff.id, but Event.creatorId references User.id)
    const barStaff = await prisma.barStaff.findUnique({
      where: { id: payload.userId },
      select: { userId: true },
    });
    const creatorUserId = barStaff?.userId;

    // 5. Get bar context
    const bar = await prisma.bar.findUnique({
      where: { id: barId },
      select: { name: true, type: true },
    });

    if (!bar) {
      return NextResponse.json({ error: "Bar not found" }, { status: 404 });
    }

    // 6. Create record and compliance check based on content type
    let record: Record<string, unknown> | null = null;

    if (body.contentType === "event") {
      if (!creatorUserId) {
        return NextResponse.json(
          { error: "Cannot create event: no linked user account found for this staff member" },
          { status: 400 },
        );
      }

      const baseStatus =
        payload.staffRole === "OWNER" || payload.staffRole === "MANAGER"
          ? "COMPLIANT"
          : "PENDING_REVIEW";

      const finalStatus =
        compliance.status === "FLAGGED_AUTO" ? "FLAGGED_AUTO" : baseStatus;

      const priceCents = body.priceEuros
        ? Math.round(parseFloat(body.priceEuros) * 100)
        : null;

      const event = await prisma.event.create({
        data: {
          title: body.title.trim(),
          description: body.description || null,
          venueId: barId,
          venueName: bar.name,
          venueType: bar.type,
          startTime: new Date(body.startTime!),
          endTime: body.endTime ? new Date(body.endTime) : null,
          maxAttendees: body.maxAttendees || null,
          isPrivate: body.isPrivate || false,
          imageUrl: body.imageUrl || null,
          creatorId: creatorUserId,
          complianceStatus: finalStatus,
        },
      });

      await prisma.complianceCheck.create({
        data: {
          eventId: event.id,
          status: finalStatus,
          violations: compliance.violations as unknown as object[],
          checkedAt: compliance.checkedAt,
        },
      });

      record = {
        id: event.id,
        type: "event",
        title: event.title,
        startTime: event.startTime.toISOString(),
        complianceStatus: finalStatus,
      };
    } else if (body.contentType === "promotion") {
      const isAutoApproved =
        payload.staffRole === "OWNER" || payload.staffRole === "MANAGER";

      // Resolve valid days
      let validDays = body.validDays || [];
      if (validDays.length === 0 && body.targetAudience) {
        switch (body.targetAudience) {
          case "WEEKEND":
            validDays = ["Friday", "Saturday"];
            break;
          case "WEEKDAY":
            validDays = ["Monday", "Tuesday", "Wednesday", "Thursday"];
            break;
          default:
            validDays = [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ];
        }
      }

      const promotion = await prisma.barPromotion.create({
        data: {
          barId,
          title: body.title.trim(),
          description: body.description || "",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          type: body.promotionType as any,
          discount: body.discountValue || null,
          conditions: body.conditions ? [body.conditions] : [],
          startDate: new Date(body.startDate!),
          endDate: new Date(body.endDate!),
          validDays,
          imageUrl: body.imageUrl || null,
          isActive: true,
          isApproved: isAutoApproved,
          priority: 1,
          views: 0,
          clicks: 0,
          redemptions: 0,
        },
      });

      await prisma.complianceCheck.create({
        data: {
          promotionId: promotion.id,
          status:
            compliance.status === "FLAGGED_AUTO"
              ? "FLAGGED_AUTO"
              : "COMPLIANT",
          violations: compliance.violations as unknown as object[],
          checkedAt: compliance.checkedAt,
        },
      });

      record = {
        id: promotion.id,
        type: "promotion",
        title: promotion.title,
        isApproved: promotion.isApproved,
        complianceStatus: compliance.status === "FLAGGED_AUTO" ? "FLAGGED_AUTO" : "COMPLIANT",
      };
    } else if (body.contentType === "pass") {
      const priceCents = Math.round(parseFloat(body.priceEuros || "0") * 100);
      const originalPriceCents = body.originalPriceEuros
        ? Math.round(parseFloat(body.originalPriceEuros) * 100)
        : null;

      const pass = await prisma.vIPPassEnhanced.create({
        data: {
          barId,
          name: body.title.trim(),
          description: body.description || null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          type: body.passType as any,
          imageUrl: body.imageUrl || null,
          priceCents,
          originalPriceCents,
          benefits: body.benefits || [],
          skipLinePriority: body.skipLinePriority ?? true,
          coverFeeIncluded: body.coverFeeIncluded ?? false,
          coverFeeAmount: body.coverFeeAmount || 0,
          validityStart: new Date(body.startDate || new Date().toISOString()),
          validityEnd: new Date(body.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()),
          validDays: body.validDays || [
            "Monday", "Tuesday", "Wednesday", "Thursday",
            "Friday", "Saturday", "Sunday",
          ],
          totalQuantity: body.totalQuantity || 100,
          maxPerUser: body.maxPerUser ?? 1,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          redemptionMode: (body.redemptionMode as any) || "SINGLE_USE",
          maxRedemptions: body.maxRedemptions || null,
          isActive: true,
          soldCount: 0,
        },
      });

      await prisma.complianceCheck.create({
        data: {
          passId: pass.id,
          status:
            compliance.status === "FLAGGED_AUTO"
              ? "FLAGGED_AUTO"
              : "COMPLIANT",
          violations: compliance.violations as unknown as object[],
          checkedAt: compliance.checkedAt,
        },
      });

      record = {
        id: pass.id,
        type: "pass",
        title: pass.name,
        priceCents: pass.priceCents,
        complianceStatus: compliance.status === "FLAGGED_AUTO" ? "FLAGGED_AUTO" : "COMPLIANT",
      };
    }

    // 7. Return success response
    return NextResponse.json({
      success: true,
      message: `${body.contentType.charAt(0).toUpperCase() + body.contentType.slice(1)} created successfully`,
      record,
      compliance: {
        status: compliance.status,
        violations: compliance.violations,
        summary: complianceSummary(compliance),
      },
    });
  } catch (error) {
    console.error("Submit error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Internal server error",
      },
      { status: 500 },
    );
  }
}
