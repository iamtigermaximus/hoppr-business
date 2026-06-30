/**
 * Timing engine — determines the optimal send time for a promotion or event
 * notification based on the bar's historical busyness patterns.
 */

import { prisma } from "@/lib/database";

export interface OptimalTime {
  /** The computed optimal send time (ISO string) */
  scheduledAt: Date;
  /** Human-readable explanation for the bar dashboard */
  reasoning: string;
  /** The day of week and hour the decision was based on */
  basedOn: {
    dayOfWeek: number;
    hour: number;
    avgLevel: number;
  } | null;
}

/**
 * Safety window: never send notifications before 08:00 or after 23:00 local.
 */
const EARLIEST_HOUR = 8;
const LATEST_HOUR = 23;

/**
 * Compute the optimal send time for a promotion.
 *
 * Strategy:
 * 1. If the promo has specific validHours, use those to find the best day.
 * 2. Look up BarBusynessPattern for the bar.
 * 3. Find the ramp-up hour for the promo's valid days.
 * 4. Schedule 30-60 min before the ramp-up.
 * 5. If no pattern data, fall back to now + 2 hours (sooner is better than never).
 */
export async function computeOptimalSendTime(
  barId: string,
  promoStartDate?: Date,
  promoEndDate?: Date,
  validDays?: string[],
  validHours?: { start?: string; end?: string } | null,
): Promise<OptimalTime> {
  // Determine which days of the week are valid for this promo
  const targetDays = resolveDaysOfWeek(validDays);

  // Look up busyness patterns for this bar
  const patterns = await prisma.barBusynessPattern.findMany({
    where: {
      barId,
      dayOfWeek: { in: targetDays },
    },
    orderBy: { avgLevel: "desc" },
  });

  // If we have patterns, use them
  if (patterns.length > 0) {
    return computeFromPatterns(patterns, barId, promoStartDate);
  }

  // Fallback: no pattern data — send soon, but within the safety window
  return computeFallback(promoStartDate);
}

function resolveDaysOfWeek(validDays?: string[]): number[] {
  const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]; // Sun-Sat

  if (!validDays || validDays.length === 0) return ALL_DAYS;

  const dayMap: Record<string, number> = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 0,
  };

  return validDays
    .map((d) => dayMap[d.toLowerCase()])
    .filter((d): d is number => d !== undefined);
}

function computeFromPatterns(
  patterns: Awaited<
    ReturnType<typeof prisma.barBusynessPattern.findMany>
  >,
  barId: string,
  promoStart?: Date,
): OptimalTime {
  // Find the busiest day+hour combo
  const peak = patterns[0];

  // Find the ramp-up hour for the peak day
  const rampPattern = patterns.find(
    (p) => p.dayOfWeek === peak.dayOfWeek && p.rampUpHour !== null,
  );

  const rampUpHour = rampPattern?.rampUpHour ?? peak.hour - 1;

  // Schedule for the next occurrence of that day, at ramp-up hour
  const now = new Date();
  const scheduled = getNextDayAtHour(now, peak.dayOfWeek, rampUpHour);

  // If the promo has already started (or starts today), we may need to
  // send immediately or wait for the next valid day
  if (promoStart && promoStart <= now) {
    // Already started — find the next valid ramp-up (today or tomorrow)
    const today = now.getDay();
    const todayHour = now.getHours();

    // If today is a valid day and the ramp-up is still ahead, use it
    if (peak.dayOfWeek === today && rampUpHour > todayHour) {
      scheduled.setHours(rampUpHour, 0, 0, 0);
    } else if (peak.dayOfWeek === today && rampUpHour <= todayHour) {
      // Ramp-up already passed today — try next valid day tomorrow
      const nextDay = (today + 1) % 7;
      const nextPattern = patterns.find((p) => p.dayOfWeek === nextDay);
      const nextRamp = nextPattern?.rampUpHour ?? 18;
      const next = getNextDayAtHour(now, nextDay, nextRamp);
      scheduled.setTime(next.getTime());
    } else {
      // Today isn't a peak day — use the next peak day
      scheduled.setTime(getNextDayAtHour(now, peak.dayOfWeek, rampUpHour).getTime());
    }
  }

  // Clamp to safety window
  clampToSafetyWindow(scheduled);

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return {
    scheduledAt: scheduled,
    reasoning: `Scheduled for ${dayNames[peak.dayOfWeek]} at ${rampUpHour}:00 — this bar typically gets busy around ${peak.hour}:00 on ${dayNames[peak.dayOfWeek]}s.`,
    basedOn: {
      dayOfWeek: peak.dayOfWeek,
      hour: peak.hour,
      avgLevel: peak.avgLevel,
    },
  };
}

function computeFallback(promoStart?: Date): OptimalTime {
  const now = new Date();
  const scheduled = new Date(now);

  if (promoStart && promoStart > now) {
    // If promo hasn't started, schedule for when it starts
    scheduled.setTime(promoStart.getTime());
  } else {
    // Send in ~2 hours from now
    scheduled.setHours(scheduled.getHours() + 2);
  }

  clampToSafetyWindow(scheduled);

  return {
    scheduledAt: scheduled,
    reasoning:
      "Not enough crowd data yet to predict the best time. Sending soon so users don't miss out. More data will improve timing over time.",
    basedOn: null,
  };
}

function getNextDayAtHour(
  from: Date,
  targetDay: number,
  hour: number,
): Date {
  const result = new Date(from);
  const currentDay = from.getDay();

  let daysUntil = targetDay - currentDay;
  if (daysUntil <= 0) daysUntil += 7; // Next week

  result.setDate(result.getDate() + daysUntil);
  result.setHours(hour, 0, 0, 0);
  return result;
}

function clampToSafetyWindow(date: Date): void {
  const hour = date.getHours();
  if (hour < EARLIEST_HOUR) date.setHours(EARLIEST_HOUR, 0, 0, 0);
  if (hour > LATEST_HOUR) date.setHours(LATEST_HOUR, 0, 0, 0);
}
