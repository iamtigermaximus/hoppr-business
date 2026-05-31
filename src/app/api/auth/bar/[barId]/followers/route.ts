// Route: GET /api/auth/bar/[barId]/followers
// Description: Get follower analytics for a bar (growth, churn, recent followers)
// Query params: range (7d, 30d, 90d)

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verify } from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface JWTPayload {
  id: string;
  email: string;
  barId: string;
  name: string;
  role: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
): Promise<NextResponse> {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { barId } = await params;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verify(token, JWT_SECRET) as JWTPayload;
    if (decoded.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30d";

    const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Total follower count (all-time)
    const totalFollowers = await prisma.barFollow.count({
      where: { barId },
    });

    // New followers in the selected period
    const newFollowers = await prisma.barFollow.count({
      where: {
        barId,
        createdAt: { gte: startDate },
      },
    });

    // Follower growth over time (daily buckets)
    const growthData: { date: string; count: number; total: number }[] = [];
    let cumulativeTotal = totalFollowers - newFollowers; // start from pre-period baseline

    for (let d = 0; d < days; d++) {
      const dayStart = new Date(startDate);
      dayStart.setDate(dayStart.getDate() + d);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayCount = await prisma.barFollow.count({
        where: {
          barId,
          createdAt: { gte: dayStart, lt: dayEnd },
        },
      });

      cumulativeTotal += dayCount;
      growthData.push({
        date: dayStart.toISOString().split("T")[0],
        count: dayCount,
        total: cumulativeTotal,
      });
    }

    // Recent followers (last 10)
    const recentFollowers = await prisma.barFollow.findMany({
      where: { barId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    // Follower retention: followers from 30+ days ago (long-term followers)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const longTermFollowers = await prisma.barFollow.count({
      where: {
        barId,
        createdAt: { lte: thirtyDaysAgo },
      },
    });

    const retentionRate =
      totalFollowers > 0
        ? Math.round((longTermFollowers / totalFollowers) * 100)
        : 0;

    return NextResponse.json({
      totalFollowers,
      newFollowers,
      retentionRate,
      growthData,
      recentFollowers: recentFollowers.map((f) => ({
        id: f.id,
        userId: f.user.id,
        userName: f.user.name || f.user.username || "Anonymous",
        userImage: f.user.image,
        followedAt: f.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Follower analytics error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
