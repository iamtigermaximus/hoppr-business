// GET /api/auth/bar/[barId]/benchmarks
// Returns percentile rankings comparing this bar against peer bars
// (same district, type, or price range) across key performance metrics.

import { NextRequest, NextResponse } from "next/server";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";
import { prisma } from "@/lib/database";

// ---- Types ----

interface MetricComparison {
  metric: string;
  label: string;
  yourValue: number;
  peerAverage: number;
  peerMedian: number;
  peerTop20: number; // 80th percentile — "top 20% threshold"
  percentile: number; // 0-100 — where you rank in the peer group
  direction: "higher-is-better" | "lower-is-better";
  unit?: string;
}

interface Recommendation {
  metric: string;
  severity: "warning" | "opportunity" | "strength";
  message: string;
  actionLabel: string;
  actionRoute: string; // relative route in the bar portal
}

interface BenchmarkResponse {
  success: boolean;
  bar: {
    name: string;
    type: string;
    district: string;
    priceRange: string;
  };
  peerGroup: {
    totalBars: number;
    segmentBy: string[]; // which segments were used
  };
  comparisons: MetricComparison[];
  recommendations: Recommendation[];
}

// ---- Helpers ----

/** Calculate percentile: what % of values are below the given value? */
function percentile(value: number, allValues: number[]): number {
  if (allValues.length === 0) return 50;
  const sorted = [...allValues].sort((a, b) => a - b);
  const below = sorted.filter((v) => v < value).length;
  return Math.round((below / sorted.length) * 100);
}

/** Calculate 80th percentile threshold (top 20% cutoff) */
function top20Threshold(allValues: number[]): number {
  if (allValues.length === 0) return 0;
  const sorted = [...allValues].sort((a, b) => a - b);
  const idx = Math.floor(sorted.length * 0.8);
  return sorted[Math.min(idx, sorted.length - 1)];
}

/** Average */
function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

/** Median */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

// ---- Recommendations engine ----

function generateRecommendations(
  comparisons: MetricComparison[],
): Recommendation[] {
  const recs: Recommendation[] = [];

  for (const c of comparisons) {
    if (c.percentile >= 80) {
      // Top 20% — strength
      if (c.metric === "promoViews") {
        recs.push({
          metric: c.metric,
          severity: "strength",
          message: `Your promos get ${c.yourValue} views/month — top ${100 - c.percentile}% in your area. Consider boosting your best-performing promo to reach even more.`,
          actionLabel: "View promotions",
          actionRoute: "/promotions",
        });
      } else if (c.metric === "campaignCTR") {
        recs.push({
          metric: c.metric,
          severity: "strength",
          message: `Your campaign CTR of ${c.yourValue}% is top ${100 - c.percentile}%. Your audience is engaged — consider increasing your campaign budget to capture more.`,
          actionLabel: "Manage campaigns",
          actionRoute: "/campaigns",
        });
      }
    } else if (c.percentile < 30) {
      // Bottom 30% — warning or opportunity
      if (c.metric === "eventJoins") {
        const activeCount = comparisons.find(
          (x) => x.metric === "activeEvents",
        );
        if (activeCount && activeCount.yourValue === 0) {
          recs.push({
            metric: c.metric,
            severity: "warning",
            message:
              "Bars with at least 1 active event per week see 3x more follower growth. You have no upcoming events.",
            actionLabel: "Create an event",
            actionRoute: "/create?type=event",
          });
        } else {
          recs.push({
            metric: c.metric,
            severity: "opportunity",
            message: `Your event attendance is below average. Try promoting your events earlier — bars that post events 5+ days in advance see 40% more joins.`,
            actionLabel: "View events",
            actionRoute: "/events",
          });
        }
      } else if (c.metric === "followerGrowth") {
        recs.push({
          metric: c.metric,
          severity: "warning",
          message:
            "Your follower growth is below average. Bars with active events and promotions grow followers significantly faster.",
          actionLabel: "Create content",
          actionRoute: "/create",
        });
      } else if (c.metric === "promoViews") {
        recs.push({
          metric: c.metric,
          severity: "opportunity",
          message:
            "Your promo views are below average. Try posting promotions more frequently — bars with 2+ active promos get 2.5x more profile views.",
          actionLabel: "Create a promotion",
          actionRoute: "/create?type=promotion",
        });
      } else if (c.metric === "barViews") {
        recs.push({
          metric: c.metric,
          severity: "opportunity",
          message:
            "Your bar profile views are below average. Make sure your profile is complete with good photos, description, and amenities.",
          actionLabel: "Edit profile",
          actionRoute: "/profile",
        });
      }
    }
  }

  // If no specific recommendations but there are comparisons, add a general one
  if (recs.length === 0 && comparisons.length > 0) {
    const topMetric = [...comparisons].sort(
      (a, b) => b.percentile - a.percentile,
    )[0];
    if (topMetric) {
      recs.push({
        metric: topMetric.metric,
        severity: "strength",
        message: `Your strongest metric is ${topMetric.label.toLowerCase()} — you're in the top ${100 - topMetric.percentile}% of bars in your area. Keep it up!`,
        actionLabel: "View dashboard",
        actionRoute: "/dashboard",
      });
    }
  }

  return recs;
}

