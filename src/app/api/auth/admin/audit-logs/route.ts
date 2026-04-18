// Route: GET /api/auth/admin/audit-logs
// Description: Get recent audit logs for admin activities
// Query params: limit (number, default 50)

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verify } from "jsonwebtoken";
import { AuditLogsResponse, AuditLog } from "@/types/admin-analytics";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verify(token, JWT_SECRET) as { role: string };

    if (decoded.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const auditLogs = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        admin: { select: { id: true, name: true, email: true } }, // FIXED: Added id to select
        bar: { select: { id: true, name: true } },
      },
    });

    const formattedLogs: AuditLog[] = auditLogs.map((log) => ({
      id: log.id,
      adminId: log.adminId,
      barId: log.barId,
      action: log.action,
      resource: log.resource,
      details: log.details as Record<string, unknown> | null,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
      admin: log.admin
        ? { id: log.admin.id, name: log.admin.name, email: log.admin.email }
        : null,
      bar: log.bar ? { id: log.bar.id, name: log.bar.name } : null,
    }));

    const response: AuditLogsResponse = {
      success: true,
      logs: formattedLogs,
      count: formattedLogs.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Audit logs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
