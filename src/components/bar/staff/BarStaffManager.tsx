// src/components/bar/staff/BarStaffManager.tsx
"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";

const Container = styled.div`
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
`;

const CreateButton = styled.button`
  background: #10b981;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #059669;
  }

  &:disabled {
    background: #6b7280;
    cursor: not-allowed;
  }
`;

const StaffGrid = styled.div`
  display: grid;
  gap: 1.5rem;
  margin-bottom: 2rem;
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
`;

const Modal = styled.div<{ $isOpen: boolean }>`
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
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 0.5rem;
  width: 90%;
  max-width: 500px;
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
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    ring: 2px solid #3b82f6;
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  background: white;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    ring: 2px solid #3b82f6;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
`;

const Button = styled.button<{ $variant?: "primary" | "secondary" }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  ${(props) =>
    props.$variant === "primary"
      ? `
    background: #3b82f6;
    color: white;

    &:hover:not(:disabled) {
      background: #2563eb;
    }

    &:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }
  `
      : `
    background: #6b7280;
    color: white;

    &:hover {
      background: #4b5563;
    }
  `}
`;

const StatusBadge = styled.div<{ $isActive: boolean }>`
  background: ${(props) => (props.$isActive ? "#dcfce7" : "#f3f4f6")};
  color: ${(props) => (props.$isActive ? "#166534" : "#6b7280")};
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  display: inline-block;
  margin-top: 0.5rem;
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

export interface ApiResponse {
  success?: boolean;
  staff?: BarStaff[];
  error?: string;
}

export interface BarStaffManagerProps {
  user: AuthenticatedUser;
  barId: string;
}

export default function BarStaffManager({ user, barId }: BarStaffManagerProps) {
  const [staff, setStaff] = useState<BarStaff[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<CreateStaffFormData>({
    name: "",
    email: "",
    role: "STAFF",
    password: "",
  });

  useEffect(() => {
    fetchBarStaff();
  }, [barId]);

  // In your BarStaffManager component - UPDATE THESE LINES:

  const fetchBarStaff = async (): Promise<void> => {
    try {
      const token = localStorage.getItem("hoppr_token");
      const response = await fetch(`/api/auth/bar/${barId}/users`, {
        // ✅ FIXED ENDPOINT
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: ApiResponse = await response.json();
        if (data.staff) {
          setStaff(data.staff);
        }
      } else {
        console.error("Failed to fetch staff");
      }
    } catch (error) {
      console.error("Failed to fetch bar staff:", error);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("hoppr_token");
      const response = await fetch(`/api/auth/bar/${barId}/users`, {
        // ✅ FIXED ENDPOINT
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const responseData: ApiResponse = await response.json();

      if (response.ok) {
        console.log("✅ Staff created successfully!");
        setIsModalOpen(false);
        setFormData({
          name: "",
          email: "",
          role: "STAFF",
          password: "",
        });
        fetchBarStaff(); // Refresh list
      } else {
        alert(`Failed: ${responseData.error}`);
      }
    } catch (error) {
      console.error("Failed to create staff:", error);
      alert("Failed to create staff member");
    } finally {
      setLoading(false);
    }
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
    return role.replace("_", " ");
  };

  return (
    <Container>
      <Header>
        <Title>Bar Staff Management</Title>
        <CreateButton onClick={() => setIsModalOpen(true)}>
          + Create Staff Account
        </CreateButton>
      </Header>

      <StaffGrid>
        {staff.map((staffMember) => (
          <StaffCard key={staffMember.id}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: "1.125rem" }}>
                {staffMember.name}
              </div>
              <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                {staffMember.email}
              </div>
              <div
                style={{
                  background: "#f3f4f6",
                  color: "#374151",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "1rem",
                  fontSize: "0.75rem",
                  display: "inline-block",
                  marginTop: "0.5rem",
                  marginRight: "0.5rem",
                }}
              >
                {formatRoleName(staffMember.role)}
              </div>
              <StatusBadge $isActive={staffMember.isActive}>
                {staffMember.isActive ? "Active" : "Inactive"}
              </StatusBadge>
            </div>
            <div>
              {staffMember.lastLogin ? (
                <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                  Last login:{" "}
                  {new Date(staffMember.lastLogin).toLocaleDateString()}
                </div>
              ) : (
                <div style={{ color: "#ef4444", fontSize: "0.875rem" }}>
                  Never logged in
                </div>
              )}
            </div>
          </StaffCard>
        ))}
      </StaffGrid>

      <Modal $isOpen={isModalOpen}>
        <ModalContent>
          <h2
            style={{
              marginBottom: "1.5rem",
              fontSize: "1.5rem",
              fontWeight: "600",
            }}
          >
            Create Staff Account
          </h2>

          <Form onSubmit={handleCreateStaff}>
            <InputGroup>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
                placeholder="Enter staff member's name"
              />
            </InputGroup>

            <InputGroup>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
                placeholder="staff@yourbar.com"
              />
            </InputGroup>

            <InputGroup>
              <Label htmlFor="role">Role</Label>
              <Select
                id="role"
                value={formData.role}
                onChange={(e) =>
                  handleInputChange("role", e.target.value as BarStaffRole)
                }
                required
              >
                <option value="MANAGER">Manager</option>
                <option value="PROMOTIONS_MANAGER">Promotions Manager</option>
                <option value="STAFF">Staff (Door/Scanner)</option>
                <option value="VIEWER">Viewer (Read-only)</option>
              </Select>
            </InputGroup>

            <InputGroup>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                required
                minLength={6}
                placeholder="Set initial password"
              />
            </InputGroup>

            <ButtonGroup>
              <Button
                type="button"
                $variant="secondary"
                onClick={() => setIsModalOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" $variant="primary" disabled={loading}>
                {loading ? "Creating..." : "Create Staff Account"}
              </Button>
            </ButtonGroup>
          </Form>
        </ModalContent>
      </Modal>
    </Container>
  );
}
