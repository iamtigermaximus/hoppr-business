// src/app/api/auth/bar/route.ts

import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth-service";
import { checkRateLimit, RateLimits, getRateLimitKey } from "@/lib/rate-limiter";

export async function POST(request: NextRequest) {
  // Rate limit: 5 login attempts per minute per IP
  const rateKey = getRateLimitKey(request, "bar-login");
  const rateCheck = await checkRateLimit(rateKey, RateLimits.AUTH);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: `Too many login attempts. Try again in ${rateCheck.retryAfter} seconds.` },
      { status: 429 },
    );
  }

  try {
    const { email, password, barId } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const result = await authService.authenticateBarStaff(
      email,
      password,
      barId
    );

    return NextResponse.json({
      success: true,
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error("Bar staff login error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Login failed",
      },
      { status: 401 }
    );
  }
}
