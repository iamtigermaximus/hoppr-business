// // src/app/api/admin/bars/import/history/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// export async function GET(request: NextRequest) {
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

//     const { searchParams } = new URL(request.url);
//     const limit = parseInt(searchParams.get("limit") || "10");
//     const page = parseInt(searchParams.get("page") || "1");
//     const skip = (page - 1) * limit;

//     const [imports, total] = await Promise.all([
//       prisma.barImport.findMany({
//         where: {
//           importedBy: adminUser.id,
//         },
//         orderBy: {
//           createdAt: "desc",
//         },
//         skip,
//         take: limit,
//         select: {
//           id: true,
//           fileName: true,
//           fileSize: true,
//           totalRows: true,
//           importedRows: true,
//           failedRows: true,
//           status: true,
//           createdAt: true,
//           updatedAt: true,
//         },
//       }),
//       prisma.barImport.count({
//         where: {
//           importedBy: adminUser.id,
//         },
//       }),
//     ]);

//     return NextResponse.json({
//       imports,
//       pagination: {
//         page,
//         limit,
//         total,
//         pages: Math.ceil(total / limit),
//       },
//     });
//   } catch (error) {
//     console.error("Import history error:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// async function verifyAdminToken(token: string) {
//   try {
//     const adminUser = await prisma.adminUser.findFirst({
//       where: { id: token, isActive: true },
//     });
//     return adminUser;
//   } catch (error) {
//     return null;
//   }
// }
// src/app/api/auth/admin/bars/import/history/route.ts
// src/app/api/auth/admin/bars/import/history/route.ts
// src/app/api/auth/admin/bars/import/history/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { PrismaClient } from "@prisma/client";
// import { verifyToken, isAdminToken, AdminJWTPayload } from "@/lib/auth";

// const prisma = new PrismaClient();

// // Helper to safely extract user ID from token payload (SAME AS BARS API)
// function getUserIdFromPayload(payload: AdminJWTPayload): string | null {
//   // Check both possible field names safely
//   if ("userId" in payload && typeof payload.userId === "string") {
//     return payload.userId;
//   }

//   if ("id" in payload && typeof payload.id === "string") {
//     return payload.id;
//   }

//   return null;
// }

// // Helper function to verify admin token (SAME AS BARS API)
// async function verifyAdminToken(token: string) {
//   try {
//     const payload = verifyToken(token);

//     if (!payload || !isAdminToken(payload)) {
//       console.log("Invalid token or not an admin token");
//       return null;
//     }

//     const userId = getUserIdFromPayload(payload);

//     if (!userId) {
//       console.log("No user ID found in token payload");
//       return null;
//     }

//     const adminUser = await prisma.adminUser.findFirst({
//       where: {
//         id: userId,
//         isActive: true,
//       },
//     });

//     return adminUser;
//   } catch (error) {
//     console.error("Token verification error:", error);
//     return null;
//   }
// }

// export async function GET(request: NextRequest) {
//   try {
//     console.log("🔐 HISTORY API - Starting history fetch...");

//     const token = request.headers.get("authorization")?.replace("Bearer ", "");

//     console.log("🔐 HISTORY API - Token verification:");
//     console.log("Token received:", token);

//     if (!token) {
//       console.log("❌ HISTORY API - No token provided");
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // FIXED: Use the SAME authentication as your bars API
//     console.log("🔐 HISTORY API - Verifying token with auth library...");
//     const adminUser = await verifyAdminToken(token);

//     console.log("🔐 HISTORY API - Admin user found:", !!adminUser);
//     if (adminUser) {
//       console.log("🔐 HISTORY API - Admin user ID:", adminUser.id);
//       console.log("🔐 HISTORY API - Admin user email:", adminUser.email);
//     } else {
//       console.log("❌ HISTORY API - No admin user found with this token");
//       return NextResponse.json(
//         { error: "Invalid or expired token" },
//         { status: 401 }
//       );
//     }

//     console.log(
//       "✅ HISTORY API - Token verified successfully for user:",
//       adminUser.email
//     );

//     const { searchParams } = new URL(request.url);
//     const limit = parseInt(searchParams.get("limit") || "50");
//     const page = parseInt(searchParams.get("page") || "1");
//     const skip = (page - 1) * limit;

//     console.log(
//       `📋 HISTORY API - Fetching history for user ${adminUser.id}, page ${page}, limit ${limit}`
//     );

//     try {
//       // Check if BarImport model exists
//       const [imports, total] = await Promise.all([
//         prisma.barImport.findMany({
//           where: {
//             importedBy: adminUser.id,
//           },
//           orderBy: {
//             createdAt: "desc",
//           },
//           skip,
//           take: limit,
//           select: {
//             id: true,
//             fileName: true,
//             fileSize: true,
//             totalRows: true,
//             importedRows: true,
//             failedRows: true,
//             status: true,
//             createdAt: true,
//             updatedAt: true,
//           },
//         }),
//         prisma.barImport.count({
//           where: {
//             importedBy: adminUser.id,
//           },
//         }),
//       ]);

//       console.log(
//         `✅ HISTORY API - Found ${imports.length} import records, total: ${total}`
//       );

//       return NextResponse.json({
//         imports,
//         pagination: {
//           page,
//           limit,
//           total,
//           pages: Math.ceil(total / limit),
//         },
//       });
//     } catch (error) {
//       // If BarImport model doesn't exist, return empty array
//       console.log(
//         "⚠️ HISTORY API - BarImport model not available, returning empty history..."
//       );
//       console.log("Error details:", error);

//       return NextResponse.json({
//         imports: [],
//         pagination: {
//           page: 1,
//           limit: 50,
//           total: 0,
//           pages: 0,
//         },
//       });
//     }
//   } catch (error) {
//     console.error("❌ HISTORY API - Import history error:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper function to verify admin token - SIMPLIFIED like your import route
async function verifyAdminToken(token: string) {
  try {
    // Simple token check - same as your import route
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
    console.log("🔐 HISTORY API - Starting history fetch...");

    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      console.log("❌ HISTORY API - No token provided");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await verifyAdminToken(token);

    if (!adminUser) {
      console.log("❌ HISTORY API - No admin user found with this token");
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    console.log("✅ HISTORY API - Token verified for user:", adminUser.email);

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    console.log(
      `📋 HISTORY API - Fetching history for user ${adminUser.id}, page ${page}, limit ${limit}`
    );

    try {
      // Check if BarImport model exists
      const imports = await prisma.barImport.findMany({
        where: {
          importedBy: adminUser.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      });

      const total = await prisma.barImport.count({
        where: {
          importedBy: adminUser.id,
        },
      });

      console.log(
        `✅ HISTORY API - Found ${imports.length} import records, total: ${total}`
      );

      return NextResponse.json({
        imports,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      // If BarImport model doesn't exist, return empty array
      console.log(
        "⚠️ HISTORY API - BarImport model not available, returning empty history..."
      );
      console.log("Error details:", error);

      return NextResponse.json({
        imports: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          pages: 0,
        },
      });
    }
  } catch (error) {
    console.error("❌ HISTORY API - Import history error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
