// Route: GET /api/auth/admin/analytics/districts
// Description: Get bar count grouped by district (Helsinki only)

import { NextRequest, NextResponse } from "next/server";
import { verifyAuthHeader, isAdminToken } from "@/lib/auth";
import {
  DistrictsAnalyticsResponse,
  DistrictAnalytics,
} from "@/types/admin-analytics";
import { prisma } from "@/lib/database";
import { handleApiError } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isAdminToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const barsByDistrict = await prisma.bar.groupBy({
      by: ["district"],
      where: {
        district: { not: null },
      },
      _count: { id: true },
      orderBy: {
        _count: { id: "desc" },
      },
    });

    const formattedData: DistrictAnalytics[] = barsByDistrict.map((item) => ({
      district: item.district as string,
      count: item._count.id,
    }));

    const response: DistrictsAnalyticsResponse = {
      success: true,
      data: formattedData,
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error, "Districts analytics error:");
  }
}
