// src/app/api/auth/admin/bars/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, BarType, PriceRange } from "@prisma/client";

const prisma = new PrismaClient();

interface BarUpdateData {
  name: string;
  description: string;
  address: string;
  city: string;
  district: string;
  type: string;
  latitude: string;
  longitude: string;
  phone: string;
  email: string;
  website: string;
  instagram: string;
  priceRange: string;
  capacity: string;
  amenities: string[];
  isActive: boolean;
  vipEnabled: boolean;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("🔍 Fetching bar with ID...");

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: barId } = await params;

    if (!barId) {
      return NextResponse.json(
        { error: "Bar ID is required" },
        { status: 400 }
      );
    }

    const bar = await prisma.bar.findUnique({
      where: { id: barId },
    });

    if (!bar) {
      return NextResponse.json({ error: "Bar not found" }, { status: 404 });
    }

    return NextResponse.json({ bar });
  } catch (error) {
    console.error("Error fetching bar:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: barId } = await params;
    const body: BarUpdateData = await request.json();

    // Convert string enums to proper Prisma enum types
    const typeEnum = body.type as BarType;
    const priceRangeEnum = body.priceRange
      ? (body.priceRange as PriceRange)
      : null;

    // Update ALL bar fields - this is PUT for complete replacement
    const updatedBar = await prisma.bar.update({
      where: { id: barId },
      data: {
        name: body.name,
        description: body.description,
        address: body.address,
        city: body.city,
        district: body.district,
        type: typeEnum,
        latitude: body.latitude ? parseFloat(body.latitude) : null,
        longitude: body.longitude ? parseFloat(body.longitude) : null,
        phone: body.phone,
        email: body.email,
        website: body.website,
        instagram: body.instagram,
        priceRange: priceRangeEnum,
        capacity: body.capacity ? parseInt(body.capacity) : null,
        amenities: body.amenities,
        isActive: body.isActive,
        vipEnabled: body.vipEnabled,
      },
    });

    return NextResponse.json({ bar: updatedBar });
  } catch (error) {
    console.error("Error updating bar:", error);

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "A bar with this name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: barId } = await params;

    await prisma.bar.delete({
      where: { id: barId },
    });

    return NextResponse.json({ message: "Bar deleted successfully" });
  } catch (error) {
    console.error("Error deleting bar:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
