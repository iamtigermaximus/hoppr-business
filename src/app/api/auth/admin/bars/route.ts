// // src/app/api/admin/bars/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { PrismaClient, Prisma, BarStatus } from "@prisma/client";

// const prisma = new PrismaClient();

// // Type guard to validate BarStatus
// function isValidBarStatus(status: string): status is BarStatus {
//   return ["UNCLAIMED", "CLAIMED", "VERIFIED", "SUSPENDED"].includes(
//     status as BarStatus
//   );
// }

// // Helper function to get default operating hours
// function getDefaultOperatingHours() {
//   return {
//     monday: { open: "16:00", close: "02:00" },
//     tuesday: { open: "16:00", close: "02:00" },
//     wednesday: { open: "16:00", close: "02:00" },
//     thursday: { open: "16:00", close: "02:00" },
//     friday: { open: "16:00", close: "04:00" },
//     saturday: { open: "14:00", close: "04:00" },
//     sunday: { open: "14:00", close: "02:00" },
//   };
// }

// // Helper function to verify admin token
// async function verifyAdminToken(token: string) {
//   try {
//     const adminUser = await prisma.adminUser.findFirst({
//       where: {
//         id: token,
//         isActive: true,
//       },
//     });
//     return adminUser;
//   } catch (error) {
//     return null;
//   }
// }

// // POST /api/admin/bars - Create a new bar manually
// export async function POST(request: NextRequest) {
//   try {
//     const token = request.headers.get("authorization")?.replace("Bearer ", "");
//     if (!token) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // Verify admin user
//     const adminUser = await verifyAdminToken(token);
//     if (!adminUser) {
//       return NextResponse.json(
//         { error: "Invalid admin token" },
//         { status: 401 }
//       );
//     }

//     const body = await request.json();

//     // Validate required fields
//     if (!body.name || !body.type || !body.address || !body.city) {
//       return NextResponse.json(
//         {
//           error: "Missing required fields: name, type, address, city",
//         },
//         { status: 400 }
//       );
//     }

//     // Validate bar type
//     const validBarTypes = [
//       "PUB",
//       "CLUB",
//       "LOUNGE",
//       "COCKTAIL_BAR",
//       "RESTAURANT_BAR",
//       "SPORTS_BAR",
//       "KARAOKE",
//       "LIVE_MUSIC",
//     ];
//     if (!validBarTypes.includes(body.type)) {
//       return NextResponse.json(
//         {
//           error: `Invalid bar type. Must be one of: ${validBarTypes.join(
//             ", "
//           )}`,
//         },
//         { status: 400 }
//       );
//     }

//     // Check for duplicate bar name
//     const existingBar = await prisma.bar.findUnique({
//       where: { name: body.name.trim() },
//     });

//     if (existingBar) {
//       return NextResponse.json(
//         { error: "Bar with this name already exists" },
//         { status: 409 }
//       );
//     }

//     // Create bar
//     const bar = await prisma.bar.create({
//       data: {
//         name: body.name.trim(),
//         type: body.type,
//         address: body.address.trim(),
//         city: body.city.trim(),
//         district: body.district?.trim(),
//         phone: body.phone?.trim(),
//         email: body.email?.trim(),
//         website: body.website?.trim(),
//         instagram: body.instagram?.trim(),
//         priceRange: body.priceRange,
//         capacity: body.capacity ? parseInt(body.capacity) : null,
//         amenities: body.amenities || [],
//         description: body.description?.trim(),
//         operatingHours: body.operatingHours || getDefaultOperatingHours(),
//         vipEnabled: body.vipEnabled || false,
//         coverImage: body.coverImage?.trim(),
//         imageUrls: body.imageUrls || [],
//         logoUrl: body.logoUrl?.trim(),
//         latitude: body.latitude ? parseFloat(body.latitude) : null,
//         longitude: body.longitude ? parseFloat(body.longitude) : null,
//         status: "UNCLAIMED",
//         isVerified: false,
//         isActive: true,
//         createdById: adminUser.id,
//       },
//     });

//     // Create audit log
//     await prisma.auditLog.create({
//       data: {
//         adminId: adminUser.id,
//         action: "CREATE",
//         resource: "BAR",
//         details: {
//           barId: bar.id,
//           barName: bar.name,
//           type: bar.type,
//           city: bar.city,
//         },
//         ipAddress: request.headers.get("x-forwarded-for") || "unknown",
//         userAgent: request.headers.get("user-agent") || "unknown",
//       },
//     });

//     return NextResponse.json(
//       {
//         success: true,
//         bar: {
//           id: bar.id,
//           name: bar.name,
//           type: bar.type,
//           city: bar.city,
//           status: bar.status,
//           createdAt: bar.createdAt,
//         },
//       },
//       { status: 201 }
//     );
//   } catch (error) {
//     console.error("Manual bar creation error:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// // GET /api/admin/bars - List bars with pagination and search
// export async function GET(request: NextRequest) {
//   try {
//     const token = request.headers.get("authorization")?.replace("Bearer ", "");
//     if (!token)
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const adminUser = await verifyAdminToken(token);
//     if (!adminUser)
//       return NextResponse.json(
//         { error: "Invalid admin token" },
//         { status: 401 }
//       );

