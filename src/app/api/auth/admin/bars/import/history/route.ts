import { NextRequest, NextResponse } from "next/server";
import { verifyAuthHeader, isAdminToken } from "@/lib/auth";
import { prisma } from "@/lib/database";
import { handleApiError } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isAdminToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const statusFilter = searchParams.get("status") || undefined;
    const sortBy = (searchParams.get("sortBy") || "createdAt") as
      | "createdAt"
      | "fileName"
      | "totalRows"
      | "importedRows";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "25")),
    );
    const skip = (page - 1) * limit;

    // Build where — search matches fileName, status filters by import status
    const where: Record<string, unknown> = {};
    if (search) {
      where.fileName = { contains: search, mode: "insensitive" };
    }
    if (
      statusFilter &&
      ["COMPLETED", "PARTIAL", "FAILED", "PENDING"].includes(statusFilter)
    ) {
      where.status = statusFilter;
    }

    // Sort — only allow known columns
    const validSortColumns = [
      "createdAt",
      "fileName",
      "totalRows",
      "importedRows",
    ];
    const orderColumn = validSortColumns.includes(sortBy)
      ? sortBy
      : "createdAt";
    const orderDirection = sortOrder === "asc" ? "asc" : "desc";

    try {
      const [imports, total] = await Promise.all([
        prisma.barImport.findMany({
          where,
          orderBy: { [orderColumn]: orderDirection },
          skip,
          take: limit,
        }),
        prisma.barImport.count({ where }),
      ]);

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
      console.error(
        "⚠️ HISTORY API - Failed to query barImport table. The bar_imports table may not exist.",
      );
      console.error("Run: npx prisma db push");
      console.error("Error details:", error);

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
    return handleApiError(error, "❌ HISTORY API - Import history error:");
  }
}
