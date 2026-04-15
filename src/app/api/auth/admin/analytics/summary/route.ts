// import { NextRequest, NextResponse } from "next/server";
// import { PrismaClient } from "@prisma/client";
// import {
//   AdminDashboardStats,
//   AdminApiResponse,
//   AdminTimeRange,
// } from "@/types/admin-analytics";

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

// function getDateRange(range: AdminTimeRange): {
//   startDate: Date;
//   prevStartDate: Date;
// } {
//   const now = new Date();
//   const startDate = new Date();
//   const prevStartDate = new Date();

//   switch (range) {
//     case "7d":
//       startDate.setDate(now.getDate() - 7);
//       prevStartDate.setDate(now.getDate() - 14);
//       break;
//     case "90d":
//       startDate.setDate(now.getDate() - 90);
//       prevStartDate.setDate(now.getDate() - 180);
//       break;
//     case "1y":
//       startDate.setFullYear(now.getFullYear() - 1);
//       prevStartDate.setFullYear(now.getFullYear() - 2);
//       break;
//     default:
//       startDate.setDate(now.getDate() - 30);
//       prevStartDate.setDate(now.getDate() - 60);
//   }

//   return { startDate, prevStartDate };
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

//     const rangeParam = request.nextUrl.searchParams.get(
//       "range",
//     ) as AdminTimeRange | null;
//     const range: AdminTimeRange =
//       rangeParam && ["7d", "30d", "90d", "1y"].includes(rangeParam)
//         ? rangeParam
//         : "30d";

//     const { startDate, prevStartDate } = getDateRange(range);

//     // Get current period data
//     const totalBars = await prisma.bar.count();
//     const activeBars = await prisma.bar.count({ where: { isActive: true } });
//     const pendingVerification = await prisma.bar.count({
//       where: { status: "UNCLAIMED", isVerified: false },
//     });

//     // Skip VIP Pass for now - set to 0
//     const vipPassSales = 0;
//     const totalRevenue = 0;

//     // Get active users (bar staff)
//     const activeUsers = await prisma.barStaff.count({
//       where: { isActive: true },
//     });

//     // Get new users (bar staff created in period)
//     const newUsers = await prisma.barStaff.count({
//       where: { createdAt: { gte: startDate } },
//     });

//     // Get previous period data for growth
//     const prevTotalBars = await prisma.bar.count({
//       where: { createdAt: { lt: startDate, gte: prevStartDate } },
//     });

//     const prevNewUsers = await prisma.barStaff.count({
//       where: { createdAt: { lt: startDate, gte: prevStartDate } },
//     });

//     // Calculate growth rates
//     const barGrowth =
//       prevTotalBars === 0
//         ? totalBars > 0
//           ? 100
//           : 0
//         : ((totalBars - prevTotalBars) / prevTotalBars) * 100;

//     const revenueGrowth = 0; // No revenue yet
//     const userGrowth =
//       prevNewUsers === 0
//         ? newUsers > 0
//           ? 100
//           : 0
//         : ((newUsers - prevNewUsers) / prevNewUsers) * 100;

//     const stats: AdminDashboardStats = {
//       totalBars,
//       activeBars,
//       pendingVerification,
//       vipPassSales,
//       totalRevenue,
//       newUsers,
//       userGrowth: Number(userGrowth.toFixed(1)),
//       barGrowth: Number(barGrowth.toFixed(1)),
//       revenueGrowth,
//       activeUsers,
//     };

//     return NextResponse.json({
//       success: true,
//       data: stats,
//     });
//   } catch (error) {
//     console.error("Analytics summary error:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 },
//     );
//   }
// }
// import { NextRequest, NextResponse } from "next/server";
// import { PrismaClient } from "@prisma/client";
// import {
//   AdminDashboardStats,
//   AdminApiResponse,
//   AdminTimeRange,
// } from "@/types/admin-analytics";

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

// function getDateRange(range: AdminTimeRange): {
//   startDate: Date;
//   prevStartDate: Date;
// } {
//   const now = new Date();
//   const startDate = new Date();
//   const prevStartDate = new Date();

