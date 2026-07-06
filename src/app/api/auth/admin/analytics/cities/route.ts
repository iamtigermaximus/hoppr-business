// Route: GET /api/auth/admin/analytics/cities
// Description: Get bar count grouped by city

import { NextRequest, NextResponse } from "next/server";
import { verifyAuthHeader, isAdminToken } from "@/lib/auth";
import { prisma } from "@/lib/database";
import { handleApiError } from "@/lib/api-error";
import {
  CitiesAnalyticsResponse,
  CityAnalytics,
} from "@/types/admin-analytics";

export async function GET(request: NextRequest) {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isAdminToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const barsByCity = await prisma.bar.groupBy({
      by: ["cityName"],
      _count: { id: true },
      orderBy: {
        _count: { id: "desc" },
      },
    });

    // FIXED: Handle null cityName by converting to "Unknown"
    const formattedData: CityAnalytics[] = barsByCity.map((item) => ({
      city: item.cityName || "Unknown",
      count: item._count.id,
    }));

    const response: CitiesAnalyticsResponse = {
      success: true,
      data: formattedData,
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error, "Cities analytics error:");
  }
}
