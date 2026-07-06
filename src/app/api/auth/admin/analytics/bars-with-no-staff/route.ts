// Route: GET /api/auth/admin/analytics/bars-with-no-staff
// Description: Get bars that have no staff members assigned

import { NextRequest, NextResponse } from "next/server";
import { verifyAuthHeader, isAdminToken } from "@/lib/auth";
import {
  BarsWithNoStaffResponse,
  BarWithNoStaff,
} from "@/types/admin-analytics";
import { prisma } from "@/lib/database";
import { handleApiError } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isAdminToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bars = await prisma.bar.findMany({
      where: {
        staff: { none: {} },
      },
      select: {
        id: true,
        name: true,
        type: true,
        cityName: true,
        district: true,
        address: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });

    const formattedBars: BarWithNoStaff[] = bars.map((bar) => ({
      id: bar.id,
      name: bar.name,
      type: bar.type,
      city: bar.cityName || "Unknown",
      district: bar.district,
      address: bar.address,
      createdAt: bar.createdAt,
    }));

    const response: BarsWithNoStaffResponse = {
      success: true,
      data: formattedBars,
      count: formattedBars.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error, "Error fetching bars with no staff:");
  }
}
