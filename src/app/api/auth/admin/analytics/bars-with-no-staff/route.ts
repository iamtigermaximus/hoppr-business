// import { NextRequest, NextResponse } from "next/server";
// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// async function verifyAdminToken(token: string) {
//   try {
//     const adminUser = await prisma.adminUser.findFirst({
//       where: { isActive: true },
//     });
//     return adminUser;
//   } catch (error) {
//     console.error("Token verification error:", error);
//     return null;
//   }
// }

// export async function GET(request: NextRequest) {
//   try {
//     const token = request.headers.get("authorization")?.replace("Bearer ", "");
//     if (!token) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const adminUser = await verifyAdminToken(token);
//     if (!adminUser) {
//       return NextResponse.json({ error: "Invalid token" }, { status: 401 });
//     }

//     const bars = await prisma.bar.findMany({
//       where: {
//         staff: { none: {} },
//       },
//       select: {
//         id: true,
//         name: true,
//         type: true,
//         city: true,
//         district: true,
//         address: true,
//         createdAt: true,
//       },
//       orderBy: { name: "asc" },
//     });

//     return NextResponse.json({
//       success: true,
//       data: bars,
//       count: bars.length,
//     });
//   } catch (error) {
//     console.error("Error fetching bars with no staff:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 },
//     );
//   }
// }
// Route: GET /api/auth/admin/analytics/bars-with-no-staff
// Description: Get bars that have no staff members assigned

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  BarsWithNoStaffResponse,
  BarWithNoStaff,
} from "@/types/admin-analytics";

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

    const bars = await prisma.bar.findMany({
      where: {
        staff: { none: {} },
      },
      select: {
        id: true,
        name: true,
        type: true,
        cityName: true,
        district: true,
        address: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });

    const formattedBars: BarWithNoStaff[] = bars.map((bar) => ({
      id: bar.id,
      name: bar.name,
      type: bar.type,
      city: bar.cityName || "Unknown",
      district: bar.district,
      address: bar.address,
      createdAt: bar.createdAt,
    }));

    const response: BarsWithNoStaffResponse = {
      success: true,
      data: formattedBars,
      count: formattedBars.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching bars with no staff:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
