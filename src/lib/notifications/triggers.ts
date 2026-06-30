/**
 * Notification trigger rules — the "when" behind every push notification.
 *
 * Each function is a standalone trigger that can be called from:
 * - API routes (after creating content)
 * - Scheduled tasks (daily morning digests)
 * - Cron jobs (event reminders)
 * - The retargeting engine (#5)
 * - The AI marketing scheduler (#6)
 *
 * All triggers call notificationService.send() which handles
 * rate limiting, device lookup, FCM delivery, and logging.
 */

import { prisma } from "@/lib/database";
import { notificationService } from "./service";
import { computeOptimalSendTime } from "@/lib/scheduler/timing-engine";
import { processQueue } from "@/lib/scheduler/queue-processor";
import { runRetargetingForBar } from "@/lib/retargeting/engine";
import type { NotificationType } from "@prisma/client";

// ---- Trigger: New promotion ----

export async function onPromoCreated(barId: string, promoId: string) {
  console.log("[Push] onPromoCreated trigger fired:", { barId, promoId });
  const [bar, promo] = await Promise.all([
    prisma.bar.findUnique({
      where: { id: barId },
      select: {
        name: true,
        coverImage: true,
        autoSchedulingEnabled: true,
      },
    }),
    prisma.barPromotion.findUnique({
      where: { id: promoId },
      select: {
        title: true,
        description: true,
        endDate: true,
        startDate: true,
        imageUrl: true,
        validDays: true,
        validHours: true,
      },
    }),
  ]);

  if (!bar || !promo) return;

  const expiresIn = promo.endDate
    ? formatTimeLeft(promo.endDate)
    : "Limited time";

  const payload = {
    type: "PROMO_NEW" as NotificationType,
    title: `${promo.title} at ${bar.name}`,
    body: promo.description?.slice(0, 120) || `${expiresIn}. Check it out!`,
    imageUrl: promo.imageUrl || bar.coverImage || undefined,
    deepLink: `/promotions/${promoId}`,
    contentId: promoId,
    contentBarId: barId,
  };

  let result: unknown;

  // If auto-scheduling is enabled, queue for optimal time instead of sending now
  if (bar.autoSchedulingEnabled) {
    const optimal = await computeOptimalSendTime(
      barId,
      promo.startDate,
      promo.endDate,
      promo.validDays,
      promo.validHours as { start?: string; end?: string } | null,
    );

    const scheduled = await prisma.scheduledNotification.create({
      data: {
        barId,
        promoId,
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
        deepLink: payload.deepLink,
        type: payload.type,
        scheduledAt: optimal.scheduledAt,
      },
    });

    console.log(
      `[Push] Auto-scheduled promo notification: ${scheduled.id} → ${optimal.scheduledAt.toISOString()} (${optimal.reasoning})`,
    );
    result = { scheduled: true, notificationId: scheduled.id, ...optimal };
  } else {
    // Default: send immediately
    result = await notificationService.sendToBarFollowers(
      barId,
      {
        ...payload,
        rateLimit: {
          key: `promo:${promoId}`,
          maxPerUser: 1,
          windowHours: 72,
        },
      },
      { maxDistanceKm: 3 },
    );
  }

  // Background: run retargeting for this bar + drain any due scheduler queue items
  void runRetargetingForBar(barId).catch((err) =>
    console.error("[Push] Background retargeting failed:", err),
  );
  void processQueue().catch((err) =>
    console.error("[Push] Background queue drain failed:", err),
  );

  return result;
}

// ---- Trigger: New event ----

