"use client";

import { useState, useRef, forwardRef, useImperativeHandle } from "react";
import styled from "styled-components";
import PromotionPreviewCard from "./previews/PromotionPreviewCard";
import EventPreviewCard from "./previews/EventPreviewCard";
import { getImageUrl } from "@/lib/cloudinary-url";
import {
  type SvgBackground,
  type ShareCategory,
  type ShareOccasion,
  SVG_PATTERNS,
  CATEGORY_LABELS,
  OCCASION_LABELS,
} from "./share-backgrounds";

// ---- Types ----

interface ShareCardProps {
  contentType: "event" | "promotion" | "brand";
  title: string;
  description: string;
  barName: string;
  barLogo: string | null;
  barCoverImage?: string | null;
  /** Content-specific image (promotion/event image) */
  imageUrl?: string | null;
  /** ISO date string or formatted date */
  date: string;
  /** Optional time string (for events) */
  time?: string;
  /** The public consumer URL for this content */
  consumerUrl?: string;
  /** The ID of the created content — used to build the consumer deep-link QR code */
  contentId?: string;
  /** SVG pattern background for the share card */
  svgBackground?: SvgBackground;
  /** Category badge */
  category?: ShareCategory;
  /** Occasion badge */
  occasion?: ShareOccasion;
  // Promotion-specific (for the real consumer card)
  promotionType?: string;
  discountValue?: number | null;
  conditions?: string;
  endDate?: string;
  // Event-specific (for the real consumer card)
  startTime?: string;
  endTime?: string;
  maxAttendees?: number | null;
}

type Lang = "fi" | "en";

// ---- Caption generator (pure function, no API needed) ----

function generateCaption(
  props: ShareCardProps,
  lang: Lang,
): string {
  const { contentType, title, description, barName, date, time, consumerUrl, discountValue, promotionType, category, occasion } =
    props;
  const link = consumerUrl || "hoppr.fi";

  // Build hashtags from category + occasion
  const tags: string[] = ["#hoppr", "#helsinki"];
  if (category) {
    const cat = CATEGORY_LABELS[category];
    tags.push(`#${cat.en.toLowerCase().replace(/\s+/g, "")}`);
  }
  if (occasion) {
    const occ = OCCASION_LABELS[occasion];
    tags.push(`#${occ.en.toLowerCase().replace(/\s+/g, "")}`);
  }
  if (contentType === "promotion") tags.push("#baarit");
  else if (contentType === "brand") tags.push("#helsinkibars");
  else tags.push("#tapahtumat");

  const tagStr = tags.join(" ");

  if (contentType === "promotion") {
    const discountLine = discountValue ? `${discountValue}% off · ` : "";
    const typeLabel = promotionType ? promotionType.replace(/_/g, " ") : "";
    if (lang === "fi") {
      return `${discountLine}${title} — nyt ${barName}ssa!\n\n${description || ""}\n\n${typeLabel ? `${typeLabel} · ` : ""}Voimassa: ${date}\n\nLöydät Hopprista: ${link}\n\n${tagStr}`;
    }
    return `${discountLine}${title} at ${barName}!\n\n${description || ""}\n\n${typeLabel ? `${typeLabel} · ` : ""}Valid: ${date}\n\nFind it on Hoppr: ${link}\n\n${tagStr}`;
  }

  if (contentType === "brand") {
    if (lang === "fi") {
      return `${title}\n\n${description || ""}\n\n${barName} — tutustu Hopprissa: ${link}\n\n${tagStr}`;
    }
    return `${title}\n\n${description || ""}\n\n${barName} — discover on Hoppr: ${link}\n\n${tagStr}`;
  }

  // event
  const timeStr = time ? `klo ${time}` : "";
  if (lang === "fi") {
    return `${title} — ${barName}ssa ${date}${timeStr ? ` ${timeStr}` : ""}!\n\n${description || ""}\n\nLiity mukaan Hopprissa: ${link}\n\n${tagStr}`;
  }
  return `${title} at ${barName} on ${date}${timeStr ? ` at ${time}` : ""}!\n\n${description || ""}\n\nJoin on Hoppr: ${link}\n\n${tagStr}`;
}

// ---- Helpers ----

/** Build the full consumer URL for QR code linking */
function buildConsumerUrl(
  contentType: "event" | "promotion" | "brand",
  contentId: string,
  consumerUrl?: string,
): string {
  const base = consumerUrl || "hoppr.fi";
  const protocol = base.startsWith("http") ? "" : "https://";
  if (contentType === "brand") {
    return `${protocol}${base}/venues/${contentId}`;
  }
  return `${protocol}${base}/${contentType}s/${contentId}`;
}

