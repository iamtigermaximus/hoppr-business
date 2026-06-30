// GET /api/auth/bar/[barId]/notifications
// Returns push notification stats + recent history for a bar.
//
// Query params:
//   days (default 30) — lookback window
//   limit (default 20) — history items to return

import { NextRequest, NextResponse } from "next/server";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";
import { prisma } from "@/lib/database";

// ---- Types ----

interface NotificationStats {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalConverted: number;
  totalFailed: number;
  openRate: number; // 0-100
  conversionRate: number; // 0-100 (converted / sent)
  byType: {
    type: string;
    sent: number;
    opened: number;
    converted: number;
  }[];
}

interface NotificationHistoryItem {
  id: string;
  type: string;
  title: string;
  body: string;
  status: string;
  contentId: string | null;
  sentAt: string;
  openedAt: string | null;
}

interface NotificationResponse {
  success: boolean;
  bar: { name: string };
  period: { days: number; label: string };
  stats: NotificationStats;
  history: NotificationHistoryItem[];
}

// ---- Route handler ----

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
): Promise<NextResponse> {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isBarStaffToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { barId } = await params;
    if (payload.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const days = Math.min(Math.max(parseInt(url.searchParams.get("days") || "30"), 1), 90);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);

    const bar = await prisma.bar.findUnique({
      where: { id: barId },
      select: { name: true },
    });
    if (!bar) {
      return NextResponse.json({ error: "Bar not found" }, { status: 404 });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // All notification logs for this bar in the period
    const logs = await prisma.notificationLog.findMany({
      where: {
        contentBarId: barId,
        sentAt: { gte: startDate },
      },
      orderBy: { sentAt: "desc" },
    });

    // Aggregate by type
    const typeMap = new Map<string, { sent: number; opened: number; converted: number }>();
    for (const log of logs) {
      const t = typeMap.get(log.type) || { sent: 0, opened: 0, converted: 0 };
      t.sent++;
      if (log.status === "opened" || log.status === "converted") t.opened++;
      if (log.status === "converted") t.converted++;
      typeMap.set(log.type, t);
    }

    const totalSent = logs.length;
    const totalDelivered = logs.filter((l) => l.status !== "failed" && l.status !== "sent").length;
    const totalOpened = logs.filter((l) => l.status === "opened" || l.status === "converted").length;
    const totalConverted = logs.filter((l) => l.status === "converted").length;
    const totalFailed = logs.filter((l) => l.status === "failed").length;

    const stats: NotificationStats = {
      totalSent,
      totalDelivered,
      totalOpened,
      totalConverted,
      totalFailed,
      openRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0,
      conversionRate: totalSent > 0 ? Math.round((totalConverted / totalSent) * 100) : 0,
      byType: Array.from(typeMap.entries()).map(([type, data]) => ({
        type,
        ...data,
      })),
    };

    // Recent history (limited)
    const recentLogs = logs.slice(0, limit);
    const history: NotificationHistoryItem[] = recentLogs.map((l) => ({
      id: l.id,
      type: l.type,
      title: l.title,
      body: l.body,
      status: l.status,
      contentId: l.contentId,
      sentAt: l.sentAt.toISOString(),
      openedAt: l.openedAt?.toISOString() || null,
    }));

    const result: NotificationResponse = {
      success: true,
      bar: { name: bar.name },
      period: {
        days,
        label: days === 7 ? "Last 7 days" : days === 30 ? "Last 30 days" : `Last ${days} days`,
      },
      stats,
      history,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Notification stats API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch notification stats" },
      { status: 500 },
    );
  }
}
