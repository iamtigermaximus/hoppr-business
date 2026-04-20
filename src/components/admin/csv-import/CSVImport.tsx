// // src/components/admin/csv-import/CSVImport.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import styled from "styled-components";
// import Link from "next/link";

// // Types
// interface BarImportHistory {
//   id: string;
//   fileName: string;
//   fileSize: number;
//   totalRows: number;
//   importedRows: number;
//   failedRows: number;
//   status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "PARTIAL";
//   errors?: string[];
//   importedBy: string;
//   createdAt: string;
//   updatedAt: string;
// }

// // Styled Components (keep all your existing styled components)
// const Container = styled.div`
//   max-width: 1400px;
//   margin: 0 auto;
//   padding: 1rem;

//   @media (min-width: 768px) {
//     padding: 2rem;
//   }
// `;

// const Header = styled.div`
//   margin-bottom: 2rem;
// `;

// const BackButton = styled(Link)`
//   display: inline-flex;
//   align-items: center;
//   gap: 0.5rem;
//   color: #3b82f6;
//   text-decoration: none;
//   font-weight: 500;
//   margin-bottom: 1rem;
//   padding: 0.5rem 0;
//   min-height: 44px;

//   &:hover {
//     color: #2563eb;
//   }
// `;

// const Title = styled.h1`
//   font-size: 1.5rem;
//   font-weight: 700;
//   color: #1f2937;
//   margin-bottom: 0.5rem;
//   line-height: 1.2;

//   @media (min-width: 768px) {
//     font-size: 2rem;
//   }
// `;

// const Subtitle = styled.p`
//   color: #6b7280;
//   font-size: 0.875rem;
//   line-height: 1.4;

//   @media (min-width: 768px) {
//     font-size: 1rem;
//   }
// `;

// const StatsGrid = styled.div`
//   display: grid;
//   grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
//   gap: 1rem;
//   margin-bottom: 2rem;
// `;

// const StatCard = styled.div<{ $color?: string }>`
//   background: white;
//   border-radius: 0.5rem;
//   padding: 1rem;
//   box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
//   border: 1px solid #e5e7eb;
//   border-top: 4px solid ${({ $color }) => $color || "#3b82f6"};
// `;

// const StatValue = styled.div`
//   font-size: 1.5rem;
//   font-weight: 700;
//   color: #1f2937;
//   margin-bottom: 0.25rem;

//   @media (min-width: 768px) {
//     font-size: 2rem;
//   }
// `;

// const StatLabel = styled.div`
//   color: #6b7280;
//   font-size: 0.75rem;
//   font-weight: 500;

//   @media (min-width: 768px) {
//     font-size: 0.875rem;
//   }
// `;

// const TwoColumnLayout = styled.div`
//   display: flex;
//   flex-direction: column;
//   gap: 2rem;

//   @media (min-width: 1024px) {
//     display: grid;
//     grid-template-columns: 1fr 1.5fr;
//     gap: 2rem;
//   }
// `;

// const Card = styled.div`
//   background: white;
//   border-radius: 0.5rem;
//   padding: 1rem;
//   box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
//   border: 1px solid #e5e7eb;

//   @media (min-width: 768px) {
//     padding: 1.5rem;
//   }
// `;

// const CardTitle = styled.h2`
//   font-size: 1.125rem;
//   font-weight: 600;
//   color: #1f2937;
//   margin-bottom: 1rem;
//   padding-bottom: 0.5rem;
//   border-bottom: 2px solid #e5e7eb;

//   @media (min-width: 768px) {
//     font-size: 1.25rem;
//   }
// `;

// const DropZone = styled.div<{ $isDragOver: boolean; $hasFile: boolean }>`
//   border: 2px dashed
//     ${({ $isDragOver, $hasFile }) =>
//       $hasFile ? "#10b981" : $isDragOver ? "#3b82f6" : "#d1d5db"};
//   border-radius: 0.5rem;
//   padding: 1.5rem 1rem;
//   text-align: center;
//   cursor: pointer;
//   transition: all 0.2s;
//   background: ${({ $isDragOver, $hasFile }) =>
//     $hasFile ? "#f0fdf4" : $isDragOver ? "#f0f9ff" : "#f9fafb"};
//   min-height: 120px;
//   display: flex;
//   flex-direction: column;
//   justify-content: center;
//   align-items: center;

//   @media (min-width: 768px) {
//     padding: 2rem;
//     min-height: 160px;
//   }

//   &:hover {
//     border-color: #3b82f6;
//     background: #f0f9ff;
//   }
// `;

// const FileInfo = styled.div`
//   margin-top: 1rem;
//   padding: 0.75rem;
//   background: #f8fafc;
//   border-radius: 0.375rem;
//   border: 1px solid #e2e8f0;
//   width: 100%;
// `;

// const FileName = styled.div`
//   font-weight: 600;
//   color: #1e293b;
//   margin-bottom: 0.5rem;
//   word-break: break-word;
// `;

// const FileDetails = styled.div`
//   display: flex;
//   gap: 1rem;
//   color: #64748b;
//   font-size: 0.75rem;
//   flex-wrap: wrap;
// `;

