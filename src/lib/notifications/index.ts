/**
 * Push Notifications — public API
 *
 * Usage:
 *   import { notificationService, triggers, isPushConfigured } from "@/lib/notifications";
 *
 *   // Check if Firebase is ready
 *   if (!isPushConfigured()) console.warn("Push not configured");
 *
 *   // Send a notification
 *   await notificationService.send(userId, { type, title, body, ... });
 *
 *   // Fire a trigger
 *   await triggers.onPromoCreated(barId, promoId);
 */

export { notificationService } from "./service";
export type { NotificationPayload, SendResult, BatchSendResult } from "./service";

export * as triggers from "./triggers";

export { getMessaging, isConfigured as isPushConfigured, getInitError } from "./firebase";
