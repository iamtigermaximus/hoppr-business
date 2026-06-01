import { prisma } from "@/lib/database";
import { InsightType } from "@prisma/client";

export interface InsightPayload {
  type: InsightType;
  title: string;
  body: string;
  actionLabel?: string;
  actionRoute?: string;
}

// Rule 1: Gap Detection — upcoming weekend has no events
export async function checkGapDetection(
  barId: string
): Promise<InsightPayload | null> {
  const now = new Date();
  const threeDaysOut = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  const upcomingEvents = await prisma.event.count({
    where: {
      venueId: barId,
      startTime: { gte: now, lte: threeDaysOut },
      complianceStatus: "COMPLIANT",
    },
  });

  if (upcomingEvents > 0) return null;

  const dayOfWeek = now.getDay();
  // Wednesday (3) or later — warn about upcoming weekend
  if (dayOfWeek < 3) return null;

  const targetDay =
    dayOfWeek <= 4 ? "Friday" : dayOfWeek === 5 ? "Saturday" : "this weekend";

  const pastEvents = await prisma.event.count({
    where: {
      venueId: barId,
      startTime: {
        gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        lt: now,
      },
      complianceStatus: "COMPLIANT",
    },
  });

  const avgViews = await getBarAverageViews(barId, "EVENT_VIEW");

  return {
    type: "GAP_DETECTION",
    title: `${targetDay} is open`,
    body:
      pastEvents > 0
        ? `Your ${targetDay.toLowerCase()} posts usually get ${avgViews > 0 ? Math.round(avgViews) + " views" : "good engagement"}. Want to set something up?`
        : `${targetDay} is a big night out. Want to set up your first ${targetDay.toLowerCase()} event?`,
    actionLabel: `Set up ${targetDay}`,
    actionRoute: `/bar/${barId}/create?day=${targetDay.toLowerCase()}`,
  };
}

// Rule 2: Post Milestone — a post exceeded the bar's average
export async function checkMilestone(
  barId: string,
  postId: string,
  postType: string
): Promise<InsightPayload | null> {
  const eventType =
    postType === "event"
      ? "EVENT_VIEW"
      : postType === "promotion"
        ? "PROMO_VIEW"
        : "PASS_VIEW";

  const postViews = await prisma.analyticsEvent.count({
    where: {
      barId,
      type: eventType as any,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });

  const barAvg = await getBarAverageViews(barId, eventType);

  if (barAvg > 0 && postViews > barAvg * 1.5) {
    const post = await getPostTitle(postId, postType);
    return {
      type: "MILESTONE",
      title: "Post milestone!",
      body: `${post || "Your post"} got ${postViews} views — that's ${Math.round((postViews / barAvg - 1) * 100)}% above your average.`,
    };
  }

  return null;
}

// Rule 3: Inactivity — no posts in 7+ days
export async function checkInactivity(
  barId: string
): Promise<InsightPayload | null> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [lastEvent, lastPromo, lastPass] = await Promise.all([
    prisma.event.findFirst({
      where: { venueId: barId, createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.barPromotion.findFirst({
      where: { barId, createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vIPPassEnhanced.findFirst({
      where: { barId, createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (lastEvent || lastPromo || lastPass) return null;

  // Count exact days since last activity
  const oldest = await prisma.$transaction([
    prisma.event.findFirst({
      where: { venueId: barId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.barPromotion.findFirst({
      where: { barId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.vIPPassEnhanced.findFirst({
      where: { barId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  const dates = oldest
    .filter(Boolean)
    .map((d) => d!.createdAt.getTime());
  const newest = Math.max(...dates, 0);

  if (newest === 0) return null;

  const daysSince = Math.floor(
    (Date.now() - newest) / (24 * 60 * 60 * 1000)
  );

  return {
    type: "INACTIVITY",
    title: "You've been quiet",
    body: `You haven't posted in ${daysSince} days. Bars that post weekly get 4x more followers.`,
    actionLabel: "Create a post",
    actionRoute: `/bar/${barId}/create`,
  };
}

// Rule 4: Pattern Detection — compare photo vs no-photo engagement
export async function checkPatterns(
  barId: string
): Promise<InsightPayload | null> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const eventsWithPhotos = await prisma.event.count({
    where: {
      venueId: barId,
      startTime: { gte: thirtyDaysAgo },
      imageUrl: { not: null },
      complianceStatus: "COMPLIANT",
    },
  });

  const eventsWithoutPhotos = await prisma.event.count({
    where: {
      venueId: barId,
      startTime: { gte: thirtyDaysAgo },
      imageUrl: null,
      complianceStatus: "COMPLIANT",
    },
  });

  if (eventsWithPhotos === 0 && eventsWithoutPhotos === 0) return null;

  if (eventsWithoutPhotos >= 3 && eventsWithPhotos <= 1) {
    return {
      type: "PATTERN",
      title: "Photos boost engagement",
      body:
        "Posts with photos get 2-3x more views. Your last 3 posts didn't have one — try adding a photo next time.",
    };
  }

  return null;
}

// Helper: get bar's daily average views for an event type
async function getBarAverageViews(
  barId: string,
  eventType: string
): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const result = await prisma.analyticsEvent.groupBy({
    by: ["barId"],
    where: {
      barId,
      type: eventType as any,
      createdAt: { gte: thirtyDaysAgo },
    },
    _count: { id: true },
  });

  return result.length > 0 ? result[0]._count.id / 30 : 0;
}

// Helper: get post title by type
async function getPostTitle(
  postId: string,
  type: string
): Promise<string | null> {
  if (type === "event") {
    const e = await prisma.event.findUnique({ where: { id: postId } });
    return e?.title || null;
  }
  if (type === "promotion") {
    const p = await prisma.barPromotion.findUnique({
      where: { id: postId },
    });
    return p?.title || null;
  }
  return null;
}
