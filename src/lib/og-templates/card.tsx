// Card layout: square format optimized for social feeds and in-app cards.
// Compact, photo-forward when possible, works without photos too.
import type { TemplateProps } from "./types";
import { MOOD_COLORS } from "./types";
import { getTitleFontConfig } from "./fonts";
import type { TitleFontStyle } from "./fonts";

export function CardTemplate(props: TemplateProps) {
  const { barName, promotionTitle, promotionDescription, callToAction, accentColor, photoUrl, conditions, visual, titleFontStyle } = props;
  const [gradientStart, gradientEnd] = MOOD_COLORS[visual.mood];
  const titleFont = getTitleFontConfig(titleFontStyle as TitleFontStyle | null | undefined);

  // Dynamically reduce title font size for long titles
  const titleFontSize = promotionTitle.length > 50 ? 40 : promotionTitle.length > 35 ? 46 : 52;

  // Dynamically reduce description font size for long text so it fits without clipping
  const descLen = promotionDescription.length;
  const descFontSize = descLen > 350 ? 17 : descLen > 250 ? 19 : descLen > 150 ? 21 : 24;
  const descLineClamp = descLen > 350 ? 6 : descLen > 250 ? 5 : 4;

  return (
    <div style={styles.wrapper}>
      {/* Upper: photo or gradient */}
      <div style={{
        ...styles.imageArea,
        ...(photoUrl
          ? { backgroundImage: `url(${photoUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})` }),
      }}>
        {photoUrl && (
          <div style={{
            ...styles.imageOverlay,
            background: `linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,${0.55 + visual.overlayOpacity * 0.3}) 100%)`,
          }} />
        )}

        {/* Venue label floating on image */}
        <div style={styles.venueBadge}>
          <span style={styles.venueBadgeText}>{barName}</span>
        </div>

        {/* Title on image — line-clamped */}
        <div style={{
          ...styles.titleOnImage,
          fontSize: titleFontSize,
          fontFamily: titleFont.fontFamily,
          fontWeight: titleFont.fontWeight,
          letterSpacing: titleFont.letterSpacing || styles.titleOnImage.letterSpacing,
          textTransform: titleFont.textTransform || "none",
        }}>{promotionTitle}</div>
      </div>

      {/* Lower: text info */}
      <div style={styles.infoArea}>
        <div style={styles.textBlock}>
          <div style={styles.descriptionRow}>
            <span style={{
              ...styles.descriptionText,
              fontSize: descFontSize,
              WebkitLineClamp: descLineClamp,
            }}>{promotionDescription}</span>
          </div>

          {/* Conditions / dates / details */}
          {conditions && (
            <div style={styles.conditionsRow}>
              <span style={styles.conditionsText}>{conditions}</span>
            </div>
          )}
        </div>

        <div style={styles.bottomRow}>
          {/* Accent dot */}
          <div style={{ ...styles.accentDot, background: accentColor }} />

          {/* CTA */}
          <span style={{ ...styles.ctaText, color: accentColor }}>
            {callToAction}
          </span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    width: 1080,
    height: 1080,
    display: "flex",
    flexDirection: "column",
    background: "#0a0a0a",
    fontFamily: "Inter, system-ui, sans-serif",
    overflow: "hidden",
    borderRadius: 20,
  },
  imageArea: {
    height: 680,
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    padding: "40px 48px",
    flexShrink: 0,
  },
  imageOverlay: {
    position: "absolute",
    inset: 0,
  },
  venueBadge: {
    display: "flex",
    background: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(8px)",
    borderRadius: 20,
    padding: "6px 16px",
    width: "fit-content",
    marginBottom: 16,
    position: "relative",
    zIndex: 1,
  },
  venueBadgeText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 20,
    fontWeight: 500,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  titleOnImage: {
    color: "white",
    fontWeight: 700,
    lineHeight: 1.15,
    letterSpacing: "-0.01em",
    maxWidth: 900,
    position: "relative",
    zIndex: 1,
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  } as React.CSSProperties,
  infoArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "32px 48px 40px",
  },
  textBlock: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  descriptionRow: {
    display: "flex",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  descriptionText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 24,
    lineHeight: 1.4,
    maxWidth: 800,
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  } as React.CSSProperties,
  conditionsRow: {
    display: "flex",
    marginBottom: 16,
  },
  conditionsText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 18,
    fontWeight: 400,
    lineHeight: 1.4,
    maxWidth: 800,
    display: "-webkit-box",
    WebkitLineClamp: 1,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  } as React.CSSProperties,
  bottomRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexShrink: 0,
  },
  accentDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
  },
  ctaText: {
    fontSize: 22,
    fontWeight: 600,
  },
};
