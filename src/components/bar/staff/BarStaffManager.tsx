// src/components/bar/staff/BarStaffManager.tsx
"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";

const Container = styled.div`
  padding: 1.5rem;
  max-width: 1000px;
  margin: 0 auto;
  width: 100%;

  @media (max-width: 768px) {
    padding: 1rem;
  }

  @media (max-width: 480px) {
    padding: 0.75rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 768px) {
    margin-bottom: 1.5rem;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
    margin-bottom: 1rem;
  }
`;

const Title = styled.h1`
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }

  @media (max-width: 480px) {
    font-size: 1.25rem;
    text-align: center;
  }
`;

const CreateButton = styled.button`
  background: #10b981;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
  min-height: 44px;

  &:hover:not(:disabled) {
    background: #059669;
  }

  &:disabled {
    background: #6b7280;
    cursor: not-allowed;
  }

  @media (max-width: 480px) {
    width: 100%;
    padding: 0.875rem 1.5rem;
  }
`;

const Toolbar = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  align-items: center;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 200px;
  padding: 0.625rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  min-height: 44px;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const FilterSelect = styled.select`
  padding: 0.625rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  min-height: 44px;
  min-width: 160px;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const SortButton = styled.button<{ $active: boolean }>`
  padding: 0.5rem 0.75rem;
  border: 1px solid ${({ $active }) => ($active ? "#3b82f6" : "#d1d5db")};
  border-radius: 0.375rem;
  background: ${({ $active }) => ($active ? "#eff6ff" : "white")};
  color: ${({ $active }) => ($active ? "#2563eb" : "#6b7280")};
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
  white-space: nowrap;

  &:hover {
    border-color: #3b82f6;
    color: #2563eb;
  }
`;

const PaginationBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const PageInfo = styled.span`
  color: #6b7280;
  font-size: 0.875rem;
`;

const PageButton = styled.button<{ $disabled?: boolean }>`
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  color: ${({ $disabled }) => ($disabled ? "#d1d5db" : "#374151")};
  font-size: 0.875rem;
  cursor: ${({ $disabled }) => ($disabled ? "default" : "pointer")};
  min-height: 44px;

  &:hover:not(:disabled) {
    background: #f9fafb;
  }

  &:disabled {
    cursor: default;
    color: #d1d5db;
  }
`;

const PageButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;

  @media (max-width: 480px) {
    width: 100%;
  }
`;

const EditButton = styled.button`
  padding: 0.375rem 0.75rem;
  border: 1px solid #3b82f6;
  border-radius: 0.375rem;
  background: white;
  color: #3b82f6;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  min-height: 36px;

  &:hover {
    background: #eff6ff;
  }
`;

const DeleteButton = styled.button`
  padding: 0.375rem 0.75rem;
  border: 1px solid #ef4444;
  border-radius: 0.375rem;
  background: white;
  color: #ef4444;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  min-height: 36px;

  &:hover {
    background: #fef2f2;
  }
`;

const CapabilitiesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.5rem;
`;

const CapabilityChip = styled.span`
  background: #f0fdf4;
  color: #166534;
  padding: 0.125rem 0.5rem;
  border-radius: 0.75rem;
  font-size: 0.7rem;
  font-weight: 500;
`;

const ConfirmOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;
  padding: 1rem;
`;

const ConfirmBox = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  width: 90%;
  max-width: 400px;
  text-align: center;
`;

const ConfirmText = styled.p`
  color: #374151;
  font-size: 0.938rem;
  margin-bottom: 1.5rem;
  line-height: 1.5;
`;

const ConfirmButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: center;
`;

const ConfirmDeleteButton = styled.button`
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 0.375rem;
  background: #ef4444;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  min-height: 44px;

  &:hover {
    background: #dc2626;
  }
`;

const ConfirmCancelButton = styled.button`
  padding: 0.625rem 1.25rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  color: #374151;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  min-height: 44px;

  &:hover {
    background: #f9fafb;
  }
`;