// const ProgressBar = styled.div<{ $progress: number }>`
//   width: 100%;
//   height: 8px;
//   background: #e5e7eb;
//   border-radius: 4px;
//   margin-top: 1rem;
//   overflow: hidden;

//   &::after {
//     content: "";
//     display: block;
//     height: 100%;
//     width: ${({ $progress }) => $progress}%;
//     background: #3b82f6;
//     transition: width 0.3s ease;
//   }
// `;

// const Button = styled.button<{ $variant?: "primary" | "secondary" | "danger" }>`
//   padding: 0.5rem 1rem;
//   border: none;
//   border-radius: 0.375rem;
//   font-weight: 600;
//   cursor: pointer;
//   transition: all 0.2s;
//   min-height: 40px;
//   display: inline-flex;
//   align-items: center;
//   gap: 0.5rem;
//   font-size: 0.875rem;

//   ${({ $variant }) => {
//     switch ($variant) {
//       case "primary":
//         return `
//           background: #3b82f6;
//           color: white;
//           &:hover:not(:disabled) { background: #2563eb; }
//         `;
//       case "danger":
//         return `
//           background: #ef4444;
//           color: white;
//           &:hover:not(:disabled) { background: #dc2626; }
//         `;
//       default:
//         return `
//           background: #6b7280;
//           color: white;
//           &:hover:not(:disabled) { background: #4b5563; }
//         `;
//     }
//   }}

//   &:disabled {
//     opacity: 0.6;
//     cursor: not-allowed;
//   }
// `;

// const ButtonGroup = styled.div`
//   display: flex;
//   gap: 0.75rem;
//   margin-top: 1rem;
//   flex-wrap: wrap;
// `;

// const Alert = styled.div<{ $type?: "success" | "error" | "warning" }>`
//   padding: 0.75rem;
//   border-radius: 0.375rem;
//   margin-bottom: 1rem;
//   font-size: 0.875rem;

//   ${({ $type }) => {
//     switch ($type) {
//       case "success":
//         return `
//           background: #dcfce7;
//           border: 1px solid #bbf7d0;
//           color: #166534;
//         `;
//       case "error":
//         return `
//           background: #fee2e2;
//           border: 1px solid #fecaca;
//           color: #dc2626;
//         `;
//       default:
//         return `
//           background: #fef3c7;
//           border: 1px solid #fde68a;
//           color: #92400e;
//         `;
//     }
//   }}
// `;

// const TableWrapper = styled.div`
//   overflow-x: auto;
// `;

// const HistoryTable = styled.table`
//   width: 100%;
//   border-collapse: collapse;
//   font-size: 0.75rem;

//   @media (min-width: 768px) {
//     font-size: 0.875rem;
//   }
// `;

// const Th = styled.th`
//   text-align: left;
//   padding: 0.75rem 0.5rem;
//   background: #f8f9fa;
//   font-weight: 600;
//   color: #374151;
//   border-bottom: 1px solid #e5e7eb;
// `;

// const Td = styled.td`
//   padding: 0.75rem 0.5rem;
//   border-bottom: 1px solid #f3f4f6;
//   vertical-align: middle;
// `;

// const StatusBadge = styled.span<{ $status: string }>`
//   display: inline-block;
//   padding: 0.25rem 0.5rem;
//   border-radius: 9999px;
//   font-size: 0.625rem;
//   font-weight: 600;
//   white-space: nowrap;

//   ${({ $status }) => {
//     switch ($status) {
//       case "COMPLETED":
//         return "background: #d1fae5; color: #065f46;";
//       case "PROCESSING":
//         return "background: #fef3c7; color: #92400e;";
//       case "FAILED":
//         return "background: #fee2e2; color: #991b1b;";
//       case "PARTIAL":
//         return "background: #fef3c7; color: #92400e;";
//       default:
//         return "background: #f3f4f6; color: #374151;";
//     }
//   }}
// `;

// const DetailButton = styled.button`
//   background: #f3f4f6;
//   border: 1px solid #d1d5db;
//   border-radius: 0.25rem;
//   padding: 0.25rem 0.5rem;
//   font-size: 0.7rem;
//   cursor: pointer;
//   color: #374151;

//   &:hover {
//     background: #e5e7eb;
//   }
// `;

// const ModalOverlay = styled.div`
//   position: fixed;
//   top: 0;
//   left: 0;
//   right: 0;
//   bottom: 0;
//   background: rgba(0, 0, 0, 0.5);
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   z-index: 1000;
//   padding: 1rem;
// `;

// const ModalContent = styled.div`
//   background: white;
//   border-radius: 0.5rem;
//   max-width: 600px;
//   width: 100%;
//   max-height: 80vh;
//   overflow: auto;
//   padding: 1.5rem;
// `;

// const ModalTitle = styled.h3`
//   font-size: 1.125rem;
//   font-weight: 600;
//   color: #1f2937;
//   margin-bottom: 1rem;
// `;

// const ErrorList = styled.div`
//   margin: 1rem 0;
//   max-height: 300px;
//   overflow: auto;
// `;

// const ErrorItem = styled.div`
//   padding: 0.5rem;
//   border-bottom: 1px solid #e5e7eb;
//   font-size: 0.875rem;
//   font-family: monospace;
//   color: #dc2626;
// `;

// const FileInput = styled.input`
//   display: none;
// `;

