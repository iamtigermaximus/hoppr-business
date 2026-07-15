// GET  /api/auth/admin/outreach — list outreach-target bars with search, filters, sort, pagination
// POST /api/auth/admin/outreach — log a new outreach contact
//
// Query params (GET):
//   search         — text search across name, city, district
//   city           — exact city name filter
//   type           — bar type filter (PUB, CLUB, etc.)
//   outreachStatus — NOT_CONTACTED | EMAILED | CALLED | IN_DISCUSSION
//   tier           — performance tier filter
//   sort           — name (default) | qualityScore | lastContacted | recentlyAdded
//   page           — page number (default 1)
//   limit          — items per page (default 25, max 100)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { authService } from "@/services/auth-service";
import { handleApiError } from "@/lib/api-error";
import { Prisma } from "@prisma/client";

// ---- Types ----

interface OutreachBar {
  id: string;
  name: string;
  type: string;
  cityName: string | null;
  district: string | null;
  barStatus: string;
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
    emailTemplate?: string | null;
    emailSubject?: string | null;
    emailOpenedAt?: string | null;
    emailClickedAt?: string | null;
  } | null;
}

interface OutreachResponse {
  success: boolean;
  view: string;
  bars: OutreachBar[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: {
    cities: string[];
    types: string[];
  };
}

interface KanbanColumn {
  status: string;
  label: string;
  bars: OutreachBar[];
}

// Column definitions (used by both table and kanban views)
const COLUMN_DEFS = [
  { status: "NOT_CONTACTED", label: "Not Contacted" },
  { status: "EMAILED", label: "Emailed" },
  { status: "CALLED", label: "Called" },
  { status: "IN_DISCUSSION", label: "In Discussion" },
] as const;

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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const city = searchParams.get("city") || "";
    const type = searchParams.get("type") || "";
    const outreachStatus = searchParams.get("outreachStatus") || "";
    const tier = searchParams.get("tier") || "";
    const sort = searchParams.get("sort") || "name";
    const view = searchParams.get("view") || "table"; // "table" | "kanban"
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25")));
    const skip = (page - 1) * limit;

    // ---- Build where clause using AND composition ----

    const conditions: Prisma.BarWhereInput[] = [
      { status: { in: ["UNCLAIMED", "CLAIMED", "VERIFIED"] } },
    ];

