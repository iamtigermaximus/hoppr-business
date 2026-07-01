// src/app/api/auth/bar/[barId]/passes/route.ts
// Bar dashboard VIP pass management — list and create pass offerings

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";

interface CreatePassBody {
  name: string;
  description?: string;
  type: string;
  priceCents: number;
  originalPriceCents?: number;
  benefits?: string[];
  skipLinePriority?: boolean;
  coverFeeIncluded?: boolean;
  coverFeeAmount?: number;
  validityStart: string;
  validityEnd: string;
  validDays?: string[];
  totalQuantity: number;
  maxPerUser?: number;
  redemptionMode?: string;
  maxRedemptions?: number | null;
}

const VALID_TYPES = ["SKIP_LINE", "COVER_INCLUDED", "PREMIUM_ENTRY", "DRINK_PACKAGE"];

// GET — list VIP passes for this bar
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
    const status = searchParams.get("status") || "all"; // all | active | inactive
    const search = searchParams.get("search") || undefined;
    const sortBy = (searchParams.get("sortBy") || "createdAt") as
      | "createdAt"
      | "name"
      | "priceCents"
      | "soldCount";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "25")),
    );
    const skip = (page - 1) * limit;

    let whereCondition: Record<string, unknown> = { barId };
    if (status === "active") {
      whereCondition = { barId, isActive: true };
    } else if (status === "inactive") {
      whereCondition = { barId, isActive: false };
    }

    // Search — match name OR description
    if (search) {
      whereCondition.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Sort — only allow known columns
    const validSortColumns = ["createdAt", "name", "priceCents", "soldCount"];
    const orderColumn = validSortColumns.includes(sortBy) ? sortBy : "createdAt";
    const orderDirection = sortOrder === "asc" ? "asc" : "desc";

    const [passes, total] = await Promise.all([
      prisma.vIPPassEnhanced.findMany({
        where: whereCondition as any,
        orderBy: { [orderColumn]: orderDirection },
        skip,
        take: limit,
      }),
      prisma.vIPPassEnhanced.count({ where: whereCondition as any }),
    ]);

    const formatted = passes.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      type: p.type,
      priceCents: p.priceCents,
      originalPriceCents: p.originalPriceCents,
      benefits: p.benefits,
      skipLinePriority: p.skipLinePriority,
      coverFeeIncluded: p.coverFeeIncluded,
      coverFeeAmount: p.coverFeeAmount,
      validityStart: p.validityStart.toISOString(),
      validityEnd: p.validityEnd.toISOString(),
      validDays: p.validDays,
      totalQuantity: p.totalQuantity,
      soldCount: p.soldCount,
      maxPerUser: p.maxPerUser,
      redemptionMode: p.redemptionMode,
      maxRedemptions: p.maxRedemptions,
      isActive: p.isActive,
      createdAt: p.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      passes: formatted,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Fetch bar passes error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST — create a new VIP pass offering
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

    const allowedRoles = ["OWNER", "MANAGER"];
    if (!payload.staffRole || !allowedRoles.includes(payload.staffRole)) {
      return NextResponse.json(
        { error: "Only owners and managers can create VIP passes" },
        { status: 403 },
      );
    }

    const body = (await request.json()) as CreatePassBody;

    if (!body.name || !body.type || !body.priceCents || !body.validityStart || !body.validityEnd || !body.totalQuantity) {
      return NextResponse.json(
        { error: "Missing required fields: name, type, priceCents, validityStart, validityEnd, totalQuantity" },
        { status: 400 },
      );
    }

    if (!VALID_TYPES.includes(body.type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` },
        { status: 400 },
      );
    }

    const pass = await prisma.vIPPassEnhanced.create({
      data: {
        barId,
        name: body.name,
        description: body.description || null,
        type: body.type as any,
        priceCents: body.priceCents,
        originalPriceCents: body.originalPriceCents || null,
        benefits: body.benefits || [],
        skipLinePriority: body.skipLinePriority ?? true,
        coverFeeIncluded: body.coverFeeIncluded ?? false,
        coverFeeAmount: body.coverFeeAmount || 0,
        validityStart: new Date(body.validityStart),
        validityEnd: new Date(body.validityEnd),
        validDays: body.validDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        totalQuantity: body.totalQuantity,
        maxPerUser: body.maxPerUser ?? 1,
        redemptionMode: (body.redemptionMode as any) || "SINGLE_USE",
        maxRedemptions: body.maxRedemptions || null,
        isActive: true,
        soldCount: 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: "VIP pass created successfully",
      pass: {
        id: pass.id,
        name: pass.name,
        type: pass.type,
        priceCents: pass.priceCents,
        totalQuantity: pass.totalQuantity,
        soldCount: pass.soldCount,
        redemptionMode: pass.redemptionMode,
        maxRedemptions: pass.maxRedemptions,
        isActive: pass.isActive,
      },
    });
  } catch (error) {
    console.error("Create bar pass error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
