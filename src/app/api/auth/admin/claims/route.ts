// GET /api/auth/admin/claims
// List bar claims with optional status filter
// Query params: status (CLAIMED|VERIFIED|REJECTED), page, limit

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { authService } from "@/services/auth-service";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const authResult = await authService.validateToken(token);

    if (
      authResult.type !== "admin" ||
      authResult.user.adminRole !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        { error: "Super admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "CLAIMED";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status !== "ALL") {
      where.status = status;
    }

    const [claims, total] = await Promise.all([
      prisma.barClaim.findMany({
        where,
        include: {
          bar: {
            select: {
              id: true,
              name: true,
              cityName: true,
              district: true,
              type: true,
              coverImage: true,
              status: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          reviewedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.barClaim.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      claims,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Fetch claims error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
