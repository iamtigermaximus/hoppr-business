// Route: GET /api/auth/admin/analytics/missing-bars
// Description: Get bars missing specific data
// Query params: type (images, hours, description, coordinates, unverified, inactive)

import { NextRequest, NextResponse } from "next/server";
import { verifyAuthHeader, isAdminToken } from "@/lib/auth";
import {
  MissingBarsResponse,
  MissingBarItem,
  MissingBarsType,
} from "@/types/admin-analytics";
import { prisma } from "@/lib/database";
import { handleApiError } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isAdminToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const missingType = searchParams.get("type") as MissingBarsType;

    let whereCondition = {};

    switch (missingType) {
      case "images":
        whereCondition = { coverImage: null };
        break;
      case "hours":
        whereCondition = { operatingHours: {} };
        break;
      case "description":
        whereCondition = { description: null };
        break;
      case "coordinates":
        whereCondition = {
          OR: [{ latitude: null }, { longitude: null }],
        };
        break;
      case "unverified":
        whereCondition = { isVerified: false };
        break;
      case "inactive":
        whereCondition = { isActive: false };
        break;
      default:
        return NextResponse.json(
          {
            error:
              "Invalid missing type. Use: images, hours, description, coordinates, unverified, inactive",
          },
          { status: 400 },
        );
    }

    const bars = await prisma.bar.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        type: true,
        cityName: true,
        district: true,
        address: true,
        coverImage: true,
        description: true,
        operatingHours: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });

    const formattedBars: MissingBarItem[] = bars.map((bar) => ({
      id: bar.id,
      name: bar.name,
      type: bar.type,
      city: bar.cityName || "Unknown",
      district: bar.district,
      address: bar.address,
      coverImage: bar.coverImage,
      description: bar.description,
      operatingHours: bar.operatingHours as Record<
        string,
        { open: string; close: string }
      > | null,
      isVerified: bar.isVerified,
      isActive: bar.isActive,
      createdAt: bar.createdAt,
    }));

    const response: MissingBarsResponse = {
      success: true,
      data: formattedBars,
      count: formattedBars.length,
      missingType: missingType,
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error, "Missing bars error:");
  }
}
