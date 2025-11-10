// src/components/admin/csv-import/CSVImport.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import Link from "next/link";

// Types
interface BarImportHistory {
  id: string;
  fileName: string;
  fileSize: number;
  totalRows: number;
  importedRows: number;
  failedRows: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "PARTIAL";
  errors?: string[];
  importedBy: string;
  createdAt: string;
  updatedAt: string;
}

// Styled Components - UPDATED FOR RESPONSIVENESS
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;

  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

const Header = styled.div`
  margin-bottom: 1.5rem;

  @media (min-width: 768px) {
    margin-bottom: 2rem;
  }
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
  margin-bottom: 1rem;
  padding: 0.5rem 0;
  min-height: 44px; /* Better touch target */

  &:hover {
    color: #2563eb;
  }
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
  line-height: 1.2;

  @media (min-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.4;

  @media (min-width: 768px) {
    font-size: 1.125rem;
  }
`;

const Grid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }
`;

const UploadSection = styled.div`
  width: 100%;
`;

const Card = styled.div`
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;

  @media (min-width: 768px) {
    padding: 1.5rem;
  }
`;

const DropZone = styled.div<{ $isDragOver: boolean; $hasFile: boolean }>`
  border: 2px dashed
    ${({ $isDragOver, $hasFile }) =>
      $hasFile ? "#10b981" : $isDragOver ? "#3b82f6" : "#d1d5db"};
  border-radius: 0.5rem;
  padding: 1.5rem 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: ${({ $isDragOver, $hasFile }) =>
    $hasFile ? "#f0fdf4" : $isDragOver ? "#f0f9ff" : "#f9fafb"};
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  @media (min-width: 768px) {
    padding: 3rem 2rem;
    min-height: 200px;
  }

  &:hover {
    border-color: #3b82f6;
    background: #f0f9ff;
  }
