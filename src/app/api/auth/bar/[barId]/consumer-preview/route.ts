// src/app/api/auth/bar/[barId]/consumer-preview/route.ts
// Aggregates all public-facing bar data into consumer-app shape for preview

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";

// GET — returns bar profile + active content in consumer-app shape
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

    // Fetch bar profile with all public fields
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
        facebook: true,
        priceRange: true,
        coverCharge: true,
        musicTags: true,
        capacity: true,
        amenities: true,
        coverImage: true,
        imageUrls: true,
        logoUrl: true,
        latitude: true,
        longitude: true,
        operatingHours: true,
      },
    });

    if (!bar) {
      return NextResponse.json({ error: "Bar not found" }, { status: 404 });
    }

    const now = new Date();

    // Fetch active, approved promotions (not expired)
    const promotions = await prisma.barPromotion.findMany({
      where: {
        barId,
        isActive: true,
        isApproved: true,
        endDate: { gte: now },
      },
      orderBy: { endDate: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        startDate: true,
        endDate: true,
        imageUrl: true,
      },
    });

    // Fetch upcoming events (today or later, compliant status only)
    const events = await prisma.event.findMany({
      where: {
        venueId: barId,
        startTime: { gte: now },
        complianceStatus: "COMPLIANT",
      },
      orderBy: { startTime: "asc" },
      include: {
        _count: { select: { participants: true } },
      },
    });

    // Fetch active VIP passes
    const passes = await prisma.vIPPassEnhanced.findMany({
      where: {
        barId,
        isActive: true,
      },
      orderBy: { priceCents: "asc" },
    });

    // Shape data to match consumer app's venue endpoint
    return NextResponse.json({
      success: true,
      venue: {
        id: bar.id,
        name: bar.name,
        description: bar.description,
        address: bar.address,
        cityName: bar.cityName,
        district: bar.district,
        type: bar.type,
        phone: bar.phone,
        email: bar.email,
        website: bar.website,
        instagram: bar.instagram,
        facebook: bar.facebook,
        priceRange: bar.priceRange,
        coverCharge: bar.coverCharge,
        musicTags: bar.musicTags,
        capacity: bar.capacity,
        amenities: bar.amenities,
        imageUrl: bar.coverImage || (bar.imageUrls?.length ? bar.imageUrls[0] : null),
        imageUrls: bar.imageUrls,
        logoUrl: bar.logoUrl,
        lat: bar.latitude,
        lng: bar.longitude,
        hours: bar.operatingHours,
      },
      promotions: promotions.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        type: p.type,
        validFrom: p.startDate.toISOString(),
        validTo: p.endDate.toISOString(),
        imageUrl: p.imageUrl,
      })),
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        startTime: e.startTime.toISOString(),
        endTime: e.endTime?.toISOString() || null,
        coverImage: e.imageUrl,
        participantCount: e._count.participants,
      })),
      passes: passes.map((p) => ({
        id: p.id,
        title: p.name,
        type: p.type,
        price: (p.priceCents / 100).toFixed(2),
        originalPrice: p.originalPriceCents ? (p.originalPriceCents / 100).toFixed(2) : null,
        benefits: p.benefits,
        validUntil: p.validityEnd.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Consumer preview fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
