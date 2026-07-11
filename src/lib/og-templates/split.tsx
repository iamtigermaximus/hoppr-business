// Split layout: photo/image left, promotion text right.
// Best for: bars with cover photos, drink specials, food promos.
import type { TemplateProps } from "./types";
import { MOOD_COLORS } from "./types";
import { getTitleFontConfig } from "./fonts";
import type { TitleFontStyle } from "./fonts";

export function SplitTemplate(props: TemplateProps) {
  const { barName, promotionTitle, promotionDescription, callToAction, accentColor, photoUrl, venueLocation, conditions, visual, titleFontStyle } = props;
  const [gradientStart, gradientEnd] = MOOD_COLORS[visual.mood];
  const titleFont = getTitleFontConfig(titleFontStyle as TitleFontStyle | null | undefined);

  // Dynamically reduce title font size for very long titles
  const titleFontSize = promotionTitle.length > 50 ? 40 : promotionTitle.length > 35 ? 46 : 50;

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

        {/* Title — line-clamped to prevent overflow */}
        <div style={{
          ...styles.title,
          fontSize: titleFontSize,
          fontFamily: titleFont.fontFamily,
          fontWeight: titleFont.fontWeight,
          letterSpacing: titleFont.letterSpacing || styles.title.letterSpacing,
          textTransform: titleFont.textTransform || "none",
        }}>{promotionTitle}</div>

        {/* Accent line */}
        <div style={{ ...styles.accentLine, background: accentColor }} />

        {/* Description — line-clamped */}
        <div style={styles.description}>{promotionDescription}</div>

        {/* Conditions / dates / details — line-clamped */}
        {conditions && (
          <div style={styles.conditions}>{conditions}</div>
        )}

        {/* CTA button — always visible */}
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
    overflow: "hidden",
  },
  venueRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
    flexShrink: 0,
  },
  venueName: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 22,
    fontWeight: 500,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 260,
  },
  dot: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 22,
  },
  venueLocation: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 22,
    fontWeight: 400,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 250,
  },
  title: {
    color: "white",
    fontWeight: 700,
    lineHeight: 1.1,
    letterSpacing: "-0.01em",
    marginBottom: 24,
    maxWidth: 560,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  } as React.CSSProperties,
  accentLine: {
    width: 56,
    height: 3,
    borderRadius: 2,
    marginBottom: 24,
    flexShrink: 0,
  },
  description: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 21,
    lineHeight: 1.5,
    marginBottom: 12,
    maxWidth: 500,
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  } as React.CSSProperties,
  conditions: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1.4,
    marginBottom: 20,
    maxWidth: 500,
    display: "-webkit-box",
    WebkitLineClamp: 1,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  } as React.CSSProperties,
  cta: {
    display: "flex",
    alignItems: "center",
    borderRadius: 28,
    padding: "12px 32px",
    width: "fit-content" as const,
    flexShrink: 0,
  },
  ctaText: {
    color: "white",
    fontSize: 19,
    fontWeight: 600,
  },
};
