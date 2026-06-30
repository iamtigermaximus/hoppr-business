// src/lib/api-error.ts
// ============================================================================
// CENTRALIZED API ERROR HANDLER
// ============================================================================
//
// Every API route should use these utilities instead of writing their own
// try/catch error handling. This ensures:
//
// 1. Internal error details are NEVER leaked to clients
// 2. Error response shapes are consistent across all endpoints
// 3. Structured logging in one place (easy to add Sentry/DataDog later)
// 4. Proper HTTP status codes for known error conditions
// ============================================================================

import { NextResponse } from "next/server";

// ---- AppError: typed errors with HTTP status codes ----

export class AppError extends Error {
  /** HTTP status code */
  public readonly status: number;
  /** Machine-readable error code (for frontend switching) */
  public readonly code: string;
  /** Whether this error's message is safe to expose to clients */
  public readonly publicMessage: string | null;
  /** Original cause (logged, never exposed) */
  public readonly cause?: unknown;

  constructor(opts: {
    message: string; // internal log message
    status?: number;
    code?: string;
    publicMessage?: string;
    cause?: unknown;
  }) {
    super(opts.message);
    this.name = "AppError";
    this.status = opts.status ?? 500;
    this.code = opts.code ?? "INTERNAL_ERROR";
    this.publicMessage = opts.publicMessage ?? null;
    this.cause = opts.cause;
  }

  /** Convenience: 400 Bad Request */
  static badRequest(message: string, code = "BAD_REQUEST"): AppError {
    return new AppError({ message, status: 400, code, publicMessage: message });
  }

  /** Convenience: 401 Unauthorized */
  static unauthorized(message = "Unauthorized"): AppError {
    return new AppError({ message, status: 401, code: "UNAUTHORIZED", publicMessage: message });
  }

  /** Convenience: 403 Forbidden */
  static forbidden(message = "Forbidden"): AppError {
    return new AppError({ message, status: 403, code: "FORBIDDEN", publicMessage: message });
  }

  /** Convenience: 404 Not Found */
  static notFound(message = "Not found"): AppError {
    return new AppError({ message, status: 404, code: "NOT_FOUND", publicMessage: message });
  }

  /** Convenience: 409 Conflict */
  static conflict(message: string): AppError {
    return new AppError({ message, status: 409, code: "CONFLICT", publicMessage: message });
  }

  /** Convenience: 429 Rate Limited */
  static rateLimited(retryAfter: number): AppError {
    return new AppError({
      message: `Rate limit exceeded, retry after ${retryAfter}s`,
      status: 429,
      code: "RATE_LIMITED",
      publicMessage: `Rate limit reached. Retry in ${retryAfter}s.`,
    });
  }

  /** Convenience: 500 — wraps an unknown error, never exposes internals */
  static internal(cause?: unknown, logPrefix = "API error"): AppError {
    const msg = cause instanceof Error ? cause.message : String(cause ?? "Unknown error");
    return new AppError({
      message: `${logPrefix}: ${msg}`,
      status: 500,
      code: "INTERNAL_ERROR",
      publicMessage: "Internal server error",
      cause,
    });
  }
}

// ---- Catch-block handler ----

/**
 * Standardized error handler for API route catch blocks.
 *
 * Usage:
 *   try { ... } catch (error) {
 *     return handleApiError(error, "Dashboard stats");
 *   }
 *
 * - AppError → returns the status and public message it was created with
 * - Unknown error → logs it, returns 500 "Internal server error"
 */
export function handleApiError(error: unknown, context?: string): NextResponse {
  if (error instanceof AppError) {
    // Known error — log as warning, return public-safe response
    console.warn(`[${error.code}] ${context ?? "API"}: ${error.message}`);
    return apiError(error.publicMessage ?? "Internal server error", error.status);
  }

  // Unknown error — never expose to client
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`${context ?? "API"}: ${msg}`, error instanceof Error ? error.stack : undefined);

  return apiError("Internal server error", 500);
}

// ---- Response helpers ----

/** Consistent error response shape */
export function apiError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** Consistent success response shape with optional cache headers */
export function apiSuccess<T>(
  data: T,
  opts?: {
    cacheMaxAge?: number;
    cacheSharedMaxAge?: number;
    cacheStaleWhileRevalidate?: number;
  },
): NextResponse {
  const headers: Record<string, string> = {};
  if (opts?.cacheMaxAge) {
    const smax = opts.cacheSharedMaxAge ?? opts.cacheMaxAge;
    const swr = opts.cacheStaleWhileRevalidate ?? smax * 2;
    headers["Cache-Control"] = `public, max-age=${opts.cacheMaxAge}, s-maxage=${smax}, stale-while-revalidate=${swr}`;
  }
  return NextResponse.json(
    { success: true, ...(data as Record<string, unknown>) },
    Object.keys(headers).length > 0 ? { headers } : undefined,
  );
}