const StaffGrid = styled.div`
  display: grid;
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 480px) {
    gap: 0.75rem;
  }
`;

const StaffCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    padding: 1.25rem;
  }

  @media (max-width: 480px) {
    padding: 1rem;
    flex-direction: column;
    align-items: flex-start;
  }
`;

const StaffInfo = styled.div`
  flex: 1;
  min-width: 200px;
`;

const StaffName = styled.div`
  font-weight: 600;
  font-size: 1.125rem;
  color: #1f2937;
  margin-bottom: 0.25rem;

  @media (max-width: 480px) {
    font-size: 1rem;
  }
`;

const StaffEmail = styled.div`
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  word-break: break-word;
`;

const RoleBadge = styled.div`
  background: #f3f4f6;
  color: #374151;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  display: inline-block;
  margin-right: 0.5rem;
  margin-top: 0.5rem;
`;

interface StatusBadgeProps {
  $isActive: boolean;
}

const StatusBadge = styled.div<StatusBadgeProps>`
  background: ${(props) => (props.$isActive ? "#dcfce7" : "#f3f4f6")};
  color: ${(props) => (props.$isActive ? "#166534" : "#6b7280")};
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  display: inline-block;
  margin-top: 0.5rem;
`;

const StaffMeta = styled.div`
  text-align: right;

  @media (max-width: 480px) {
    text-align: left;
    width: 100%;
    border-top: 1px solid #f3f4f6;
    padding-top: 0.75rem;
  }
`;

const LastLogin = styled.div`
  color: #6b7280;
  font-size: 0.875rem;

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`;

const NeverLoggedIn = styled.div`
  color: #ef4444;
  font-size: 0.875rem;

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`;

interface ModalProps {
  $isOpen: boolean;
}

const Modal = styled.div<ModalProps>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: ${(props) => (props.$isOpen ? "flex" : "none")};
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1rem;

  @media (max-width: 480px) {
    padding: 0.5rem;
    align-items: flex-end;
  }
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 0.5rem;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;

  @media (max-width: 768px) {
    padding: 1.5rem;
  }

  @media (max-width: 480px) {
    padding: 1.25rem;
    width: 95%;
    max-height: 80vh;
    border-radius: 0.5rem 0.5rem 0 0;
  }
`;

const ModalTitle = styled.h2`
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;

  @media (max-width: 480px) {
    font-size: 1.25rem;
    margin-bottom: 1rem;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  min-height: 44px;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }

  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  background: white;
  min-height: 44px;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }

  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    flex-direction: column-reverse;
  }
`;

interface ButtonProps {
  $variant?: "primary" | "secondary";
}

const Button = styled.button<ButtonProps>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  min-height: 44px;
  flex: 1;

  ${(props) =>
    props.$variant === "primary"
      ? `
      background: #3b82f6;
      color: white;
      
      &:hover:not(:disabled) {
        background: #2563eb;
      }
    `
      : `
      background: #6b7280;
      color: white;
      
      &:hover:not(:disabled) {
        background: #4b5563;
      }
    `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 480px) {
    min-width: 100%;
  }
