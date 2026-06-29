// GET /api/auth/admin/claims/diagnostic
// Quick diagnostic: count all bar_claims rows regardless of auth
// Remove this after confirming the issue

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { authService } from "@/services/auth-service";

export async function GET(request: NextRequest) {
  // Also check auth to diagnose permission issues
  let authInfo: any = { checked: false };
  try {
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const result = await authService.validateToken(token);
        authInfo = {
          checked: true,
          type: result.type,
          adminRole: result.type === "admin" ? result.user.adminRole : null,
          hasAccess: result.type === "admin" && result.user.adminRole === "SUPER_ADMIN",
        };
      } catch (e: any) {
        authInfo = { checked: true, error: e.message };
      }
    } else {
      authInfo = { checked: true, error: "No Bearer token in Authorization header" };
    }
  } catch {}

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
      auth: authInfo,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, code: error.code, meta: error.meta },
      { status: 500 }
    );
  }
}
