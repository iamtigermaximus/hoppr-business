// src/app/api/auth/bar/route.st

import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth-service";

export async function POST(request: NextRequest) {
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
