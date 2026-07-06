// Route: GET /api/auth/admin/audit-logs
// Description: Get recent audit logs for admin activities
// Query params: limit (number, default 50)

import { NextRequest, NextResponse } from "next/server";
import { verifyAuthHeader, isAdminToken } from "@/lib/auth";
import { AuditLogsResponse, AuditLog } from "@/types/admin-analytics";
import { prisma } from "@/lib/database";
import { handleApiError } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isAdminToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const auditLogs = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        bar: { select: { id: true, name: true } },
      },
    });

    const formattedLogs: AuditLog[] = auditLogs.map((log) => ({
      id: log.id,
      userId: log.userId,
      barId: log.barId,
      action: log.action,
      resource: log.resource,
      details: log.details as Record<string, unknown> | null,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
      admin: log.user
        ? { id: log.user.id, name: log.user.name ?? "", email: log.user.email }
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
    return handleApiError(error, "Audit logs error:");
  }
}
