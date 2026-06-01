// POST /api/auth/admin/bars/[id]/invite — Create bar owner invitation
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { authService } from "@/services/auth-service";
import { sendInviteEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: barId } = await params;
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const authResult = await authService.validateToken(token);

    if (authResult.type !== "admin" || authResult.user.adminRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email, name, role } = await request.json();
    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400 },
      );
    }

    // Check if bar exists
    const bar = await prisma.bar.findUnique({
      where: { id: barId },
      select: { name: true },
    });
    if (!bar) {
      return NextResponse.json({ error: "Bar not found" }, { status: 404 });
    }

    // Check if already invited (active invitation)
    const existingInvite = await prisma.barInvitation.findFirst({
      where: {
        barId,
        email: email.toLowerCase(),
        expiresAt: { gte: new Date() },
        acceptedAt: null,
      },
    });
    if (existingInvite) {
      return NextResponse.json(
        { error: "An active invitation already exists for this email" },
        { status: 409 },
      );
    }

    // Create invitation
    const inviteToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.barInvitation.create({
      data: {
        barId,
        email: email.toLowerCase(),
        name,
        role: role || "OWNER",
        token: inviteToken,
        expiresAt,
      },
    });

    // Send invite email
    try {
      await sendInviteEmail({
        to: email.toLowerCase(),
        name,
        barName: bar.name,
        token: inviteToken,
      });
    } catch (emailError) {
      console.warn("Invite created but email failed:", emailError);
      // Still return success — admin can share link manually
    }

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/bar/invite?token=${inviteToken}`;

    return NextResponse.json({
      success: true,
      inviteLink,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        name: invitation.name,
        role: invitation.role,
        expiresAt: invitation.expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Create invitation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET — List invitations for a bar
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: barId } = await params;
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const authResult = await authService.validateToken(token);

    if (authResult.type !== "admin" || authResult.user.adminRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const invitations = await prisma.barInvitation.findMany({
      where: { barId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error("Fetch invitations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
