// Route: GET /api/auth/admin/analytics/inactive-bars
// Description: Get bars that haven't been updated in over 30 days

import { NextRequest, NextResponse } from "next/server";
import { verifyAuthHeader, isAdminToken } from "@/lib/auth";
import { InactiveBarsResponse, InactiveBar } from "@/types/admin-analytics";
import { prisma } from "@/lib/database";
import { handleApiError } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isAdminToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const bars = await prisma.bar.findMany({
      where: {
        updatedAt: { lt: thirtyDaysAgo },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        type: true,
        cityName: true,
        district: true,
        address: true,
        updatedAt: true,
        createdAt: true,
      },
      orderBy: { updatedAt: "asc" },
    });

    const formattedBars: InactiveBar[] = bars.map((bar) => ({
      id: bar.id,
      name: bar.name,
      type: bar.type,
      city: bar.cityName || "Unknown",
      district: bar.district,
      address: bar.address,
      updatedAt: bar.updatedAt,
      createdAt: bar.createdAt,
    }));

    const response: InactiveBarsResponse = {
      success: true,
      data: formattedBars,
      count: formattedBars.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error, "Error fetching inactive bars:");
  }
}
