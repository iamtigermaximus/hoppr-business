/**
 * POST /api/auth/admin/outreach/send
 *
 * Sends an outreach email to a bar contact via Resend. Accepts a template
 * name (with optional subject/body overrides) and recipient email. Logs the
 * send to OutreachLog with email tracking fields. Automatically advances
 * the outreach pipeline stage based on the template used.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { authService } from "@/services/auth-service";
import { handleApiError } from "@/lib/api-error";
import { Resend } from "resend";
import {
  getTemplate,
  listTemplates,
  type OutreachTemplate,
  type BarContext,
} from "@/lib/outreach-emails";

const FROM = "Hoppr Team <onboarding@resend.dev>";

export async function POST(request: NextRequest) {
  try {
    // Auth
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const authResult = await authService.validateToken(token);
    if (authResult.type !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const {
      barId,
      template,
      to,
      subject: customSubject,
      body: customBody,
    } = body as {
      barId: string;
      template: OutreachTemplate;
      to: string;
      subject?: string;
      body?: string;
    };

    if (!barId || !template || !to) {
      return NextResponse.json(
        { error: "barId, template, and to (recipient email) are required" },
        { status: 400 },
      );
    }

    const validTemplates = listTemplates().map((t) => t.value);
    if (!validTemplates.includes(template)) {
      return NextResponse.json(
        { error: `Invalid template. Must be: ${validTemplates.join(", ")}` },
        { status: 400 },
      );
    }

    // Fetch bar data for template context
    const bar = await prisma.bar.findUnique({
      where: { id: barId },
      select: { id: true, name: true, type: true, district: true, cityName: true },
    });

    if (!bar) {
      return NextResponse.json({ error: "Bar not found" }, { status: 404 });
    }

    // Render template
    const tpl = getTemplate(template);
    if (!tpl) {
      return NextResponse.json({ error: "Template not found" }, { status: 400 });
    }

    const barContext: BarContext = {
      name: bar.name,
      type: bar.type,
      district: bar.district,
      cityName: bar.cityName,
    };

    const subject = customSubject || tpl.subject(barContext);
    const html = customBody || tpl.body(barContext);

    // Send via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    let resendEmailId: string | null = null;

    try {
      const { data, error } = await resend.emails.send({
        from: FROM,
        to,
        subject,
        html: wrapHtml(subject, html),
        tags: [{ name: "category", value: "outreach" }, { name: "template", value: template }],
      });

      if (error) {
        return NextResponse.json(
          { error: `Resend send failed: ${error.message}` },
          { status: 502 },
        );
      }

      resendEmailId = data?.id ?? null;
    } catch (sendErr) {
      return NextResponse.json(
        { error: `Resend send failed: ${sendErr instanceof Error ? sendErr.message : "Unknown"}` },
        { status: 502 },
      );
    }

    // Auto-advance pipeline stage based on template
    const newStatus = tpl.defaultStage;

    // Log to OutreachLog
    const outreach = await prisma.outreachLog.create({
      data: {
        barId,
        method: "EMAIL",
        status: newStatus as any,
        notes: `Sent "${tpl.label}" email to ${to}`,
        emailSubject: subject,
        emailBody: html,
        emailTemplate: template,
        resendEmailId,
      },
      include: {
        bar: { select: { id: true, name: true } },
      },
    });

    // Audit log (non-blocking)
    prisma.auditLog
      .create({
        data: {
          userId: authResult.user.id,
          barId,
          action: "OUTREACH_EMAIL_SENT",
          resource: "OutreachLog",
          details: {
            outreachId: outreach.id,
            template,
            to,
            status: newStatus,
            resendEmailId,
          },
        },
      })
      .catch((e) => console.error("Audit log write failed:", e.message));

    return NextResponse.json({
      success: true,
      outreach: {
        id: outreach.id,
        barId: outreach.barId,
        method: "EMAIL",
        status: newStatus,
        emailTemplate: template,
        resendEmailId,
        createdAt: outreach.createdAt.toISOString(),
        bar: { id: outreach.bar.id, name: outreach.bar.name },
      },
    });
  } catch (error) {
    return handleApiError(error, "Outreach send email error:");
  }
}

/** Wrap the body in a consistent branded HTML template */
function wrapHtml(subject: string, body: string): string {
  return `<div style="max-width:560px;margin:0 auto;font-family:system-ui,-apple-system,sans-serif;color:#1f2937">
  <div style="background:#7c3aed;padding:24px 32px;border-radius:8px 8px 0 0">
    <h1 style="color:white;font-size:20px;margin:0;font-weight:700">Hoppr</h1>
  </div>
  <div style="padding:24px 32px;background:white;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;line-height:1.6;font-size:15px">
    ${body}
  </div>
  <div style="text-align:center;margin-top:16px;font-size:11px;color:#9ca3af">
    Hoppr &mdash; Discover Finland's best bars. Sent via outreach pipeline.
  </div>
</div>`;
}