// const CSVImport = () => {
//   const router = useRouter();
//   const [isDragOver, setIsDragOver] = useState(false);
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [isUploading, setIsUploading] = useState(false);
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [importHistory, setImportHistory] = useState<BarImportHistory[]>([]);
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [lastImportResult, setLastImportResult] = useState<any>(null);
//   const [showDetailsModal, setShowDetailsModal] = useState(false);
//   const [selectedImport, setSelectedImport] = useState<BarImportHistory | null>(
//     null,
//   );

//   const getToken = (): string | null => {
//     if (typeof window !== "undefined") {
//       return localStorage.getItem("hoppr_token");
//     }
//     return null;
//   };

//   const stats = {
//     totalImports: importHistory.length,
//     totalBarsImported: importHistory.reduce(
//       (sum, i) => sum + i.importedRows,
//       0,
//     ),
//     successfulImports: importHistory.filter((i) => i.status === "COMPLETED")
//       .length,
//     failedImports: importHistory.filter((i) => i.status === "FAILED").length,
//     partialImports: importHistory.filter((i) => i.status === "PARTIAL").length,
//   };

//   const handleDragOver = (e: React.DragEvent) => {
//     e.preventDefault();
//     setIsDragOver(true);
//   };

//   const handleDragLeave = (e: React.DragEvent) => {
//     e.preventDefault();
//     setIsDragOver(false);
//   };

//   const handleDrop = (e: React.DragEvent) => {
//     e.preventDefault();
//     setIsDragOver(false);
//     setError(null);
//     setSuccess(null);
//     setLastImportResult(null);

//     const files = e.dataTransfer.files;
//     if (files.length > 0) {
//       const file = files[0];
//       if (file.type === "text/csv" || file.name.endsWith(".csv")) {
//         setSelectedFile(file);
//       } else {
//         setError("Please select a CSV file");
//       }
//     }
//   };

//   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const files = e.target.files;
//     if (files && files.length > 0) {
//       setSelectedFile(files[0]);
//       setError(null);
//       setSuccess(null);
//       setLastImportResult(null);
//     }
//   };

//   const handleUpload = async () => {
//     if (!selectedFile) return;

//     const token = getToken();
//     if (!token) {
//       setError("No authentication token found. Please log in.");
//       return;
//     }

//     setIsUploading(true);
//     setUploadProgress(0);
//     setError(null);
//     setSuccess(null);
//     setLastImportResult(null);

//     try {
//       const formData = new FormData();
//       formData.append("csvFile", selectedFile);

//       const progressInterval = setInterval(() => {
//         setUploadProgress((prev) => Math.min(prev + 10, 90));
//       }, 200);

//       const response = await fetch("/api/auth/admin/bars/import", {
//         method: "POST",
//         headers: { Authorization: `Bearer ${token}` },
//         body: formData,
//       });

//       clearInterval(progressInterval);
//       setUploadProgress(100);

//       const result = await response.json();

//       if (response.status === 401) {
//         localStorage.removeItem("hoppr_token");
//         localStorage.removeItem("hoppr_user");
//         throw new Error("Your session has expired. Please log in again.");
//       }

//       if (!response.ok) {
//         throw new Error(result.error || `Import failed: ${response.status}`);
//       }

//       setLastImportResult(result);

//       let message = `✅ Successfully imported ${result.imported} new bars!`;
//       if (result.skipped > 0) {
//         message += ` ⏭️ Skipped ${result.skipped} duplicates.`;
//       }
//       setSuccess(message);

