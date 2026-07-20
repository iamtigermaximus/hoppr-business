"use client";
// Renders a full-size 1200×630 brand social card for html2canvas capture.
// Similar scale and presence to PromotionImage, but designed for brand identity content.
import { useEffect, useRef, useState } from "react";
import type { BrandPreviewCardProps } from "./ConsumerPreviewPanel";

interface Props extends BrandPreviewCardProps {
  /** Called with the generated image data URL after capture */
  onCapture?: (dataUrl: string) => void;
}

export function BrandCardCapture({ onCapture, ...cardProps }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const { title, description, imageUrl, cta, barCoverImage } = cardProps;

  useEffect(() => {
    if (!containerRef.current || captured) return;

    import("html2canvas").then(({ default: html2canvas }) => {
      html2canvas(containerRef.current!, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      }).then((canvas) => {
        const dataUrl = canvas.toDataURL("image/png");
        setCaptured(dataUrl);
        onCapture?.(dataUrl);
      });
    });
  }, [captured, onCapture]);

  const bgImage = imageUrl || barCoverImage;

  return (
    <div
      ref={containerRef}
      style={{
        width: 1200,
        height: 630,
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Background image with gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: bgImage
            ? `url(${bgImage}) center/cover no-repeat`
            : "linear-gradient(135deg, #1a1a2e 0%, #2d1f4e 50%, #0f0f1a 100%)",
        }}
      />
      {/* Dark overlay for text readability */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.15) 100%)",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "64px 72px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* Headline */}
        <h1
          style={{
            color: "#fff",
            fontSize: "48px",
            fontWeight: 800,
            lineHeight: 1.15,
            margin: 0,
            maxWidth: "900px",
            textShadow: "0 2px 12px rgba(0,0,0,0.5)",
            letterSpacing: "-0.02em",
          }}
        >
          {title || " "}
        </h1>

        {/* Body */}
        {description && (
          <p
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: "22px",
              fontWeight: 400,
              lineHeight: 1.5,
              margin: 0,
              maxWidth: "750px",
              textShadow: "0 1px 8px rgba(0,0,0,0.4)",
            }}
          >
            {description}
          </p>
        )}

        {/* CTA pill */}
        {cta && (
          <span
            style={{
              display: "inline-block",
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              color: "#fff",
              padding: "14px 32px",
              borderRadius: "32px",
              fontSize: "20px",
              fontWeight: 700,
              letterSpacing: "0.02em",
              width: "fit-content",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            {cta}
          </span>
        )}
      </div>

      {/* Hoppr watermark */}
      <div
        style={{
          position: "absolute",
          top: "32px",
          right: "48px",
          color: "rgba(255,255,255,0.5)",
          fontSize: "18px",
          fontWeight: 600,
          letterSpacing: "0.04em",
          textShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }}
      >
        HOPPR
      </div>
    </div>
  );
}
