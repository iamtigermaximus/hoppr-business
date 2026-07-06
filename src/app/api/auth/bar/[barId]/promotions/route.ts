// src/app/api/auth/bar/[barId]/promotions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PromotionType } from "@prisma/client";
import { prisma } from "@/lib/database";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";
import { scanCompliance, complianceSummary } from "@/lib/compliance-engine";
import { checkPlanLimit } from "@/lib/plan-limits";
import { handleApiError } from "@/lib/api-error";

interface CreatePromotionBody {
  title: string;
  description: string;
  type: PromotionType;
  discountValue?: number;
  startDate: string;
  endDate: string;
  conditions?: string[];
  validDays?: string[];
  targetAudience?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
) {
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
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || undefined;
    const typeFilter = searchParams.get("type") as PromotionType | undefined;
    const sortBy = (searchParams.get("sortBy") || "createdAt") as
      | "createdAt"
      | "title"
      | "startDate"
      | "endDate"
      | "redemptions"
      | "views"
      | "clicks";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "25")),
    );
    const skip = (page - 1) * limit;

    // Build where — barId always required, then stack optional filters
    const whereCondition: Record<string, unknown> = { barId };

    // Status filter
    if (status === "active") {
      whereCondition.isActive = true;
      whereCondition.isApproved = true;
      whereCondition.endDate = { gte: new Date() };
    } else if (status === "pending") {
      whereCondition.isApproved = false;
    } else if (status === "expired") {
      whereCondition.endDate = { lt: new Date() };
    }

    // Type filter — validate against known PromotionType values
    if (typeFilter) {
      const validTypes = [
        "HAPPY_HOUR",
        "DRINK_SPECIAL",
        "FOOD_SPECIAL",
        "LADIES_NIGHT",
        "THEME_NIGHT",
        "VIP_OFFER",
        "COVER_DISCOUNT",
        "LIVE_MUSIC_EVENT",
        "GAME_NIGHT",
      ];
      if (validTypes.includes(typeFilter)) {
        whereCondition.type = typeFilter;
      }
    }

    // Search — match title OR description (case-insensitive via PostgreSQL)
    if (search) {
      whereCondition.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Sort — only allow known columns to prevent injection
    const validSortColumns = [
      "createdAt",
      "title",
      "startDate",
      "endDate",
      "redemptions",
      "views",
      "clicks",
    ];
    const orderColumn = validSortColumns.includes(sortBy)
      ? sortBy
      : "createdAt";
    const orderDirection = sortOrder === "asc" ? "asc" : "desc";

    const [promotions, total] = await Promise.all([
      prisma.barPromotion.findMany({
        where: whereCondition as any,
        orderBy: { [orderColumn]: orderDirection },
        skip,
        take: limit,
      }),
      prisma.barPromotion.count({ where: whereCondition as any }),
    ]);

    return NextResponse.json({
      success: true,
      promotions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error, "Fetch promotions error");
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
) {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isBarStaffToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { barId } = await params;
    if (payload.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Plan limit check: only OWNER/MANAGER can exceed limits (staff roles are gated by role check anyway)
    const barPlan = await prisma.bar.findUnique({
      where: { id: barId },
      select: { plan: true, _count: { select: { promotions: true } } },
    });
    if (barPlan) {
      const limitCheck = checkPlanLimit(barPlan.plan, "promotions", barPlan._count.promotions);
      if (!limitCheck.allowed) {
        return NextResponse.json({ error: limitCheck.reason }, { status: 402 });
      }
    }

    const body = (await request.json()) as CreatePromotionBody;

    if (
      !body.title ||
      !body.description ||
      !body.type ||
      !body.startDate ||
      !body.endDate
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: title, description, type, startDate, endDate",
        },
        { status: 400 },
      );
    }

    let validDays: string[];
    if (body.validDays && body.validDays.length > 0) {
      validDays = body.validDays;
    } else if (body.targetAudience) {
      validDays = getValidDaysFromAudience(body.targetAudience);
    } else {
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

    const promotion = await prisma.barPromotion.create({
      data: {
        barId,
        title: body.title,
        description: body.description,
        type: body.type,
        discount: body.discountValue || null,
        conditions: body.conditions || [],
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        validDays: validDays,
        isActive: true,
        isApproved:
          payload.staffRole === "OWNER" || payload.staffRole === "MANAGER", // Auto-approve for managers
        priority: 1,
        views: 0,
        clicks: 0,
        redemptions: 0,
      },
    });

    // ---- Compliance check ----
    const compliance = scanCompliance(body.title, body.description);

    let finalComplianceStatus = promotion.complianceStatus;
    if (compliance.status === "FLAGGED_AUTO") {
      finalComplianceStatus = "FLAGGED_AUTO";
      await prisma.barPromotion.update({
        where: { id: promotion.id },
        data: { complianceStatus: "FLAGGED_AUTO" },
      });
    }

    // Store compliance check record for audit trail
    await prisma.complianceCheck.create({
      data: {
        promotionId: promotion.id,
        status: finalComplianceStatus,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        violations: compliance.violations as any,
        checkedAt: compliance.checkedAt,
      },
    });

    console.log(
      `✅ Promotion created for bar ${barId}: ${promotion.title} — ${complianceSummary(compliance)}`,
    );

    return NextResponse.json({
      success: true,
      message: "Promotion created and pending approval",
      promotion: {
        id: promotion.id,
        title: promotion.title,
        type: promotion.type,
        startDate: promotion.startDate,
        endDate: promotion.endDate,
        isApproved: promotion.isApproved,
        complianceStatus: finalComplianceStatus,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        violations: compliance.violations as any,
        complianceSummary: complianceSummary(compliance),
      },
    });
  } catch (error) {
    console.error("Create promotion error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

function getValidDaysFromAudience(targetAudience: string): string[] {
  switch (targetAudience) {
    case "WEEKEND":
      return ["Friday", "Saturday"];
    case "WEEKDAY":
      return ["Monday", "Tuesday", "Wednesday", "Thursday"];
    default:
      return [
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
