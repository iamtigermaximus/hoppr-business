// // src/app/api/auth/admin/bars/[id]/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { PrismaClient, BarType, PriceRange } from "@prisma/client";

// const prisma = new PrismaClient();

// interface BarUpdateData {
//   name: string;
//   description: string;
//   address: string;
//   city: string;
//   district: string;
//   type: string;
//   latitude: string;
//   longitude: string;
//   phone: string;
//   email: string;
//   website: string;
//   instagram: string;
//   priceRange: string;
//   capacity: string;
//   amenities: string[];
//   isActive: boolean;
//   vipEnabled: boolean;
// }

// export async function GET(
//   request: NextRequest,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   try {
//     console.log("🔍 Fetching bar with ID...");

//     const authHeader = request.headers.get("authorization");
//     const token = authHeader?.replace("Bearer ", "");

//     if (!token) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { id: barId } = await params;

//     if (!barId) {
//       return NextResponse.json(
//         { error: "Bar ID is required" },
//         { status: 400 }
//       );
//     }

//     const bar = await prisma.bar.findUnique({
//       where: { id: barId },
//     });

//     if (!bar) {
//       return NextResponse.json({ error: "Bar not found" }, { status: 404 });
//     }

//     return NextResponse.json({ bar });
//   } catch (error) {
//     console.error("Error fetching bar:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// export async function PUT(
//   request: NextRequest,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   try {
//     const authHeader = request.headers.get("authorization");
//     const token = authHeader?.replace("Bearer ", "");

//     if (!token) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { id: barId } = await params;
//     const body: BarUpdateData = await request.json();

//     // Convert string enums to proper Prisma enum types
//     const typeEnum = body.type as BarType;
//     const priceRangeEnum = body.priceRange
//       ? (body.priceRange as PriceRange)
//       : null;

//     // Update ALL bar fields - this is PUT for complete replacement
//     const updatedBar = await prisma.bar.update({
//       where: { id: barId },
//       data: {
//         name: body.name,
//         description: body.description,
//         address: body.address,
//         city: body.city,
//         district: body.district,
//         type: typeEnum,
//         latitude: body.latitude ? parseFloat(body.latitude) : null,
//         longitude: body.longitude ? parseFloat(body.longitude) : null,
//         phone: body.phone,
//         email: body.email,
//         website: body.website,
//         instagram: body.instagram,
//         priceRange: priceRangeEnum,
//         capacity: body.capacity ? parseInt(body.capacity) : null,
//         amenities: body.amenities,
//         isActive: body.isActive,
//         vipEnabled: body.vipEnabled,
//       },
//     });

//     return NextResponse.json({ bar: updatedBar });
//   } catch (error) {
//     console.error("Error updating bar:", error);

//     if (error instanceof Error && error.message.includes("Unique constraint")) {
//       return NextResponse.json(
//         { error: "A bar with this name already exists" },
//         { status: 400 }
//       );
//     }

//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// export async function DELETE(
//   request: NextRequest,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   try {
//     const authHeader = request.headers.get("authorization");
//     const token = authHeader?.replace("Bearer ", "");

//     if (!token) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { id: barId } = await params;

//     await prisma.bar.delete({
//       where: { id: barId },
//     });

//     return NextResponse.json({ message: "Bar deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting bar:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }
// import { NextRequest, NextResponse } from "next/server";
// import { PrismaClient, BarType, PriceRange } from "@prisma/client";

// const prisma = new PrismaClient();

// interface BarUpdateData {
//   name: string;
//   description: string;
//   address: string;
//   city: string;
//   district: string;
//   type: string;
//   latitude: string;
//   longitude: string;
//   phone: string;
//   email: string;
//   website: string;
//   instagram: string;
//   priceRange: string;
//   capacity: string;
//   amenities: string[];
//   isActive: boolean;
//   vipEnabled: boolean;
//   // ADD IMAGE FIELDS
//   coverImage: string | null;
//   logoUrl: string | null;
//   imageUrls: string[];
// }

// export async function GET(
//   request: NextRequest,
//   { params }: { params: Promise<{ id: string }> },
// ) {
//   try {
//     console.log("🔍 Fetching bar with ID...");

//     const authHeader = request.headers.get("authorization");
//     const token = authHeader?.replace("Bearer ", "");

//     if (!token) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { id: barId } = await params;

//     if (!barId) {
//       return NextResponse.json(
//         { error: "Bar ID is required" },
//         { status: 400 },
//       );
//     }

