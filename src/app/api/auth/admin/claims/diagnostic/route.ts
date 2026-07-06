// GET /api/auth/admin/claims/diagnostic
// Diagnostic endpoint for bar claims — requires SUPER_ADMIN authentication.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { verifyAuthHeader, isAdminToken } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  const payload = verifyAuthHeader(request);
  if (!payload || !isAdminToken(payload) || payload.adminRole !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Unauthorized — SUPER_ADMIN access required" },
      { status: 401 },
    );
  }

  try {
    const [total, byStatus] = await Promise.all([
      prisma.barClaim.count(),
      prisma.barClaim.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
    ]);

    const latest = await prisma.barClaim.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        createdAt: true,
        bar: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      total,
      byStatus: byStatus.map((g) => ({
        status: g.status,
        count: g._count.id,
      })),
      latest,
    });
  } catch (error) {
    return handleApiError(error, "Claims diagnostic error:");
  }
}