//     const { searchParams } = new URL(request.url);
//     const page = parseInt(searchParams.get("page") || "1");
//     const limit = parseInt(searchParams.get("limit") || "10");
//     const search = searchParams.get("search") || "";
//     const status = searchParams.get("status") || "";
//     const city = searchParams.get("city") || "";

//     const skip = (page - 1) * limit;

//     // Build where clause with proper TypeScript type
//     const where: Prisma.BarWhereInput = {};

//     if (search) {
//       where.OR = [
//         { name: { contains: search, mode: "insensitive" } },
//         { city: { contains: search, mode: "insensitive" } },
//         { district: { contains: search, mode: "insensitive" } },
//       ];
//     }

//     // Proper status validation with type guard
//     if (status && isValidBarStatus(status)) {
//       where.status = status;
//     }

//     if (city) {
//       where.city = { contains: city, mode: "insensitive" };
//     }

//     const [bars, total] = await Promise.all([
//       prisma.bar.findMany({
//         where,
//         skip,
//         take: limit,
//         orderBy: { createdAt: "desc" },
//         select: {
//           id: true,
//           name: true,
//           type: true,
//           city: true,
//           district: true,
//           status: true,
//           isVerified: true,
//           isActive: true,
//           createdAt: true,
//           _count: {
//             select: {
//               staff: true,
//               promotions: { where: { isActive: true } },
//             },
//           },
//         },
//       }),
//       prisma.bar.count({ where }),
//     ]);

//     return NextResponse.json({
//       bars: bars.map((bar) => ({
//         id: bar.id,
//         name: bar.name,
//         type: bar.type,
//         city: bar.city,
//         district: bar.district,
//         status: bar.status,
//         isVerified: bar.isVerified,
//         isActive: bar.isActive,
//         createdAt: bar.createdAt,
//         staffCount: bar._count.staff,
//         activePromotions: bar._count.promotions,
//       })),
//       pagination: {
//         page,
//         limit,
//         total,
//         pages: Math.ceil(total / limit),
//       },
//     });
//   } catch (error) {
//     console.error("Get bars error:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }
// src/app/api/admin/bars/route.ts
// In your BarsDatabase component - use this improved version
// src/app/api/admin/bars/route.ts
// src/app/api/admin/bars/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma, BarStatus } from "@prisma/client";
import { verifyToken, isAdminToken, AdminJWTPayload } from "@/lib/auth";

const prisma = new PrismaClient();

// Type guard to validate BarStatus
function isValidBarStatus(status: string): status is BarStatus {
  return ["UNCLAIMED", "CLAIMED", "VERIFIED", "SUSPENDED"].includes(
    status as BarStatus
  );
}

// Helper to safely extract user ID from token payload
function getUserIdFromPayload(payload: AdminJWTPayload): string | null {
  // Check both possible field names safely
  if ("userId" in payload && typeof payload.userId === "string") {
    return payload.userId;
  }

  if ("id" in payload && typeof payload.id === "string") {
    return payload.id;
  }

  return null;
}