    // Text search
    if (search.trim()) {
      const term = search.trim();
      conditions.push({
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { cityName: { contains: term, mode: "insensitive" } },
          { district: { contains: term, mode: "insensitive" } },
        ],
      });
    }

    if (city) {
      conditions.push({ cityName: city });
    }

    if (type) {
      conditions.push({ type: type as any });
    }

    if (tier) {
      conditions.push({ performanceTier: tier as any });
    }

    // Outreach status filter — "NOT_CONTACTED" means no outreach logs
    if (outreachStatus === "NOT_CONTACTED") {
      conditions.push({ outreachLogs: { none: {} } });
    } else if (outreachStatus) {
      // Find bar IDs whose latest outreach log has this status
      const matchingBars = await prisma.$queryRaw<{ bar_id: string }[]>`
        SELECT bar_id FROM (
          SELECT DISTINCT ON (bar_id) bar_id, status
          FROM outreach_logs
          ORDER BY bar_id, created_at DESC
        ) latest
        WHERE status = ${outreachStatus}::"OutreachStatus"
      `;
      const barIds = matchingBars.map((r) => r.bar_id);

      if (barIds.length === 0) {
        // No bars match this outreach status — return empty
        return NextResponse.json({
          success: true,
          bars: [],
          pagination: { page, limit, total: 0, pages: 0 },
          filters: { cities: [], types: [] },
        });
      }

      conditions.push({ id: { in: barIds } });
    }

    const where: Prisma.BarWhereInput = { AND: conditions };

    // ---- Sort ----

    let orderBy: Record<string, string>; // Prisma.BarOrderByWithRelationInput
    switch (sort) {
      case "qualityScore":
        orderBy = { qualityScore: "desc" };
        break;
      case "recentlyAdded":
        orderBy = { createdAt: "desc" };
        break;
      case "lastContacted":
        // Can't sort by relation in Prisma — default to name, we'll sort in code
        orderBy = { name: "asc" };
        break;
      case "name":
      default:
        orderBy = { name: "asc" };
    }

    // ---- Fetch ----

    const barSelect = {
      id: true,
      name: true,
      type: true,
      cityName: true,
      district: true,
      status: true,
      qualityScore: true,
      performanceTier: true,
      outreachLogs: {
        orderBy: { createdAt: "desc" as const },
        take: 1,
        select: {
          id: true,
          method: true,
          status: true,
          notes: true,
          followUpAt: true,
          createdAt: true,
          emailTemplate: true,
          emailSubject: true,
          emailOpenedAt: true,
          emailClickedAt: true,
          user: { select: { name: true } },
        },
      },
    };

    // ---- Filter options (for dropdowns, fetched once per request) ----

    const [cities, types] = await Promise.all([
      prisma.bar.findMany({
        where: { status: { in: ["UNCLAIMED", "CLAIMED", "VERIFIED"] } },
        select: { cityName: true },
        distinct: ["cityName"],
        orderBy: { cityName: "asc" },
      }),
      prisma.bar.findMany({
        where: { status: { in: ["UNCLAIMED", "CLAIMED", "VERIFIED"] } },
        select: { type: true },
        distinct: ["type"],
        orderBy: { type: "asc" },
      }),
    ]);

    const filterOptions = {
      cities: cities.map((c) => c.cityName).filter(Boolean) as string[],
      types: types.map((t) => t.type),
    };

    // ---- Map helper ----

    const mapBar = (bar: any): OutreachBar => {
      const latestLog = bar.outreachLogs[0] ?? null;
      return {
        id: bar.id,
        name: bar.name,
        type: bar.type,
        cityName: bar.cityName,
        district: bar.district,
        barStatus: bar.status,
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
              emailTemplate: latestLog.emailTemplate ?? null,
              emailSubject: latestLog.emailSubject ?? null,
              emailOpenedAt: latestLog.emailOpenedAt?.toISOString() ?? null,
              emailClickedAt: latestLog.emailClickedAt?.toISOString() ?? null,
            }
          : null,
      };
    };

    // ---- Kanban view ----

    if (view === "kanban") {
      const [bars, total] = await Promise.all([
        prisma.bar.findMany({
          where,
          select: barSelect,
          orderBy,
          skip,
          take: limit,
        }),
        prisma.bar.count({ where }),
      ]);

      const mappedBars = bars.map(mapBar);

      const columns: KanbanColumn[] = COLUMN_DEFS.map((col) => ({
        status: col.status,
        label: col.label,
        bars: mappedBars.filter(
          (b) => (b.latestOutreach?.status ?? "NOT_CONTACTED") === col.status
        ),
      }));

      return NextResponse.json({
        success: true,
        view: "kanban",
        columns,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        filters: filterOptions,
      });
    }

    // ---- Table view (default) ----

    const [bars, total] = await Promise.all([
      prisma.bar.findMany({
        where,
        select: barSelect,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.bar.count({ where }),
    ]);

    const mappedBars = bars.map(mapBar);

    // Post-sort for lastContacted (can't do this in Prisma)
    if (sort === "lastContacted") {
      mappedBars.sort((a, b) => {
        const aDate = a.latestOutreach?.createdAt ? new Date(a.latestOutreach.createdAt).getTime() : 0;
        const bDate = b.latestOutreach?.createdAt ? new Date(b.latestOutreach.createdAt).getTime() : 0;
        return aDate - bDate;
      });
    }

    return NextResponse.json({
      success: true,
      view: "table",
      bars: mappedBars,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filters: filterOptions,
    } satisfies OutreachResponse);
  } catch (error) {
    return handleApiError(error, "Fetch outreach error:");
  }
}

// ---- POST (unchanged, with minor improvements) ----

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

    const bar = await prisma.bar.findUnique({
      where: { id: barId },
      select: { id: true, name: true },
    });

    if (!bar) {
      return NextResponse.json({ error: "Bar not found" }, { status: 404 });
    }

    const outreach = await prisma.outreachLog.create({
      data: {
        barId,
        method,
        status,
        notes: notes || null,
        followUpAt: followUpAt ? new Date(followUpAt) : null,
      },
      include: {
        bar: { select: { id: true, name: true } },
      },
    });

    // Audit log is non-blocking — don't fail the request if it errors
    prisma.auditLog.create({
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
    }).catch((e) => console.error("Audit log write failed:", e.message));

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
          id: authResult.user.id,
          name: authResult.user.name,
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
