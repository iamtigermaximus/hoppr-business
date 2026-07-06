// Route: GET /api/auth/admin/analytics/bar-completion-scores
// Description: Get completion scores for all bars to identify missing data

import { NextRequest, NextResponse } from "next/server";
import { verifyAuthHeader, isAdminToken } from "@/lib/auth";
import {
  BarCompletionScoresResponse,
  BarCompletionScore,
  BarMissingFields,
} from "@/types/admin-analytics";
import { prisma } from "@/lib/database";
import { handleApiError } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isAdminToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allBars = await prisma.bar.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        cityName: true,
        district: true,
        description: true,
        coverImage: true,
        operatingHours: true,
        phone: true,
        website: true,
        amenities: true,
      },
      orderBy: { name: "asc" },
    });

    const barsWithScores: BarCompletionScore[] = allBars.map((bar) => {
      let score = 0;
      const totalFields = 6;
      if (bar.description) score++;
      if (bar.coverImage) score++;
      if (bar.operatingHours && Object.keys(bar.operatingHours).length > 0)
        score++;
      if (bar.phone) score++;
      if (bar.website) score++;
      if (bar.amenities && bar.amenities.length > 0) score++;
      const percentage = Math.round((score / totalFields) * 100);

      const missingFields: BarMissingFields = {
        description: !bar.description,
        coverImage: !bar.coverImage,
        operatingHours:
          !bar.operatingHours || Object.keys(bar.operatingHours).length === 0,
        phone: !bar.phone,
        website: !bar.website,
        amenities: !bar.amenities || bar.amenities.length === 0,
      };

      return {
        id: bar.id,
        name: bar.name,
        type: bar.type,
        city: bar.cityName || "Unknown",
        district: bar.district,
        completionScore: percentage,
        missingFields,
      };
    });

    const response: BarCompletionScoresResponse = {
      success: true,
      data: barsWithScores.sort(
        (a, b) => a.completionScore - b.completionScore,
      ),
      count: barsWithScores.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error, "Error fetching bar completion scores:");
  }
}
