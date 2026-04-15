import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifyAdminToken(token: string) {
  try {
    const adminUser = await prisma.adminUser.findFirst({
      where: { isActive: true },
    });
    return adminUser;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await verifyAdminToken(token);
    if (!adminUser) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const missingType = searchParams.get("type"); // images, hours, description, unverified, inactive

    let whereCondition = {};

    switch (missingType) {
      case "images":
        whereCondition = { coverImage: null };
        break;
      case "hours":
        whereCondition = { operatingHours: {} };
        break;
      case "description":
        whereCondition = { description: null };
        break;
      case "coordinates":
        whereCondition = {
          OR: [{ latitude: null }, { longitude: null }],
        };
        break;
      case "unverified":
        whereCondition = { isVerified: false };
        break;
      case "inactive":
        whereCondition = { isActive: false };
        break;
      default:
        return NextResponse.json(
          {
            error:
              "Invalid missing type. Use: images, hours, description, coordinates, unverified, inactive",
          },
          { status: 400 },
        );
    }

    const bars = await prisma.bar.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        type: true,
        city: true,
        district: true,
        address: true,
        coverImage: true,
        description: true,
        operatingHours: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: bars,
      count: bars.length,
      missingType: missingType,
    });
  } catch (error) {
    console.error("Missing bars error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
