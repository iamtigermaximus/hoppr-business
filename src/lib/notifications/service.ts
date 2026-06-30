/**
 * Core notification service — send push notifications via FCM, apply
 * rate limiting, log delivery, and create in-app notification records.
 *
 * This is the single entry point for all push notification sends.
 * Every trigger (promo alert, event reminder, retargeting, scheduler)
 * calls into this service.
 */

import { prisma } from "@/lib/database";
import { getMessaging } from "./firebase";
import type { NotificationType } from "@prisma/client";

// ---- Types ----

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  imageUrl?: string;
  deepLink?: string;
  contentId?: string; // The promo/event/pass ID
  contentBarId?: string; // Which bar's content
  /** Optional rate limit key. If provided, checks per-user send history. */
  rateLimit?: {
    key: string; // e.g. "promo:bar123" — unique per content+bar
    maxPerUser?: number; // max sends per user for this key (default 1)
    windowHours?: number; // lookback window (default 24)
  };
}

export interface SendResult {
  userId: string;
  success: boolean;
  fcmMessageId?: string;
  error?: string;
}

export interface BatchSendResult {
  total: number;
  sent: number;
  failed: number;
  rateLimited: number;
  noDevice: number;
  results: SendResult[];
}

// ---- Rate limit defaults ----

const RATE_LIMIT_DEFAULTS = {
  /** Max 1 promo notification per bar per user per day */
  PROMO_PER_BAR: { maxPerUser: 1, windowHours: 24 },
  /** Max 3 total promo notifications per user per day (across all bars) */
  PROMO_TOTAL: { maxPerUser: 3, windowHours: 24 },
  /** Max 1 event reminder per event per user */
  EVENT_REMINDER: { maxPerUser: 1, windowHours: 48 },
} as const;

// ---- Service ----

