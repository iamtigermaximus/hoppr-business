"use client";

import { useState } from "react";
import styled from "styled-components";

const UploadContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const UploadButton = styled.button<{ $isUploading?: boolean }>`
  padding: 0.5rem 1rem;
  background: ${(props) => (props.$isUploading ? "#9ca3af" : "#3b82f6")};
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: ${(props) => (props.$isUploading ? "not-allowed" : "pointer")};
  font-size: 0.875rem;
  font-weight: 500;
  min-height: 38px;

  &:hover {
    background: ${(props) => (props.$isUploading ? "#9ca3af" : "#2563eb")};
  }
`;

const FileInput = styled.input`
  display: none;
`;

const ProgressBar = styled.div<{ $progress: number }>`
  width: 100%;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 0.5rem;

  &::after {
    content: "";
    display: block;
    height: 100%;
    width: ${(props) => props.$progress}%;
    background: #3b82f6;
    transition: width 0.3s;
  }
`;

const UploadStatus = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
`;

const ErrorText = styled.p`
  font-size: 0.75rem;
  color: #ef4444;
  margin-top: 0.25rem;
`;

interface ImageUploadProps {
  onUpload: (url: string) => void;
  label?: string;
  buttonText?: string;
}

const ImageUpload = ({
  onUpload,
  label,
  buttonText = "Upload Image",
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const getToken = (): string | null => {
    return localStorage.getItem("hoppr_token");
  };

  const uploadFile = async (file: File) => {
    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Use JPG, PNG, or WEBP");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File too large. Max 5MB");
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    try {
      const token = getToken();
      const response = await fetch("/api/auth/admin/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const result = await response.json();
      onUpload(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 500);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  return (
    <UploadContainer>
      {label && <Label>{label}</Label>}
      <FileInput
        id="image-upload-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={uploading}
      />
      <UploadButton
        type="button"
        $isUploading={uploading}
        onClick={() => document.getElementById("image-upload-input")?.click()}
        disabled={uploading}
      >
        {uploading ? `Uploading ${progress}%...` : buttonText}
      </UploadButton>
      {uploading && <ProgressBar $progress={progress} />}
      {uploading && <UploadStatus>Please wait...</UploadStatus>}
      {error && <ErrorText>{error}</ErrorText>}
    </UploadContainer>
  );
};

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`;

export default ImageUpload;
