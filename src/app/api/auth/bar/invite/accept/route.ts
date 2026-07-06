//app/api/bar/invite/accept/route.ts

import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const { token, name, password } = await request.json();

    if (!token || !name || !password) {
      return NextResponse.json(
        { error: "Token, name, and password are required" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    const invitation = await prisma.barInvitation.findUnique({
      where: { token },
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

    // Create user account, then link to bar as staff
    const hashedPassword = await hash(password, 12);

    const user = await prisma.user.upsert({
      where: { email: invitation.email },
      update: { hashedPassword, name },
      create: {
        email: invitation.email,
        name,
        hashedPassword,
        role: "BAR_STAFF",
      },
    });

    const staff = await prisma.barStaff.create({
      data: {
        barId: invitation.barId,
        userId: user.id,
        email: invitation.email,
        name: name,
        role: invitation.role,
        permissions: invitation.role === "OWNER" ? ["*"] : [],
        isActive: false,
      },
    });

    // Mark invitation as accepted
    await prisma.barInvitation.update({
      where: { token },
      data: { acceptedAt: new Date() },
    });

    console.log(
      `✅ Account created for ${invitation.email} at bar ${invitation.barId}`,
    );

    return NextResponse.json({
      success: true,
      message: "Account created successfully. Your registration is pending admin approval.",
      pendingApproval: true,
    });
  } catch (error) {
    console.error("Accept invitation error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
