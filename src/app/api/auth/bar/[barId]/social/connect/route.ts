// POST /api/auth/bar/[barId]/social/connect
// Returns the Facebook OAuth URL for the bar owner to visit and grant permissions.

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isBarStaffToken } from "@/lib/auth";
import { buildOAuthUrl } from "@/lib/social/meta-api";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
) {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: No token provided" },
        { status: 401 },
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid token" },
        { status: 401 },
      );
    }

    if (!isBarStaffToken(payload)) {
      return NextResponse.json(
        { error: "Forbidden: Bar staff access required" },
        { status: 403 },
      );
    }

    const { barId } = await params;
    if (payload.barId !== barId) {
      return NextResponse.json(
        { error: "Forbidden: You don't have access to this bar" },
        { status: 403 },
      );
    }

    // 2. Parse platform from request body
    const body = await request.json();
    const platform = body.platform as string;
    if (!platform || !["instagram", "facebook"].includes(platform)) {
      return NextResponse.json(
        { error: "platform must be 'instagram' or 'facebook'" },
        { status: 400 },
      );
    }

    // 3. Build the callback URL (where Facebook redirects after auth)
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL;
    if (!origin) {
      return NextResponse.json(
        { error: "Could not determine redirect URI" },
        { status: 500 },
      );
    }
    const redirectUri = `${origin}/api/auth/bar/social/callback`;

    // 4. Build the OAuth URL
    const oauthUrl = buildOAuthUrl(barId, redirectUri);

    return NextResponse.json({
      success: true,
      oauthUrl,
    });
  } catch (error) {
    console.error("Social connect error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to initiate connection",
      },
      { status: 500 },
    );
  }
}
