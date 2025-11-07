// src/components/admin/users/AdminUsersManager.tsx
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

  &:hover {
    background: #059669;
  }

  @media (max-width: 480px) {
    width: 100%;
    padding: 0.875rem 1.5rem;
  }
`;

const UsersGrid = styled.div`
  display: grid;
  gap: 1.5rem;

  @media (max-width: 768px) {
    gap: 1rem;
  }

  @media (max-width: 480px) {
    gap: 0.75rem;
  }
`;

const UserCard = styled.div`
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

  @media (max-width: 768px) {
    padding: 1.25rem;
  }

  @media (max-width: 480px) {
    padding: 1rem;
    flex-direction: column;
    align-items: flex-start;
  }
`;

const UserInfo = styled.div`
  flex: 1;
  min-width: 200px;
`;

const UserName = styled.div`
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
  font-size: 1.125rem;

  @media (max-width: 480px) {
    font-size: 1rem;
  }
`;

const UserEmail = styled.div`
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  word-break: break-word;
`;

const UserRole = styled.div`
  padding: 0.25rem 0.75rem;
  background: #f3f4f6;
  color: #374151;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  display: inline-block;
`;

const UserMeta = styled.div`
  text-align: right;

  @media (max-width: 480px) {
    text-align: left;
    width: 100%;
  }
`;

const LastLogin = styled.div`
  color: #6b7280;
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
    font-size: 16px; /* Prevent zoom on iOS */
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

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
}

interface AdminUsersManagerProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: "admin";
    adminRole: string;
  };
}

const AdminUsersManager = ({ user }: AdminUsersManagerProps) => {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "CONTENT_MODERATOR",
    password: "",
  });

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const fetchAdminUsers = async () => {
    try {
      const token = localStorage.getItem("hoppr_token");
      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAdminUsers(data.users);
      }
    } catch (error) {
      console.error("Failed to fetch admin users:", error);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("hoppr_token");
      console.log("🔐 Token:", token ? "Exists" : "Missing");
      console.log("📤 Sending data:", formData);

      const response = await fetch("/api/auth/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      console.log("📥 Response status:", response.status);

      const responseData = await response.json();
      console.log("📥 Response data:", responseData);

      if (response.ok) {
        console.log("✅ Admin user created successfully!");
        setIsModalOpen(false);
        setFormData({
          name: "",
          email: "",
          role: "CONTENT_MODERATOR",
          password: "",
        });
        fetchAdminUsers();
      } else {
        console.log("❌ API Error:", responseData.error);
        alert(`Failed: ${responseData.error}`);
      }
    } catch (error) {
      console.error("❌ Network error:", error);
      alert("Network error - check console");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Header>
        <Title>Admin Users Management</Title>
        <CreateButton onClick={() => setIsModalOpen(true)}>
          + Create Admin User
        </CreateButton>
      </Header>

      <UsersGrid>
        {adminUsers.map((adminUser) => (
          <UserCard key={adminUser.id}>
            <UserInfo>
              <UserName>{adminUser.name}</UserName>
              <UserEmail>{adminUser.email}</UserEmail>
              <UserRole>{adminUser.role.replace("_", " ")}</UserRole>
            </UserInfo>
            <UserMeta>
              {adminUser.lastLogin && (
                <LastLogin>
                  Last login:{" "}
                  {new Date(adminUser.lastLogin).toLocaleDateString()}
                </LastLogin>
              )}
            </UserMeta>
          </UserCard>
        ))}
      </UsersGrid>

      <Modal $isOpen={isModalOpen}>
        <ModalContent>
          <ModalTitle>Create New Admin User</ModalTitle>

          <Form onSubmit={handleCreateAdmin}>
            <InputGroup>
              <Label>Full Name</Label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                disabled={loading}
              />
            </InputGroup>

            <InputGroup>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                disabled={loading}
              />
            </InputGroup>

            <InputGroup>
              <Label>Role</Label>
              <Select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                required
                disabled={loading}
              >
                <option value="CONTENT_MODERATOR">Content Moderator</option>
                <option value="ANALYTICS_VIEWER">Analytics Viewer</option>
                <option value="SUPPORT">Support</option>
              </Select>
            </InputGroup>

            <InputGroup>
              <Label>Password</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                minLength={6}
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
                {loading ? "Creating..." : "Create Admin User"}
              </Button>
            </ButtonGroup>
          </Form>
        </ModalContent>
      </Modal>
    </Container>
  );
};
export default AdminUsersManager;
