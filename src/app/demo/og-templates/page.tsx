"use client";
// Demo page: preview the OG image templates with sample promotion data.
// Visit /demo/og-templates to see all three templates in action.
import { PromotionImageDemo } from "@/components/bar/create/PromotionImagePreview";
import type { PromotionImageInput } from "@/lib/og-templates/generate";

// Sample 1: Tiistain tasting (from the quality samples doc)
const tiistainTasting: PromotionImageInput = {
  barName: "Kallion Kulma",
  barType: "COCKTAIL_BAR",
  promotionTitle: "Tiistain tasting — kolme cocktailia, yksi hinta",
  promotionDescription: "Joka tiistai baarimestari rakentaa kolmen cocktailin maistelumenun sesongin parhaista raaka-aineista. 22 € koko menu. Täydellinen tapa aloittaa ilta — varaa pöytä porukalle.",
  promotionType: "FOOD_SPECIAL",
  callToAction: "Varaa pöytä",
  accentColor: "#7c3aed",
  discount: null,
  conditions: "Tiistaisin 17–22. Menu 22 € / hlö. Pöytävaraus netissä.",
  photoUrl: null, // No photo — shows gradient fallback
  venueLocation: "Kallio, Helsinki",
  visual: { template: "split", mood: "warm", overlayOpacity: 0.35 },
};

// Sample 2: Laura Moisio live event (from the quality samples doc)
const lauraMoisio: PromotionImageInput = {
  barName: "Kallion Kulma",
  barType: "COCKTAIL_BAR",
  promotionTitle: "Laura Moisio (live) + DJ Sämmy — perjantai Kalliossa",
  promotionDescription: "Intiimi akustinen setti Kallion Kulman loungessa. Illan jatkaa DJ Sämmy — afrobeatia, grooven ja harvinaista soulia Funktion-Onella aamuyöhön. Tule ajoissa.",
  promotionType: "LIVE_MUSIC_EVENT",
  callToAction: "Vapaa pääsy ennen 21",
  accentColor: "#3b82f6",
  discount: null,
  conditions: "Ovet 20:00. Vapaa pääsy ennen 21:00, jälkeen 5 €. 20+.",
  photoUrl: null,
  venueLocation: "Kallio, Helsinki",
  visual: { template: "centered", mood: "cool", overlayOpacity: 0.45 },
};

// Sample 3: Generic Happy Hour (current low quality output — for comparison)
const oldStyle: PromotionImageInput = {
  barName: "Kallion Kulma",
  barType: "COCKTAIL_BAR",
  promotionTitle: "Happy Hour — 50% off drinks",
  promotionDescription: "Join us every weekday from 5–7 PM for half-price cocktails, beer, and wine. Bring your friends!",
  promotionType: "HAPPY_HOUR",
  callToAction: "View Offer",
  accentColor: "#f59e0b",
  discount: 50,
  conditions: "Weekdays 17:00–19:00, drinks only",
  photoUrl: null,
  venueLocation: "Kallio, Helsinki",
  visual: { template: "card", mood: "vibrant", overlayOpacity: 0.4 },
};

const samples = [
  { label: "Tiistain tasting (improved)", data: tiistainTasting, highlight: true },
  { label: "Laura Moisio live (improved)", data: lauraMoisio, highlight: true },
  { label: "Happy Hour (old output)", data: oldStyle, highlight: false },
] as const;

export default function OGTemplatesDemo() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      color: "white",
      padding: "40px 24px",
      fontFamily: "Inter, system-ui, sans-serif",
    }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>
            OG Image Templates Demo
          </h1>
          <p style={{ color: "#737373", fontSize: 14, marginTop: 8 }}>
            These are promotion cards rendered as React components using the template system.
            Toggle between wide (OG image), square (social feed), and banner formats.
          </p>
        </div>

        {/* Samples */}
        {samples.map((sample) => (
          <div
            key={sample.label}
            style={{
              marginBottom: 48,
              padding: 24,
              background: sample.highlight ? "#1a1a2e" : "#111",
              borderRadius: 16,
              border: sample.highlight ? "1px solid #7c3aed33" : "1px solid #262626",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                {sample.label}
              </h2>
              {sample.highlight && (
                <span style={{
                  background: "#7c3aed22",
                  color: "#a78bfa",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: 6,
                }}>
                  Multi-step pipeline
                </span>
              )}
            </div>

            {/* Data summary */}
            <div style={{
              display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20,
              fontSize: 12, color: "#737373",
            }}>
              <span>Type: {sample.data.promotionType}</span>
              <span>·</span>
              <span>Template: {sample.data.visual?.template}</span>
              <span>·</span>
              <span>Mood: {sample.data.visual?.mood}</span>
              <span>·</span>
              <span>Accent: {sample.data.accentColor}</span>
            </div>

            <PromotionImageDemo input={sample.data} />
          </div>
        ))}

        {/* How it works */}
        <div style={{
          marginTop: 60,
          padding: 24,
          background: "#111",
          borderRadius: 16,
          border: "1px solid #262626",
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px" }}>
            How the image system works
          </h2>
          <div style={{ color: "#a3a3a3", fontSize: 13, lineHeight: 1.7 }}>
            <p>
              <strong>1. AI generates text + visual params.</strong> When the bar owner clicks
              &ldquo;Generate,&rdquo; the AI produces the promotion title, description, CTA, and
              also picks which template to use, the color mood, and overlay opacity.
              These come back in the <code>visual</code> field of the API response.
            </p>
            <p>
              <strong>2. Template renders the card.</strong> The <code>PromotionImage</code> component
              reads the visual params and renders one of three templates: Split (photo+text),
              Centered (bold event style), or Card (square feed format).
            </p>
            <p>
              <strong>3. html2canvas captures it.</strong> When the bar owner approves the promotion,
              the rendered template is captured as a PNG using html2canvas (already installed) and
              uploaded to Cloudinary (already configured). The image URL is stored on the promotion record.
            </p>
            <p>
              <strong>4. Image serves everywhere.</strong> The Cloudinary URL becomes the
              promotion&rsquo;s cover image in the consumer app, social sharing preview,
              and any embeddable context.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