`;

const UploadIcon = styled.div<{ $hasFile: boolean }>`
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: ${({ $hasFile }) => ($hasFile ? "#10b981" : "#6b7280")};

  @media (min-width: 768px) {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
`;

const FileInput = styled.input`
  display: none;
`;

const FileInfo = styled.div`
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 0.375rem;
  border: 1px solid #e2e8f0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
`;

const FileName = styled.div`
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.5rem;
  word-break: break-word;
  font-size: 0.875rem;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const FileDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  color: #64748b;
  font-size: 0.75rem;

  @media (min-width: 480px) {
    flex-direction: row;
    gap: 1rem;
  }

  @media (min-width: 768px) {
    font-size: 0.875rem;
  }
`;

const ProgressBar = styled.div<{ $progress: number }>`
  width: 100%;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  margin-top: 1rem;
  overflow: hidden;

  &::after {
    content: "";
    display: block;
    height: 100%;
    width: ${({ $progress }) => $progress}%;
    background: #3b82f6;
    transition: width 0.3s ease;
  }
`;

const Button = styled.button<{ $variant?: "primary" | "secondary" | "danger" }>`
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  flex: 1;
  min-width: 0;

  ${({ $variant }) => {
    switch ($variant) {
      case "primary":
        return `
          background: #3b82f6;
          color: white;
          &:hover:not(:disabled) {
            background: #2563eb;
          }
        `;
      case "danger":
        return `
          background: #ef4444;
          color: white;
          &:hover:not(:disabled) {
            background: #dc2626;
          }
        `;
      default:
        return `
          background: #6b7280;
          color: white;
          &:hover:not(:disabled) {
            background: #4b5563;
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (min-width: 768px) {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    flex: 0 1 auto;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
  width: 100%;

  @media (min-width: 480px) {
    flex-direction: row;
    flex-wrap: wrap;
  }

  @media (min-width: 768px) {
    margin-top: 2rem;
    gap: 1rem;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 0.75rem;
  width: 100%;

  @media (min-width: 480px) {
    width: auto;
    flex: 1;
  }
`;

const RequirementsCard = styled(Card)`
  background: #fffbeb;
  border-color: #fef3c7;
`;

const RequirementList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const RequirementItem = styled.li`
  padding: 0.5rem 0;
  color: #b45309;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.4;

  &::before {
    content: "•";
    color: #d97706;
    font-weight: bold;
    flex-shrink: 0;
  }

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const HistorySection = styled.div`
  width: 100%;
  margin-top: 1.5rem;

  @media (min-width: 768px) {
    margin-top: 2rem;
  }
`;

const HistoryTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;

  @media (min-width: 768px) {
    font-size: 0.875rem;
  }
`;

const TableHeader = styled.th`
  text-align: left;
  padding: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;

  @media (min-width: 768px) {
    padding: 0.75rem;
  }
`;

const TableCell = styled.td`
  padding: 0.5rem;
  border-bottom: 1px solid #f3f4f6;
  word-break: break-word;

  @media (min-width: 768px) {
    padding: 0.75rem;
  }
`;

const StatusBadge = styled.span<{ $status: string }>`
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.625rem;
  font-weight: 600;
  white-space: nowrap;

  ${({ $status }) => {
    switch ($status) {
      case "COMPLETED":
        return "background: #d1fae5; color: #065f46;";
      case "PROCESSING":
        return "background: #fef3c7; color: #92400e;";
      case "FAILED":
        return "background: #fee2e2; color: #991b1b;";
      case "PARTIAL":
        return "background: #fef3c7; color: #92400e;";
      case "PENDING":
        return "background: #f3f4f6; color: #374151;";
      default:
        return "background: #f3f4f6; color: #374151;";
    }
  }}

  @media (min-width: 768px) {
    font-size: 0.75rem;
    padding: 0.25rem 0.75rem;
  }
`;

const ErrorMessage = styled.div`
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 0.75rem;
  border-radius: 0.375rem;
  margin-top: 1rem;
  font-size: 0.875rem;
  line-height: 1.4;

  @media (min-width: 768px) {
    padding: 1rem;
    font-size: 1rem;
  }
`;

const SuccessMessage = styled.div`
  color: #065f46;
  background: #d1fae5;
  border: 1px solid #a7f3d0;
  padding: 0.75rem;
  border-radius: 0.375rem;
  margin-top: 1rem;
  font-size: 0.875rem;
  line-height: 1.4;

  @media (min-width: 768px) {
    padding: 1rem;
    font-size: 1rem;
  }
`;

const ErrorState = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 1rem;
  border-radius: 0.5rem;
  text-align: center;
  margin: 1.5rem 0;

  @media (min-width: 768px) {
    padding: 1.5rem;
    margin: 2rem 0;
  }
`;

// COMMENTED OUT: Debug info component - kept for future debugging needs
/*
const DebugInfo = styled.div`
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  padding: 0.75rem;
  border-radius: 0.375rem;
  margin-top: 1rem;
  font-family: monospace;
  font-size: 0.75rem;
  color: #374151;
  overflow-x: auto;
  max-height: 200px;
  overflow-y: auto;

  @media (min-width: 768px) {
    padding: 1rem;
    font-size: 0.875rem;
  }
`;
*/

// Mobile responsive table wrapper
const TableWrapper = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
  margin: 0 -1rem;
  padding: 0 1rem;

  @media (min-width: 768px) {
    margin: 0;
    padding: 0;
  }
`;

// Main Component
const CSVImport = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importHistory, setImportHistory] = useState<BarImportHistory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  // COMMENTED OUT: Debug state - kept for future debugging needs
  // const [debugInfo, setDebugInfo] = useState("");

  const router = useRouter();

  // Token handling
  const getToken = (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("hoppr_token");
    }
    return null;
  };

  // COMMENTED OUT: Enhanced debug function - kept for future debugging needs
  /*
  const checkAuthStatus = async () => {
    const token = getToken();
    const user = typeof window !== "undefined" ? localStorage.getItem("hoppr_user") : null;

    let debugText = "🔐 AUTH STATUS CHECK:\n";
    debugText += `Token exists: ${!!token}\n`;
    debugText += `User data exists: ${!!user}\n`;
    debugText += `Token value: ${token}\n`;

    if (user) {
      try {
        const userData = JSON.parse(user);
        debugText += `User data: ${JSON.stringify(userData, null, 2)}\n`;
      } catch (e) {
        debugText += `Failed to parse user data: ${e}\n`;
      }
    }

    // Test the debug endpoint
    if (token) {
      try {
        debugText += "\n🔐 TESTING DEBUG ENDPOINT:\n";
        const response = await fetch("/api/auth/admin/debug", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        debugText += `Debug endpoint status: ${response.status}\n`;
        debugText += `Debug response: ${JSON.stringify(result, null, 2)}\n`;
      } catch (e) {
        debugText += `Debug endpoint error: ${e}\n`;
      }
    }

    console.log(debugText);
    setDebugInfo(debugText);
  };
  */

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setError(null);
    setSuccess(null);
    setAuthError(null);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        setSelectedFile(file);
      } else {
        setError("Please select a CSV file");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      setError(null);
      setSuccess(null);
      setAuthError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const token = getToken();
    console.log("🔍 DEBUG UPLOAD STARTED");
    console.log("🔍 Token exists:", !!token);
    console.log(
      "🔍 File:",
      selectedFile.name,
      selectedFile.size,
      selectedFile.type
    );

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("csvFile", selectedFile);

      // Test the API endpoint first
      console.log("🔍 Testing API endpoint...");
      const testResponse = await fetch("/api/auth/admin/bars/import", {
        method: "HEAD",
      });
      console.log("🔍 API endpoint status:", testResponse.status);

      // Now do the actual upload
      console.log("🔍 Starting actual upload...");
      const response = await fetch("/api/auth/admin/bars/import", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      console.log("🔍 Upload response status:", response.status);
      console.log("🔍 Upload response ok:", response.ok);

      const result = await response.json();
      console.log("🔍 Upload result:", result);

      if (!response.ok) {
        throw new Error(result.error || `Upload failed: ${response.status}`);
      }

      setSuccess(`Successfully imported ${result.imported} bars!`);
      fetchImportHistory();
    } catch (error) {
      console.error("❌ UPLOAD ERROR:", error);
      setError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  // const handleUpload = async () => {
  //   if (!selectedFile) return;

  //   // COMMENTED OUT: Debug check - kept for future debugging needs
  //   // await checkAuthStatus();

  //   const token = getToken();
  //   if (!token) {
  //     setAuthError("No authentication token found. Please log in.");
  //     return;
  //   }

  //   setIsUploading(true);
  //   setUploadProgress(0);
  //   setError(null);
  //   setSuccess(null);
  //   setAuthError(null);

  //   try {
  //     const formData = new FormData();
  //     formData.append("csvFile", selectedFile);

  //     console.log("📤 Starting upload...");
  //     console.log("Token being sent:", token);
  //     console.log("File:", selectedFile.name);

  //     const response = await fetch("/api/auth/admin/bars/import", {
  //       method: "POST",
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: formData,
  //     });

  //     // Simulate progress
  //     const progressInterval = setInterval(() => {
  //       setUploadProgress((prev) => {
  //         if (prev >= 90) {
  //           clearInterval(progressInterval);
  //           return 90;
  //         }
  //         return prev + 10;
  //       });
  //     }, 200);

  //     const result = await response.json();
  //     clearInterval(progressInterval);
  //     setUploadProgress(100);

  //     console.log("📥 Upload response:", {
  //       status: response.status,
  //       ok: response.ok,
  //       result,
  //     });

  //     if (response.status === 401) {
  //       console.log("❌ Token rejected, clearing auth data...");
  //       if (typeof window !== "undefined") {
  //         localStorage.removeItem("hoppr_token");
  //         localStorage.removeItem("hoppr_user");
  //       }
  //       document.cookie =
  //         "hoppr_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  //       document.cookie =
  //         "hoppr_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  //       throw new Error("Your session has expired. Please log in again.");
  //     }

  //     if (!response.ok) {
  //       throw new Error(
  //         result.error || result.message || `Import failed: ${response.status}`
  //       );
  //     }

  //     const successMessage = `Successfully imported ${result.imported} bars!${
  //       result.failed > 0 ? ` ${result.failed} failed.` : ""
  //     }`;

  //     setSuccess(successMessage);
  //     fetchImportHistory();

  //     setTimeout(() => {
  //       router.push("/admin/bars");
  //     }, 2000);
  //   } catch (error) {
  //     console.error("Upload error:", error);
  //     const errorMessage =
  //       error instanceof Error
  //         ? error.message
  //         : "Upload failed - please try again";

  //     if (
  //       errorMessage.includes("session") ||
  //       errorMessage.includes("authentication") ||
  //       errorMessage.includes("token") ||
  //       errorMessage.includes("log in")
  //     ) {
  //       setAuthError(errorMessage);
  //     } else {
  //       setError(errorMessage);
  //     }
  //   } finally {
  //     setIsUploading(false);
  //   }
  // };

  const fetchImportHistory = async () => {
    try {
      setLoading(true);
      const token = getToken();

      if (!token) {
        setAuthError("No authentication token found. Please log in.");
        return;
      }

      console.log("📋 Fetching import history with token:", token);

      const response = await fetch("/api/auth/admin/bars/import/history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("📋 History response status:", response.status);

      if (response.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("hoppr_token");
          localStorage.removeItem("hoppr_user");
        }
        setAuthError("Your session has expired. Please log in again.");
        return;
      }

      if (response.status === 404) {
        console.log("Import history endpoint not found, skipping...");
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch import history: ${response.status}`);
      }

      const result = await response.json();
      setImportHistory(result.imports || []);
    } catch (error) {
      console.error("Failed to fetch import history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setAuthError(null);
    setError(null);
    fetchImportHistory();
  };

  const handleLogin = () => {
    router.push("/admin/login");
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Load import history on component mount
  useEffect(() => {
    console.log("🔐 Component mounted, checking auth...");
    // COMMENTED OUT: Debug check - kept for future debugging needs
    // checkAuthStatus();
    fetchImportHistory();
  }, []);

  // Show error state
  if (authError) {
    return (
      <Container>
        <Header>
          <BackButton href="/admin/bars">← Back to Bars</BackButton>
          <Title>Import Bars from CSV</Title>
          <Subtitle>
            Bulk import bars using a CSV file. Download the template below to
            get started.
          </Subtitle>
        </Header>

        <ErrorState>
          <h3 style={{ marginBottom: "1rem" }}>Authentication Required</h3>
          <p style={{ marginBottom: "1rem" }}>{authError}</p>
          {/* COMMENTED OUT: Debug info display - kept for future debugging needs */}
          {/* <DebugInfo>{debugInfo}</DebugInfo> */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              justifyContent: "center",
              marginTop: "1rem",
              width: "100%",
            }}
          >
            <Button $variant="primary" onClick={handleLogin}>
              🔐 Go to Login
            </Button>
            <Button $variant="secondary" onClick={handleRetry}>
              🔄 Try Again
            </Button>
          </div>
        </ErrorState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <BackButton href="/admin/bars">← Back to Bars</BackButton>
        <Title>Import Bars from CSV</Title>
        <Subtitle>
          Bulk import bars using a CSV file. Download the template below to get
          started.
        </Subtitle>
      </Header>

      <Grid>
        <UploadSection>
          <Card>
            <DropZone
              $isDragOver={isDragOver}
              $hasFile={!!selectedFile}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("csv-file-input")?.click()}
            >
              <UploadIcon $hasFile={!!selectedFile}>
                {selectedFile ? "✅" : "📁"}
              </UploadIcon>

              {selectedFile ? (
                <FileInfo>
                  <FileName>📄 {selectedFile.name}</FileName>
                  <FileDetails>
                    <span>Size: {formatFileSize(selectedFile.size)}</span>
                    <span>Type: CSV</span>
                  </FileDetails>
                  {isUploading && <ProgressBar $progress={uploadProgress} />}
                </FileInfo>
              ) : (
                <div>
                  <p
                    style={{
                      fontWeight: 600,
                      marginBottom: "0.5rem",
                      fontSize: "1rem",
                    }}
                  >
                    Drop CSV file here or click to browse
                  </p>
                  <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                    Supports .csv files up to 10MB
                  </p>
                </div>
              )}

              <FileInput
                id="csv-file-input"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
              />
            </DropZone>

            {error && <ErrorMessage>{error}</ErrorMessage>}

            {success && (
              <SuccessMessage>
                {success} Redirecting back to bars list...
              </SuccessMessage>
            )}

            <ButtonGroup>
              <ButtonRow>
                <Button
                  $variant="primary"
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                >
                  {isUploading ? (
                    <>
                      <span>Uploading... {uploadProgress}%</span>
                    </>
                  ) : (
                    "Import Bars"
                  )}
                </Button>

                {selectedFile && !isUploading && (
                  <Button
                    $variant="secondary"
                    onClick={() => {
                      setSelectedFile(null);
                      setError(null);
                      setSuccess(null);
                    }}
                  >
                    Clear
                  </Button>
                )}
              </ButtonRow>

              <ButtonRow>
                <a
                  href="/templates/bars-import-template.csv"
                  download
                  style={{ display: "flex", flex: 1, textDecoration: "none" }}
                >
                  <Button $variant="secondary">Download Template</Button>
                </a>

                {/* COMMENTED OUT: Debug button - kept for future debugging needs */}
                {/* <Button $variant="secondary" onClick={checkAuthStatus}>
                  🔍 Debug
                </Button> */}
              </ButtonRow>
            </ButtonGroup>

            {/* COMMENTED OUT: Debug info display - kept for future debugging needs */}
            {/* {debugInfo && <DebugInfo>{debugInfo}</DebugInfo>} */}
          </Card>
        </UploadSection>

        <RequirementsCard>
          <h3
            style={{
              marginBottom: "1rem",
              color: "#92400e",
              fontSize: "1.125rem",
            }}
          >
            CSV Format Requirements
          </h3>
          <RequirementList>
            <RequirementItem>
              <strong>Required fields:</strong> name, type, address, city
            </RequirementItem>
            <RequirementItem>
              <strong>Bar types:</strong> PUB, CLUB, LOUNGE, COCKTAIL_BAR,
              RESTAURANT_BAR, SPORTS_BAR, KARAOKE, LIVE_MUSIC
            </RequirementItem>
            <RequirementItem>
              <strong>Price ranges:</strong> BUDGET, MODERATE, PREMIUM, LUXURY
            </RequirementItem>
            <RequirementItem>
              <strong>Location:</strong> Include both latitude and longitude for
              mapping
            </RequirementItem>
            <RequirementItem>
              <strong>Arrays:</strong> Separate multiple values with commas
            </RequirementItem>
            <RequirementItem>
              <strong>Operating hours:</strong> Use JSON format
            </RequirementItem>
            <RequirementItem>
              <strong>File encoding:</strong> UTF-8 recommended
            </RequirementItem>
          </RequirementList>
        </RequirementsCard>

        {importHistory.length > 0 && (
          <HistorySection>
            <h3 style={{ marginBottom: "1rem" }}>Import History</h3>
            <Card>
              <TableWrapper>
                <HistoryTable>
                  <thead>
                    <tr>
                      <TableHeader>File Name</TableHeader>
                      <TableHeader>Date</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>Imported</TableHeader>
                      <TableHeader>Failed</TableHeader>
                      <TableHeader>Total</TableHeader>
                    </tr>
                  </thead>
                  <tbody>
                    {importHistory.map((importItem) => (
                      <tr key={importItem.id}>
                        <TableCell>{importItem.fileName}</TableCell>
                        <TableCell>
                          {formatDate(importItem.createdAt)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge $status={importItem.status}>
                            {importItem.status}
                          </StatusBadge>
                        </TableCell>
                        <TableCell>{importItem.importedRows}</TableCell>
                        <TableCell>{importItem.failedRows}</TableCell>
                        <TableCell>{importItem.totalRows}</TableCell>
                      </tr>
                    ))}
                  </tbody>
                </HistoryTable>
              </TableWrapper>
            </Card>
          </HistorySection>
        )}
      </Grid>
    </Container>
  );
};

export default CSVImport;
