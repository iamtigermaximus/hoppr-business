import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM = "Hoppr Business <onboarding@resend.dev>";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
const SUPPORT_EMAIL = "support@hoppr.fi";

export async function sendInviteEmail(params: {
  to: string;
  name: string;
  barName: string;
  token: string;
}) {
  const inviteUrl = `${BASE_URL}/bar/invite?token=${params.token}`;

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to: params.to,
    subject: `You're invited to manage ${params.barName} on Hoppr`,
    html: `
      <div style="max-width:560px;margin:0 auto;font-family:system-ui,sans-serif">
        <h1 style="color:#7c3aed">Hoppr</h1>
        <h2>You've been invited, ${params.name}!</h2>
        <p>You've been invited to manage <strong>${params.barName}</strong> on Hoppr — the platform for Finland's drinking establishments.</p>
        <p>With your Hoppr dashboard, you can:</p>
        <ul>
          <li>Create and manage promotions</li>
          <li>Post events and track attendees</li>
          <li>Offer VIP passes and scan entries</li>
          <li>View analytics and insights</li>
        </ul>
        <div style="text-align:center;margin:32px 0">
          <a href="${inviteUrl}" style="background:#7c3aed;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">
            Accept Invitation
          </a>
        </div>
        <p style="color:#6b7280;font-size:14px">This link expires in 7 days.</p>
        <hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0" />
        <p style="color:#9ca3af;font-size:12px">If you weren't expecting this invitation, you can ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    console.error("Failed to send invite email:", error);
    throw new Error("Failed to send invite email");
  }

  return data;
}

export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
  barName: string;
  barId: string;
}) {
  const loginUrl = `${BASE_URL}/bar/login`;
  const dashboardUrl = `${BASE_URL}/bar/${params.barId}/dashboard`;

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to: params.to,
    subject: `Welcome to Hoppr — start managing ${params.barName}`,
    html: `
      <div style="max-width:560px;margin:0 auto;font-family:system-ui,sans-serif">
        <h1 style="color:#7c3aed">Hoppr</h1>
        <h2>Welcome aboard, ${params.name}!</h2>
        <p>Your account for <strong>${params.barName}</strong> has been approved. You can now access your dashboard.</p>

        <h3>Getting Started Guide</h3>
        <ol>
          <li><strong>Complete your profile</strong> — Add your bar's logo, photos, hours, and amenities</li>
          <li><strong>Create your first promotion</strong> — Happy hours, student discounts, or drink specials</li>
          <li><strong>Post events</strong> — Let customers know what's happening</li>
          <li><strong>Set up VIP passes</strong> — Skip-line passes or drink packages</li>
          <li><strong>Check your analytics</strong> — See who's viewing and engaging with your bar</li>
        </ol>

        <div style="text-align:center;margin:32px 0">
          <a href="${dashboardUrl}" style="background:#7c3aed;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">
            Go to Dashboard
          </a>
        </div>
        <p style="color:#6b7280;font-size:14px">Log in anytime at <a href="${loginUrl}">${loginUrl}</a></p>
        <p style="color:#6b7280;font-size:14px">Need help? Reply to this email or contact <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
        <hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0" />
        <p style="color:#9ca3af;font-size:12px">Hoppr — Discover. Crawl. Connect.</p>
      </div>
    `,
  });

  if (error) {
    console.error("Failed to send welcome email:", error);
    throw new Error("Failed to send welcome email");
  }

  return data;
}

export async function sendClaimRejectedEmail(params: {
  to: string;
  name: string;
  barName: string;
  reason?: string;
}) {
  const claimUrl = `${BASE_URL}/claim`;
  const reasonBlock = params.reason
    ? `<div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0">
         <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.05em">Reason</p>
         <p style="margin:0;color:#374151;font-size:14px">${params.reason}</p>
       </div>`
    : "";

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to: params.to,
    subject: `Update on your claim for ${params.barName}`,
    html: `
      <div style="max-width:560px;margin:0 auto;font-family:system-ui,sans-serif">
        <h1 style="color:#7c3aed">Hoppr</h1>
        <h2>Claim Update</h2>
        <p>Hi ${params.name},</p>
        <p>Your claim for <strong>${params.barName}</strong> was not approved this time.</p>
        ${reasonBlock}
        <p style="color:#374151;font-size:14px;line-height:1.5">Here's what you can do next:</p>
        <ul style="color:#374151;font-size:14px;line-height:1.6">
          <li>Make sure your bar information is complete and accurate</li>
          <li>Provide documentation that confirms your association with the bar (business license, employment contract, etc.)</li>
          <li>Reach out to us at <a href="mailto:${SUPPORT_EMAIL}" style="color:#7c3aed">${SUPPORT_EMAIL}</a> if you believe this was a mistake or need guidance</li>
        </ul>
        <div style="text-align:center;margin:32px 0">
          <a href="${claimUrl}" style="background:#7c3aed;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">
            Submit a New Claim
          </a>
        </div>
        <p style="color:#6b7280;font-size:14px">You're welcome to re-submit with updated information anytime.</p>
        <hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0" />
        <p style="color:#9ca3af;font-size:12px">Hoppr — Discover. Crawl. Connect.</p>
      </div>
    `,
  });

  if (error) {
    console.error("Failed to send claim rejection email:", error);
    throw new Error("Failed to send claim rejection email");
  }

  return data;
}

/** Internal admin alert — fired when AI credits drop below threshold.
 *  Only visible to Hoppr admins, never to bar owners. */
export async function sendCreditAlert(params: {
  provider: string;
  remaining: number;
  threshold: number;
  totalCredits: number;
  to: string;
}) {
  const usagePct = Math.round(((params.totalCredits - params.remaining) / params.totalCredits) * 100);

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to: params.to,
    subject: `⚠️ ${params.provider} credits low — $${params.remaining.toFixed(2)} remaining`,
    html: `
      <div style="max-width:560px;margin:0 auto;font-family:system-ui,sans-serif">
        <h1 style="color:#7c3aed">Hoppr Admin</h1>
        <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:16px;margin:16px 0">
          <h2 style="margin:0 0 8px;color:#92400e">⚠️ Credit Alert</h2>
          <p style="margin:0;color:#78350f">
            <strong>${params.provider}</strong> API credits are running low.
          </p>
        </div>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280">Total purchased</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:600">$${params.totalCredits.toFixed(2)}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280">Remaining</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#dc2626">$${params.remaining.toFixed(2)}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280">Alert threshold</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">$${params.threshold.toFixed(2)}</td></tr>
          <tr><td style="padding:8px;color:#6b7280">Used</td><td style="padding:8px;font-weight:600">${usagePct}%</td></tr>
        </table>
        <p style="color:#6b7280;font-size:14px">
          AI-powered features (promotion text generation, image generation) will stop working when credits reach $0.00.
          Bar owners will see fallback templates instead of AI-generated content.
        </p>
        <a href="${BASE_URL}/admin/credits" style="display:inline-block;padding:10px 20px;background:#7c3aed;color:white;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">
          View Credit Dashboard
        </a>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px">
          This is an internal admin notification. Bar owners do not see credit status.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Failed to send credit alert:", error);
    throw new Error("Failed to send credit alert");
  }

  return data;
}

