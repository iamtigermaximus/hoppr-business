// //src/app/api/auth/bar/[barId]/profile/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { PrismaClient } from "@prisma/client";
// import { verify } from "jsonwebtoken";

// const prisma = new PrismaClient();
// const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// // GET - Fetch bar profile
// export async function GET(
//   request: NextRequest,
//   { params }: { params: Promise<{ barId: string }> },
// ) {
//   try {
//     const token = request.headers.get("authorization")?.replace("Bearer ", "");
//     const { barId } = await params;

//     if (!token) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const decoded = verify(token, JWT_SECRET) as { barId: string };
//     if (decoded.barId !== barId) {
//       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
//     }

//     const bar = await prisma.bar.findUnique({
//       where: { id: barId },
//       select: {
//         id: true,
//         name: true,
//         description: true,
//         address: true,
//         city: true,
//         district: true,
//         type: true,
//         phone: true,
//         email: true,
//         website: true,
//         instagram: true,
//         priceRange: true,
//         capacity: true,
//         amenities: true,
//         coverImage: true,
//         imageUrls: true, // ✅ ADD THIS
//         logoUrl: true,
//         vipEnabled: true,
//         operatingHours: true, // ✅ ADD THIS
//       },
//     });

//     if (!bar) {
//       return NextResponse.json({ error: "Bar not found" }, { status: 404 });
//     }

//     return NextResponse.json(bar);
//   } catch (error) {
//     console.error("Fetch bar profile error:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 },
//     );
//   }
// }

// // PUT - Update bar profile
// export async function PUT(
//   request: NextRequest,
//   { params }: { params: Promise<{ barId: string }> },
// ) {
//   try {
//     const token = request.headers.get("authorization")?.replace("Bearer ", "");
//     const { barId } = await params;

//     if (!token) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const decoded = verify(token, JWT_SECRET) as {
//       barId: string;
//       staffRole: string;
//     };
//     if (decoded.barId !== barId) {
//       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
//     }

//     // Only OWNER and MANAGER can edit profile
//     const allowedRoles = ["OWNER", "MANAGER"];
//     if (!allowedRoles.includes(decoded.staffRole)) {
//       return NextResponse.json(
//         {
//           error:
//             "Insufficient permissions. Only Owners and Managers can edit bar profile.",
//         },
//         { status: 403 },
//       );
//     }

//     const body = await request.json();

//     const updatedBar = await prisma.bar.update({
//       where: { id: barId },
//       data: {
//         name: body.name,
//         description: body.description,
//         address: body.address,
//         city: body.city,
//         district: body.district,
//         type: body.type,
//         phone: body.phone,
//         email: body.email,
//         website: body.website,
//         instagram: body.instagram,
//         priceRange: body.priceRange,
//         capacity: body.capacity,
//         amenities: body.amenities || [],
//         coverImage: body.coverImage,
//         imageUrls: body.imageUrls || [], // ✅ ADD THIS
//         logoUrl: body.logoUrl,
//         vipEnabled: body.vipEnabled,
//         operatingHours: body.operatingHours, // ✅ ADD THIS
//       },
//     });

//     return NextResponse.json({
//       success: true,
//       message: "Bar profile updated successfully",
//       bar: updatedBar,
//     });
//   } catch (error) {
//     console.error("Update bar profile error:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 },
//     );
//   }
// }
//src/app/api/auth/bar/[barId]/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verify } from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// GET - Fetch bar profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { barId } = await params;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verify(token, JWT_SECRET) as { barId: string };
    if (decoded.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const bar = await prisma.bar.findUnique({
      where: { id: barId },
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        cityName: true, // ✅ CORRECT - matches your schema
        district: true,
        type: true,
        phone: true,
        email: true,
        website: true,
        instagram: true,
        priceRange: true,
        capacity: true,
        amenities: true,
        coverImage: true,
        imageUrls: true, // ✅ ADD THIS - was missing
        logoUrl: true,
        vipEnabled: true,
        operatingHours: true, // ✅ ADD THIS - was missing
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
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { barId } = await params;

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

    // Only OWNER and MANAGER can edit profile
    const allowedRoles = ["OWNER", "MANAGER"];
    if (!allowedRoles.includes(decoded.staffRole)) {
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
        cityName: body.city, // ✅ body.city maps to cityName in DB
        district: body.district,
        type: body.type,
        phone: body.phone,
        email: body.email,
        website: body.website,
        instagram: body.instagram,
        priceRange: body.priceRange,
        capacity: body.capacity,
        amenities: body.amenities || [],
        coverImage: body.coverImage,
        imageUrls: body.imageUrls || [], // ✅ ADD THIS - was missing
        logoUrl: body.logoUrl,
        vipEnabled: body.vipEnabled,
        operatingHours: body.operatingHours, // ✅ ADD THIS - was missing
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