// ---- Route handler ----

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
): Promise<NextResponse> {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isBarStaffToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { barId } = await params;
    if (payload.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 1. Fetch current bar's metadata
    const bar = await prisma.bar.findUnique({
      where: { id: barId },
      select: {
        name: true,
        type: true,
        district: true,
        cityName: true,
        priceRange: true,
      },
    });

    if (!bar) {
      return NextResponse.json({ error: "Bar not found" }, { status: 404 });
    }

    // 2. Find peer bars — same district, type, OR price range (at least one match)
    const peerConditions: Record<string, unknown>[] = [];
    if (bar.district) peerConditions.push({ district: bar.district });
    if (bar.type) peerConditions.push({ type: bar.type });
    if (bar.priceRange) peerConditions.push({ priceRange: bar.priceRange });

    const peerBars =
      peerConditions.length > 0
        ? await prisma.bar.findMany({
            where: {
              id: { not: barId }, // exclude current bar from peers
              OR: peerConditions,
            },
            select: { id: true, district: true, type: true, priceRange: true },
          })
        : [];

    const peerIds = peerBars.map((b) => b.id);

    // Determine which segments were used
    const segments: string[] = [];
    if (bar.district) segments.push(`District: ${bar.district}`);
    if (bar.type) segments.push(`Type: ${bar.type}`);
    if (bar.priceRange) segments.push(`Price: ${bar.priceRange}`);

    // 3. Aggregate metrics for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // Current bar's 30-day stats
    const [myStats, peerStatsAgg] = await Promise.all([
      // My bar's aggregated stats
      prisma.barDailyStats.aggregate({
        where: {
          barId,
          date: { gte: thirtyDaysAgo },
        },
        _sum: {
          promoViews: true,
          eventJoins: true,
          barViews: true,
          barShares: true,
        },
      }),
      // Peer bars' aggregated stats — sum per bar
      prisma.barDailyStats.groupBy({
        by: ["barId"],
        where: {
          barId: { in: peerIds },
          date: { gte: thirtyDaysAgo },
        },
        _sum: {
          promoViews: true,
          eventJoins: true,
          barViews: true,
          barShares: true,
        },
      }),
    ]);

    // 4. Follower growth — last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [myFollowerGrowth, peerFollowerGrowth] = await Promise.all([
      prisma.barFollow.count({
        where: { barId, createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.barFollow.groupBy({
        by: ["barId"],
        where: {
          barId: { in: peerIds },
          createdAt: { gte: sevenDaysAgo },
        },
        _count: { id: true },
      }),
    ]);

    // 5. Active events count (upcoming)
    const now = new Date();
    const [myActiveEvents, peerActiveEvents] = await Promise.all([
      prisma.event.count({
        where: {
          venueId: barId,
          startTime: { gte: now },
        },
      }),
      prisma.event.groupBy({
        by: ["venueId"],
        where: {
          venueId: { in: peerIds },
          startTime: { gte: now },
        },
        _count: { id: true },
      }),
    ]);

    // 6. Active campaigns count
    const [myCampaigns, peerCampaigns] = await Promise.all([
      prisma.adCampaign.count({
        where: {
          barId,
          status: "ACTIVE",
          startDate: { lte: now },
          endDate: { gte: now },
        },
      }),
      prisma.adCampaign.groupBy({
        by: ["barId"],
        where: {
          barId: { in: peerIds },
          status: "ACTIVE",
          startDate: { lte: now },
          endDate: { gte: now },
        },
        _count: { id: true },
      }),
    ]);

    // 7. Build comparisons
    const myVals = {
      promoViews: myStats._sum.promoViews ?? 0,
      eventJoins: myStats._sum.eventJoins ?? 0,
      barViews: myStats._sum.barViews ?? 0,
      barShares: myStats._sum.barShares ?? 0,
      followerGrowth: myFollowerGrowth,
      activeEvents: myActiveEvents,
      activeCampaigns: myCampaigns,
    };

    const peerVals = {
      promoViews: peerStatsAgg.map((s) => s._sum.promoViews ?? 0),
      eventJoins: peerStatsAgg.map((s) => s._sum.eventJoins ?? 0),
      barViews: peerStatsAgg.map((s) => s._sum.barViews ?? 0),
      barShares: peerStatsAgg.map((s) => s._sum.barShares ?? 0),
      followerGrowth: peerFollowerGrowth.map((g) => g._count.id),
      activeEvents: peerActiveEvents.map((e) => e._count.id ?? 0),
      activeCampaigns: peerCampaigns.map((c) => c._count.id),
    };

    const comparisons: MetricComparison[] = [
      {
        metric: "promoViews",
        label: "Promo views (30d)",
        yourValue: myVals.promoViews,
        peerAverage: average(peerVals.promoViews),
        peerMedian: median(peerVals.promoViews),
        peerTop20: top20Threshold(peerVals.promoViews),
        percentile: percentile(myVals.promoViews, peerVals.promoViews),
        direction: "higher-is-better",
      },
      {
        metric: "eventJoins",
        label: "Event joins (30d)",
        yourValue: myVals.eventJoins,
        peerAverage: average(peerVals.eventJoins),
        peerMedian: median(peerVals.eventJoins),
        peerTop20: top20Threshold(peerVals.eventJoins),
        percentile: percentile(myVals.eventJoins, peerVals.eventJoins),
        direction: "higher-is-better",
      },
      {
        metric: "barViews",
        label: "Profile views (30d)",
        yourValue: myVals.barViews,
        peerAverage: average(peerVals.barViews),
        peerMedian: median(peerVals.barViews),
        peerTop20: top20Threshold(peerVals.barViews),
        percentile: percentile(myVals.barViews, peerVals.barViews),
        direction: "higher-is-better",
      },
      {
        metric: "followerGrowth",
        label: "Follower growth (7d)",
        yourValue: myVals.followerGrowth,
        peerAverage: average(peerVals.followerGrowth),
        peerMedian: median(peerVals.followerGrowth),
        peerTop20: top20Threshold(peerVals.followerGrowth),
        percentile: percentile(
          myVals.followerGrowth,
          peerVals.followerGrowth,
        ),
        direction: "higher-is-better",
      },
      {
        metric: "activeEvents",
        label: "Active events",
        yourValue: myVals.activeEvents,
        peerAverage: Math.round(average(peerVals.activeEvents)),
        peerMedian: median(peerVals.activeEvents),
        peerTop20: top20Threshold(peerVals.activeEvents),
        percentile: percentile(myVals.activeEvents, peerVals.activeEvents),
        direction: "higher-is-better",
      },
    ];

    // 8. Generate recommendations
    const recommendations = generateRecommendations(comparisons);

    const result: BenchmarkResponse = {
      success: true,
      bar: {
        name: bar.name,
        type: bar.type,
        district: bar.district || "Unknown",
        priceRange: bar.priceRange || "Unknown",
      },
      peerGroup: {
        totalBars: peerIds.length + 1, // +1 includes the current bar
        segmentBy: segments,
      },
      comparisons,
      recommendations,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Benchmark API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate benchmarks",
      },
      { status: 500 },
    );
  }
}
