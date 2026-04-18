//app/api/bar/invite/verify/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const invitation = await prisma.barInvitation.findUnique({
      where: { token },
      include: { bar: { select: { name: true } } },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 404 },
      );
    }

    if (invitation.acceptedAt) {
      return NextResponse.json(
        { error: "Invitation already accepted" },
        { status: 400 },
      );
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      valid: true,
      barName: invitation.bar.name,
      email: invitation.email,
      name: invitation.name,
    });
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
