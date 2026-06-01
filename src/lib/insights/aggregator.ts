import { prisma } from "@/lib/database";

export interface WeeklySummary {
  totalViews: number;
  totalClicks: number;
  bestDay: string;
  bestDayCount: number;
  topPost: { title: string; type: string; views: number } | null;
  comparisonToLastWeek: { viewsChange: number; percentChange: number };
}

export async function computeWeeklySummary(
  barId: string
): Promise<WeeklySummary> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const thisWeek = await prisma.analyticsEvent.groupBy({
    by: ["type"],
    where: {
      barId,
      createdAt: { gte: weekAgo, lte: now },
    },
    _count: { id: true },
  });

  const lastWeek = await prisma.analyticsEvent.groupBy({
    by: ["type"],
    where: {
      barId,
      createdAt: { gte: twoWeeksAgo, lt: weekAgo },
    },
    _count: { id: true },
  });

  const totalViews = thisWeek.reduce((s, r) => s + r._count.id, 0);
  const lastWeekTotal = lastWeek.reduce((s, r) => s + r._count.id, 0);
  const viewsChange = totalViews - lastWeekTotal;
  const percentChange =
    lastWeekTotal > 0 ? Math.round((viewsChange / lastWeekTotal) * 100) : 0;

  // Best day — aggregate by date (raw query for DATE() function)
  const byDate = await prisma.$queryRawUnsafe<
    { date: string; count: bigint }[]
  >(
    `SELECT DATE("createdAt") as date, COUNT(*) as count
     FROM "analytics_events"
     WHERE "barId" = $1
       AND "createdAt" >= $2
       AND "createdAt" <= $3
     GROUP BY DATE("createdAt")
     ORDER BY count DESC
     LIMIT 1`,
    barId,
    weekAgo,
    now
  );

  const bestDay =
    byDate.length > 0
      ? new Date(byDate[0].date).toLocaleDateString("en-US", {
          weekday: "long",
        })
      : "N/A";
  const bestDayCount = byDate.length > 0 ? Number(byDate[0].count) : 0;

  // Total clicks from promo clicks + event joins
  const clicks = thisWeek
    .filter((r) => r.type === "PROMO_CLICK" || r.type === "EVENT_JOIN")
    .reduce((s, r) => s + r._count.id, 0);

  return {
    totalViews,
    totalClicks: clicks,
    bestDay,
    bestDayCount,
    topPost: null,
    comparisonToLastWeek: { viewsChange, percentChange },
  };
}
