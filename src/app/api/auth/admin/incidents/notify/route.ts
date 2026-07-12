// POST /api/auth/admin/incidents/notify
// Sends a templated email to a bar's staff informing them about an issue.
// Body: { barId, issueSummary }

import { NextRequest, NextResponse } from "next/server";
import { verifyAuthHeader, isAdminToken } from "@/lib/auth";
import { prisma } from "@/lib/database";
import { handleApiError } from "@/lib/api-error";
import { notifyBarAboutIncident } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isAdminToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { barId, issueSummary } = body as { barId: string; issueSummary: string };

    if (!barId || !issueSummary) {
      return NextResponse.json(
        { error: "barId and issueSummary are required" },
        { status: 400 },
      );
    }

    // Find active staff for this bar
    const staff = await prisma.barStaff.findMany({
      where: { barId, isActive: true },
      select: { email: true, name: true },
    });

    if (staff.length === 0) {
      return NextResponse.json(
        { error: "No active staff found for this bar" },
        { status: 404 },
      );
    }

    // Find bar name
    const bar = await prisma.bar.findUnique({
      where: { id: barId },
      select: { name: true },
    });

    const barName = bar?.name || "Your bar";

    // Send to each staff member
    const results: { email: string; sent: boolean; error?: string }[] = [];
    for (const member of staff) {
      try {
        await notifyBarAboutIncident({
          to: member.email,
          barName,
          issueSummary,
        });
        results.push({ email: member.email, sent: true });
      } catch (err) {
        results.push({
          email: member.email,
          sent: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      notified: results.filter((r) => r.sent).length,
      total: staff.length,
      results,
    });
  } catch (error) {
    return handleApiError(error, "Notify bar");
  }
}
