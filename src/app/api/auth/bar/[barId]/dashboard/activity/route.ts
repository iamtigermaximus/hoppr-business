import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";
import { AnalyticsEventType } from "@prisma/client";

// Maps AnalyticsEventType to human-readable activity descriptions
const ACTIVITY_TEMPLATES: Record<
  string,
  { icon: string; singular: string; plural: string }
> = {
  BAR_VIEW: {
    icon: "👁️",
    singular: "Someone viewed your bar",
    plural: "{n} people viewed your bar",
  },
  PAGE_VIEW: {
    icon: "👁️",
    singular: "Someone viewed your profile",
    plural: "{n} people viewed your profile",
  },
  BAR_DIRECTION: {
    icon: "🧭",
    singular: "Someone got directions to your bar",
    plural: "{n} people got directions",
  },
  BAR_CALL: {
    icon: "📞",
    singular: "Someone called your bar",
    plural: "{n} people called your bar",
  },
  BAR_WEBSITE: {
    icon: "🌐",
    singular: "Someone visited your website",
    plural: "{n} people visited your website",
  },
  BAR_SHARE: {
    icon: "📤",
    singular: "Someone shared your bar",
    plural: "{n} people shared your bar",
  },
  PROMO_VIEW: {
    icon: "🎫",
    singular: "Someone viewed your promotion",
    plural: "{n} people viewed your promotion",
  },
  PROMO_CLICK: {
    icon: "👆",
    singular: "Someone clicked your promotion",
    plural: "{n} people clicked your promotion",
  },
  PROMO_REDEMPTION: {
    icon: "✅",
    singular: "Someone claimed your promotion",
    plural: "{n} people claimed your promotion",
  },
  EVENT_VIEW: {
    icon: "📅",
    singular: "Someone viewed your event",
    plural: "{n} people viewed your event",
  },
  EVENT_JOIN: {
    icon: "🎉",
    singular: "Someone joined your event",
    plural: "{n} people joined your event",
  },
  FOLLOW: {
    icon: "❤️",
    singular: "Someone followed your bar",
    plural: "{n} people followed your bar",
  },
  SEARCH: {
    icon: "🔍",
    singular: "Your bar appeared in search",
    plural: "Your bar appeared in {n} searches",
  },
};

// Event types to exclude from the activity feed
const EXCLUDED_TYPES: AnalyticsEventType[] = [
  "PASS_VIEW",
  "PASS_PURCHASE",
  "PASS_SCAN",
  "FEED_SCROLL",
  "UNFOLLOW",
];

interface ActivityItem {
  id: string;
  icon: string;
  text: string;
  count: number;
  time: string; // ISO string for client-side timeAgo formatting
  href?: string;
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

    // Fetch last 50 raw events (we'll deduplicate down to ~25)
    const rawEvents = await prisma.analyticsEvent.findMany({
      where: {
        barId,
        type: { notIn: EXCLUDED_TYPES },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        type: true,
        data: true,
        createdAt: true,
        userId: true,
      },
    });

    if (rawEvents.length === 0) {
      return NextResponse.json({ activities: [], hasActivity: false });
    }

    // Deduplicate: group consecutive same-type events within 10-minute windows
    const activities: ActivityItem[] = [];
    const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

    let i = 0;
    while (i < rawEvents.length) {
      const current = rawEvents[i];
      const template = ACTIVITY_TEMPLATES[current.type];
      if (!template) {
        i++;
        continue;
      }

      // Count how many same-type events fall within the window
      let count = 1;
      let lastInWindow = current;
      let j = i + 1;
      while (j < rawEvents.length) {
        const next = rawEvents[j];
        if (next.type !== current.type) break;
        const timeDiff =
          new Date(current.createdAt).getTime() -
          new Date(next.createdAt).getTime();
        if (timeDiff > WINDOW_MS) break;
        count++;
        lastInWindow = next;
        j++;
      }

      // Build the text with promo/event names when available
      const metadata = (current.data as Record<string, unknown>) || {};
      const promoName = typeof metadata.promoName === "string" ? metadata.promoName : null;
      const eventTitle = typeof metadata.eventTitle === "string" ? metadata.eventTitle : null;

      let text: string;
      if (count === 1) {
        text = template.singular;
      } else {
        text = template.plural.replace("{n}", String(count));
      }

      // Append entity name if available
      if (promoName) text += `: "${promoName}"`;
      if (eventTitle) text += `: "${eventTitle}"`;

      // Build href from metadata
      let href: string | undefined;
      if (metadata.promoId && typeof metadata.promoId === "string") {
        href = `/bar/${barId}/promotions/${metadata.promoId}`;
      } else if (metadata.eventId && typeof metadata.eventId === "string") {
        href = `/bar/${barId}/events/${metadata.eventId}`;
      }

      activities.push({
        id: current.id,
        icon: template.icon,
        text,
        count,
        time: lastInWindow.createdAt.toISOString(),
        href,
      });

      i = j; // skip past the grouped events
    }

    // Limit to 25 items for the dashboard
    const limited = activities.slice(0, 25);

    return NextResponse.json({
      activities: limited,
      hasActivity: limited.length > 0,
    });
  } catch (error) {
    console.error("Dashboard activity error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
