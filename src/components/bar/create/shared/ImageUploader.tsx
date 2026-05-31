"use client";

import { useState, useCallback, useRef } from "react";
import styled from "styled-components";
import { getDefaultImagesForType, type DefaultImage } from "@/lib/default-images";

// ---- Styled Components ----

const Container = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
`;

const TabRow = styled.div`
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
`;

const Tab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 0.625rem 1rem;
  font-size: 0.8125rem;
  font-weight: ${({ $active }) => ($active ? 600 : 500)};
  color: ${({ $active }) => ($active ? "#7c3aed" : "#6b7280")};
  background: ${({ $active }) => ($active ? "white" : "transparent")};
  border: none;
  border-bottom: 2px solid ${({ $active }) => ($active ? "#7c3aed" : "transparent")};
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    color: #7c3aed;
  }
`;

const Content = styled.div`
  padding: 1rem;
`;

// Upload zone
const DropZone = styled.div<{ $dragging: boolean }>`
  border: 2px dashed ${({ $dragging }) => ($dragging ? "#7c3aed" : "#d1d5db")};
  border-radius: 0.5rem;
  padding: 2rem 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: ${({ $dragging }) => ($dragging ? "#f5f3ff" : "white")};

  &:hover {
    border-color: #7c3aed;
    background: #faf9ff;
  }
`;

const DropIcon = styled.div`
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: #9ca3af;
`;

const DropText = styled.p`
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0 0 0.25rem;
`;

const DropHint = styled.p`
  font-size: 0.6875rem;
  color: #9ca3af;
  margin: 0;
`;

const HiddenInput = styled.input`
  display: none;
`;

// Uploaded preview
const UploadedPreview = styled.div`
  position: relative;
  border-radius: 0.5rem;
  overflow: hidden;
  margin-top: 0.75rem;
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 160px;
  object-fit: cover;
  display: block;
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;

  &:hover {
    background: rgba(0, 0, 0, 0.8);
  }
`;

// Defaults grid
const DefaultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const DefaultTile = styled.button<{ $selected: boolean }>`
  aspect-ratio: 16 / 10;
  border-radius: 0.375rem;
  border: 2px solid ${({ $selected }) => ($selected ? "#7c3aed" : "#e5e7eb")};
  background: ${({ $selected }) => ($selected ? "#ede9fe" : "#f3f4f6")};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.5rem;
  transition: all 0.15s;
  font-size: 1.25rem;

  &:hover {
    border-color: #7c3aed;
    background: #f5f3ff;
  }
`;

const DefaultLabel = styled.span`
  font-size: 0.625rem;
  color: #6b7280;
  text-align: center;
  line-height: 1.2;
`;

// Upload progress
const UploadStatus = styled.div`
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 0.375rem;
`;

const ErrorText = styled.span`
  color: #ef4444;
  font-size: 0.75rem;
`;

// ---- Component ----

interface ImageUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
  contentType: "event" | "promotion" | "pass";
  barId: string;
}

const DEFAULT_ICONS: Record<string, string> = {
  cocktails: "🍸",
  "live-music": "🎸",
  party: "🎉",
  beer: "🍺",
  vip: "👑",
  wine: "🍷",
  "special-offer": "🏷️",
  karaoke: "🎤",
  sports: "⚽",
  "outdoor-terrace": "🌿",
  "dj-night": "🎧",
  "bar-ambiance": "🍹",
};

export default function ImageUploader({
  value,
  onChange,
  contentType,
  barId,
}: ImageUploaderProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "defaults">("upload");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultImages = getDefaultImagesForType(contentType);
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("hoppr_token")
      : null;

  const handleUpload = useCallback(
    async (file: File) => {
      if (!token) return;
      setUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(
          `/api/auth/bar/${barId}/upload`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          },
        );

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }

        const data = await res.json();
        onChange(data.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [barId, token, onChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleSelectDefault = (image: DefaultImage) => {
    onChange(image.path);
  };

  const handleRemove = () => {
    onChange(null);
  };

  return (
    <Container>
      <TabRow>
        <Tab
          $active={activeTab === "upload"}
          onClick={() => setActiveTab("upload")}
        >
          📷 Upload
        </Tab>
        <Tab
          $active={activeTab === "defaults"}
          onClick={() => setActiveTab("defaults")}
        >
          🖼️ Defaults
        </Tab>
      </TabRow>

      <Content>
        {activeTab === "upload" ? (
          <>
            <DropZone
              $dragging={dragging}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <DropIcon>{uploading ? "⏳" : "📁"}</DropIcon>
              <DropText>
                {uploading
                  ? "Uploading..."
                  : "Drag & drop an image, or click to browse"}
              </DropText>
              <DropHint>PNG, JPG, or WebP — max 5MB</DropHint>
              <HiddenInput
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
              />
            </DropZone>

            {error && <ErrorText>{error}</ErrorText>}

            {value && !value.startsWith("/defaults/") && (
              <UploadedPreview>
                <PreviewImage src={value} alt="Uploaded" />
                <RemoveButton onClick={handleRemove}>×</RemoveButton>
              </UploadedPreview>
            )}
          </>
        ) : (
          <DefaultsGrid>
            {defaultImages.map((img) => (
              <DefaultTile
                key={img.name}
                $selected={value === img.path}
                onClick={() => handleSelectDefault(img)}
              >
                {DEFAULT_ICONS[img.name] || "🖼️"}
                <DefaultLabel>{img.label}</DefaultLabel>
              </DefaultTile>
            ))}
          </DefaultsGrid>
        )}

        {value && value.startsWith("/defaults/") && (
          <UploadStatus>
            ✅ Selected: {defaultImages.find((d) => d.path === value)?.label || "Default image"}
          </UploadStatus>
        )}
      </Content>
    </Container>
  );
}
