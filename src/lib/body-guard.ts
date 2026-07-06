// src/lib/body-guard.ts
// ============================================================================
// REQUEST BODY SIZE LIMITER
// ============================================================================
//
// API routes that accept POST/PUT/PATCH should validate Content-Length before
// reading the body. This prevents memory-exhaustion attacks and enforces
// per-route payload limits.
//
// Usage:
//   const sizeCheck = checkBodySize(request, "500kb");
//   if (sizeCheck) return sizeCheck; // 413 Payload Too Large
//   const body = await request.json();
// ============================================================================

import { NextRequest, NextResponse } from "next/server";

const SIZE_UNITS: Record<string, number> = {
  b: 1,
  kb: 1024,
  mb: 1024 * 1024,
};

/** Parse a human-readable size string into bytes. Supports "b", "kb", "mb". */
function parseSize(size: string): number {
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb)$/);
  if (!match) {
    throw new Error(`Invalid size format: "${size}". Use e.g. "500kb" or "2mb".`);
  }
  return parseFloat(match[1]) * (SIZE_UNITS[match[2]] ?? 1);
}

/**
 * Check that the Content-Length header does not exceed `maxSize`.
 * Returns a 413 response if it does, or `null` if the body is OK to read.
 *
 * Set `maxSize` per-route based on what the endpoint expects:
 *   - Auth/login:  "10kb"
 *   - Bar create:  "50kb"   (has operatingHours, amenities, etc.)
 *   - CSV import:  "10mb"   (file upload via JSON)
 *   - Default:     "1mb"
 */
export function checkBodySize(
  request: NextRequest,
  maxSize: string | number = "1mb",
): NextResponse | null {
  const limit = typeof maxSize === "number" ? maxSize : parseSize(maxSize);

  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (isNaN(size) || size > limit) {
      return NextResponse.json(
        {
          error: `Request body too large. Maximum is ${typeof maxSize === "number" ? `${maxSize} bytes` : maxSize}.`,
        },
        { status: 413 },
      );
    }
  }

  // Content-Length is missing — caller should still proceed, but we've done
  // what we can. Transfer-Encoding: chunked won't have a Content-Length.
  return null;
}
