/**
 * Busyness pattern aggregator — computes hourly average crowd levels
 * per bar per day-of-week from the CrowdReport table.
 *
 * Called nightly by the busyness-aggregation cron.
 */

import { prisma } from "@/lib/database";
import type { CrowdLevel } from "@prisma/client";

/** Numeric mapping for CrowdLevel enum (for averaging) */
const LEVEL_MAP: Record<CrowdLevel, number> = {
  QUIET: 1,
  GETTING_BUSY: 2,
  BUSY: 3,
  PACKED: 4,
  AT_CAPACITY: 5,
};

const REVERSE_LEVEL_MAP: Record<number, string> = {
  1: "QUIET",
  2: "GETTING_BUSY",
  3: "BUSY",
  4: "PACKED",
  5: "AT_CAPACITY",
};

export interface AggregationResult {
  barId: string;
  patternsUpserted: number;
}

/**
 * Aggregate one bar's CrowdReport data into BarBusynessPattern.
 * Looks at the last 30 days of reports.
 */
export async function aggregateBarBusyness(
  barId: string,
  daysBack = 30,
): Promise<AggregationResult> {
  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  const reports = await prisma.crowdReport.findMany({
    where: {
      barId,
      reportedAt: { gte: since },
    },
    select: { level: true, reportedAt: true },
  });

  if (reports.length === 0) {
    return { barId, patternsUpserted: 0 };
  }

  // Group by day-of-week + hour
  const buckets = new Map<string, { sum: number; count: number }>();

  for (const report of reports) {
    const date = new Date(report.reportedAt);
    const dayOfWeek = date.getUTCDay(); // 0=Sun … 6=Sat
    const hour = date.getUTCHours();
    const key = `${dayOfWeek}:${hour}`;
    const value = LEVEL_MAP[report.level];

    const existing = buckets.get(key) || { sum: 0, count: 0 };
    existing.sum += value;
    existing.count += 1;
    buckets.set(key, existing);
  }

  // Upsert patterns
  let upserted = 0;
  for (const [key, data] of buckets) {
    const [dayOfWeek, hour] = key.split(":").map(Number);
    const avgLevel = data.sum / data.count;

    await prisma.barBusynessPattern.upsert({
      where: {
        barId_dayOfWeek_hour: { barId, dayOfWeek, hour },
      },
      create: {
        barId,
        dayOfWeek,
        hour,
        avgLevel: Math.round(avgLevel * 100) / 100,
        sampleCount: data.count,
      },
      update: {
        avgLevel: Math.round(avgLevel * 100) / 100,
        sampleCount: data.count,
        computedAt: new Date(),
      },
    });
    upserted++;
  }

  // Compute ramp-up hours for each day of week
  await computeRampUpHours(barId, buckets);

  return { barId, patternsUpserted: upserted };
}

/**
 * For each day-of-week, find the ramp-up hour — the hour just before
 * the first significant busyness increase. This is the optimal send time.
 */
async function computeRampUpHours(
  barId: string,
  buckets: Map<string, { sum: number; count: number }>,
): Promise<void> {
  // Group by day of week
  const dayMap = new Map<number, Map<number, number>>();

  for (const [key, data] of buckets) {
    const [dow, hour] = key.split(":").map(Number);
    if (!dayMap.has(dow)) dayMap.set(dow, new Map());
    dayMap.get(dow)!.set(hour, data.sum / data.count);
  }

  for (const [dow, hours] of dayMap) {
    // Sort hours and find the first significant increase
    const sorted = [...hours.entries()].sort((a, b) => a[0] - b[0]);

    let rampUpHour: number | null = null;

    for (let i = 1; i < sorted.length; i++) {
      const [, prevLevel] = sorted[i - 1];
      const [hour, currLevel] = sorted[i];

      // If level jumps by >= 0.75 AND current hour is evening (18-23)
      // this is likely the ramp-up point
      if (currLevel - prevLevel >= 0.75 && hour >= 16 && hour <= 23) {
        // Ramp-up hour is 30-60 min before, so the hour before
        rampUpHour = hour - 1;
        break;
      }
    }

    // If no clear ramp-up found, use the hour with the highest level minus 1
    if (rampUpHour === null && sorted.length > 0) {
      const peak = sorted.reduce((a, b) => (a[1] > b[1] ? a : b));
      rampUpHour = Math.max(16, peak[0] - 1); // Don't go earlier than 4pm
    }

    if (rampUpHour !== null) {
      await prisma.barBusynessPattern.updateMany({
        where: { barId, dayOfWeek: dow },
        data: { rampUpHour: null },
      });

      // Set ramp-up on the pattern row for that hour
      await prisma.barBusynessPattern.updateMany({
        where: { barId, dayOfWeek: dow, hour: rampUpHour },
        data: { rampUpHour },
      });
    }
  }
}

/**
 * Aggregate all bars that have CrowdReport data and are CLAIMED/VERIFIED.
 */
export async function aggregateAllBars(
  daysBack = 30,
): Promise<AggregationResult[]> {
  const bars = await prisma.bar.findMany({
    where: {
      status: { in: ["CLAIMED", "VERIFIED"] },
      crowdReports: { some: {} },
    },
    select: { id: true },
  });

  const results: AggregationResult[] = [];
  for (const bar of bars) {
    const result = await aggregateBarBusyness(bar.id, daysBack);
    results.push(result);
  }

  console.log(
    `[Scheduler] Aggregation done: ${bars.length} bars, ${results.reduce((s, r) => s + r.patternsUpserted, 0)} patterns`,
  );
  return results;
}
