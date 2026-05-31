// POST /api/auth/admin/bars/calculate-scores
// Trigger quality score calculation for all bars (or a specific bar via ?barId=)
// Returns distribution summary and breakdown

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { authService } from "@/services/auth-service";
import {
  calculateQualityScore,
  QualityInput,
  QualityResult,
  PerformanceTier,
} from "@/lib/quality-scoring";

export async function POST(request: NextRequest) {
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
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const targetBarId = searchParams.get("barId");

    const now = new Date();

    // Fetch bars with all data needed for scoring
    const bars = await prisma.bar.findMany({
      where: targetBarId ? { id: targetBarId } : {},
      select: {
        id: true,
        name: true,
        description: true,
        coverImage: true,
        logoUrl: true,
        operatingHours: true,
        amenities: true,
        website: true,
        instagram: true,
        phone: true,
        email: true,
        priceRange: true,
        imageUrls: true,
        updatedAt: true,
        profileViews: true,
        directionClicks: true,
        websiteClicks: true,
        callClicks: true,
        shareCount: true,
        vipEnabled: true,
        isVerified: true,
        claimedAt: true,
        createdAt: true,
        status: true,
        promotions: {
          where: {
            startDate: { lte: now },
            endDate: { gte: now },
          },
          select: { id: true, startDate: true },
          orderBy: { startDate: "desc" },
          take: 1,
        },
        events: {
          where: {
            startTime: { gte: now },
          },
          select: { id: true, startTime: true },
          orderBy: { startTime: "asc" },
        },
      },
    });

    const results: {
      barId: string;
      name: string;
      score: number;
      tier: PerformanceTier;
    }[] = [];

    const tierCounts: Record<PerformanceTier, number> = {
      ACTIVE: 0,
      GROWING: 0,
      STAGNANT: 0,
      DEAD: 0,
      NEW: 0,
    };

    // Calculate scores and update bars in batches
    for (const bar of bars) {
      const input: QualityInput = {
        description: bar.description,
        coverImage: bar.coverImage,
        logoUrl: bar.logoUrl,
        operatingHours: bar.operatingHours as Record<string, unknown> | null,
        amenities: bar.amenities,
        website: bar.website,
        instagram: bar.instagram,
        phone: bar.phone,
        email: bar.email,
        priceRange: bar.priceRange,
        imageUrls: bar.imageUrls,
        updatedAt: bar.updatedAt,
        latestPromoStartDate: bar.promotions[0]?.startDate ?? null,
        latestEventDate: bar.events[0]?.startTime ?? null,
        profileViews: bar.profileViews,
        directionClicks: bar.directionClicks,
        websiteClicks: bar.websiteClicks,
        callClicks: bar.callClicks,
        shareCount: bar.shareCount,
        activePromoCount: bar.promotions.length,
        vipEnabled: bar.vipEnabled,
        upcomingEventCount: bar.events.length,
        isClaimed: bar.status !== "UNCLAIMED",
        claimedAt: bar.claimedAt,
        createdAt: bar.createdAt,
      };

      const result = calculateQualityScore(input);

      // Update bar in database
      await prisma.bar.update({
        where: { id: bar.id },
        data: {
          qualityScore: result.score,
          performanceTier: result.tier,
        },
      });

      results.push({
        barId: bar.id,
        name: bar.name,
        score: result.score,
        tier: result.tier,
      });

      tierCounts[result.tier]++;
    }

    // Calculate distribution stats
    const scores = results.map((r) => r.score);
    const avgScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
    const minScore = scores.length > 0 ? Math.min(...scores) : 0;

    return NextResponse.json({
      success: true,
      processed: results.length,
      stats: {
        averageScore: avgScore,
        highestScore: maxScore,
        lowestScore: minScore,
      },
      tierDistribution: tierCounts,
      results: results.sort((a, b) => b.score - a.score),
    });
  } catch (error) {
    console.error("Calculate scores error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
