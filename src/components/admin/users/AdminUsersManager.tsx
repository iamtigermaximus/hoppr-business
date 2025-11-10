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

const UserActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;

  @media (max-width: 480px) {
    width: 100%;
    justify-content: flex-end;
    margin-top: 0.5rem;
  }
`;

const ActionButton = styled.button<{ $variant: "edit" | "delete" }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  min-height: 36px;

  ${(props) =>
    props.$variant === "edit"
      ? `
    background: #3b82f6;
    color: white;
    
    &:hover:not(:disabled) {
      background: #2563eb;
    }
  `
      : `
    background: #ef4444;
    color: white;
    
    &:hover:not(:disabled) {
      background: #dc2626;
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 480px) {
    flex: 1;
  }
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

const StatusBadge = styled.div<{ $isActive: boolean }>`
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  display: inline-block;
  margin-left: 0.5rem;

  ${(props) =>
    props.$isActive
      ? `
    background: #d1fae5;
    color: #065f46;
  `
      : `
    background: #fee2e2;
    color: #991b1b;
  `}
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

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Checkbox = styled.input`
  width: 1.25rem;
  height: 1.25rem;
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
  $variant?: "primary" | "secondary" | "danger";
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

  ${(props) => {
    switch (props.$variant) {
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

  @media (max-width: 480px) {
    min-width: 100%;
  }
`;

const DeleteConfirmModal = styled(Modal)``;

const DeleteConfirmContent = styled(ModalContent)`
  max-width: 400px;
`;

const DeleteText = styled.p`
  color: #6b7280;
  margin-bottom: 1.5rem;
  line-height: 1.5;
`;

const DeleteUserInfo = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
`;

const DeleteUserName = styled.div`
  font-weight: 600;
  color: #dc2626;
`;

const DeleteUserEmail = styled.div`
  color: #ef4444;
  font-size: 0.875rem;
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

type ModalMode = "create" | "edit";

const AdminUsersManager = ({ user }: AdminUsersManagerProps) => {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "CONTENT_MODERATOR",
    password: "",
    isActive: true,
  });

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const fetchAdminUsers = async () => {
    try {
      const token = localStorage.getItem("hoppr_token");
      const response = await fetch("/api/auth/admin/users", {
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
      const response = await fetch("/api/auth/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const responseData = await response.json();

      if (response.ok) {
        setIsModalOpen(false);
        setFormData({
          name: "",
          email: "",
          role: "CONTENT_MODERATOR",
          password: "",
          isActive: true,
        });
        fetchAdminUsers();
      } else {
        alert(`Failed: ${responseData.error}`);
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error - check console");
    } finally {
      setLoading(false);
    }
  };

  const handleEditAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setLoading(true);

    try {
      const token = localStorage.getItem("hoppr_token");
      const response = await fetch(`/api/auth/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          isActive: formData.isActive,
          ...(formData.password && { password: formData.password }),
        }),
      });

      const responseData = await response.json();

      if (response.ok) {
        setIsModalOpen(false);
        setFormData({
          name: "",
          email: "",
          role: "CONTENT_MODERATOR",
          password: "",
          isActive: true,
        });
        setSelectedUser(null);
        fetchAdminUsers();
      } else {
        alert(`Failed: ${responseData.error}`);
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error - check console");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!selectedUser) return;

    setDeleteLoading(true);

    try {
      const token = localStorage.getItem("hoppr_token");
      const response = await fetch(`/api/auth/admin/users/${selectedUser.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setIsDeleteModalOpen(false);
        setSelectedUser(null);
        fetchAdminUsers();
      } else {
        const responseData = await response.json();
        alert(`Failed: ${responseData.error}`);
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error - check console");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openCreateModal = () => {
    setModalMode("create");
    setFormData({
      name: "",
      email: "",
      role: "CONTENT_MODERATOR",
      password: "",
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (adminUser: AdminUser) => {
    setModalMode("edit");
    setSelectedUser(adminUser);
    setFormData({
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      password: "",
      isActive: adminUser.isActive,
    });
    setIsModalOpen(true);
  };

  const openDeleteModal = (adminUser: AdminUser) => {
    setSelectedUser(adminUser);
    setIsDeleteModalOpen(true);
  };

  const closeModals = () => {
    setIsModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
    setFormData({
      name: "",
      email: "",
      role: "CONTENT_MODERATOR",
      password: "",
      isActive: true,
    });
  };

  const isCurrentUser = (adminUser: AdminUser) => {
    return adminUser.id === user.id;
  };

  return (
    <Container>
      <Header>
        <Title>Admin Users Management</Title>
        <CreateButton onClick={openCreateModal}>
          + Create Admin User
        </CreateButton>
      </Header>

      <UsersGrid>
        {adminUsers.map((adminUser) => (
          <UserCard key={adminUser.id}>
            <UserInfo>
              <UserName>
                {adminUser.name}
                {isCurrentUser(adminUser) && " (You)"}
              </UserName>
              <UserEmail>{adminUser.email}</UserEmail>
              <div>
                <UserRole>{adminUser.role.replace("_", " ")}</UserRole>
                <StatusBadge $isActive={adminUser.isActive}>
                  {adminUser.isActive ? "Active" : "Inactive"}
                </StatusBadge>
              </div>
            </UserInfo>
            <UserActions>
              <ActionButton
                $variant="edit"
                onClick={() => openEditModal(adminUser)}
                disabled={loading}
              >
                Edit
              </ActionButton>
              <ActionButton
                $variant="delete"
                onClick={() => openDeleteModal(adminUser)}
                disabled={isCurrentUser(adminUser) || loading}
                title={
                  isCurrentUser(adminUser)
                    ? "Cannot delete your own account"
                    : "Delete user"
                }
              >
                Delete
              </ActionButton>
            </UserActions>
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

      {/* Create/Edit Modal */}
      <Modal $isOpen={isModalOpen}>
        <ModalContent>
          <ModalTitle>
            {modalMode === "create"
              ? "Create New Admin User"
              : "Edit Admin User"}
          </ModalTitle>

          <Form
            onSubmit={
              modalMode === "create" ? handleCreateAdmin : handleEditAdmin
            }
          >
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
                disabled={loading || modalMode === "edit"}
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
                <option value="SUPER_ADMIN">Super Admin</option>
              </Select>
            </InputGroup>

            <InputGroup>
              <Label>
                Password
                {modalMode === "edit" && (
                  <span style={{ color: "#6b7280", fontWeight: "normal" }}>
                    {" "}
                    (leave blank to keep current)
                  </span>
                )}
              </Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required={modalMode === "create"}
                minLength={6}
                disabled={loading}
              />
            </InputGroup>

            {modalMode === "edit" && (
              <CheckboxGroup>
                <Checkbox
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  disabled={loading}
                />
                <Label>Active User</Label>
              </CheckboxGroup>
            )}

            <ButtonGroup>
              <Button
                type="button"
                $variant="secondary"
                onClick={closeModals}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" $variant="primary" disabled={loading}>
                {loading
                  ? modalMode === "create"
                    ? "Creating..."
                    : "Updating..."
                  : modalMode === "create"
                  ? "Create Admin User"
                  : "Update Admin User"}
              </Button>
            </ButtonGroup>
          </Form>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal $isOpen={isDeleteModalOpen}>
        <DeleteConfirmContent>
          <ModalTitle>Delete Admin User</ModalTitle>
          <DeleteText>
            Are you sure you want to delete this admin user? This action cannot
            be undone.
          </DeleteText>

          {selectedUser && (
            <DeleteUserInfo>
              <DeleteUserName>{selectedUser.name}</DeleteUserName>
              <DeleteUserEmail>{selectedUser.email}</DeleteUserEmail>
            </DeleteUserInfo>
          )}

          <ButtonGroup>
            <Button
              type="button"
              $variant="secondary"
              onClick={closeModals}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              $variant="danger"
              onClick={handleDeleteAdmin}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete User"}
            </Button>
          </ButtonGroup>
        </DeleteConfirmContent>
      </DeleteConfirmModal>
    </Container>
  );
};

export default AdminUsersManager;
