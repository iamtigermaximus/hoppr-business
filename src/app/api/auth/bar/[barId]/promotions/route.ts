// src/app/api/auth/bar/[barId]/promotions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, PromotionType } from "@prisma/client";
import { verify } from "jsonwebtoken";
import { scanCompliance, complianceSummary } from "@/lib/compliance-engine";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface JWTPayload {
  id: string;
  email: string;
  barId: string;
  name: string;
  role: string;
  staffRole?: string;
}

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
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { barId } = await params;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verify(token, JWT_SECRET) as JWTPayload;
    if (decoded.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";

    let whereCondition: Record<string, unknown> = { barId };

    if (status === "active") {
      whereCondition = {
        barId,
        isActive: true,
        isApproved: true,
        endDate: { gte: new Date() },
      };
    } else if (status === "pending") {
      whereCondition = {
        barId,
        isApproved: false,
      };
    }
    // "all" returns everything - no additional filter

    const promotions = await prisma.barPromotion.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, promotions });
  } catch (error) {
    console.error("Fetch promotions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { barId } = await params;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verify(token, JWT_SECRET) as JWTPayload;
    if (decoded.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
          decoded.staffRole === "OWNER" || decoded.staffRole === "MANAGER", // Auto-approve for managers
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