//     const bar = await prisma.bar.findUnique({
//       where: { id: barId },
//     });

//     if (!bar) {
//       return NextResponse.json({ error: "Bar not found" }, { status: 404 });
//     }

//     return NextResponse.json({ bar });
//   } catch (error) {
//     console.error("Error fetching bar:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 },
//     );
//   }
// }

// export async function PUT(
//   request: NextRequest,
//   { params }: { params: Promise<{ id: string }> },
// ) {
//   try {
//     const authHeader = request.headers.get("authorization");
//     const token = authHeader?.replace("Bearer ", "");

//     if (!token) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { id: barId } = await params;
//     const body: BarUpdateData = await request.json();

//     // Convert string enums to proper Prisma enum types
//     const typeEnum = body.type as BarType;
//     const priceRangeEnum = body.priceRange
//       ? (body.priceRange as PriceRange)
//       : null;

//     // Update ALL bar fields including images
//     const updatedBar = await prisma.bar.update({
//       where: { id: barId },
//       data: {
//         name: body.name,
//         description: body.description,
//         address: body.address,
//         city: body.city,
//         district: body.district,
//         type: typeEnum,
//         latitude: body.latitude ? parseFloat(body.latitude) : null,
//         longitude: body.longitude ? parseFloat(body.longitude) : null,
//         phone: body.phone,
//         email: body.email,
//         website: body.website,
//         instagram: body.instagram,
//         priceRange: priceRangeEnum,
//         capacity: body.capacity ? parseInt(body.capacity) : null,
//         amenities: body.amenities,
//         isActive: body.isActive,
//         vipEnabled: body.vipEnabled,
//         // ADD IMAGE FIELDS HERE
//         coverImage: body.coverImage,
//         logoUrl: body.logoUrl,
//         imageUrls: body.imageUrls,
//       },
//     });

//     console.log("✅ Bar updated successfully with images:", {
//       coverImage: body.coverImage,
//       logoUrl: body.logoUrl,
//       imageUrlsCount: body.imageUrls?.length || 0,
//     });

//     return NextResponse.json({ bar: updatedBar });
//   } catch (error) {
//     console.error("Error updating bar:", error);

//     if (error instanceof Error && error.message.includes("Unique constraint")) {
//       return NextResponse.json(
//         { error: "A bar with this name already exists" },
//         { status: 400 },
//       );
//     }

//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 },
//     );
//   }
// }

// export async function DELETE(
//   request: NextRequest,
//   { params }: { params: Promise<{ id: string }> },
// ) {
//   try {
//     const authHeader = request.headers.get("authorization");
//     const token = authHeader?.replace("Bearer ", "");

//     if (!token) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { id: barId } = await params;

//     await prisma.bar.delete({
//       where: { id: barId },
//     });

//     return NextResponse.json({ message: "Bar deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting bar:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 },
//     );
//   }
// }
// // Route: GET /api/auth/admin/bars/[id]
// // Description: Get, update, or delete a specific bar by ID
// // Methods: GET, PATCH, DELETE

// import { NextRequest, NextResponse } from "next/server";
// import {
//   PrismaClient,
//   BarType,
//   BarStatus,
//   PriceRange,
//   AdminRole,
// } from "@prisma/client";
// import { verify } from "jsonwebtoken";

// const prisma = new PrismaClient();
// const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// async function verifyAdminToken(token: string) {
//   try {
//     const decoded = verify(token, JWT_SECRET) as { role: string };

//     // FIXED: Cast the role string to AdminRole enum
//     const adminRole = decoded.role as AdminRole;

//     const adminUser = await prisma.adminUser.findFirst({
//       where: { isActive: true, role: adminRole },
//     });
//     return adminUser;
//   } catch (error) {
//     console.error("Token verification error:", error);
//     return null;
//   }
// }

// // GET - Fetch single bar
// export async function GET(
//   request: NextRequest,
//   { params }: { params: Promise<{ id: string }> },
// ) {
//   try {
//     const token = request.headers.get("authorization")?.replace("Bearer ", "");
//     const { id } = await params;

//     if (!token) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const adminUser = await verifyAdminToken(token);
//     if (!adminUser) {
//       return NextResponse.json({ error: "Invalid token" }, { status: 401 });
//     }