`;

// src/types/bar-staff.ts
export type BarStaffRole =
  | "OWNER"
  | "MANAGER"
  | "PROMOTIONS_MANAGER"
  | "STAFF"
  | "VIEWER";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: BarStaffRole;
  barId: string;
  permissions: string[];
}

export interface BarStaff {
  id: string;
  email: string;
  name: string;
  role: BarStaffRole;
  permissions: string[];
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateStaffFormData {
  name: string;
  email: string;
  role: BarStaffRole;
  password: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface RoleMeta {
  label: string;
  description: string;
  capabilities: string[];
}

export interface ApiResponse {
  success?: boolean;
  staff?: BarStaff[];
  roles?: Record<string, RoleMeta>;
  permissionDescriptions?: Record<string, string>;
  pagination?: PaginationMeta;
  error?: string;
}

export interface BarStaffManagerProps {
  user: AuthenticatedUser;
  barId: string;
}

const BarStaffManager = ({ user, barId }: BarStaffManagerProps) => {
  const [staff, setStaff] = useState<BarStaff[]>([]);
  const [roleMeta, setRoleMeta] = useState<Record<string, RoleMeta>>({});
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<BarStaff | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateStaffFormData>({
    name: "",
    email: "",
    role: "STAFF",
    password: "",
  });

  // Search / filter / sort / pagination state
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchBarStaff();
  }, [barId, search, roleFilter, sortBy, sortOrder, page]);

  const fetchBarStaff = async (): Promise<void> => {
    try {
      const token = localStorage.getItem("hoppr_token");
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortOrder) params.set("sortOrder", sortOrder);
      params.set("page", String(page));
      params.set("limit", "12");

      const query = params.toString();
      const response = await fetch(
        `/api/auth/bar/${barId}/staff${query ? `?${query}` : ""}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const data: ApiResponse = await response.json();
        if (data.staff) {
          setStaff(data.staff);
        }
        if (data.roles) {
          setRoleMeta(data.roles);
        }
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        console.error("Failed to fetch staff");
      }
    } catch (error) {
      console.error("Failed to fetch bar staff:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("hoppr_token");
      const isEdit = !!editingStaffId;
      const url = `/api/auth/bar/${barId}/staff${isEdit ? "" : ""}`;
      const method = isEdit ? "PUT" : "POST";

      const body = isEdit
        ? {
            staffId: editingStaffId,
            name: formData.name,
            role: formData.role,
            ...(formData.password && { password: formData.password }),
          }
        : {
            name: formData.name,
            email: formData.email,
            role: formData.role,
            password: formData.password,
          };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const responseData: ApiResponse = await response.json();

      if (response.ok) {
        const roleLabel =
          roleMeta[formData.role]?.label ?? formData.role.replace(/_/g, " ");
        const passwordWasReset = isEdit && formData.password;
        setSuccessMessage(
          isEdit
            ? `${formData.name}'s role updated to ${roleLabel}.${passwordWasReset ? `\n\nNew password set: ${formData.password}` : ""}`
            : `${formData.name} added as ${roleLabel}.\n\nLogin: ${formData.email}\nPassword: ${formData.password}\n\nThey can sign in at the bar login portal with these credentials.\n\nCapabilities: ${roleMeta[formData.role]?.capabilities.join(", ")}.`,
        );
        setIsModalOpen(false);
        setEditingStaffId(null);
        setFormData({
          name: "",
          email: "",
          role: "STAFF",
          password: "",
        });
        fetchBarStaff();
        // Clear success message after 6 seconds
        setTimeout(() => setSuccessMessage(null), 6000);
      } else {
        alert(`Failed: ${responseData.error}`);
      }
    } catch (error) {
      console.error("Failed to save staff:", error);
      alert("Failed to save staff member");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (): Promise<void> => {
    if (!deleteConfirm) return;
    setLoading(true);

    try {
      const token = localStorage.getItem("hoppr_token");
      const response = await fetch(
        `/api/auth/bar/${barId}/staff?staffId=${deleteConfirm.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        setSuccessMessage(`${deleteConfirm.name} has been removed.`);
        setDeleteConfirm(null);
        fetchBarStaff();
        setTimeout(() => setSuccessMessage(null), 6000);
      } else {
        const data = await response.json();
        alert(`Failed: ${data.error}`);
      }
    } catch (error) {
      console.error("Failed to delete staff:", error);
      alert("Failed to delete staff member");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (staffMember: BarStaff) => {
    setEditingStaffId(staffMember.id);
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      role: staffMember.role,
      password: "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStaffId(null);
    setFormData({
      name: "",
      email: "",
      role: "STAFF",
      password: "",
    });
  };

  const handleInputChange = (
    field: keyof CreateStaffFormData,
    value: string
  ): void => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatRoleName = (role: BarStaffRole): string => {
    return roleMeta[role]?.label ?? role.replace(/_/g, " ");
  };

  return (
    <Container>
      {successMessage && (
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            color: "#166534",
            padding: "1rem",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            marginBottom: "1rem",
            whiteSpace: "pre-line",
            lineHeight: 1.6,
          }}
        >
          {successMessage}
        </div>
      )}

      <Header>
        <Title>Bar Staff Management</Title>
        <CreateButton onClick={() => setIsModalOpen(true)}>
          + Create Staff Account
        </CreateButton>
      </Header>

      <Toolbar>
        <SearchInput
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <FilterSelect
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All roles</option>
          <option value="OWNER">Owner</option>
          <option value="MANAGER">Manager</option>
          <option value="PROMOTIONS_MANAGER">Promotions Manager</option>
          <option value="STAFF">Staff</option>
          <option value="VIEWER">Viewer</option>
        </FilterSelect>
        <SortButton
          $active={sortBy === "createdAt"}
          onClick={() => {
            setSortBy("createdAt");
            setSortOrder(sortOrder === "desc" ? "asc" : "desc");
            setPage(1);
          }}
        >
          Date {sortBy === "createdAt" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
        </SortButton>
        <SortButton
          $active={sortBy === "name"}
          onClick={() => {
            setSortBy("name");
            setSortOrder(sortOrder === "desc" ? "asc" : "desc");
            setPage(1);
          }}
        >
          Name {sortBy === "name" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
        </SortButton>
      </Toolbar>

      <StaffGrid>
        {staff.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "3rem 1rem",
              color: "#9ca3af",
              fontSize: "0.875rem",
            }}
          >
            {search || roleFilter
              ? "No staff match your filters."
              : "No staff members yet. Create your first staff account above."}
          </div>
        ) : (
          staff.map((staffMember) => {
            const isOwner = user.role === "OWNER";
            const isManager = user.role === "MANAGER";
            const canManage = isOwner || isManager;
            const capabilities =
              roleMeta[staffMember.role]?.capabilities ?? [];

            return (
              <StaffCard key={staffMember.id}>
                <StaffInfo>
                  <StaffName>{staffMember.name}</StaffName>
                  <StaffEmail>{staffMember.email}</StaffEmail>
                  <RoleBadge title={roleMeta[staffMember.role]?.description}>
                    {formatRoleName(staffMember.role)}
                  </RoleBadge>
                  <StatusBadge $isActive={staffMember.isActive}>
                    {staffMember.isActive ? "Active" : "Inactive"}
                  </StatusBadge>
                  {capabilities.length > 0 && (
                    <CapabilitiesList>
                      {capabilities.map((cap) => (
                        <CapabilityChip key={cap}>{cap}</CapabilityChip>
                      ))}
                    </CapabilitiesList>
                  )}
                  {canManage && (
                    <ActionButtons>
                      <EditButton
                        onClick={() => openEditModal(staffMember)}
                      >
                        Edit
                      </EditButton>
                      <DeleteButton
                        onClick={() => setDeleteConfirm(staffMember)}
                      >
                        Remove
                      </DeleteButton>
                    </ActionButtons>
                  )}
                </StaffInfo>
                <StaffMeta>
                  {staffMember.lastLogin ? (
                    <LastLogin>
                      Last login:{" "}
                      {new Date(staffMember.lastLogin).toLocaleDateString()}
                    </LastLogin>
                  ) : (
                    <NeverLoggedIn>Never logged in</NeverLoggedIn>
                  )}
                </StaffMeta>
              </StaffCard>
            );
          })
        )}
      </StaffGrid>

      {pagination.total > 0 && (
        <PaginationBar>
          <PageInfo>
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} staff
          </PageInfo>
          <PageButtonGroup>
            <PageButton
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </PageButton>
            <PageInfo>
              Page {pagination.page} of {pagination.pages || 1}
            </PageInfo>
            <PageButton
              disabled={pagination.page >= pagination.pages}
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            >
              Next
            </PageButton>
          </PageButtonGroup>
        </PaginationBar>
      )}

      <Modal $isOpen={isModalOpen}>
        <ModalContent>
          <ModalTitle>
            {editingStaffId ? "Edit Staff Member" : "Create Staff Account"}
          </ModalTitle>

          <Form onSubmit={handleSubmit}>
            <InputGroup>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
                placeholder="Enter staff member's name"
                disabled={loading}
              />
            </InputGroup>

            {!editingStaffId && (
              <InputGroup>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  placeholder="staff@yourbar.com"
                  disabled={loading}
                />
              </InputGroup>
            )}

            <InputGroup>
              <Label htmlFor="role">
                Role
                {formData.role &&
                  roleMeta[formData.role]?.description && (
                    <span
                      style={{
                        fontWeight: 400,
                        color: "#6b7280",
                        fontSize: "0.75rem",
                        marginLeft: "0.5rem",
                      }}
                    >
                      — {roleMeta[formData.role].description}
                    </span>
                  )}
              </Label>
              <Select
                id="role"
                value={formData.role}
                onChange={(e) =>
                  handleInputChange("role", e.target.value as BarStaffRole)
                }
                required
                disabled={loading}
              >
                {user.role === "OWNER" && (
                  <option value="OWNER">Owner — Full control</option>
                )}
                <option value="MANAGER">Manager — Day-to-day operations</option>
                <option value="PROMOTIONS_MANAGER">
                  Promotions Manager — Marketing only
                </option>
                <option value="STAFF">Staff — Door/Scanner</option>
                <option value="VIEWER">Viewer — Read-only</option>
              </Select>
            </InputGroup>

            {!editingStaffId && (
              <InputGroup>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  required
                  minLength={6}
                  placeholder="Set initial password"
                  disabled={loading}
                />
              </InputGroup>
            )}

            {editingStaffId && (
              <InputGroup>
                <Label htmlFor="password">
                  Reset Password{" "}
                  <span style={{ fontWeight: 400, color: "#9ca3af" }}>
                    (leave blank to keep current)
                  </span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  minLength={6}
                  placeholder="Enter new password to reset"
                  disabled={loading}
                />
              </InputGroup>
            )}

            <ButtonGroup>
              <Button
                type="button"
                $variant="secondary"
                onClick={closeModal}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" $variant="primary" disabled={loading}>
                {loading
                  ? editingStaffId
                    ? "Saving..."
                    : "Creating..."
                  : editingStaffId
                    ? "Save Changes"
                    : "Create Staff Account"}
              </Button>
            </ButtonGroup>
          </Form>
        </ModalContent>
      </Modal>

      {deleteConfirm && (
        <ConfirmOverlay onClick={() => setDeleteConfirm(null)}>
          <ConfirmBox onClick={(e) => e.stopPropagation()}>
            <ConfirmText>
              Remove <strong>{deleteConfirm.name}</strong> (
              {deleteConfirm.email}) from this bar? This action cannot be undone.
            </ConfirmText>
            <ConfirmButtons>
              <ConfirmCancelButton onClick={() => setDeleteConfirm(null)}>
                Cancel
              </ConfirmCancelButton>
              <ConfirmDeleteButton
                onClick={handleDeleteStaff}
                disabled={loading}
              >
                {loading ? "Removing..." : "Yes, Remove"}
              </ConfirmDeleteButton>
            </ConfirmButtons>
          </ConfirmBox>
        </ConfirmOverlay>
      )}
    </Container>
  );
};

export default BarStaffManager;
