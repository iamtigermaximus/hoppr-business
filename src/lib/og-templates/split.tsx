// Split layout: photo/image left, promotion text right.
// Best for: bars with cover photos, drink specials, food promos.
import type { TemplateProps } from "./types";
import { MOOD_COLORS } from "./types";

export function SplitTemplate(props: TemplateProps) {
  const { barName, promotionTitle, promotionDescription, callToAction, accentColor, photoUrl, venueLocation, conditions, visual } = props;
  const [gradientStart, gradientEnd] = MOOD_COLORS[visual.mood];

  return (
    <div style={styles.wrapper}>
      {/* Left: photo or gradient fallback */}
      <div style={{
        ...styles.photoSide,
        ...(photoUrl
          ? { backgroundImage: `url(${photoUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})` }),
      }}>
        {!photoUrl && (
          <div style={styles.photoFallback}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <path d="M24 16h16l-2.4 32H26.4L24 16z" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
              <rect x="18" y="52" width="28" height="4" rx="2" fill="rgba(255,255,255,0.15)" />
            </svg>
          </div>
        )}
        {/* Dark overlay for text readability on photos */}
        {photoUrl && (
          <div style={{
            ...styles.overlay,
            background: `linear-gradient(to right, rgba(0,0,0,${0.6 + visual.overlayOpacity * 0.4}) 0%, rgba(0,0,0,${0.15 + visual.overlayOpacity * 0.15}) 100%)`,
          }} />
        )}
      </div>

      {/* Right: text content */}
      <div style={styles.textSide}>
        {/* Venue name + location */}
        <div style={styles.venueRow}>
          <span style={styles.venueName}>{barName}</span>
          <span style={styles.dot}>·</span>
          <span style={styles.venueLocation}>{venueLocation}</span>
        </div>

        {/* Title */}
        <div style={styles.title}>{promotionTitle}</div>

        {/* Accent line */}
        <div style={{ ...styles.accentLine, background: accentColor }} />

        {/* Description */}
        <div style={styles.description}>{promotionDescription}</div>

        {/* Conditions / dates / details — key for social media marketing posts */}
        {conditions && (
          <div style={styles.conditions}>{conditions}</div>
        )}

        {/* CTA button */}
        <div style={{ ...styles.cta, background: accentColor }}>
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
    background: "#0a0a0a",
    fontFamily: "Inter, system-ui, sans-serif",
    overflow: "hidden",
  },
  photoSide: {
    width: 500,
    height: "100%",
    position: "relative" as const,
    flexShrink: 0,
  },
  overlay: {
    position: "absolute",
    inset: 0,
  },
  photoFallback: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  textSide: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center",
    padding: "0 64px 0 56px",
  },
  venueRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  venueName: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 22,
    fontWeight: 500,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
  },
  dot: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 22,
  },
  venueLocation: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 22,
    fontWeight: 400,
  },
  title: {
    color: "white",
    fontSize: 50,
    fontWeight: 700,
    lineHeight: 1.1,
    marginBottom: 24,
    maxWidth: 560,
  },
  accentLine: {
    width: 56,
    height: 3,
    borderRadius: 2,
    marginBottom: 24,
  },
  description: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 21,
    lineHeight: 1.5,
    marginBottom: 16,
    maxWidth: 500,
  },
  conditions: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1.4,
    marginBottom: 28,
    maxWidth: 500,
  },
  cta: {
    display: "flex",
    alignItems: "center",
    borderRadius: 28,
    padding: "12px 32px",
    width: "fit-content" as const,
  },
  ctaText: {
    color: "white",
    fontSize: 19,
    fontWeight: 600,
  },
};
