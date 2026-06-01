import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

  const { data, error } = await resend.emails.send({
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

  const { data, error } = await resend.emails.send({
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
