// PATCH /api/auth/admin/bars/[id]/plan — Temporarily set bar plan for testing
import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth-service";
import { prisma } from "@/lib/database";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const authResult = await authService.validateToken(authHeader.substring(7));
    if (authResult.type !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { plan } = body;

    if (!["FREE", "PRO", "PREMIUM"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan. Must be FREE, PRO, or PREMIUM." },
        { status: 400 },
      );
    }

    const bar = await prisma.bar.update({
      where: { id },
      data: { plan },
      select: { id: true, name: true, plan: true },
    });

    return NextResponse.json({ success: true, bar });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 500 },
    );
  }
}
