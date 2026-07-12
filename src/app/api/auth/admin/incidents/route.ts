// GET  /api/auth/admin/incidents          — recent unresolved incidents
// GET  /api/auth/admin/incidents?barId=X  — incidents for a specific bar
// POST /api/auth/admin/incidents/resolve   — mark incidents as resolved
// GET  /api/auth/admin/incidents/summary   — counts by severity + type

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
    const barId = searchParams.get("barId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const includeResolved = searchParams.get("includeResolved") === "true";

    const where: any = {};
    if (barId) where.barId = barId;
    if (!includeResolved) where.resolved = false;

    const incidents = await prisma.barIncident.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ incidents });
  } catch (error) {
    return handleApiError(error, "Incidents fetch");
  }
}

// POST — mark incidents as resolved
export async function POST(request: NextRequest) {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isAdminToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ids } = body as { ids: string[] };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids array is required" }, { status: 400 });
    }

    const result = await prisma.barIncident.updateMany({
      where: { id: { in: ids }, resolved: false },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: payload.userId || null,
      },
    });

    return NextResponse.json({ resolved: result.count });
  } catch (error) {
    return handleApiError(error, "Incidents resolve");
  }
}
