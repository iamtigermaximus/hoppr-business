// Route: GET /api/auth/bar/[barId]/calendar
// Description: Get all bar content (events, promotions, passes) organized by date for calendar view
// Query params: month (YYYY-MM), type (all|events|promotions|passes)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";

interface CalendarEvent {
  id: string;
  type: "event";
  title: string;
  date: string;
  time: string;
  status: string;
}

interface CalendarPromotion {
  id: string;
  type: "promotion";
  title: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface CalendarPass {
  id: string;
  type: "pass";
  title: string;
  validUntil: string;
  price: number;
  status: string;
}

type CalendarEntry = CalendarEvent | CalendarPromotion | CalendarPass;

interface CalendarDay {
  date: string;
  entries: CalendarEntry[];
}

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

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // "YYYY-MM"
    const contentType = searchParams.get("type") || "all";

    // Parse month range, default to current month
    let monthStart: Date;
    let monthEnd: Date;
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split("-").map(Number);
      monthStart = new Date(y, m - 1, 1);
      monthEnd = new Date(y, m, 1); // first day of next month
    } else {
      const now = new Date();
      monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    // Fetch all three content types in parallel
    const [events, promotions, passes] = await Promise.all([
      contentType === "all" || contentType === "events"
        ? prisma.event.findMany({
            where: {
              venueId: barId,
              startTime: { gte: monthStart, lt: monthEnd },
            },
            select: {
              id: true,
              title: true,
              startTime: true,
              complianceStatus: true,
            },
            orderBy: { startTime: "asc" },
          })
        : [],

      contentType === "all" || contentType === "promotions"
        ? prisma.barPromotion.findMany({
            where: {
              barId,
              AND: [
                { startDate: { lt: monthEnd } },
                { endDate: { gte: monthStart } },
              ],
            },
            select: {
              id: true,
              title: true,
              startDate: true,
              endDate: true,
              complianceStatus: true,
            },
            orderBy: { startDate: "asc" },
          })
        : [],

      contentType === "all" || contentType === "passes"
        ? prisma.vIPPassEnhanced.findMany({
            where: {
              barId,
              validityEnd: { gte: monthStart },
            },
            select: {
              id: true,
              name: true,
              validityEnd: true,
              priceCents: true,
              isActive: true,
            },
            orderBy: { validityEnd: "asc" },
          })
        : [],
    ]);

    // Build entries array
    const entries: CalendarEntry[] = [
      ...events.map(
        (e): CalendarEvent => ({
          id: e.id,
          type: "event",
          title: e.title,
          date: e.startTime.toISOString().split("T")[0],
          time: e.startTime.toISOString(),
          status: e.complianceStatus || "COMPLIANT",
        }),
      ),
      ...promotions.map(
        (p): CalendarPromotion => ({
          id: p.id,
          type: "promotion",
          title: p.title,
          startDate: p.startDate.toISOString().split("T")[0],
          endDate: p.endDate.toISOString().split("T")[0],
          status: p.complianceStatus || "COMPLIANT",
        }),
      ),
      ...passes.map(
        (p): CalendarPass => ({
          id: p.id,
          type: "pass",
          title: p.name,
          validUntil: p.validityEnd.toISOString().split("T")[0],
          price: Math.round(p.priceCents / 100),
          status: p.isActive ? "ACTIVE" : "INACTIVE",
        }),
      ),
    ];

    // Group by date
    const dayMap = new Map<string, CalendarEntry[]>();
    for (const entry of entries) {
      let dateKey: string;
      if (entry.type === "event") dateKey = entry.date;
      else if (entry.type === "promotion") dateKey = entry.startDate;
      else dateKey = entry.validUntil;

      if (!dayMap.has(dateKey)) dayMap.set(dateKey, []);
      dayMap.get(dateKey)!.push(entry);
    }

    // Sort into array
    const days: CalendarDay[] = Array.from(dayMap.entries())
      .map(([date, dayEntries]) => ({ date, entries: dayEntries }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Summary counts
    const summary = {
      totalEvents: events.length,
      totalPromotions: promotions.length,
      totalPasses: passes.length,
      totalDays: days.length,
    };

    return NextResponse.json({ days, summary, month: month || undefined });
  } catch (error) {
    console.error("Calendar error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