//       fetchImportHistory();
//       setSelectedFile(null);
//     } catch (error) {
//       console.error("Upload error:", error);
//       setError(error instanceof Error ? error.message : "Upload failed");
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   const fetchImportHistory = async () => {
//     try {
//       setLoading(true);
//       const token = getToken();
//       if (!token) return;

//       const response = await fetch("/api/auth/admin/bars/import/history", {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (response.ok) {
//         const data = await response.json();
//         setImportHistory(data.imports || []);
//       }
//     } catch (error) {
//       console.error("Failed to fetch import history:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatDate = (dateString: string): string => {
//     return new Date(dateString).toLocaleDateString("en-US", {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   const formatFileSize = (bytes: number): string => {
//     if (bytes === 0) return "0 Bytes";
//     const k = 1024;
//     const sizes = ["Bytes", "KB", "MB", "GB"];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
//   };

//   const handleViewDetails = (importItem: BarImportHistory) => {
//     setSelectedImport(importItem);
//     setShowDetailsModal(true);
//   };

//   useEffect(() => {
//     fetchImportHistory();
//   }, []);

//   return (
//     <Container>
//       <Header>
//         <BackButton href="/admin/bars">← Back to Bars</BackButton>
//         <Title>CSV Import</Title>
//         <Subtitle>
//           Bulk import bars from CSV files. View your import history below.
//         </Subtitle>
//       </Header>

//       {/* Stats Overview */}
//       <StatsGrid>
//         <StatCard $color="#3b82f6">
//           <StatValue>{stats.totalImports}</StatValue>
//           <StatLabel>Total Imports</StatLabel>
//         </StatCard>
//         <StatCard $color="#10b981">
//           <StatValue>{stats.totalBarsImported}</StatValue>
//           <StatLabel>Bars Imported</StatLabel>
//         </StatCard>
//         <StatCard $color="#10b981">
//           <StatValue>{stats.successfulImports}</StatValue>
//           <StatLabel>Successful</StatLabel>
//         </StatCard>
//         <StatCard $color="#f59e0b">
//           <StatValue>{stats.partialImports}</StatValue>
//           <StatLabel>Partial</StatLabel>
//         </StatCard>
//         <StatCard $color="#ef4444">
//           <StatValue>{stats.failedImports}</StatValue>
//           <StatLabel>Failed</StatLabel>
//         </StatCard>
//       </StatsGrid>

//       <TwoColumnLayout>
//         {/* Left Column - Upload Section */}
//         <div>
//           <Card>
//             <CardTitle>📁 Upload CSV File</CardTitle>

//             <DropZone
//               $isDragOver={isDragOver}
//               $hasFile={!!selectedFile}
//               onDragOver={handleDragOver}
//               onDragLeave={handleDragLeave}
//               onDrop={handleDrop}
//               onClick={() => document.getElementById("csv-file-input")?.click()}
//             >
//               <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
//                 {selectedFile ? "✅" : "📁"}
//               </div>
//               {selectedFile ? (
//                 <FileInfo>
//                   <FileName>📄 {selectedFile.name}</FileName>
//                   <FileDetails>
//                     <span>Size: {formatFileSize(selectedFile.size)}</span>
//                     <span>Type: CSV</span>
//                   </FileDetails>
//                   {isUploading && <ProgressBar $progress={uploadProgress} />}
//                 </FileInfo>
//               ) : (
//                 <div>
//                   <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
//                     Drop CSV file here or click to browse
//                   </p>
//                   <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
//                     Supports .csv files up to 10MB
//                   </p>
//                 </div>
//               )}
//               <FileInput
//                 id="csv-file-input"
//                 type="file"
//                 accept=".csv"
//                 onChange={handleFileSelect}
//               />
//             </DropZone>

//             {error && <Alert $type="error">{error}</Alert>}
//             {success && <Alert $type="success">{success}</Alert>}

//             {/* Import Results Summary */}
//             {lastImportResult && (
//               <Alert
//                 $type={lastImportResult.skipped > 0 ? "warning" : "success"}
//               >
//                 <strong>Import Summary:</strong>
//                 <ul
//                   style={{
//                     marginTop: "0.5rem",
//                     marginBottom: 0,
//                     paddingLeft: "1.5rem",
//                   }}
//                 >
//                   <li>✅ Imported: {lastImportResult.imported} bars</li>
//                   <li>⏭️ Skipped: {lastImportResult.skipped} duplicates</li>
//                   <li>📊 Total processed: {lastImportResult.total} rows</li>
//                 </ul>
//               </Alert>
//             )}

//             <ButtonGroup>
//               <Button
//                 $variant="primary"
//                 onClick={handleUpload}
//                 disabled={!selectedFile || isUploading}
//               >
//                 {isUploading ? `Uploading... ${uploadProgress}%` : "Import CSV"}
//               </Button>
//               {selectedFile && !isUploading && (
//                 <Button
//                   $variant="secondary"
//                   onClick={() => setSelectedFile(null)}
//                 >
//                   Clear
//                 </Button>
//               )}
//               <a
//                 href="/templates/bars-import-template.csv"
//                 download
//                 style={{ textDecoration: "none" }}
//               >
//                 <Button $variant="secondary">📥 Download Template</Button>
//               </a>
//             </ButtonGroup>
//           </Card>

//           {/* CSV Requirements */}
//           <Card style={{ marginTop: "1rem" }}>
//             <CardTitle>📋 CSV Format Requirements</CardTitle>
//             <ul
//               style={{
//                 margin: 0,
//                 paddingLeft: "1.25rem",
//                 color: "#6b7280",
//                 fontSize: "0.875rem",
//               }}
//             >
//               <li>
//                 <strong>Required:</strong> name, type, address, city
//               </li>
//               <li>
//                 <strong>Bar types:</strong> PUB, CLUB, LOUNGE, COCKTAIL_BAR,
//                 RESTAURANT_BAR, SPORTS_BAR, KARAOKE, LIVE_MUSIC
//               </li>
//               <li>
//                 <strong>Price ranges:</strong> BUDGET, MODERATE, PREMIUM, LUXURY
//               </li>
//               <li>
//                 <strong>Arrays:</strong> Separate with commas (amenities,
//                 imageUrls)
//               </li>
//               <li>
//                 <strong>Operating hours:</strong> JSON format
//               </li>
//             </ul>
//           </Card>
//         </div>

//         {/* Right Column - History Section */}
//         <div>
//           <Card>
//             <CardTitle>📜 Import History</CardTitle>

//             {loading ? (
//               <div
//                 style={{
//                   textAlign: "center",
//                   padding: "2rem",
//                   color: "#6b7280",
//                 }}
//               >
//                 Loading history...
//               </div>
//             ) : importHistory.length === 0 ? (
//               <div
//                 style={{
//                   textAlign: "center",
//                   padding: "2rem",
//                   color: "#6b7280",
//                 }}
//               >
//                 <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
//                   📭
//                 </div>
//                 <p>No import history yet</p>
//                 <p style={{ fontSize: "0.875rem" }}>
//                   Upload your first CSV file to get started
//                 </p>
//               </div>
//             ) : (
//               <TableWrapper>
//                 <HistoryTable>
//                   <thead>
//                     <tr>
//                       <Th>File Name</Th>
//                       <Th>Date</Th>
//                       <Th>Status</Th>
//                       <Th>Imported</Th>
//                       <Th>Skipped</Th>
//                       <Th>Total</Th>
//                       <Th></Th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {importHistory.map((importItem) => (
//                       <tr key={importItem.id}>
//                         <Td
//                           style={{
//                             maxWidth: "200px",
//                             overflow: "hidden",
//                             textOverflow: "ellipsis",
//                             whiteSpace: "nowrap",
//                           }}
//                         >
//                           {importItem.fileName}
//                         </Td>
//                         <Td style={{ whiteSpace: "nowrap" }}>
//                           {formatDate(importItem.createdAt)}
//                         </Td>
//                         <Td>
//                           <StatusBadge $status={importItem.status}>
//                             {importItem.status}
//                           </StatusBadge>
//                         </Td>
//                         <Td style={{ color: "#065f46", fontWeight: "bold" }}>
//                           {importItem.importedRows}
//                         </Td>
//                         <Td style={{ color: "#92400e" }}>
//                           {importItem.failedRows}
//                         </Td>
//                         <Td>{importItem.totalRows}</Td>
//                         <Td>
//                           {((importItem.errors &&
//                             importItem.errors.length > 0) ||
//                             importItem.failedRows > 0) && (
//                             <DetailButton
//                               onClick={() => handleViewDetails(importItem)}
//                             >
//                               Details
//                             </DetailButton>
//                           )}
//                         </Td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </HistoryTable>
//               </TableWrapper>
//             )}
//           </Card>
//         </div>
//       </TwoColumnLayout>

//       {/* Details Modal */}
//       {showDetailsModal && selectedImport && (
//         <ModalOverlay onClick={() => setShowDetailsModal(false)}>
//           <ModalContent onClick={(e) => e.stopPropagation()}>
//             <ModalTitle>Import Details: {selectedImport.fileName}</ModalTitle>

//             <p>
//               <strong>Date:</strong> {formatDate(selectedImport.createdAt)}
//             </p>
//             <p>
//               <strong>Status:</strong> {selectedImport.status}
//             </p>
//             <p>
//               <strong>Imported:</strong> {selectedImport.importedRows} bars
//             </p>
//             <p>
//               <strong>Skipped:</strong> {selectedImport.failedRows} rows
//             </p>
//             <p>
//               <strong>Total:</strong> {selectedImport.totalRows} rows
//             </p>

//             {selectedImport.errors && selectedImport.errors.length > 0 && (
//               <>
//                 <h4
//                   style={{
//                     marginTop: "1rem",
//                     marginBottom: "0.5rem",
//                     color: "#dc2626",
//                   }}
//                 >
//                   Errors ({selectedImport.errors.length})
//                 </h4>
//                 <ErrorList>
//                   {selectedImport.errors.slice(0, 20).map((error, idx) => (
//                     <ErrorItem key={idx}>{error}</ErrorItem>
//                   ))}
//                   {selectedImport.errors.length > 20 && (
//                     <ErrorItem>
//                       ... and {selectedImport.errors.length - 20} more errors
//                     </ErrorItem>
//                   )}
//                 </ErrorList>
//               </>
//             )}

//             <ButtonGroup
//               style={{ justifyContent: "flex-end", marginTop: "1rem" }}
//             >
//               <Button
//                 $variant="primary"
//                 onClick={() => setShowDetailsModal(false)}
//               >
//                 Close
//               </Button>
//             </ButtonGroup>
//           </ModalContent>
//         </ModalOverlay>
//       )}
//     </Container>
//   );
// };

// export default CSVImport;
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

interface DuplicateInfo {
  row: number;
  name: string;
  reason: "within_file" | "already_in_database";
}

interface ImportResponse {
  success: boolean;
  imported: number;
  skipped: number;
  total: number;
  duplicates: DuplicateInfo[];
  errors: string[];
  message: string;
  status: string;
}

// Styled Components
const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;

  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

const Header = styled.div`
  margin-bottom: 2rem;
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
  min-height: 44px;

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
    font-size: 1rem;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div<{ $color?: string }>`
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  border-top: 4px solid ${({ $color }) => $color || "#3b82f6"};
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;

  @media (min-width: 768px) {
    font-size: 2rem;
  }
`;

const StatLabel = styled.div`
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 500;

  @media (min-width: 768px) {
    font-size: 0.875rem;
  }
`;

const TwoColumnLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;

  @media (min-width: 1024px) {
    display: grid;
    grid-template-columns: 1fr 1.5fr;
    gap: 2rem;
  }
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

const CardTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;

  @media (min-width: 768px) {
    font-size: 1.25rem;
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
    padding: 2rem;
    min-height: 160px;
  }

  &:hover {
    border-color: #3b82f6;
    background: #f0f9ff;
  }
`;

const FileInfo = styled.div`
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 0.375rem;
  border: 1px solid #e2e8f0;
  width: 100%;
`;

const FileName = styled.div`
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.5rem;
  word-break: break-word;
`;

const FileDetails = styled.div`
  display: flex;
  gap: 1rem;
  color: #64748b;
  font-size: 0.75rem;
  flex-wrap: wrap;
`;

const ProgressBar = styled.div<{ $progress: number }>`
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
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
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;

  ${({ $variant }) => {
    switch ($variant) {
      case "primary":
        return `
          background: #3b82f6;
          color: white;
          &:hover:not(:disabled) { background: #2563eb; }
        `;
      case "danger":
        return `
          background: #ef4444;
          color: white;
          &:hover:not(:disabled) { background: #dc2626; }
        `;
      default:
        return `
          background: #6b7280;
          color: white;
          &:hover:not(:disabled) { background: #4b5563; }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`;

const Alert = styled.div<{ $type?: "success" | "error" | "warning" }>`
  padding: 0.75rem;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;

  ${({ $type }) => {
    switch ($type) {
      case "success":
        return `
          background: #dcfce7;
          border: 1px solid #bbf7d0;
          color: #166534;
        `;
      case "error":
        return `
          background: #fee2e2;
          border: 1px solid #fecaca;
          color: #dc2626;
        `;
      default:
        return `
          background: #fef3c7;
          border: 1px solid #fde68a;
          color: #92400e;
        `;
    }
  }}
`;

const TableWrapper = styled.div`
  overflow-x: auto;
`;

const HistoryTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;

  @media (min-width: 768px) {
    font-size: 0.875rem;
  }
`;

const Th = styled.th`
  text-align: left;
  padding: 0.75rem 0.5rem;
  background: #f8f9fa;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
`;

const Td = styled.td`
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
`;

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-block;
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
      default:
        return "background: #f3f4f6; color: #374151;";
    }
  }}
`;

const DetailButton = styled.button`
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.7rem;
  cursor: pointer;
  color: #374151;

  &:hover {
    background: #e5e7eb;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 0.5rem;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow: auto;
  padding: 1.5rem;
`;

const ModalTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
`;

const DuplicateList = styled.div`
  margin: 1rem 0;
  max-height: 300px;
  overflow: auto;
`;

const DuplicateItem = styled.div<{ $reason: string }>`
  padding: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;
  font-family: monospace;
  color: ${({ $reason }) =>
    $reason === "within_file" ? "#92400e" : "#dc2626"};
`;

const ErrorList = styled.div`
  margin: 1rem 0;
  max-height: 300px;
  overflow: auto;
`;

const ErrorItem = styled.div`
  padding: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;
  font-family: monospace;
  color: #dc2626;
`;

const FileInput = styled.input`
  display: none;
`;

const getStatusDetails = (
  status: string,
  importedRows: number,
  failedRows: number,
) => {
  if (status === "COMPLETED") {
    return {
      text: `All ${importedRows} bars imported successfully`,
      color: "#065f46",
      icon: "✅",
    };
  }
  if (status === "PARTIAL") {
    return {
      text: `${importedRows} imported, ${failedRows} skipped (duplicates/existing)`,
      color: "#92400e",
      icon: "⚠️",
    };
  }
  if (status === "FAILED") {
    return {
      text: `All ${failedRows} rows failed`,
      color: "#991b1b",
      icon: "❌",
    };
  }
  return { text: status, color: "#374151", icon: "⏳" };
};

const CSVImport = () => {
  const router = useRouter();
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importHistory, setImportHistory] = useState<BarImportHistory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastImportResult, setLastImportResult] =
    useState<ImportResponse | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedImport, setSelectedImport] = useState<BarImportHistory | null>(
    null,
  );
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);
  const [duplicatesToShow, setDuplicatesToShow] = useState<DuplicateInfo[]>([]);

  const getToken = (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("hoppr_token");
    }
    return null;
  };

  const stats = {
    totalImports: importHistory.length,
    totalBarsImported: importHistory.reduce(
      (sum, i) => sum + i.importedRows,
      0,
    ),
    successfulImports: importHistory.filter((i) => i.status === "COMPLETED")
      .length,
    failedImports: importHistory.filter((i) => i.status === "FAILED").length,
    partialImports: importHistory.filter((i) => i.status === "PARTIAL").length,
  };

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
    setLastImportResult(null);

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
      setLastImportResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const token = getToken();
    if (!token) {
      setError("No authentication token found. Please log in.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setSuccess(null);
    setLastImportResult(null);

    try {
      const formData = new FormData();
      formData.append("csvFile", selectedFile);

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch("/api/auth/admin/bars/import", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("hoppr_token");
        localStorage.removeItem("hoppr_user");
        throw new Error("Your session has expired. Please log in again.");
      }

      if (!response.ok) {
        throw new Error(result.error || `Import failed: ${response.status}`);
      }

      setLastImportResult(result);

      let message = "";
      if (result.status === "COMPLETED") {
        message = `✅ Successfully imported all ${result.imported} bars!`;
      } else if (result.status === "PARTIAL") {
        message = `⚠️ Imported ${result.imported} bars, skipped ${result.skipped} duplicates.`;
      } else {
        message = `❌ Failed to import ${result.skipped} bars.`;
      }
      setSuccess(message);

      fetchImportHistory();
      setSelectedFile(null);
    } catch (error) {
      console.error("Upload error:", error);
      setError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const fetchImportHistory = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) return;

      const response = await fetch("/api/auth/admin/bars/import/history", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setImportHistory(data.imports || []);
      }
    } catch (error) {
      console.error("Failed to fetch import history:", error);
    } finally {
      setLoading(false);
    }
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleViewDetails = (importItem: BarImportHistory) => {
    setSelectedImport(importItem);
    setShowDetailsModal(true);
  };

  const handleViewDuplicates = (duplicates: DuplicateInfo[]) => {
    setDuplicatesToShow(duplicates);
    setShowDuplicatesModal(true);
  };

  useEffect(() => {
    fetchImportHistory();
  }, []);

  return (
    <Container>
      <Header>
        <BackButton href="/admin/bars">← Back to Bars</BackButton>
        <Title>CSV Import</Title>
        <Subtitle>
          Bulk import bars from CSV files. View your import history below.
        </Subtitle>
      </Header>

      {/* Stats Overview */}
      <StatsGrid>
        <StatCard $color="#3b82f6">
          <StatValue>{stats.totalImports}</StatValue>
          <StatLabel>Total Imports</StatLabel>
        </StatCard>
        <StatCard $color="#10b981">
          <StatValue>{stats.totalBarsImported}</StatValue>
          <StatLabel>Bars Imported</StatLabel>
        </StatCard>
        <StatCard $color="#10b981">
          <StatValue>{stats.successfulImports}</StatValue>
          <StatLabel>Successful</StatLabel>
        </StatCard>
        <StatCard $color="#f59e0b">
          <StatValue>{stats.partialImports}</StatValue>
          <StatLabel>Partial (w/ Duplicates)</StatLabel>
        </StatCard>
        <StatCard $color="#ef4444">
          <StatValue>{stats.failedImports}</StatValue>
          <StatLabel>Failed</StatLabel>
        </StatCard>
      </StatsGrid>

      <TwoColumnLayout>
        {/* Left Column - Upload Section */}
        <div>
          <Card>
            <CardTitle>📁 Upload CSV File</CardTitle>

            <DropZone
              $isDragOver={isDragOver}
              $hasFile={!!selectedFile}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("csv-file-input")?.click()}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                {selectedFile ? "✅" : "📁"}
              </div>
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
                  <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
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

            {error && <Alert $type="error">{error}</Alert>}
            {success && (
              <Alert
                $type={
                  lastImportResult?.status === "PARTIAL" ? "warning" : "success"
                }
              >
                {success}
              </Alert>
            )}

            {/* Import Results Summary with Duplicates */}
            {lastImportResult &&
              lastImportResult.duplicates &&
              lastImportResult.duplicates.length > 0 && (
                <Alert $type="warning">
                  <strong>
                    ⚠️ Duplicates Found ({lastImportResult.duplicates.length}):
                  </strong>
                  <ul
                    style={{
                      marginTop: "0.5rem",
                      marginBottom: 0,
                      paddingLeft: "1.5rem",
                    }}
                  >
                    {lastImportResult.duplicates.slice(0, 5).map((dup, idx) => (
                      <li key={idx}>
                        Row {dup.row}: "{dup.name}" -{" "}
                        {dup.reason === "within_file"
                          ? "Duplicate within the same CSV file"
                          : "Already exists in database"}
                      </li>
                    ))}
                    {lastImportResult.duplicates.length > 5 && (
                      <li>
                        ... and {lastImportResult.duplicates.length - 5} more
                        duplicates
                      </li>
                    )}
                  </ul>
                  {lastImportResult.duplicates.length > 0 && (
                    <Button
                      $variant="secondary"
                      style={{
                        marginTop: "0.5rem",
                        padding: "0.25rem 0.5rem",
                        fontSize: "0.75rem",
                      }}
                      onClick={() =>
                        handleViewDuplicates(lastImportResult.duplicates)
                      }
                    >
                      View All {lastImportResult.duplicates.length} Duplicates
                    </Button>
                  )}
                </Alert>
              )}

            <ButtonGroup>
              <Button
                $variant="primary"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? `Uploading... ${uploadProgress}%` : "Import CSV"}
              </Button>
              {selectedFile && !isUploading && (
                <Button
                  $variant="secondary"
                  onClick={() => setSelectedFile(null)}
                >
                  Clear
                </Button>
              )}
              <a
                href="/templates/bars-import-template.csv"
                download
                style={{ textDecoration: "none" }}
              >
                <Button $variant="secondary">📥 Download Template</Button>
              </a>
            </ButtonGroup>
          </Card>

          {/* CSV Requirements */}
          <Card style={{ marginTop: "1rem" }}>
            <CardTitle>📋 CSV Format Requirements</CardTitle>
            <ul
              style={{
                margin: 0,
                paddingLeft: "1.25rem",
                color: "#6b7280",
                fontSize: "0.875rem",
              }}
            >
              <li>
                <strong>Required:</strong> name, type, address, city
              </li>
              <li>
                <strong>Bar types:</strong> PUB, CLUB, LOUNGE, COCKTAIL_BAR,
                RESTAURANT_BAR, SPORTS_BAR, KARAOKE, LIVE_MUSIC
              </li>
              <li>
                <strong>Price ranges:</strong> BUDGET, MODERATE, PREMIUM, LUXURY
              </li>
              <li>
                <strong>Arrays:</strong> Separate with commas (amenities,
                imageUrls)
              </li>
              <li>
                <strong>Operating hours:</strong> JSON format
              </li>
            </ul>
          </Card>
        </div>

        {/* Right Column - History Section */}
        <div>
          <Card>
            <CardTitle>📜 Import History</CardTitle>

            {loading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "2rem",
                  color: "#6b7280",
                }}
              >
                Loading history...
              </div>
            ) : importHistory.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "2rem",
                  color: "#6b7280",
                }}
              >
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                  📭
                </div>
                <p>No import history yet</p>
                <p style={{ fontSize: "0.875rem" }}>
                  Upload your first CSV file to get started
                </p>
              </div>
            ) : (
              <TableWrapper>
                <HistoryTable>
                  <thead>
                    <tr>
                      <Th>File Name</Th>
                      <Th>Date</Th>
                      <Th>Status</Th>
                      <Th>Imported</Th>
                      <Th>Skipped</Th>
                      <Th>Total</Th>
                      <Th></Th>
                    </tr>
                  </thead>
                  <tbody>
                    {importHistory.map((importItem) => {
                      const statusDetails = getStatusDetails(
                        importItem.status,
                        importItem.importedRows,
                        importItem.failedRows,
                      );
                      return (
                        <tr key={importItem.id}>
                          <Td
                            style={{
                              maxWidth: "200px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {importItem.fileName}
                          </Td>
                          <Td style={{ whiteSpace: "nowrap" }}>
                            {formatDate(importItem.createdAt)}
                          </Td>
                          <Td>
                            <StatusBadge $status={importItem.status}>
                              {importItem.status}
                            </StatusBadge>
                            <div
                              style={{
                                fontSize: "0.7rem",
                                color: statusDetails.color,
                                marginTop: "0.25rem",
                              }}
                            >
                              {statusDetails.icon} {statusDetails.text}
                            </div>
                          </Td>
                          <Td style={{ color: "#065f46", fontWeight: "bold" }}>
                            {importItem.importedRows}
                          </Td>
                          <Td style={{ color: "#92400e" }}>
                            {importItem.failedRows}
                          </Td>
                          <Td>{importItem.totalRows}</Td>
                          <Td>
                            {((importItem.errors &&
                              importItem.errors.length > 0) ||
                              importItem.failedRows > 0) && (
                              <DetailButton
                                onClick={() => handleViewDetails(importItem)}
                              >
                                Details
                              </DetailButton>
                            )}
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </HistoryTable>
              </TableWrapper>
            )}
          </Card>
        </div>
      </TwoColumnLayout>

      {/* Details Modal */}
      {showDetailsModal && selectedImport && (
        <ModalOverlay onClick={() => setShowDetailsModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Import Details: {selectedImport.fileName}</ModalTitle>

            <p>
              <strong>Date:</strong> {formatDate(selectedImport.createdAt)}
            </p>
            <p>
              <strong>Status:</strong> {selectedImport.status}
            </p>
            <p>
              <strong>Imported:</strong> {selectedImport.importedRows} bars
            </p>
            <p>
              <strong>Skipped:</strong> {selectedImport.failedRows} rows
            </p>
            <p>
              <strong>Total:</strong> {selectedImport.totalRows} rows
            </p>

            {selectedImport.errors && selectedImport.errors.length > 0 && (
              <>
                <h4
                  style={{
                    marginTop: "1rem",
                    marginBottom: "0.5rem",
                    color: "#dc2626",
                  }}
                >
                  Errors ({selectedImport.errors.length})
                </h4>
                <ErrorList>
                  {selectedImport.errors.slice(0, 20).map((error, idx) => (
                    <ErrorItem key={idx}>{error}</ErrorItem>
                  ))}
                  {selectedImport.errors.length > 20 && (
                    <ErrorItem>
                      ... and {selectedImport.errors.length - 20} more errors
                    </ErrorItem>
                  )}
                </ErrorList>
              </>
            )}

            <ButtonGroup
              style={{ justifyContent: "flex-end", marginTop: "1rem" }}
            >
              <Button
                $variant="primary"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </Button>
            </ButtonGroup>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Duplicates Modal */}
      {showDuplicatesModal && (
        <ModalOverlay onClick={() => setShowDuplicatesModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Duplicate Bars Found</ModalTitle>
            <p>The following bars were skipped because they already exist:</p>
            <DuplicateList>
              {duplicatesToShow.map((dup, idx) => (
                <DuplicateItem key={idx} $reason={dup.reason}>
                  Row {dup.row}: "{dup.name}" -{" "}
                  {dup.reason === "within_file"
                    ? "📁 Duplicate within the same CSV file"
                    : "💾 Already exists in database"}
                </DuplicateItem>
              ))}
            </DuplicateList>
            <ButtonGroup
              style={{ justifyContent: "flex-end", marginTop: "1rem" }}
            >
              <Button
                $variant="primary"
                onClick={() => setShowDuplicatesModal(false)}
              >
                Close
              </Button>
            </ButtonGroup>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default CSVImport;
