// src/app/api/auth/bar/[barId]/dashboard/seed-content/route.ts
// Creates sample promotions, events, and passes for new bars so they
// can see what the platform looks like when active. Called automatically
// from the dashboard on first visit when the bar has no content.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";

const SAMPLE_PREFIX = "sample_";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
) {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isBarStaffToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { barId } = await params;
    if (payload.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if already seeded
    const existing = await prisma.barPromotion.findFirst({
      where: { barId, conditions: { has: SAMPLE_PREFIX } },
    });
    if (existing) {
      return NextResponse.json({
        success: false,
        message: "Sample content already exists for this bar",
      });
    }

    // Fetch bar name for sample event venue
    const bar = await prisma.bar.findUnique({
      where: { id: barId },
      select: { name: true },
    });
    const barName = bar?.name || "Your Bar";

    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const created: string[] = [];

    // ── 2 sample promotions ──────────────────────────────────────
    const promos = await Promise.all([
      prisma.barPromotion.create({
        data: {
          barId,
          title: "Happy Hour — 50% off drinks",
          description:
            "Join us every weekday from 5–7 PM for half-price cocktails, beer, and wine. Bring your colleagues after work!",
          type: "HAPPY_HOUR",
          discount: 50,
          conditions: [SAMPLE_PREFIX, "Weekdays 17:00–19:00", "Drinks only", "Cannot combine with other offers"],
          startDate: now,
          endDate: nextMonth,
          validDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          isActive: true,
          isApproved: true,
          priority: 2,
          complianceStatus: "COMPLIANT",
          views: Math.floor(Math.random() * 80) + 20,
          clicks: Math.floor(Math.random() * 30) + 5,
        },
      }),
      prisma.barPromotion.create({
        data: {
          barId,
          title: "Student Night — 20% off with valid ID",
          description:
            "Students get 20% off their total bill every Thursday. Show your student ID at the bar to redeem. Groups of 4+ get a free round of shots!",
          type: "DRINK_SPECIAL",
          discount: 20,
          conditions: [SAMPLE_PREFIX, "Thursday only", "Valid student ID required", "Groups 4+: free shots round"],
          startDate: now,
          endDate: nextMonth,
          validDays: ["Thursday"],
          isActive: true,
          isApproved: true,
          priority: 1,
          complianceStatus: "COMPLIANT",
          views: Math.floor(Math.random() * 50) + 10,
          clicks: Math.floor(Math.random() * 15) + 3,
        },
      }),
    ]);
    created.push(...promos.map((p) => `promotion:${p.id}`));

    // ── 1 sample event ───────────────────────────────────────────
    const eventDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    eventDate.setHours(20, 0, 0, 0);
    const eventEnd = new Date(eventDate.getTime() + 4 * 60 * 60 * 1000);

    const event = await prisma.event.create({
      data: {
        title: "Live Jazz & Cocktails",
        description:
          "An evening of live jazz from Helsinki's best trio, paired with our signature cocktail menu. No cover charge — just great music and drinks.",
        venueId: barId,
        venueName: barName,
        startTime: eventDate,
        endTime: eventEnd,
        maxAttendees: 60,
        isPrivate: false,
        creatorId: payload.userId,
        complianceStatus: "COMPLIANT",
        category: SAMPLE_PREFIX,
      },
    });
    created.push(`event:${event.id}`);

    // ── 1 sample VIP pass ────────────────────────────────────────
    const pass = await prisma.vIPPassEnhanced.create({
      data: {
        barId,
        name: "Weekend VIP Access",
        description:
          "Skip the line every Friday and Saturday night. Includes one welcome drink and priority seating at the bar.",
        priceCents: 1500,
        benefits: [
          "Skip-the-line access on weekends",
          "One complimentary welcome drink",
          "Priority bar seating",
          "10% off bottle service",
        ],
        validityStart: now,
        validityEnd: nextMonth,
        validDays: ["Friday", "Saturday"],
        totalQuantity: 100,
        isActive: true,
        isApproved: true,
        type: "SKIP_LINE",
        complianceStatus: "COMPLIANT",
      },
    });
    created.push(`pass:${pass.id}`);

    return NextResponse.json({
      success: true,
      message: `Seeded ${created.length} sample items for the bar`,
      items: created,
    });
  } catch (error) {
    console.error("Seed content error:", error);
    return NextResponse.json(
      { error: "Failed to seed content", details: String(error) },
      { status: 500 },
    );
  }
}
