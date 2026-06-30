/**
 * Firebase Cloud Messaging (FCM) initialization.
 *
 * Requires one of these environment variables:
 *   GOOGLE_APPLICATION_CREDENTIALS — path to service account JSON file
 *   FIREBASE_SERVICE_ACCOUNT_JSON — inline JSON string (for Vercel/Railway)
 *
 * If neither is set, the service will log a warning and all send calls
 * will no-op gracefully. This lets the app run without Firebase configured
 * during development or before the Firebase project is set up.
 */

let adminApp: import("firebase-admin").App | null = null;
let messaging: import("firebase-admin/messaging").Messaging | null = null;
let initialized = false;
let initError: string | null = null;

export function getMessaging(): import("firebase-admin/messaging").Messaging | null {
  if (!initialized) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const admin = require("firebase-admin");
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { getMessaging: getAdminMessaging } = require("firebase-admin/messaging");

      // Check for inline JSON first (works on Vercel/Railway)
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (serviceAccountJson) {
        const credential = JSON.parse(serviceAccountJson);
        try {
          // Reuse existing default app (e.g. after hot reload)
          adminApp = admin.getApp();
        } catch {
          adminApp = admin.initializeApp({
            credential: admin.cert(credential),
            projectId: process.env.FIREBASE_PROJECT_ID || credential.project_id,
          });
        }
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        try {
          adminApp = admin.getApp();
        } catch {
          adminApp = admin.initializeApp({
            credential: admin.applicationDefault(),
            projectId: process.env.FIREBASE_PROJECT_ID,
          });
        }
      } else {
        initError =
          "Firebase not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS.";
        console.warn(`[Push] ${initError}`);
        initialized = true;
        return null;
      }

      messaging = getAdminMessaging(adminApp);
      console.log("[Push] Firebase initialized successfully");
    } catch (err) {
      initError = err instanceof Error ? err.message : "Unknown Firebase init error";
      console.error(`[Push] Firebase init failed: ${initError}`);
    }
    initialized = true;
  }
  return messaging ?? null;
}

export function isConfigured(): boolean {
  getMessaging();
  return messaging !== null;
}

export function getInitError(): string | null {
  return initError;
}
