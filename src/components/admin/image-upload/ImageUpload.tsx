"use client";

import { useState, useRef } from "react";
import styled from "styled-components";

const UploadContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const UploadArea = styled.div<{ $isDragging?: boolean }>`
  border: 2px dashed ${(props) => (props.$isDragging ? "#3b82f6" : "#d1d5db")};
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;
  background: ${(props) => (props.$isDragging ? "#eff6ff" : "#f9fafb")};
  cursor: pointer;
  transition: all 0.2s;
  min-height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    border-color: #3b82f6;
    background: #eff6ff;
  }
`;

const UploadIcon = styled.div`
  font-size: 2rem;
`;

const UploadText = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
`;

const UploadSubtext = styled.p`
  font-size: 0.75rem;
  color: #9ca3af;
  margin: 0;
`;

const FileInput = styled.input`
  display: none;
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

const MultipleUploadButton = styled.button`
  padding: 0.5rem 1rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  min-height: 38px;

  &:hover {
    background: #059669;
  }
`;

const BatchProgressContainer = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
`;

const BatchProgressText = styled.p`
  font-size: 0.875rem;
  color: #374151;
  margin-bottom: 0.5rem;
  font-weight: 600;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`;

interface ImageUploadProps {
  onUpload: (url: string) => void;
  onMultipleUpload?: (urls: string[]) => void;
  label?: string;
  buttonText?: string;
  multiple?: boolean;
  existingImages?: string[];
  onRemoveImage?: (index: number) => void;
}

interface UploadTask {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  url?: string;
  error?: string;
}

const ImageUpload = ({
  onUpload,
  onMultipleUpload,
  label,
  buttonText = "Upload Image",
  multiple = false,
  existingImages = [],
  onRemoveImage,
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [batchUploading, setBatchUploading] = useState(false);
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getToken = (): string | null => {
    return localStorage.getItem("hoppr_token");
  };

  const uploadFile = async (file: File): Promise<string> => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      throw new Error("Invalid file type. Use JPG, PNG, or WEBP");
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error("File too large. Max 5MB");
    }

    const formData = new FormData();
    formData.append("files", file);

    const token = getToken();
    const response = await fetch("/api/auth/admin/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Upload failed");
    }

    const result = await response.json();

    if (result.url) {
      return result.url;
    } else if (result.results && result.results.length > 0) {
      return result.results[0].url;
    }

    throw new Error("Invalid response from server");
  };

  const uploadSingleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    try {
      const url = await uploadFile(file);
      clearInterval(progressInterval);
      setProgress(100);
      onUpload(url);
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 500);
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
    }
  };

  const uploadMultipleFiles = async (files: File[]) => {
    console.log("📸 Starting multiple file upload:", files.length, "files");
    console.log(
      "Files:",
      files.map((f) => f.name),
    );

    setError(null);
    setBatchUploading(true);

    const tasks: UploadTask[] = files.map((file) => ({
      file,
      progress: 0,
      status: "pending",
    }));
    setUploadTasks(tasks);

    const uploadedUrls: string[] = [];

    for (let i = 0; i < tasks.length; i++) {
      console.log(
        `📤 Uploading file ${i + 1}/${tasks.length}:`,
        tasks[i].file.name,
      );

      setUploadTasks((prev) =>
        prev.map((task, idx) =>
          idx === i ? { ...task, status: "uploading" } : task,
        ),
      );

      const progressInterval = setInterval(() => {
        setUploadTasks((prev) =>
          prev.map((task, idx) =>
            idx === i
              ? { ...task, progress: Math.min(task.progress + 10, 90) }
              : task,
          ),
        );
      }, 200);

      try {
        const url = await uploadFile(tasks[i].file);
        console.log(`✅ Upload successful for ${tasks[i].file.name}:`, url);

        clearInterval(progressInterval);
        uploadedUrls.push(url);

        setUploadTasks((prev) =>
          prev.map((task, idx) =>
            idx === i
              ? { ...task, progress: 100, status: "success", url }
              : task,
          ),
        );
      } catch (err) {
        console.error(`❌ Upload failed for ${tasks[i].file.name}:`, err);
        clearInterval(progressInterval);
        const errorMsg = err instanceof Error ? err.message : "Upload failed";
        setUploadTasks((prev) =>
          prev.map((task, idx) =>
            idx === i ? { ...task, status: "error", error: errorMsg } : task,
          ),
        );
        setError(`Failed to upload ${tasks[i].file.name}: ${errorMsg}`);
      }
    }

    console.log("📦 All uploads completed. URLs:", uploadedUrls);
    console.log("🔧 onMultipleUpload prop exists?", !!onMultipleUpload);

    if (uploadedUrls.length > 0 && onMultipleUpload) {
      console.log("📞 Calling onMultipleUpload with:", uploadedUrls);
      onMultipleUpload(uploadedUrls);
    } else if (uploadedUrls.length > 0 && !onMultipleUpload) {
      console.warn(
        "⚠️ onMultipleUpload is not defined, but multiple files were uploaded!",
      );
      uploadedUrls.forEach((url) => {
        if (onUpload) onUpload(url);
      });
    }

    setBatchUploading(false);

    setTimeout(() => {
      setUploadTasks([]);
    }, 5000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      console.log("No files selected");
      return;
    }

    console.log(
      `Selected ${files.length} file(s):`,
      Array.from(files).map((f) => f.name),
    );

    if (multiple && files.length > 1) {
      // Multiple files selected
      uploadMultipleFiles(Array.from(files));
    } else if (files[0]) {
      // Single file selected
      uploadSingleFile(files[0]);
    }

    // Reset the input value so the same file can be uploaded again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (imageFiles.length === 0) {
      setError("Please drop image files only");
      return;
    }

    console.log(`Dropped ${imageFiles.length} image(s)`);

    if (multiple && imageFiles.length > 1) {
      uploadMultipleFiles(imageFiles);
    } else if (imageFiles[0]) {
      uploadSingleFile(imageFiles[0]);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return "⏳";
      case "uploading":
        return "📤";
      case "success":
        return "✅";
      case "error":
        return "❌";
      default:
        return "📷";
    }
  };

  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <UploadContainer>
      {label && <Label>{label}</Label>}

      <UploadArea
        $isDragging={false}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFilePicker}
      >
        <UploadIcon>📸</UploadIcon>
        <UploadText>Click or drag images here to upload</UploadText>
        <UploadSubtext>
          Supports JPG, PNG, WEBP (Max 5MB per image)
        </UploadSubtext>
      </UploadArea>

      <FileInput
        ref={fileInputRef}
        id="image-upload-input"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleFileChange}
        disabled={uploading || batchUploading}
        multiple={multiple}
      />

      {!multiple && (
        <UploadButton
          type="button"
          $isUploading={uploading}
          onClick={openFilePicker}
          disabled={uploading}
        >
          {uploading ? `Uploading ${progress}%...` : buttonText}
        </UploadButton>
      )}

      {multiple && (
        <MultipleUploadButton
          type="button"
          onClick={openFilePicker}
          disabled={batchUploading}
        >
          {batchUploading
            ? `Uploading ${uploadTasks.length} images...`
            : "📁 Select Multiple Images (Ctrl+Click)"}
        </MultipleUploadButton>
      )}

      {uploading && <ProgressBar $progress={progress} />}
      {uploading && <UploadStatus>Please wait...</UploadStatus>}

      {batchUploading && uploadTasks.length > 0 && (
        <BatchProgressContainer>
          <BatchProgressText>
            Uploading {uploadTasks.length} image(s)...
          </BatchProgressText>
          {uploadTasks.map((task, index) => (
            <div key={index} style={{ marginBottom: "0.75rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.75rem",
                  marginBottom: "0.25rem",
                }}
              >
                <span>
                  {getStatusIcon(task.status)} {task.file.name.substring(0, 40)}
                </span>
                <span>
                  {task.status === "success"
                    ? "✅ Complete"
                    : task.status === "error"
                      ? "❌ Failed"
                      : `${task.progress}%`}
                </span>
              </div>
              {task.status !== "error" && task.status !== "success" && (
                <ProgressBar $progress={task.progress} />
              )}
              {task.error && <ErrorText>{task.error}</ErrorText>}
            </div>
          ))}
        </BatchProgressContainer>
      )}

      {error && <ErrorText>❌ {error}</ErrorText>}
    </UploadContainer>
  );
};

export default ImageUpload;