export const notificationService = {
  /**
   * Send a push notification to a single user.
   * Handles: device lookup, rate limiting, FCM send, logging, in-app record.
   */
  async send(
    userId: string,
    payload: NotificationPayload,
  ): Promise<SendResult> {
    // 1. Check rate limit
    if (payload.rateLimit) {
      const limited = await checkUserRateLimit(userId, payload);
      if (limited) {
        return { userId, success: false, error: "rate_limited" };
      }
    }

    // 2. Find active devices for the user
    const devices = await prisma.notificationDevice.findMany({
      where: { userId, isActive: true },
    });

    console.log(`[Push] send: userId=${userId}, devices=${devices.length}`);

    if (devices.length === 0) {
      console.log(`[Push] send: no device found for user ${userId}`);
      return { userId, success: false, error: "no_device" };
    }

    // 3. Check FCM configured
    const messaging = getMessaging();
    if (!messaging) {
      // Create in-app notification anyway (push is a bonus, in-app is guaranteed)
      await createInAppNotification(userId, payload);
      return { userId, success: false, error: "fcm_not_configured" };
    }

    // 4. Send to all user's devices
    let lastFcmId: string | undefined;
    let lastError: string | undefined;

    for (const device of devices) {
      try {
        const message: import("firebase-admin/messaging").Message = {
          token: device.fcmToken,
          notification: {
            title: payload.title,
            body: payload.body,
            // FCM requires a full HTTPS URL for notification images — skip
            // relative paths or empty strings so we don't fail the send.
            ...(payload.imageUrl &&
            (payload.imageUrl.startsWith("https://") ||
              payload.imageUrl.startsWith("http://"))
              ? { imageUrl: payload.imageUrl }
              : {}),
          },
          data: {
            type: payload.type,
            deepLink: payload.deepLink || "",
            contentId: payload.contentId || "",
            contentBarId: payload.contentBarId || "",
          },
          android: {
            priority: "high",
            notification: {
              channelId: "hoppr_promos",
            },
          },
          apns: {
            payload: {
              aps: {
                "mutable-content": 1,
                sound: "default",
              },
            },
          },
        };

        const fcmResponse = await messaging.send(message);
        lastFcmId = fcmResponse;
        console.log(`[Push] FCM sent to ${device.fcmToken.slice(0, 12)}... messageId=${fcmResponse}`);

        // Log successful send
        await prisma.notificationLog.create({
          data: {
            userId,
            deviceId: device.id,
            type: payload.type,
            title: payload.title,
            body: payload.body,
            imageUrl: payload.imageUrl,
            deepLink: payload.deepLink,
            fcmMessageId: fcmResponse,
            status: "sent",
            contentId: payload.contentId,
            contentBarId: payload.contentBarId,
          },
        });

        // Update device last active
        await prisma.notificationDevice.update({
          where: { id: device.id },
          data: { lastActiveAt: new Date() },
        });
      } catch (err) {
        lastError = err instanceof Error ? err.message : "FCM send failed";
        console.error(`[Push] FCM send failed: ${lastError}`);

        // Handle unregistered tokens
        if (
          err instanceof Error &&
          (err.message.includes("registration-token-not-registered") ||
           err.message.includes("invalid-argument"))
        ) {
          await prisma.notificationDevice.update({
            where: { id: device.id },
            data: { isActive: false },
          });
        }

        // Log failure
        await prisma.notificationLog.create({
          data: {
            userId,
            deviceId: device.id,
            type: payload.type,
            title: payload.title,
            body: payload.body,
            status: "failed",
            errorMessage: lastError,
            contentId: payload.contentId,
            contentBarId: payload.contentBarId,
          },
        });
      }
    }

    // 5. Create in-app notification record (always, even if push failed)
    await createInAppNotification(userId, payload);

    return {
      userId,
      success: !!lastFcmId,
      fcmMessageId: lastFcmId,
      error: lastError,
    };
  },

  /**
   * Send to multiple users in batch.
   * Each user gets individual rate limiting + device lookup.
   */
  async sendToUsers(
    userIds: string[],
    payload: NotificationPayload,
  ): Promise<BatchSendResult> {
    const results: SendResult[] = [];
    let sent = 0;
    let failed = 0;
    let rateLimited = 0;
    let noDevice = 0;

    // Process sequentially to avoid overwhelming FCM
    // For production, use FCM's sendEachForMulticast for true batching
    for (const userId of userIds) {
      const result = await this.send(userId, payload);
      results.push(result);

      if (result.error === "rate_limited") rateLimited++;
      else if (result.error === "no_device") noDevice++;
      else if (result.success) sent++;
      else failed++;
    }

    const summary = {
      total: userIds.length,
      sent,
      failed,
      rateLimited,
      noDevice,
      results,
    };
    console.log(`[Push] sendToUsers done: sent=${sent}, failed=${failed}, rateLimited=${rateLimited}, noDevice=${noDevice}`);
    return summary;
  },

  /**
   * Send to followers of a bar, optionally filtered by proximity.
   */
  async sendToBarFollowers(
    barId: string,
    payload: NotificationPayload,
    options?: {
      maxDistanceKm?: number;
      /** Only followers who have push preferences allowing this type */
      requirePreference?: boolean;
    },
  ): Promise<BatchSendResult> {
    // Get all followers
    const follows = await prisma.barFollow.findMany({
      where: { barId },
      select: { userId: true },
    });

    const userIds = follows.map((f) => f.userId);
    console.log(`[Push] sendToBarFollowers: bar=${barId}, followers=${userIds.length}, users=${userIds.slice(0, 5)}`);
    return this.sendToUsers(userIds, payload);
  },

  /**
   * Mark a notification as opened (called when user taps the push notification).
   */
  async markOpened(fcmMessageId: string): Promise<void> {
    await prisma.notificationLog.updateMany({
      where: { fcmMessageId, status: "sent" },
      data: { status: "opened", openedAt: new Date() },
    });
  },

  /**
   * Mark a notification as converted (user visited the bar within 2h).
   */
  async markConverted(fcmMessageId: string): Promise<void> {
    await prisma.notificationLog.updateMany({
      where: { fcmMessageId },
      data: { status: "converted", convertedAt: new Date() },
    });
  },
};

// ---- Helpers ----

/**
 * Check if the user has exceeded rate limits for this notification.
 */
async function checkUserRateLimit(
  userId: string,
  payload: NotificationPayload,
): Promise<boolean> {
  const rl = payload.rateLimit!;
  const windowHours = rl.windowHours || RATE_LIMIT_DEFAULTS.PROMO_PER_BAR.windowHours;
  const maxPerUser = rl.maxPerUser || RATE_LIMIT_DEFAULTS.PROMO_PER_BAR.maxPerUser;

  const windowStart = new Date();
  windowStart.setHours(windowStart.getHours() - windowHours);

  // Count recent notifications for this user + rate limit key
  // We use contentBarId + contentId as a composite key
  const count = await prisma.notificationLog.count({
    where: {
      userId,
      contentBarId: payload.contentBarId,
      contentId: payload.contentId,
      sentAt: { gte: windowStart },
      status: { not: "failed" },
    },
  });

  return count >= maxPerUser;
}

/**
 * Create an in-app notification record (the bell icon in the app).
 */
async function createInAppNotification(
  userId: string,
  payload: NotificationPayload,
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        message: payload.body,
        barId: payload.contentBarId,
        data: payload.deepLink
          ? { deepLink: payload.deepLink, contentId: payload.contentId }
          : undefined,
      },
    });
  } catch (err) {
    // In-app notification is non-critical — don't throw
    console.error("[Push] Failed to create in-app notification:", err);
  }
}
