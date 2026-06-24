// src/middleware.ts — Centralized auth guard for server-rendered pages
//
// Checks for hoppr_token cookie on protected routes and redirects
// unauthenticated users to /login. Does NOT verify the JWT itself
// (that happens in the page/API handler via verifyAuthCookie/verifyAuthHeader).
// Runs on every matching request.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/admin", "/bar"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
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
