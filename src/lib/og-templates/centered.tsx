// Centered layout: dramatic vertical stack, no photo needed.
// Best for: live music events, theme nights, performer announcements.
import type { TemplateProps } from "./types";
import { MOOD_COLORS } from "./types";

export function CenteredTemplate(props: TemplateProps) {
  const { barName, promotionTitle, promotionDescription, callToAction, accentColor, photoUrl, venueLocation, conditions, visual } = props;
  const [gradientStart, gradientEnd] = MOOD_COLORS[visual.mood];

  return (
    <div style={{
      ...styles.wrapper,
      background: photoUrl
        ? `linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.85)), url(${photoUrl})`
        : `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}>
      {/* Subtle radial glow behind text */}
      <div style={{
        position: "absolute",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 600, height: 400,
        background: `radial-gradient(ellipse, ${accentColor}22 0%, transparent 70%)`,
      }} />

      <div style={styles.content}>
        {/* Venue name */}
        <div style={styles.venueName}>{barName}</div>

        {/* Location */}
        <div style={styles.venueLocation}>{venueLocation}</div>

        {/* Title — largest text on the card */}
        <div style={styles.title}>{promotionTitle}</div>

        {/* Divider */}
        <div style={{ ...styles.divider, background: accentColor }} />

        {/* Description */}
        <div style={styles.description}>{promotionDescription}</div>

        {/* Conditions / dates / details — key for social media marketing posts */}
        {conditions && (
          <div style={styles.conditions}>{conditions}</div>
        )}

        {/* CTA pill */}
        <div style={{ ...styles.cta, borderColor: accentColor }}>
          <span style={styles.ctaText}>{callToAction}</span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    width: 1200,
    height: 630,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Inter, system-ui, sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "0 80px",
    position: "relative",
    zIndex: 1,
  },
  venueName: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 26,
    fontWeight: 500,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  venueLocation: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 18,
    fontWeight: 400,
    marginBottom: 32,
  },
  title: {
    color: "white",
    fontSize: 64,
    fontWeight: 700,
    lineHeight: 1.15,
    maxWidth: 900,
    marginBottom: 28,
  },
  divider: {
    width: 80,
    height: 3,
    borderRadius: 2,
    marginBottom: 28,
  },
  description: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 22,
    lineHeight: 1.5,
    maxWidth: 700,
    marginBottom: 16,
  },
  conditions: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1.4,
    marginBottom: 32,
    maxWidth: 700,
  },
  cta: {
    display: "flex",
    alignItems: "center",
    borderRadius: 30,
    padding: "14px 36px",
    border: "1.5px solid",
    width: "fit-content",
  },
  ctaText: {
    color: "white",
    fontSize: 20,
    fontWeight: 600,
  },
};
