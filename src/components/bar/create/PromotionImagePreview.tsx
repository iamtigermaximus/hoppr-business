"use client";
// Renders the generated promotion as a visual card using the OG templates.
// The bar owner sees this preview immediately after AI generation.
import { useEffect, useRef, useState } from "react";
import { PromotionImage, type PromotionImageInput } from "@/lib/og-templates/generate";

interface Props {
  input: PromotionImageInput;
  format?: "wide" | "square" | "banner";
  /** Called with the generated image data URL after capture */
  onCapture?: (dataUrl: string) => void;
  /** If true, renders at full size for html2canvas capture. If false, scales to fit. */
  captureMode?: boolean;
}

export function PromotionImagePreview({ input, format = "wide", onCapture, captureMode }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [captured, setCaptured] = useState<string | null>(null);

  useEffect(() => {
    if (!captureMode || !containerRef.current || captured) return;

    // Dynamic import html2canvas so it only loads when needed
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
  }, [captureMode, captured, onCapture]);

  return (
    <div style={{ position: "relative" }}>
      {/* The actual rendered template (hidden when captureMode, shown scaled otherwise) */}
      <div
        ref={containerRef}
        style={{
          transform: captureMode ? undefined : "scale(0.3)",
          transformOrigin: "top left",
          width: captureMode ? undefined : "fit-content",
          height: captureMode ? undefined : "fit-content",
        }}
      >
        <PromotionImage input={input} format={format} />
      </div>

      {/* Show the captured image after capture */}
      {captured && (
        <img
          src={captured}
          alt="Promotion preview"
          style={{
            width: "100%",
            borderRadius: 12,
            border: "1px solid var(--color-card-border, #262626)",
          }}
        />
      )}
    </div>
  );
}

/**
 * Demo component that shows all three template formats for a given input.
 * Use this on a test page to preview the templates.
 */
export function PromotionImageDemo({ input }: { input: PromotionImageInput }) {
  const [selectedFormat, setSelectedFormat] = useState<"wide" | "square" | "banner">("wide");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Format switcher */}
      <div style={{ display: "flex", gap: 8 }}>
        {(["wide", "square", "banner"] as const).map((fmt) => (
          <button
            key={fmt}
            onClick={() => setSelectedFormat(fmt)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid var(--color-card-border, #262626)",
              background: selectedFormat === fmt ? "#7c3aed" : "transparent",
              color: selectedFormat === fmt ? "white" : "var(--color-text-secondary, #a3a3a3)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {fmt === "wide" ? "1200×630 (OG)" : fmt === "square" ? "1080×1080 (Feed)" : "1200×400 (Banner)"}
          </button>
        ))}
      </div>

      {/* Rendered preview */}
      <div
        style={{
          width: selectedFormat === "banner" ? 600 : 500,
          overflow: "hidden",
          borderRadius: 12,
          border: "1px solid var(--color-card-border, #262626)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ transform: "scale(0.5)", transformOrigin: "top left", width: "200%", height: "200%" }}>
          <PromotionImage input={input} format={selectedFormat} />
        </div>
      </div>
    </div>
  );
}