/** Internal admin alert — fired when a bar has 3+ content creation errors
 *  in one hour. Helps operators catch broken bars before they complain. */
export async function sendIncidentAlert(params: {
  barId: string;
  barName: string;
  incidentCount: number;
  windowMinutes: number;
}) {
  const to = process.env.ADMIN_EMAIL || SUPPORT_EMAIL;
  const dashboardUrl = `${BASE_URL}/admin/bars/${params.barId}`;

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: `⚠️ ${params.barName} — ${params.incidentCount} content creation errors in ${params.windowMinutes}min`,
    html: `
      <div style="max-width:560px;margin:0 auto;font-family:system-ui,sans-serif">
        <h1 style="color:#7c3aed">Hoppr Admin</h1>
        <div style="background:#fee2e2;border:1px solid #ef4444;border-radius:8px;padding:16px;margin:16px 0">
          <h2 style="margin:0 0 8px;color:#991b1b">Content Creation Issues</h2>
          <p style="margin:0;color:#7f1d1d">
            <strong>${params.barName}</strong> has had <strong>${params.incidentCount} errors</strong>
            in the last ${params.windowMinutes} minutes while trying to generate content.
          </p>
        </div>
        <p style="color:#374151;font-size:14px;line-height:1.5">
          This usually means the AI generation pipeline (DeepSeek or FLUX) is failing for this bar.
          Possible causes: malformed bar profile data, prompt that triggers compliance filters,
          API key issues, or an upstream service outage.
        </p>
        <a href="${dashboardUrl}" style="display:inline-block;padding:10px 20px;background:#7c3aed;color:white;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">
          View Bar Dashboard
        </a>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px">
          This is an automated alert from the Hoppr incident monitoring system.
          You'll receive at most one alert per bar per hour.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Failed to send incident alert:", error);
    // Don't throw — incident alert failure shouldn't cascade
  }

  return data;
}

/** Bar-facing email — sent when an admin clicks "Notify Bar" on an incident.
 *  Reassures the bar that the issue is known and being looked at. */
export async function notifyBarAboutIncident(params: {
  to: string;
  barName: string;
  issueSummary: string;
}) {
  const dashboardUrl = `${BASE_URL}/bar/login`;

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to: params.to,
    subject: `Quick update about your Hoppr content — ${params.barName}`,
    html: `
      <div style="max-width:560px;margin:0 auto;font-family:system-ui,sans-serif">
        <h1 style="color:#7c3aed">Hoppr</h1>
        <p>Hi from the Hoppr team,</p>
        <p>We noticed that <strong>${params.barName}</strong> had a small hiccup while generating content:</p>
        <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:0;color:#374151;font-size:14px">${params.issueSummary}</p>
        </div>
        <p style="color:#374151;font-size:14px;line-height:1.5">
          ${params.issueSummary.includes("back") || params.issueSummary.includes("resolved")
            ? "The issue has been resolved. You should be able to generate content normally now — give it another try when you have a moment."
            : "We're looking into it and will follow up if needed. In the meantime, you can still use the template-based options to create promotions — they'll appear the same way to your customers."}
        </p>
        <a href="${dashboardUrl}" style="display:inline-block;padding:10px 20px;background:#7c3aed;color:white;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">
          Open Dashboard
        </a>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px">
          This is a one-time update from the Hoppr team. Reply directly to this email if you have questions.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Failed to send bar notification:", error);
    throw new Error("Failed to send bar notification");
  }

  return data;
}