export async function onEventCreated(barId: string, eventId: string) {
  console.log("[Push] onEventCreated trigger fired:", { barId, eventId });
  const [bar, event] = await Promise.all([
    prisma.bar.findUnique({
      where: { id: barId },
      select: {
        name: true,
        coverImage: true,
        autoSchedulingEnabled: true,
      },
    }),
    prisma.event.findUnique({
      where: { id: eventId },
      select: {
        title: true,
        description: true,
        startTime: true,
        imageUrl: true,
      },
    }),
  ]);

  if (!bar || !event) return;

  const eventDate = event.startTime.toLocaleDateString("fi-FI", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const payload = {
    type: "EVENT_REMINDER" as NotificationType,
    title: `${event.title} at ${bar.name}`,
    body: `${eventDate}${event.description ? ` — ${event.description.slice(0, 80)}` : ""}`,
    imageUrl: event.imageUrl || bar.coverImage || undefined,
    deepLink: `/events/${eventId}`,
    contentId: eventId,
    contentBarId: barId,
  };

  let result: unknown;

  // If auto-scheduling is enabled, queue for optimal time
  if (bar.autoSchedulingEnabled) {
    const optimal = await computeOptimalSendTime(
      barId,
      event.startTime,
      event.startTime,
      undefined,
      null,
    );

    const scheduled = await prisma.scheduledNotification.create({
      data: {
        barId,
        eventId,
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
        deepLink: payload.deepLink,
        type: payload.type,
        scheduledAt: optimal.scheduledAt,
      },
    });

    console.log(
      `[Push] Auto-scheduled event notification: ${scheduled.id} → ${optimal.scheduledAt.toISOString()} (${optimal.reasoning})`,
    );
    result = { scheduled: true, notificationId: scheduled.id, ...optimal };
  } else {
    // Default: send immediately
    result = await notificationService.sendToBarFollowers(
      barId,
      {
        ...payload,
        rateLimit: {
          key: `event:${eventId}`,
          maxPerUser: 1,
          windowHours: 72,
        },
      },
      { maxDistanceKm: 5 },
    );
  }

  // Background: run retargeting + drain scheduler queue
  void runRetargetingForBar(barId).catch((err) =>
    console.error("[Push] Background retargeting failed:", err),
  );
  void processQueue().catch((err) =>
    console.error("[Push] Background queue drain failed:", err),
  );

  return result;
}

// ---- Trigger: Event starting soon ----

export async function onEventStartingSoon(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      venueId: true,
      venueName: true,
      startTime: true,
      imageUrl: true,
      participants: {
        select: { userId: true },
      },
    },
  });

  if (!event || event.participants.length === 0) return;

  const minutesUntil = Math.round(
    (event.startTime.getTime() - Date.now()) / 60000,
  );
  const timePhrase =
    minutesUntil <= 0
      ? "starting now"
      : `starting in ${minutesUntil} min`;

  const payload = {
    type: "EVENT_REMINDER" as NotificationType,
    title: `🔔 ${event.title} — ${timePhrase}`,
    body: `At ${event.venueName}. You're going!`,
    imageUrl: event.imageUrl || undefined,
    deepLink: `/events/${event.id}`,
    contentId: event.id,
    contentBarId: event.venueId,
    rateLimit: {
      key: `event-reminder:${event.id}`,
      maxPerUser: 1,
      windowHours: 4,
    },
  };

  const userIds = event.participants.map((p) => p.userId);
  return notificationService.sendToUsers(userIds, payload);
}

// ---- Trigger: Crowd level changed ----

export async function onCrowdLevelChanged(
  barId: string,
  level: string,
) {
  // Only notify for BUSY or PACKED — these are social proof notifications
  if (level !== "BUSY" && level !== "PACKED") return null;

  const bar = await prisma.bar.findUnique({
    where: { id: barId },
    select: { name: true, coverImage: true },
  });
  if (!bar) return null;

  const label = level === "PACKED" ? "packed" : "getting busy";

  const payload = {
    type: "BAR_NEW_CONTENT" as NotificationType,
    title: `🔥 ${bar.name} is ${label} right now`,
    body: `${level === "PACKED" ? "It's the place to be tonight." : "Head over before it fills up."}`,
    imageUrl: bar.coverImage || undefined,
    deepLink: `/bars/${barId}`,
    contentId: undefined,
    contentBarId: barId,
    rateLimit: {
      key: `crowd:${barId}`,
      maxPerUser: 1,
      windowHours: 4,
    },
  };

  return notificationService.sendToBarFollowers(barId, payload, {
    maxDistanceKm: 2,
  });
}

// ---- Helpers ----

function formatTimeLeft(endDate: Date): string {
  const hours = Math.round(
    (endDate.getTime() - Date.now()) / (1000 * 60 * 60),
  );
  if (hours <= 1) return "Ends soon";
  if (hours <= 24) return `Ends in ${hours}h`;
  const days = Math.round(hours / 24);
  return `Ends in ${days} day${days > 1 ? "s" : ""}`;
}