//     const bar = await prisma.bar.findUnique({
//       where: { id },
//       include: {
//         staff: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//             role: true,
//             isActive: true,
//             lastLogin: true,
//           },
//         },
//         promotions: {
//           where: { isActive: true },
//           select: {
//             id: true,
//             title: true,
//             type: true,
//             discount: true,
//             startDate: true,
//             endDate: true,
//             redemptions: true,
//           },
//         },
//         vipPassesEnhanced: {
//           where: { isActive: true },
//           select: {
//             id: true,
//             name: true,
//             priceCents: true,
//             soldCount: true,
//             totalQuantity: true,
//           },
//         },
//       },
//     });

//     if (!bar) {
//       return NextResponse.json({ error: "Bar not found" }, { status: 404 });
//     }

//     return NextResponse.json({
//       success: true,
//       bar: {
//         id: bar.id,
//         name: bar.name,
//         description: bar.description,
//         address: bar.address,
//         cityName: bar.cityName,
//         district: bar.district,
//         type: bar.type,
//         latitude: bar.latitude,
//         longitude: bar.longitude,
//         phone: bar.phone,
//         email: bar.email,
//         website: bar.website,
//         instagram: bar.instagram,
//         operatingHours: bar.operatingHours,
//         priceRange: bar.priceRange,
//         capacity: bar.capacity,
//         amenities: bar.amenities,
//         coverImage: bar.coverImage,
//         imageUrls: bar.imageUrls,
//         logoUrl: bar.logoUrl,
//         status: bar.status,
//         isVerified: bar.isVerified,
//         isActive: bar.isActive,
//         vipEnabled: bar.vipEnabled,
//         vipPrice: bar.vipPrice,
//         profileViews: bar.profileViews,
//         createdAt: bar.createdAt,
//         updatedAt: bar.updatedAt,
//         claimedAt: bar.claimedAt,
//         staff: bar.staff,
//         promotions: bar.promotions,
//         vipPasses: bar.vipPassesEnhanced,
//       },
//     });
//   } catch (error) {
//     console.error("Fetch bar error:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 },
//     );
//   }
// }

// // PATCH - Update bar
// export async function PATCH(
//   request: NextRequest,
//   { params }: { params: Promise<{ id: string }> },
// ) {
//   try {
//     const token = request.headers.get("authorization")?.replace("Bearer ", "");
//     const { id } = await params;

//     if (!token) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const adminUser = await verifyAdminToken(token);
//     if (!adminUser) {
//       return NextResponse.json({ error: "Invalid token" }, { status: 401 });
//     }

//     const body = await request.json();

//     // Validate and convert enum values
//     let typeEnum = undefined;
//     if (body.type && Object.values(BarType).includes(body.type as BarType)) {
//       typeEnum = body.type as BarType;
//     }

//     let statusEnum = undefined;
//     if (
//       body.status &&
//       Object.values(BarStatus).includes(body.status as BarStatus)
//     ) {
//       statusEnum = body.status as BarStatus;
//     }

//     let priceRangeEnum = undefined;
//     if (
//       body.priceRange &&
//       Object.values(PriceRange).includes(body.priceRange as PriceRange)
//     ) {
//       priceRangeEnum = body.priceRange as PriceRange;
//     }

//     const updatedBar = await prisma.bar.update({
//       where: { id },
//       data: {
//         name: body.name,
//         description: body.description,
//         address: body.address,
//         cityName: body.cityName,
//         district: body.district,
//         type: typeEnum,
//         latitude: body.latitude ? parseFloat(body.latitude) : null,
//         longitude: body.longitude ? parseFloat(body.longitude) : null,
//         phone: body.phone,
//         email: body.email,
//         website: body.website,
//         instagram: body.instagram,
//         operatingHours: body.operatingHours,
//         priceRange: priceRangeEnum,
//         capacity: body.capacity ? parseInt(body.capacity) : null,
//         amenities: body.amenities,
//         coverImage: body.coverImage,
//         imageUrls: body.imageUrls,
//         logoUrl: body.logoUrl,
//         status: statusEnum,
//         isVerified: body.isVerified,
//         isActive: body.isActive,
//         vipEnabled: body.vipEnabled,
//         vipPrice: body.vipPrice ? parseFloat(body.vipPrice) : null,
//       },
//     });

//     return NextResponse.json({
//       success: true,
//       message: "Bar updated successfully",
//       bar: updatedBar,
//     });
//   } catch (error) {
//     console.error("Update bar error:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 },
//     );
//   }
// }

// // DELETE - Delete bar
// export async function DELETE(
//   request: NextRequest,
//   { params }: { params: Promise<{ id: string }> },
// ) {
//   try {
//     const token = request.headers.get("authorization")?.replace("Bearer ", "");
//     const { id } = await params;