//   switch (range) {
//     case "7d":
//       startDate.setDate(now.getDate() - 7);
//       prevStartDate.setDate(now.getDate() - 14);
//       break;
//     case "90d":
//       startDate.setDate(now.getDate() - 90);
//       prevStartDate.setDate(now.getDate() - 180);
//       break;
//     case "1y":
//       startDate.setFullYear(now.getFullYear() - 1);
//       prevStartDate.setFullYear(now.getFullYear() - 2);
//       break;
//     default:
//       startDate.setDate(now.getDate() - 30);
//       prevStartDate.setDate(now.getDate() - 60);
//   }

//   return { startDate, prevStartDate };
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

//     const rangeParam = request.nextUrl.searchParams.get(
//       "range",
//     ) as AdminTimeRange | null;
//     const range: AdminTimeRange =
//       rangeParam && ["7d", "30d", "90d", "1y"].includes(rangeParam)
//         ? rangeParam
//         : "30d";

//     const { startDate, prevStartDate } = getDateRange(range);

//     // Get current period data
//     const totalBars = await prisma.bar.count();
//     const activeBars = await prisma.bar.count({ where: { isActive: true } });
//     const pendingVerification = await prisma.bar.count({
//       where: { status: "UNCLAIMED", isVerified: false },
//     });

//     // NEW: Verified bars count
//     const verifiedBars = await prisma.bar.count({
//       where: { isVerified: true },
//     });

//     // NEW: Data quality metrics
//     const barsWithImages = await prisma.bar.count({
//       where: { coverImage: { not: null } },
//     });

//     const barsWithHours = await prisma.bar.count({
//       where: { operatingHours: { not: {} } },
//     });

//     const barsWithDescription = await prisma.bar.count({
//       where: { description: { not: null } },
//     });

//     const barsWithCoordinates = await prisma.bar.count({
//       where: {
//         latitude: { not: null },
//         longitude: { not: null },
//       },
//     });

//     // Get VIP pass sales (placeholder - 0 for now)
//     let vipPassSales = 0;
//     try {
//       const salesResult = await prisma.vIPPass.aggregate({
//         where: { createdAt: { gte: startDate } },
//         _sum: { soldCount: true },
//       });
//       vipPassSales = salesResult._sum?.soldCount ?? 0;
//     } catch (error) {
//       console.log("soldCount field not found in VIPPass model");
//     }

//     // Calculate revenue from price * soldCount (placeholder - 0 for now)
//     let totalRevenue = 0;
//     try {
//       const vipPasses = await prisma.vIPPass.findMany({
//         where: { createdAt: { gte: startDate } },
//         select: { price: true, soldCount: true },
//       });

//       totalRevenue = vipPasses.reduce((sum, pass) => {
//         const price = pass.price ?? 0;
//         const soldCount = pass.soldCount ?? 0;
//         return sum + price * soldCount;
//       }, 0);
//     } catch (error) {
//       console.log("Error calculating revenue from VIP passes");
//     }

//     const activeUsers = await prisma.barStaff.count({
//       where: { isActive: true },
//     });

//     const newUsers = await prisma.barStaff.count({
//       where: { createdAt: { gte: startDate } },
//     });

//     // Get previous period data for growth
//     const prevTotalBars = await prisma.bar.count({
//       where: { createdAt: { lt: startDate, gte: prevStartDate } },
//     });

//     let previousRevenue = 0;
//     try {
//       const prevVipPasses = await prisma.vIPPass.findMany({
//         where: { createdAt: { lt: startDate, gte: prevStartDate } },
//         select: { price: true, soldCount: true },
//       });

//       previousRevenue = prevVipPasses.reduce((sum, pass) => {
//         const price = pass.price ?? 0;
//         const soldCount = pass.soldCount ?? 0;
//         return sum + price * soldCount;
//       }, 0);
//     } catch (error) {
//       console.log("Error calculating previous period revenue");
//     }

//     const prevNewUsers = await prisma.barStaff.count({
//       where: { createdAt: { lt: startDate, gte: prevStartDate } },
//     });

