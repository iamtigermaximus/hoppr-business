// Route: GET /api/auth/admin/analytics/bar-types
// Description: Get bar count grouped by bar type

import { NextRequest, NextResponse } from "next/server";
import { verifyAuthHeader, isAdminToken } from "@/lib/auth";
import {
  BarTypesAnalyticsResponse,
  BarTypeAnalytics,
} from "@/types/admin-analytics";
import { prisma } from "@/lib/database";
import { handleApiError } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isAdminToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const barsByType = await prisma.bar.groupBy({
      by: ["type"],
      _count: { id: true },
      orderBy: {
        _count: { id: "desc" },
      },
    });

    const formattedData: BarTypeAnalytics[] = barsByType.map((item) => ({
      type: item.type,
      count: item._count.id,
    }));

    const response: BarTypesAnalyticsResponse = {
      success: true,
      data: formattedData,
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error, "Bar types analytics error:");
  }
}
