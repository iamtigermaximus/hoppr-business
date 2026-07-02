// Renders a promotion template to a React element, ready for html2canvas capture.
// This is the bridge between the promotion data and the visual image.
import type { TemplateProps, VisualParams } from "./types";
import { buildDefaultVisual } from "./types";
import { SplitTemplate } from "./split";
import { CenteredTemplate } from "./centered";
import { CardTemplate } from "./card";

export interface PromotionImageInput {
  barName: string;
  barType: string;
  promotionTitle: string;
  promotionDescription: string;
  promotionType: string;
  callToAction: string;
  accentColor: string;
  discount: number | null;
  conditions: string;
  photoUrl: string | null;
  venueLocation: string;
  visual?: Partial<VisualParams>;
}

const DIMENSIONS = {
  wide: { width: 1200, height: 630 },
  square: { width: 1080, height: 1080 },
  banner: { width: 1200, height: 400 },
} as const;

// Build full TemplateProps from input, filling in defaults
export function buildTemplateProps(
  input: PromotionImageInput,
  format: "wide" | "square" | "banner" = "wide",
): TemplateProps {
  const hasPhoto = !!input.photoUrl;
  const defaultVisual = buildDefaultVisual(input.promotionType, input.barType, hasPhoto);

  return {
    ...input,
    venueLocation: input.venueLocation || "",
    format,
    visual: {
      template: input.visual?.template || defaultVisual.template,
      photoPreference: input.visual?.photoPreference || defaultVisual.photoPreference,
      mood: input.visual?.mood || defaultVisual.mood,
      overlayOpacity: input.visual?.overlayOpacity ?? defaultVisual.overlayOpacity,
    },
  };
}

// Render the template as a React element at the specified dimensions
export function renderTemplate(props: TemplateProps): React.ReactElement {
  const dims = DIMENSIONS[props.format];

  const containerStyle: React.CSSProperties = {
    width: dims.width,
    height: dims.height,
    overflow: "hidden",
    position: "relative",
  };

  const templateElement = (() => {
    switch (props.visual.template) {
      case "centered":
        return <CenteredTemplate {...props} />;
      case "card":
        return <CardTemplate {...props} />;
      case "split":
      default:
        return <SplitTemplate {...props} />;
    }
  })();

  return <div style={containerStyle}>{templateElement}</div>;
}

// Generate a complete image preview: the template rendered inside a container
// ready for html2canvas to screenshot it.
export function PromotionImage({
  input,
  format = "wide",
  style,
}: {
  input: PromotionImageInput;
  format?: "wide" | "square" | "banner";
  style?: React.CSSProperties;
}) {
  const props = buildTemplateProps(input, format);
  const dims = DIMENSIONS[format];

  return (
    <div
      id="hoppr-og-image-container"
      style={{
        width: dims.width,
        height: dims.height,
        overflow: "hidden",
        position: "relative",
        transformOrigin: "top left",
        ...style,
      }}
    >
      {renderTemplate(props)}
    </div>
  );
}
