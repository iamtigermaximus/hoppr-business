// GET /api/admin/credits — Returns credit status for all AI providers
// PUT /api/admin/credits — Updates credit pool settings
// Requires SUPER_ADMIN authentication — internal use only, never visible to bar owners

import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth-service";
import { handleApiError } from "@/lib/api-error";
import { getCreditStatus, getUsageByBar, updateCreditPool } from "@/lib/credit-tracker";
import type { Provider } from "@/lib/credit-tracker";

export async function GET(request: NextRequest) {
  try {
    // Admin auth check
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const authResult = await authService.validateToken(token);

    if (authResult.type !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider") as Provider | null;
    const days = parseInt(searchParams.get("days") || "30", 10);

    const [statuses, deepseekBars, bflBars] = await Promise.all([
      getCreditStatus(),
      getUsageByBar("deepseek", days),
      getUsageByBar("bfl_flux", days),
    ]);

    return NextResponse.json({
      statuses,
      usageByBar: {
        deepseek: deepseekBars,
        bfl_flux: bflBars,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
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
        { status: 403 },
      );
    }

    const body = await request.json();
    const { provider, totalCredits, alertThreshold, alertEmail, isActive } = body;

    if (!provider || !["deepseek", "bfl_flux"].includes(provider)) {
      return NextResponse.json(
        { error: "Valid provider required: 'deepseek' or 'bfl_flux'" },
        { status: 400 },
      );
    }

    await updateCreditPool(provider as Provider, {
      totalCredits,
      alertThreshold,
      alertEmail,
      isActive,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