//     const currentRevenue = totalRevenue;
//     const previousRevenueAmount = previousRevenue;

//     // Calculate growth rates
//     const barGrowth =
//       prevTotalBars === 0
//         ? totalBars > 0
//           ? 100
//           : 0
//         : ((totalBars - prevTotalBars) / prevTotalBars) * 100;

//     const revenueGrowth =
//       previousRevenueAmount === 0
//         ? currentRevenue > 0
//           ? 100
//           : 0
//         : ((currentRevenue - previousRevenueAmount) / previousRevenueAmount) *
//           100;

//     const userGrowth =
//       prevNewUsers === 0
//         ? newUsers > 0
//           ? 100
//           : 0
//         : ((newUsers - prevNewUsers) / prevNewUsers) * 100;

//     // Calculate data completeness percentage
//     const dataCompletenessScore =
//       totalBars > 0
//         ? Math.round(
//             ((barsWithImages +
//               barsWithHours +
//               barsWithDescription +
//               barsWithCoordinates) /
//               (totalBars * 4)) *
//               100,
//           )
//         : 0;

//     const stats: AdminDashboardStats = {
//       totalBars,
//       activeBars,
//       pendingVerification,
//       vipPassSales,
//       totalRevenue: currentRevenue,
//       newUsers,
//       userGrowth: Number(userGrowth.toFixed(1)),
//       barGrowth: Number(barGrowth.toFixed(1)),
//       revenueGrowth: Number(revenueGrowth.toFixed(1)),
//       activeUsers,
//       verifiedBars,
//       barsWithImages,
//       barsWithHours,
//       barsWithDescription,
//       barsWithCoordinates,
//       dataCompletenessScore,
//     };

//     return NextResponse.json({
//       success: true,
//       data: stats,
//     });
//   } catch (error) {
//     console.error("Analytics summary error:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 },
//     );
//   }
// }
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  AdminDashboardStats,
  AdminApiResponse,
  AdminTimeRange,
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

