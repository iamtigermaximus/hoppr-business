// src/components/admin/users/AdminUsersManager.tsx
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
  justify-content: between;
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
  transition: background-color 0.2s;

  &:hover {
    background: #059669;
  }
`;

const UsersGrid = styled.div`
  display: grid;
  gap: 1.5rem;
`;

const UserCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  display: flex;
  justify-content: between;
  align-items: center;
`;

const UserInfo = styled.div`
  flex: 1;
`;

const UserName = styled.div`
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
`;

const UserEmail = styled.div`
  color: #6b7280;
  font-size: 0.875rem;
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

const Modal = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: ${(props) => (props.isOpen ? "flex" : "none")};
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
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
`;

const Button = styled.button<{ variant?: "primary" | "secondary" }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  ${(props) =>
    props.variant === "primary"
      ? `
    background: #3b82f6;
    color: white;
    
    &:hover {
      background: #2563eb;
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

export default function AdminUsersManager({ user }: AdminUsersManagerProps) {
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
            <div>
              {adminUser.lastLogin && (
                <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                  Last login:{" "}
                  {new Date(adminUser.lastLogin).toLocaleDateString()}
                </div>
              )}
            </div>
          </UserCard>
        ))}
      </UsersGrid>

      <Modal isOpen={isModalOpen}>
        <ModalContent>
          <h2
            style={{
              marginBottom: "1.5rem",
              fontSize: "1.5rem",
              fontWeight: "600",
            }}
          >
            Create New Admin User
          </h2>

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
              />
            </InputGroup>

            <ButtonGroup>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? "Creating..." : "Create Admin User"}
              </Button>
            </ButtonGroup>
          </Form>
        </ModalContent>
      </Modal>
    </Container>
  );
}
