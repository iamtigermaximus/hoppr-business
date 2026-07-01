// src/app/api/auth/bar/[barId]/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";

// GET - Fetch bar profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
) {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isBarStaffToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { barId } = await params;
    if (payload.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const bar = await prisma.bar.findUnique({
      where: { id: barId },
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        cityName: true,
        district: true,
        type: true,
        phone: true,
        email: true,
        website: true,
        instagram: true,
        priceRange: true,
        capacity: true,
        amenities: true,
        coverCharge: true,
        musicTags: true,
        coverImage: true,
        imageUrls: true,
        logoUrl: true,
        vipEnabled: true,
        operatingHours: true,
      },
    });

    if (!bar) {
      return NextResponse.json({ error: "Bar not found" }, { status: 404 });
    }

    return NextResponse.json(bar);
  } catch (error) {
    console.error("Fetch bar profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT - Update bar profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
) {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isBarStaffToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { barId } = await params;
    if (payload.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only OWNER and MANAGER can edit profile
    const allowedRoles = ["OWNER", "MANAGER"];
    if (!allowedRoles.includes(payload.staffRole)) {
      return NextResponse.json(
        {
          error:
            "Insufficient permissions. Only Owners and Managers can edit bar profile.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();

    const updatedBar = await prisma.bar.update({
      where: { id: barId },
      data: {
        name: body.name,
        description: body.description,
        address: body.address,
        cityName: body.city,
        district: body.district,
        type: body.type,
        phone: body.phone,
        email: body.email,
        website: body.website,
        instagram: body.instagram,
        priceRange: body.priceRange,
        capacity: body.capacity,
        amenities: body.amenities || [],
        coverCharge: body.coverCharge != null ? parseInt(body.coverCharge) : null,
        musicTags: body.musicTags || [],
        coverImage: body.coverImage,
        imageUrls: body.imageUrls || [],
        logoUrl: body.logoUrl,
        vipEnabled: body.vipEnabled,
        operatingHours: body.operatingHours,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Bar profile updated successfully",
      bar: updatedBar,
    });
  } catch (error) {
    console.error("Update bar profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