function getDateRange(range: AdminTimeRange): {
  startDate: Date;
  prevStartDate: Date;
} {
  const now = new Date();
  const startDate = new Date();
  const prevStartDate = new Date();

  switch (range) {
    case "7d":
      startDate.setDate(now.getDate() - 7);
      prevStartDate.setDate(now.getDate() - 14);
      break;
    case "90d":
      startDate.setDate(now.getDate() - 90);
      prevStartDate.setDate(now.getDate() - 180);
      break;
    case "1y":
      startDate.setFullYear(now.getFullYear() - 1);
      prevStartDate.setFullYear(now.getFullYear() - 2);
      break;
    default:
      startDate.setDate(now.getDate() - 30);
      prevStartDate.setDate(now.getDate() - 60);
  }

  return { startDate, prevStartDate };
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

    const rangeParam = request.nextUrl.searchParams.get(
      "range",
    ) as AdminTimeRange | null;
    const range: AdminTimeRange =
      rangeParam && ["7d", "30d", "90d", "1y"].includes(rangeParam)
        ? rangeParam
        : "30d";

    const { startDate, prevStartDate } = getDateRange(range);

    // Get current period data
    const totalBars = await prisma.bar.count();
    const activeBars = await prisma.bar.count({ where: { isActive: true } });
    const pendingVerification = await prisma.bar.count({
      where: { status: "UNCLAIMED", isVerified: false },
    });

    // Verified bars count
    const verifiedBars = await prisma.bar.count({
      where: { isVerified: true },
    });

    // Data quality metrics (what you HAVE)
    const barsWithImages = await prisma.bar.count({
      where: { coverImage: { not: null } },
    });

    const barsWithHours = await prisma.bar.count({
      where: { operatingHours: { not: {} } },
    });

    const barsWithDescription = await prisma.bar.count({
      where: { description: { not: null } },
    });

    const barsWithCoordinates = await prisma.bar.count({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
    });

    // Calculate MISSING counts (what you DON'T HAVE)
    const barsMissingImages = totalBars - barsWithImages;
    const barsMissingHours = totalBars - barsWithHours;
    const barsMissingDescription = totalBars - barsWithDescription;
    const barsMissingCoordinates = totalBars - barsWithCoordinates;
    const barsUnverified = totalBars - verifiedBars;
    const barsInactive = totalBars - activeBars;

    // VIP pass sales (placeholder - 0 for now)
    let vipPassSales = 0;
    try {
      const salesResult = await prisma.vIPPass.aggregate({
        where: { createdAt: { gte: startDate } },
        _sum: { soldCount: true },
      });
      vipPassSales = salesResult._sum?.soldCount ?? 0;
    } catch (error) {
      console.log("soldCount field not found in VIPPass model");
    }

    // Calculate revenue (placeholder - 0 for now)
    let totalRevenue = 0;
    try {
      const vipPasses = await prisma.vIPPass.findMany({
        where: { createdAt: { gte: startDate } },
        select: { price: true, soldCount: true },
      });

      totalRevenue = vipPasses.reduce((sum, pass) => {
        const price = pass.price ?? 0;
        const soldCount = pass.soldCount ?? 0;
        return sum + price * soldCount;
      }, 0);
    } catch (error) {
      console.log("Error calculating revenue from VIP passes");
    }

    const activeUsers = await prisma.barStaff.count({
      where: { isActive: true },
    });

    const newUsers = await prisma.barStaff.count({
      where: { createdAt: { gte: startDate } },
    });

    // Get previous period data for growth
    const prevTotalBars = await prisma.bar.count({
      where: { createdAt: { lt: startDate, gte: prevStartDate } },
    });

    let previousRevenue = 0;
    try {
      const prevVipPasses = await prisma.vIPPass.findMany({
        where: { createdAt: { lt: startDate, gte: prevStartDate } },
        select: { price: true, soldCount: true },
      });

      previousRevenue = prevVipPasses.reduce((sum, pass) => {
        const price = pass.price ?? 0;
        const soldCount = pass.soldCount ?? 0;
        return sum + price * soldCount;
      }, 0);
    } catch (error) {
      console.log("Error calculating previous period revenue");
    }

    const prevNewUsers = await prisma.barStaff.count({
      where: { createdAt: { lt: startDate, gte: prevStartDate } },
    });

    const currentRevenue = totalRevenue;
    const previousRevenueAmount = previousRevenue;

    // Calculate growth rates
    const barGrowth =
      prevTotalBars === 0
        ? totalBars > 0
          ? 100
          : 0
        : ((totalBars - prevTotalBars) / prevTotalBars) * 100;

    const revenueGrowth =
      previousRevenueAmount === 0
        ? currentRevenue > 0
          ? 100
          : 0
        : ((currentRevenue - previousRevenueAmount) / previousRevenueAmount) *
          100;

    const userGrowth =
      prevNewUsers === 0
        ? newUsers > 0
          ? 100
          : 0
        : ((newUsers - prevNewUsers) / prevNewUsers) * 100;

    // Calculate data completeness percentage
    const dataCompletenessScore =
      totalBars > 0
        ? Math.round(
            ((barsWithImages +
              barsWithHours +
              barsWithDescription +
              barsWithCoordinates) /
              (totalBars * 4)) *
              100,
          )
        : 0;

    const stats: AdminDashboardStats = {
      totalBars,
      activeBars,
      pendingVerification,
      vipPassSales,
      totalRevenue: currentRevenue,
      newUsers,
      userGrowth: Number(userGrowth.toFixed(1)),
      barGrowth: Number(barGrowth.toFixed(1)),
      revenueGrowth: Number(revenueGrowth.toFixed(1)),
      activeUsers,
      verifiedBars,
      barsWithImages,
      barsWithHours,
      barsWithDescription,
      barsWithCoordinates,
      dataCompletenessScore,
      // NEW MISSING COUNTS
      barsMissingImages,
      barsMissingHours,
      barsMissingDescription,
      barsMissingCoordinates,
      barsUnverified,
      barsInactive,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Analytics summary error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
