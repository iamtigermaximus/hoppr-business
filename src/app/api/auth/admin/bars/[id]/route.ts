// Route: GET /api/auth/admin/bars/[id]
// Description: Get, update, or delete a specific bar by ID
// Methods: GET, PATCH, DELETE

// Route: GET /api/auth/admin/bars/[id]
// Description: Get, update, or delete a specific bar by ID
// Methods: GET, PUT, PATCH, DELETE

import { NextRequest, NextResponse } from "next/server";
import {
  BarType,
  BarStatus,
  PriceRange,
} from "@prisma/client";
import { verifyAuthHeader, isAdminToken } from "@/lib/auth";
import { prisma } from "@/lib/database";
import { handleApiError } from "@/lib/api-error";

// GET - Fetch single bar
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isAdminToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    const bar = await prisma.bar.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        cityName: true,
        district: true,
        type: true,
        latitude: true,
        longitude: true,
        phone: true,
        email: true,
        website: true,
        instagram: true,
        operatingHours: true,
        priceRange: true,
        capacity: true,
        amenities: true,
        coverCharge: true,
        musicTags: true,
        coverImage: true,
        imageUrls: true,
        logoUrl: true,
        status: true,
        isVerified: true,
        isActive: true,
        vipEnabled: true,
        vipPrice: true,
        profileViews: true,
        directionClicks: true,
        websiteClicks: true,
        callClicks: true,
        shareCount: true,
        qualityScore: true,
        performanceTier: true,
        createdAt: true,
        updatedAt: true,
        claimedAt: true,
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            lastLogin: true,
          },
        },
        promotions: {
          select: {
            id: true,
            title: true,
            type: true,
            discount: true,
            startDate: true,
            endDate: true,
            redemptions: true,
          },
        },
        vipPassesEnhanced: {
          select: {
            id: true,
            name: true,
            priceCents: true,
            soldCount: true,
            totalQuantity: true,
          },
        },
        claims: {
          select: {
            id: true,
            status: true,
            notes: true,
            documentUrls: true,
            createdAt: true,
            reviewedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
              },
            },
            reviewedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        outreachLogs: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            method: true,
            status: true,
            notes: true,
            followUpAt: true,
            createdAt: true,
            user: { select: { name: true } },
          },
        },
      },
    });

    if (!bar) {
      return NextResponse.json({ error: "Bar not found" }, { status: 404 });
    }

    // Transform response to match expected format
    const transformedBar = {
      id: bar.id,
      name: bar.name,
      description: bar.description,
      address: bar.address,
      city: bar.cityName,
      district: bar.district,
      type: bar.type,
      latitude: bar.latitude,
      longitude: bar.longitude,
      phone: bar.phone,
      email: bar.email,
      website: bar.website,
      instagram: bar.instagram,
      operatingHours: bar.operatingHours,
      priceRange: bar.priceRange,
      capacity: bar.capacity,
      amenities: bar.amenities,
      coverCharge: bar.coverCharge,
      musicTags: bar.musicTags,
      coverImage: bar.coverImage,
      imageUrls: bar.imageUrls,
      logoUrl: bar.logoUrl,
      status: bar.status,
      isVerified: bar.isVerified,
      isActive: bar.isActive,
      vipEnabled: bar.vipEnabled,
      vipPrice: bar.vipPrice,
      profileViews: bar.profileViews,
      directionClicks: bar.directionClicks,
      websiteClicks: bar.websiteClicks,
      callClicks: bar.callClicks,
      shareCount: bar.shareCount,
      qualityScore: bar.qualityScore,
      performanceTier: bar.performanceTier,
      createdAt: bar.createdAt,
      updatedAt: bar.updatedAt,
      claimedAt: bar.claimedAt,
      staff: bar.staff,
      promotions: bar.promotions,
      vipPasses: bar.vipPassesEnhanced,
      claims: bar.claims,
      latestOutreach: bar.outreachLogs[0] ?? null,
    };

    return NextResponse.json({
      success: true,
      bar: transformedBar,
    });
  } catch (error) {
    return handleApiError(error, "Fetch bar error:");
  }
}

