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

//     const barsByType = await prisma.bar.groupBy({
//       by: ["type"],
//       _count: { id: true },
//       orderBy: {
//         _count: { id: "desc" },
//       },
//     });

//     const formattedData = barsByType.map((item) => ({
//       type: item.type,
//       count: item._count.id,
//     }));

//     return NextResponse.json({
//       success: true,
//       data: formattedData,
//     });
//   } catch (error) {
//     console.error("Bar types analytics error:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 },
//     );
//   }
// }
// Route: GET /api/auth/admin/analytics/bar-types
// Description: Get bar count grouped by bar type

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  BarTypesAnalyticsResponse,
  BarTypeAnalytics,
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

    const barsByType = await prisma.bar.groupBy({
      by: ["type"],
      _count: { id: true },
      orderBy: {
        _count: { id: "desc" },
      },
    });

    const formattedData: BarTypeAnalytics[] = barsByType.map((item) => ({
      type: item.type,
      count: item._count.id,
    }));

    const response: BarTypesAnalyticsResponse = {
      success: true,
      data: formattedData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Bar types analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
