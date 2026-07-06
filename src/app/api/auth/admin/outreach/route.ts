// GET  /api/auth/admin/outreach — list bars grouped by outreach status (kanban)
// POST /api/auth/admin/outreach — log a new outreach contact

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { authService } from "@/services/auth-service";
import { handleApiError } from "@/lib/api-error";

// ---- Types ----

interface OutreachBar {
  id: string;
  name: string;
  type: string;
  cityName: string | null;
  district: string | null;
  status: string;
  qualityScore: number | null;
  performanceTier: string | null;
  latestOutreach: {
    id: string;
    method: string;
    status: string;
    notes: string | null;
    followUpAt: string | null;
    createdAt: string;
    userName: string | null;
  } | null;
}

interface KanbanResponse {
  success: boolean;
  columns: {
    status: string;
    label: string;
    bars: OutreachBar[];
  }[];
}

// ---- GET ----

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const authResult = await authService.validateToken(token);

    if (authResult.type !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Get all bars that are outreach targets (not yet VERIFIED/SUSPENDED)
    const bars = await prisma.bar.findMany({
      where: {
        status: { in: ["UNCLAIMED", "CLAIMED"] },
      },
      select: {
        id: true,
        name: true,
        type: true,
        cityName: true,
        district: true,
        status: true,
        qualityScore: true,
        performanceTier: true,
        outreachLogs: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            method: true,
            status: true,
            notes: true,
            followUpAt: true,
            createdAt: true,
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Define kanban columns
    const columnDefs = [
      { status: "NOT_CONTACTED", label: "Not Contacted" },
      { status: "EMAILED", label: "Emailed" },
      { status: "CALLED", label: "Called" },
      { status: "IN_DISCUSSION", label: "In Discussion" },
    ];

    // Group bars by their latest outreach status
    const columns: KanbanResponse["columns"] = columnDefs.map((col) => ({
      status: col.status,
      label: col.label,
      bars: [],
    }));

    for (const bar of bars) {
      const latestLog = bar.outreachLogs[0] ?? null;
      const outreachStatus = latestLog?.status ?? "NOT_CONTACTED";

      const column = columns.find((c) => c.status === outreachStatus);
      if (column) {
        column.bars.push({
          id: bar.id,
          name: bar.name,
          type: bar.type,
          cityName: bar.cityName,
          district: bar.district,
          status: bar.status,
          qualityScore: bar.qualityScore,
          performanceTier: bar.performanceTier,
          latestOutreach: latestLog
            ? {
                id: latestLog.id,
                method: latestLog.method,
                status: latestLog.status,
                notes: latestLog.notes,
                followUpAt: latestLog.followUpAt?.toISOString() ?? null,
                createdAt: latestLog.createdAt.toISOString(),
                userName: latestLog.user?.name ?? null,
              }
            : null,
        });
      }
    }

    return NextResponse.json({ success: true, columns });
  } catch (error) {
    return handleApiError(error, "Fetch outreach error:");
  }
}

// ---- POST ----

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const authResult = await authService.validateToken(token);

    if (authResult.type !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { barId, method, status, notes, followUpAt } = await request.json();

    if (!barId || !method || !status) {
      return NextResponse.json(
        { error: "barId, method, and status are required" },
        { status: 400 }
      );
    }

    const validMethods = ["EMAIL", "PHONE_CALL", "IN_PERSON", "SOCIAL_MEDIA"];
    const validStatuses = [
      "NOT_CONTACTED",
      "EMAILED",
      "CALLED",
      "IN_DISCUSSION",
      "CLAIMED",
      "DECLINED",
    ];

    if (!validMethods.includes(method)) {
      return NextResponse.json(
        { error: `Invalid method. Must be: ${validMethods.join(", ")}` },
        { status: 400 }
      );
    }

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // Check bar exists
    const bar = await prisma.bar.findUnique({
      where: { id: barId },
      select: { id: true, name: true },
    });

    if (!bar) {
      return NextResponse.json({ error: "Bar not found" }, { status: 404 });
    }

    // Create outreach log
    const outreach = await prisma.outreachLog.create({
      data: {
        barId,
        userId: authResult.user.id,
        method,
        status,
        notes: notes || null,
        followUpAt: followUpAt ? new Date(followUpAt) : null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        bar: { select: { id: true, name: true } },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: authResult.user.id,
        barId,
        action: "OUTREACH_LOG",
        resource: "OutreachLog",
        details: {
          outreachId: outreach.id,
          method,
          status,
          notes: notes || null,
          followUpAt: followUpAt || null,
        },
      },
    });

    return NextResponse.json({
      success: true,
      outreach: {
        id: outreach.id,
        barId: outreach.barId,
        method: outreach.method,
        status: outreach.status,
        notes: outreach.notes,
        followUpAt: outreach.followUpAt?.toISOString() ?? null,
        createdAt: outreach.createdAt.toISOString(),
        user: {
          id: outreach.user.id,
          name: outreach.user.name,
        },
        bar: {
          id: outreach.bar.id,
          name: outreach.bar.name,
        },
      },
    });
  } catch (error) {
    return handleApiError(error, "Create outreach error:");
  }
}
