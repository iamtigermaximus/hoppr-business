import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isBarStaffToken } from "@/lib/auth";
import { getPerformanceInsights, getPerformanceWeightings } from "@/lib/performance-feedback";

/**
 * GET /api/auth/bar/[barId]/create/performance-insights?lookbackDays=90
 *
 * Returns actionable creative performance insights based on how content with
 * different creative ingredients (tone, template, audience, etc.) has performed
 * for this bar. Requires at least 3 snapshots with engagement data to produce
 * meaningful results.
 *
 * Part of the Performance Data Feedback Loop (Gap 2) — feeds creative director
 * with data-driven recommendations on which ingredients to prefer or avoid.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
): Promise<NextResponse> {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: No token provided" },
        { status: 401 },
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid token" },
        { status: 401 },
      );
    }

    if (!isBarStaffToken(payload)) {
      return NextResponse.json(
        { error: "Forbidden: Bar staff access required" },
        { status: 403 },
      );
    }

    const { barId } = await params;
    if (payload.barId !== barId) {
      return NextResponse.json(
        { error: "Forbidden: You don't have access to this bar" },
        { status: 403 },
      );
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const lookbackDays = parseInt(searchParams.get("lookbackDays") || "90", 10);
    const includeWeightings = searchParams.get("includeWeightings") === "true";

    // 3. Fetch performance data
    const [insights, weightings] = await Promise.all([
      getPerformanceInsights(barId, { lookbackDays }),
      includeWeightings
        ? getPerformanceWeightings(barId)
        : Promise.resolve(null),
    ]);

    // 4. Return response
    const response: Record<string, unknown> = {
      insights,
      meta: {
        lookbackDays,
        insightCount: insights.length,
        hasSufficientData: insights.length > 0,
        minSnapshotsRequired: 3,
      },
    };

    if (weightings) {
      response.weightings = weightings;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[PerformanceInsights] GET error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Internal server error",
      },
      { status: 500 },
    );
  }
}
