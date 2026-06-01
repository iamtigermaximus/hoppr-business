// import { NextRequest, NextResponse } from "next/server";
// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// async function verifyAdminToken(token: string) {
//   try {
//     const adminUser = await prisma.user.findFirst({
//       where: { role: "SUPER_ADMIN" },
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
import { verify } from "jsonwebtoken";
import {
  BarTypesAnalyticsResponse,
  BarTypeAnalytics,
} from "@/types/admin-analytics";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

async function verifyAdminToken(token: string) {
  try {
    const decoded = verify(token, JWT_SECRET) as { role: string; id?: string; userId?: string };
    const userId = decoded.id || decoded.userId;
    if (!userId) return null;

    const adminUser = await prisma.adminUser.findFirst({
      where: { id: userId, isActive: true },
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
