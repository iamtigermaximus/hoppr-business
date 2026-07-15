/**
 * Outreach email templates — pre-composed emails for bar acquisition pipeline
 * stages. Each template takes bar data and returns HTML suitable for Resend.
 *
 * Pipeline stages: Lead → Contacted → Negotiating → Signed → Launched
 * Templates:      intro → follow_up → proposal → onboarding →  launch
 */

export type OutreachTemplate = "intro" | "follow_up" | "proposal" | "onboarding" | "launch";

export interface OutreachEmailTemplate {
  template: OutreachTemplate;
  label: string;
  defaultStage: string; // outreach status to set after sending
  subject: (bar: BarContext) => string;
  body: (bar: BarContext) => string;
}

export interface BarContext {
  name: string;
  type: string;
  district: string | null;
  cityName: string | null;
}

// ---- Helpers ----

function typeLabel(t: string): string {
  return (t || "venue").replace(/_/g, " ").toLowerCase();
}

function locationLabel(bar: BarContext): string {
  if (bar.district) return bar.district;
  if (bar.cityName) return bar.cityName;
  return "your area";
}

function signatureBlock(): string {
  return `<p style="margin-top:24px;color:#6b7280;font-size:13px">
Best regards,<br>
<strong>Hoppr Team</strong><br>
<a href="https://hoppr.fi" style="color:#7c3aed">hoppr.fi</a>
</p>`;
}

// ---- Templates ----

export const OUTREACH_TEMPLATES: Record<OutreachTemplate, OutreachEmailTemplate> = {
  intro: {
    template: "intro",
    label: "Cold Intro",
    defaultStage: "EMAILED",
    subject: (b) => `Hoppr: Helping ${locationLabel(b)} bars reach more customers`,
    body: (b) => {
      const loc = locationLabel(b);
      const t = typeLabel(b.type);
      return `<p>Hi there,</p>
<p>I noticed <strong>${b.name}</strong> — a ${t} in ${loc} — isn't on Hoppr yet.</p>
<p>Bars in ${loc} using Hoppr are typically reaching <strong>200–500 new customers per month</strong> through our platform. It's free to list: you just create your profile, add promotions, and customers discover you.</p>
<p>Would you be open to a quick 10-minute call this week to see if it's a fit?</p>
${signatureBlock()}`;
    },
  },

  follow_up: {
    template: "follow_up",
    label: "Follow-up",
    defaultStage: "EMAILED",
    subject: (b) => `Following up on Hoppr for ${b.name}`,
    body: (b) => {
      return `<p>Hi again,</p>
<p>I wanted to follow up on my previous message about getting <strong>${b.name}</strong> listed on Hoppr.</p>
<p>I know bar owners are busy — so I'll keep this short. Setting up a profile takes about <strong>10 minutes</strong>, and once you're live, customers in your area start discovering your venue. No upfront costs, no commitment.</p>
<p>Happy to walk you through it on a quick call if that's easier. Is there a good time this week?</p>
${signatureBlock()}`;
    },
  },

  proposal: {
    template: "proposal",
    label: "Partnership Proposal",
    defaultStage: "IN_DISCUSSION",
    subject: (b) => `Hoppr partnership proposal for ${b.name}`,
    body: (b) => {
      const loc = locationLabel(b);
      return `<p>Hi,</p>
<p>Thanks for your interest in Hoppr. Based on our conversation, here's what a partnership for <strong>${b.name}</strong> would look like:</p>
<p><strong>What you get:</strong></p>
<ul>
  <li>A dedicated venue profile page with your branding, photos, and story</li>
  <li>Ability to create unlimited promotions and events — happy hours, live music, ladies' nights, and more</li>
  <li>Real-time analytics: see how many people view, save, and redeem your offers</li>
  <li>Direct notifications to customers who follow your bar</li>
</ul>
<p><strong>What it costs:</strong> Nothing to get started. Our premium features (boosted listings, VIP passes, ad campaigns) are optional and you only pay when you see results.</p>
<p>I've attached more details — but happy to walk through any questions on a call. What works for you this week?</p>
${signatureBlock()}`;
    },
  },

  onboarding: {
    template: "onboarding",
    label: "Welcome / Onboarding",
    defaultStage: "IN_DISCUSSION",
    subject: (b) => `Welcome to Hoppr — here's how to get started, ${b.name}`,
    body: (b) => {
      return `<p>Hi,</p>
<p>Welcome to Hoppr! We're excited to have <strong>${b.name}</strong> on the platform.</p>
<p><strong>Getting started in 3 steps:</strong></p>
<ol>
  <li><strong>Complete your profile</strong> — Add your logo, cover photo, description, and opening hours. A complete profile gets 3x more customer engagement.</li>
  <li><strong>Create your first promotion</strong> — Try a happy hour or drink special to attract your first customers. We'll help you generate it with AI — just describe what you want.</li>
  <li><strong>Tell your regulars</strong> — Share your Hoppr profile on your social media or put up a QR code in the bar. Customers can follow you and get notified about future promotions.</li>
</ol>
<p>Your bar portal is ready at <a href="https://business.hoppr.fi" style="color:#7c3aed">business.hoppr.fi</a>. If you need help, just reply to this email.</p>
${signatureBlock()}`;
    },
  },

  launch: {
    template: "launch",
    label: "Launch Announcement",
    defaultStage: "CLAIMED",
    subject: (b) => `Your bar is live on Hoppr — let's get your first promotion going, ${b.name}`,
    body: (b) => {
      return `<p>Hi,</p>
<p>🎉 <strong>${b.name} is now live on Hoppr!</strong></p>
<p>Customers can now discover your bar, follow it, and get notified about your events and promotions.</p>
<p><strong>To kick things off, here's what we recommend:</strong></p>
<ul>
  <li>Create 2–3 promotions this week — a happy hour, a drink special, or an event. Each one reaches your followers instantly.</li>
  <li>Try a <strong>boosted promotion</strong> — it shows your offer at the top of the discover feed for customers in ${locationLabel(b)} who aren't following you yet.</li>
  <li>Check your <strong>analytics dashboard</strong> to see who's engaging with your content.</li>
</ul>
<p>We're here to help you grow. Reply anytime with questions.</p>
${signatureBlock()}`;
    },
  },
};

/** Get a template by name */
export function getTemplate(name: string): OutreachEmailTemplate | undefined {
  return OUTREACH_TEMPLATES[name as OutreachTemplate];
}

/** List all available template options for the send modal dropdown */
export function listTemplates(): Array<{ value: OutreachTemplate; label: string; defaultStage: string }> {
  return Object.values(OUTREACH_TEMPLATES).map((t) => ({
    value: t.template,
    label: t.label,
    defaultStage: t.defaultStage,
  }));
}
