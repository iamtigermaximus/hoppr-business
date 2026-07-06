// Route: GET /api/auth/admin/bars
// Description: Get all bars with filtering, pagination, and search
// Query params: page, limit, search, status, type, city

import { NextRequest, NextResponse } from "next/server";
import { BarType, BarStatus } from "@prisma/client";
import { verifyAuthHeader, isAdminToken } from "@/lib/auth";
import { prisma } from "@/lib/database";
import { handleApiError } from "@/lib/api-error";

interface BarFilters {
  status?: BarStatus;
  type?: BarType;
  city?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isAdminToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const statusFilter = searchParams.get("status") as BarStatus | null;
    const typeFilter = searchParams.get("type") as BarType | null;
    const cityFilter = searchParams.get("city") || "";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (statusFilter) {
      where.status = statusFilter;
    }

    if (typeFilter) {
      where.type = typeFilter;
    }

    if (cityFilter) {
      where.cityName = cityFilter; // FIXED: Use cityName instead of city
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { cityName: { contains: search, mode: "insensitive" } }, // FIXED: Use cityName instead of city
        { district: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.bar.count({ where });

    // Get bars
    const bars = await prisma.bar.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        cityName: true, // FIXED: Use cityName instead of city
        district: true,
        type: true,
        phone: true,
        email: true,
        website: true,
        instagram: true,
        coverImage: true,
        status: true,
        isVerified: true,
        isActive: true,
        vipEnabled: true,
        profileViews: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            staff: true,
            promotions: true,
          },
        },
      },
    });

    // Format bars for response
    const formattedBars = bars.map((bar) => ({
      id: bar.id,
      name: bar.name,
      description: bar.description,
      address: bar.address,
      city: bar.cityName, // FIXED: Use cityName for response
      district: bar.district,
      type: bar.type,
      phone: bar.phone,
      email: bar.email,
      website: bar.website,
      instagram: bar.instagram,
      coverImage: bar.coverImage,
      status: bar.status,
      isVerified: bar.isVerified,
      isActive: bar.isActive,
      vipEnabled: bar.vipEnabled,
      profileViews: bar.profileViews,
      createdAt: bar.createdAt,
      updatedAt: bar.updatedAt,
      staffCount: bar._count.staff,
      promotionCount: bar._count.promotions,
    }));

    return NextResponse.json({
      success: true,
      data: formattedBars,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error, "Fetch bars error:");
  }
}

// POST - Create a new bar (for admin use)
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isAdminToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.address || !body.cityName || !body.type) {
      return NextResponse.json(
        { error: "Missing required fields: name, address, cityName, type" },
        { status: 400 },
      );
    }

    // Check if bar already exists
    const existingBar = await prisma.bar.findUnique({
      where: { name: body.name },
      select: { id: true },
    });

    if (existingBar) {
      return NextResponse.json(
        { error: `Bar with name "${body.name}" already exists` },
        { status: 409 },
      );
    }

    // Create the bar
    const bar = await prisma.bar.create({
      data: {
        name: body.name,
        description: body.description || null,
        address: body.address,
        cityName: body.cityName, // FIXED: Use cityName instead of city
        district: body.district || null,
        type: body.type as BarType,
        latitude: body.latitude ? parseFloat(body.latitude) : null,
        longitude: body.longitude ? parseFloat(body.longitude) : null,
        phone: body.phone || null,
        email: body.email || null,
        website: body.website || null,
        instagram: body.instagram || null,
        operatingHours: body.operatingHours || {},
        priceRange: body.priceRange || null,
        capacity: body.capacity ? parseInt(body.capacity) : null,
        amenities: body.amenities || [],
        coverImage: body.coverImage || null,
        imageUrls: body.imageUrls || [],
        logoUrl: body.logoUrl || null,
        status: body.status || "UNCLAIMED",
        isVerified: body.isVerified || false,
        isActive: body.isActive !== undefined ? body.isActive : true,
        vipEnabled: body.vipEnabled || false,
        vipPrice: body.vipPrice ? parseFloat(body.vipPrice) : null,
        createdById: payload.userId,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: payload.userId,
        barId: bar.id,
        action: "CREATE",
        resource: "BAR",
        details: { barName: bar.name },
        createdAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Bar created successfully",
      bar: {
        id: bar.id,
        name: bar.name,
        address: bar.address,
        city: bar.cityName,
        type: bar.type,
        status: bar.status,
      },
    });
  } catch (error) {
    return handleApiError(error, "Create bar error:");
  }
}
