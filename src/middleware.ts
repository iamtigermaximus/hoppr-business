// src/middleware.ts — Centralized auth guard for server-rendered pages
//
// Verifies the hoppr_token JWT cookie on protected routes. Invalid, expired,
// or missing tokens redirect to /login. API routes verify tokens independently
// via verifyAuthHeader/verifyAuthCookie.
// Runs on every matching request.
//
// Uses Node.js runtime (not Edge) because jsonwebtoken depends on the 'crypto'
// module which isn't available in Edge Runtime.

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

const PROTECTED_PREFIXES = ["/admin", "/bar"];

// Routes that set auth cookies via server-side redirect or token exchange.
// These must skip the middleware check — they handle their own auth flow.
const EXEMPT_ROUTES = [
  "/bar/invite",
  "/api/auth/bar/social/callback",
  "/api/auth/bar/invite/verify",
  "/api/auth/bar/invite/accept",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip exempt routes (invite acceptance, social callbacks)
  if (EXEMPT_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // Skip API routes — those verify tokens in the handler
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Skip the login page itself
  if (pathname === "/login" || pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  // Check if this is a protected route
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
  if (!isProtected) {
    return NextResponse.next();
  }

  // Check for the auth cookie
  const token = request.cookies.get("hoppr_token")?.value;
  if (!token) {
    console.log(`[Middleware] No token cookie for ${pathname} — redirecting to /login`);
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify the JWT with the Node.js crypto module (requires runtime: "nodejs")
  const payload = verifyToken(token);
  if (!payload) {
    const loginUrl = new URL("/login", request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("hoppr_token");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, sitemap.xml
     * - public files (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.png$|.*\\.svg$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.ico$).*)",
  ],
};