// PUT - Full update of bar (used by edit form)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isAdminToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    const body = await request.json();

    // Validate and convert enum values
    let typeEnum: BarType | undefined;
    if (body.type && Object.values(BarType).includes(body.type as BarType)) {
      typeEnum = body.type as BarType;
    }

    let statusEnum: BarStatus | undefined;
    if (
      body.status &&
      Object.values(BarStatus).includes(body.status as BarStatus)
    ) {
      statusEnum = body.status as BarStatus;
    }

    let priceRangeEnum: PriceRange | undefined;
    if (
      body.priceRange &&
      Object.values(PriceRange).includes(body.priceRange as PriceRange)
    ) {
      priceRangeEnum = body.priceRange as PriceRange;
    }

    const updatedBar = await prisma.bar.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        address: body.address,
        cityName: body.city,
        district: body.district,
        type: typeEnum,
        latitude: body.latitude ? parseFloat(body.latitude) : null,
        longitude: body.longitude ? parseFloat(body.longitude) : null,
        phone: body.phone,
        email: body.email,
        website: body.website,
        instagram: body.instagram,
        operatingHours: body.operatingHours,
        priceRange: priceRangeEnum,
        capacity: body.capacity ? parseInt(body.capacity) : null,
        amenities: body.amenities,
        coverImage: body.coverImage,
        imageUrls: body.imageUrls || [],
        logoUrl: body.logoUrl,
        coverCharge: body.coverCharge != null ? parseInt(body.coverCharge) : null,
        musicTags: body.musicTags || [],
        status: statusEnum,
        isVerified: body.isVerified,
        isActive: body.isActive,
        vipEnabled: body.vipEnabled,
        vipPrice: body.vipPrice ? parseFloat(body.vipPrice) : null,
      },
    });

    // Create audit log - FIXED: Convert updateData to a compatible format
    await prisma.auditLog.create({
      data: {
        userId: payload.userId,
        barId: updatedBar.id,
        action: "UPDATE",
        resource: "BAR",
        details: {
          barName: updatedBar.name,
          changes: {
            name: body.name,
            address: body.address,
            city: body.city,
          },
        },
        createdAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Bar updated successfully",
      bar: updatedBar,
    });
  } catch (error) {
    return handleApiError(error, "Update bar error:");
  }
}

// PATCH - Partial update of bar (for quick actions like status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isAdminToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    const body = await request.json();

    const updateData: Record<string, unknown> = {};

    if (body.status !== undefined) {
      if (Object.values(BarStatus).includes(body.status as BarStatus)) {
        updateData.status = body.status as BarStatus;
      }
    }
    if (body.isVerified !== undefined) updateData.isVerified = body.isVerified;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const updatedBar = await prisma.bar.update({
      where: { id },
      data: updateData,
    });

    // Create audit log - FIXED: Convert to safe JSON format
    const safeDetails = {
      changes: JSON.parse(JSON.stringify(updateData)),
    };

    await prisma.auditLog.create({
      data: {
        userId: payload.userId,
        barId: updatedBar.id,
        action: "PATCH",
        resource: "BAR",
        details: safeDetails,
        createdAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Bar updated successfully",
      bar: updatedBar,
    });
  } catch (error) {
    return handleApiError(error, "Patch bar error:");
  }
}

// DELETE - Delete bar
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isAdminToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    // Get bar name for audit log before deleting
    const bar = await prisma.bar.findUnique({
      where: { id },
      select: { name: true },
    });

    // First delete related records
    await prisma.barStaff.deleteMany({ where: { barId: id } });
    await prisma.barPromotion.deleteMany({ where: { barId: id } });
    await prisma.vIPPassEnhanced.deleteMany({ where: { barId: id } });

    // Then delete the bar
    await prisma.bar.delete({ where: { id } });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: payload.userId,
        barId: id,
        action: "DELETE",
        resource: "BAR",
        details: { barName: bar?.name },
        createdAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Bar deleted successfully",
    });
  } catch (error) {
    return handleApiError(error, "Delete bar error:");
  }
}
