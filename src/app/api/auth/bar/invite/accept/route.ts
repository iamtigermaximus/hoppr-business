//app/api/bar/invite/accept/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

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

    // Create bar staff account
    const hashedPassword = await hash(password, 12);

    const staff = await prisma.barStaff.create({
      data: {
        barId: invitation.barId,
        email: invitation.email,
        name: name,
        role: invitation.role,
        permissions: invitation.role === "OWNER" ? ["*"] : [],
        hashedPassword,
        isActive: true,
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
      message: "Account created successfully",
    });
  } catch (error) {
    console.error("Accept invitation error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
