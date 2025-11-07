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

export interface ApiResponse {
  success?: boolean;
  staff?: BarStaff[];
  error?: string;
}

export interface BarStaffManagerProps {
  user: AuthenticatedUser;
  barId: string;
}

const BarStaffManager = ({ user, barId }: BarStaffManagerProps) => {
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

  const fetchBarStaff = async (): Promise<void> => {
    try {
      const token = localStorage.getItem("hoppr_token");
      const response = await fetch(`/api/auth/bar/${barId}/users`, {
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
        fetchBarStaff();
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
            <StaffInfo>
              <StaffName>{staffMember.name}</StaffName>
              <StaffEmail>{staffMember.email}</StaffEmail>
              <RoleBadge>{formatRoleName(staffMember.role)}</RoleBadge>
              <StatusBadge $isActive={staffMember.isActive}>
                {staffMember.isActive ? "Active" : "Inactive"}
              </StatusBadge>
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
        ))}
      </StaffGrid>

      <Modal $isOpen={isModalOpen}>
        <ModalContent>
          <ModalTitle>Create Staff Account</ModalTitle>

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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
};

export default BarStaffManager;