//     if (!token) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const adminUser = await verifyAdminToken(token);
//     if (!adminUser) {
//       return NextResponse.json({ error: "Invalid token" }, { status: 401 });
//     }

//     // First delete related records
//     await prisma.barStaff.deleteMany({ where: { barId: id } });
//     await prisma.barPromotion.deleteMany({ where: { barId: id } });
//     await prisma.vIPPassEnhanced.deleteMany({ where: { barId: id } });

//     // Then delete the bar
//     await prisma.bar.delete({ where: { id } });

//     return NextResponse.json({
//       success: true,
//       message: "Bar deleted successfully",
//     });
//   } catch (error) {
//     console.error("Delete bar error:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 },
//     );
//   }
// }
// Route: GET /api/auth/admin/bars/[id]
// Description: Get, update, or delete a specific bar by ID
// Methods: GET, PATCH, DELETE

// Route: GET /api/auth/admin/bars/[id]
// Description: Get, update, or delete a specific bar by ID
// Methods: GET, PUT, PATCH, DELETE

import { NextRequest, NextResponse } from "next/server";
import {
  PrismaClient,
  BarType,
  BarStatus,
  PriceRange,
  AdminRole,
} from "@prisma/client";
import { verify } from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Map of valid role strings to AdminRole enum
const roleMap: Record<string, AdminRole> = {
  admin: "SUPER_ADMIN",
  super_admin: "SUPER_ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
  content_moderator: "CONTENT_MODERATOR",
  CONTENT_MODERATOR: "CONTENT_MODERATOR",
  analytics_viewer: "ANALYTICS_VIEWER",
  ANALYTICS_VIEWER: "ANALYTICS_VIEWER",
  support: "SUPPORT",
  SUPPORT: "SUPPORT",
};

async function verifyAdminToken(token: string): Promise<{ id: string } | null> {
  try {
    const decoded = verify(token, JWT_SECRET) as { role: string; id?: string };

    const mappedRole = roleMap[decoded.role];

    if (!mappedRole) {
      console.error("Invalid admin role:", decoded.role);
      return null;
    }

    const adminUser = await prisma.adminUser.findFirst({
      where: { isActive: true, role: mappedRole },
      select: { id: true },
    });
    return adminUser;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

// GET - Fetch single bar
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { id } = await params;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await verifyAdminToken(token);
    if (!adminUser) {
      return NextResponse.json(
        { error: "Invalid token or insufficient permissions" },
        { status: 401 },
      );
    }

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
        coverImage: true,
        imageUrls: true,
        logoUrl: true,
        status: true,
        isVerified: true,
        isActive: true,
        vipEnabled: true,
        vipPrice: true,
        profileViews: true,
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
          where: { isActive: true },
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
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            priceCents: true,
            soldCount: true,
            totalQuantity: true,
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
      coverImage: bar.coverImage,
      imageUrls: bar.imageUrls,
      logoUrl: bar.logoUrl,
      status: bar.status,
      isVerified: bar.isVerified,
      isActive: bar.isActive,
      vipEnabled: bar.vipEnabled,
      vipPrice: bar.vipPrice,
      profileViews: bar.profileViews,
      createdAt: bar.createdAt,
      updatedAt: bar.updatedAt,
      claimedAt: bar.claimedAt,
      staff: bar.staff,
      promotions: bar.promotions,
      vipPasses: bar.vipPassesEnhanced,
    };

    return NextResponse.json({
      success: true,
      bar: transformedBar,
    });
  } catch (error) {
    console.error("Fetch bar error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT - Full update of bar (used by edit form)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { id } = await params;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await verifyAdminToken(token);
    if (!adminUser) {
      return NextResponse.json(
        { error: "Invalid token or insufficient permissions" },
        { status: 401 },
      );
    }

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
        adminId: adminUser.id,
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
    console.error("Update bar error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH - Partial update of bar (for quick actions like status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { id } = await params;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await verifyAdminToken(token);
    if (!adminUser) {
      return NextResponse.json(
        { error: "Invalid token or insufficient permissions" },
        { status: 401 },
      );
    }

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
        adminId: adminUser.id,
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
    console.error("Patch bar error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE - Delete bar
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { id } = await params;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await verifyAdminToken(token);
    if (!adminUser) {
      return NextResponse.json(
        { error: "Invalid token or insufficient permissions" },
        { status: 401 },
      );
    }

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
        adminId: adminUser.id,
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
    console.error("Delete bar error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
