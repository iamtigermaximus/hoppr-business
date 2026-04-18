// src/app/api/auth/bar/[barId]/promotions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verify } from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string; id: string }> },
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { barId, id } = await params;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verify(token, JWT_SECRET) as {
      barId: string;
      staffRole: string;
    };

    if (decoded.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allowedRoles = ["OWNER", "MANAGER", "PROMOTIONS_MANAGER"];
    if (!allowedRoles.includes(decoded.staffRole)) {
      return NextResponse.json(
        { error: "Insufficient permissions to approve promotions" },
        { status: 403 },
      );
    }

    const { isApproved } = await request.json();

    const promotion = await prisma.barPromotion.update({
      where: { id },
      data: {
        isApproved,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Promotion approved successfully",
      promotion,
    });
  } catch (error) {
    console.error("Approval error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string; id: string }> },
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { barId, id } = await params;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verify(token, JWT_SECRET) as {
      barId: string;
      staffRole: string;
    };

    if (decoded.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allowedRoles = ["OWNER", "MANAGER", "PROMOTIONS_MANAGER"];
    if (!allowedRoles.includes(decoded.staffRole)) {
      return NextResponse.json(
        { error: "Insufficient permissions to delete promotions" },
        { status: 403 },
      );
    }

    await prisma.barPromotion.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Promotion deleted successfully",
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