/** Build a QR code image URL using the QRServer API */
function qrCodeUrl(data: string, size = 80): string {
  const encoded = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&bgcolor=ffffff&color=000000&format=png`;
}

/** Convert a canvas to a Blob (prefer toBlob with PNG fallback) */
function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (canvas.toBlob) {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob returned null"));
        },
        "image/png",
        0.95,
      );
    } else {
      try {
        const dataUrl = canvas.toDataURL("image/png");
        const byteString = atob(dataUrl.split(",")[1]);
        const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        resolve(new Blob([ab], { type: mimeString }));
      } catch (e) {
        reject(e);
      }
    }
  });
}

// ---- Styled Components ----

const Wrapper = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
`;

/** The outer frame that gets captured — matches consumer app dark background */
const CaptureFrame = styled.div<{ $svgBg?: string | null; $hasImage: boolean }>`
  background-color: #0a0a0a;
  ${({ $svgBg, $hasImage }) =>
    $svgBg && !$hasImage
      ? `background-image: ${$svgBg}; background-size: cover;`
      : ""}
  padding: 1rem;
  border-radius: 1rem;
  max-width: 420px;
  width: 100%;
  position: relative;
`;

/** Bar logo badge — floats over the top-right of the share card */
const BarLogoBadge = styled.div`
  position: absolute;
  top: 0.625rem;
  right: 0.625rem;
  z-index: 10;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 4px;
  }
`;

/** Small "hoppr.fi" watermark at the bottom of the captured image */
const Watermark = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-top: 0.75rem;
  margin-top: 0.75rem;
  border-top: 1px solid #262626;
`;

const WatermarkText = styled.div`
  font-size: 0.6875rem;
  color: #4b5563;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.375rem;
`;

const QrCodeWrapper = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 0.375rem;
  overflow: hidden;
  background: white;
  padding: 3px;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    display: block;
  }
`;

const SectionLabel = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
`;

const Actions = styled.div`
  margin-top: 1rem;
`;

const ShareNowButton = styled.button<{ $loading: boolean }>`
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 700;
  cursor: ${({ $loading }) => ($loading ? "wait" : "pointer")};
  border: none;
  background: ${({ $loading }) =>
    $loading
      ? "linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%)"
      : "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)"};
  color: white;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover:not(:disabled) {
    box-shadow: 0 4px 16px rgba(124, 58, 237, 0.4);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const ShareHint = styled.p`
  font-size: 0.75rem;
  color: #9ca3af;
  text-align: center;
  margin: 0.5rem 0 0;
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.75rem 0;
  color: #d1d5db;
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: #e5e7eb;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const CopyButton = styled.button<{ $copied: boolean }>`
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid ${({ $copied }) => ($copied ? "#16a34a" : "#d1d5db")};
  background: ${({ $copied }) => ($copied ? "#dcfce7" : "white")};
  color: ${({ $copied }) => ($copied ? "#166534" : "#374151")};
  transition: all 0.15s;
  flex: 1;
  min-width: 0;
  text-align: center;

  &:hover {
    border-color: #3b82f6;
  }
`;

// ---- Ref handle (exposed to parent for programmatic capture) ----

export interface ShareCardHandle {
  /** Capture the share card to a PNG data URL (for social posting) */
  captureToDataUrl: () => Promise<string>;
}

// ---- Component ----

const ShareCard = forwardRef<ShareCardHandle, ShareCardProps>(function ShareCard(
  props,
  ref,
) {
  const [copied, setCopied] = useState<Lang | null>(null);
  const [sharing, setSharing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Expose capture method to parent (for social posting)
  useImperativeHandle(ref, () => ({
    captureToDataUrl: async (): Promise<string> => {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current!, {
        backgroundColor: "#0a0a0a",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      return canvas.toDataURL("image/png");
    },
  }));

  const handleCopy = async (lang: Lang) => {
    const caption = generateCaption(props, lang);
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(lang);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = caption;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(lang);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  /** Render the consumer card to canvas, return as a File for sharing */
  const renderCardToFile = async (): Promise<File> => {
    if (!cardRef.current) throw new Error("Card element not found");

    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: "#0a0a0a",
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const blob = await canvasToBlob(canvas);
    const safeName = props.title.slice(0, 30).replace(/\s+/g, "-");
    return new File([blob], `hoppr-${props.contentType}-${safeName}.png`, {
      type: "image/png",
    });
  };

  /** Primary action: share directly to Instagram, Facebook, etc. via OS share sheet */
  const handleShare = async () => {
    setSharing(true);
    try {
      const file = await renderCardToFile();
      const caption = generateCaption(props, "fi");

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: props.title,
          text: caption,
          files: [file],
        });
        return;
      }

      // Desktop fallback: copy caption + download image
      await navigator.clipboard.writeText(caption);
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.download = file.name;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(
        "📋 Caption copied to clipboard and image downloaded.\n\n" +
          "Paste the caption and upload the image to your social media app." +
          ("share" in navigator
            ? "\n\nTip: On mobile, use the share button for a faster experience."
            : ""),
      );
    } catch (err) {
      if (
        err instanceof DOMException &&
        (err.name === "AbortError" || err.name === "CancelError")
      ) {
        return;
      }
      console.error("Share failed:", err);
      alert(
        "Sharing failed. Try copying the caption and downloading the image manually.",
      );
    } finally {
      setSharing(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#0a0a0a",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `hoppr-${props.contentType}-${props.title.slice(0, 30).replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to generate share image:", err);
      alert(
        "Image generation requires html2canvas. Run: npm install html2canvas",
      );
    }
  };

  return (
    <Wrapper>
      <SectionLabel>📤 Share</SectionLabel>

      {/* The card that gets captured — uses the REAL consumer card design */}
      <CaptureFrame
        ref={cardRef}
        $svgBg={props.svgBackground ? SVG_PATTERNS[props.svgBackground] : null}
        $hasImage={!!(props.imageUrl || props.barCoverImage)}
      >
        {/* Bar logo — floats over the card for brand recognition on social media */}
        {props.barLogo && (
          <BarLogoBadge>
            <img src={getImageUrl(props.barLogo, 200)} alt={props.barName || "Bar logo"} />
          </BarLogoBadge>
        )}

        {props.contentType === "promotion" ? (
          <PromotionPreviewCard
            title={props.title}
            description={props.description}
            imageUrl={props.imageUrl ?? null}
            promotionType={props.promotionType || ""}
            discountValue={props.discountValue ?? null}
            startDate={props.date}
            endDate={props.endDate || props.date}
            conditions={props.conditions || ""}
            barCoverImage={props.barCoverImage ?? null}
            barLogoUrl={props.barLogo}
            hideInAppUI
          />
        ) : (
          <EventPreviewCard
            title={props.title}
            description={props.description}
            imageUrl={props.imageUrl ?? null}
            startTime={props.startTime || props.date}
            endTime={props.endTime || ""}
            maxAttendees={props.maxAttendees ?? null}
            barCoverImage={props.barCoverImage ?? null}
            barLogoUrl={props.barLogo}
            hideInAppUI
          />
        )}
        <Watermark>
          <WatermarkText>
            {props.barName && <span>{props.barName} · </span>}
            <span>hoppr.fi</span>
          </WatermarkText>
          {props.contentId && (
            <QrCodeWrapper>
              <img
                src={qrCodeUrl(
                  buildConsumerUrl(
                    props.contentType,
                    props.contentId,
                    props.consumerUrl,
                  ),
                )}
                alt="Scan to view on Hoppr"
              />
            </QrCodeWrapper>
          )}
        </Watermark>
      </CaptureFrame>

      <Actions>
        {/* Primary: native share (opens Instagram, Facebook, etc. on mobile) */}
        <ShareNowButton
          $loading={sharing}
          onClick={handleShare}
          disabled={sharing}
        >
          {sharing ? (
            <>⏳ Preparing share...</>
          ) : (
            <>📤 Share to Instagram / Facebook</>
          )}
        </ShareNowButton>
        <ShareHint>
          Opens your phone&apos;s share sheet — pick Instagram, Facebook, or any
          app. Caption and image are pre-filled.
        </ShareHint>

        <Divider>or copy manually</Divider>

        <ButtonRow>
          <CopyButton
            $copied={copied === "fi"}
            onClick={() => handleCopy("fi")}
          >
            {copied === "fi" ? "✅ Kopioitu!" : "📋 Kopioi (FI)"}
          </CopyButton>
          <CopyButton
            $copied={copied === "en"}
            onClick={() => handleCopy("en")}
          >
            {copied === "en" ? "✅ Copied!" : "📋 Copy (EN)"}
          </CopyButton>
          <CopyButton $copied={false} onClick={handleDownloadImage}>
            📸 Download
          </CopyButton>
        </ButtonRow>
      </Actions>
    </Wrapper>
  );
});

export default ShareCard;
export { generateCaption };
export type { ShareCardProps };