// Helper function to verify JWT token
async function verifyAdminToken(token: string) {
  try {
    const payload = verifyToken(token);

    if (!payload || !isAdminToken(payload)) {
      console.log("Invalid token or not an admin token");
      return null;
    }

    const userId = getUserIdFromPayload(payload);

    if (!userId) {
      console.log("No user ID found in token payload");
      return null;
    }

    const adminUser = await prisma.adminUser.findFirst({
      where: {
        id: userId,
        isActive: true,
      },
    });

    return adminUser;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

// Helper function to get default operating hours
function getDefaultOperatingHours() {
  return {
    monday: { open: "16:00", close: "02:00" },
    tuesday: { open: "16:00", close: "02:00" },
    wednesday: { open: "16:00", close: "02:00" },
    thursday: { open: "16:00", close: "02:00" },
    friday: { open: "16:00", close: "04:00" },
    saturday: { open: "14:00", close: "04:00" },
    sunday: { open: "14:00", close: "02:00" },
  };
}

// // GET /api/admin/bars - List bars with pagination and search
// export async function GET(request: NextRequest) {
//   try {
//     const token = request.headers.get("authorization")?.replace("Bearer ", "");

//     if (!token) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const adminUser = await verifyAdminToken(token);

//     if (!adminUser) {
//       return NextResponse.json(
//         { error: "Invalid admin token" },
//         { status: 401 }
//       );
//     }

//     const { searchParams } = new URL(request.url);
//     const page = parseInt(searchParams.get("page") || "1");
//     const limit = parseInt(searchParams.get("limit") || "10");
//     const search = searchParams.get("search") || "";
//     const status = searchParams.get("status") || "";
//     const city = searchParams.get("city") || "";

//     const skip = (page - 1) * limit;

//     // Build where clause
//     const where: Prisma.BarWhereInput = {};

//     if (search) {
//       where.OR = [
//         { name: { contains: search, mode: "insensitive" } },
//         { city: { contains: search, mode: "insensitive" } },
//         { district: { contains: search, mode: "insensitive" } },
//       ];
//     }

//     if (status && isValidBarStatus(status)) {
//       where.status = status;
//     }

//     if (city) {
//       where.city = { contains: city, mode: "insensitive" };
//     }

//     const [bars, total] = await Promise.all([
//       prisma.bar.findMany({
//         where,
//         skip,
//         take: limit,
//         orderBy: { createdAt: "desc" },
//         select: {
//           id: true,
//           name: true,
//           type: true,
//           city: true,
//           district: true,
//           status: true,
//           isVerified: true,
//           isActive: true,
//           createdAt: true,
//           _count: {
//             select: {
//               staff: true,
//               promotions: { where: { isActive: true } },
//             },
//           },
//         },
//       }),
//       prisma.bar.count({ where }),
//     ]);

//     return NextResponse.json({
//       bars: bars.map((bar) => ({
//         id: bar.id,
//         name: bar.name,
//         type: bar.type,
//         city: bar.city,
//         district: bar.district,
//         status: bar.status,
//         isVerified: bar.isVerified,
//         isActive: bar.isActive,
//         createdAt: bar.createdAt,
//         staffCount: bar._count.staff,
//         activePromotions: bar._count.promotions,
//       })),
//       pagination: {
//         page,
//         limit,
//         total,
//         pages: Math.ceil(total / limit),
//       },
//     });
//   } catch (error) {
//     console.error("Get bars error:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }
// Update your GET function in /api/auth/admin/bars/route.ts
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await verifyAdminToken(token);

    if (!adminUser) {
      return NextResponse.json(
        { error: "Invalid admin token" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const city = searchParams.get("city") || "";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.BarWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { district: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && isValidBarStatus(status)) {
      where.status = status;
    }

    if (city) {
      where.city = { contains: city, mode: "insensitive" };
    }

    // Get paginated bars
    const bars = await prisma.bar.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        type: true,
        city: true,
        district: true,
        status: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Get total count for pagination
    const total = await prisma.bar.count({ where });

    // NEW: Get statistics for the current filter (or all bars if no filter)
    const stats = {
      totalBars: await prisma.bar.count({ where }),
      activeBars: await prisma.bar.count({
        where: { ...where, status: { not: "SUSPENDED" } },
      }),
      verifiedBars: await prisma.bar.count({
        where: { ...where, isVerified: true },
      }),
      unclaimedBars: await prisma.bar.count({
        where: { ...where, status: "UNCLAIMED" },
      }),
    };

    return NextResponse.json({
      bars,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats, // Include stats in response
    });
  } catch (error) {
    console.error("Get bars error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
// POST /api/admin/bars - Create a new bar manually
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await verifyAdminToken(token);
    if (!adminUser) {
      return NextResponse.json(
        { error: "Invalid admin token" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.type || !body.address || !body.city) {
      return NextResponse.json(
        {
          error: "Missing required fields: name, type, address, city",
        },
        { status: 400 }
      );
    }

    // Validate bar type
    const validBarTypes = [
      "PUB",
      "CLUB",
      "LOUNGE",
      "COCKTAIL_BAR",
      "RESTAURANT_BAR",
      "SPORTS_BAR",
      "KARAOKE",
      "LIVE_MUSIC",
    ];
    if (!validBarTypes.includes(body.type)) {
      return NextResponse.json(
        {
          error: `Invalid bar type. Must be one of: ${validBarTypes.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Check for duplicate bar name
    const existingBar = await prisma.bar.findUnique({
      where: { name: body.name.trim() },
    });

    if (existingBar) {
      return NextResponse.json(
        { error: "Bar with this name already exists" },
        { status: 409 }
      );
    }

    // Create bar
    const bar = await prisma.bar.create({
      data: {
        name: body.name.trim(),
        type: body.type,
        address: body.address.trim(),
        city: body.city.trim(),
        district: body.district?.trim(),
        phone: body.phone?.trim(),
        email: body.email?.trim(),
        website: body.website?.trim(),
        instagram: body.instagram?.trim(),
        priceRange: body.priceRange,
        capacity: body.capacity ? parseInt(body.capacity) : null,
        amenities: body.amenities || [],
        description: body.description?.trim(),
        operatingHours: body.operatingHours || getDefaultOperatingHours(),
        vipEnabled: body.vipEnabled || false,
        coverImage: body.coverImage?.trim(),
        imageUrls: body.imageUrls || [],
        logoUrl: body.logoUrl?.trim(),
        latitude: body.latitude ? parseFloat(body.latitude) : null,
        longitude: body.longitude ? parseFloat(body.longitude) : null,
        status: "UNCLAIMED",
        isVerified: false,
        isActive: true,
        createdById: adminUser.id,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        adminId: adminUser.id,
        action: "CREATE",
        resource: "BAR",
        details: {
          barId: bar.id,
          barName: bar.name,
          type: bar.type,
          city: bar.city,
        },
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    });

    return NextResponse.json(
      {
        success: true,
        bar: {
          id: bar.id,
          name: bar.name,
          type: bar.type,
          city: bar.city,
          status: bar.status,
          createdAt: bar.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Manual bar creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
