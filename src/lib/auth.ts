// src/lib/auth.ts
import { hash, compare } from "bcryptjs";
import { sign, verify } from "jsonwebtoken";

/** Returns the JWT secret or throws immediately — no fallback. */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET environment variable is not set. Authentication cannot function without it.",
    );
  }
  return secret;
}

const JWT_SECRET = process.env.JWT_SECRET!;

// Define proper TypeScript interfaces
export interface AdminJWTPayload {
  userId: string;
  role: "admin";
  adminRole:
    | "SUPER_ADMIN"
    | "CONTENT_MODERATOR"
    | "ANALYTICS_VIEWER"
    | "SUPPORT";
  iat?: number;
  exp?: number;
}

export interface BarStaffJWTPayload {
  userId: string;
  role: "bar_staff";
  barId: string;
  staffRole: "OWNER" | "MANAGER" | "PROMOTIONS_MANAGER" | "STAFF" | "VIEWER";
  permissions: string[];
  iat?: number;
  exp?: number;
}

export type JWTPayload = AdminJWTPayload | BarStaffJWTPayload;

export async function hashPassword(password: string): Promise<string> {
  return await hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await compare(password, hashedPassword);
}

export function generateToken(payload: JWTPayload): string {
  return sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Helper functions for specific token types
export function generateAdminToken(admin: {
  id: string;
  role: string;
}): string {
  const payload: AdminJWTPayload = {
    userId: admin.id,
    role: "admin",
    adminRole: admin.role as AdminJWTPayload["adminRole"],
  };
  return generateToken(payload);
}

export function generateBarStaffToken(staff: {
  id: string;
  barId: string;
  role: string;
  permissions: string[];
}): string {
  const payload: BarStaffJWTPayload = {
    userId: staff.id,
    role: "bar_staff",
    barId: staff.barId,
    staffRole: staff.role as BarStaffJWTPayload["staffRole"],
    permissions: staff.permissions,
  };
  return generateToken(payload);
}

// Type guards to check token types
export function isAdminToken(payload: JWTPayload): payload is AdminJWTPayload {
  return payload.role === "admin";
}

export function isBarStaffToken(
  payload: JWTPayload
): payload is BarStaffJWTPayload {
  return payload.role === "bar_staff";
}

// ---- Standardized auth helpers for API routes & server pages ----

/**
 * Verify a JWT from an Authorization: Bearer <token> header.
 * Use this in API routes instead of inline `verify()` + hardcoded secret.
 * Returns the decoded payload or null if missing/invalid.
 */
export function verifyAuthHeader(
  request: Request,
): JWTPayload | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  return verifyToken(token);
}

/**
 * Verify a JWT from the `hoppr_token` cookie.
 * Use this in server-rendered pages.
 * Returns the decoded payload or null if missing/invalid.
 */
export async function verifyAuthCookie(): Promise<JWTPayload | null> {
  try {
    // Dynamic import to avoid bundling next/headers in client code
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("hoppr_token");
    if (!tokenCookie?.value) return null;
    return verifyToken(tokenCookie.value);
  } catch {
    return null;
  }
}
