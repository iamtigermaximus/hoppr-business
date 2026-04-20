"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import Link from "next/link";

// Styled Components (keep all your existing styled components - they're fine)
const Container = styled.div`
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  min-height: 100vh;
  background: #f8fafc;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h1`
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const Button = styled.button<{ $variant?: "primary" | "secondary" | "danger" }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;

  ${({ $variant }) => {
    switch ($variant) {
      case "primary":
        return `
          background: #3b82f6;
          color: white;
          &:hover { background: #2563eb; }
        `;
      case "danger":
        return `
          background: #ef4444;
          color: white;
          &:hover { background: #dc2626; }
        `;
      default:
        return `
          background: #10b981;
          color: white;
          &:hover { background: #059669; }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LinkButton = styled(Link)<{ $variant?: "primary" | "secondary" }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 40px;

  ${({ $variant }) =>
    $variant === "primary"
      ? `
        background: #3b82f6;
        color: white;
        &:hover { background: #2563eb; }
      `
      : `
        background: #10b981;
        color: white;
        &:hover { background: #059669; }
      `}
`;

const Controls = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const SearchInput = styled.input`
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  width: 250px;
  min-height: 40px;
  flex: 1;
  min-width: 150px;
`;

const FilterSelect = styled.select`
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  min-height: 40px;
  min-width: 120px;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const Table = styled.table`
  width: 100%;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-collapse: collapse;
  min-width: 800px;
`;

const Th = styled.th`
  text-align: left;
  padding: 1rem;
  background: #f8f9fa;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
`;

const Td = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  color: #6b7280;
  vertical-align: middle;
`;

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
  font-weight: 600;
  background: ${(props) =>
    props.$status === "VERIFIED"
      ? "#dcfce7"
      : props.$status === "CLAIMED"
        ? "#dbeafe"
        : props.$status === "SUSPENDED"
          ? "#fee2e2"
          : "#f3f4f6"};
  color: ${(props) =>
    props.$status === "VERIFIED"
      ? "#166534"
      : props.$status === "CLAIMED"
        ? "#1e40af"
        : props.$status === "SUSPENDED"
          ? "#dc2626"
          : "#6b7280"};
`;

const ActionButton = styled.button`
  background: #3b82f6;
  color: white;
  padding: 0.25rem 0.75rem;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  cursor: pointer;
  margin-right: 0.5rem;

  &:hover {
    background: #2563eb;
  }
`;

const DeleteButton = styled.button`
  background: #ef4444;
  color: white;
  padding: 0.25rem 0.75rem;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  cursor: pointer;

  &:hover {
    background: #dc2626;
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding-top: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const PageButton = styled.button<{ $active?: boolean; disabled?: boolean }>`
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  background: ${(props) => (props.$active ? "#3b82f6" : "white")};
  color: ${(props) => (props.$active ? "white" : "#374151")};
  border-radius: 0.375rem;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  margin: 0 0.25rem;
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};

  &:hover {
    background: ${(props) =>
      !props.disabled && (props.$active ? "#2563eb" : "#f3f4f6")};
  }
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;
`;

const ErrorState = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  text-align: center;
`;

const SuccessState = styled.div`
  background: #dcfce7;
  border: 1px solid #bbf7d0;
  color: #166534;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  text-align: center;
`;

// Modal for CSV Upload
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
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 1.5rem;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
`;

const FileInput = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
`;

const UploadProgress = styled.div`
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin: 1rem 0;
`;

const ProgressBar = styled.div<{ $width: number }>`
  width: ${(props) => props.$width}%;
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s;
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
`;

interface Bar {
  id: string;
  name: string;
  city: string;
  district: string | null;
  type: string;
  status: string;
  isVerified: boolean;
  isActive: boolean;
  profileViews: number;
  staffCount: number;
  promotionCount: number;
  createdAt: string;
  updatedAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Helper function to clean city name (remove postal code)
const cleanCityName = (city: string): string => {
  if (!city) return "";
  // Remove postal code like "00100 " from "00100 Helsinki"
  return city.replace(/^\d+\s+/, "").trim();
};

const BarsDatabase = () => {
  const router = useRouter();
  const [bars, setBars] = useState<Bar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");

  // CSV Upload states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const getToken = (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("hoppr_token");
    }
    return null;
  };

  const fetchBars = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();

      if (!token) {
        router.push("/admin/login");
        return;
      }

      const params = new URLSearchParams();
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      if (typeFilter) params.append("type", typeFilter);
      // Send the cleaned city name for filtering
      if (cityFilter) params.append("city", cityFilter);

      const response = await fetch(
        `/api/auth/admin/bars?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setBars(data.data || []);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0,
        }));
      } else if (response.status === 401) {
        router.push("/admin/login");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch bars");
      }
    } catch (error) {
      console.error("Error fetching bars:", error);
      setError("Failed to load bars. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append("csvFile", selectedFile);

    try {
      const token = getToken();

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percent = (event.loaded / event.total) * 100;
          setUploadProgress(percent);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200 || xhr.status === 201) {
          const response = JSON.parse(xhr.responseText);
          setSuccess(`Successfully imported ${response.imported || 0} bars!`);
          setShowUploadModal(false);
          setSelectedFile(null);
          fetchBars();
          setTimeout(() => setSuccess(null), 3000);
        } else {
          const error = JSON.parse(xhr.responseText);
          setError(error.error || "Failed to upload CSV");
        }
        setUploading(false);
      });

      xhr.addEventListener("error", () => {
        setError("Network error during upload");
        setUploading(false);
      });

      xhr.open("POST", "/api/auth/admin/bars/import");
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
    } catch (error) {
      console.error("Error uploading CSV:", error);
      setError("Failed to upload CSV file");
      setUploading(false);
    }
  };

  // ✅ FIXED: Get unique cleaned city names from bars data
  const getUniqueCities = (): string[] => {
    if (!bars || bars.length === 0) return [];
    // Clean the city names and remove duplicates
    const cleanedCities = bars
      .map((bar) => cleanCityName(bar.city))
      .filter(Boolean);
    return [...new Set(cleanedCities)].sort();
  };

  // ✅ FIXED: Get unique types from bars data (only existing types)
  const getUniqueTypes = (): string[] => {
    if (!bars || bars.length === 0) return [];
    const types = bars.map((bar) => bar.type).filter(Boolean);
    return [...new Set(types)].sort();
  };

  useEffect(() => {
    fetchBars();
  }, [pagination.page, search, statusFilter, typeFilter, cityFilter]);

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleViewBar = (barId: string) => {
    router.push(`/admin/bars/${barId}`);
  };

  const handleDeleteBar = async (barId: string, barName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${barName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`/api/auth/admin/bars/${barId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setSuccess(`Successfully deleted "${barName}"`);
        fetchBars();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const error = await response.json();
        setError(error.error || "Failed to delete bar");
      }
    } catch (error) {
      console.error("Error deleting bar:", error);
      setError("Failed to delete bar");
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  // Display cleaned city name in the table
  const displayCity = (city: string): string => {
    return cleanCityName(city);
  };

  // Reset page when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [search, statusFilter, typeFilter, cityFilter]);

  if (loading && bars.length === 0) {
    return (
      <Container>
        <LoadingState>Loading bars...</LoadingState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Bars Database</Title>
        <ActionButtons>
          <LinkButton href="/admin/bars/import" $variant="secondary">
            📁 Import CSV
          </LinkButton>
          <LinkButton href="/admin/bars/create" $variant="primary">
            ➕ Add Bar
          </LinkButton>
        </ActionButtons>
      </Header>

      {error && <ErrorState>{error}</ErrorState>}
      {success && <SuccessState>{success}</SuccessState>}

      <Controls>
        <SearchInput
          type="text"
          placeholder="Search by name, city, district..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <FilterSelect
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="VERIFIED">Verified</option>
          <option value="CLAIMED">Claimed</option>
          <option value="UNCLAIMED">Unclaimed</option>
          <option value="SUSPENDED">Suspended</option>
        </FilterSelect>
        <FilterSelect
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All Types</option>
          {getUniqueTypes().map((type) => (
            <option key={type} value={type}>
              {type.replace(/_/g, " ")}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
        >
          <option value="">All Cities</option>
          {getUniqueCities().map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </FilterSelect>
      </Controls>

      <TableWrapper>
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>City</Th>
              <Th>District</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th>Staff</Th>
              <Th>Promotions</Th>
              <Th>Views</Th>
              <Th>Created</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {bars.map((bar) => (
              <tr key={bar.id}>
                <Td>
                  <strong>{bar.name}</strong>
                </Td>
                <Td>{displayCity(bar.city)}</Td>
                <Td>{bar.district || "-"}</Td>
                <Td>{bar.type.replace(/_/g, " ")}</Td>
                <Td>
                  <StatusBadge $status={bar.status}>{bar.status}</StatusBadge>
                </Td>
                <Td>{bar.staffCount}</Td>
                <Td>{bar.promotionCount}</Td>
                <Td>{bar.profileViews.toLocaleString()}</Td>
                <Td>{formatDate(bar.createdAt)}</Td>
                <Td>
                  <ActionButton onClick={() => handleViewBar(bar.id)}>
                    View
                  </ActionButton>
                  <DeleteButton
                    onClick={() => handleDeleteBar(bar.id, bar.name)}
                  >
                    Delete
                  </DeleteButton>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableWrapper>

      {pagination.totalPages > 1 && (
        <Pagination>
          <div>
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} bars
          </div>
          <div>
            <PageButton
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </PageButton>
            {Array.from(
              { length: Math.min(5, pagination.totalPages) },
              (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                return (
                  <PageButton
                    key={pageNum}
                    $active={pagination.page === pageNum}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </PageButton>
                );
              },
            )}
            <PageButton
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
            </PageButton>
          </div>
        </Pagination>
      )}

      {/* CSV Upload Modal */}
      {showUploadModal && (
        <ModalOverlay onClick={() => !uploading && setShowUploadModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Import Bars from CSV</ModalTitle>
              <CloseButton
                onClick={() => !uploading && setShowUploadModal(false)}
              >
                ×
              </CloseButton>
            </ModalHeader>

            <FileInput
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              disabled={uploading}
            />

            {selectedFile && (
              <>
                <p>
                  <strong>Selected file:</strong> {selectedFile.name}
                </p>
                <p>
                  <strong>File size:</strong>{" "}
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </>
            )}

            {uploading && (
              <UploadProgress>
                <ProgressBar $width={uploadProgress} />
              </UploadProgress>
            )}

            <ModalButtons>
              <Button
                $variant="secondary"
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                $variant="primary"
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
              >
                {uploading ? "Uploading..." : "Import CSV"}
              </Button>
            </ModalButtons>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default BarsDatabase;
