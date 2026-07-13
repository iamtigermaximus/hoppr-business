/**
 * Queue processor — processes the ScheduledNotification queue.
 * Finds PENDING notifications whose scheduledAt has arrived and sends them.
 *
 * Called by the scheduler cron every 15 minutes.
 */

import { prisma } from "@/lib/database";
import { notificationService } from "@/lib/notifications/service";
import type { NotificationType } from "@prisma/client";

export interface QueueProcessResult {
  processed: number;
  sent: number;
  failed: number;
  cancelled: number;
}

/**
 * Process all due ScheduledNotifications.
 */
export async function processQueue(): Promise<QueueProcessResult> {
  const now = new Date();

  // Cancel notifications for promos that have ended
  const expired = await prisma.scheduledNotification.updateMany({
    where: {
      status: "PENDING",
      scheduledAt: { lte: now },
      promoId: { not: null },
    },
    data: { status: "CANCELLED" },
  });

  if (expired.count > 0) {
    console.log(`[Scheduler] Cancelled ${expired.count} expired notifications`);
  }

  // Find all PENDING notifications that are due
  const due = await prisma.scheduledNotification.findMany({
    where: {
      status: "PENDING",
      scheduledAt: { lte: now },
    },
    orderBy: { scheduledAt: "asc" },
    take: 50, // Process in batches to avoid overwhelming FCM
  });

  if (due.length === 0) {
    return { processed: 0, sent: 0, failed: 0, cancelled: expired.count };
  }

  let sent = 0;
  let failed = 0;

  for (const item of due) {
    try {
      // Activate scheduled content — flip isActive:true when publish time arrives
      if (item.promoId) {
        const promo = await prisma.barPromotion.findUnique({
          where: { id: item.promoId },
          select: { isActive: true, endDate: true, scheduledPublishAt: true },
        });

        if (!promo || promo.endDate < now) {
          await prisma.scheduledNotification.update({
            where: { id: item.id },
            data: { status: "CANCELLED" },
          });
          continue;
        }

        // Activate the promo if it was scheduled
        if (!promo.isActive && promo.scheduledPublishAt && promo.scheduledPublishAt <= now) {
          await prisma.barPromotion.update({
            where: { id: item.promoId },
            data: { isActive: true },
          });
          console.log(`[Scheduler] Activated scheduled promotion: ${item.promoId}`);
        }
      }

      if (item.eventId) {
        // Activate the event if it was scheduled
        const event = await prisma.event.findUnique({
          where: { id: item.eventId },
          select: { isActive: true, scheduledPublishAt: true },
        });

        if (event && !event.isActive && event.scheduledPublishAt && event.scheduledPublishAt <= now) {
          await prisma.event.update({
            where: { id: item.eventId },
            data: { isActive: true },
          });
          console.log(`[Scheduler] Activated scheduled event: ${item.eventId}`);
        }
      }

      // Send to bar followers
      const payload = {
        type: item.type as NotificationType,
        title: item.title,
        body: item.body,
        imageUrl: item.imageUrl ?? undefined,
        deepLink: item.deepLink ?? undefined,
        contentId: item.promoId ?? item.eventId ?? undefined,
        contentBarId: item.barId,
        rateLimit: {
          key: `scheduled:${item.barId}:${item.promoId || item.eventId || item.id}`,
          maxPerUser: 1,
          windowHours: 72,
        },
      };

      await notificationService.sendToBarFollowers(item.barId, payload);

      await prisma.scheduledNotification.update({
        where: { id: item.id },
        data: { status: "SENT", sentAt: new Date() },
      });

      sent++;
    } catch (err) {
      console.error(
        `[Scheduler] Failed to process ${item.id}:`,
        err instanceof Error ? err.message : err,
      );
      failed++;

      // Don't retry automatically — mark as failed for manual review
      await prisma.scheduledNotification.update({
        where: { id: item.id },
        data: { status: "CANCELLED" },
      });
    }
  }

  console.log(
    `[Scheduler] Queue processed: ${due.length} due, ${sent} sent, ${failed} failed`,
  );

  return {
    processed: due.length,
    sent,
    failed,
    cancelled: expired.count,
  };
}
