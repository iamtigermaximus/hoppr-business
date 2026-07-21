import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isBarStaffToken } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";
import {
  getVoiceProfile,
  updateVoiceProfile,
  buildVoiceProfileBlock,
} from "@/lib/voice-profile";

/**
 * GET /api/auth/bar/[barId]/voice-profile
 *
 * Returns the bar's voice profile — preferred tone, template usage,
 * audience preferences — accumulated across all content generation sessions.
 * Creates a default empty profile if the bar hasn't generated content yet.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
) {
  try {
    const authHeader = _request.headers.get("authorization");
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

    const profile = await getVoiceProfile(barId);

    // Include the AI prompt block so the client can pass it verbatim
    const promptBlock = buildVoiceProfileBlock(profile, "en");
    const promptBlockFi = buildVoiceProfileBlock(profile, "fi");

    return NextResponse.json({
      success: true,
      profile,
      promptBlock,
      promptBlockFi,
    });
  } catch (error) {
    return handleApiError(error, "voice-profile GET");
  }
}

/**
 * PATCH /api/auth/bar/[barId]/voice-profile
 *
 * Updates the voice profile after a content generation.
 * Increments tone/template usage counters and merges audience data.
 * Called fire-and-forget by the client after successful generation.
 *
 * Body: { tone?, template?, audience? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
) {
  try {
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

    const body = await request.json();
    const { tone, template, audience } = body as {
      tone?: string;
      template?: string;
      audience?: string[];
    };

    await updateVoiceProfile(barId, {
      tone: tone as
        | "WARM_INVITING"
        | "BOLD_ENERGETIC"
        | "EDGY_IRREVERENT"
        | "ELEGANT_PREMIUM"
        | "PLAYFUL_FUN"
        | null
        | undefined,
      template: template ?? null,
      audience: audience ?? undefined,
    });

    const updated = await getVoiceProfile(barId);

    return NextResponse.json({
      success: true,
      profile: updated,
    });
  } catch (error) {
    return handleApiError(error, "voice-profile PATCH");
  }
}
